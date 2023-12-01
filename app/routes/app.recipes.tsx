import { json, type LoaderFunction } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/Recipes";
import { SearchBar } from "~/components/SearchBar";
import db from "~/db.server";
import { requireLoggedInUser } from "~/utils/auth.server";

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

  return (
    <RecipePageWrapper>
      <RecipeListWrapper>
        <SearchBar placeholderText="Search recipes..." />
        <ul>
          {data?.recipes.map((recipe) => (
            <li className="my-4" key={recipe.id}>
              <NavLink to={recipe.id}>
                {({ isActive }) => (
                  <RecipeCard {...recipe} isActive={isActive} />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </RecipeListWrapper>

      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
