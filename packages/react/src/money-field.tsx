import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from "react";
import {InputGroup, type MoneyFieldProps} from "./index.js";
import {mergeDescriptions} from "./field-state.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function createMoneyFormat(currency: string, locale: string) {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Flood MoneyField requires a three-letter uppercase currency code");
  const currencyFormat = new Intl.NumberFormat(locale, {style:"currency", currency});
  const precision = currencyFormat.resolvedOptions().maximumFractionDigits ?? 0;
  const digits = new Intl.NumberFormat(locale, {useGrouping:false});
  const localizedDigits = Array.from({length:10}, (_, index) => digits.format(index));
  const whole = new Intl.NumberFormat(locale, {maximumFractionDigits:0});
  const example = whole.formatToParts(-123456789012n);
  const group = example.find(part => part.type === "group")?.value;
  const minus = example.find(part => part.type === "minusSign")?.value ?? "-";
  const decimal = digits.formatToParts(1.1).find(part => part.type === "decimal")?.value ?? ".";
  const units = 10n ** BigInt(precision);

  const ascii = (text: string) => localizedDigits.reduce((result, digit, index) =>
    digit === String(index) ? result : result.replaceAll(digit, String(index)), text);

  function canonical(negative: boolean, integer: string, fraction = "") {
    const amount = BigInt(integer || "0") * units + BigInt(fraction.padEnd(precision, "0") || "0");
    const unsigned = `${amount / units}${precision ? `.${String(amount % units).padStart(precision, "0")}` : ""}`;
    return {value:negative && amount !== 0n ? `-${unsigned}` : unsigned, amount:negative ? -amount : amount};
  }

  function readValue(value: string | null | undefined) {
    if (value === null || value === undefined) return null;
    const parts = value.match(/^(-?)([0-9]+)(?:\.([0-9]+))?$/);
    if (!parts || (parts[3]?.length ?? 0) > precision) {
      throw new Error("Flood MoneyField expects decimal strings with the currency's precision");
    }
    return canonical(parts[1] === "-", parts[2], parts[3]);
  }

  function readDraft(draft: string) {
    if (!draft) return null;
    let text = ascii(draft.replace(/[\u061c\u200e\u200f]/g, ""));
    if (minus !== "-" && text.startsWith(minus)) text = `-${text.slice(minus.length)}`;
    const negative = text.startsWith("-");
    if (negative) text = text.slice(1);
    const [integer, fraction, extra] = text.split(decimal);
    if (extra !== undefined || (fraction !== undefined && (!/^[0-9]+$/.test(fraction) || fraction.length > precision))) return undefined;
    const plain = group ? integer.replaceAll(group, "") : integer;
    if (!/^[0-9]*$/.test(plain) || (!plain && fraction === undefined)) return undefined;
    if (integer !== plain) {
      const grouped = ascii(whole.format(BigInt(plain || "0")));
      if (grouped !== integer) return undefined;
    }
    return canonical(negative, plain, fraction);
  }

  function format(value: string | null) {
    if (value === null) return "";
    const [integer, fraction] = value.split(".");
    const result = fraction === undefined ? integer : `${integer}${decimal}${fraction}`;
    return result.replace(/[0-9-]/g, char => char === "-" ? minus : localizedDigits[Number(char)]);
  }

  function formatUnsignedAmount(amount: bigint) {
    const fraction = (amount % units).toString().padStart(precision, "0");
    return currencyFormat.formatToParts(amount / units).map(part => part.type === "fraction"
      ? fraction.replace(/[0-9]/g, digit => localizedDigits[Number(digit)])
      : part.value).join("");
  }

  return {readValue, readDraft, format, formatUnsignedAmount};
}

type Draft = {
  text: string;
  previous: string | null;
  next: string | null;
  format: ReturnType<typeof createMoneyFormat>;
  showError: boolean;
  composing: boolean;
};

export const MoneyEditor = /* @__PURE__ */ forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyEditor({
  currency, locale, value, defaultValue = null, min, max, onValueChange,
  invalidMessage = "Enter a valid amount.", invalid, disabled, readOnly, className, name,
  onBlur, onInvalid, onCompositionStart, onCompositionEnd, ...props
}, ref) {
  const input = useRef<HTMLInputElement>(null);
  const currencyId = useId();
  const composing = useRef(false);
  useImperativeHandle(ref, () => input.current!, []);
  const inputLocale = locale ?? props.lang ?? "en-US";
  const money = useMemo(() => createMoneyFormat(currency, inputLocale), [currency, inputLocale]);
  const [local, setLocal] = useState(defaultValue);
  const [draft, setDraft] = useState<Draft>();
  const amount = money.readValue(value === undefined ? local : value);
  const current = amount?.value ?? null;
  const lower = money.readValue(min)?.amount;
  const upper = money.readValue(max)?.amount;
  if (lower !== undefined && upper !== undefined && lower > upper) throw new Error("Flood MoneyField requires min to be less than or equal to max");
  if (!invalidMessage.trim()) throw new Error("Flood MoneyField requires a validation message");

  const activeDraft = draft && !disabled && !readOnly && draft.format === money
    && (draft.previous === current || draft.next === current) ? draft : undefined;
  const inBounds = (parsed: NonNullable<typeof amount>) =>
    (lower === undefined || parsed.amount >= lower) && (upper === undefined || parsed.amount <= upper);
  const draftValue = activeDraft ? money.readDraft(activeDraft.text) : amount;
  const valid = !activeDraft?.composing && draftValue !== undefined && (draftValue === null || inBounds(draftValue));
  const pendingAcceptance = valid && activeDraft && (draftValue?.value ?? null) !== current;
  const customError = (!valid || Boolean(pendingAcceptance)) && !disabled && !readOnly;

  useBrowserLayoutEffect(() => {
    input.current?.setCustomValidity(customError ? invalidMessage : "");
    if (draft && !activeDraft) setDraft(undefined);
  }, [activeDraft, customError, draft, invalidMessage]);

  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) => queueMicrotask(() => {
      if (event.defaultPrevented) return;
      composing.current = false;
      setDraft(undefined);
      setLocal(defaultValue);
    });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, props.form]);

  const edit = (node: HTMLInputElement) => {
    if (readOnly || node.matches(":disabled")) return;
    const parsed = money.readDraft(node.value);
    const acceptable = !composing.current && parsed !== undefined && (parsed === null || inBounds(parsed));
    const next = acceptable ? parsed?.value ?? null : current;
    node.setCustomValidity(acceptable ? "" : invalidMessage);
    setDraft({text:node.value, previous:current, next, format:money, showError:activeDraft?.showError ?? false, composing:composing.current});
    if (!acceptable || next === current) return;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };

  return <>
    <InputGroup {...props} ref={input} type="text" inputMode="decimal"
      invalid={invalid || (customError && (!activeDraft || activeDraft.showError))}
      disabled={disabled} readOnly={readOnly} className={["flood-money-field", className].filter(Boolean).join(" ")}
      aria-describedby={mergeDescriptions(props["aria-describedby"], currencyId)}
      value={activeDraft?.text ?? money.format(current)}
      end={<bdi id={currencyId} className="flood-money-field__currency">{currency}</bdi>}
      onChange={event => edit(event.currentTarget)}
      onCompositionStart={event => { onCompositionStart?.(event); composing.current = !event.defaultPrevented; }}
      onCompositionEnd={event => { onCompositionEnd?.(event); composing.current = false; edit(event.currentTarget); }}
      onBlur={event => {
        onBlur?.(event);
        if (event.defaultPrevented || !activeDraft) return;
        setDraft(valid ? undefined : {...activeDraft, showError:true});
      }}
      onInvalid={event => {
        onInvalid?.(event);
        if (!event.defaultPrevented && activeDraft && customError) setDraft({...activeDraft, showError:true});
      }}
    />
    {name !== undefined && <input type="hidden" name={name} form={props.form} value={current ?? ""} disabled={disabled || customError} />}
  </>;
});
