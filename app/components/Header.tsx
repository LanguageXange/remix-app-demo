import type { LinksFunction } from "@remix-run/node";
import styles from "./header.css";
export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return <h1 className="header">{title}</h1>;
}
