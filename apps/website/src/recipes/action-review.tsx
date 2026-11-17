"use client";

import { useState, type ReactNode } from "react";
import {
  Alert, Button, DescriptionList, Dialog, FormActions, Heading,
  JsonInspector, Stack, StatusIndicator, type JsonValue,
} from "@flood-md/react";

type Decision = { kind: "approve" | "reject" } | { kind: "edit"; arguments: JsonValue };
type ReviewState = "ready" | "submitting" | "submitted" | "failed" | "expired";
type Proposal = { id: string; revision: string; operation: string; target: string; arguments: JsonValue };

interface ReviewProps {
  proposal: Proposal;
  state: ReviewState;
  allowed: readonly Decision["kind"][];
  error?: string;
  /** This slot contains an application-owned form backed by the action schema. */
  renderEditor?: (initial: JsonValue, accept: (validated: JsonValue) => void, cancel: () => void) => ReactNode;
  onDecide: (id: string, revision: string, decision: Decision) => void;
}

export function ActionReview(props: ReviewProps) {
  return <RevisionReview key={JSON.stringify([props.proposal.id, props.proposal.revision])} {...props} />;
}

function RevisionReview({ proposal, state, allowed, renderEditor, error, onDecide }: ReviewProps) {
  const [editing, setEditing] = useState(false);
  const actionable = state === "ready" || state === "failed";
  const allowedEdit = allowed.includes("edit") && renderEditor;

  function decide(decision: Decision) {
    if (!actionable || !allowed.includes(decision.kind)) return;
    onDecide(proposal.id, proposal.revision, decision);
  }

  return <Stack gap="4">
    <Heading level={2}>{proposal.operation}</Heading>
    <DescriptionList items={[{ id: "target", term: "Target", description: proposal.target }]} />
    <JsonInspector label="Proposed arguments" value={proposal.arguments} />
    {state === "submitting" && <StatusIndicator label="Sending decision" announce />}
    {state === "submitted" && <StatusIndicator label="Decision sent" tone="success" announce />}
    {state === "expired" && <Alert tone="warning">This request has expired.</Alert>}
    {state === "failed" && <Alert tone="error" announcement="polite">{error ?? "Could not send the decision. Try again."}</Alert>}
    {actionable && <FormActions
      secondary={<>
        {allowed.includes("reject") && <Button variant="subtle" onClick={() => decide({ kind: "reject" })}>Reject</Button>}
        {allowedEdit && <Dialog title="Edit proposed arguments" open={editing} onOpenChange={setEditing}
          trigger={props => <Button {...props} variant="subtle">Edit arguments</Button>}>
          {renderEditor(proposal.arguments, args => {
            setEditing(false);
            decide({ kind: "edit", arguments: args });
          }, () => setEditing(false))}
        </Dialog>}
      </>}
      primary={allowed.includes("approve") && <Button onClick={() => decide({ kind: "approve" })}>Approve</Button>} />}
  </Stack>;
}
