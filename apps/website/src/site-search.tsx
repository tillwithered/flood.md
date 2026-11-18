import { useEffect, useRef, useState } from "react";
import { CommandPalette, IconSlot, InputGroup, KeyboardShortcut, SearchTrigger, type CommandListItem } from "@flood-md/react";
import { BookOpen, Boxes, Layers3, Rows3, Search } from "lucide-react";

const glyphs = { Component: Boxes, Recipe: Rows3, Guide: BookOpen, Collection: Layers3 };

const browseItems: readonly CommandListItem[] = [
  { id: "query:DataTable", label: "DataTable", group: "Try a search", icon: <Search /> },
  { id: "query:bulk edit", label: "Bulk edit", group: "Try a search", icon: <Search /> },
  { id: "query:saved filters", label: "Saved filters", group: "Try a search", icon: <Search /> },
];

type Keyboard = { modifier: "Meta" | "Control"; hint: string; touch: boolean };

function getKeyboard(device: Navigator): Keyboard {
  const clientHints = (device as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } }).userAgentData;
  const platform = clientHints?.platform || device.platform;
  const apple = /Mac|iP(?:ad|hone|od)/i.test(platform);
  const touch = clientHints?.mobile === true || /Android|iP(?:ad|hone|od)/i.test(platform + " " + device.userAgent) ||
    (apple && device.maxTouchPoints > 1);
  return { modifier: apple ? "Meta" : "Control", hint: apple ? "⌘" : "Ctrl", touch };
}

export function SiteSearch({ placement = "header" }: { placement?: "home" | "header" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [keyboard, setKeyboard] = useState<Keyboard>();
  const [model, setModel] = useState<typeof import("./site-search-model")>();
  const [error, setError] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const homeEntry = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const shortcut = keyboard && !keyboard.touch ? [keyboard.hint, "K"] : undefined;
  const shortcutLabel = keyboard ? keyboard.modifier + "+K" : undefined;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
    } else if (!model) {
      setError(false);
      void import("./site-search-model").then(setModel, () => setError(true));
    }
  }

  useEffect(() => {
    const keyboard = getKeyboard(navigator);
    setKeyboard(keyboard);
    function onShortcut(event: KeyboardEvent) {
      const modifierMatches = keyboard.modifier === "Meta" ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey ||
          !modifierMatches || (event.code !== "KeyK" && event.key.toLowerCase() !== "k") ||
          document.querySelector("dialog:modal")) return;
      event.preventDefault();
      (homeEntry.current ?? trigger.current)?.click();
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  const browsing = !query.trim();
  const items = browsing ? browseItems : (model?.searchSite(query) ?? []).map(entry => {
    const Icon = glyphs[entry.kind];
    return { id: entry.id, label: entry.label, icon: <Icon />,
      description: entry.kind + " · " + entry.description, keywords: [query] };
  });

  function selectResult(id: string) {
    if (id.startsWith("query:")) {
      setOpen(true);
      setQuery(id.slice("query:".length));
      return;
    }
    window.location.assign(id);
  }

  return <CommandPalette title="Search Flood" open={open} className="site-search" items={items}
    getFallbackFocus={() => homeEntry.current}
    trigger={props => placement === "home" ?
      <InputGroup type="search" ref={homeEntry} className="home-search-input" aria-label="Search Flood"
        aria-controls={props["aria-controls"]} aria-haspopup="dialog" aria-keyshortcuts={shortcutLabel}
        placeholder="Search the library…" autoComplete="off" spellCheck={false}
        controlSize="xl" value={query}
        start={<IconSlot size="sm"><Search /></IconSlot>}
        end={shortcut && <KeyboardShortcut keys={shortcut} aria-hidden="true" />}
        onClick={() => changeOpen(true)}
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
          if (event.key !== "Enter" || composing.current || event.nativeEvent.isComposing) return;
          event.preventDefault();
          changeOpen(true);
        }} /> : <SearchTrigger {...props} ref={trigger} label="Search Flood"
      shortcut={shortcut} aria-keyshortcuts={shortcutLabel}
      className="site-search-trigger" fullWidth size="md" variant="subtle" />}
    onOpenChange={changeOpen} searchLabel="Search components, recipes and guides"
    placeholder="Search the library…" query={query} onQueryChange={setQuery}
    loading={!browsing && !model && !error}
    emptyMessage={error ? "Search couldn’t load. Reopen it to retry." : "No results. Try a component name or a task like bulk edit."}
    onAction={selectResult} />;
}
