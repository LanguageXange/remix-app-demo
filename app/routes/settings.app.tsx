import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { themeCookie } from "~/cookies.server";
import { validateform } from "~/utils/validation";

const themeSchema = z.object({
  themeColor: z.string(),
});

export const action = async ({ request }) => {
  const formData = await request.formData();
  const btnAction = formData.get("_action");
  switch (btnAction) {
    case "saveThemeColor":
      return validateform(
        formData,
        themeSchema,
        async ({ themeColor }) => {
          return json(
            { themeColor },
            {
              headers: {
                "Set-Cookie": await themeCookie.serialize(themeColor),
              },
            }
          );
        },
        (errors) => json({ errors }, { status: 400 })
      );
    default:
      return null;
  }
};
export const loader = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie");
  const themeColor = await themeCookie.parse(cookieHeader);
  // if no cookie set , theme color defaults to green
  return { themeColor: typeof themeColor !== "string" ? "green" : themeColor };
};

export default function SettingApp() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post" reloadDocument>
      <div className="mb-4 flex flex-col">
        <label htmlFor="themeColor">Theme</label>
        <select
          id="themeColor"
          name="themeColor"
          className="p-2 mt-2 border-2 border-gray-200 rounded-md w-full md:w-64"
          defaultValue={actionData?.themeColor ?? loaderData.themeColor}
        >
          <option value="green">Green</option>
          <option value="pink">Pink</option>
          <option value="gray">Gray</option>
          <option value="orange">Orange</option>
          <option value="yellow">Yellow</option>
          <option value="blue">Blue</option>
          <option value="purple">Purple</option>
        </select>
      </div>
      <Button
        otherClass="bg-primary hover:bg-primary-light"
        name="_action"
        value="saveThemeColor"
      >
        {" "}
        Save Theme Color
      </Button>
    </Form>
  );
}
