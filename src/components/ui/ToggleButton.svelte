<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "children" | "aria-pressed"> & {
    pressed?: boolean;
    size?: "sm" | "md";
    children: Snippet;
    ontoggle?: (pressed: boolean) => void;
  };

  let { pressed = $bindable(false), size = "md", disabled = false, type = "button", children, ontoggle, onclick, class: className, ...rest }: Props = $props();
</script>

<button
  {...rest}
  {type}
  class={["ui-toggle-button", className]}
  data-size={size}
  aria-pressed={pressed}
  {disabled}
  onclick={(event) => {
    if (!disabled) {
      pressed = !pressed;
      ontoggle?.(pressed);
    }
    onclick?.(event);
  }}
>
  {@render children()}
</button>

<style>
  .ui-toggle-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); min-block-size: var(--control-default); min-inline-size: var(--target-min); padding: var(--space-2) var(--space-3); border: 0; border-radius: var(--radius-control); background: transparent; color: var(--muted); font: inherit; font-size: var(--type-body-size); line-height: var(--type-body-line); cursor: pointer; }
  .ui-toggle-button[data-size="sm"] { min-block-size: var(--control-compact); padding-block: var(--space-1); }
  .ui-toggle-button[aria-pressed="true"] { background: var(--selected); color: var(--ink); }
  .ui-toggle-button:not(:disabled):hover { background: var(--hover); color: var(--ink); }
  .ui-toggle-button:not(:disabled):active { background: var(--pressed); }
  .ui-toggle-button:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-toggle-button:disabled { color: var(--faint); cursor: not-allowed; }
</style>
