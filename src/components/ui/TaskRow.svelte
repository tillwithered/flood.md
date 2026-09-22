<script lang="ts">
  import { currentLocale, translateCopy } from "../../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import type { Snippet } from "svelte";
  import { Check, CircleAlert } from "@lucide/svelte";

  type Props = {
    title: string;
    meta?: string;
    showMeta?: boolean;
    urgency?: "normal" | "important" | "urgent";
    urgencyLabel?: string;
    showNormalUrgency?: boolean;
    completed?: boolean;
    completedLabel?: string;
    completeLabel?: string;
    reopenLabel?: string;
    selected?: boolean;
    busy?: boolean;
    disabled?: boolean;
    onopen: () => void;
    oncomplete?: (completed: boolean) => void;
    actions?: Snippet;
    class?: string;
  };

  let {
    title, meta, showMeta = false, urgency = "normal", urgencyLabel, showNormalUrgency = false, completed = false,
    completedLabel = "Выполнена", completeLabel = "Завершить задачу", reopenLabel = "Вернуть в открытые",
    selected = false, busy = false, disabled = false, onopen, oncomplete, actions, class: className = ""
  }: Props = $props();

  const urgencyLabels = { normal: "Обычная", important: "Важная", urgent: "Срочная" };
</script>

<div class={["ui-task-row", className]} data-selected={selected || undefined} data-completed={completed || undefined} data-disabled={disabled || undefined} aria-busy={busy || undefined}>
  {#if oncomplete}
    <label class="ui-task-check">
      <input
        type="checkbox"
        checked={completed}
        {disabled}
        aria-disabled={busy || undefined}
        aria-label={`${tx(completed ? reopenLabel : completeLabel)}: ${title}`}
        onchange={(event) => {
          const requested = event.currentTarget.checked;
          // A native toggle is only a request; the owning persisted state confirms it.
          event.currentTarget.checked = completed;
          if (!busy && !disabled) oncomplete?.(requested);
        }}
      />
      <span class="ui-task-circle" aria-hidden="true">{#if completed}<Check size={14} strokeWidth={2} />{/if}</span>
    </label>
  {:else}
    <span class="ui-task-indicator" aria-hidden="true"><span class="ui-task-circle">{#if completed}<Check size={14} strokeWidth={2} />{/if}</span></span>
  {/if}
  <button type="button" class="ui-task-open" aria-current={selected ? "page" : undefined} aria-disabled={busy || undefined} {disabled} onclick={() => { if (!busy) onopen(); }}>
    <span class="ui-task-copy">
      <span class="ui-task-title">{title}</span>
      {#if completed}<span class="ui-task-sr-only">{tx(completedLabel)}</span>{/if}
      {#if showMeta && meta}<span class="ui-task-meta">{meta}</span>{/if}
    </span>
    {#if !completed && (urgency !== "normal" || showNormalUrgency)}
      <span class="ui-task-urgency" data-urgency={urgency}>
        {#if urgency !== "normal"}<CircleAlert size={14} aria-hidden="true" />{/if}
        <span>{urgencyLabel ?? tx(urgencyLabels[urgency])}</span>
      </span>
    {/if}
  </button>
  {#if actions}<div class="ui-task-actions">{@render actions()}</div>{/if}
</div>

<style>
  .ui-task-row { display: flex; align-items: flex-start; gap: var(--space-2); min-inline-size: 0; min-block-size: calc(var(--control-comfortable) + 2 * var(--space-1)); padding: var(--space-1) var(--space-2); border-radius: var(--radius-control); background: transparent; }
  .ui-task-row:not([data-disabled]):hover { background: var(--hover); }
  .ui-task-row[data-selected] { background: var(--selected); }
  .ui-task-check, .ui-task-indicator { position: relative; display: grid; flex: 0 0 auto; place-items: center; inline-size: var(--control-compact); min-block-size: var(--control-comfortable); }
  .ui-task-check { cursor: pointer; }
  input { position: absolute; inline-size: var(--control-compact); block-size: var(--control-compact); margin: 0; opacity: 0; cursor: inherit; }
  .ui-task-circle { display: grid; place-items: center; inline-size: var(--icon-large); block-size: var(--icon-large); border: var(--border-width) solid var(--line-strong); border-radius: var(--radius-pill); background: transparent; color: var(--on-ink); pointer-events: none; }
  .ui-task-row[data-completed] .ui-task-circle { background: var(--ink); border-color: var(--ink); }
  input:focus-visible + .ui-task-circle { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  input:disabled, input[aria-disabled="true"] { cursor: not-allowed; }
  .ui-task-open { display: flex; align-items: baseline; flex: 1 1 auto; min-inline-size: 0; min-block-size: var(--control-comfortable); gap: var(--space-3); padding: var(--space-2) 0; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--ink); font-family: var(--font-family-ui); font-size: var(--type-lead-size); line-height: var(--type-lead-line); text-align: start; cursor: pointer; }
  .ui-task-open:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-task-open:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-task-copy { display: grid; flex: 1 1 auto; gap: var(--space-1); min-inline-size: 0; }
  .ui-task-title { overflow-wrap: anywhere; font-weight: var(--weight-medium); }
  .ui-task-row[data-completed] .ui-task-title { color: var(--muted); }
  .ui-task-meta { color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); overflow-wrap: anywhere; }
  .ui-task-urgency { display: inline-flex; align-items: center; flex: 0 0 auto; gap: var(--space-1); min-inline-size: 0; max-inline-size: min(12ch, 35%); color: var(--muted); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .ui-task-urgency[data-urgency="important"] { color: var(--attention-ink); }
  .ui-task-urgency[data-urgency="urgent"] { color: var(--danger-ink); }
  .ui-task-urgency :global(svg) { flex: 0 0 auto; }
  .ui-task-urgency span { min-inline-size: 0; overflow-wrap: anywhere; }
  .ui-task-actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; align-items: center; gap: var(--space-1); min-block-size: var(--control-comfortable); }
  .ui-task-sr-only { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  @media (forced-colors: active) {
    input { appearance: auto; opacity: 1; }
    .ui-task-check .ui-task-circle { display: none; }
    .ui-task-indicator .ui-task-circle { border-color: CanvasText; background: Canvas; color: CanvasText; }
    .ui-task-row[data-selected] { outline: 1px solid Highlight; outline-offset: -1px; }
    .ui-task-open:focus-visible, input:focus-visible { outline-color: Highlight; }
    input:focus-visible { outline: var(--focus-width) solid Highlight; outline-offset: var(--focus-offset); }
    .ui-task-row[data-completed] .ui-task-title, .ui-task-meta, .ui-task-urgency[data-urgency] { color: CanvasText; }
  }
</style>
