import { forwardRef, useMemo, useState } from "react";
import {
  CodeSnippet, Collapsible, CopyButton, InlineCode, SearchInput, Stack, Tree,
  type JsonInspectorProps, type JsonValue, type TreeItem,
} from "./index.js";

interface JsonNode {
  id: string;
  pointer: string;
  label: string;
  description: string;
  searchable: string;
  value: JsonValue;
  children: JsonNode[];
}

function describeJson(value: JsonValue, label: string, pointer: string, depth = 0): JsonNode {
  if (depth > 128) throw new RangeError("Flood JsonInspector supports up to 128 levels of JSON");
  if (typeof value === "number" && !Number.isFinite(value))
    throw new TypeError("Flood JsonInspector requires finite JSON numbers");
  const encode = (key: string) => key.replace(/~/g, "~0").replace(/\//g, "~1");
  const children = Array.isArray(value)
    ? value.map((child, index) => describeJson(child, String(index), `${pointer}/${index}`, depth + 1))
    : value !== null && typeof value === "object"
      ? Object.entries(value).map(([key, child]) => describeJson(child, key.trim() ? key : JSON.stringify(key), `${pointer}/${encode(key)}`, depth + 1))
      : [];
  const branch = value !== null && typeof value === "object";
  const kind = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  const serialized = branch ? "" : JSON.stringify(value);
  const preview = serialized.length > 120 ? `${serialized.slice(0, 119)}…` : serialized;
  const description = branch ? `${kind} (${children.length})` : kind === "null" ? kind : `${kind} · ${preview}`;
  return { id: JSON.stringify(pointer), pointer, label, value, children, description, searchable: `${label} ${serialized}`.toLocaleLowerCase() };
}

function projectJson(root: JsonNode, query: string, defaultDepth: number) {
  const expanded: string[] = [];
  const nodes = new Map<string, JsonNode>();
  function project(node: JsonNode, depth: number, includeDescendants: boolean): { item: TreeItem; matched: boolean } | undefined {
    const directMatch = Boolean(query) && node.searchable.includes(query);
    const keepSubtree = includeDescendants || directMatch;
    const descendants = node.children.map(child => project(child, depth + 1, keepSubtree)).filter(child => child !== undefined);
    const matchedDescendant = descendants.some(child => child.matched);
    if (query && !keepSubtree && !matchedDescendant) return;
    if (descendants.length && (query ? matchedDescendant : depth < defaultDepth)) expanded.push(node.id);
    nodes.set(node.id, node);
    return {
      item: { value: node.id, label: node.label, description: node.description, children: descendants.map(child => child.item) },
      matched: directMatch || matchedDescendant,
    };
  }
  const result = project(root, 0, false);
  return { items: result ? [result.item] : [], expanded, nodes };
}

export const StructuredJsonInspector = /* @__PURE__ */ forwardRef<HTMLDivElement, JsonInspectorProps>(function StructuredJsonInspector({
  label, value, rootLabel = "Root", defaultExpandedDepth = 1, searchable = true, labels, onSelectionChange,
  className, ...props
}, ref) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<string>();
  const [normalExpansion, setNormalExpansion] = useState<string[]>();
  const [searchExpansion, setSearchExpansion] = useState<string[]>();
  const [showValue, setShowValue] = useState(false);
  const search = searchable ? query.trim().toLocaleLowerCase() : "";
  const names = {
    search: labels?.search ?? "Search JSON",
    clearSearch: labels?.clearSearch ?? "Clear JSON search",
    noResults: labels?.noResults ?? "No matching keys or values.",
    copy: labels?.copy ?? "Copy selected JSON",
    copied: labels?.copied ?? "Copied",
    copyError: labels?.copyError ?? "Could not copy JSON",
    path: labels?.path ?? "JSON Pointer",
    showValue: labels?.showValue ?? "Selected value",
  };
  if (![label, rootLabel, ...Object.values(names)].every(text => text.trim()))
    throw new Error("Flood JsonInspector requires nonempty labels");
  if (!Number.isSafeInteger(defaultExpandedDepth) || defaultExpandedDepth < 0 || defaultExpandedDepth > 128)
    throw new RangeError("Flood JsonInspector defaultExpandedDepth must be an integer from 0 to 128");

  const root = useMemo(() => describeJson(value, rootLabel, ""), [value, rootLabel]);
  const tree = useMemo(() => projectJson(root, search, defaultExpandedDepth), [root, search, defaultExpandedDepth]);
  const selected = tree.nodes.get(selection ?? root.id);
  const selectedJson = useMemo(() => selected ? JSON.stringify(selected.value, null, 2) : "", [selected]);
  const expandedValues = (search ? searchExpansion : normalExpansion) ?? tree.expanded;

  function select(id: string | string[]) {
    if (typeof id !== "string") return;
    const node = tree.nodes.get(id);
    if (!node) return;
    setSelection(id);
    onSelectionChange?.(node.pointer, node.value);
  }

  return <Stack {...props} ref={ref} role={props.role ?? "group"} aria-label={props["aria-label"] ?? label} gap="2"
    className={["flood-json-inspector", className].filter(Boolean).join(" ")}>
    {searchable && <SearchInput aria-label={names.search} placeholder={names.search} clearLabel={names.clearSearch}
      controlSize="sm" value={query} onChange={event => { setQuery(event.currentTarget.value); setSearchExpansion(undefined); }} />}
    <Tree hideLabel label={label} items={tree.items} value={selected?.id ?? ""} onValueChange={select}
      expandedValues={expandedValues} onExpandedValuesChange={search ? setSearchExpansion : setNormalExpansion}
      controlSize="sm" emptyMessage={names.noResults} />
    {selected && <Collapsible title={names.showValue} controlSize="sm" variant="flush" open={showValue}
      onOpenChange={setShowValue}
      headerAction={<CopyButton size="sm" variant="ghost" iconOnly value={selectedJson} copyLabel={names.copy}
        copiedLabel={names.copied} errorLabel={names.copyError} />}>
      <Stack gap="2">
        <InlineCode size="sm" className="flood-json-inspector__path" aria-label={names.path}>
          {JSON.stringify(selected.pointer)}
        </InlineCode>
        {showValue && <CodeSnippet code={selectedJson} aria-label={names.showValue} className="flood-json-inspector__code" />}
      </Stack>
    </Collapsible>}
  </Stack>;
});
