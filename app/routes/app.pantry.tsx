import { useLoaderData, useSearchParams } from "@remix-run/react";
import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/node";
import { getAllShelves } from "~/models/pantry-shelf.server";
import { classNames } from "~/utils/misc";
import { SearchIcon } from "~/components/Icon";

type LoaderData = {
  shelves: Awaited<ReturnType<typeof getAllShelves>>;
};

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const shelves = await getAllShelves(query);
  return json({ shelves });
};

// remix handles the API layer for us and injects the data into the component tree
export default function Pantry() {
  const [searchParam] = useSearchParams();
  const data = useLoaderData<typeof loader>() as LoaderData;

  return (
    <div>
      <form
        className={classNames(
          "flex border-2 border-gray-400 rounded-md",
          "focus-within:border-primary md:w-80"
        )}
      >
        <button className="px-2 mr-1">
          <SearchIcon />
        </button>
        <input
          defaultValue={searchParam.get("q") ?? ""}
          type="text"
          name="q"
          autoComplete="off"
          placeholder="Searching shelves ..."
          className="p-2 w-full outline-none"
        />
      </form>

      <ul
        className={classNames(
          "flex gap-8 overflow-x-auto mt-4",
          "snap-x snap-mandatory md:snap-none"
        )}
      >
        {data.shelves.map((shelf) => (
          <li
            key={shelf.id}
            className={classNames(
              "border-2 border-primary rounded-md p-4 h-fit",
              "w-[calc(100vw-2rem)] flex-none snap-center",
              "md:w-96"
            )}
          >
            <h1 className="text-2xl font-bold mb-2">{shelf.name}</h1>
            <ul>
              {shelf.items.map((item) => (
                <li key={item.id} className="py-2">
                  {item.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
