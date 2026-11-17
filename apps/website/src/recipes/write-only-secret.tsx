"use client";

import { useRef, useState } from "react";
import {
  Alert, Button, Dialog, Field, FormActions, PasswordInput, SettingRow,
  Stack, StatusIndicator,
} from "@flood-md/react";

interface WriteOnlySecretProps {
  label: string;
  stored: boolean;
  /** The host verifies access and writes directly to the secret store. */
  onReplace: (replacement: string) => Promise<void>;
}

export function WriteOnlySecret({ label, stored, onReplace }: WriteOnlySecretProps) {
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const action = stored ? "Replace secret" : "Store secret";

  function close() {
    setDraft("");
    setFailed(false);
    setOpen(false);
  }

  async function save() {
    if (!draft.length || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await onReplace(draft);
      close();
    } catch {
      setFailed(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <SettingRow label={label}
    value={<StatusIndicator label={stored ? "Secret stored" : "No secret stored"} tone={stored ? "success" : "neutral"} />}
    action={<Dialog title={action} open={open} initialFocusRef={input} closeOnOutsideClick={false}
      onOpenChange={next => {
        if (next) setOpen(true);
        else if (!submitting.current) close();
      }}
      trigger={trigger => <Button {...trigger} size="sm" variant="subtle" aria-label={`${action}: ${label}`}>{action}</Button>}>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <Stack gap="4">
          <Field label="New value" required>
            {field => <PasswordInput {...field} ref={input} value={draft} readOnly={busy}
              autoComplete="new-password" onChange={event => setDraft(event.currentTarget.value)} />}
          </Field>
          {failed && <Alert tone="error" announcement="polite">The secret could not be saved. Try again.</Alert>}
          <FormActions
            secondary={<Button type="button" variant="subtle" disabled={busy} onClick={close}>Cancel</Button>}
            primary={<Button type="submit" disabled={!draft.length} loading={busy ? "retain-focus" : false}>{action}</Button>}
          />
        </Stack>
      </form>
    </Dialog>}
  />;
}
