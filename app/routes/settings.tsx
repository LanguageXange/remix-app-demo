import { Outlet } from "@remix-run/react";
import { useMatchesData } from "~/utils/misc";

export default function SettingsLayout() {
  const routeData = useMatchesData("routes/settings.profile");

  return (
    <div>
      <p>{routeData?.message}</p>
      <h1>Settings Layout</h1>
      <Outlet />
    </div>
  );
}
