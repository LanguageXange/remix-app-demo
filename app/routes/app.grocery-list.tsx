import {
  type ActionFunction,
  json,
  type LoaderFunction,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { SolidCheckIcon } from "~/components/Icon";
import db from "~/db.server";
import { requireLoggedInUser } from "~/utils/auth.server";
import { validateform } from "~/utils/validation";

type GroceryListItemType = {
  id: string;
  name: string;
  usedBy: Array<{
    id: string;
    amount: string | null;
    recipeName: string;
    multiplier: number;
  }>;
};

function isMatch(ingredientName: string, pantryItemName: string): boolean {
  return ingredientName.toLowerCase() === pantryItemName.toLowerCase();
}

const checkoffSchema = z.object({
  groceryName: z.string(),
});

function getGroceryShelfName() {
  const date = new Date().toLocaleDateString("en-us", {
    month: "short",
    day: "numeric",
  });
  return `Grocery List: ${date}`;
}

export const action: ActionFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();
  const btnAction = formData.get("_action");
  switch (btnAction) {
    case "checkOffItem":
      return validateform(
        formData,
        checkoffSchema,
        async ({ groceryName }) => {
          const shelfName = getGroceryShelfName();
          let groceryShelf = await db.pantryShelf.findFirst({
            where: { userId: user.id, name: shelfName },
          });
          // if not exist we can create a new shelf
          if (groceryShelf === null) {
            groceryShelf = await db.pantryShelf.create({
              data: { userId: user.id, name: shelfName },
            });
          }
          // if exist, add new grocery items to the shelf

          return db.pantryItem.create({
            data: {
              userId: user.id,
              shelfId: groceryShelf.id,
              name: groceryName,
            },
          });
        },
        (errors) => json({ errors }, { status: 400 })
      );
    default:
      return null;
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);

  const ingredients = await db.ingredient.findMany({
    where: {
      recipe: {
        userId: user.id,
        mealPlanMultiplier: {
          not: null, // we only want ingredients from the meal plan
        },
      },
    },
    include: {
      recipe: {
        select: {
          name: true,
          mealPlanMultiplier: true,
        },
      },
    },
  });

  const pantryItems = await db.pantryItem.findMany({
    where: {
      userId: user.id,
    },
  });

  // ingredients need to purchase if not already in pantry
  const missingIngredients = ingredients.filter(
    (ingredient) =>
      !pantryItems.find((pantryItem) =>
        isMatch(ingredient.name, pantryItem.name)
      )
  );

  // format and group the ingredients
  const groceryListItems = missingIngredients.reduce<{
    [key: string]: GroceryListItemType;
  }>((mapSoFar, ingredient) => {
    if (ingredient.recipe.mealPlanMultiplier === null) {
      throw new Error("should not be null");
    }
    const ingredientName = ingredient.name.toLowerCase();
    const existingIngredient = mapSoFar[ingredientName] ?? { usedBy: [] };
    return {
      ...mapSoFar,
      [ingredientName]: {
        id: ingredient.id,
        name: ingredientName,
        usedBy: [
          ...existingIngredient.usedBy,
          {
            id: ingredient.recipeId,
            amount: ingredient.amount,
            recipeName: ingredient.recipe.name,
            multiplier: ingredient.recipe.mealPlanMultiplier,
          },
        ],
      },
    };
  }, {});
  const groceryList = Object.values(groceryListItems);
  return json({ groceryList });
};

function GroceryListItem({ item }: { item: GroceryListItemType }) {
  const fetcher = useFetcher();
  return fetcher.state !== "idle" ? null : (
    <div className="shadow-md rounded-md p-4 flex">
      <div className="flex-grow">
        <h1 className="text-sm font-bold mb-2 uppercase">{item.name}</h1>
        <ul>
          {item.usedBy.map((use) => (
            <li key={use.id} className="py-1">
              {use.amount} for {use.recipeName} x {use.multiplier}
            </li>
          ))}
        </ul>
      </div>

      <fetcher.Form method="post" className="flex flex-col justify-center">
        <input type="hidden" name="groceryName" value={item.name} />
        <button
          name="_action"
          value="checkOffItem"
          className="hover:text-primary"
        >
          <SolidCheckIcon />
        </button>
      </fetcher.Form>
    </div>
  );
}

export default function GroceryList() {
  const loaderData = useLoaderData<typeof loader>();
  const noGrocery = loaderData.groceryList.length === 0;
  return noGrocery ? (
    <div className="w-fit m-auto text-center py-16">
      <h1 className="text-3xl">All set!</h1>
      <div className="text-primary flex justify-center py-4">
        <SolidCheckIcon large />
      </div>
      <p>You have everything you need</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {loaderData.groceryList.map((item) => (
        <GroceryListItem key={item.id} item={item} />
      ))}
    </div>
  );
}
