import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import { IconSlot, Label, Stack, Tag, Text, VisuallyHidden, type QueryInputProps } from "./index.js";
import { mergeDescriptions, resolveFieldStatus } from "./field-state.js";
import { CaretSuggestionEditor } from "./suggestion-textarea.js";

export const StructuredQueryInput = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, QueryInputProps>(function StructuredQueryInput({
  label, hideLabel = true, value, onValueChange, tokens = [], onTokenRemove,
  formatRemoveLabel = token => `Remove ${token.label}`, error, resolveSuggestions, onSubmitQuery,
  controlSize = "sm", disabled, readOnly, id: explicitId, className, style, onKeyDown, invalid, status,
  "aria-describedby": description, "aria-invalid": ariaInvalid, ...props
}, forwardedRef) {
  const generated = useId(), id = explicitId ?? `flood-query-${generated}`;
  const input = useRef<HTMLTextAreaElement>(null);
  const lastTag = useRef<HTMLSpanElement>(null);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  if (!label.trim() || tokens.some(token => !token.id.trim() || !token.label.trim())
    || new Set(tokens.map(token => token.id)).size !== tokens.length)
    throw new Error("Flood QueryInput requires a named field and named tokens with unique IDs");

  const removable = !readOnly && !disabled && Boolean(onTokenRemove);
  const feedback = resolveFieldStatus(status, invalid || Boolean(error), ariaInvalid);
  const hasTokenErrors = tokens.some(token => Boolean(token.error));
  const describedBy = mergeDescriptions(description, error && `${id}-error`, hasTokenErrors && `${id}-token-errors`);

  return <Stack gap="1" className={["flood-query-input",className].filter(Boolean).join(" ")} style={style} hidden={props.hidden}>
    <Label htmlFor={id} className={hideLabel ? "flood-visually-hidden" : undefined} required={props.required}>{label}</Label>
    <div className={`flood-input-group flood-query-input__control flood-control--${controlSize}`}
      data-status={feedback} data-disabled={disabled || undefined} data-readonly={readOnly || undefined}>
      <IconSlot size={controlSize} className="flood-query-input__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" />
        </svg>
      </IconSlot>
      {tokens.map((token,index) => <Tag key={token.id} ref={index === tokens.length-1 ? lastTag : undefined} size={controlSize === "sm" ? "sm" : "md"}
        className="flood-query-input__token" data-status={token.error ? "error" : undefined}
        title={token.error ? `${token.label}: ${token.error}` : token.label}
        removeLabel={removable ? formatRemoveLabel(token) : undefined}
        removeButtonProps={{
          "aria-describedby":token.error ? `${id}-token-${index}` : undefined,
          onKeyDown:event => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              input.current?.focus({preventScroll:true});
            }
          },
        }}
        onRemove={removable ? () => {
          if (input.current?.matches(":disabled,[readonly]")) return;
          onTokenRemove?.(token.id);
          input.current?.focus({preventScroll:true});
        } : undefined}>{token.label}</Tag>)}
      <CaretSuggestionEditor {...props} id={id} ref={input} className="flood-query-input__draft"
        value={value} rows={1} wrap="off" inputMode="search" enterKeyHint="search" controlSize={controlSize}
        disabled={disabled} readOnly={readOnly} status={feedback} aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        onValueChange={next=>onValueChange(next.replace(/\r?\n/g," "))}
        suggestions={[]} resolveSuggestions={resolveSuggestions} onSubmitQuery={onSubmitQuery ?? (()=>{})}
        onKeyDown={event => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229 ||
            event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "Enter" && event.shiftKey) event.preventDefault();
          if (removable && event.key === "Backspace" && !value && lastTag.current) {
            event.preventDefault();
            lastTag.current.querySelector("button")?.focus({preventScroll:true});
          }
        }} />
    </div>
    {hasTokenErrors && <VisuallyHidden id={`${id}-token-errors`}>
      {tokens.map((token,index) => token.error && <span key={token.id} id={`${id}-token-${index}`}>{token.label}: {token.error} </span>)}
    </VisuallyHidden>}
    {error && <Text size="helper" id={`${id}-error`} data-status="error" className="flood-message">{error}</Text>}
  </Stack>;
});
