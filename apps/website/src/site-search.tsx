import { useEffect, useRef, useState } from "react";
import { CommandPalette, SearchTrigger } from "@flood-md/react";
import { BookOpen, Boxes, Layers3, Rows3 } from "lucide-react";

const glyphs = { Component: Boxes, Recipe: Rows3, Guide: BookOpen, Collection: Layers3 };

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<typeof import("./site-search-model")>();
  const [error, setError] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

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
    function onShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey ||
          !(event.metaKey || event.ctrlKey) || (event.code !== "KeyK" && event.key.toLowerCase() !== "k") ||
          document.querySelector("dialog:modal")) return;
      event.preventDefault();
      trigger.current?.click();
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  const items = (open ? model?.searchSite(query) ?? [] : []).map(entry => {
    const Icon = glyphs[entry.kind];
    return { id: entry.id, label: entry.label, icon: <Icon />,
      description: entry.kind + " · " + entry.description,
      group: query.trim() ? undefined : "Explore Flood",
      keywords: [query],
    };
  });

  return <CommandPalette title="Search Flood" searchLabel="Search components, recipes and guides" items={items}
    placeholder="Try DataTable or bulk edit…" open={open} className="site-search"
    trigger={props => <SearchTrigger {...props} ref={trigger} label="Search Flood"
      shortcut={["Ctrl/⌘", "K"]} aria-keyshortcuts="Control+K Meta+K" className="site-search-trigger" size="sm" variant="subtle" />}
    query={query} onQueryChange={setQuery} loading={!model && !error}
    emptyMessage={error ? "Search couldn’t load. Reopen it to retry." : "No results. Try a component name or a task like bulk edit."}
    onOpenChange={changeOpen} onAction={id => window.location.assign(id)} />;
}
