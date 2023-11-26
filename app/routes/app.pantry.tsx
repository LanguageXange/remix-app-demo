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

type LoaderData = {
  shelves: Awaited<ReturnType<typeof getAllShelves>>;
};

type FieldError = { [key: string]: string };

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
    case "deleteShelf":
      const shelfId = formData.get("shelfId"); // this value is from the hidden input
      if (typeof shelfId !== "string") {
        return json({ errors: { shelfId: "Shelf ID must be a string" } });
      }
      return deleteShelf(shelfId);
    case "createShelf":
      return createShelf();
    case "saveShelfName": {
      const shelfId = formData.get("shelfId");
      const shelfName = formData.get("shelfName");
      const errors: FieldError = {};
      if (
        typeof shelfId === "string" &&
        typeof shelfName === "string" &&
        shelfName !== ""
      ) {
        return saveShelfName(shelfId, shelfName);
      }

      if (typeof shelfId !== "string") {
        errors["shelfId"] = "Shelf ID must be a string";
      }
      if (typeof shelfName !== "string") {
        errors["shelfName"] = "Shelf Name must be a string";
      }

      if (shelfName === "") {
        errors["shelfName"] = "Shelf Name must not be blank";
      }

      return json({ errors });
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
  // useFetcher()
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();
  const isDeleting =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;
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
        <input type="hidden" name="shelfId" value={shelf.id} />
        <input
          className={classNames(
            "text-xl font-bold pb-1 w-full outline-none",
            "border-b-2 border-b-background focus:border-b-primary"
          )}
          defaultValue={shelf.name}
          name="shelfName"
          placeholder="Enter Shelf Name"
          autoComplete="off"
          required
        />
        <Button
          name="_action"
          value="saveShelfName"
          otherClass="bg-gray-500 hover:bg-gray-400 border-white ml-4"
        >
          <SaveIcon />
        </Button>
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
