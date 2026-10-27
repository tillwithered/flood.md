import { forwardRef } from "react";
import type { DescriptionListProps, TableProps } from "./index.js";
import { ScrollArea } from "./index.js";

export const DescribedData = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(function DescribedData(
  { items, layout, density, dividers, className, ...props }, ref,
) {
  if (items.some(item => !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length)
    throw new Error("Flood description items require unique nonempty IDs");
  return <dl {...props} ref={ref} className={["flood-description-list", className].filter(Boolean).join(" ")}
    data-layout={layout} data-density={density} data-dividers={dividers}>
    {items.map(item => <div key={item.id} className="flood-description-list__item">
      <dt>{item.term}</dt><dd>{item.description}</dd>
    </div>)}
  </dl>;
});

export const TabularData = /* @__PURE__ */ forwardRef<HTMLTableElement, TableProps>(function TabularData(
  { caption, children, hideCaption, density, striped, scrollLabel, className, hidden, dir, lang, ...props }, ref,
) {
  return <div className="flood-table-container" hidden={hidden} dir={dir} lang={lang}>
    <ScrollArea orientation="horizontal" aria-label={scrollLabel ?? caption}>
      <table {...props} ref={ref} hidden={hidden} dir={dir} lang={lang}
        className={["flood-table", className].filter(Boolean).join(" ")} data-density={density} data-striped={striped}>
        <caption className={hideCaption ? "flood-visually-hidden" : undefined}>{caption}</caption>
        {children}
      </table>
    </ScrollArea>
  </div>;
});
