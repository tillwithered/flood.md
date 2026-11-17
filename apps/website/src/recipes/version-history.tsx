"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDialog, Badge, Button, ChangeList, DataList, DataListItem, EmptyState, Inline, Section, Stack, Text, Timestamp, type ChangeListItem } from "@flood-md/react";

export interface RecordVersion {
  id: string;
  title: string;
  author: string;
  dateTime: string;
  /** The selected snapshot's fields compared with the accepted current version. */
  changes: readonly ChangeListItem[];
}

export function VersionHistory({ versions, currentId, onRestore }: {
  versions: readonly RecordVersion[];
  currentId: string;
  /** Create a new version from the source, if the supplied current ID still matches. */
  onRestore?: (sourceId: string, expectedCurrentId: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const [confirmation, setConfirmation] = useState<{ version: RecordVersion; base: string }>();
  const [restoring, setRestoring] = useState(false);
  const [failure, setFailure] = useState<string>();
  const selectedButton = useRef<HTMLButtonElement>(null);
  const restoreButton = useRef<HTMLButtonElement | null>(null);
  const selected = versions.find(version => version.id === selectedId) ?? versions.find(version => version.id === currentId);
  const comparing = Boolean(selected && selected.id !== currentId);
  const hasRestoreTarget = comparing && Boolean(selected?.changes.length);
  useEffect(() => {
    if (!hasRestoreTarget) setConfirmation(undefined);
  }, [hasRestoreTarget]);

  async function restore() {
    if (!confirmation || confirmation.base !== currentId || restoring || !onRestore) return;
    const { version, base } = confirmation;
    setConfirmation(undefined);
    setRestoring(true);
    setFailure(undefined);
    try {
      await onRestore(version.id, base);
      const opener = restoreButton.current;
      if (opener?.ownerDocument.activeElement === opener) selectedButton.current?.focus({ preventScroll: true });
    } catch {
      setFailure(`Could not restore ${version.title}. Review the current version and try again.`);
    } finally {
      setRestoring(false);
    }
  }

  if (!selected) return <EmptyState title="No versions yet" density="compact" layout="inline"/>;

  return <Stack gap="4">
    <DataList aria-label="Version history" density="compact" dividers={false}>
      {versions.map(version => <DataListItem key={version.id}
        title={<Button size="sm" variant={selected.id === version.id ? "subtle" : "ghost"}
          ref={selected.id === version.id ? selectedButton : undefined}
          aria-current={selected.id === version.id ? "true" : undefined}
          onClick={() => setSelectedId(version.id)}>{version.title}</Button>}
        description={<Inline gap="2"><Text as="span" size="helper" tone="subtle">{version.author}</Text><Timestamp dateTime={version.dateTime} format="date-time" size="helper"/></Inline>}
        metadata={currentId === version.id && <Badge size="sm">Current</Badge>}/>)}
    </DataList>
    {comparing && <Section title="Changes from current"
      actions={onRestore && hasRestoreTarget && <AlertDialog title={confirmation ? `Restore ${confirmation.version.title}?` : "Restore a version"}
        description={confirmation?.base === currentId
          ? "This creates a new version from the selected snapshot. The existing history is preserved."
          : "The current version changed. Close this dialog and review the updated comparison."}
        confirmLabel="Restore version" confirmDisabled={confirmation?.base !== currentId}
        open={Boolean(confirmation)} onOpenChange={open => setConfirmation(open ? { version: selected, base: currentId } : undefined)}
        onConfirm={() => void restore()}
        getFallbackFocus={() => selectedButton.current}
        trigger={trigger => <Button {...trigger} size="sm" variant="subtle" loading={restoring ? "retain-focus" : false}
          onClick={event => {
            restoreButton.current = event.currentTarget;
            trigger.onClick?.(event);
          }}>
          Restore this version
        </Button>}/>}>
      {selected.changes.length
          ? <ChangeList aria-label="Changes compared with the current version" items={selected.changes} density="compact"
            valueLayout="adaptive" labels={{ before: "Current", after: "Selected" }}/>
          : <Text as="p" tone="subtle" size="compact">This version matches the current content.</Text>}
    </Section>}
    {failure && <Alert appearance="inline" tone="error" announcement="polite">{failure}</Alert>}
  </Stack>;
}
