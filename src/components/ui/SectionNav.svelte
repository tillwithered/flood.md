<script module lang="ts">
  export type SectionNavItem = { id: string; label: string; disabled?: boolean; count?: number };
</script>

<script lang="ts">
  type Props = {
    label: string;
    items: readonly SectionNavItem[];
    activeId: string;
    onselect: (id: string) => void;
    class?: string;
  };
  let { label, items, activeId, onselect, class: className = "" }: Props = $props();
  let navElement: HTMLElement | undefined = $state();

  function revealItem(button: HTMLButtonElement) {
    if (!navElement) return;
    const container = navElement.getBoundingClientRect();
    const item = button.getBoundingClientRect();
    const delta = item.left < container.left ? item.left - container.left : item.right > container.right ? item.right - container.right : 0;
    // Scroll only this navigation strip, never a containing page or editor.
    if (delta) navElement.scrollBy({ left: delta, behavior: "instant" });
  }

  $effect(() => {
    const currentId = activeId;
    const currentButton = navElement && [...navElement.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.dataset.sectionId === currentId);
    if (!currentButton || !navElement) return;
    revealItem(currentButton);
    const observer = new ResizeObserver(() => revealItem(currentButton));
    observer.observe(navElement);
    observer.observe(currentButton);
    return () => observer.disconnect();
  });
</script>

<nav class={["ui-section-nav", className]} aria-label={label} bind:this={navElement}>
  {#each items as item (item.id)}
    <button
      type="button"
      class="ui-section-link"
      data-section-id={item.id}
      aria-current={activeId === item.id ? "page" : undefined}
      disabled={item.disabled}
      onclick={() => onselect(item.id)}
      onfocus={(event) => revealItem(event.currentTarget)}
    >
      <span>{item.label}</span>
      {#if item.count !== undefined}<span class="ui-section-count">{item.count}</span>{/if}
    </button>
  {/each}
</nav>

<style>
  .ui-section-nav { display: flex; align-items: stretch; gap: var(--space-1); min-inline-size: 0; max-inline-size: 100%; padding: var(--space-2) var(--space-1); overflow-x: auto; border-block-end: var(--border-width) solid var(--soft-line); scrollbar-width: none; scroll-padding-inline: var(--space-1); }
  .ui-section-nav::-webkit-scrollbar { display: none; }
  .ui-section-link { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; gap: var(--space-2); min-block-size: var(--control-default); padding: var(--space-2) var(--space-3); border: 0; border-radius: var(--radius-control); background: transparent; color: var(--muted); font-family: var(--font-family-ui); font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); cursor: pointer; }
  .ui-section-link:not(:disabled):hover { background: var(--hover); color: var(--ink); }
  .ui-section-link[aria-current] { background: var(--selected); color: var(--ink); }
  .ui-section-link:not(:disabled):active { background: var(--pressed); }
  .ui-section-link:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(-1 * var(--focus-width)); }
  .ui-section-link:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-section-count { font-size: var(--type-compact-size); line-height: var(--type-compact-line); font-variant-numeric: tabular-nums; }
  @media (forced-colors: active) {
    .ui-section-nav { border-color: CanvasText; }
    .ui-section-link { color: ButtonText; }
    .ui-section-link[aria-current] { color: HighlightText; background: Highlight; forced-color-adjust: none; }
    .ui-section-link:disabled { color: GrayText; }
    .ui-section-link:focus-visible { outline-color: Highlight; outline-offset: 0; }
    .ui-section-link[aria-current]:focus-visible { outline-color: CanvasText; }
  }
</style>
