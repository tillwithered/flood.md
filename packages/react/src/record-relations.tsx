import { forwardRef, useId } from "react";
import { DataList, DataListItem, Heading, Link, Stack, StatusIndicator, Text, type RecordRelationsProps } from "./index.js";

export const RelatedRecords = /* @__PURE__ */ forwardRef<HTMLDivElement, RecordRelationsProps>(function RelatedRecords(
  { label, groups, groupHeadingLevel = 3, emptyContent, className, ...props }, ref,
) {
  const groupId = useId();
  if (!label.trim() || new Set(groups.map(group => group.id)).size !== groups.length ||
      groups.some(group => !group.id.trim() || !group.label.trim())) {
    throw new Error("Flood RecordRelations requires a label and named groups with unique nonempty IDs");
  }
  const populated = groups.filter(group => group.items.length > 0);
  if (populated.some(({items}) => new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.title.trim()))) {
    throw new Error("Flood RecordRelations requires a title and unique nonempty record IDs within each group");
  }

  return <Stack {...props} ref={ref} role="group" aria-label={label} gap="4"
    className={["flood-record-relations", className].filter(Boolean).join(" ")}>
    {populated.length ? populated.map((group, index) => {
      const headingId = `${groupId}-${index}`;
      return <Stack key={group.id} gap="0">
        <Heading id={headingId} level={groupHeadingLevel} size="group" dir="auto">{group.label}</Heading>
        <DataList density="compact" dividers={false} aria-labelledby={headingId}>
          {group.items.map(item => {
            const identity = <>
              {item.reference?.trim() && <><Text size="helper" tone="subtle" className="flood-record-relations__reference">
                <bdi>{item.reference}</bdi>
              </Text>{" "}</>}
              <bdi>{item.title}</bdi>
            </>;
            return <DataListItem key={item.id} layout="content"
              title={item.href ? <Link className="flood-record-relations__link" href={item.href}>{identity}</Link> : identity}
              metadata={item.status && <StatusIndicator {...item.status} size="sm" presentation="wrap" />} />;
          })}
        </DataList>
      </Stack>;
    }) : emptyContent}
  </Stack>;
});
