<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  type Props = Omit<HTMLTextareaAttributes, "value"> & {
    label: string;
    value?: string;
    help?: string;
    error?: string;
    optional?: boolean;
  };

  let {
    label, value = $bindable(""), help, error, optional = false,
    id, class: className, "aria-describedby": ariaDescribedBy, rows = 4, ...rest
  }: Props = $props();

  const generatedId = `ui-textarea-${Math.random().toString(36).slice(2)}`;
  let inputId = $derived(id ?? generatedId);
  let descriptionId = $derived(`${inputId}-description`);
  let describedBy = $derived([ariaDescribedBy, help || error ? descriptionId : undefined].filter(Boolean).join(" ") || undefined);
</script>

<label class={["ui-text-area", className]}>
  <span class="ui-text-area-label">{label}{#if optional}<small>Необязательно</small>{/if}</span>
  <textarea {...rest} id={inputId} {rows} bind:value aria-invalid={error ? "true" : undefined} aria-describedby={describedBy}></textarea>
  {#if error}<small id={descriptionId} class="ui-text-area-error">{error}</small>{:else if help}<small id={descriptionId}>{help}</small>{/if}
</label>

<style>
  .ui-text-area { display: grid; gap: var(--space-2); min-inline-size: 0; color: var(--ink); }
  .ui-text-area-label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .ui-text-area-label small, .ui-text-area > small { color: var(--muted); font-size: var(--type-caption-size); font-weight: var(--weight-regular); line-height: var(--type-caption-line); overflow-wrap: anywhere; }
  .ui-text-area textarea { inline-size: 100%; min-block-size: 112px; resize: vertical; padding: var(--space-3); border: var(--border-width) solid var(--line); border-radius: var(--radius-control); outline: 0; background: var(--field); color: var(--ink); font: inherit; font-size: var(--type-body-size); line-height: var(--type-body-line); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
  .ui-text-area textarea:focus-visible { border-color: var(--focus-ring); box-shadow: 0 0 0 var(--focus-width) var(--focus-halo); }
  .ui-text-area textarea:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-text-area textarea::placeholder { color: var(--faint); opacity: 1; }
  .ui-text-area textarea[aria-invalid="true"] { border-color: var(--danger-ink); }
  .ui-text-area textarea[aria-invalid="true"]:focus-visible { border-color: var(--danger-ink); box-shadow: 0 0 0 var(--focus-width) var(--danger-focus-halo); }
  .ui-text-area-error { color: var(--danger-ink) !important; }
  @media (prefers-reduced-motion: reduce) { .ui-text-area textarea { transition: none; } }
  :global(:root[data-motion="reduced"]) .ui-text-area textarea { transition: none; }
</style>
