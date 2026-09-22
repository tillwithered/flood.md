<script lang="ts">
  import { currentLocale, translateCopy } from "../../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = Omit<HTMLInputAttributes, "value" | "size"> & {
    label: string;
    value?: string;
    help?: string;
    error?: string;
    optional?: boolean;
    size?: "sm" | "md";
  };

  let {
    label, value = $bindable(""), help, error, optional = false, size = "md",
    id, class: className, "aria-describedby": ariaDescribedBy, ...rest
  }: Props = $props();

  const generatedId = `ui-field-${Math.random().toString(36).slice(2)}`;
  let inputId = $derived(id ?? generatedId);
  let descriptionId = $derived(`${inputId}-description`);
  let describedBy = $derived([ariaDescribedBy, help || error ? descriptionId : undefined].filter(Boolean).join(" ") || undefined);
</script>

<label class={["ui-text-field", className]} data-size={size}>
  <span class="ui-text-field-label">{label}{#if optional}<small>{tx("Необязательно")}</small>{/if}</span>
  <input {...rest} id={inputId} bind:value aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} />
  {#if error}<small id={descriptionId} class="ui-text-field-error">{error}</small>{:else if help}<small id={descriptionId}>{help}</small>{/if}
</label>

<style>
  .ui-text-field { display: grid; gap: var(--space-2); min-inline-size: 0; color: var(--ink); }
  .ui-text-field-label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .ui-text-field-label small, .ui-text-field > small { color: var(--muted); font-size: var(--type-caption-size); font-weight: var(--weight-regular); line-height: var(--type-caption-line); overflow-wrap: anywhere; }
  .ui-text-field input { inline-size: 100%; min-block-size: var(--control-default); padding: var(--space-2) var(--space-3); border: var(--border-width) solid var(--line); border-radius: var(--radius-control); outline: 0; background: var(--field); color: var(--ink); font: inherit; font-size: var(--type-body-size); line-height: var(--type-body-line); transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
  .ui-text-field[data-size="sm"] input { min-block-size: var(--control-compact); padding-block: var(--space-1); }
  .ui-text-field input:focus-visible { border-color: var(--focus-ring); box-shadow: 0 0 0 var(--focus-width) var(--focus-halo); }
  .ui-text-field input:disabled { color: var(--faint); cursor: not-allowed; }
  .ui-text-field input::placeholder { color: var(--faint); opacity: 1; }
  .ui-text-field input[aria-invalid="true"] { border-color: var(--danger-ink); }
  .ui-text-field input[aria-invalid="true"]:focus-visible { border-color: var(--danger-ink); box-shadow: 0 0 0 var(--focus-width) var(--danger-focus-halo); }
  .ui-text-field-error { color: var(--danger-ink) !important; }
  @media (prefers-reduced-motion: reduce) { .ui-text-field input { transition: none; } }
  :global(:root[data-motion="reduced"]) .ui-text-field input { transition: none; }
</style>
