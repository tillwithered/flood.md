import {createElement, forwardRef, useEffect, useId, useLayoutEffect, useRef, useImperativeHandle, type HTMLAttributes} from "react";
import { Button } from "./index.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  disabled?: boolean;
  controlSize: "sm" | "md" | "lg" | "xl";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}
/** Shared original disclosure anatomy. The closed panel stays mounted but hidden. */
export const Disclosure = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(function Disclosure(
  {title, expanded, onExpandedChange, disabled, controlSize, headingLevel, className, children, id: explicitId, ...props}, ref,
) {
  const generatedId = useId(), id = explicitId ?? `flood-disclosure-${generatedId}`;
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const focusedInside = useRef(false);
  useImperativeHandle(ref, () => root.current!, []);
  useBrowserLayoutEffect(() => {
    const active = panel.current?.ownerDocument.activeElement;
    if (!expanded && focusedInside.current && !disabled && (panel.current?.contains(active ?? null) || active === panel.current?.ownerDocument.body)) trigger.current?.focus();
    if (!expanded) focusedInside.current = false;
  }, [expanded, disabled]);
  const button = <Button ref={trigger} variant="ghost" size={controlSize} id={`${id}-trigger`} type="button" disabled={disabled} aria-expanded={expanded} aria-controls={`${id}-panel`}
    className="flood-disclosure__trigger" onClick={() => onExpandedChange(!expanded)}>
    <span className="flood-disclosure__title">{title}</span><span className="flood-disclosure__indicator" aria-hidden="true" />
  </Button>;
  return <div {...props} id={id} ref={root} data-open={expanded} className={["flood-disclosure", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}>
    {createElement(headingLevel ? `h${headingLevel}` : "div", {className:"flood-disclosure__heading"}, button)}
    <div ref={panel} id={`${id}-panel`} className="flood-disclosure__panel" hidden={!expanded}
      onFocusCapture={() => {focusedInside.current = true;}} onBlurCapture={event => {if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) focusedInside.current = false;}}>{children}</div>
  </div>;
});
