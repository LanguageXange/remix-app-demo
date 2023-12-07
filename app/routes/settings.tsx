import { useRouteError } from "@remix-run/react";
import { Layout } from "~/components/Layout";

export default function SettingsLayout() {
  return <Layout title="Settings" links={[{ to: "app", text: "App" }]} />;
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
