import { Link, useLoaderData, Outlet } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = () => {
  return json({ message: "index js", date: new Date() });
};
export default function Settings() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1> Setting Index Page</h1>
      <nav className="flex flex-col">
        <Link to="app">App</Link>
        <Link to="profile">profile</Link>
      </nav>
      <Outlet />
    </div>
  );
}
