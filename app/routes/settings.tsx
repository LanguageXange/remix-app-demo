import { Outlet } from "@remix-run/react";

export default function SettingsLayout() {
  return (
    <div>
      <h1>Settings Layout</h1>
      <Outlet />
    </div>
  );
}
