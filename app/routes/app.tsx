import { NavLink, Outlet } from "@remix-run/react";
import { classNames } from "~/utils/misc";

export default function App() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold my-4">My App </h1>
      <nav className="border-b-2 pb-2 mt-2">
        <NavLink
          to="pantry"
          className={({ isActive }) =>
            classNames(
              "hover:text-gray-500 pb-2.5 px-2 md:px-4",
              isActive ? "border-b-2 border-b-primary" : ""
            )
          }
        >
          Pantry
        </NavLink>
      </nav>
      <div className="py-4">
        <Outlet />
      </div>
    </div>
  );
}
