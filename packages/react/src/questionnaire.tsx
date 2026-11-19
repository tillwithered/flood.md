import { forwardRef, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Alert, Button, Checkbox, Heading, Inline, Input, Radio, Stack, StepProgress, Text, type QuestionnaireAnswer, type QuestionnaireProps } from "./index.js";


/** A controlled set of answers with local navigation through one question at a time. */
export const Questionnaire = /* @__PURE__ */ forwardRef<HTMLDivElement, QuestionnaireProps>(function Questionnaire({
  label, questions, answers, onAnswersChange, onComplete, pending = false, completed = false, completion, error, labels, ...props
}, ref) {
  const name = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const needsFocus = useRef(false);
  const [activeId, setActiveId] = useState(questions[0]?.id);
  const [issue, setIssue] = useState("");
  const index = Math.max(0, questions.findIndex(question => question.id === activeId));
  const current = questions[index];
  const last = index === questions.length - 1;
  const stored = current ? answers[current.id] : undefined;
  const selected = current?.options.filter(option => stored?.selected.includes(option.id)).map(option => option.id) ?? [];
  const other = current?.otherLabel ? stored?.other : undefined;
  const multiple = current?.selection === "multiple";

  useLayoutEffect(() => {
    if (needsFocus.current || completed) {
      needsFocus.current = false;
      heading.current?.focus({ preventScroll: true });
    }
  }, [current?.id, completed]);

  function update(answer: QuestionnaireAnswer) {
    setIssue("");
    onAnswersChange({ ...answers, [current.id]: answer });
  }

  function move(next: number) {
    needsFocus.current = true;
    setIssue("");
    setActiveId(questions[next].id);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (other !== undefined && !other.trim()) {
      setIssue(labels?.otherRequired ?? "Enter your answer.");
      return;
    }
    if (current.required && selected.length === 0 && other === undefined) {
      setIssue(labels?.required ?? "Choose an answer.");
      return;
    }
    if (last) onComplete(answers);
    else move(index + 1);
  }

  if (!current && !completed) return null;

  return (
    <div {...props} ref={ref} aria-label={label} role="region">
      {completed ? (
        <Stack gap="3">
          <Heading ref={heading} tabIndex={-1} level={3}>{labels?.complete ?? "Complete"}</Heading>
          {completion}
        </Stack>
      ) : (
        <form aria-busy={pending || undefined} onSubmit={submit}>
          <Stack gap="4">
            <StepProgress title={label} step={index + 1} totalSteps={questions.length} formatPosition={labels?.position} />
            <Heading ref={heading} id={`${name}-title`} tabIndex={-1} level={3} size="section">{current.title}</Heading>
            {current.description && <Text id={`${name}-description`} tone="subtle">{current.description}</Text>}
            <fieldset className="flood-questionnaire__options" disabled={pending} aria-labelledby={`${name}-title`}
              aria-describedby={current.description ? `${name}-description` : undefined}>
              {current.options.map(option => multiple ? (
                <Checkbox key={option.id} label={option.label} checked={selected.includes(option.id)} onChange={event =>
                  update({ selected: event.target.checked ? [...selected, option.id] : selected.filter(id => id !== option.id), other })} />
              ) : (
                <Radio key={option.id} label={option.label} name={name} checked={selected.includes(option.id) && other === undefined}
                  onChange={() => update({ selected: [option.id] })} />
              ))}
              {current.otherLabel && (multiple ? (
                <Checkbox label={current.otherLabel} checked={other !== undefined}
                  onChange={event => update({ selected, other: event.target.checked ? "" : undefined })} />
              ) : (
                <Radio label={current.otherLabel} name={name} checked={other !== undefined} onChange={() => update({ selected: [], other: "" })} />
              ))}
              {current.otherLabel && other !== undefined &&
                <Input aria-label={current.otherLabel} value={other} onChange={event => update({ selected, other: event.target.value })} />}
            </fieldset>
            {(issue || error) && <Alert tone="error" announcement="assertive">{issue || error}</Alert>}
            <Inline gap="2">
              {index > 0 && <Button type="button" variant="subtle" disabled={pending} onClick={() => move(index - 1)}>{labels?.back ?? "Back"}</Button>}
              <Button type="submit" loading={pending}>{last ? labels?.submit ?? "Submit" : labels?.next ?? "Next"}</Button>
            </Inline>
          </Stack>
        </form>
      )}
    </div>
  );
});
