import { forwardRef, useMemo } from "react";
import { Combobox, type ComboboxOption, type TimeZoneOption, type TimeZoneSelectProps } from "./index.js";
import { parseInstant } from "./timestamp.js";

function zoneOption(zone: TimeZoneOption, instant: Date, locale: string): ComboboxOption {
  const { value, label, aliases, group, disabled } = zone;
  if (/^[+-]/.test(value) || !value.trim()) throw new Error("Flood TimeZoneSelect requires named time zones");
  const format = new Intl.DateTimeFormat(locale, { timeZone: value, timeZoneName: "shortOffset" });
  const offset = format.formatToParts(instant).find(part => part.type === "timeZoneName")?.value;
  const name = label ?? value.split("/").at(-1)!.replaceAll("_", " ");
  return {
    value, disabled, group,
    label: offset && offset !== name && !(name === "UTC" && offset === "GMT") ? `${name} · ${offset}` : name,
    keywords: [
      value, value.replaceAll("/", " ").replaceAll("_", " "),
      ...(offset?.startsWith("GMT") ? [offset.replace(/^GMT/, "UTC")] : []), ...(aliases ?? []),
    ],
  };
}

function formatZoneOptions(zones: readonly TimeZoneOption[], instant: Date, locale: string) {
  const formatted = zones.map(zone => zoneOption(zone, instant, locale));
  const count = new Map<string, number>();
  formatted.forEach(option => count.set(option.label, (count.get(option.label) ?? 0) + 1));
  return formatted.map(option => (count.get(option.label) ?? 0) > 1
    ? { ...option, description: option.value }
    : option);
}

export const NamedTimeZoneSelect = /* @__PURE__ */ forwardRef<HTMLInputElement, TimeZoneSelectProps>(function NamedTimeZoneSelect(
  {
    options, selectedOptions, referenceTime, locale, lang, listLabel = "Time zones", toggleLabel = "Show time zones",
    emptyMessage = "No time zones found.", ...props
  },
  ref,
) {
  const language = locale ?? lang ?? "en";
  const [formatted, formattedSelected] = useMemo(() => {
    const instant = parseInstant(referenceTime, "TimeZoneSelect");
    return [
      formatZoneOptions(options, instant, language),
      selectedOptions && formatZoneOptions(selectedOptions, instant, language),
    ] as const;
  }, [options, selectedOptions, referenceTime, language]);
  return <Combobox {...props} ref={ref} lang={lang ?? language} options={formatted} selectedOptions={formattedSelected}
    listLabel={listLabel} toggleLabel={toggleLabel} emptyMessage={emptyMessage}/>;
});
