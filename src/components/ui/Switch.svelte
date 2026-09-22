<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "aria-checked" | "role" | "onchange"> & {
    label: string;
    description?: string;
    checked?: boolean;
    pending?: boolean;
    onchange?: (checked: boolean) => void;
  };

  let { label, description, checked = $bindable(false), pending = false, disabled = false, type = "button", onchange, onclick, class: className, ...rest }: Props = $props();
</script>

<button
  {...rest}
  {type}
  class={["ui-switch", className]}
  role="switch"
  aria-checked={checked}
  aria-busy={pending || undefined}
  aria-disabled={disabled || pending || undefined}
  {disabled}
  onclick={(event) => {
    if (pending) { event.preventDefault(); return; }
    checked = !checked;
    onchange?.(checked);
    onclick?.(event);
  }}
>
  <span class="ui-switch-copy"><strong>{label}</strong>{#if description}<small>{description}</small>{/if}</span>
  <span class="ui-switch-track" aria-hidden="true"><span></span></span>
</button>

<style>
  .ui-switch { display: flex; inline-size: 100%; min-block-size: var(--control-comfortable); align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-2) var(--space-3); border: 0; border-radius: var(--radius-control); background: transparent; color: var(--ink); text-align: start; cursor: pointer; }
  .ui-switch:not(:disabled):not([aria-busy="true"]):hover { background: var(--hover); }
  .ui-switch:not(:disabled):not([aria-busy="true"]):active { background: var(--pressed); }
  .ui-switch:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-switch:disabled, .ui-switch[aria-busy="true"] { color: var(--faint); cursor: not-allowed; }
  .ui-switch-copy { display: grid; gap: var(--space-1); min-inline-size: 0; }
  .ui-switch-copy strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); overflow-wrap: anywhere; }
  .ui-switch-copy small { color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); overflow-wrap: anywhere; }
  .ui-switch-track { display: flex; flex: 0 0 auto; align-items: center; inline-size: 32px; block-size: 20px; padding: 2px; border-radius: var(--radius-pill); background: var(--pressed); }
  .ui-switch-track > span { inline-size: 16px; block-size: 16px; border-radius: var(--radius-pill); background: var(--background); transform: translateX(0); }
  .ui-switch[aria-checked="true"] .ui-switch-track { background: var(--ink); }
  .ui-switch[aria-checked="true"] .ui-switch-track > span { background: var(--on-ink); transform: translateX(12px); }
  @media (forced-colors: active) {
    .ui-switch-track { border: 1px solid ButtonText; }
    .ui-switch[aria-checked="true"] .ui-switch-track { background: Highlight; }
  }
</style>
