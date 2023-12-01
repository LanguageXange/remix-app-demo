import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useNavigation,
  useRouteError,
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
  getShelfById,
  saveShelfName,
} from "~/models/pantry-shelf.server";
import {
  createShelfItem,
  deleteShelfItem,
  getShelfItemById,
} from "~/models/pantry-item.server";
import { classNames, useIsHydrated, useServerLayoutEffect } from "~/utils/misc";
import {
  SearchIcon,
  PlusIcon,
  DeleteIcon,
  EditIcon,
  SmallPlusIcon,
} from "~/components/Icon";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { validateform } from "~/utils/validation";
import { type getCurrentUser, requireLoggedInUser } from "~/utils/auth.server";

type LoaderData = {
  shelves: Awaited<ReturnType<typeof getAllShelves>>;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
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
  const user = await requireLoggedInUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const shelves = await getAllShelves(user.id, query);
  return json({ shelves, user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();
  const buttonAction = formData.get("_action"); // this returns Button value attribute

  switch (buttonAction) {
    case "deleteShelf": {
      return validateform(
        formData,
        deleteShelfSchema,
        async (data) => {
          const shelf = await getShelfById(data.shelfId);
          if (shelf && shelf.userId !== user.id) {
            throw json(
              {
                message:
                  "Sorry! This shelf is not yours so you cannot delete it ",
              },
              { status: 401 }
            );
          }
          return deleteShelf(data.shelfId);
        },
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createShelf":
      return createShelf(user.id);
    case "saveShelfName": {
      return validateform(
        formData,
        saveShelfNameSchema,
        async (data) => {
          const shelf = await getShelfById(data.shelfId);
          if (shelf && shelf.userId !== user.id) {
            throw json(
              {
                message:
                  "Sorry! This shelf is not yours so you cannot update the name ",
              },
              { status: 401 }
            );
          }
          return saveShelfName(data.shelfId, data.shelfName);
        },
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createShelfItem": {
      return validateform(
        formData,
        createShelfItemSchema,
        (data) => createShelfItem(user.id, data.shelfId, data.itemName),
        (errors) => json({ errors }, { status: 400 })
      );
    }
    case "deleteShelfItem": {
      return validateform(
        formData,
        deleteShelfItemSchema,
        async (data) => {
          const item = await getShelfItemById(data.itemId);
          if (item && item.userId !== user.id) {
            throw json(
              {
                message:
                  "Sorry! This item is not yours so you cannot delete it ",
              },
              { status: 401 }
            );
          }
          return deleteShelfItem(data.itemId);
        },
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
      <h2 className="mb-3"> Welcome Back ! {data?.user?.firstName} </h2>
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

  const createItemFormRef = useRef<HTMLFormElement>(null);
  // optimistically creating shelf items
  const { renderItems, addItem } = useOptimisticItems(
    shelf.items,
    createShelfItemFetcher.state
  );
  const isDeleting =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;

  // console.log(saveShelfNameFetcher.data, "what is save name fetcher data");
  const isHydrated = useIsHydrated();
  return isDeleting ? null : (
    <li
      key={shelf.id}
      className={classNames(
        "border-2 border-primary rounded-2xl p-5 h-fit",
        "w-[calc(100vw-2rem)] flex-none snap-center",
        "md:w-96"
      )}
    >
      <saveShelfNameFetcher.Form method="post" className="flex items-center">
        <div className="w-full peer">
          <input
            className={classNames(
              "text-xl font-bold w-full outline-none",
              "border-b-2 border-b-background focus:border-b-primary"
            )}
            defaultValue={shelf.name}
            name="shelfName"
            placeholder="Enter Shelf Name"
            autoComplete="off"
            required
            onChange={(e) =>
              e.target.value !== "" &&
              saveShelfNameFetcher.submit(
                {
                  _action: "saveShelfName",
                  shelfName: e.target.value,
                  shelfId: shelf.id,
                },
                {
                  method: "post",
                }
              )
            }
          />

          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfName}
          </ErrorMessage>
        </div>

        {isHydrated ? null : (
          <Button
            name="_action"
            value="saveShelfName"
            otherClass={classNames(
              "border-none ml-2 text-gray-800 mb-1 opacity-0 hover:opacity-100 focus:opacity-100",
              "peer-focus-within:opacity-100"
            )}
          >
            <EditIcon />
          </Button>
        )}

        <input type="hidden" name="shelfId" value={shelf.id} />
      </saveShelfNameFetcher.Form>

      <createShelfItemFetcher.Form
        method="post"
        className="flex items-center"
        ref={createItemFormRef}
        onSubmit={(e) => {
          const target = e.target as HTMLFormElement;
          const itemNameInput = target.elements.namedItem(
            "itemName"
          ) as HTMLInputElement;
          addItem(itemNameInput.value);
          e.preventDefault();
          createShelfItemFetcher.submit(
            {
              itemName: itemNameInput.value,
              shelfId: shelf.id,
              _action: "createShelfItem",
            },
            {
              method: "post",
            }
          );
          createItemFormRef.current?.reset();
        }}
      >
        <div className="w-full peer">
          <input
            className={classNames(
              "text-md w-full outline-none",
              "border-b-2 border-b-background focus:border-b-primary"
            )}
            name="itemName"
            required
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
          otherClass={classNames(
            "border-none text-gray-800 opacity-0 hover:opacity-100 active:opacity-100",
            "peer-focus-within:opacity-100"
          )}
        >
          <SmallPlusIcon />
        </Button>

        <input type="hidden" name="shelfId" value={shelf.id} />
      </createShelfItemFetcher.Form>

      <ul className="mt-2">
        {renderItems.map((item) => (
          <ShelfItem key={item.id} item={item} />
        ))}

        <deleteShelfFetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm(`Are you sure you want to delete "${shelf.name}" ?`)) {
              e.preventDefault(); // to prevent form from submitting
            }
          }}
        >
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
  item: RenderItem;
};

function ShelfItem({ item }: ShelfItemProps) {
  const deleteItemFetcher = useFetcher();
  const isDeleteingItem = !!deleteItemFetcher.formData;
  return isDeleteingItem ? null : (
    <li className="flex justify-between">
      <p className="w-full my-2 border-b-2">{item.name}</p>

      <deleteItemFetcher.Form method="post">
        <input type="hidden" name="itemId" value={item.id} />
        {item.isOptimistic ? null : (
          <Button
            otherClass="border-none"
            name="_action"
            value="deleteShelfItem"
          >
            <DeleteIcon />
          </Button>
        )}

        <ErrorMessage>{deleteItemFetcher.data?.errors?.itemId}</ErrorMessage>
      </deleteItemFetcher.Form>
    </li>
  );
}

type RenderItem = {
  id: string;
  name: string;
  isOptimistic?: boolean;
};

function useOptimisticItems(
  savedItems: RenderItem[],
  createShelfItemState: "idle" | "submitting" | "loading"
) {
  const [optimisticItems, setOptimisticItems] = useState<Array<RenderItem>>([]);
  const renderItems = [...optimisticItems, ...savedItems];
  useServerLayoutEffect(() => {
    if (createShelfItemState === "idle") {
      setOptimisticItems([]);
    }
  }, [createShelfItemState]);

  renderItems.sort((a, b) => {
    if (a.name === b.name) return 0;
    return a.name < b.name ? -1 : 1;
  });

  const addItem = (name: string) => {
    setOptimisticItems((items) => [
      ...items,
      { id: createItemId(), name, isOptimistic: true },
    ]);
  };

  return { addItem, renderItems };
}

function createItemId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);

  return (
    <div className="bg-red-500 text-white rounded-md p-4 w-fit">
      {isRouteErrorResponse(error) ? (
        <>
          {" "}
          <h2 className="mb-2">
            {error.status} - {error.statusText}
          </h2>
          <p>{error.data.message}</p>
        </>
      ) : (
        <>
          <h2 className="mb-2">An unexpected error occurred.</h2>
        </>
      )}
    </div>
  );
}
