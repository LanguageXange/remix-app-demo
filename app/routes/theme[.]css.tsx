import { type LoaderFunctionArgs } from "@remix-run/node";
import { themeCookie } from "~/cookies.server";

// this is a resource route - doesn't participate in the U

function getTheme(color: string) {
  switch (color) {
    case "pink": {
      return {
        colorPrimary: "#f224f2",
        colorPrimaryLight: "#e224e2",
      };
    }
    case "gray": {
      return {
        colorPrimary: "#615e61",
        colorPrimaryLight: "#7e7b7e",
      };
    }
    case "orange": {
      return {
        colorPrimary: "#ff4b00",
        colorPrimaryLight: "#ff814d",
      };
    }
    case "yellow": {
      return {
        colorPrimary: "#cc9800",
        colorPrimaryLight: "#ffbf00",
      };
    }
    case "blue": {
      return {
        colorPrimary: "#01a3e1",
        colorPrimaryLight: "#30c5fe",
      };
    }
    case "purple": {
      return {
        colorPrimary: "#5325c0",
        colorPrimaryLight: "#8666d2",
      };
    }
    default: {
      return {
        colorPrimary: "#00743e",
        colorPrimaryLight: "#4c9d77",
      };
    }
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const cookieValue = await themeCookie.parse(cookieHeader);
  const theme = getTheme(cookieValue);
  const data = `
  :root{
    --color-primary:${theme.colorPrimary};
    --color-primary-light:${theme.colorPrimaryLight}
  }
  `;
  return new Response(data, { headers: { "Content-Type": "text/css" } });
}
