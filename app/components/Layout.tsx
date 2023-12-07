import { NavLink, Outlet } from "@remix-run/react";
import { classNames } from "~/utils/misc";

type LayoutProps = {
  title: string;
  links: Array<{ to: string; text: string }>;
};

export function Layout({ title, links }: LayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold my-4">{title}</h1>
      <nav className="border-b-2 pb-2 mt-2">
        {links.map(({ to, text }) => (
          <CustomNavLink key={to} to={to}>
            {" "}
            {text}
          </CustomNavLink>
        ))}
      </nav>
      <div className="py-4 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
};

function CustomNavLink({ to, children }: NavLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        classNames(
          "hover:text-gray-500 pb-2.5 px-2 md:px-4",
          isActive ? "border-b-2 border-b-primary" : ""
        )
      }
    >
      {children}
    </NavLink>
  );
}
