import type { MetaFunction, LinksFunction } from "@remix-run/node";
import {
  Links,
  Link,
  NavLink,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import classNames from "classnames";
import styles from "./tailwind.css";
import {
  HomeIcon,
  DiscoverIcon,
  BookIcon,
  SettingIcon,
} from "./components/Icon";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const meta: MetaFunction = () => {
  return [
    { title: "Recipe app" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="md:flex md:h-screen">
        <nav className="bg-primary text-white">
          <ul className="flex md:flex-col">
            <AppNavLink to="/">
              <HomeIcon />
            </AppNavLink>

            <AppNavLink to="discover">
              <DiscoverIcon />
            </AppNavLink>

            <AppNavLink to="app">
              <BookIcon />
            </AppNavLink>

            <AppNavLink to="settings">
              <SettingIcon />
            </AppNavLink>
          </ul>
        </nav>
        <div className="p-4">
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

type AppNavLinksProps = {
  to: string;
  children: React.ReactNode;
};

function AppNavLink({ to, children }: AppNavLinksProps) {
  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              "py-4 flex justify-center hover:bg-primary-light",
              {
                "bg-primary-light": isActive,
              }
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}
