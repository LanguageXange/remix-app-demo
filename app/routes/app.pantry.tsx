import {
  Form,
  useFetcher,
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
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  saveShelfName,
} from "~/models/pantry-shelf.server";
import { classNames } from "~/utils/misc";
import { SearchIcon, PlusIcon, SaveIcon } from "~/components/Icon";
import { Button } from "~/components/Button";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { validateform } from "~/utils/validation";

type LoaderData = {
  shelves: Awaited<ReturnType<typeof getAllShelves>>;
};

const saveShelfNameSchema = z.object({
  shelfName: z.string().min(1, "Shelf Name cannot be blank!"), // here we can pass in custom error message
  shelfId: z.string(),
});

const deleteShelfSchema = z.object({
  shelfId: z.string(),
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const shelves = await getAllShelves(query);
  return json({ shelves });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const buttonAction = formData.get("_action"); // this returns Button value attribute

  switch (buttonAction) {
    case "deleteShelf": {
      return validateform(
        formData,
        deleteShelfSchema,
        (data) => deleteShelf(data.shelfId),
        (errors) => json({ errors })
      );
    }

    case "createShelf":
      return createShelf();
    case "saveShelfName": {
      return validateform(
        formData,
        saveShelfNameSchema,
        (data) => saveShelfName(data.shelfId, data.shelfName),
        (errors) => json({ errors })
      );
    }
    default:
      return null;
  }
};

// remix handles the API layer for us and injects the data into the component tree
export default function Pantry() {
  const [searchParam] = useSearchParams();
  const data = useLoaderData<typeof loader>() as LoaderData;
  const navigation = useNavigation();
  const createShelfFetcher = useFetcher();
  const isSearching = navigation.formData?.has("q");
  const isCreatingShelf =
    createShelfFetcher.formData?.get("_action") === "createShelf";
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

      <createShelfFetcher.Form method="post">
        <Button
          type="submit"
          otherClass="bg-primary hover:bg-primary-light mt-4 w-full md:w-fit"
          name="_action"
          value="createShelf"
        >
          <PlusIcon />
          <span className="pl-2">
            {" "}
            {isCreatingShelf ? "Creating ..." : "Create Shelf"}
          </span>
        </Button>
      </createShelfFetcher.Form>

      <ul
        ref={containerRef}
        className={classNames(
          "flex gap-8 overflow-x-auto mt-4 pb-4",
          "snap-x snap-mandatory md:snap-none"
        )}
      >
        {data.shelves.map((shelf) => (
          <Shelf key={shelf.id} shelf={shelf} />
        ))}
      </ul>
    </div>
  );
}

type ShelfItem = {
  id: string;
  name: string;
};
type ShelfProps = {
  shelf: {
    id: string;
    name: string;
    items: ShelfItem[];
  };
};

function Shelf({ shelf }: ShelfProps) {
  // useFetcher() can only be called at a component level that's why we extract the code to its own component
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();
  const isDeleting =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;

  // console.log(saveShelfNameFetcher.data, "what is save name fetcher data");
  return (
    <li
      key={shelf.id}
      className={classNames(
        "border-2 border-primary rounded-md p-4 h-fit",
        "w-[calc(100vw-2rem)] flex-none snap-center",
        "md:w-96"
      )}
    >
      <saveShelfNameFetcher.Form
        method="post"
        className="flex align-center mb-4"
      >
        <div className="w-full">
          <input
            className={classNames(
              "text-xl font-bold pb-1 w-full outline-none",
              "border-b-2 border-b-background focus:border-b-primary"
            )}
            defaultValue={shelf.name}
            name="shelfName"
            placeholder="Enter Shelf Name"
            autoComplete="off"
          />

          <span className="text-red-600 text-xs">
            {saveShelfNameFetcher.data?.errors?.shelfName}
          </span>
        </div>

        <Button
          name="_action"
          value="saveShelfName"
          otherClass="bg-gray-500 hover:bg-gray-400 border-white ml-4"
        >
          <SaveIcon />
        </Button>
        <input type="hidden" name="shelfId" value={shelf.id} />
      </saveShelfNameFetcher.Form>

      <ul>
        {shelf.items.map((item) => (
          <li key={item.id} className="py-2">
            {item.name}
          </li>
        ))}

        <deleteShelfFetcher.Form method="post">
          <input type="hidden" name="shelfId" value={shelf.id} />
          <Button
            otherClass="w-full bg-red-500 hover:bg-red-400"
            name="_action"
            value="deleteShelf"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting ..." : "Delete Shelf"}
          </Button>
        </deleteShelfFetcher.Form>
      </ul>
    </li>
  );
}
