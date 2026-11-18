import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import routes from "./generated/routes.json";
import { loadSitePage, type PageContent } from "./site-pages";

type SiteRoute = { title: string; description: string; canonical: string; indexable: boolean };
const pages: Record<string, SiteRoute> = routes;
const navigationEvent = "flood:site-navigation";
const loadingDelay = 140;
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function navigateSite(href: string) {
  const request = new CustomEvent<string>(navigationEvent, { cancelable: true, detail: href });
  if (window.dispatchEvent(request)) window.location.assign(href);
}

export function routeLabel(path: string) {
  return pages[path]?.title.replace(/ — flood\.md$/, "");
}

interface Route extends PageContent {
  path: string;
  revision: number;
  restore?: number;
}

interface HistoryEntry {
  floodPageKey?: string;
  floodScrollTop?: number;
}

function pageKey() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function currentEntry(history: History): HistoryEntry & { floodPageKey: string } {
  const saved: HistoryEntry | null = history.state;
  if (saved?.floodPageKey) return { ...saved, floodPageKey: saved.floodPageKey };
  const entry = { ...saved, floodPageKey: pageKey() };
  history.replaceState(entry, "");
  return entry;
}

function pageURL(href: string): URL | undefined {
  const url = new URL(href, location.href);
  return url.origin === location.origin && Object.hasOwn(pages, url.pathname) ? url : undefined;
}

function focusDestination(viewport: HTMLElement) {
  const main = viewport.querySelector<HTMLElement>("#main-content, main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
  main.setAttribute("data-route-focus", "");
  main.addEventListener("blur", () => main.removeAttribute("data-route-focus"), { once: true });
  main.focus({ preventScroll: true });
  if (document.activeElement !== main) main.removeAttribute("data-route-focus");
}

function scrollToFragment(viewport: HTMLElement) {
  try {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && viewport.contains(target) && target.getClientRects().length) {
      target.scrollIntoView({ behavior: "instant" });
    }
  } catch {
    // Malformed fragments leave the reader at the start of the route.
  }
}

export function useSiteNavigation(initial: PageContent & { path: string }, pageScroll: RefObject<HTMLDivElement | null>) {
  const [route, setRoute] = useState<Route>(() => ({ ...initial, revision: 0 }));
  const [pending, setPending] = useState<string>();

  useBrowserLayoutEffect(() => {
    const viewport = pageScroll.current;
    if (!viewport) return;
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const saved = route.revision
      ? route.restore
      : entry?.type === "back_forward" ? (history.state as HistoryEntry | null)?.floodScrollTop : undefined;
    if (saved !== undefined || route.revision) viewport.scrollTop = saved ?? 0;
    if (route.revision) focusDestination(viewport);
    if (saved !== undefined || !location.hash) return;
    scrollToFragment(viewport);
    if (route.revision || document.fonts.status === "loaded") return;
    let active = true;
    void document.fonts.ready.then(() => { if (active) scrollToFragment(viewport); });
    return () => { active = false; };
  }, [pageScroll, route]);

  useBrowserLayoutEffect(() => {
    if (pending && pageScroll.current) pageScroll.current.scrollTop = 0;
  }, [pageScroll, pending]);

  useEffect(() => {
    const viewport = pageScroll.current;
    if (!viewport) return;
    const history = window.history;
    const originalRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let entry = currentEntry(history);
    let committedPath = initial.path;
    let request = 0;
    let waiting = false;
    let loadingTimer: number | undefined;
    let saveTimer: number | undefined;
    const scrollPositions = new Map<string, number>();

    function rememberScroll() {
      clearTimeout(saveTimer);
      saveTimer = undefined;
      if (waiting) return;
      const top = viewport!.scrollTop;
      scrollPositions.set(entry.floodPageKey, top);
      const saved = history.state as HistoryEntry | null;
      if (saved?.floodPageKey === entry.floodPageKey && saved.floodScrollTop !== top) {
        history.replaceState({ ...saved, floodScrollTop: top }, "");
      }
    }
    function queueSave() { if (!waiting) saveTimer ??= window.setTimeout(rememberScroll, 250); }
    function clearLoading() {
      clearTimeout(loadingTimer);
      loadingTimer = undefined;
    }
    function open(url: URL, mode: "push" | "pop") {
      rememberScroll();
      clearLoading();
      const revision = ++request;
      const restoreEntry = mode === "pop" ? currentEntry(history) : undefined;
      const restore = restoreEntry
        ? scrollPositions.get(restoreEntry.floodPageKey) ?? restoreEntry.floodScrollTop
        : undefined;
      waiting = true;
      setPending(current => current ? url.pathname : undefined);
      loadingTimer = window.setTimeout(() => setPending(url.pathname), loadingDelay);
      void loadSitePage(url.pathname).then(content => {
        if (revision !== request) return;
        clearLoading();
        if (mode === "push") {
          entry = { floodPageKey: pageKey() };
          history.pushState(entry, "", url);
        } else if (restoreEntry) entry = restoreEntry;
        committedPath = url.pathname;
        waiting = false;
        setRoute({ ...content, path: url.pathname, revision, restore });
        setPending(undefined);
        const meta = pages[url.pathname];
        document.title = meta.title;
        document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
        document.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.canonical);
        document.querySelector('meta[name="robots"]')?.setAttribute("content", meta.indexable ? "index, follow" : "noindex, follow");
      }).catch(() => {
        if (revision !== request) return;
        clearLoading();
        if (mode === "pop") location.reload();
        else location.assign(url);
      });
    }
    function requestPage(url: URL) {
      const samePage = url.pathname === location.pathname && url.search === location.search;
      if (samePage && url.hash) {
        rememberScroll();
        return false;
      }
      if (samePage && url.href === location.href && committedPath === url.pathname) {
        ++request;
        clearLoading();
        waiting = false;
        setPending(undefined);
      } else open(url, "push");
      return true;
    }
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("ping") ||
          (anchor.target && anchor.target !== "_self") || anchor.relList.contains("external")) return;
      const url = pageURL(anchor.href);
      if (url && requestPage(url)) event.preventDefault();
    }
    function onNavigation(event: Event) {
      const url = pageURL((event as CustomEvent<string>).detail);
      if (url && requestPage(url)) event.preventDefault();
    }
    function onPop() {
      const url = pageURL(location.href);
      if (!url) { location.reload(); return; }
      if (url.pathname === committedPath && !waiting) {
        rememberScroll();
        entry = currentEntry(history);
        const saved = scrollPositions.get(entry.floodPageKey) ?? entry.floodScrollTop;
        if (saved !== undefined) viewport!.scrollTop = saved;
      } else open(url, "pop");
    }
    function onHashChange() {
      if (!waiting) entry = currentEntry(history);
    }
    function scrollUnfocusedPage(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.metaKey || document.activeElement !== document.body ||
          document.querySelector("dialog:modal")) return;
      const positions: Record<string, number> = {
        ArrowDown: viewport!.scrollTop + 40,
        ArrowUp: viewport!.scrollTop - 40,
        PageDown: viewport!.scrollTop + viewport!.clientHeight,
        PageUp: viewport!.scrollTop - viewport!.clientHeight,
        Home: 0,
        End: viewport!.scrollHeight,
        " ": viewport!.scrollTop + (event.shiftKey ? -1 : 1) * viewport!.clientHeight,
      };
      if (!Object.hasOwn(positions, event.key)) return;
      event.preventDefault();
      viewport!.scrollTop = positions[event.key];
    }

    viewport.addEventListener("scroll", queueSave, { passive: true });
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", scrollUnfocusedPage);
    window.addEventListener(navigationEvent, onNavigation);
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("pagehide", rememberScroll);
    return () => {
      ++request;
      clearLoading();
      clearTimeout(saveTimer);
      history.scrollRestoration = originalRestoration;
      viewport.removeEventListener("scroll", queueSave);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", scrollUnfocusedPage);
      window.removeEventListener(navigationEvent, onNavigation);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("pagehide", rememberScroll);
    };
  }, [initial.path, pageScroll]);

  return { route, pending };
}
