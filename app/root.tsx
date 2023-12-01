import type { MetaFunction, LinksFunction } from "@remix-run/node";
import {
  Links,
  NavLink,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useResolvedPath,
  Link,
  useRouteError,
} from "@remix-run/react";
import { classNames } from "~/utils/misc";
import styles from "./tailwind.css";
import {
  HomeIcon,
  DiscoverIcon,
  BookIcon,
  SettingIcon,
  LoginIcon,
} from "./components/Icon";
import { useEffect } from "react";

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
        <nav
          className={classNames(
            "bg-primary text-white",
            "flex justify-between md:flex-col"
          )}
        >
          <ul className="flex md:flex-col">
            <AppNavLink to="/">
              <HomeIcon />
            </AppNavLink>

            <AppNavLink to="discover">
              <DiscoverIcon />
            </AppNavLink>

            <AppNavLink to="app/pantry">
              <BookIcon />
            </AppNavLink>

            <AppNavLink to="settings">
              <SettingIcon />
            </AppNavLink>
          </ul>

          <ul>
            <AppNavLink to="login">
              <LoginIcon />
            </AppNavLink>
          </ul>
        </nav>
        <div className="p-4 w-full md:w-[calc(100%-4rem)]">
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
  const navigation = useNavigation();
  const path = useResolvedPath(to);
  const isLoading =
    navigation.state === "loading" &&
    navigation.location.pathname === path.pathname;
  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              "py-4 flex justify-center hover:bg-primary-light",
              isActive ? "bg-primary-light" : "",
              isLoading ? "animate-pulse bg-primary-light" : ""
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html>
      <head>
        <title>Whooooops!</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="p-4">
          <h1 className="text-2xl pb-3">Whoooops!!</h1>
          <p> You're seeing this because an error occurred</p>
          {error instanceof Error ? (
            <p className="my-4 font-bold"> {error.message}</p>
          ) : null}

          <Link to="/" className="text-primary">
            {" "}
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
