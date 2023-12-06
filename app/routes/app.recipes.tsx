import {
  type ActionFunctionArgs,
  json,
  type LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useFetchers,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { Button } from "~/components/Button";
import { BoxIcon, PlusIcon } from "~/components/Icon";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/Recipes";
import { SearchBar } from "~/components/SearchBar";
import db from "~/db.server";
import { requireLoggedInUser } from "~/utils/auth.server";
import { classNames, useBuildSearchParams } from "~/utils/misc";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();
  const btnAction = formData.get("_action");
  switch (btnAction) {
    case "createRecipe":
      const recipe = await db.myRecipe.create({
        data: {
          userId: user.id,
          name: "New Recipe",
          totalTime: "0 min",
          imageUrl: "https://via.placeholder.com/150?text=Remix+Recipes",
          instructions: "to be created",
        },
      });
      const url = new URL(request.url); // this will contain the original search query
      url.pathname = `/app/recipes/${recipe.id}`;
      return redirect(url.toString());
    case "clearMealPlan":
      await db.myRecipe.updateMany({
        where: { userId: user.id },
        data: { mealPlanMultiplier: null },
      });
      return redirect("/app/recipes");
    default:
      return null;
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const filter = url.searchParams.get("filter");

  const recipes = await db.myRecipe.findMany({
    where: {
      userId: user.id,
      name: {
        contains: query ?? "",
        mode: "insensitive",
      },
      mealPlanMultiplier: filter === "mealPlanOnly" ? { not: null } : {},
    },
    select: {
      name: true,
      id: true,
      imageUrl: true,
      totalTime: true,
      mealPlanMultiplier: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ recipes });
};

type Recipe = {
  name: string;
  id: string;
  imageUrl: string;
  totalTime: string;
  mealPlanMultiplier: number | null;
};

type LoaderData = {
  recipes: Recipe[];
};
export default function Recipes() {
  const data = useLoaderData<typeof loader>() as LoaderData;
  const location = useLocation(); // gives you the current location object
  const navigation = useNavigation(); // navigation.location tells ou what the next location will be
  const fetchers = useFetchers(); // Returns an array of all in-flight fetchers.
  const [searchParams] = useSearchParams();
  const mealPlanOnlyFilterOn = searchParams.get("filter") === "mealPlanOnly";
  const buildSearchParam = useBuildSearchParams();
  const noRecipe = data?.recipes.length === 0;
  return (
    <RecipePageWrapper>
      <RecipeListWrapper>
        <div className="flex gap-4">
          <SearchBar
            placeholderText="Search Recipes..."
            otherClass="flex-grow"
          />
          <Link
            to={buildSearchParam(
              "filter",
              mealPlanOnlyFilterOn ? "" : "mealPlanOnly"
            )}
            className={classNames(
              "flex flex-col justify-center border-2 rounded-md px-2",
              mealPlanOnlyFilterOn
                ? "text-white bg-orange-300 border-orange-300"
                : "text-black bg-gray-100"
            )}
          >
            <BoxIcon />
          </Link>
        </div>

        <Form method="post" className="mt-4">
          {mealPlanOnlyFilterOn ? (
            noRecipe ? (
              <p> You have no meal plan here</p>
            ) : (
              <Button
                otherClass="bg-red-500 hover:bg-red-400"
                name="_action"
                value="clearMealPlan"
                onClick={(e) => {
                  if (
                    !confirm("Are you sure you want to clear all meal plans?")
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                Clear All Meal Plans
              </Button>
            )
          ) : (
            <Button otherClass="bg-primary" name="_action" value="createRecipe">
              <PlusIcon />
              <span className="pl-2"> Create New Recipe</span>
            </Button>
          )}
        </Form>

        <ul>
          {data?.recipes.map((recipe) => {
            const isLoading = navigation.location?.pathname.endsWith(recipe.id); // check if we've navigated to the recipe detail page
            const optimisticData = new Map();
            for (let fetcher of fetchers) {
              if (fetcher.formAction?.includes(recipe.id)) {
                if (fetcher.formData?.get("_action") === "saveRecipeName") {
                  optimisticData.set(
                    "recipeName",
                    fetcher.formData?.get("recipeName")
                  );
                }
                if (fetcher.formData?.get("_action") === "saveTotalTime") {
                  optimisticData.set(
                    "totalTime",
                    fetcher.formData?.get("totalTime")
                  );
                }
              }
            }
            return (
              <li className="my-4" key={recipe.id}>
                <NavLink
                  to={{ pathname: recipe.id, search: location.search }}
                  prefetch="intent" // prefetches when the user hovers or focuses the link
                >
                  {({ isActive }) => (
                    <RecipeCard
                      name={optimisticData.get("recipeName") ?? recipe.name}
                      totalTime={
                        optimisticData.get("totalTime") ?? recipe.totalTime
                      }
                      imageUrl={recipe.imageUrl}
                      isActive={isActive}
                      isLoading={isLoading}
                      mealPlanMultiplier={recipe.mealPlanMultiplier}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </RecipeListWrapper>

      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
