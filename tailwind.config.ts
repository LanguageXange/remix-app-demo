import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00743e",
        "primary-light": "#4c9d77",
        background: "#fff",
      },
    },
  },
  plugins: [],
} satisfies Config;
