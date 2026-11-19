import { forwardRef, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Alert, Button, Field, Fieldset, FormActions, Radio, Section, Stack, Text, Textarea, type ApprovalRequestProps } from "./index.js";

export const ApprovalDecisionForm = /* @__PURE__ */ forwardRef<HTMLElement, ApprovalRequestProps>(function ApprovalDecisionForm(
  { evidence, options, draft, onDraftChange, onDecision, status, labels, className, ...props }, ref,
) {
  const name = `flood-approval-${useId()}`;
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const commitButton = useRef<HTMLButtonElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const [hadFormFocus, setHadFormFocus] = useState(false);
  const [invalidDecision, setInvalidDecision] = useState<string | null>(null);
  const resolved = status?.type === "resolved";
  const pending = status?.type === "submitting";
  const choice = options.find(option => option.id === draft.decisionId && !option.disabled);
  const note = choice?.note;
  const noteValue = draft.note.trim();
  const noteError = invalidDecision === choice?.id && !noteValue ? note?.requiredMessage : undefined;

  useEffect(() => {
    if (!resolved || !hadFormFocus || !result.current) return;
    const document = result.current.ownerDocument;
    if (document.activeElement === document.body) result.current.focus();
  }, [hadFormFocus, resolved]);

  if ((!resolved && !options.length) || options.some(option => !option.id.trim() || !option.label.trim())
    || new Set(options.map(option => option.id)).size !== options.length) {
    throw new Error("Flood ApprovalRequest needs named options with unique nonempty IDs while a decision is open");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolved || pending || !choice) return;
    if (note?.requiredMessage && !noteValue) {
      setInvalidDecision(choice.id);
      noteInput.current?.focus();
      return;
    }
    commitButton.current?.focus();
    onDecision({ decisionId: choice.id, ...(note && noteValue ? { note: noteValue } : {}) });
  }

  return <Section {...props} ref={ref} className={["flood-approval-request", className].filter(Boolean).join(" ")}>
    <Stack gap="4">
      {evidence}
      {status?.type === "resolved" ? <Alert ref={result} tabIndex={-1} className="flood-approval-request__result"
        appearance="inline" tone={status.tone ?? "neutral"} announcement={hadFormFocus ? "off" : "polite"}>
        {status.message}
      </Alert> : <form noValidate onSubmit={submit} onFocusCapture={() => setHadFormFocus(true)}
        onBlurCapture={event => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setHadFormFocus(false);
        }}>
        <Stack gap="4">
          <Fieldset legend={<>{labels?.decision ?? "Decision"}<span aria-hidden="true"> *</span></>}
            disabled={pending} role="radiogroup" aria-required="true" aria-orientation="vertical">
            <Stack gap="2">
              {options.map((option, index) => {
                const labelId = `${name}-label-${index}`;
                const descriptionId = option.consequence ? `${name}-consequence-${index}` : undefined;
                return <Radio key={option.id} className="flood-approval-request__choice"
                  name={name} value={option.id} checked={choice?.id === option.id} disabled={option.disabled} required
                  aria-labelledby={labelId} aria-describedby={descriptionId}
                  label={<span className="flood-approval-request__choice-copy">
                    <span id={labelId} className="flood-approval-request__choice-title">{option.label}</span>
                    {descriptionId && <Text id={descriptionId} size="compact" tone="subtle">{option.consequence}</Text>}
                  </span>}
                  onChange={() => {
                    setInvalidDecision(null);
                    onDraftChange({ ...draft, decisionId: option.id });
                  }} />;
              })}
            </Stack>
          </Fieldset>
          {note && <Field label={note.label} required={Boolean(note.requiredMessage)} error={noteError}>
            {field => <Textarea {...field} ref={noteInput} rows={2} autoGrow value={draft.note} disabled={pending}
              onChange={event => {
                setInvalidDecision(null);
                onDraftChange({ ...draft, note: event.currentTarget.value });
              }} />}
          </Field>}
          {status?.type === "error" && <Alert appearance="inline" tone="error" announcement="assertive">{status.message}</Alert>}
          <FormActions align="start" primary={
            <Button ref={commitButton} className="flood-approval-request__submit" type="submit"
              disabled={!choice && !pending} loading={pending ? "retain-focus" : false}>
              {labels?.submit ?? "Submit decision"}
            </Button>
          } />
        </Stack>
      </form>}
    </Stack>
  </Section>;
});
