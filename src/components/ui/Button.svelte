<script lang="ts">
  import { currentLocale, translateCopy } from "../../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "children"> & {
    variant?: "primary" | "secondary" | "quiet" | "danger";
    size?: "sm" | "md" | "lg";
    busy?: boolean;
    busyLabel?: string;
    wide?: boolean;
    children?: Snippet;
  };

  let {
    variant = "secondary", size = "md", busy = false, busyLabel = "Выполняется", wide = false, disabled = false,
    type = "button", class: className, children, onclick, ...rest
  }: Props = $props();
</script>

<button
  {...rest}
  {type}
  class={["ui-button", className]}
  data-variant={variant}
  data-size={size}
  data-busy={busy || undefined}
  data-wide={wide || undefined}
  {disabled}
  aria-disabled={disabled || busy || undefined}
  aria-busy={busy || undefined}
  onclick={(event) => {
    if (busy) { event.preventDefault(); return; }
    onclick?.(event);
  }}
>
  {#if busy}<span class="ui-button-spinner" aria-hidden="true"></span>{/if}
  {#if children}{@render children()}{/if}
  {#if busy}<span class="ui-visually-hidden">{tx(busyLabel)}</span>{/if}
</button>

<style>
  .ui-button {
    position: relative;
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-inline-size: var(--target-min);
    min-block-size: var(--control-default);
    max-inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--ink);
    font-family: var(--font-family-ui);
    font-size: var(--type-body-size);
    font-weight: var(--weight-medium);
    line-height: var(--type-body-line);
    text-align: center;
    text-decoration: none;
    overflow-wrap: anywhere;
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);
  }
  .ui-button[data-size="sm"] { min-block-size: var(--control-compact); padding-block: var(--space-1); }
  .ui-button[data-size="lg"] { min-block-size: var(--control-comfortable); padding-inline: var(--space-4); }
  .ui-button[data-wide] { inline-size: 100%; }
  .ui-button[data-variant="primary"] { background: var(--ink); color: var(--on-ink); }
  .ui-button[data-variant="quiet"] { background: transparent; }
  .ui-button[data-variant="danger"] { background: var(--danger-surface); color: var(--danger-ink); }
  .ui-button:not(:disabled):not([data-busy]):hover { background: var(--hover); }
  .ui-button[data-variant="primary"]:not(:disabled):not([data-busy]):hover { background: var(--muted); }
  .ui-button[data-variant="danger"]:not(:disabled):not([data-busy]):hover { background: var(--danger-hover); }
  .ui-button:not(:disabled):not([data-busy]):active { background: var(--pressed); }
  .ui-button[data-variant="primary"]:not(:disabled):not([data-busy]):active { background: var(--ink); }
  .ui-button[data-variant="danger"]:not(:disabled):not([data-busy]):active { background: var(--danger-pressed); }
  .ui-button:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-button[data-variant="danger"]:focus-visible { outline-color: var(--danger-ink); box-shadow: 0 0 0 var(--focus-width) var(--danger-focus-halo); }
  .ui-button:disabled { color: var(--faint); background: var(--surface); cursor: not-allowed; }
  .ui-button[data-busy] { cursor: progress; }
  .ui-button-spinner { inline-size: 14px; block-size: 14px; flex: 0 0 auto; border: 2px solid currentColor; border-inline-end-color: transparent; border-radius: var(--radius-pill); animation: ui-button-spin .8s linear infinite; }
  .ui-visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  @keyframes ui-button-spin { to { transform: rotate(1turn); } }
  @media (prefers-reduced-motion: reduce) { .ui-button { transition: none; } }
  @media (prefers-reduced-motion: reduce) { .ui-button-spinner { animation: none; border-inline-end-color: currentColor; opacity: .6; } }
  :global(:root[data-motion="reduced"]) .ui-button { transition: none; }
  :global(:root[data-motion="reduced"]) .ui-button-spinner { animation: none; border-inline-end-color: currentColor; opacity: .6; }
  @media (forced-colors: active) {
    .ui-button { outline: 1px solid ButtonText; outline-offset: -1px; background: ButtonFace; color: ButtonText; }
    .ui-button:disabled { color: GrayText; outline-color: GrayText; }
    .ui-button:focus-visible { outline: var(--focus-width) solid Highlight; outline-offset: var(--focus-offset); }
  }
</style>
