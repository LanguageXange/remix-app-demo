import type { LinksFunction } from "@remix-run/node";
import { Header, links as headerLinks } from "~/components/Header";
export const links: LinksFunction = () => {
  return [...headerLinks()];
};

export default function Discover() {
  return (
    <div>
      <Header title="Discover" />
    </div>
  );
}
