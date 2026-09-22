<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "@lucide/svelte";
  import UiIconButton from "./IconButton.svelte";

  type Props = {
    open?: boolean;
    size?: "md" | "lg";
    title: string;
    subtitle?: string;
    closeLabel?: string;
    children?: Snippet;
    footer?: Snippet;
    onclose?: () => void;
  };

  let { open = $bindable(false), size = "md", title, subtitle, closeLabel = "Закрыть", children, footer, onclose }: Props = $props();
  let dialog: HTMLDialogElement;
  let returnFocus: HTMLElement | null = null;
  const titleId = `ui-modal-${Math.random().toString(36).slice(2)}`;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      queueMicrotask(() => (dialog.querySelector<HTMLElement>(".ui-modal-body button, .ui-modal-body input, .ui-modal-body select, .ui-modal-body textarea") ?? dialog.querySelector<HTMLElement>("button"))?.focus());
    } else if (!open && dialog.open) dialog.close();
  });

  function requestClose() { open = false; }
  function handleClose() {
    open = false;
    onclose?.();
    queueMicrotask(() => returnFocus?.focus());
  }
</script>

<dialog bind:this={dialog} class="ui-modal" data-size={size} aria-labelledby={titleId} oncancel={(event) => { event.preventDefault(); requestClose(); }} onclose={handleClose} onclick={(event) => { if (event.target === dialog) requestClose(); }}>
  <section class="ui-modal-panel">
    <header class="ui-modal-header">
      <div>
        <h2 id={titleId}>{title}</h2>
        {#if subtitle}<p>{subtitle}</p>{/if}
      </div>
      <UiIconButton label={closeLabel} onclick={requestClose}><X size={17} /></UiIconButton>
    </header>
    <div class="ui-modal-body">{#if children}{@render children()}{/if}</div>
    {#if footer}<footer class="ui-modal-footer">{@render footer()}</footer>{/if}
  </section>
</dialog>

<style>
  .ui-modal { inline-size: min(560px, calc(100vw - var(--space-12))); max-inline-size: none; max-block-size: calc(100dvh - var(--space-12)); padding: 0; overflow: visible; border: 0; background: transparent; color: var(--ink); }
  .ui-modal[data-size="lg"] { inline-size: min(880px, calc(100vw - var(--space-12))); }
  .ui-modal::backdrop { background: var(--scrim); backdrop-filter: blur(4px); }
  .ui-modal[open]::backdrop { animation: ui-modal-backdrop-in var(--duration-fast) var(--ease-standard); }
  .ui-modal-panel { display: grid; max-block-size: calc(100dvh - var(--space-12)); grid-template-rows: auto minmax(0, 1fr) auto; overflow: hidden; border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-panel); background: var(--elevated); box-shadow: var(--elevation-overlay); }
  .ui-modal[open] .ui-modal-panel { animation: ui-modal-panel-in var(--duration-enter) var(--ease-standard); }
  .ui-modal-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: var(--space-4); padding: var(--space-6) var(--space-6) var(--space-4); }
  .ui-modal-header h2 { margin: 0; font-size: var(--type-title-size); font-weight: var(--weight-medium); line-height: var(--type-title-line); }
  .ui-modal-header p { margin: var(--space-1) 0 0; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .ui-modal-body { min-block-size: 0; padding: var(--space-2) var(--space-6) var(--space-6); overflow: auto; scrollbar-gutter: stable both-edges; }
  .ui-modal-footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-6) var(--space-6); }
  @media (max-width: 640px) {
    .ui-modal { inline-size: calc(100vw - var(--space-4)); max-block-size: calc(100dvh - var(--space-4)); }
    .ui-modal-panel { max-block-size: calc(100dvh - var(--space-4)); }
    .ui-modal-header { padding: var(--space-4) var(--space-4) var(--space-3); }
    .ui-modal-body { padding: var(--space-2) var(--space-4) var(--space-4); }
    .ui-modal-footer { padding: var(--space-3) var(--space-4) var(--space-4); }
  }
  @keyframes ui-modal-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ui-modal-panel-in { from { opacity: 0; transform: translateY(var(--space-2)) scale(.985); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .ui-modal::backdrop { backdrop-filter: none; } .ui-modal[open]::backdrop, .ui-modal[open] .ui-modal-panel { animation: none; } }
  :global(:root[data-motion="reduced"]) .ui-modal[open]::backdrop,
  :global(:root[data-motion="reduced"]) .ui-modal[open] .ui-modal-panel { animation: none; }
  @media (forced-colors: active) { .ui-modal::backdrop { background: Canvas; opacity: .75; } .ui-modal-panel { border-color: CanvasText; } }
</style>
