import { json, redirect, type LoaderFunction } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { PrimaryInput } from "~/components/Input";
import { getMagicPayload, invalidMessage } from "~/magic-links.server";
import { createUser, getUser } from "~/models/user.server";
import { getSession, commitSession } from "~/sessions";
import { classNames } from "~/utils/misc";
import { validateform } from "~/utils/validation";

const MAGICLINK_MAX_AGE = 1000 * 60 * 10; // this means 10 min

const signUpSchema = z.object({
  firstName: z.string().min(1, "name cannot be blank"),
  lastName: z.string().min(1, "name cannot be blank"),
});

export const action = async ({ request }) => {
  const formData = await request.formData(); // from the sign up form, we have firstName, lastName

  // create a new user and set the cookie userId, unset nonce, and redirect to /app
  return validateform(
    formData,
    signUpSchema,
    async ({ firstName, lastName }) => {
      const { email } = getMagicPayload(request);
      const user = await createUser(email, firstName, lastName);

      const cookieHeader = request.headers.get("cookie");
      const session = await getSession(cookieHeader);
      session.set("userId", user.id);
      session.unset("nonce");

      return redirect("/app", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    },
    (errors) =>
      json(
        {
          errors,
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
        },
        { status: 400 }
      )
  );
};

export const loader: LoaderFunction = async ({ request }) => {
  const magicLinkPayload = getMagicPayload(request); // return the decrypted payload

  // check that payload hasn't expired
  const createdAt = new Date(magicLinkPayload.createdAt);
  const expiresAt = createdAt.getTime() + MAGICLINK_MAX_AGE;
  if (Date.now() > expiresAt) {
    throw invalidMessage("magic link has expired!");
  }

  // validate nonce
  // get nonce from the cookie and see if it matches from the magic link
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  if (session.get("nonce") !== magicLinkPayload.nonce) {
    throw invalidMessage("invalid nonce");
  }

  // check if user exists
  const user = await getUser(magicLinkPayload.email);
  if (user) {
    session.set("userId", user.id);
    session.unset("nonce"); // manually unsetting nonce since we are not using `session.flash`
    return redirect("/app", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  return json("ok", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

export default function MagicLinkRoute() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="text-2xl my-8"> You're almost done</h1>
        <h2>Type in your name below to complete the sign up process</h2>
        <form
          method="post"
          className={classNames(
            "flex flex-col px-8 mx-16 md:mx-auto",
            "border-2 border-gray-300 rounded-md p-8 mt-8 md:w-80"
          )}
        >
          <fieldset className="mb-8 flex flex-col">
            <div className="text-left mb-4">
              <label htmlFor="firstName"> First Name</label>
              <PrimaryInput
                placeholder="Enter your first name"
                id="firstName"
                name="firstName"
                autoComplete="off"
                defaultValue={actionData?.firstName}
              />
              <ErrorMessage>{actionData?.errors?.firstName}</ErrorMessage>
            </div>

            <div className="text-left">
              <label htmlFor="lastName"> Last Name</label>
              <PrimaryInput
                placeholder="Enter your last name"
                id="lastName"
                name="lastName"
                autoComplete="off"
                defaultValue={actionData?.lastName}
              />
              <ErrorMessage>{actionData?.errors?.lastName}</ErrorMessage>
            </div>
          </fieldset>
          <Button otherClass="bg-blue-500 hover:bg-blue-400">Sign Up</Button>
        </form>
      </div>
    </div>
  );
}
