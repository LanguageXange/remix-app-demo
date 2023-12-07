import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  DiscoverRecipeDetails,
  DiscoverRecipeHeader,
} from "~/components/Discover";
import db from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const recipe = await db.myRecipe.findUnique({
    where: {
      id: params.recipeid,
    },
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

  if (recipe === null) {
    throw json(
      { message: "A recipe with this id does not exist!" },
      { status: 404 }
    );
  }

  return json({ recipe });
}

export default function DiscoverDetail() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div className="md:h-[calc(100vh-1rem)] m-[-1rem] overflow-auto">
      <DiscoverRecipeHeader recipe={loaderData.recipe} />

      <DiscoverRecipeDetails recipe={loaderData.recipe} />
    </div>
  );
}
