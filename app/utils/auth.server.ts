import { json, redirect } from "@remix-run/node";
import db from "~/db.server";
import { getUserById } from "~/models/user.server";
import { getSession } from "~/sessions";

export async function getCurrentUser(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  const userId = session.get("userId");

  if (typeof userId !== "string") {
    return null;
  }

  return getUserById(userId);
}

export async function requireLoggedOutUser(request: Request) {
  const user = await getCurrentUser(request);
  if (user !== null) {
    throw redirect("/app");
  }
}

export async function requireLoggedInUser(request: Request) {
  const user = await getCurrentUser(request);
  if (user === null) {
    throw redirect("/login");
  }
  return user;
}

// in recipeid and recipeid.mealplan - we both need to check if user can update recipe
export async function canChangeRecipe(request: Request, recipeId: string) {
  const user = await requireLoggedInUser(request);

  const currentRecipe = await db.myRecipe.findUnique({
    where: {
      id: recipeId,
    },
  });

  if (currentRecipe === null) {
    throw json({ message: "recipe does not exist" }, { status: 404 });
  }
  if (user.id !== currentRecipe?.userId) {
    throw json(
      { message: "You are not authorized to update this recipe" },
      { status: 401 }
    );
  }
}
