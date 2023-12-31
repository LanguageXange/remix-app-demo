import { Form, Link, useActionData } from "@remix-run/react";
import ReactModal from "react-modal";
import { Button } from "~/components/Button";
import { XIcon } from "~/components/Icon";
import { IconInput } from "~/components/Input";
import { classNames } from "~/utils/misc";
import { useRecipeContext } from "./app.recipes.$recipeid";
import { json, type ActionFunction, redirect } from "@remix-run/node";
import { canChangeRecipe } from "~/utils/auth.server";
import db from "~/db.server";
import { z } from "zod";
import { validateform } from "~/utils/validation";
import { ErrorMessage } from "~/components/ErrorMessage";

if (typeof window !== "undefined") {
  ReactModal.setAppElement("body");
}

const updateMealPlanSchema = z.object({
  mealPlanMultiplier: z.preprocess(
    (value) => parseInt(String(value)),
    z.number().min(1)
  ),
});

// action
export const action: ActionFunction = async ({ request, params }) => {
  const recipeId = String(params.recipeid);
  await canChangeRecipe(request, recipeId);

  const formData = await request.formData();
  const btnAction = formData.get("_action");
  switch (btnAction) {
    case "removeFromMealPlan":
      await db.myRecipe.update({
        where: { id: recipeId },
        data: { mealPlanMultiplier: null },
      });
      return redirect("..");
    case "updateMealPlan":
      return validateform(
        formData,
        updateMealPlanSchema,
        async ({ mealPlanMultiplier }) => {
          await db.myRecipe.update({
            where: { id: recipeId },
            data: { mealPlanMultiplier },
          });
          return redirect("..");
        },
        (errors) => json({ errors }, { status: 400 })
      );
    default:
      return null;
  }
};

export default function MealPlan() {
  const actionData = useActionData();
  const { recipeName, mealPlanMultiplier } = useRecipeContext();

  return (
    <ReactModal
      isOpen
      className={classNames(
        "m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]",
        "md:h-fit lg:w-1/2 md:mx-auto md:mt-24"
      )}
    >
      <div className="p-4 rounded-md bg-white shadow-md">
        <div className="flex justify-between mb-8">
          <h1 className="text-lg font-bold">Update Meal Plan</h1>
          <Link to=".." replace>
            <XIcon />
          </Link>
        </div>
        <Form method="post" reloadDocument>
          <h2 className="mb-2">{recipeName}</h2>
          <IconInput
            icon={<XIcon />}
            defaultValue={mealPlanMultiplier ?? 1}
            type="number"
            autoComplete="off"
            name="mealPlanMultiplier"
          />

          <ErrorMessage>{actionData?.errors?.mealPlanMultiplier}</ErrorMessage>
          <div className="flex justify-end gap-4 mt-8">
            {mealPlanMultiplier !== null ? (
              <Button
                name="_action"
                value="removeFromMealPlan"
                otherClass="bg-btn-danger hover:bg-btn-danger-light"
              >
                Remove from Meal Plan
              </Button>
            ) : null}
            <Button
              name="_action"
              value="updateMealPlan"
              otherClass="bg-btn-primary hover:bg-btn-primary-light"
            >
              Save
            </Button>
          </div>
        </Form>
      </div>
    </ReactModal>
  );
}
