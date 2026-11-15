import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Tag, type TagGroupProps } from "./index.js";
import { useSelectionTags } from "./selection-tags.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A controlled list of labels or removable tags with optional overflow disclosure. */
export const TagList = /* @__PURE__ */ forwardRef<HTMLUListElement, TagGroupProps>(function TagList({
  label, items, size = "md", disabled = false, onRemove, maxVisibleTags, moreTagsLabel, fewerTagsLabel,
  className, tabIndex = -1, ...props
}, forwardedRef) {
  if (!label.trim() || new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood TagGroup requires a name and unique tag IDs with nonempty labels");
  }
  const list = useRef<HTMLUListElement>(null);
  const pendingRemoval = useRef<{id: string; index: number; button: Element} | null>(null);
  useImperativeHandle(forwardedRef, () => list.current!, []);
  const toggleSize = size === "sm" ? "2xs" : size === "md" ? "xs" : "sm";
  const { visible, overflow } = useSelectionTags(items, {maxVisibleTags, moreTagsLabel, fewerTagsLabel}, disabled, undefined, toggleSize);

  useBrowserLayoutEffect(() => {
    const pending = pendingRemoval.current;
    const root = list.current;
    if (!pending || !root || items.some(item => item.id === pending.id)) return;
    pendingRemoval.current = null;
    if (pending.button.isConnected || root.ownerDocument.activeElement !== root.ownerDocument.body) return;
    const actions = root.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    const next = actions[Math.min(pending.index, actions.length - 1)] ?? root;
    next.focus({preventScroll: true});
  }, [items]);

  return <ul {...props} ref={list} role="list" aria-label={label} tabIndex={tabIndex}
    className={["flood-tag-group", className].filter(Boolean).join(" ")}>
    {visible.map(item => <li key={`tag-${item.id}`} data-tag-id={item.id}>
      <Tag size={size} icon={item.icon} avatar={item.avatar} disabled={disabled || item.disabled} removeLabel={item.removeLabel}
        onRemove={onRemove && (() => {
          const root = list.current;
          const focused = root?.ownerDocument.activeElement;
          const row = focused?.closest("[data-tag-id]");
          if (root && focused && row?.parentElement === root && row.getAttribute("data-tag-id") === item.id) {
            const actions = Array.from(root.querySelectorAll("button:not(:disabled)"));
            pendingRemoval.current = {id: item.id, index: actions.indexOf(focused), button: focused};
          }
          onRemove(item.id);
        })}>{item.label}</Tag>
    </li>)}
    {overflow && <li key="overflow">{overflow}</li>}
  </ul>;
});
