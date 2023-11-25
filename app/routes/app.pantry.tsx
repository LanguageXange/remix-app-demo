import {
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  json,
  type ActionFunction,
} from "@remix-run/node";
import { createShelf, getAllShelves } from "~/models/pantry-shelf.server";
import { classNames } from "~/utils/misc";
import { SearchIcon, PlusIcon } from "~/components/Icon";
import { Button } from "~/components/Button";
import { useEffect, useRef } from "react";

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

export const action: ActionFunction = async () => {
  return createShelf();
};

// remix handles the API layer for us and injects the data into the component tree
export default function Pantry() {
  const [searchParam] = useSearchParams();
  const data = useLoaderData<typeof loader>() as LoaderData;
  const navigation = useNavigation();
  const isSearching = navigation.formData?.has("q");
  const isCreatingShelf = navigation.formData?.has("createShelf");

  const containerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!isCreatingShelf && containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [isCreatingShelf]);

  return (
    <div>
      <Form
        className={classNames(
          "flex border-2 border-gray-400 rounded-md",
          "focus-within:border-primary md:w-80",
          isSearching ? "animate-pulse" : "",
          isCreatingShelf ? "bg-primary-light" : ""
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
      </Form>

      <Form method="post">
        <Button
          type="submit"
          otherClass="mt-4 w-full md:w-fit"
          name="createShelf"
        >
          <PlusIcon />
          <span className="pl-2">
            {" "}
            {isCreatingShelf ? "Creating ..." : "Create Shelf"}
          </span>
        </Button>
      </Form>

      <ul
        ref={containerRef}
        className={classNames(
          "flex gap-8 overflow-x-auto mt-4 pb-4",
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
            <h1 className="text-xl font-bold mb-2">{shelf.name}</h1>
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
