import { forwardRef } from "react";
import { Button, Field, Grid, IconButton, Inline, Input, SearchInput, Stack, Text, Toggle, type FindBarProps } from "./index.js";

function MatchArrow({ previous }: { previous?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={previous ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6"} />
  </svg>;
}

export const SearchCommands = /* @__PURE__ */ forwardRef<HTMLDivElement, FindBarProps>(function SearchCommands({
  label = "Find in document", query, onQueryChange, matchCount, activeMatch, onPreviousMatch, onNextMatch, queryError,
  caseSensitive = false, onCaseSensitiveChange, regularExpression = false, onRegularExpressionChange,
  replace, onDismiss, controlSize = "sm", labels, className, ...props
}, ref) {
  const names = {
    find: labels?.find ?? "Find",
    clear: labels?.clear ?? "Clear query",
    next: labels?.next ?? "Next match",
    previous: labels?.previous ?? "Previous match",
    caseSensitive: labels?.caseSensitive ?? "Match case",
    regularExpression: labels?.regularExpression ?? "Use regular expression",
    replace: labels?.replace ?? "Replace",
    replaceValue: labels?.replaceValue ?? "Replace with",
    replaceAll: labels?.replaceAll ?? "Replace all",
    dismiss: labels?.dismiss ?? "Close find bar",
    noMatches: labels?.noMatches ?? "No matches",
  };
  const formatCount = labels?.formatCount ?? ((active: number | null, count: number) => active === null
    ? `${count} ${count === 1 ? "match" : "matches"}` : `${active} of ${count}`);
  if (![label, ...Object.values(names)].every(text => text.trim()))
    throw new Error("Flood FindBar requires readable labels");
  if (!Number.isSafeInteger(matchCount) || matchCount < 0)
    throw new RangeError("Flood FindBar requires a nonnegative safe integer match count");

  const hasQuery = query.length > 0;
  const canNavigate = hasQuery && !queryError && matchCount > 0;
  const current = typeof activeMatch === "number" && Number.isSafeInteger(activeMatch) &&
    activeMatch > 0 && activeMatch <= matchCount ? activeMatch : null;
  const matchLabel = hasQuery && !queryError ? matchCount ? formatCount(current, matchCount) : names.noMatches : "";
  return <Stack {...props} ref={ref} role={props.role ?? "group"} aria-label={props["aria-label"] ?? label} gap="2"
    className={["flood-find-bar", className].filter(Boolean).join(" ")}>
    <Grid gap="2" className="flood-find-bar__rows">
      <div className="flood-find-bar__query">
        <Field label={names.find} error={queryError} hideLabel>{field => <SearchInput {...field}
          placeholder={names.find} clearLabel={names.clear} controlSize={controlSize} value={query}
          onChange={event => onQueryChange(event.currentTarget.value)} onKeyDown={event => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            if (canNavigate) (event.shiftKey ? onPreviousMatch : onNextMatch)();
          }} />}</Field>
      </div>
      <Inline gap="1" className="flood-find-bar__controls" data-size={controlSize}>
        {onCaseSensitiveChange && <Toggle size={controlSize} variant="ghost" iconOnly aria-label={names.caseSensitive}
          title={names.caseSensitive} pressed={caseSensitive} onPressedChange={onCaseSensitiveChange}>Aa</Toggle>}
        {onRegularExpressionChange && <Toggle size={controlSize} variant="ghost" iconOnly aria-label={names.regularExpression}
          title={names.regularExpression} pressed={regularExpression} onPressedChange={onRegularExpressionChange}>.*</Toggle>}
        <Text size="helper" tone="subtle" role="status" className="flood-find-bar__count">{matchLabel}</Text>
        <IconButton size={controlSize} variant="ghost" label={names.previous} title={names.previous} disabled={!canNavigate}
          onClick={onPreviousMatch}><MatchArrow previous /></IconButton>
        <IconButton size={controlSize} variant="ghost" label={names.next} title={names.next} disabled={!canNavigate}
          onClick={onNextMatch}><MatchArrow /></IconButton>
        {onDismiss && <IconButton size={controlSize} variant="ghost" label={names.dismiss} title={names.dismiss} onClick={onDismiss}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>}
      </Inline>
    {replace && <>
      <div className="flood-find-bar__query">
        <Field label={names.replaceValue} hideLabel>{field => <Input {...field} controlSize={controlSize}
          placeholder={names.replaceValue} value={replace.value} onChange={event => replace.onValueChange(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            if (canNavigate && current !== null) replace.onReplace();
          }} />}</Field>
      </div>
      <Inline gap="2" className="flood-find-bar__replace-actions">
        <Button size={controlSize} variant="subtle" disabled={!canNavigate || current === null} onClick={replace.onReplace}>{names.replace}</Button>
        {replace.onReplaceAll && <Button size={controlSize} variant="ghost" disabled={!canNavigate} onClick={replace.onReplaceAll}>
          {names.replaceAll}
        </Button>}
      </Inline>
    </>}
    </Grid>
  </Stack>;
});
