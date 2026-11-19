import { forwardRef, useId, useState } from "react";
import { DataList, DataListItem, Heading, KeyboardShortcut, SearchInput, Stack, Text, type ShortcutReferenceProps } from "./index.js";

export const ShortcutReferencePanel = /* @__PURE__ */ forwardRef<HTMLDivElement, ShortcutReferenceProps>(function ShortcutReferencePanel(
  { groups, searchLabel = "Search shortcuts", clearLabel, sequenceSeparator, headingLevel = 3,
    emptyLabel = "No shortcuts available.", noMatchesLabel = "No matching shortcuts.", className, ...props }, ref,
) {
  const [query, setQuery] = useState("");
  const groupBaseId = useId();
  const term = query.trim().toLocaleLowerCase(props.lang);
  const words = term.split(/\s*\+\s*(?=\S)|\s+/u).filter(Boolean);
  const hasItems = groups.some(group => group.items.length > 0);
  const visibleGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!words.length) return true;
      const keys = typeof item.keys === "string" ? item.keys
        : item.keys.map(key => typeof key === "string" ? key : key.join(" "))
          .join(typeof item.keys[0] === "string" ? " " : ` ${sequenceSeparator ?? "then"} `);
      const fields = [group.label, item.label, keys, item.spokenKeys, ...(item.keywords ?? [])]
        .map(value => value?.toLocaleLowerCase(props.lang) ?? "");
      return words.every(word => fields.some(field => {
        if (Array.from(word).length > 1) return field.includes(word);
        return field.match(/[\p{L}\p{N}\p{M}]+|[^\s]/gu)?.includes(word) ?? false;
      }));
    }),
  })).filter(group => group.items.length > 0);

  return <Stack {...props} ref={ref} gap="4" className={["flood-shortcut-reference", className].filter(Boolean).join(" ")}>
    {hasItems
      ? <SearchInput aria-label={searchLabel} placeholder={searchLabel} clearLabel={clearLabel} controlSize="sm"
        value={query} onChange={event => setQuery(event.currentTarget.value)} />
      : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
    {hasItems && words.length > 0 && visibleGroups.length === 0 && <Text role="status" size="compact" tone="subtle">{noMatchesLabel}</Text>}
    {visibleGroups.map(group => {
      const headingId = `${groupBaseId}-${group.id}`;
      return <Stack key={group.id} gap="1">
        <Heading id={headingId} level={headingLevel} size="group">{group.label}</Heading>
        <DataList aria-labelledby={headingId} density="compact" dividers={false}>
          {group.items.map(item => <DataListItem key={item.id} title={item.label}
            metadata={<KeyboardShortcut keys={item.keys} label={item.spokenKeys} sequenceSeparator={sequenceSeparator} />} />)}
        </DataList>
      </Stack>;
    })}
  </Stack>;
});
