<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    label?: string;
    attached?: boolean;
    children: Snippet;
  };

  let { label, attached = false, children }: Props = $props();
</script>

<div class="ui-button-group" class:attached role="group" aria-label={label}>
  {@render children()}
</div>

<style>
  .ui-button-group { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); min-inline-size: 0; }
  .ui-button-group.attached { gap: var(--space-1); padding: var(--space-1); border-radius: calc(var(--radius-control) + var(--space-1)); background: var(--surface); }
  .ui-button-group.attached :global(.ui-button),
  .ui-button-group.attached :global(.ui-icon-button) { background: transparent; }
  .ui-button-group.attached :global(.ui-button:hover),
  .ui-button-group.attached :global(.ui-icon-button:hover) { background: var(--hover); }
</style>
