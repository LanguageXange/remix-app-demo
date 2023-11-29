import { json, type LoaderFunction } from "@remix-run/node";
import { getMagicPayload } from "~/magic-links.server";

// 1. we need to decrypt / parse the magic link payload
// 2. validate the payload
// 3. set the session cookie if the user exists
// 4. create a new user if the user doesn't exist
export const loader: LoaderFunction = ({ request }) => {
  const magicLinkPayload = getMagicPayload(request);
  console.log(magicLinkPayload, "what is magic link payload");
  return json("ok");
};

export default function MagicLinkRoute() {
  return <div>Magic Link Verification</div>;
}
