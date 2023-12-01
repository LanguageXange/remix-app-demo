import {
  json,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/node";
import { useActionData, Link } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { generateMagicLink } from "~/magic-links.server";
import { getUser } from "~/models/user.server";
import { commitSession, getSession } from "~/sessions";
import { classNames } from "~/utils/misc";
import { validateform } from "~/utils/validation";
import { v4 as uuid4 } from "uuid";
import { PrimaryInput } from "~/components/Input";
import { requireLoggedOutUser } from "~/utils/auth.server";

const loginSchema = z.object({
  email: z.string().email(),
});

export const loader: LoaderFunction = async ({ request }) => {
  await requireLoggedOutUser(request);
  return null;
};

export const action: ActionFunction = async ({ request }) => {
  await requireLoggedOutUser(request); // prevent user from generating magic link if it's already logged in
  const formData = await request.formData();
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);

  return validateform(
    formData,
    loginSchema,
    async ({ email }) => {
      const nonce = uuid4();
      session.set("nonce", nonce); // using session.flash will cause issue if we refresh the validate-magic-link route
      const link = generateMagicLink(email, nonce);
      // console.log(link, "what is link");
      return json(
        { message: "ok", magicLink: link },
        {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        }
      );
    },
    (errors) => json({ errors, email: formData.get("email") }, { status: 400 })
  );
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="text-center mt-36 ">
      <h1 className="text-3xl mb-8"> Remix Recipes Login </h1>

      {actionData?.magicLink ? (
        <Link
          to={actionData?.magicLink}
          className="block w-fit mx-auto my-4 py-2 px-4 rounded-md bg-blue-500 text-white"
        >
          {" "}
          Click Here to Proceed
        </Link>
      ) : (
        <form method="post" className="mx-auto md:w-1/3">
          <div className="text-left pb-4">
            <PrimaryInput
              type="email"
              name="email"
              placeholder="Email"
              defaultValue={actionData?.email}
              autoComplete="off"
            />
            <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
          </div>
          <Button otherClass="bg-primary border-none hover:bg-primary-light mx-auto">
            {" "}
            Login / Sign Up
          </Button>
        </form>
      )}
    </div>
  );
}
