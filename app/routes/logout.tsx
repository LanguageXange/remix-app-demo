import { json, type LoaderFunction } from "@remix-run/node";
import { destroySession, getSession } from "~/sessions";

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);

  //  delete session data to log user out
  return json(
    { message: "successfully logged out" },
    {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    }
  );
};

export default function Logout() {
  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="text-3xl mb-4"> You're logged out </h1>
        <a href="/" className="text-primary">
          Back to Home
        </a>
      </div>
    </div>
  );
}
