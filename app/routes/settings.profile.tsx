import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = () => {
  return json({ message: "hi this is profile message" });
};

export default function Profile() {
  const data = useLoaderData();
  return (
    <div>
      <h1>This is a Profile Page</h1>
    </div>
  );
}
