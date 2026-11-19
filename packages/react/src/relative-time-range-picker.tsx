import { forwardRef } from "react";
import {
  DateTimeRangePicker, Field, Fieldset, Grid, Inline, NumberInput, SegmentedControl, Select, Stack, Text, Toggle,
  type RelativeTimeRangePickerProps, type RelativeTimeRangeValue, type RelativeTimeUnit,
} from "./index.js";

const units = ["minute", "hour", "day", "week"] as const;
const unitLabels = { minute: "Minutes", hour: "Hours", day: "Days", week: "Weeks" };
const defaultPresets = [
  { amount: 15, unit: "minute", label: "Last 15 min" },
  { amount: 1, unit: "hour", label: "Last hour" },
  { amount: 24, unit: "hour", label: "Last 24 hr" },
  { amount: 7, unit: "day", label: "Last 7 days" },
] as const;

const presetKey = ({ amount, unit }: RelativeTimeRangeValue["relative"]) => `${amount}:${unit}`;

export const TimeRangeEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RelativeTimeRangePickerProps>(function TimeRangeEditor(
  {
    label, hideLabel, value, onValueChange, presets = defaultPresets, timeZones = [], controlSize = "md",
    absoluteOptions, labels, disabled, form, className, lang, ...props
  },
  ref,
) {
  const modes = [
    { value: "relative", label: labels?.relative ?? "Relative" },
    { value: "absolute", label: labels?.absolute ?? "Absolute" },
  ];
  if (!label.trim() || !value.timeZone.trim()) {
    throw new Error("Flood RelativeTimeRangePicker requires a label and a time zone");
  }
  if (presets.some(({ amount, unit, label }) => !Number.isSafeInteger(amount) || amount < 1 || !units.includes(unit) || !label.trim())
    || new Set(presets.map(presetKey)).size !== presets.length) {
    throw new Error("Flood RelativeTimeRangePicker presets require positive whole amounts and unique durations");
  }
  if (timeZones.some(({ value, label }) => !value.trim() || !label.trim())
    || new Set(timeZones.map(zone => zone.value)).size !== timeZones.length) {
    throw new Error("Flood RelativeTimeRangePicker time zones require unique values and labels");
  }

  const zoneLabel = labels?.timeZone ?? "Time zone";
  const selectedZone = timeZones.find(zone => zone.value === value.timeZone);
  const setRelative = (relative: RelativeTimeRangeValue["relative"]) => onValueChange({ ...value, relative });
  const setMode = (mode: string) => {
    if (mode === "relative" || mode === "absolute") onValueChange({ ...value, mode });
  };

  return <Fieldset {...props} ref={ref} lang={lang} form={form} legend={label} hideLabel={hideLabel} disabled={disabled}
    className={["flood-relative-time-range-picker", className].filter(Boolean).join(" ")}>
    <Stack gap="3">
      <Inline gap="3" className="flood-relative-time-range-picker__header">
        <SegmentedControl label={labels?.mode ?? "Range type"} options={modes} name="" hideLabel
          disabled={disabled} controlSize="sm" value={value.mode} onValueChange={setMode}/>
        {timeZones.length === 0 && <Text as="span" size="helper" tone="subtle">{zoneLabel}: {value.timeZone}</Text>}
      </Inline>
      {value.mode === "relative"
        ? <>
          {presets.length > 0 && <Inline gap="2" role="group" aria-label={labels?.presets ?? "Quick ranges"}>
            {presets.map(({ amount, unit, label }) => <Toggle key={presetKey({ amount, unit })}
              size="sm" variant="outline" disabled={disabled}
              pressed={value.relative.amount === amount && value.relative.unit === unit}
              onPressedChange={pressed => { if (pressed) setRelative({ amount, unit }); }}>{label}</Toggle>)}
          </Inline>}
          <Grid gap="3" minItemWidth="7rem" maxColumns={2}>
            <Field label={labels?.amount ?? "Amount"} required>
              {field => <NumberInput {...field} value={value.relative.amount} form={form}
                onValueChange={amount => setRelative({ ...value.relative, amount })}
                min={1} step={1} appearance="plain" controlSize={controlSize} disabled={disabled}/>}
            </Field>
            <Field label={labels?.unit ?? "Unit"}>
              {field => <Select {...field} value={value.relative.unit} form={form}
                onChange={event => setRelative({ ...value.relative, unit: event.currentTarget.value as RelativeTimeUnit })}
                controlSize={controlSize} disabled={disabled}>
                {units.map(unit => <option key={unit} value={unit}>{labels?.units?.[unit] ?? unitLabels[unit]}</option>)}
              </Select>}
            </Field>
          </Grid>
        </>
        : <DateTimeRangePicker {...absoluteOptions} label={labels?.absolute ?? "Absolute"} hideLabel
          value={value.absolute} onValueChange={absolute => onValueChange({ ...value, absolute })}
          locale={absoluteOptions?.locale ?? lang} form={form} disabled={disabled} required controlSize={controlSize}/>}
      {timeZones.length > 0 && <Field label={zoneLabel}>
        {field => <Select {...field} value={value.timeZone} form={form} disabled={disabled} controlSize={controlSize}
          onChange={event => onValueChange({ ...value, timeZone: event.currentTarget.value })}>
          {!selectedZone && <option value={value.timeZone}>{value.timeZone}</option>}
          {timeZones.map(zone => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
        </Select>}
      </Field>}
    </Stack>
  </Fieldset>;
});
