"use client";

import { useId, useRef, useState } from "react";
import {
  Button, Collapsible, CommentComposer, CommentThread, Grid, Inline, Link, PageHeader,
  Section, Stack, StatusIndicator, Surface, Text, TextAnnotation, TextRevision,
  type CommentThreadItem, type TextRevisionState,
} from "@flood-md/react";

const initialComments: readonly CommentThreadItem[] = [
  { id: "maya-1", author: { name: "Maya Chen" }, body: "The whole team needs to see the handoff notes." },
];
const earlierComments: readonly CommentThreadItem[] = [
  { id: "sam-1", author: { name: "Sam Rivera" }, body: "We can remove the old reminder. The schedule already covers it." },
];
const retentionComments: readonly CommentThreadItem[] = [
  { id: "sam-2", author: { name: "Sam Rivera" }, body: "Keep it in the shared project folder until the launch is reviewed." },
];
const retentionTextId = "retention-text";
const retentionThreadId = "retention-discussion";

export function DocumentReview() {
  const anchor = useRef<HTMLSpanElement>(null);
  const quoteId = useId();
  const nextComment = useRef(1);
  const [decision, setDecision] = useState<TextRevisionState>("pending");
  const [resolved, setResolved] = useState(false);
  const [earlierResolved, setEarlierResolved] = useState(true);
  const [retentionResolved, setRetentionResolved] = useState(false);
  const [anchorActive, setAnchorActive] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");

  function jumpToText() {
    setAnchorActive(true);
    anchor.current?.focus({ preventScroll: true });
    anchor.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function decide(next: Exclude<TextRevisionState, "pending">) {
    setDecision(next);
    setResolved(true);
    jumpToText();
  }

  function sendReply() {
    const body = draft.trim();
    if (!body || resolved) return;
    const id = `reply-${nextComment.current++}`;
    setComments(previous => [...previous, { id, author: { name: "Alex Morgan" }, body }]);
    setDraft("");
  }

  return <Stack gap="6">
    <PageHeader title="Review handoff notes" />
    <Grid maxColumns={2} minItemWidth="22rem" gap="4" style={{ alignItems: "start" }}>
      <Surface padding="4">
        <Section title="Launch handoff" headingSize="group">
          <Stack gap="3">
            <Text as="p">Send the final export after approval. Share the handoff notes{" "}
              <TextRevision ref={anchor} tabIndex={-1} active={anchorActive} onBlur={() => setAnchorActive(false)}
                before="with the project lead" after="with the project team" state={decision}
                aria-label="Handoff recipients" />.
            </Text>
            <Text as="p">Keep the source file available until{" "}
              <TextAnnotation id={retentionTextId} discussionId={retentionThreadId} resolved={retentionResolved}>
                the next release
              </TextAnnotation>.
            </Text>
          </Stack>
        </Section>
      </Surface>
      <Surface padding="4">
        <Stack gap="4">
          <Section title="Handoff recipients" headingSize="group">
            <Stack gap="3">
              <Inline gap="3" align="center">
                <StatusIndicator announce label={decision === "pending" ? "Pending revision" : decision === "accepted" ? "Revision accepted" : "Revision rejected"}
                  tone={decision === "pending" ? "warning" : decision === "accepted" ? "success" : "neutral"} />
                <Button size="sm" variant="ghost" onClick={jumpToText}>Go to text</Button>
              </Inline>
              <CommentThread items={comments} aria-label="Handoff discussion" />
              {decision === "pending" && <Inline gap="2">
                <Button size="sm" onClick={() => decide("accepted")}>Accept revision</Button>
                <Button size="sm" variant="subtle" onClick={() => decide("rejected")}>Reject revision</Button>
              </Inline>}
              <Button size="sm" variant="ghost" style={{ alignSelf: "start" }} onClick={() => setResolved(previous => !previous)}>
                {resolved ? "Reopen discussion" : "Resolve discussion"}
              </Button>
              {!resolved && <CommentComposer label="Reply to handoff discussion" sendPresentation="label" sendLabel="Reply"
                placeholder="Write a reply…" value={draft} onValueChange={setDraft} onSend={sendReply} />}
            </Stack>
          </Section>
          <Section title="Source file retention" headingSize="group" id={retentionThreadId} tabIndex={-1}
            style={{ scrollMarginBlock: "var(--flood-sys-space-4)" }}>
            <Stack gap="3">
              <CommentThread items={retentionComments} aria-label="Retention discussion" />
              <Inline gap="2">
                <Link href={`#${encodeURIComponent(retentionTextId)}`} variant="ghost" size="sm">Back to source text</Link>
                <Button variant="ghost" size="sm" onClick={() => setRetentionResolved(value => !value)}>
                  {retentionResolved ? "Reopen retention discussion" : "Resolve retention discussion"}
                </Button>
              </Inline>
            </Stack>
          </Section>
          <Collapsible variant="flush" title="Earlier discussion" controlSize="sm">
            <Stack gap="3" aria-describedby={quoteId}>
              <Text id={quoteId} size="compact" tone="subtle">The original text was removed.</Text>
              <CommentThread items={earlierComments} aria-label="Reminder discussion" />
              <Button size="sm" variant="ghost" style={{ alignSelf: "start" }}
                onClick={() => setEarlierResolved(previous => !previous)}>
                {earlierResolved ? "Reopen reminder discussion" : "Resolve reminder discussion"}
              </Button>
            </Stack>
          </Collapsible>
        </Stack>
      </Surface>
    </Grid>
  </Stack>;
}
