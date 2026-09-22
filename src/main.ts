import "./styles.css";
import App from "./App.svelte";
import { mount } from "svelte";
import { observeScrollActivity } from "./scrollActivity";

const stopScrollActivity = observeScrollActivity(document);
import.meta.hot?.dispose(stopScrollActivity);

const target = document.getElementById("app")!;
const developmentParams = new URLSearchParams(window.location.search);
if (import.meta.env.DEV && developmentParams.get("preview") === "app-shell") {
  const requestedTheme = developmentParams.get("theme");
  if (requestedTheme === "light" || requestedTheme === "dark") {
    document.documentElement.dataset.theme = requestedTheme;
  }
  void import("./components/AppShellPreview.svelte").then(({ default: AppShellPreview }) => {
    mount(AppShellPreview, { target });
  });
} else if (import.meta.env.DEV && developmentParams.has("ui-kit")) {
  const requestedTheme = developmentParams.get("theme");
  if (requestedTheme === "light" || requestedTheme === "dark") {
    document.documentElement.dataset.theme = requestedTheme;
  }
  void import("./components/DesignSystemGallery.svelte").then(({ default: DesignSystemGallery }) => {
    mount(DesignSystemGallery, { target });
  });
} else {
  mount(App, { target });
}
