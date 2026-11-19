import { forwardRef } from "react";
import { Badge, DataList, DataListItem, DescriptionList, Section, Stack, Text, type AccessSummaryProps } from "./index.js";

const labels = {
  read: "View only",
  write: "Edit",
  "read-write": "View and edit",
  none: "No access",
};

export const AccessSummaryPanel = /* @__PURE__ */ forwardRef<HTMLElement, AccessSummaryProps>(function AccessSummaryPanel(
  { actor, scope, actingFor, permissions, labels: copy, className, headingSize = "group", ...props }, ref,
) {
  const ids = new Set(permissions.map(permission => permission.id));
  if (!actor.trim() || !scope.trim() || ids.size !== permissions.length ||
      permissions.some(permission => !permission.id.trim() || !permission.resource.trim())) {
    throw new Error("Flood AccessSummary requires an actor, scope and uniquely identified resources");
  }
  const facts = [{ id: "scope", term: copy?.scope ?? "Scope", description: scope }];
  if (actingFor?.trim()) {
    facts.push({ id: "acting-for", term: copy?.actingFor ?? "Acting for", description: actingFor });
  }
  return <Section {...props} ref={ref} title={actor} headingSize={headingSize}
    className={["flood-access-summary", className].filter(Boolean).join(" ")}>
    <Stack gap="3">
      <DescriptionList items={facts} layout="columns" />
      {permissions.length ? <DataList className="flood-access-summary__permissions"
        aria-label={copy?.permissions ?? "Permissions"} density="compact" dividers={false}>
        {permissions.map(permission => <DataListItem key={permission.id} layout="content" title={permission.resource}
          description={permission.description}
          metadata={<Badge size="sm" variant={permission.access === "none" ? "outline" : "subtle"}
            tone={permission.access === "write" || permission.access === "read-write" ? "info" : "neutral"}>
            {copy?.access?.[permission.access] ?? labels[permission.access]}
          </Badge>} />)}
      </DataList> : <Text as="p" size="compact" tone="subtle">{copy?.empty ?? "No permissions to display."}</Text>}
    </Stack>
  </Section>;
});
