import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-light": "var(--color-primary-light)",
        background: "#fff",
        "btn-primary": "#0d6efd",
        "btn-primary-light": "#3682f3",
        "btn-danger": "#ff2222",
        "btn-danger-light": "#da606b",
      },
    },
  },
  plugins: [],
} satisfies Config;
