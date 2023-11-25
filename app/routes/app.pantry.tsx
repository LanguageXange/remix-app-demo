import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getAllShelves } from "~/models/pantry-shelf.server";

export const loader = async () => {
  const shelves = await getAllShelves();
  return json({ shelves });
};

// remix handles the API layer for us and injects the data into the component tree
export default function Pantry() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Pantry page</h1>
      <ul>
        {data.shelves.map((shelf) => (
          <li key={shelf.id}>{shelf.name}</li>
        ))}
      </ul>
    </div>
  );
}
