<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  export type NoticeTone = "info" | "success" | "attention" | "danger";

  type Props = Omit<HTMLButtonAttributes, "children"> & {
    tone: NoticeTone;
    busy?: boolean;
    children?: Snippet;
  };

  let {
    tone,
    busy = false,
    disabled = false,
    type = "button",
    class: className,
    children,
    onclick,
    ...rest
  }: Props = $props();
</script>

<button
  {...rest}
  {type}
  class={["ui-notice-action", className]}
  data-tone={tone}
  data-busy={busy || undefined}
  {disabled}
  aria-disabled={disabled || busy || undefined}
  aria-busy={busy || undefined}
  onclick={(event) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }}
>
  {#if busy}<span class="ui-notice-action-spinner" aria-hidden="true"></span>{/if}
  {#if children}{@render children()}{/if}
</button>

<style>
  .ui-notice-action {
    --notice-action: var(--notice-info-action);
    --notice-action-hover: var(--notice-info-action-hover);
    --notice-action-pressed: var(--notice-info-action-pressed);
    --on-notice-action: var(--on-notice-info-action);
    display: inline-flex;
    min-inline-size: var(--target-min);
    min-block-size: var(--control-default);
    max-inline-size: 100%;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-control);
    background: var(--notice-action);
    color: var(--on-notice-action);
    font-family: var(--font-family-ui);
    font-size: var(--type-body-size);
    font-weight: var(--weight-medium);
    line-height: var(--type-body-line);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
  }

  .ui-notice-action[data-tone="success"] {
    --notice-action: var(--notice-success-action);
    --notice-action-hover: var(--notice-success-action-hover);
    --notice-action-pressed: var(--notice-success-action-pressed);
    --on-notice-action: var(--on-notice-success-action);
  }

  .ui-notice-action[data-tone="attention"] {
    --notice-action: var(--notice-attention-action);
    --notice-action-hover: var(--notice-attention-action-hover);
    --notice-action-pressed: var(--notice-attention-action-pressed);
    --on-notice-action: var(--on-notice-attention-action);
  }

  .ui-notice-action[data-tone="danger"] {
    --notice-action: var(--notice-danger-action);
    --notice-action-hover: var(--notice-danger-action-hover);
    --notice-action-pressed: var(--notice-danger-action-pressed);
    --on-notice-action: var(--on-notice-danger-action);
  }

  .ui-notice-action:not(:disabled):not([data-busy]):hover { background: var(--notice-action-hover); }
  .ui-notice-action:not(:disabled):not([data-busy]):active { background: var(--notice-action-pressed); transform: translateY(1px); }
  .ui-notice-action:focus-visible {
    outline: var(--focus-width) solid var(--notice-action);
    outline-offset: var(--focus-offset);
    box-shadow: 0 0 0 calc(var(--focus-width) * 2) var(--background);
  }
  .ui-notice-action:disabled { opacity: .48; cursor: not-allowed; }
  .ui-notice-action[data-busy] { cursor: progress; }
  .ui-notice-action-spinner {
    inline-size: 14px;
    block-size: 14px;
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: var(--radius-pill);
    animation: notice-action-spin .8s linear infinite;
  }
  @keyframes notice-action-spin { to { transform: rotate(1turn); } }
  @media (prefers-reduced-motion: reduce) {
    .ui-notice-action { transition: none; }
    .ui-notice-action-spinner { animation: none; border-inline-end-color: currentColor; opacity: .65; }
  }
  :global(:root[data-motion="reduced"]) .ui-notice-action { transition: none; }
  :global(:root[data-motion="reduced"]) .ui-notice-action-spinner { animation: none; border-inline-end-color: currentColor; opacity: .65; }
  @media (forced-colors: active) {
    .ui-notice-action { outline: 1px solid ButtonText; background: ButtonFace; color: ButtonText; }
    .ui-notice-action:focus-visible { outline: var(--focus-width) solid Highlight; box-shadow: none; }
  }
</style>
