<script lang="ts">
  import type { Snippet } from "svelte";
  type Props = { title: string; description?: string; icon?: Snippet; actions?: Snippet; class?: string };
  let { title, description, icon, actions, class: className = "" }: Props = $props();
</script>

<div class={["ui-empty-state", className]}>
  {#if icon}<div class="ui-empty-icon" aria-hidden="true">{@render icon()}</div>{/if}
  <div class="ui-empty-copy">
    <h2>{title}</h2>
    {#if description}<p>{description}</p>{/if}
  </div>
  {#if actions}<div class="ui-empty-actions">{@render actions()}</div>{/if}
</div>

<style>
  .ui-empty-state { display: grid; justify-items: start; gap: var(--space-construct); min-inline-size: 0; padding-block: var(--space-section); }
  .ui-empty-icon { display: grid; place-items: center; color: var(--muted); }
  .ui-empty-copy { display: grid; gap: var(--space-2); max-inline-size: 54ch; min-inline-size: 0; }
  h2 { margin: 0; color: var(--ink); font-size: var(--type-lead-size); line-height: var(--type-lead-line); font-weight: var(--weight-medium); overflow-wrap: anywhere; }
  p { margin: 0; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); overflow-wrap: anywhere; }
  .ui-empty-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
</style>
