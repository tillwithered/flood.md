import { Fragment, forwardRef, useId, useState } from "react";
import { ListBox, Section, Split, Text, type VersionHistoryProps } from "./index.js";

export const VersionHistoryPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, VersionHistoryProps>(function VersionHistoryPanel(
  { label, versions, currentId, currentLabel = "Current", value, defaultValue, onValueChange,
    renderPreview, renderRestore, emptyContent = <Text size="compact" tone="subtle">No versions yet.</Text>, ...props }, ref,
) {
  const previewId = useId();
  const [local, setLocal] = useState(defaultValue);
  const byId = new Map(versions.map(version => [version.id, version]));
  if (!label.trim() || !currentLabel.trim() || byId.size !== versions.length ||
      versions.some(version => !version.id.trim() || !version.label.trim())) {
    throw new Error("Flood VersionHistory requires a named list and uniquely named versions");
  }
  const current = currentId === undefined ? undefined : byId.get(currentId);
  const requestedId = value ?? local;
  const selected = (requestedId === undefined ? undefined : byId.get(requestedId)) ?? current ?? versions[0];
  if (!selected) return <div {...props} ref={ref}>{emptyContent}</div>;

  const choose = (id: string | string[]) => {
    if (typeof id !== "string" || !byId.has(id) || id === selected.id) return;
    if (value === undefined) setLocal(id);
    onValueChange?.(id);
  };
  const restore = selected.id !== currentId ? renderRestore?.(selected) : undefined;

  return <Split {...props} ref={ref} side="start" gap="4" collapseAt="sm"
    aside={<ListBox label={label} hideLabel aria-controls={previewId} selectionBehavior="manual" controlSize="sm"
      value={selected.id} onValueChange={choose}
      options={versions.map(version => ({
        value: version.id,
        label: version.label,
        description: version.id === currentId
          ? [currentLabel, version.description].filter(Boolean).join(" · ")
          : version.description,
      }))} />}
    main={<Section id={previewId} title={selected.label} headingSize="group" description={selected.description}
      actions={restore == null ? undefined : <Fragment key={selected.id}>{restore}</Fragment>}>
      <Fragment key={selected.id}>{renderPreview(selected)}</Fragment>
    </Section>} />;
});
