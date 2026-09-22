<script lang="ts">
  import { currentLocale, translateCopy } from "../../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import { Check, ChevronDown } from "@lucide/svelte";
  import { tick } from "svelte";

  export type SelectOption = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  };

  type Props = {
    label: string;
    options: SelectOption[];
    value?: string;
    help?: string;
    error?: string;
    optional?: boolean;
    disabled?: boolean;
    size?: "sm" | "md";
    id?: string;
    class?: string;
    onchange?: (value: string) => void;
  };

  let {
    label, options, value = $bindable(""), help, error, optional = false,
    disabled = false, size = "md", id, class: className, onchange
  }: Props = $props();

  const generatedId = `ui-select-${Math.random().toString(36).slice(2)}`;
  let selectId = $derived(id ?? generatedId);
  let labelId = $derived(`${selectId}-label`);
  let valueId = $derived(`${selectId}-value`);
  let listboxId = $derived(`${selectId}-listbox`);
  let descriptionId = $derived(`${selectId}-description`);
  let selectedOption = $derived(options.find((option) => option.value === value));
  let open = $state(false);
  let activeIndex = $state(0);
  let popupStyle = $state("");
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  function enabledIndex(start: number, direction: 1 | -1, wrap = true) {
    if (!options.length) return -1;
    let index = start;
    for (let attempts = 0; attempts < options.length; attempts += 1) {
      if (index < 0 || index >= options.length) {
        if (!wrap) return -1;
        index = index < 0 ? options.length - 1 : 0;
      }
      if (!options[index]?.disabled) return index;
      index += direction;
    }
    return -1;
  }

  async function focusOption(index: number) {
    if (index < 0) return;
    activeIndex = index;
    await tick();
    root?.querySelector<HTMLButtonElement>(`[data-option-index="${index}"]`)?.focus();
  }

  async function placeListbox() {
    const triggerRect = trigger.getBoundingClientRect();
    const inset = 8;
    const gap = 4;
    popupStyle = `--select-top:${triggerRect.bottom + gap}px;--select-left:${triggerRect.left}px;--select-width:${triggerRect.width}px`;
    await tick();
    const listbox = root?.querySelector<HTMLElement>(".ui-select-listbox");
    if (listbox && listbox.getBoundingClientRect().bottom > window.innerHeight - inset) {
      popupStyle = `--select-top:${Math.max(inset, triggerRect.top - listbox.offsetHeight - gap)}px;--select-left:${triggerRect.left}px;--select-width:${triggerRect.width}px`;
    }
  }

  async function openSelect(preferLast = false) {
    if (disabled || !options.length) return;
    open = true;
    await placeListbox();
    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    const fallback = enabledIndex(preferLast ? options.length - 1 : 0, preferLast ? -1 : 1);
    await focusOption(selectedIndex >= 0 ? selectedIndex : fallback);
  }

  function closeSelect(returnFocus = false) {
    open = false;
    typeahead = "";
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    if (returnFocus) queueMicrotask(() => trigger?.focus());
  }

  function choose(option: SelectOption) {
    if (option.disabled) return;
    value = option.value;
    onchange?.(option.value);
    closeSelect(true);
  }

  function move(direction: 1 | -1) {
    const next = enabledIndex(activeIndex + direction, direction);
    void focusOption(next);
  }

  function matchTypeahead(key: string) {
    typeahead += key.toLocaleLowerCase("ru-RU");
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeaheadTimer = setTimeout(() => { typeahead = ""; }, 500);
    const start = Math.max(activeIndex + 1, 0);
    const ordered = [...options.slice(start), ...options.slice(0, start)];
    const match = ordered.find((option) => !option.disabled && option.label.toLocaleLowerCase("ru-RU").startsWith(typeahead));
    if (match) void focusOption(options.indexOf(match));
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && (event.key === "Enter" || event.key === " ")) closeSelect();
      else void openSelect(event.key === "ArrowUp" || event.key === "End");
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeSelect(true);
    }
  }

  function handleOptionKeydown(event: KeyboardEvent, option: SelectOption) {
    if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
    else if (event.key === "Home") { event.preventDefault(); void focusOption(enabledIndex(0, 1)); }
    else if (event.key === "End") { event.preventDefault(); void focusOption(enabledIndex(options.length - 1, -1)); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(option); }
    else if (event.key === "Escape") { event.preventDefault(); closeSelect(true); }
    else if (event.key === "Tab") closeSelect();
    else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) matchTypeahead(event.key);
  }

  function handleOutside(event: PointerEvent) {
    if (open && event.target instanceof Node && !root?.contains(event.target)) closeSelect();
  }
</script>

<svelte:window onpointerdown={handleOutside} onresize={() => { if (open) closeSelect(); }} />

<div bind:this={root} class={["ui-select", className]} data-size={size}>
  <span class="ui-select-label" id={labelId}>{label}{#if optional}<small>{tx("Необязательно")}</small>{/if}</span>
  <button
    bind:this={trigger}
    type="button"
    class="ui-select-trigger"
    aria-labelledby={`${labelId} ${valueId}`}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listboxId}
    aria-describedby={help || error ? descriptionId : undefined}
    data-invalid={error ? "true" : undefined}
    {disabled}
    onclick={() => open ? closeSelect() : void openSelect()}
    onkeydown={handleTriggerKeydown}
  >
    <span id={valueId}>{selectedOption?.label ?? tx("Выберите")}</span>
    <span class="ui-select-chevron" aria-hidden="true"><ChevronDown size={16} /></span>
  </button>

  {#if open}
    <div class="ui-select-listbox" id={listboxId} role="listbox" aria-labelledby={labelId} style={popupStyle}>
      {#each options as option, index (option.value)}
        <button
          type="button"
          role="option"
          tabindex="-1"
          data-option-index={index}
          aria-selected={value === option.value}
          disabled={option.disabled}
          onclick={() => choose(option)}
          onkeydown={(event) => handleOptionKeydown(event, option)}
          onpointermove={() => { if (!option.disabled) activeIndex = index; }}
        >
          <span><strong>{option.label}</strong>{#if option.description}<small>{option.description}</small>{/if}</span>
          {#if value === option.value}<Check size={16} aria-hidden="true" />{/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if error}<small id={descriptionId} class="ui-select-error">{error}</small>{:else if help}<small id={descriptionId}>{help}</small>{/if}
</div>

<style>
  .ui-select { position: relative; display: grid; gap: var(--space-2); min-inline-size: 0; color: var(--ink); }
  .ui-select-label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .ui-select-label small, .ui-select > small { color: var(--muted); font-size: var(--type-caption-size); font-weight: var(--weight-regular); line-height: var(--type-caption-line); overflow-wrap: anywhere; }
  .ui-select-trigger { display: grid; inline-size: 100%; min-block-size: var(--control-default); grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border: var(--border-width) solid var(--line); border-radius: var(--radius-control); outline: 0; background: var(--field); color: var(--ink); font: inherit; font-size: var(--type-body-size); line-height: var(--type-body-line); text-align: start; cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard); }
  .ui-select[data-size="sm"] .ui-select-trigger { min-block-size: var(--control-compact); padding-block: var(--space-1); }
  .ui-select-trigger > span { min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ui-select-chevron { display: grid; color: var(--muted); transition: transform var(--duration-fast) var(--ease-standard); }
  .ui-select-trigger[aria-expanded="true"] .ui-select-chevron { transform: rotate(180deg); }
  .ui-select-trigger:hover { background: var(--hover); }
  .ui-select-trigger:focus-visible { border-color: var(--focus-ring); box-shadow: 0 0 0 var(--focus-width) var(--focus-halo); }
  .ui-select-trigger[data-invalid="true"] { border-color: var(--danger-ink); }
  .ui-select-trigger[data-invalid="true"]:focus-visible { box-shadow: 0 0 0 var(--focus-width) var(--danger-focus-halo); }
  .ui-select-trigger:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-select-listbox { position: fixed; z-index: var(--layer-popover); inset-block-start: var(--select-top); inset-inline-start: var(--select-left); display: grid; inline-size: var(--select-width); max-block-size: min(240px, 45dvh); gap: var(--space-1); padding: var(--space-1); overflow-y: auto; border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-control); background: var(--elevated); box-shadow: var(--elevation-overlay); }
  .ui-select-listbox button { display: grid; min-block-size: var(--control-default); grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border: 0; border-radius: max(0px, calc(var(--radius-control) - var(--space-1))); outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: var(--type-body-size); line-height: var(--type-body-line); text-align: start; cursor: pointer; }
  .ui-select-listbox button > span { display: grid; min-inline-size: 0; }
  .ui-select-listbox button strong { font-weight: var(--weight-regular); overflow-wrap: anywhere; }
  .ui-select-listbox button small { color: var(--muted); font-size: var(--type-caption-size); line-height: var(--type-caption-line); overflow-wrap: anywhere; }
  .ui-select-listbox button:hover, .ui-select-listbox button:focus-visible { background: var(--hover); }
  .ui-select-listbox button[aria-selected="true"] { background: var(--selected); }
  .ui-select-listbox button[aria-selected="true"] strong { font-weight: var(--weight-medium); }
  .ui-select-listbox button:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-select-error { color: var(--danger-ink) !important; }
  @media (prefers-reduced-motion: reduce) { .ui-select-trigger, .ui-select-chevron { transition: none; } }
  :global(:root[data-motion="reduced"]) .ui-select-trigger, :global(:root[data-motion="reduced"]) .ui-select-chevron { transition: none; }
  @media (forced-colors: active) { .ui-select-trigger, .ui-select-listbox, .ui-select-listbox button { border-color: CanvasText; } .ui-select-listbox button:hover, .ui-select-listbox button:focus-visible, .ui-select-listbox button[aria-selected="true"] { background: Highlight; color: HighlightText; } }
</style>
