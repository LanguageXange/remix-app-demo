import {
  type ActionFunction,
  json,
  type LoaderFunction,
  redirect,
  unstable_parseMultipartFormData,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  isRouteErrorResponse,
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useRouteError,
} from "@remix-run/react";
import { Fragment, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { BoxIcon, DeleteIcon, SaveIcon, TimeIcon } from "~/components/Icon";
import { GeneralInput } from "~/components/Input";

import db from "~/db.server";
import { handleDelete } from "~/models/utils";
import { canChangeRecipe, requireLoggedInUser } from "~/utils/auth.server";
import {
  classNames,
  useDebouncedFunction,
  useServerLayoutEffect,
} from "~/utils/misc";
import { validateform } from "~/utils/validation";

const ingreAmt = z.string();
const ingreId = z.string().min(1, "id is missing");
const ingreName = z.string().min(1, "ingredient name cannot be blank");
const saveIngredientAmtSchema = z.object({
  amount: ingreAmt,
  id: ingreId,
});

const saveIngredientNameSchema = z.object({
  name: ingreName,
  id: ingreId,
});
const saveRecipeNameSchema = z.object({
  recipeName: z.string().min(1, "recipe name cannot be blank"),
});
const saveTotalTimeSchema = z.object({
  totalTime: z.string().min(1, "total time cannot be blank"),
});

const saveInstructionsSchema = z.object({
  instructions: z.string().min(1, "instructions cannot be blank"),
});

const saveRecipeSchema = z
  .object({
    imageUrl: z.string().optional(),
    ingredientIds: z.array(ingreId).optional(),
    ingredientAmounts: z.array(ingreAmt).optional(),
    ingredientNames: z.array(ingreName).optional(),
  })
  .and(saveRecipeNameSchema) // to share schema
  .and(saveTotalTimeSchema) // to share schema
  .and(saveInstructionsSchema) // to share schema
  .refine(
    (data) =>
      data.ingredientIds?.length === data.ingredientAmounts?.length &&
      data.ingredientIds?.length === data.ingredientNames?.length,
    { message: "Ingredient arrays must all be the same length" }
  );

// use refine to verify that the three ingredient lists are all the same length otherwise someone could remove the element from the DOM and submit the form - potentially saving invalid ingredients

const createIngredientSchema = z.object({
  newIngredientAmt: z.string().nullable(),
  newIngredientName: z.string().min(1, "name cannot be blank"),
});

export const action: ActionFunction = async ({ request, params }) => {
  const recipeId = String(params.recipeid);
  await canChangeRecipe(request, recipeId);

  let formData;
  if (request.headers.get("Content-type")?.includes("multipart/form-data")) {
    const uploadHandler = unstable_composeUploadHandlers(
      unstable_createFileUploadHandler({
        maxPartSize: 5_000_000,
        directory: "public/images", // image saved to public/images folder
      }),
      // parse everything else into memory
      unstable_createMemoryUploadHandler()
    );
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const recipeImage = formData.get("recipeImage") as File;
    if (recipeImage.size !== 0) {
      formData.set("imageUrl", `/images/${recipeImage.name}`);
    }
  } else {
    formData = await request.formData();
  }

  const btnAction = formData.get("_action");

  // e.g. deleteIngredient.1
  if (typeof btnAction === "string" && btnAction.includes("deleteIngredient")) {
    const ingredientId = btnAction.split(".")[1];
    return handleDelete(() =>
      db.ingredient.delete({
        where: {
          id: ingredientId,
        },
      })
    );
  }
  switch (btnAction) {
    case "saveRecipeName":
      return validateform(
        formData,
        saveRecipeNameSchema,
        (data) =>
          db.myRecipe.update({
            where: { id: recipeId },
            data: { name: data.recipeName },
          }),
        (errors) => json({ errors }, { status: 400 })
      );

    case "saveTotalTime":
      return validateform(
        formData,
        saveTotalTimeSchema,
        (data) =>
          db.myRecipe.update({
            where: { id: recipeId },
            data: { totalTime: data.totalTime },
          }),
        (errors) => json({ errors }, { status: 400 })
      );

    case "saveInstructions":
      return validateform(
        formData,
        saveInstructionsSchema,
        (data) =>
          db.myRecipe.update({
            where: { id: recipeId },
            data: { instructions: data.instructions },
          }),
        (errors) => json({ errors }, { status: 400 })
      );

    case "saveRecipe":
      // save recipe
      return validateform(
        formData,
        saveRecipeSchema,
        (data) => {
          // update db
          return db.myRecipe.update({
            where: {
              id: recipeId,
            },
            data: {
              imageUrl: data.imageUrl, // optional
              name: data.recipeName,
              totalTime: data.totalTime,
              instructions: data.instructions,
              ingredients: {
                updateMany: data.ingredientIds?.map((id, index) => ({
                  where: { id },
                  data: {
                    amount: data.ingredientAmounts?.[index],
                    name: data.ingredientNames?.[index],
                  },
                })),
              },
            },
          });
        },
        (errors) => json({ errors }, { status: 400 })
      );
    case "deleteRecipe": {
      await handleDelete(() =>
        db.myRecipe.delete({
          where: {
            id: recipeId,
          },
        })
      );
      return redirect("/app/recipes");
    }

    case "saveIngredientName":
      return validateform(
        formData,
        saveIngredientNameSchema,
        ({ id, name }) =>
          db.ingredient.update({ where: { id }, data: { name } }),
        (errors) => json({ errors }, { status: 400 })
      );

    case "saveIngredientAmount":
      return validateform(
        formData,
        saveIngredientAmtSchema,
        ({ id, amount }) =>
          db.ingredient.update({ where: { id }, data: { amount } }),
        (errors) => json({ errors }, { status: 400 })
      );

    case "createIngredient":
      return validateform(
        formData,
        createIngredientSchema,
        ({ newIngredientAmt, newIngredientName }) => {
          return db.ingredient.create({
            data: {
              recipeId,
              amount: newIngredientAmt || "",
              name: newIngredientName,
            },
          });
        },
        (errors) => json({ errors }, { status: 400 })
      );
    default:
      return null;
  }
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireLoggedInUser(request);
  const currentRecipe = await db.myRecipe.findUnique({
    where: { id: params.recipeid },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
  if (currentRecipe === null) {
    throw json({ message: "recipe does not exist" }, { status: 404 });
  }
  if (user.id !== currentRecipe?.userId) {
    throw json(
      { message: "You are not authorized to view this recipe" },
      { status: 401 }
    );
  }
  return json(
    { currentRecipe },
    { headers: { "Cache-Control": "mage-age=10" } } // this tells the browser to cache the result for 10 seconds
  );
};

export function useRecipeContext() {
  return useOutletContext<{
    recipeName?: string;
    mealPlanMultiplier?: number | null;
  }>();
}

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const saveNameFetcher = useFetcher();
  const saveTotalTimeFetcher = useFetcher();
  const saveInstructionsFetcher = useFetcher();
  const createIngredientFetcher = useFetcher();

  const newIngreAmountRef = useRef<HTMLInputElement>(null);

  const { addIngredient, renderIngredients } = useOptimisticIngredients(
    data.currentRecipe.ingredients,
    createIngredientFetcher.state
  );

  const [ingredientFrom, setIngredientForm] = useState({
    amount: "",
    name: "",
  });

  const createIngredient = () => {
    addIngredient(ingredientFrom.amount, ingredientFrom.name);
    createIngredientFetcher.submit(
      {
        _action: "createIngredient",
        newIngredientName: ingredientFrom.name,
        newIngredientAmt: ingredientFrom.amount,
      },
      {
        method: "post",
      }
    );

    setIngredientForm({ amount: "", name: "" });
    newIngreAmountRef.current?.focus();
  };

  // save recipe name as user types - wrapped with debounce function to avoid too many requests
  const saveRecipeName = useDebouncedFunction(
    (name: string) =>
      saveNameFetcher.submit(
        {
          _action: "saveRecipeName",
          recipeName: name,
        },
        {
          method: "post",
        }
      ),
    700
  );

  const saveTotalTime = useDebouncedFunction(
    (totalTime: string) =>
      saveTotalTimeFetcher.submit(
        {
          _action: "saveTotalTime",
          totalTime,
        },
        {
          method: "post",
        }
      ),
    700
  );

  const saveInstructions = useDebouncedFunction(
    (instructions: string) =>
      saveInstructionsFetcher.submit(
        {
          _action: "saveInstructions",
          instructions,
        },
        {
          method: "post",
        }
      ),
    700
  );

  return (
    <>
      {" "}
      <Outlet
        context={{
          recipeName: data.currentRecipe?.name,
          mealPlanMultiplier: data.currentRecipe?.mealPlanMultiplier,
        }}
      />
      <Form method="post" encType="multipart/form-data">
        <button name="_action" value="saveRecipe" className="hidden" />

        <div className="flex mb-2">
          <Link
            to="mealplan"
            className={classNames(
              "flex flex-col justify-center",
              data.currentRecipe?.mealPlanMultiplier !== null
                ? "text-orange-300"
                : ""
            )}
            replace
          >
            <BoxIcon />
          </Link>

          <div className="ml-2 flex-grow">
            <GeneralInput
              key={data.currentRecipe?.id}
              defaultValue={data.currentRecipe?.name}
              placeholder="Recipe Name..."
              autoComplete="off"
              name="recipeName"
              error={actionData?.errors?.recipeName}
              onChange={(e) => saveRecipeName(e.target.value)}
            />

            <ErrorMessage>
              {saveNameFetcher?.data?.errors?.recipeName ||
                actionData?.errors?.recipeName}
            </ErrorMessage>
          </div>
        </div>
        <div className="flex">
          <TimeIcon />

          <div className="ml-2 flex-grow">
            <GeneralInput
              key={data.currentRecipe?.id}
              placeholder="Cooking Time"
              autoComplete="off"
              name="totalTime"
              defaultValue={data.currentRecipe?.totalTime}
              onChange={(e) => saveTotalTime(e.target.value)}
            />
          </div>
          <ErrorMessage>
            {saveTotalTimeFetcher?.data?.errors?.totalTime ||
              actionData?.errors?.totalTime}
          </ErrorMessage>
        </div>

        <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
          <h2 className="font-bold text-sm pb-1"> Amount </h2>
          <h2 className="font-bold text-sm pb-1"> Name </h2>
          <div></div>

          {renderIngredients.map((ingredient, idx) => (
            <IngredientRow
              key={ingredient.id}
              id={ingredient.id}
              amount={ingredient.amount}
              name={ingredient.name}
              amountError={actionData?.errors?.[`ingredientAmounts.${idx}`]}
              nameError={actionData?.errors?.[`ingredientNames.${idx}`]}
              isOptimistic={ingredient.isOptimistic}
            />
          ))}

          <div>
            <GeneralInput
              ref={newIngreAmountRef}
              autoComplete="off"
              name="newIngredientAmt"
              className="border-2 border-b-gray-200 px-2"
              placeholder="ingredient amount..."
              value={ingredientFrom.amount}
              onChange={(e) =>
                setIngredientForm({ ...ingredientFrom, amount: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // default is save the recipe
                  createIngredient();
                }
              }}
            />
            <ErrorMessage>
              {createIngredientFetcher?.data?.errors?.newIngredientAmt ??
                actionData?.errors?.newIngredientAmt}
            </ErrorMessage>
          </div>

          <div>
            <GeneralInput
              autoComplete="off"
              name="newIngredientName"
              className="border-2 border-b-gray-200 px-2"
              placeholder="ingredient name..."
              value={ingredientFrom.name}
              onChange={(e) =>
                setIngredientForm({ ...ingredientFrom, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // default is save the recipe
                  createIngredient();
                }
              }}
            />
            <ErrorMessage>
              {" "}
              {createIngredientFetcher?.data?.errors?.newIngredientName ??
                actionData?.errors?.newIngredientName}
            </ErrorMessage>
          </div>
          <button
            name="_action"
            value="createIngredient"
            onClick={(e) => {
              e.preventDefault(); // prevent full page refresh
              createIngredient();
            }}
          >
            <SaveIcon />
          </button>
        </div>
        <label
          htmlFor="instructions"
          className="block font-bold text-sm pb-2 w-fit"
        >
          Instructions
        </label>
        <textarea
          key={data.currentRecipe?.id}
          id="instructions"
          name="instructions"
          placeholder="Cooking Instructions go here"
          defaultValue={data.currentRecipe?.instructions}
          className={classNames(
            "w-full h-56 rounded-md outline-none border-2 p-2",
            "focus:border-blue-300"
          )}
          onChange={(e) => saveInstructions(e.target.value)}
        />

        <ErrorMessage>
          {" "}
          {saveInstructionsFetcher?.data?.errors?.instructions ||
            actionData?.errors?.instructions}{" "}
        </ErrorMessage>
        <label
          htmlFor="recipeImage"
          className="block font-bold text-sm pb-2 w-fit mt-4"
        >
          Upload Recipe Image
        </label>
        <input
          id="recipeImage"
          type="file"
          name="recipeImage"
          accept="image/png, image/jpeg"
          key={`${data.currentRecipe?.id}.image`}
        />

        <hr className="my-4 " />
        <div className="flex justify-between">
          <Button
            otherClass="bg-red-500 hover:bg-red-400"
            name="_action"
            value="deleteRecipe"
            onClick={(e) => {
              if (!confirm("are you sure you want to delete this recipe?")) {
                e.preventDefault();
              }
            }}
          >
            Delete This Recipe
          </Button>
          <Button
            otherClass="bg-blue-500 hover:bg-blue-400"
            name="_action"
            value="saveRecipe"
          >
            Save This Recipe
          </Button>
        </div>
      </Form>
    </>
  );
}

type IngredientrowProps = {
  id: string;
  amount: string | null;
  amountError?: string;
  name: string;
  nameError?: string;
  isOptimistic: boolean;
};

function IngredientRow({
  id,
  amount,
  amountError,
  name,
  nameError,
  isOptimistic,
}: IngredientrowProps) {
  const saveNameFetcher = useFetcher();
  const saveAmountFetcher = useFetcher();

  const deleteIngredientFetcher = useFetcher();
  //const isDeleteingIngredient = !!deleteIngredientFetcher.formData;
  const isDeleteingIngredient = deleteIngredientFetcher.state !== "idle";

  const saveIngredientName = useDebouncedFunction(
    (name: string) =>
      saveNameFetcher.submit(
        {
          _action: "saveIngredientName",
          name,
          id, // so that we know which ingredient to save
        },
        {
          method: "post",
        }
      ),
    700
  );

  const saveIngredientAmount = useDebouncedFunction(
    (amount: string) =>
      saveAmountFetcher.submit(
        {
          _action: "saveIngredientAmount",
          amount,
          id, // so that we know which ingredient to save
        },
        {
          method: "post",
        }
      ),
    700
  );

  // optimistically delete ingredient
  return isDeleteingIngredient ? null : (
    <Fragment>
      <input type="hidden" name="ingredientIds[]" value={id} />

      <div>
        <GeneralInput
          autoComplete="off"
          name="ingredientAmounts[]"
          defaultValue={amount ?? ""}
          onChange={(e) => saveIngredientAmount(e.target.value)}
          disabled={isOptimistic}
          otherClass={isOptimistic ? "cursor-not-allowed" : "cursor-default"}
        />
        <ErrorMessage>
          {saveAmountFetcher.data?.errors?.amount || amountError}
        </ErrorMessage>
      </div>

      <div>
        <GeneralInput
          autoComplete="off"
          name="ingredientNames[]"
          defaultValue={name}
          onChange={(e) => saveIngredientName(e.target.value)}
          disabled={isOptimistic}
          otherClass={isOptimistic ? "cursor-not-allowed" : "cursor-default"}
        />
        <ErrorMessage>
          {saveNameFetcher.data?.errors?.name || nameError}
        </ErrorMessage>
      </div>

      <button
        name="_action"
        value={`deleteIngredient.${id}`}
        onClick={(e) => {
          e.preventDefault();
          deleteIngredientFetcher.submit(
            {
              _action: `deleteIngredient.${id}`,
            },
            { method: "post" }
          );
        }}
      >
        <DeleteIcon />
      </button>
    </Fragment>
  );
}

// Optimistically rendering ingredients
type RenderIngredient = {
  id: string;
  name: string;
  amount: string;
  isOptimistic?: boolean;
};

function useOptimisticIngredients(
  savedIngredients: RenderIngredient[],
  createIngredientState: "idle" | "submitting" | "loading"
) {
  const [optimisticIngredient, setOptimisticIngredient] = useState<
    Array<RenderIngredient>
  >([]);
  const renderIngredients = [...savedIngredients, ...optimisticIngredient];

  useServerLayoutEffect(() => {
    if (createIngredientState === "idle") {
      setOptimisticIngredient([]);
    }
  }, [createIngredientState]);

  const addIngredient = (amount: string, name: string) => {
    setOptimisticIngredient((ingredients) => [
      ...ingredients,
      { id: createItemId(), name, isOptimistic: true, amount },
    ]);
  };

  return { addIngredient, renderIngredients };
}

function createItemId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}

// Error Boundary
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="bg-red-500 text-white rounded-md p-4 w-fit">
      {isRouteErrorResponse(error) ? (
        <>
          {" "}
          <h2 className="mb-2">
            {error.status} - {error.statusText}
          </h2>
          <p>{error.data.message}</p>
        </>
      ) : (
        <>
          <h2 className="mb-2">Ooops! An unexpected error occurred.</h2>
        </>
      )}
    </div>
  );
}
