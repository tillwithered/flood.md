<script lang="ts">
  import { Check, FileDiff, RotateCcw, X } from "@lucide/svelte";
  import { translate, type Locale, type MessageKey } from "../i18n";
  import { EmptyState, InlineNotice, MaterialRow, TextArea, UiButton, UiModal } from "./ui";

  type WorkspaceKind = "document" | "rule" | "skill";
  type ProposalState = "pending" | "applied" | "rejected";
  type ProposalTarget =
    | { kind: "workspace_item"; item_id: string; item_kind: WorkspaceKind }
    | { kind: "project_memory"; memory_id: string };
  type ProposalPayload =
    | { kind: "workspace_item"; title: string; summary?: string; content: string; agent_access: boolean }
    | { kind: "project_memory"; text: string; pinned: boolean };
  type Proposal = {
    id: string;
    project_id: string;
    target: ProposalTarget;
    base_version: string;
    payload: ProposalPayload;
    summary: string;
    reason: string;
    evidence?: string[];
    state: ProposalState;
    decision_reason?: string;
    created_at: string;
    updated_at: string;
  };
  type WorkspaceItem = { id: string; title: string; summary?: string; content: string; agent_access: boolean; version: string };
  type MemoryEntry = { id: string; text: string; pinned?: boolean; updated_at?: string; created_at: string };
  type DiffLine = { kind: "same" | "add" | "remove"; text: string };

  type Props = {
    locale: Locale;
    proposals: Proposal[];
    items: WorkspaceItem[];
    memory: MemoryEntry[];
    loading?: boolean;
    error?: string;
    pendingId?: string;
    compact?: boolean;
    onrefresh: () => void | Promise<void>;
    onapply: (proposal: Proposal) => Promise<boolean>;
    onreject: (proposal: Proposal, reason: string) => Promise<boolean>;
  };

  let { locale, proposals, items, memory, loading = false, error = "", pendingId = "", compact = false, onrefresh, onapply, onreject }: Props = $props();
  let reviewOpen = $state(false);
  let selectedId = $state("");
  let rejectionOpen = $state(false);
  let rejectionReason = $state("");
  let selected = $derived(proposals.find((proposal) => proposal.id === selectedId));
  let pending = $derived(proposals.filter((proposal) => proposal.state === "pending"));
  let decided = $derived(proposals.filter((proposal) => proposal.state !== "pending"));

  const t = (key: MessageKey, values: Record<string, string | number> = {}) => translate(locale, key, values);

  function stateLabel(state: ProposalState) {
    return t(state === "pending" ? "knowledgeProposalPending" : state === "applied" ? "knowledgeProposalApplied" : "knowledgeProposalRejected");
  }

  function targetLabel(proposal: Proposal) {
    if (proposal.target.kind === "project_memory") return t("projectWorkspace_memory");
    return t(`projectWorkspaceOwned_${proposal.target.item_kind}` as MessageKey);
  }

  function proposedTitle(proposal: Proposal) {
    if (proposal.payload.kind === "workspace_item") return proposal.payload.title;
    const firstLine = proposal.payload.text.split("\n", 1)[0]?.trim();
    return firstLine || t("projectWorkspace_memory");
  }

  function openReview(proposal: Proposal) {
    selectedId = proposal.id;
    rejectionOpen = false;
    rejectionReason = "";
    reviewOpen = true;
  }

  function currentText(proposal: Proposal) {
    const target = proposal.target;
    if (target.kind === "workspace_item") {
      return items.find((item) => item.id === target.item_id)?.content ?? "";
    }
    return memory.find((entry) => entry.id === target.memory_id)?.text ?? "";
  }

  function proposedText(proposal: Proposal) {
    return proposal.payload.kind === "workspace_item" ? proposal.payload.content : proposal.payload.text;
  }

  function lineDiff(before: string, after: string): DiffLine[] {
    const left = before.replaceAll("\r\n", "\n").split("\n");
    const right = after.replaceAll("\r\n", "\n").split("\n");
    if (left.length * right.length > 250_000) {
      return [
        ...left.map((text) => ({ kind: "remove" as const, text })),
        ...right.map((text) => ({ kind: "add" as const, text }))
      ];
    }
    const table = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1));
    for (let i = left.length - 1; i >= 0; i -= 1) {
      for (let j = right.length - 1; j >= 0; j -= 1) {
        table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const result: DiffLine[] = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        result.push({ kind: "same", text: left[i] });
        i += 1;
        j += 1;
      } else if (table[i + 1][j] >= table[i][j + 1]) {
        result.push({ kind: "remove", text: left[i++] });
      } else {
        result.push({ kind: "add", text: right[j++] });
      }
    }
    while (i < left.length) result.push({ kind: "remove", text: left[i++] });
    while (j < right.length) result.push({ kind: "add", text: right[j++] });
    return result;
  }

  function metadataChanges(proposal: Proposal) {
    const payload = proposal.payload;
    const target = proposal.target;
    if (payload.kind !== "workspace_item" || target.kind !== "workspace_item") return [];
    const current = items.find((item) => item.id === target.item_id);
    if (!current) return [{ label: t("knowledgeProposalTarget"), before: t("knowledgeProposalMissing"), after: payload.title }];
    const changes: Array<{ label: string; before: string; after: string }> = [];
    if (current.title !== payload.title) changes.push({ label: t("projectWorkspaceTitlePlaceholder"), before: current.title, after: payload.title });
    if ((current.summary ?? "") !== (payload.summary ?? "")) changes.push({ label: t("projectWorkspaceSummary"), before: current.summary ?? "", after: payload.summary ?? "" });
    if (current.agent_access !== payload.agent_access) changes.push({ label: t("projectWorkspaceAgentAccess"), before: current.agent_access ? t("enabled") : t("disabled"), after: payload.agent_access ? t("enabled") : t("disabled") });
    return changes;
  }

  async function applySelected() {
    if (!selected || selected.state !== "pending") return;
    if (await onapply(selected)) reviewOpen = false;
  }

  async function rejectSelected() {
    if (!selected || selected.state !== "pending") return;
    if (await onreject(selected, rejectionReason)) reviewOpen = false;
  }
</script>

<section class:compact class="knowledge-review" aria-label={t("knowledgeProposals")}>
  {#if !compact}
    <div class="knowledge-review-heading">
      <span><strong>{t("knowledgeProposals")}</strong><small>{t("knowledgeProposalsDescription")}</small></span>
      <UiButton size="sm" variant="quiet" busy={loading} onclick={onrefresh}><RotateCcw size={14} />{t("refresh")}</UiButton>
    </div>
  {/if}

  {#if error}<InlineNotice tone="danger" announce>{error}</InlineNotice>{/if}
  {#if loading && proposals.length === 0}
    <p class="knowledge-review-loading" role="status">{t("loading")}</p>
  {:else if proposals.length === 0 && !compact}
    <EmptyState title={t("knowledgeProposalsEmpty")} description={t("knowledgeProposalsEmptyDescription")} />
  {:else}
    {#if pending.length}
      <div class="knowledge-review-group">
        <div class="knowledge-review-group-label"><strong>{t("needsDecision")}</strong><span>{pending.length}</span></div>
        <div class="knowledge-review-list">
          {#each pending as proposal (proposal.id)}
            <MaterialRow title={proposedTitle(proposal)} description={proposal.summary} meta={`${targetLabel(proposal)} · ${stateLabel(proposal.state)}`} onclick={() => openReview(proposal)}>
              {#snippet icon()}<FileDiff size={18} />{/snippet}
            </MaterialRow>
          {/each}
        </div>
      </div>
    {/if}
    {#if decided.length && !compact}
      <div class="knowledge-review-group">
        <div class="knowledge-review-group-label"><strong>{t("knowledgeProposalHistory")}</strong><span>{decided.length}</span></div>
        <div class="knowledge-review-list">
          {#each decided as proposal (proposal.id)}
            <MaterialRow title={proposedTitle(proposal)} description={proposal.summary} meta={`${targetLabel(proposal)} · ${stateLabel(proposal.state)}`} onclick={() => openReview(proposal)}>
              {#snippet icon()}{#if proposal.state === "applied"}<Check size={18} />{:else}<X size={18} />{/if}{/snippet}
            </MaterialRow>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>

{#if selected}
  {@const changes = metadataChanges(selected)}
  {@const diff = lineDiff(currentText(selected), proposedText(selected))}
  <UiModal bind:open={reviewOpen} size="lg" title={proposedTitle(selected)} subtitle={`${targetLabel(selected)} · ${stateLabel(selected.state)}`} closeLabel={t("close")}>
    <div class="knowledge-review-detail">
      {#if error}<InlineNotice tone="danger" announce>{error}</InlineNotice>{/if}
      <div class="knowledge-review-summary">
        <p>{selected.summary}</p>
        <small>{selected.reason}</small>
      </div>
      {#if selected.evidence?.length}
        <div class="knowledge-review-evidence"><strong>{t("knowledgeProposalEvidence")}</strong><ul>{#each selected.evidence as evidence}<li>{evidence}</li>{/each}</ul></div>
      {/if}
      {#if changes.length}
        <div class="knowledge-review-metadata">
          {#each changes as change}
            <section><strong>{change.label}</strong><div><span>{change.before || t("knowledgeProposalEmptyValue")}</span><span>{change.after || t("knowledgeProposalEmptyValue")}</span></div></section>
          {/each}
        </div>
      {/if}
      <div class="knowledge-review-diff" aria-label={t("knowledgeProposalDiff")}>
        <header><strong>{t("knowledgeProposalDiff")}</strong><span><i class="remove"></i>{t("knowledgeProposalCurrent")}<i class="add"></i>{t("knowledgeProposalProposed")}</span></header>
        <pre>{#each diff as line}<code class={line.kind}><span aria-hidden="true">{line.kind === "add" ? "+" : line.kind === "remove" ? "−" : " "}</span>{line.text || " "}</code>{/each}</pre>
      </div>
      {#if selected.state === "rejected" && selected.decision_reason}<InlineNotice>{selected.decision_reason}</InlineNotice>{/if}
      {#if rejectionOpen && selected.state === "pending"}
        <TextArea label={t("knowledgeProposalRejectReason")} optional rows={3} bind:value={rejectionReason} placeholder={t("knowledgeProposalRejectPlaceholder")} />
      {/if}
    </div>
    {#snippet footer()}
      {#if selected.state === "pending"}
        {#if rejectionOpen}
          <UiButton disabled={pendingId === selected.id} onclick={() => { rejectionOpen = false; rejectionReason = ""; }}>{t("cancel")}</UiButton>
          <UiButton variant="danger" busy={pendingId === selected.id} onclick={rejectSelected}>{t("reject")}</UiButton>
        {:else}
          <UiButton variant="danger" disabled={Boolean(pendingId)} onclick={() => (rejectionOpen = true)}>{t("reject")}</UiButton>
          <UiButton variant="primary" busy={pendingId === selected.id} disabled={Boolean(pendingId) && pendingId !== selected.id} onclick={applySelected}>{t("apply")}</UiButton>
        {/if}
      {:else}
        <UiButton onclick={() => (reviewOpen = false)}>{t("close")}</UiButton>
      {/if}
    {/snippet}
  </UiModal>
{/if}

<style>
  .knowledge-review { display: grid; max-inline-size: 720px; gap: var(--space-construct); }
  .knowledge-review.compact { max-inline-size: none; gap: var(--space-3); }
  .knowledge-review-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); }
  .knowledge-review-heading > span { display: grid; gap: var(--space-1); min-inline-size: 0; }
  .knowledge-review-heading strong, .knowledge-review-group-label strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .knowledge-review-heading small { color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .knowledge-review-loading { margin: 0; color: var(--muted); }
  .knowledge-review-group { display: grid; gap: var(--space-2); }
  .knowledge-review-group-label { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); color: var(--muted); }
  .knowledge-review-group-label span { font-size: var(--type-compact-size); font-variant-numeric: tabular-nums; }
  .knowledge-review-list { display: grid; gap: var(--space-2); }
  .knowledge-review-detail { display: grid; gap: var(--space-4); }
  .knowledge-review-summary { display: grid; gap: var(--space-1); }
  .knowledge-review-summary p, .knowledge-review-summary small { margin: 0; overflow-wrap: anywhere; }
  .knowledge-review-summary p { line-height: var(--type-body-line); }
  .knowledge-review-summary small { color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .knowledge-review-evidence { display: grid; gap: var(--space-2); padding: var(--space-3); border-radius: var(--radius-action-row); background: var(--surface); }
  .knowledge-review-evidence strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); }
  .knowledge-review-evidence ul { margin: 0; padding-inline-start: var(--space-5); color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .knowledge-review-metadata { display: grid; gap: var(--space-2); }
  .knowledge-review-metadata section { display: grid; gap: var(--space-1); padding: var(--space-3); border-radius: var(--radius-action-row); background: var(--surface); }
  .knowledge-review-metadata strong { font-size: var(--type-compact-size); font-weight: var(--weight-medium); }
  .knowledge-review-metadata section > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-2); }
  .knowledge-review-metadata span { min-inline-size: 0; overflow-wrap: anywhere; color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .knowledge-review-metadata span:last-child { color: var(--ink); }
  .knowledge-review-diff { display: grid; min-block-size: 240px; max-block-size: min(52vh, 520px); overflow: hidden; border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-action-row); background: var(--background); }
  .knowledge-review-diff > header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); padding: var(--space-3); border-block-end: var(--border-width) solid var(--soft-line); }
  .knowledge-review-diff > header strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); }
  .knowledge-review-diff > header span { display: flex; align-items: center; gap: var(--space-2); color: var(--muted); font-size: var(--type-compact-size); }
  .knowledge-review-diff i { inline-size: 8px; block-size: 8px; border-radius: var(--radius-pill); background: var(--line-strong); }
  .knowledge-review-diff i.add { background: var(--success-ink); }
  .knowledge-review-diff i.remove { background: var(--danger-ink); }
  .knowledge-review-diff pre { min-block-size: 0; margin: 0; overflow: auto; scrollbar-gutter: stable; font-family: var(--font-family-mono); font-size: var(--type-compact-size); line-height: var(--type-body-line); }
  .knowledge-review-diff code { display: grid; grid-template-columns: 24px minmax(max-content, 1fr); min-block-size: var(--type-body-line); white-space: pre-wrap; overflow-wrap: anywhere; }
  .knowledge-review-diff code > span { display: grid; place-items: start center; color: var(--faint); user-select: none; }
  .knowledge-review-diff code.add { background: var(--success-surface); color: var(--success-ink); }
  .knowledge-review-diff code.remove { background: var(--danger-surface); color: var(--danger-ink); }
  @media (max-width: 640px) { .knowledge-review-metadata section > div { grid-template-columns: 1fr; } .knowledge-review-diff { max-block-size: 48vh; } }
  @media (forced-colors: active) { .knowledge-review-diff code.add, .knowledge-review-diff code.remove { background: Canvas; color: CanvasText; } .knowledge-review-diff code.add { border-inline-start: 3px solid Highlight; } .knowledge-review-diff code.remove { border-inline-start: 3px dashed CanvasText; } }
</style>
