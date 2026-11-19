import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import {
  CheckboxGroup, DatePicker, Field, Fieldset, Grid, NumberInput, Select, Stack, Text,
  type RecurrenceEditorProps, type RecurrenceValue, type RecurrenceWeekday,
} from "./index.js";
import { parseDate } from "./date-value.js";

const weekdays: readonly RecurrenceWeekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const positiveInteger = (value: number | null) => value !== null && Number.isSafeInteger(value) && value > 0;

function defaultSummary(value: RecurrenceValue, lang: string, weekdayOptions: {value: RecurrenceWeekday;label:string}[]) {
  const quantity = new Intl.NumberFormat(lang, { style: "unit", unit: value.frequency, unitDisplay: "long" });
  const days = value.frequency === "week" ? new Intl.ListFormat(lang).format(
    weekdayOptions.filter(day => value.weekdays.includes(day.value)).map(day => day.label),
  ) : "";
  let ending = "";
  if (value.ending === "date") {
    const date = new Intl.DateTimeFormat(lang, { timeZone: "UTC", dateStyle: "medium" })
      .format(new Date(`${value.untilDate}T00:00:00Z`));
    ending = ` through ${date}`;
  } else if (value.ending === "count") {
    const count = new Intl.NumberFormat(lang).format(value.occurrences!);
    ending = ` for ${count} ${value.occurrences === 1 ? "occurrence" : "occurrences"}`;
  }
  return `Every ${value.interval === 1 ? value.frequency : quantity.format(value.interval!)}${days ? ` on ${days}` : ""}${ending}`;
}

export const RepeatSchedule = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RecurrenceEditorProps>(function RepeatSchedule(
  {
    label, value, onValueChange, names = {}, controlSize = "md", weekStartsOn = 1, minUntilDate,
    datePickerOptions, formatSummary, labels, disabled, lang = "en", form, className, ...props
  },
  ref,
) {
  const weekdaysGroup = useRef<HTMLFieldSetElement>(null);
  const dayFormat = new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" });
  const dayChoices = weekdays.map((_, index) => {
    const day = (index + weekStartsOn) % weekdays.length;
    return { value: weekdays[day], label: dayFormat.format(new Date(Date.UTC(2024, 0, 7 + day))) };
  });
  const needsWeekdays = value.frequency === "week" && !value.weekdays.some(day => weekdays.includes(day));
  const validEnding = value.ending === "date" ? Boolean(parseDate(value.untilDate))
    && (!minUntilDate || value.untilDate >= minUntilDate)
    : value.ending === "count" ? positiveInteger(value.occurrences) : true;
  const summary = positiveInteger(value.interval) && !needsWeekdays && validEnding
    ? (formatSummary ? formatSummary(value) : defaultSummary(value, lang, dayChoices)) : "";
  const emptyWeekdays = labels?.emptyWeekdays ?? "Choose at least one day.";
  const update = (next: Partial<RecurrenceValue>) => onValueChange({ ...value, ...next });
  useBrowserLayoutEffect(() => {
    const first = weekdaysGroup.current?.querySelector("input");
    first?.setCustomValidity(needsWeekdays ? emptyWeekdays : "");
  }, [needsWeekdays, emptyWeekdays]);

  return <Fieldset {...props} ref={ref} lang={lang} form={form} legend={label} disabled={disabled}
    className={["flood-recurrence-editor", className].filter(Boolean).join(" ")}>
    <Stack gap="3">
      <Grid gap="3" minItemWidth="8rem" maxColumns={2}>
        <Field label={labels?.interval ?? "Repeat every"} required>
          {field => <NumberInput {...field} name={names.interval} form={form} controlSize={controlSize}
            appearance="plain" min={1} max={Number.MAX_SAFE_INTEGER} step={1} disabled={disabled}
            value={value.interval} onValueChange={interval => update({ interval })}/>}
        </Field>
        <Field label={labels?.frequency ?? "Period"}>
          {field => <Select {...field} name={names.frequency} form={form} controlSize={controlSize}
            disabled={disabled} value={value.frequency}
            onChange={event => update({ frequency: event.currentTarget.value === "week" ? "week" : "day" })}>
            <option value="day">{labels?.day ?? "Days"}</option>
            <option value="week">{labels?.week ?? "Weeks"}</option>
          </Select>}
        </Field>
      </Grid>
      {value.frequency === "week" && <CheckboxGroup ref={weekdaysGroup} form={form} name={names.weekdays ?? ""}
        className="flood-recurrence-editor__weekdays"
        legend={labels?.weekdays ?? "On days"} orientation="horizontal" options={dayChoices} value={value.weekdays}
        disabled={disabled} onValueChange={next => update({ weekdays: next as RecurrenceWeekday[] })}/>}
      <Grid gap="3" minItemWidth={value.ending === "date" ? "10.5rem" : "8rem"} maxColumns={2}>
        <Field label={labels?.ending ?? "Ends"}>
          {field => <Select {...field} name={names.ending} form={form} controlSize={controlSize}
            disabled={disabled} value={value.ending}
            onChange={event => update({ ending: event.currentTarget.value as RecurrenceValue["ending"] })}>
            <option value="never">{labels?.never ?? "Never"}</option>
            <option value="date">{labels?.onDate ?? "On a date"}</option>
            <option value="count">{labels?.afterCount ?? "After a count"}</option>
          </Select>}
        </Field>
        {value.ending === "date" && <DatePicker {...datePickerOptions} label={labels?.untilDate ?? "End date"}
          name={names.untilDate} form={form} value={value.untilDate} onValueChange={untilDate => update({ untilDate })}
          locale={lang} weekStartsOn={weekStartsOn} controlSize={controlSize} min={minUntilDate} required disabled={disabled}/>}
        {value.ending === "count" && <Field label={labels?.occurrences ?? "Occurrences"} required>
          {field => <NumberInput {...field} name={names.occurrences} form={form} controlSize={controlSize}
            appearance="plain" min={1} max={Number.MAX_SAFE_INTEGER} step={1} disabled={disabled}
            value={value.occurrences} onValueChange={occurrences => update({ occurrences })}/>}
        </Field>}
      </Grid>
      {summary && <Text as="p" size="helper" tone="subtle">{summary}</Text>}
    </Stack>
  </Fieldset>;
});
