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
import { createShelfItem, deleteShelfItem } from "~/models/pantry-item.server";
import { classNames } from "~/utils/misc";
import { SearchIcon, PlusIcon, SaveIcon, DeleteIcon } from "~/components/Icon";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
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

const createShelfItemSchema = z.object({
  shelfId: z.string(),
  itemName: z.string().min(1, "item name cannot be blank"),
});

const deleteShelfItemSchema = z.object({
  itemId: z.string(),
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
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createShelf":
      return createShelf();
    case "saveShelfName": {
      return validateform(
        formData,
        saveShelfNameSchema,
        (data) => saveShelfName(data.shelfId, data.shelfName),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createShelfItem": {
      return validateform(
        formData,
        createShelfItemSchema,
        (data) => createShelfItem(data.shelfId, data.itemName),
        (errors) => json({ errors }, { status: 400 })
      );
    }
    case "deleteShelfItem": {
      return validateform(
        formData,
        deleteShelfItemSchema,
        (data) => deleteShelfItem(data.itemId),
        (errors) => json({ errors }, { status: 400 })
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

type Item = {
  id: string;
  name: string;
};
type ShelfProps = {
  shelf: {
    id: string;
    name: string;
    items: Item[];
  };
};

function Shelf({ shelf }: ShelfProps) {
  // useFetcher() can only be called at a component level that's why we extract the code to its own component
  const deleteShelfFetcher = useFetcher();
  const saveShelfNameFetcher = useFetcher();
  const createShelfItemFetcher = useFetcher();
  const isDeleting =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;

  // console.log(saveShelfNameFetcher.data, "what is save name fetcher data");
  return isDeleting ? null : (
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

          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfName}
          </ErrorMessage>
        </div>

        <Button
          name="_action"
          value="saveShelfName"
          otherClass="border-none ml-4"
        >
          <SaveIcon />
        </Button>
        <input type="hidden" name="shelfId" value={shelf.id} />
      </saveShelfNameFetcher.Form>

      <createShelfItemFetcher.Form method="post" className="flex align-center">
        <div className="w-full">
          <input
            className={classNames(
              "text-md pb-1 w-full outline-none",
              "border-b-2 border-b-background focus:border-b-primary"
            )}
            name="itemName"
            defaultValue=""
            placeholder="Enter Item Name"
            autoComplete="off"
          />

          <ErrorMessage>
            {createShelfItemFetcher.data?.errors?.itemName}
          </ErrorMessage>
        </div>

        <Button
          name="_action"
          value="createShelfItem"
          otherClass="border-none ml-4"
        >
          <SaveIcon />
        </Button>
        <input type="hidden" name="shelfId" value={shelf.id} />
      </createShelfItemFetcher.Form>

      <ul>
        {shelf.items.map((item) => (
          <ShelfItem key={item.id} item={item} />
        ))}

        <deleteShelfFetcher.Form method="post">
          <input type="hidden" name="shelfId" value={shelf.id} />
          <ErrorMessage otherClass="mb-2">
            {deleteShelfFetcher.data?.errors?.shelfId}
          </ErrorMessage>
          <Button
            otherClass="w-full bg-red-500 hover:bg-red-400 mt-8"
            name="_action"
            value="deleteShelf"
            disabled={isDeleting}
          >
            Delete Shelf
          </Button>
        </deleteShelfFetcher.Form>
      </ul>
    </li>
  );
}
type ShelfItemProps = {
  item: Item;
};

function ShelfItem({ item }: ShelfItemProps) {
  const deleteItemFetcher = useFetcher();
  return (
    <li className="flex justify-between">
      <p className="w-full my-2 border-b-2">{item.name}</p>

      <deleteItemFetcher.Form method="post">
        <input type="hidden" name="itemId" value={item.id} />
        <Button otherClass="border-none" name="_action" value="deleteShelfItem">
          <DeleteIcon />
        </Button>
        <ErrorMessage>{deleteItemFetcher.data?.errors?.itemId}</ErrorMessage>
      </deleteItemFetcher.Form>
    </li>
  );
}
