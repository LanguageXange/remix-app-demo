import type { LinksFunction } from "@remix-run/node";
import { Header, links as headerLinks } from "~/components/Header";
// const arr = [
// {rel:"stylesheet", href:""},
// {rel:"icon", href:"/icons/favicon.ico"},
// {rel:"preload", href:"/images/xxx.png", as:"image"},
// {rel:"preload", href:"", as:"script"},
// ]

export const links: LinksFunction = () => {
  return [...headerLinks()];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Header title="Welcome" />
    </div>
  );
}
