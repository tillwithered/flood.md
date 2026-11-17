"use client";

import { useState } from "react";
import {
  Alert, Button, ChangeList, Dialog, FormActions, List, MessageComposer,
  Section, Stack, Text, ToggleGroup, type ChangeListItem, type MessageAttachment,
} from "@flood-md/react";

type Channel = "public" | "internal";
export type ReplyDraft = {
  text: string;
  attachments: readonly MessageAttachment[];
  fieldChanges: readonly ChangeListItem[];
};
type Macro = { label: string; channel: Channel; draft: ReplyDraft };
const channels = [
  { value: "public", label: "Public reply" },
  { value: "internal", label: "Internal note" },
];

interface ReplyProps {
  recordId: string;
  channel: Channel;
  drafts: Readonly<Record<Channel, ReplyDraft>>;
  macro?: Macro;
  pending?: boolean;
  error?: string;
  onChannelChange: (channel: Channel) => void;
  onDraftChange: (recordId: string, channel: Channel, draft: ReplyDraft) => void;
  onAttach?: (recordId: string, channel: Channel, files: File[]) => void;
  onSubmit: (recordId: string, channel: Channel, draft: ReplyDraft) => void;
}

export function TicketReply(props: ReplyProps) {
  return <Reply key={JSON.stringify([props.recordId, props.channel])} {...props} />;
}

function Reply({ recordId, channel, drafts, macro, pending, error, onChannelChange, onDraftChange, onAttach, onSubmit }: ReplyProps) {
  const [preview, setPreview] = useState(false);
  const draft = drafts[channel];
  const target = channel === "public" ? "Public reply" : "Internal note";
  const suggested = macro?.channel === channel ? macro : undefined;
  const update = (next: ReplyDraft) => onDraftChange(recordId, channel, next);
  return <Stack gap="3">
    <ToggleGroup label="Reply channel" selectionMode="single" value={[channel]} options={channels}
      onValueChange={([next]) => {
        if (next === "public" || next === "internal") onChannelChange(next);
      }} />
    {suggested && <Dialog title={suggested.label} description={`Applies to ${target.toLowerCase()}.`} open={preview} onOpenChange={setPreview}
      trigger={props => <Button {...props} size="sm" variant="subtle" disabled={pending}>Preview macro</Button>}>
      <Stack gap="4">
        {suggested.draft.fieldChanges.length > 0 && <ChangeList items={suggested.draft.fieldChanges} valueLayout="adaptive" />}
        <ChangeList items={[{ id: "reply", label: target, before: draft.text || undefined, after: suggested.draft.text }]}
          valueLayout="stacked" labels={{ before: "Current draft", after: "Macro draft" }} />
        {suggested.draft.attachments.length > 0 && <Section title="Attachments" headingSize="group">
          <List>{suggested.draft.attachments.map(file => <li key={file.id}><Text size="compact">{file.label}</Text></li>)}</List>
        </Section>}
        <FormActions
          secondary={<Button variant="subtle" onClick={() => setPreview(false)}>Cancel</Button>}
          primary={<Button disabled={pending} onClick={() => {
            update({ ...suggested.draft, attachments: [...draft.attachments, ...suggested.draft.attachments.filter(
              file => !draft.attachments.some(existing => existing.id === file.id),
            )] });
            setPreview(false);
          }}>Apply to draft</Button>}
        />
      </Stack>
    </Dialog>}
    <MessageComposer label={target} value={draft.text} disabled={pending} attachments={draft.attachments}
      sendPresentation="label" sendLabel={channel === "public" ? "Send reply" : "Add note"}
      onFilesSelect={onAttach && (files => onAttach(recordId, channel, files))}
      onValueChange={text => update({ ...draft, text })}
      onRemoveAttachment={id => update({ ...draft, attachments: draft.attachments.filter(file => file.id !== id) })}
      onSend={() => onSubmit(recordId, channel, draft)} />
    {error && <Alert tone="error" announcement="polite">{error}</Alert>}
  </Stack>;
}
