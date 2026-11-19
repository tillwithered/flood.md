---
name: flood-decision-design
description: Design decision-heavy Flood flows and operational summaries around evidence, consequences and recovery. Use for approvals, bulk work, monitoring and consequential changes.
---

# Keep the evidence beside the decision

Trace what prompts action, what evidence could change it, what the action
actually does, and which state stays available afterwards. Use the real product
state and data. In repeat work, make evidence easy to compare and keep the
collection context available when the user finishes.

- **Routine and reversible.** Act from the relevant row or region and use
  feedback that leaves the layout steady. Offer undo when the host can reverse
  the effect. A routine acknowledgement can expire when nothing else depends on it.
- **Consequential or hard to undo.** Present the exact target and consequence
  at the point of commitment. Confirm an approval separately from a later
  payment when the host treats them as separate operations. Put the evidence
  within reach before asking for commitment.
- **Delegated or connected access.** Use AccessSummary to show the identity
  that can act, the account it acts for, and the affected scope. Show the
  actual read and write capabilities for each relevant resource. Explain a
  meaningful restriction beside that resource. Keep pending verification,
  confirmed denial and granting access as distinct host states.
- **Connected accounts.** Use ConnectedAccountList to show the relevant
  provider identity and verified connection state. Send reconnect actions
  to the affected account. Keep workspace integrations in their own scope.
- **Active account sessions.** Use SessionList to distinguish this session
  from other devices. Name the affected device in any sign-out confirmation.
  Keep the row until the host confirms sign-out and move focus to a stable
  list heading if the originating action is removed.
- **Batch with partial results.** If supported by the host, show which items
  succeeded and which still need work. Use BatchResult when a completed batch
  needs persistent, item-level recovery. Keep the affected items reachable and
  retry only the failed IDs the host has marked safe to reattempt. Preserve
  filters, selection and return focus according to what remains actionable.
  For atomic operations, report the batch
  outcome as one result.

Use [records](../flood-records/SKILL.md) to choose which evidence belongs in
the list and which belongs in details. Use
[feedback](../flood-feedback/SKILL.md) for message placement and lifetime.

Use PolicyEvaluation to explain a policy test or an assigned route. Keep the
reported outcome and the inputs that led to it together. Distinguish a condition
that evaluated false from skipped branches and conditions without enough data.
Use EvaluationResult to inspect a single test's expected and actual outputs.
Keep completed assertion failures distinct from execution errors and only show
checks that the evaluator reported.
Use RestrictionSummary when reading configured rules. Say whether each list
allows only the named items or blocks them, and name the source when scopes
differ. Show an unrestricted scope only when the policy confirms that state.
Keep evaluation in the host and use ApprovalChain to show the review in progress.
Include the host's received and required approval counts when reviewers need to
understand a parallel stage's threshold. Keep the count, individual decisions
and the accepted stage outcome visible in their respective roles.

## Give every summary a decision

For each metric being considered, identify who uses it, which decision can
change, the time range or population, and where the underlying records can be
inspected. Keep it visible when it directs work or resolves a comparison.
For example, an overdue count can open the relevant queue. A second total of
visible rows may add nothing beside pagination. Use a neutral empty or
unavailable state when the input data is missing.

Review one ordinary path and one relevant exception with the same data and
task. Check whether a person can identify the affected item, understand the
consequence and resume work. If evaluating two layouts, compare task
completion and observable mistakes before comparing visual preference.
Measure completion time only under comparable conditions. Keep findings about
the test separate from claims about production outcomes.

The distinction between evidence review, approval and payment comes from
studying Ramp's accounts-payable workflow. Use the host's own roles and
capabilities when applying it.
