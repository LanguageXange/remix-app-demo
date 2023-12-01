// redirect to app/pantry

import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

// export const loader: LoaderFunction = () => {
//   return new Response(null, {
//     status: 302,
//     headers: {
//       Location: "/app/pantry",
//     },
//   });
// };

export const loader: LoaderFunction = () => {
  return redirect("/app/recipes", 302);
};
