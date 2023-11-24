import { Outlet, useRouteError } from "@remix-run/react";
import { useMatchesData } from "~/utils/misc";
export default function SettingsLayout() {
  const routeData = useMatchesData("routes/settings.profile");
  return (
    <div>
      {routeData?.message}
      <h1>Settings Layout</h1>
      <Outlet />
    </div>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  if (error instanceof Error) {
    return (
      <div>
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}
