import { forwardRef, useEffect, useRef } from "react";
import type { DescriptionListProps, TableProps } from "./index.js";
import { ScrollArea } from "./index.js";

export const DescribedData = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(function DescribedData(
  { items, layout, density, dividers, className, ...props }, ref,
) {
  if (items.some(item => typeof item.id !== "string" || !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length)
    throw new Error("Flood description items require unique nonempty IDs");
  return <dl {...props} ref={ref} className={["flood-description-list", className].filter(Boolean).join(" ")}
    data-layout={layout} data-density={density} data-dividers={dividers}>
    {items.map(item => <div key={item.id} className="flood-description-list__item">
      <dt>{item.term}</dt><dd>{item.description}</dd>
    </div>)}
  </dl>;
});

export const TabularData = /* @__PURE__ */ forwardRef<HTMLTableElement, TableProps>(function TabularData(
  { caption, children, hideCaption, density, striped, scrollLabel, cellVerticalAlign, maxViewportHeight, stickyHeader, className, hidden, dir, lang, ...props }, ref,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const scrollVertically = maxViewportHeight !== undefined;
  const pinHeader = scrollVertically && stickyHeader;
  useEffect(() => {
    const node = viewport.current;
    const header = node?.querySelector("table")?.tHead;
    if (!pinHeader || !node || !header) return;
    const update = () => { node.style.scrollPaddingBlockStart = `${header.offsetHeight}px`; };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => {
      observer.disconnect();
      node.style.removeProperty("scroll-padding-block-start");
    };
  }, [pinHeader, children]);

  return <div className="flood-table-container" hidden={hidden} dir={dir} lang={lang}>
    <ScrollArea ref={viewport} orientation={scrollVertically ? "both" : "horizontal"}
      contentInset={scrollVertically ? "scrollbar" : undefined}
      tabIndex={scrollVertically ? 0 : undefined} style={scrollVertically ? { maxBlockSize: maxViewportHeight } : undefined}
      aria-label={scrollLabel ?? caption}
      onFocus={pinHeader ? event => {
        const target = event.target;
        const header = event.currentTarget.querySelector("table")?.tHead;
        if (header && target !== event.currentTarget && !header.contains(target) &&
            !target.closest("[popover], dialog[open]") && target.getBoundingClientRect().top < header.getBoundingClientRect().bottom) {
          target.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } : undefined}>
      <table {...props} ref={ref} hidden={hidden} dir={dir} lang={lang}
        className={["flood-table", className].filter(Boolean).join(" ")} data-density={density} data-striped={striped} data-cell-vertical-align={cellVerticalAlign}
        data-sticky-header={pinHeader || undefined}>
        <caption className={hideCaption ? "flood-visually-hidden" : undefined}>{caption}</caption>
        {children}
      </table>
    </ScrollArea>
  </div>;
});
