import { Layout } from "~/components/Layout";

const links = [
  { to: "recipes", text: "Recipes" },
  { to: "pantry", text: "Pantry" },
  { to: "grocery-list", text: "Grocery List" },
];

export default function App() {
  return <Layout title="My App" links={links} />;
}
