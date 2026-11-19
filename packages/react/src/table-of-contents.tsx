import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Link, type TableOfContentsItem, type TableOfContentsProps } from "./index.js";

function OutlineLinks({ items, activeId }: { items: readonly TableOfContentsItem[]; activeId?: string }) {
  return <ol className="flood-table-of-contents__list" role="list">
    {items.map(item => <li key={item.id}>
      <Link href={`#${encodeURIComponent(item.id)}`} aria-current={item.id === activeId ? "location" : undefined}>{item.label}</Link>
      {item.children && item.children.length > 0 && <OutlineLinks items={item.children} activeId={activeId} />}
    </li>)}
  </ol>;
}

function flatten(items: readonly TableOfContentsItem[]): TableOfContentsItem[] {
  return items.flatMap(item => [item, ...flatten(item.children ?? [])]);
}

export const PageOutline = /* @__PURE__ */ forwardRef<HTMLElement, TableOfContentsProps>(function PageOutline(
  { items, label = "On this page", activeId, scrollRootRef, activationOffset = 0, className, ...props }, ref,
) {
  const node = useRef<HTMLElement>(null);
  const [tracked, setTracked] = useState<string>();
  const hasItems = items.length > 0;
  useImperativeHandle(ref, () => node.current!, [hasItems]);

  useEffect(() => {
    if (activeId !== undefined) return;
    const owner = node.current?.ownerDocument;
    const view = owner?.defaultView;
    if (!owner || !view) return;
    const root = scrollRootRef?.current;
    const scroller = root ?? owner.scrollingElement;
    const targets = flatten(items).flatMap(({ id }) => {
      const target = owner.getElementById(id);
      return target && (!root || root.contains(target)) ? [{ id, target }] : [];
    });
    const listener = root ?? view;
    let frame = 0;
    const read = () => {
      frame = 0;
      const origin = root ? root.getBoundingClientRect().top + root.clientTop : 0;
      const paddingValue = scroller ? view.getComputedStyle(scroller).scrollPaddingTop : "0";
      const padding = (parseFloat(paddingValue) || 0) *
        (paddingValue.endsWith("%") ? (scroller?.clientHeight ?? 0) / 100 : 1);
      const visibleTargets = targets.filter(({ target }) => target.getClientRects().length > 0);
      let next: string | undefined = visibleTargets[0]?.id;
      for (const { id, target } of visibleTargets) {
        const margin = parseFloat(view.getComputedStyle(target).scrollMarginTop) || 0;
        if (target.getBoundingClientRect().top <= origin + Math.max(activationOffset, padding + margin) + 1) next = id;
      }
      if (scroller && scroller.scrollTop > 0 && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 1) {
        next = visibleTargets.at(-1)?.id;
      }
      setTracked(next);
    };
    const schedule = () => { if (!frame) frame = view.requestAnimationFrame(read); };
    schedule();
    listener.addEventListener("scroll", schedule, { passive: true });
    view.addEventListener("resize", schedule);
    view.addEventListener("hashchange", schedule);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    observer?.observe(root ?? owner.body);
    if (root?.firstElementChild) observer?.observe(root.firstElementChild);
    return () => {
      observer?.disconnect();
      view.cancelAnimationFrame(frame);
      listener.removeEventListener("scroll", schedule);
      view.removeEventListener("resize", schedule);
      view.removeEventListener("hashchange", schedule);
    };
  }, [activeId, activationOffset, items, scrollRootRef]);

  if (!hasItems) return null;
  return <nav {...props} ref={node} aria-label={label} className={["flood-table-of-contents", className].filter(Boolean).join(" ")}>
    <OutlineLinks items={items} activeId={activeId === undefined ? tracked : activeId ?? undefined} />
  </nav>;
});
