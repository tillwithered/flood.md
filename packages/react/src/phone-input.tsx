import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from "react";
import {AsYouType, getCountries, getCountryCallingCode, parseDigits, parseIncompletePhoneNumber, type CountryCode} from "libphonenumber-js/min";
import {Combobox, Input, type InputProps} from "./index.js";

export type PhoneInputCountry = CountryCode;

export interface PhoneInputDetails {
  country?: PhoneInputCountry;
  /** Valid international number such as +12025550123. */
  e164?: string;
}

export interface PhoneInputProps extends Omit<InputProps, "value" | "defaultValue" | "type" | "onChange" | "maxLength" | "minLength"> {
  /** Dialable draft digits, including the leading + when entered in international format. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, details: PhoneInputDetails) => void;
  country?: PhoneInputCountry;
  defaultCountry?: PhoneInputCountry;
  onCountryChange?: (country: PhoneInputCountry | undefined) => void;
  /** Limit the chooser to these country codes. International numbers remain accepted. */
  countries?: readonly PhoneInputCountry[];
  locale?: string;
  labels?: {country?: string; international?: string; internationalShort?: string; invalid?: string};
}

const supported = /* @__PURE__ */ getCountries();
const international = "international";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function format(value: string, country?: CountryCode) {
  const formatter = new AsYouType(country);
  const display = formatter.input(value);
  const number = formatter.getNumber();
  return {
    display,
    country: value.startsWith("+") ? number?.country ?? formatter.getCountry() : country,
    e164: number?.isValid() ? number.number : undefined,
    national: number?.nationalNumber,
  };
}

function cursorAfter(text: string, count: number) {
  if (!count) return 0;
  for (let i = 0; i < text.length; i++) {
    if ((/\d/.test(text[i]) || text[i] === "+") && --count === 0) return i + 1;
  }
  return text.length;
}

/** Enter a national or international telephone number with an explicit country chooser. */
export const PhoneInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput({
  value, defaultValue = "", country, defaultCountry, onCountryChange, onValueChange, countries = supported, locale,
  labels, name, form, required, disabled, readOnly, hidden, className, style, controlSize = "md",
  autoComplete = "tel", onCompositionStart, onCompositionEnd, ...props
}, ref) {
  const control = useRef<HTMLInputElement>(null);
  const initial = useRef({value: defaultValue, country: defaultCountry});
  const [localValue, setValue] = useState(defaultValue);
  const [localCountry, setCountry] = useState(defaultCountry);
  const [draft, setDraft] = useState<string>();
  const composing = useRef(false);
  const position = useRef<{value: string; count: number} | undefined>(undefined);
  const raw = parseIncompletePhoneNumber(value ?? localValue);
  const fallback = country ?? localCountry;
  const formatted = format(raw, fallback);
  const selected = formatted.country && countries.includes(formatted.country) ? formatted.country
    : fallback && countries.includes(fallback) ? fallback : international;
  const options = useMemo(() => {
    const displayNames = new Intl.DisplayNames(locale ?? "en", {type: "region"});
    const sort = new Intl.Collator(locale ?? "en");
    return Array.from(new Set(countries), code => ({
      code, name: displayNames.of(code) ?? code, prefix: getCountryCallingCode(code),
    })).sort((a, b) => sort.compare(a.name, b.name));
  }, [countries, locale]);

  useImperativeHandle(ref, () => control.current!, []);
  useBrowserLayoutEffect(() => {
    const node = control.current;
    if (!node) return;
    const next = position.current;
    if (next && node.ownerDocument.activeElement === node) {
      const caret = next.value === raw ? cursorAfter(formatted.display, next.count)
        : Math.min(node.selectionStart ?? 0, formatted.display.length);
      node.setSelectionRange(caret, caret);
      position.current = undefined;
    }
    node.setCustomValidity(!readOnly && raw && !formatted.e164 ? labels?.invalid ?? "Enter a valid phone number." : "");
  });

  useEffect(() => {
    const owner = control.current?.form;
    if (!owner) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (event: Event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setValue(initial.current.value);
        if (country === undefined) setCountry(initial.current.country);
        setDraft(undefined);
        composing.current = false;
      }, 0);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [form, value === undefined, country === undefined]);

  function publish(next: string, nextCountry?: CountryCode) {
    if (value === undefined) setValue(next);
    const details = format(next, nextCountry);
    if (next !== raw || details.country !== formatted.country || details.e164 !== formatted.e164) {
      onValueChange?.(next, {country: details.country, e164: details.e164});
    }
  }

  function edit(node: HTMLInputElement, inputType?: string) {
    const beforeCaret = node.value.slice(0, node.selectionStart ?? node.value.length);
    let count = parseDigits(beforeCaret).length + Number(beforeCaret.startsWith("+"));
    let next = parseIncompletePhoneNumber(node.value);
    // If the browser deleted just a formatted separator, also delete the adjacent digit.
    if (next === raw && inputType === "deleteContentBackward" && count > 0) {
      next = next.slice(0, count - 1) + next.slice(count);
      count--;
    } else if (next === raw && inputType === "deleteContentForward" && count < next.length) {
      next = next.slice(0, count) + next.slice(count + 1);
    }
    position.current = {value: next, count};
    const detected = next.startsWith("+") ? format(next).country : undefined;
    if (detected && detected !== fallback && countries.includes(detected)) {
      if (country === undefined) setCountry(detected);
      onCountryChange?.(detected);
    }
    publish(next, detected ?? fallback);
    queueMicrotask(() => {
      if (!position.current || node.ownerDocument.activeElement !== node) return;
      position.current = undefined;
      const caret = cursorAfter(formatted.display, count);
      node.setSelectionRange(caret, caret);
    });
  }

  return <div hidden={hidden} dir={props.dir} lang={props.lang} style={style}
    className={["flood-phone-input", className].filter(Boolean).join(" ")}>
    <Combobox controlSize={controlSize} disabled={disabled} readOnly={readOnly} value={selected}
      aria-label={labels?.country ?? "Country calling code"} listLabel={labels?.country ?? "Country calling code"}
      form={form} className="flood-phone-input__country" options={[
        {value: international, label: labels?.international ?? "International", selectedLabel: labels?.internationalShort ?? "Intl."},
        ...options.map(option => ({
          value: option.code, label: `${option.name} (+${option.prefix})`, selectedLabel: `${option.code} +${option.prefix}`,
          keywords: [option.code],
        })),
      ]}
      onValueChange={id => {
        const nextCountry = id === international ? undefined : id as CountryCode;
        if (country === undefined) setCountry(nextCountry);
        onCountryChange?.(nextCountry);
        if (raw.startsWith("+") && nextCountry && formatted.national) publish(formatted.national, nextCountry);
        else publish(raw, nextCountry);
      }} />
    <Input {...props} ref={control} dir="ltr" className="flood-phone-input__number" controlSize={controlSize}
      autoComplete={autoComplete} inputMode="tel" type="tel" form={form} required={required} disabled={disabled}
      readOnly={readOnly} value={draft ?? formatted.display}
      onChange={event => {
        if (composing.current || (event.nativeEvent as InputEvent).isComposing) setDraft(event.currentTarget.value);
        else edit(event.currentTarget, (event.nativeEvent as InputEvent).inputType);
      }}
      onCompositionStart={event => {
        onCompositionStart?.(event);
        composing.current = true;
        setDraft(event.currentTarget.value);
      }}
      onCompositionEnd={event => {
        onCompositionEnd?.(event);
        composing.current = false;
        setDraft(undefined);
        edit(event.currentTarget);
      }} />
    {name && <input type="hidden" name={name} form={form} disabled={disabled} value={formatted.e164 ?? ""} />}
  </div>;
});
