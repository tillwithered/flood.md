import { usesDocumentation } from "../site-guides.mjs";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";

async function start() {
  const root = document.getElementById("root")!;
  const path = window.location.pathname;
  const documentation = usesDocumentation(path)
    ? (await import("./documentation")).default : undefined;
  const app = <App path={path} documentation={documentation} />;
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
void start();
