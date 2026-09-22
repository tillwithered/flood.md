<script lang="ts">
  import type { Snippet } from "svelte";
  import { Minus, PanelLeftClose, PanelLeftOpen, Square, X } from "@lucide/svelte";
  import FloodGlyph from "../FloodGlyph.svelte";

  type Props = {
    title?: string;
    collapsed?: boolean;
    context?: Snippet;
    sidebar?: Snippet;
    actions?: Snippet;
    children?: Snippet;
    oncollapse?: (collapsed: boolean) => void;
    onminimize?: () => void;
    onmaximize?: () => void;
    onclose?: () => void;
  };

  let {
    title = "flood.md",
    collapsed = $bindable(false),
    context,
    sidebar,
    actions,
    children,
    oncollapse,
    onminimize,
    onmaximize,
    onclose
  }: Props = $props();

  function toggleSidebar() {
    collapsed = !collapsed;
    oncollapse?.(collapsed);
  }
</script>

<main class="ui-app-shell" class:is-collapsed={collapsed}>
  <header class="ui-app-titlebar" data-tauri-drag-region="deep">
    <div class="ui-app-brand" data-tauri-drag-region="deep">
      {#if !collapsed}
        <FloodGlyph kind="brand" size={22} />
        <strong>{title}</strong>
      {/if}
      <button class="ui-shell-icon ui-collapse" type="button" aria-label={collapsed ? "Развернуть панель" : "Свернуть панель"} aria-expanded={!collapsed} aria-controls="flood-app-sidebar" data-tauri-drag-region="false" onclick={toggleSidebar}>
        {#if collapsed}<PanelLeftOpen size={17} />{:else}<PanelLeftClose size={17} />{/if}
      </button>
    </div>

    <div class="ui-app-context" data-tauri-drag-region="deep">
      {#if context}{@render context()}{/if}
    </div>

    <div class="ui-app-actions" data-tauri-drag-region="false">
      {#if actions}<div class="ui-app-page-actions">{@render actions()}</div>{/if}
      <div class="ui-window-controls" aria-label="Управление окном">
        <button type="button" aria-label="Свернуть" onclick={onminimize}><Minus size={15} strokeWidth={1.6} /></button>
        <button type="button" aria-label="Развернуть" onclick={onmaximize}><Square size={12} strokeWidth={1.6} /></button>
        <button class="ui-window-close" type="button" aria-label="Закрыть" onclick={onclose}><X size={16} strokeWidth={1.6} /></button>
      </div>
    </div>
  </header>

  <div class="ui-app-body">
    <aside id="flood-app-sidebar" class="ui-app-sidebar" aria-label="Навигация">
      {#if sidebar}{@render sidebar()}{/if}
    </aside>
    <section class="ui-app-workspace" aria-label="Рабочая область">
      {#if children}{@render children()}{/if}
    </section>
  </div>
</main>

<style>
  .ui-app-shell {
    --shell-sidebar: var(--sidebar-expanded);
    display: grid;
    grid-template-rows: calc(var(--control-default) + var(--space-3)) minmax(0, 1fr);
    inline-size: 100%;
    block-size: 100dvh;
    min-inline-size: 0;
    overflow: hidden;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E"),
      linear-gradient(180deg, var(--canvas) 0%, var(--canvas-depth) 100%);
    background-size: 160px 160px, 100% 100%;
    background-blend-mode: soft-light, normal;
    color: var(--ink);
  }
  .ui-app-shell.is-collapsed { --shell-sidebar: var(--sidebar-collapsed); }
  .ui-app-titlebar {
    display: grid;
    grid-template-columns: var(--shell-sidebar) minmax(0, 1fr) auto;
    min-inline-size: 0;
    background: transparent;
    user-select: none;
    transition: grid-template-columns var(--duration-enter) var(--ease-standard);
  }
  .ui-app-brand {
    display: flex;
    min-inline-size: 0;
    align-items: center;
    gap: 9px;
    padding-inline: var(--space-3) var(--space-2);
    background: transparent;
  }
  .ui-app-brand strong {
    min-inline-size: 0;
    overflow: hidden;
    font-size: var(--type-body-size);
    font-weight: var(--weight-medium);
    line-height: var(--type-body-line);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .is-collapsed .ui-app-brand { justify-content: center; padding-inline: 0; }
  .ui-shell-icon {
    display: grid;
    inline-size: 34px;
    block-size: 34px;
    flex: 0 0 auto;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .ui-shell-icon:hover { background: var(--hover); color: var(--ink); }
  .ui-shell-icon:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(var(--focus-offset) * -1); }
  .ui-collapse { margin-inline-start: auto; }
  .is-collapsed .ui-collapse { margin-inline-start: 0; }
  .ui-app-context {
    display: flex;
    min-inline-size: 0;
    align-items: center;
    padding-inline: var(--space-3);
    color: var(--muted);
    font-size: var(--type-compact-size);
    line-height: var(--type-compact-line);
  }
  .ui-app-actions { display: flex; min-inline-size: 0; align-items: stretch; }
  .ui-app-page-actions { display: flex; align-items: center; gap: var(--space-2); padding-inline: var(--space-2); }
  .ui-window-controls { display: flex; align-items: stretch; }
  .ui-window-controls button {
    display: grid;
    inline-size: 44px;
    block-size: 100%;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .ui-window-controls button:hover { background: var(--hover); color: var(--ink); }
  .ui-window-controls button:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(var(--focus-width) * -1); }
  .ui-window-controls .ui-window-close:hover { background: var(--danger-ink); color: var(--on-notice-danger-action); }
  .ui-app-body {
    display: grid;
    grid-template-columns: var(--shell-sidebar) minmax(0, 1fr);
    gap: var(--space-2);
    min-block-size: 0;
    min-inline-size: 0;
    padding: 0 var(--space-2) var(--space-2) 0;
    transition: grid-template-columns var(--duration-enter) var(--ease-standard);
  }
  .ui-app-sidebar {
    display: flex;
    min-block-size: 0;
    min-inline-size: 0;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
  }
  .ui-app-workspace {
    min-block-size: 0;
    min-inline-size: 0;
    overflow: auto;
    border: var(--border-width) solid var(--soft-line);
    border-radius: var(--radius-panel);
    background: var(--background);
    scrollbar-gutter: stable;
  }
  @media (prefers-reduced-motion: reduce) {
    .ui-app-titlebar, .ui-app-body { transition: none; }
  }
  :global(:root[data-motion="reduced"]) .ui-app-titlebar,
  :global(:root[data-motion="reduced"]) .ui-app-body { transition: none; }
  @media (forced-colors: active) {
    .ui-app-workspace { border-color: CanvasText; }
  }
</style>
