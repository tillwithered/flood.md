<script lang="ts">
  import type { Snippet } from "svelte";
  import { CircleAlert, CircleCheck, Info, TriangleAlert } from "@lucide/svelte";
  type Props = {
    tone?: "info" | "success" | "attention" | "danger";
    title?: string;
    children?: Snippet;
    actions?: Snippet;
    announce?: boolean;
    class?: string;
  };
  let { tone = "info", title, children, actions, announce = false, class: className = "" }: Props = $props();
</script>

<div class={["ui-notice", className]} data-tone={tone}>
  <div class="ui-notice-body" role={announce ? tone === "danger" ? "alert" : "status" : undefined} aria-atomic={announce ? "true" : undefined}>
    <span class="ui-notice-icon" aria-hidden="true">
      {#if tone === "danger"}<CircleAlert size={18} />
      {:else if tone === "attention"}<TriangleAlert size={18} />
      {:else if tone === "success"}<CircleCheck size={18} />
      {:else}<Info size={18} />{/if}
    </span>
    <div class="ui-notice-copy">
      {#if title}<strong>{title}</strong>{/if}
      {#if children}<div class="ui-notice-message">{@render children()}</div>{/if}
    </div>
  </div>
  {#if actions}<div class="ui-notice-actions">{@render actions()}</div>{/if}
</div>

<style>
  .ui-notice { --notice-ink: var(--ink); display: grid; gap: var(--space-3); padding: var(--space-construct); border-radius: var(--radius-control); background: var(--surface); color: var(--ink); }
  .ui-notice[data-tone="danger"] { --notice-ink: var(--danger-ink); background: var(--danger-surface); }
  .ui-notice[data-tone="attention"] { --notice-ink: var(--attention-ink); background: var(--attention-surface); }
  .ui-notice[data-tone="success"] { --notice-ink: var(--success-ink); background: var(--success-surface); }
  .ui-notice-body { display: flex; align-items: flex-start; gap: var(--space-3); min-inline-size: 0; }
  .ui-notice-icon { display: grid; flex: 0 0 auto; place-items: center; min-block-size: var(--type-body-line); color: var(--notice-ink); }
  .ui-notice-copy { display: grid; min-inline-size: 0; gap: var(--space-1); font-size: var(--type-body-size); line-height: var(--type-body-line); overflow-wrap: anywhere; }
  strong { color: var(--notice-ink); font-weight: var(--weight-medium); }
  .ui-notice-message { color: var(--ink); }
  .ui-notice-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); padding-inline-start: calc(18px + var(--space-3)); }
  @media (forced-colors: active) {
    .ui-notice { outline: 1px solid CanvasText; background: Canvas; color: CanvasText; }
    .ui-notice-icon, strong, .ui-notice-message { color: CanvasText; }
  }
</style>
