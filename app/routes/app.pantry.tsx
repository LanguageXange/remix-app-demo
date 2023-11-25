import { PantryShelf, PrismaClient } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  const db = new PrismaClient();
  const shelves = await db.pantryShelf.findMany();

  return json({ shelves });
};

// remix handles the API layer for us and injects the data into the component tree
export default function Pantry() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Pantry page</h1>
      <ul>
        {data.shelves.map((shelf: PantryShelf) => (
          <li key={shelf.id}>{shelf.name}</li>
        ))}
      </ul>
    </div>
  );
}
