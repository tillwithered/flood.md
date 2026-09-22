<script lang="ts">
  export type SegmentOption = { value: string; label: string; disabled?: boolean };

  type Props = {
    label: string;
    options: SegmentOption[];
    value?: string;
    size?: "sm" | "md";
    disabled?: boolean;
    onchange?: (value: string) => void;
  };

  let { label, options, value = $bindable(""), size = "md", disabled = false, onchange }: Props = $props();
  const groupName = `ui-segment-${Math.random().toString(36).slice(2)}`;
</script>

<fieldset class="ui-segmented" data-size={size} {disabled}>
  <legend>{label}</legend>
  <div class="ui-segmented-track">
    {#each options as option (option.value)}
      <label class:active={value === option.value} class:disabled={disabled || option.disabled}>
        <input
          type="radio"
          name={groupName}
          value={option.value}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          onchange={() => {
            value = option.value;
            onchange?.(option.value);
          }}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .ui-segmented { min-inline-size: 0; margin: 0; padding: 0; border: 0; }
  .ui-segmented > legend { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  .ui-segmented-track { --segmented-inset: var(--space-1); --segmented-outer-radius: calc(var(--radius-control) + var(--segmented-inset)); display: inline-flex; max-inline-size: 100%; gap: var(--segmented-inset); padding: var(--segmented-inset); border-radius: var(--segmented-outer-radius); background: var(--surface); }
  .ui-segmented label { position: relative; display: inline-flex; align-items: center; justify-content: center; min-block-size: calc(var(--control-default) - var(--space-2)); min-inline-size: var(--target-min); padding: var(--space-1) var(--space-3); border-radius: max(0px, calc(var(--segmented-outer-radius) - var(--segmented-inset))); color: var(--muted); font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); cursor: pointer; overflow-wrap: anywhere; }
  .ui-segmented[data-size="sm"] label { min-block-size: var(--target-min); padding-inline: var(--space-2); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .ui-segmented label.active { background: var(--background); color: var(--ink); }
  .ui-segmented label:not(.disabled):hover { background: var(--hover); color: var(--ink); }
  .ui-segmented label.disabled { color: var(--faint); cursor: not-allowed; }
  .ui-segmented input { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; }
  .ui-segmented input:focus-visible + span::after { content: ""; position: absolute; inset: 0; border-radius: inherit; outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
</style>
