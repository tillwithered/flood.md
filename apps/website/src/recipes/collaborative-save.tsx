"use client";

import { useRef, useState } from "react";
import { Alert, AvatarGroup, Button, ChangeList, Dialog, Field, FormActions, Inline, Input, SaveStatus, Section, Stack, Text, Textarea, type AvatarGroupItem } from "@flood-md/react";

export interface CollaborativeFields {
  title: string;
  summary: string;
}

export interface CollaborativeSnapshot extends CollaborativeFields {
  revision: string;
}

type SaveResult = { kind: "saved" | "conflict"; snapshot: CollaborativeSnapshot };

export function CollaborativeSave({ initial, editors, onSave }: {
  initial: CollaborativeSnapshot;
  editors: readonly AvatarGroupItem[];
  onSave: (draft: CollaborativeFields, expectedRevision: string) => Promise<SaveResult>;
}) {
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState<CollaborativeFields>({ title: initial.title, summary: initial.summary });
  const [latest, setLatest] = useState<CollaborativeSnapshot>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pending = useRef(false);
  const title = useRef<HTMLInputElement>(null);
  const dirty = draft.title !== baseline.title || draft.summary !== baseline.summary;
  const proposed = latest && {
    title: draft.title === baseline.title ? latest.title : draft.title,
    summary: draft.summary === baseline.summary ? latest.summary : draft.summary,
  };

  function edit<K extends keyof CollaborativeFields>(key: K, value: CollaborativeFields[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setState("idle");
  }

  async function save() {
    if (pending.current || !dirty || latest) return;
    pending.current = true;
    setState("saving");
    try {
      const result = await onSave(draft, baseline.revision);
      if (result.kind === "conflict") {
        setLatest(result.snapshot);
        setState("idle");
      } else {
        setBaseline(result.snapshot);
        setDraft({ title: result.snapshot.title, summary: result.snapshot.summary });
        setState("saved");
      }
    } catch {
      setState("error");
    } finally {
      pending.current = false;
    }
  }

  function resolveConflict(useLatest: boolean) {
    if (!latest || !proposed) return;
    setBaseline(latest);
    setDraft(useLatest ? { title: latest.title, summary: latest.summary } : proposed);
    setLatest(undefined);
    setReviewOpen(false);
  }

  const fields = [{ key: "title", label: "Title" }, { key: "summary", label: "Summary" }] as const;
  const changes = latest && proposed ? fields.filter(({ key }) => proposed[key] !== latest[key]).map(({ key, label }) => ({
    id: key, label, before: latest[key], after: proposed[key],
  })) : [];

  return <Section title="Edit report" actions={editors.length > 0 && <AvatarGroup label="People editing this report"
    size="sm" max={3} items={editors} overflowPresentation="popover" overflowTitle="Editing this report"/>}>
    <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <Stack gap="4">
        <Field label="Title" required>{field => <Input {...field} ref={title} value={draft.title} readOnly={state === "saving"}
          onChange={event => edit("title", event.currentTarget.value)}/>}</Field>
        <Field label="Summary">{field => <Textarea {...field} value={draft.summary} rows={3} readOnly={state === "saving"}
          onChange={event => edit("summary", event.currentTarget.value)}/>}</Field>
        {latest && <Alert appearance="inline" tone="warning" announcement="polite"
          action={<Dialog title="Review save conflict" open={reviewOpen} onOpenChange={setReviewOpen}
            getFallbackFocus={() => title.current}
            trigger={trigger => <Button {...trigger} size="sm" variant="subtle">Review changes</Button>}>
            <Stack gap="4">
              {changes.length ? <ChangeList aria-label="Latest and draft values" items={changes} valueLayout="stacked"
                labels={{ before: "Latest saved", after: "Your draft", added: "Added in your draft", removed: "Removed in your draft" }}/>
                : <Text as="p">Your draft matches the latest saved version.</Text>}
              <Inline gap="2">
                {changes.length > 0 && <Button size="sm" onClick={() => resolveConflict(false)}>Keep my edits</Button>}
                <Button size="sm" variant={changes.length ? "subtle" : "solid"} onClick={() => resolveConflict(true)}>
                  {changes.length ? "Discard my edits" : "Use this version"}
                </Button>
              </Inline>
            </Stack>
          </Dialog>}>
          A newer version was saved. Your draft is still here.
        </Alert>}
        <FormActions status={<SaveStatus state={state === "idle" && dirty && !latest ? "dirty" : state}/>}
          primary={<Button type="submit" size="sm" disabled={Boolean(latest) || !dirty}
            loading={state === "saving" ? "retain-focus" : false}>{state === "error" ? "Retry save" : "Save changes"}</Button>}/>
      </Stack>
    </form>
  </Section>;
}
