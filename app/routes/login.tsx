import {
  json,
  type ActionFunction,
  type HeadersFunction,
} from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { ErrorMessage } from "~/components/ErrorMessage";
import { classNames } from "~/utils/misc";
import { validateform } from "~/utils/validation";

const loginSchema = z.object({
  email: z.string().email(),
});

export const headers: HeadersFunction = () => ({
  "Set-Cookie": "remix-recipes-cookie=myValue",
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  return validateform(
    formData,
    loginSchema,
    () => {},
    (errors) => json({ errors, email: formData.get("email") }, { status: 400 })
  );
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="text-center mt-36">
      <h1 className="text-3xl mb-8"> Remix Recipes Login </h1>
      <form method="post" className="mx-auto md:w-1/3">
        <div className="text-left pb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            defaultValue={actionData?.email}
            autoComplete="off"
            className={classNames(
              "w-full outline-none border-2 border-gray-200",
              "focus:border-primary rounded-lg p-2"
            )}
          />
          <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
        </div>
        <Button otherClass="bg-primary border-none hover:bg-primary-light">
          {" "}
          Login{" "}
        </Button>
      </form>
    </div>
  );
}
