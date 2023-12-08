import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createUser, getUser } from "~/models/user.server";
import { commitSession, getSession } from "~/sessions";

// this is for testing
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const firstName = url.searchParams.get("firstName");
  const lastName = url.searchParams.get("lastName");
  const email = url.searchParams.get("email");
  if (!email) {
    throw new Error("email is required");
  }

  let user = await getUser(email);
  if (!user) {
    if (!firstName || !lastName) {
      throw new Error("first and last names are required to login ");
    }
    // create a user if not existed
    user = await createUser(email, firstName, lastName);
  }

  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  session.set("userId", user.id);

  return redirect("/app", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
