<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    title: string;
    description?: string;
    count?: number;
    countLabel?: string;
    level?: 1 | 2 | 3;
    mark?: Snippet;
    titleContent?: Snippet;
    actions?: Snippet;
    actionsLabel?: string;
    class?: string;
  };

  let { title, description, count, countLabel, level = 1, mark, titleContent, actions, actionsLabel = "Действия страницы", class: className = "" }: Props = $props();
</script>

<header class={["ui-page-header", className]}>
  <div class="ui-page-heading">
    <div class="ui-page-title-line">
      {#if mark}<span class="ui-page-mark" aria-hidden="true">{@render mark()}</span>{/if}
      {#if titleContent}
        <div class="ui-page-custom-title">{@render titleContent()}</div>
      {:else}
        <svelte:element this={`h${level}`} class="ui-page-title">{title}</svelte:element>
      {/if}
      {#if count !== undefined}
        <span class="ui-page-count">
          <span aria-hidden={countLabel ? "true" : undefined}>{count}</span>
          {#if countLabel}<span class="ui-page-count-description">{countLabel}</span>{/if}
        </span>
      {/if}
    </div>
    {#if description}<p class="ui-page-description">{description}</p>{/if}
  </div>
  {#if actions}<div class="ui-page-actions" role="group" aria-label={actionsLabel}>{@render actions()}</div>{/if}
</header>

<style>
  .ui-page-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--space-construct) var(--space-cluster); min-inline-size: 0; }
  .ui-page-heading { flex: 1 1 14rem; min-inline-size: 0; }
  .ui-page-title-line { display: flex; align-items: baseline; gap: var(--space-2); min-inline-size: 0; }
  .ui-page-mark { display: inline-flex; flex: 0 0 auto; align-self: center; }
  .ui-page-custom-title { display: block; flex: 1 1 auto; min-inline-size: 0; }
  .ui-page-title { min-inline-size: 0; margin: 0; color: var(--ink); font-size: var(--type-page-size); line-height: var(--type-page-line); font-weight: var(--weight-strong); overflow-wrap: anywhere; }
  .ui-page-count { flex: 0 0 auto; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); font-variant-numeric: tabular-nums; }
  .ui-page-count-description { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  .ui-page-description { max-inline-size: 60ch; margin: var(--space-2) 0 0; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); overflow-wrap: anywhere; }
  .ui-page-actions { display: flex; flex: 0 1 auto; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--space-2); max-inline-size: 100%; margin-inline-start: auto; }
</style>
