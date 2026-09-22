<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { ChevronRight } from "@lucide/svelte";

  type Props = Omit<HTMLButtonAttributes, "title" | "children"> & {
    title: string;
    description?: string;
    meta?: string;
    count?: number;
    countLabel?: string;
    icon?: Snippet;
    selected?: boolean;
  };
  let { title, description, meta, count, countLabel, icon, selected = false, type = "button", class: className, ...rest }: Props = $props();
</script>

<button {...rest} {type} class={["ui-material-row", className]} data-selected={selected || undefined} aria-current={selected ? rest["aria-current"] ?? "true" : rest["aria-current"]}>
  {#if icon}<span class="ui-material-icon" aria-hidden="true">{@render icon()}</span>{/if}
  <span class="ui-material-copy">
    <span class="ui-material-title">{title}</span>
    {#if description}<span class="ui-material-description">{description}</span>{/if}
    {#if meta}<span class="ui-material-meta">{meta}</span>{/if}
  </span>
  {#if count !== undefined}
    <span class="ui-material-count">
      <span aria-hidden={countLabel ? "true" : undefined}>{count}</span>
      {#if countLabel}<span class="ui-material-count-description">{countLabel}</span>{/if}
    </span>
  {/if}
  <ChevronRight size={16} class="ui-material-arrow" aria-hidden="true" />
</button>

<style>
  .ui-material-row { display: flex; align-items: flex-start; gap: var(--space-3); inline-size: 100%; min-inline-size: 0; min-block-size: var(--control-comfortable); padding: var(--space-3); border: 0; border-radius: var(--radius-action-row); background: var(--surface); color: var(--ink); font-family: var(--font-family-ui); text-align: start; cursor: pointer; transition: none; }
  .ui-material-row:not(:disabled):hover { background: var(--hover); }
  .ui-material-row[data-selected] { background: var(--selected); }
  .ui-material-row:not(:disabled):active { background: var(--pressed); }
  .ui-material-row:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .ui-material-row:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-material-icon { display: grid; flex: 0 0 auto; place-items: center; min-block-size: var(--type-body-line); color: var(--muted); }
  .ui-material-copy { display: grid; flex: 1 1 auto; min-inline-size: 0; gap: var(--space-1); overflow-wrap: anywhere; }
  .ui-material-title { font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .ui-material-description { color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .ui-material-meta { color: var(--faint); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .ui-material-count { flex: 0 0 auto; align-self: center; color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); font-variant-numeric: tabular-nums; }
  .ui-material-count-description { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  .ui-material-row :global(.ui-material-arrow) { flex: 0 0 auto; align-self: center; color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { .ui-material-row { transition: none; } }
  :global(:root[data-motion="reduced"]) .ui-material-row { transition: none; }
  @media (forced-colors: active) {
    .ui-material-row { outline: 1px solid ButtonText; outline-offset: -1px; }
    .ui-material-row[data-selected] { outline-color: Highlight; }
    .ui-material-row:disabled { color: GrayText; outline-color: GrayText; }
    .ui-material-row:focus-visible { outline: var(--focus-width) solid Highlight; outline-offset: var(--focus-offset); }
  }
</style>
