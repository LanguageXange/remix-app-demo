import {
  type MetaFunction,
  type LinksFunction,
  type LoaderFunction,
  json,
} from "@remix-run/node";
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
  isRouteErrorResponse,
  useLoaderData,
} from "@remix-run/react";
import { classNames } from "~/utils/misc";
import styles from "./tailwind.css";
import {
  HomeIcon,
  DiscoverIcon,
  BookIcon,
  SettingIcon,
  LoginIcon,
  LogoutIcon,
} from "./components/Icon";

import { getCurrentUser } from "./utils/auth.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: "/theme.css" },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Recipe app" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);

  return json({ isLoggedIn: user !== null });
};

export default function App() {
  const data = useLoaderData<typeof loader>();
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
            <AppNavLink to="discover">
              <DiscoverIcon />
            </AppNavLink>

            {data.isLoggedIn ? (
              <AppNavLink to="app/recipes">
                <BookIcon />
              </AppNavLink>
            ) : null}

            <AppNavLink to="settings">
              <SettingIcon />
            </AppNavLink>
          </ul>

          <ul>
            {data.isLoggedIn ? (
              <AppNavLink
                to="logout"
                clickFn={(e) => {
                  if (!confirm("are you sure you want to log out?"))
                    e.preventDefault();
                }}
              >
                <LogoutIcon />
              </AppNavLink>
            ) : (
              <AppNavLink to="login">
                <LoginIcon />
              </AppNavLink>
            )}
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
  clickFn?: (e: React.MouseEvent<Element, MouseEvent>) => void;
};

function AppNavLink({ to, children, clickFn }: AppNavLinksProps) {
  const navigation = useNavigation();
  const path = useResolvedPath(to);
  const isLoading =
    navigation.state === "loading" &&
    navigation.location.pathname === path.pathname;
  return (
    <li className="w-16">
      <NavLink to={to} onClick={(e) => clickFn && clickFn(e)}>
        {({ isActive }) => (
          <div
            className={classNames(
              "py-4 flex justify-center  hover:bg-primary-light",
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
          {isRouteErrorResponse(error) ? (
            <>
              <h1 className="text-2xl pb-3">
                {" "}
                Route Error: {error.status} - {error.statusText}
              </h1>
              <p> You're seeing this because an error occurred</p>
              <p className="my-4 font-bold"> Details: {error.data.message}</p>
            </>
          ) : (
            <>
              {" "}
              <h1 className="text-2xl pb-3">Whoooops!!</h1>
              <p> You're seeing this because an error occurred</p>
              {error instanceof Error ? (
                <p className="my-4 font-bold"> {error.message}</p>
              ) : null}
            </>
          )}

          <Link to="/" className="text-primary">
            {" "}
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
