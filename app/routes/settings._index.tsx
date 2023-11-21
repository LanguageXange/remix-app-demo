import { Link } from "@remix-run/react";

export default function Settings() {
  return (
    <div>
      <nav>
        <Link to="app">App</Link>
        <Link to="profile">profile</Link>
      </nav>
    </div>
  );
}
