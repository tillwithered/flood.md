import { useCallback, useEffect, useRef, useState } from "react";
import { CommandList, Dialog, IconSlot, InputGroup, KeyboardShortcut, Tabs, type CommandListItem } from "@flood-md/react";
import { BookOpen, Boxes, ChartNoAxesColumn, Layers3, LayoutGrid, ListChecks, PanelsTopLeft, Rows3, Search, SlidersHorizontal, Terminal } from "lucide-react";
import { recipeCategories } from "./recipe-directory";
import type { SearchScope } from "./site-search-model";

const glyphs = { Component: Boxes, Recipe: Rows3, Guide: BookOpen, Collection: Layers3 };

const scopes = [
  { id: "all", label: "Explore", icon: Search },
  { id: "categories", label: "Categories", icon: LayoutGrid },
  { id: "components", label: "Components", icon: Boxes },
  { id: "recipes", label: "Recipes", icon: Rows3 },
  { id: "docs", label: "Docs", icon: BookOpen },
] as const;

const workflows: readonly CommandListItem[] = [
  { id: "/docs/recipes/form-submission", label: "Form submission", description: "Validate and submit forms", group: "Common workflows", icon: <ListChecks /> },
  { id: "/docs/recipes/collection-views", label: "Collection views", description: "Save filters and columns", group: "Common workflows", icon: <SlidersHorizontal /> },
  { id: "/docs/recipes/table-bulk-actions", label: "Table bulk actions", description: "Act on several records at once", group: "Common workflows", icon: <Rows3 /> },
];
const families: readonly CommandListItem[] = [
  { id: "/components/category/forms", label: "Forms", group: "Component families", icon: <ListChecks /> },
  { id: "/components/category/navigation", label: "Navigation", group: "Component families", icon: <PanelsTopLeft /> },
  { id: "/components/category/charts", label: "Charts", group: "Component families", icon: <ChartNoAxesColumn /> },
  { id: "/components/category/overlays", label: "Overlays", group: "Component families", icon: <Layers3 /> },
];
const browseItems: Record<SearchScope, readonly CommandListItem[]> = {
  all: [...workflows, ...families],
  categories: [
    ...recipeCategories.map(category => ({ id: `/recipes/${category.id}`, label: category.label,
      description: `${category.recipes.length} recipes`, group: "Categories" })),
    { id: "/categories", label: "Browse all categories", group: "Categories" },
  ],
  components: [...families,
    { id: "/components/data-table", label: "DataTable", description: "Inspect, sort and select records", group: "Components", icon: <Rows3 /> },
    { id: "/components/command-palette", label: "CommandPalette", description: "Searchable actions and navigation", group: "Components", icon: <Search /> },
    { id: "/components", label: "Browse all components", group: "Components", icon: <Boxes /> },
  ],
  recipes: [
    { id: "/recipes/tables", label: "Tables & records", group: "Workflows", icon: <Rows3 /> },
    { id: "/recipes/forms", label: "Forms & settings", group: "Workflows", icon: <ListChecks /> },
    { id: "/recipes/workspace", label: "Workspaces", group: "Workflows", icon: <PanelsTopLeft /> },
    { id: "/recipes", label: "Browse all recipes", group: "Workflows", icon: <Rows3 /> },
  ],
  docs: [
    { id: "/docs/installation", label: "Installation", description: "Set up Flood in React or Next.js", group: "Get started", icon: <Terminal /> },
    { id: "/docs/mcp", label: "Connect your agent", description: "Use the library from your coding agent", group: "Get started", icon: <Boxes /> },
    { id: "/docs/foundations", label: "Foundations", description: "Typography, tokens and surfaces", group: "Design guidance", icon: <BookOpen /> },
    { id: "/docs/theming", label: "Customization", description: "Adapt Flood to your project", group: "Design guidance", icon: <SlidersHorizontal /> },
  ],
};

type Keyboard = { modifier: "Meta" | "Control"; hint: string; touch: boolean };

function getKeyboard(device: Navigator): Keyboard {
  const clientHints = (device as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } }).userAgentData;
  const platform = clientHints?.platform || device.platform;
  const apple = /Mac|iP(?:ad|hone|od)/i.test(platform);
  const touch = clientHints?.mobile === true || /Android|iP(?:ad|hone|od)/i.test(platform + " " + device.userAgent) ||
    (apple && device.maxTouchPoints > 1);
  return { modifier: apple ? "Meta" : "Control", hint: apple ? "⌘" : "Ctrl", touch };
}

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [returnedFocus, setReturnedFocus] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [narrow, setNarrow] = useState(false);
  const [keyboard, setKeyboard] = useState<Keyboard>();
  const [model, setModel] = useState<typeof import("./site-search-model")>();
  const [error, setError] = useState(false);
  const entry = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const shortcut = keyboard && !keyboard.touch ? [keyboard.hint, "K"] : undefined;
  const shortcutLabel = keyboard ? keyboard.modifier + "+K" : undefined;

  const finishClose = useCallback(() => {
    setReturnedFocus(true);
    setOpen(false);
    setClosing(false);
    setQuery("");
    setScope("all");
  }, []);

  function changeOpen(next: boolean) {
    if (!next) {
      if (window.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches ||
          panel.current?.closest('[data-flood-motion="reduce"]')) finishClose();
      else setClosing(true);
      return;
    }
    setClosing(false);
    setOpen(true);
    if (!model) {
      setError(false);
      void import("./site-search-model").then(setModel, () => setError(true));
    }
  }

  useEffect(() => {
    if (!closing) return;
    const dialog = panel.current;
    const exit = dialog?.getAnimations?.().find(animation =>
      "transitionProperty" in animation && animation.transitionProperty === "opacity");
    if (!exit) { finishClose(); return; }
    let current = true;
    function complete() { if (current && dialog?.hasAttribute("data-closing")) finishClose(); }
    void exit.finished.then(complete, complete);
    return () => { current = false; };
  }, [closing, finishClose]);

  useEffect(() => {
    const keyboard = getKeyboard(navigator);
    setKeyboard(keyboard);
    const mobile = window.matchMedia("(max-width: 40rem)");
    const syncOrientation = () => setNarrow(mobile.matches);
    syncOrientation();
    mobile.addEventListener("change", syncOrientation);
    function onShortcut(event: KeyboardEvent) {
      const modifierMatches = keyboard.modifier === "Meta" ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey ||
          !modifierMatches || (event.code !== "KeyK" && event.key.toLowerCase() !== "k")) return;
      const modal = document.querySelector("dialog:modal");
      if (modal && (modal !== panel.current || !modal.hasAttribute("data-closing"))) return;
      const opener = entry.current;
      if (!opener) return;
      event.preventDefault();
      if (!modal) opener.focus({ preventScroll: true });
      opener.click();
    }
    document.addEventListener("keydown", onShortcut);
    return () => {
      mobile.removeEventListener("change", syncOrientation);
      document.removeEventListener("keydown", onShortcut);
    };
  }, []);

  const browsing = !query.trim();
  const items = browsing ? browseItems[scope] : (model?.searchSite(query, scope) ?? []).map(entry => {
    const Icon = glyphs[entry.kind];
    return { id: entry.id, label: entry.label, icon: <Icon />,
      description: entry.kind + " · " + entry.description, keywords: [query] };
  });
  const searchPanel = <CommandList ref={searchInput} label="Search components, recipes and guides" hideLabel
    controlSize="md" items={items} placeholder={scope === "all" ? "Search the library…" : `Search ${scope}…`}
    query={query} onQueryChange={setQuery}
    onPointerMoveCapture={event => {
      if (event.pointerType === "mouse" && event.target instanceof Element && event.target.closest('[role="option"]')) {
        event.stopPropagation();
      }
    }}
    loading={!browsing && !model && !error}
    emptyMessage={error ? "Search couldn’t load. Reopen it to retry." : scope === "all"
      ? "No results. Try a component name or a task like bulk edit."
      : `No results in ${scope}. Choose All to search the whole library.`}
    onAction={id => window.location.assign(id)} />;

  return <Dialog ref={panel} title="Search Flood" open={open} className="site-search" data-closing={closing || undefined}
    data-browsing={browsing || undefined} data-scope={scope}
    initialFocusRef={searchInput}
    getFallbackFocus={() => entry.current}
    trigger={props =>
      <InputGroup type="search" ref={entry} className="site-search-input" aria-label="Search Flood"
        aria-controls={props["aria-controls"]} aria-haspopup="dialog" aria-keyshortcuts={shortcutLabel}
        placeholder="Search the library…" autoComplete="off" spellCheck={false}
        controlSize="md" value={query} data-returned-focus={returnedFocus || undefined}
        start={<IconSlot size="sm"><Search /></IconSlot>}
        end={shortcut && <KeyboardShortcut keys={shortcut} aria-hidden="true" />}
        onClick={() => changeOpen(true)}
        onBlur={() => setReturnedFocus(false)}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={event => {
          composing.current = false;
          setQuery(event.currentTarget.value);
          changeOpen(true);
        }}
        onChange={event => {
          setQuery(event.currentTarget.value);
          if (!composing.current) changeOpen(true);
        }}
        onKeyDown={event => {
          setReturnedFocus(false);
          if (event.key !== "Enter" || composing.current || event.nativeEvent.isComposing) return;
          event.preventDefault();
          changeOpen(true);
        }} />}
    onOpenChange={changeOpen}>
    <div className="site-search-layout">
      <div className="site-search-icon" aria-hidden="true"><IconSlot size="md"><Search /></IconSlot></div>
      <Tabs className="site-search-tabs" label="Search scope" variant="round" controlSize="sm"
        orientation={narrow ? "horizontal" : "vertical"} value={scope}
        onValueChange={next => { const tab = scopes.find(item => item.id === next); if (tab) setScope(tab.id); }}
        items={scopes.map(({ id, label, icon: Icon }) => ({ value: id, label: id === "all" && !browsing ? "All" : label,
          icon: narrow ? undefined : <Icon />, content: id === scope ? searchPanel : null }))} />
    </div>
  </Dialog>;
}
