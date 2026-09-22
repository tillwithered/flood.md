<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "children" | "aria-label"> & {
    label: string;
    variant?: "quiet" | "secondary" | "danger";
    size?: "sm" | "md";
    busy?: boolean;
    children: Snippet;
  };

  let { label, variant = "quiet", size = "md", busy = false, disabled = false, type = "button", class: className, children, onclick, ...rest }: Props = $props();
</script>

<button
  {...rest}
  {type}
  class={["ui-icon-button", className]}
  data-variant={variant}
  data-size={size}
  aria-label={label}
  title={rest.title ?? label}
  {disabled}
  aria-disabled={disabled || busy || undefined}
  aria-busy={busy || undefined}
  data-busy={busy || undefined}
  onclick={(event) => { if (busy) { event.preventDefault(); return; } onclick?.(event); }}
>
  <span aria-hidden="true">{@render children()}</span>
</button>

<style>
  .ui-icon-button { display: inline-grid; flex: 0 0 auto; place-items: center; min-inline-size: var(--control-default); min-block-size: var(--control-default); padding: var(--space-2); border: 0; border-radius: var(--radius-control); background: transparent; color: var(--muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
  .ui-icon-button[data-size="sm"] { min-inline-size: var(--control-compact); min-block-size: var(--control-compact); padding: var(--space-1); }
  .ui-icon-button[data-variant="secondary"] { background: var(--surface); color: var(--ink); }
  .ui-icon-button[data-variant="danger"] { background: var(--danger-surface); color: var(--danger-ink); }
  .ui-icon-button > span { display: grid; place-items: center; }
  .ui-icon-button:not(:disabled):not([data-busy]):hover { background: var(--hover); color: var(--ink); }
  .ui-icon-button:not(:disabled):not([data-busy]):active { background: var(--pressed); }
  .ui-icon-button[data-variant="danger"]:not(:disabled):not([data-busy]):hover { background: var(--danger-hover); }
  .ui-icon-button[data-variant="danger"]:not(:disabled):not([data-busy]):active { background: var(--danger-pressed); }
  .ui-icon-button:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-icon-button[data-variant="danger"]:focus-visible { outline-color: var(--danger-ink); box-shadow: 0 0 0 var(--focus-width) var(--danger-focus-halo); }
  .ui-icon-button:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-icon-button[data-busy] { background: var(--surface); cursor: progress; }
  @media (prefers-reduced-motion: reduce) { .ui-icon-button { transition: none; } }
  :global(:root[data-motion="reduced"]) .ui-icon-button { transition: none; }
  @media (forced-colors: active) {
    .ui-icon-button { color: ButtonText; background: ButtonFace; outline: 1px solid ButtonText; outline-offset: -1px; }
    .ui-icon-button:disabled { color: GrayText; outline-color: GrayText; }
    .ui-icon-button:focus-visible { outline: var(--focus-width) solid Highlight; outline-offset: var(--focus-offset); }
  }
</style>
