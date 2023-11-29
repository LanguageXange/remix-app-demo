import { json } from "@remix-run/node";
import Cryptr from "cryptr";
if (typeof process.env.MAGIC_LINK_SECRET !== "string") {
  throw new Error("Missing env: MAGIC_LINK_SECRET");
}

const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

type MagicLinkPayload = {
  email: string;
  nonce: string;
  createdAt: string;
};

export function generateMagicLink(email: string, nonce: string) {
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createdAt: new Date().toISOString(),
  };

  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  if (typeof process.env.ORIGIN !== "string") {
    throw new Error("Missing env: ORIGIN");
  }
  const url = new URL(process.env.ORIGIN);
  url.pathname = "/validate-magic-link";
  url.searchParams.set("magic", encryptedPayload);
  return url.toString();
}

// helper function
function isMagicLinkPayload(value: any): value is MagicLinkPayload {
  return (
    typeof value === "object" &&
    typeof value.email === "string" &&
    typeof value.nonce === "string" &&
    typeof value.createdAt === "string"
  );
}

function invalidMessage(message: string) {
  return json({ message }, { status: 400 });
}

export function getMagicPayload(request: Request) {
  const url = new URL(request.url);
  const payload = url.searchParams.get("magic");
  if (typeof payload !== "string") {
    throw invalidMessage("magic search param does not exist");
  }
  const decryptedPayload = JSON.parse(cryptr.decrypt(payload));

  if (!isMagicLinkPayload(decryptedPayload)) {
    throw invalidMessage("invalid magic link payload");
  }

  return decryptedPayload;
}
