import {
  type ActionFunctionArgs,
  json,
  type LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  NavLink,
  Outlet,
  useFetchers,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { Button } from "~/components/Button";
import { PlusIcon } from "~/components/Icon";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/Recipes";
import { SearchBar } from "~/components/SearchBar";
import db from "~/db.server";
import { requireLoggedInUser } from "~/utils/auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireLoggedInUser(request);
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
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  const recipes = await db.myRecipe.findMany({
    where: {
      userId: user.id,
      name: {
        contains: query ?? "",
        mode: "insensitive",
      },
    },
    select: { name: true, id: true, imageUrl: true, totalTime: true },
    orderBy: { createdAt: "desc" },
  });

  return json({ recipes });
};

type Recipe = {
  name: string;
  id: string;
  imageUrl: string;
  totalTime: string;
};

type LoaderData = {
  recipes: Recipe[];
};
export default function Recipes() {
  const data = useLoaderData<typeof loader>() as LoaderData;
  const location = useLocation(); // gives you the current location object
  const navigation = useNavigation(); // navigation.location tells ou what the next location will be
  const fetchers = useFetchers(); // Returns an array of all in-flight fetchers.

  return (
    <RecipePageWrapper>
      <RecipeListWrapper>
        <SearchBar placeholderText="Search recipes..." />

        <Form method="post" className="mt-4">
          <Button otherClass="bg-primary" name="" value="">
            <PlusIcon />
            <span className="pl-2"> Create New Recipe</span>
          </Button>
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
