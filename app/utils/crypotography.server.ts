import crypto from "crypto"; // this is a built in node js module we don't need to install
export function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
