import {
  type LoaderFunctionArgs,
  json,
  type HeadersFunction,
  type HeadersArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  DiscoverRecipeDetails,
  DiscoverRecipeHeader,
} from "~/components/Discover";
import db from "~/db.server";
import { getCurrentUser } from "~/utils/auth.server";
import { hash } from "~/utils/crypotography.server";

// if user visits this route directly, it will apply the cache control we set here
export const headers: HeadersFunction = ({ loaderHeaders }: HeadersArgs) => {
  return {
    etag: loaderHeaders.get("X-Mypage-Etag"),
    "Cache-Control": `max-age=3600, stale-while-revalidate=${3600 * 24 * 7}`, // caching for 1 hr and revalidation window for 1 week
  };
};

// if users navigates around the app (client side routing ) then it will use the the cache control setting inside loader
export async function loader({ params, request }: LoaderFunctionArgs) {
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

  const eTag = hash(JSON.stringify(recipe)); // response header
  if (eTag === request.headers.get("if-none-match")) {
    return new Response(null, { status: 304 }); // not-modified status code 304: meaning the resource has not changed
  }

  const user = await getCurrentUser(request);
  const pageEtag = `${hash(user?.id ?? "anonymous")}.${eTag}`;

  return json(
    { recipe },
    {
      headers: {
        eTag,
        "X-Mypage-Etag": pageEtag,
        "Cache-Control": "max-age=5, stale-while-revalidate=10 ",
      },
    }
  );
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
