import {
  type ActionFunction,
  json,
  type LoaderFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Fragment } from "react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { DeleteIcon, EditIcon, TimeIcon } from "~/components/Icon";
import { GeneralInput } from "~/components/Input";

import db from "~/db.server";
import { classNames } from "~/utils/misc";
import { validateform } from "~/utils/validation";

const saveRecipeSchema = z.object({
  recipeName: z.string().min(1, "recipe name cannot be blank"),
  totalTime: z.string().min(1, "total time cannot be blank"),
  instructions: z.string().min(1, "instructions cannot be blank"),
});
export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const btnAction = formData.get("_action");
  switch (btnAction) {
    case "saveRecipe":
      // save recipe
      return validateform(
        formData,
        saveRecipeSchema,
        (data) => {
          // update db
          return db.myRecipe.update({
            where: {
              id: params.recipeid,
            },
            data: {
              name: data.recipeName,
              totalTime: data.totalTime,
              instructions: data.instructions,
            },
          });
        },
        (errors) => json({ errors }, { status: 400 })
      );
    case "deleteRecipe":
      return null;

    default:
      return null;
  }
};

export const loader: LoaderFunction = async ({ params }) => {
  const currentRecipe = await db.myRecipe.findUnique({
    where: { id: params.recipeid },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
      },
    },
  });
  return json(
    { currentRecipe },
    { headers: { "Cache-Control": "mage-age=10" } } // this tells the browser to cache the result for 10 seconds
  );
};

export default function RecipeDetail() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div className="mb-2">
        <GeneralInput
          key={data.currentRecipe?.id}
          defaultValue={data.currentRecipe?.name}
          placeholder="Recipe Name..."
          autoComplete="off"
          name="recipeName"
        />
      </div>

      <ErrorMessage>{actionData?.errors?.recipeName}</ErrorMessage>

      <div className="flex">
        <TimeIcon />

        <div className="ml-2 flex-grow">
          <GeneralInput
            key={data.currentRecipe?.id}
            placeholder="Cooking Time"
            autoComplete="off"
            name="totalTime"
            defaultValue={data.currentRecipe?.totalTime}
          />
        </div>
      </div>

      <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
        <h2 className="font-bold text-sm pb-1"> Amount </h2>
        <h2 className="font-bold text-sm pb-1"> Name </h2>
        <div></div>

        {data.currentRecipe?.ingredients.map((ingredient) => (
          <Fragment key={ingredient.id}>
            <div>
              <GeneralInput
                autoComplete="off"
                name="ingredientAmount"
                defaultValue={ingredient.amount ?? ""}
              />
              <ErrorMessage>test error</ErrorMessage>
            </div>

            <div>
              <GeneralInput
                autoComplete="off"
                name="ingredientName"
                defaultValue={ingredient.name}
              />
              <ErrorMessage>test error</ErrorMessage>
            </div>

            <button name="_action" value="deleteIngredient">
              <DeleteIcon />
            </button>
          </Fragment>
        ))}
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
      ></textarea>
      <hr className="my-4 " />
      <div className="flex justify-between">
        <Button
          otherClass="bg-red-500 hover:bg-red-400"
          name="_action"
          value="deleteRecipe"
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
  );
}
