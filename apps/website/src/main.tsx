import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";
import { loadSitePage } from "./site-pages";

async function start() {
  const root = document.getElementById("root")!;
  const path = window.location.pathname;
  const app = <App path={path} {...await loadSitePage(path)} />;
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
void start();
