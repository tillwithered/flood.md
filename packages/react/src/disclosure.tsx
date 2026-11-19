import {createElement, forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, useImperativeHandle, type HTMLAttributes, type ReactNode} from "react";
import { Button, IconSlot } from "./index.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  variant?: "framed" | "flush";
  triggerWidth?: "full" | "fit";
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  disabled?: boolean;
  controlSize: "sm" | "md" | "lg" | "xl";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  headerAction?: ReactNode;
  headerMeta?: ReactNode;
}

/** Shared original disclosure anatomy. The closed panel stays mounted but hidden. */
export const Disclosure = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(function Disclosure(
  {title, variant = "framed", triggerWidth, expanded, onExpandedChange, disabled, controlSize, headingLevel, headerAction, headerMeta, className, children, id: explicitId, ...props}, ref,
) {
  const generatedId = useId(), id = explicitId ?? `flood-disclosure-${generatedId}`;
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const focusedInside = useRef(false);
  const previousOpen = useRef(expanded);
  const running = useRef<Animation | null>(null);
  const [retainPanel, setRetainPanel] = useState(expanded);
  useImperativeHandle(ref, () => root.current!, []);
  useEffect(() => () => { running.current?.cancel(); }, []);
  useBrowserLayoutEffect(() => {
    const element = panel.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return;
    const active = element.ownerDocument.activeElement;
    if (!expanded && focusedInside.current && !disabled && (element.contains(active) || active === element.ownerDocument.body)) trigger.current?.focus();
    if (!expanded) focusedInside.current = false;
    element.inert = !expanded;
    if (previousOpen.current === expanded) return;
    previousOpen.current = expanded;

    const currentStyle = view.getComputedStyle(element);
    const from = !expanded || running.current ? {
      height: `${element.getBoundingClientRect().height}px`,
      paddingBlockStart: currentStyle.paddingBlockStart,
      paddingBlockEnd: currentStyle.paddingBlockEnd,
    } : {height:"0px",paddingBlockStart:"0px",paddingBlockEnd:"0px"};
    running.current?.cancel();
    running.current = null;
    const reduced = element.closest('[data-flood-motion="reduce"]') || view.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const durationValue = currentStyle.getPropertyValue("--flood-sys-motion-duration-normal").trim();
    const duration = Number.parseFloat(durationValue) * (durationValue.endsWith("ms") ? 1 : 1000);
    if (reduced || !element.getClientRects().length || !element.animate || !Number.isFinite(duration) || duration <= 0) {
      element.removeAttribute("data-moving");
      setRetainPanel(expanded);
      return;
    }
    if (expanded) setRetainPanel(true);
    const to = expanded ? {
      height: `${element.getBoundingClientRect().height}px`,
      paddingBlockStart: currentStyle.paddingBlockStart,
      paddingBlockEnd: currentStyle.paddingBlockEnd,
    } : {height:"0px",paddingBlockStart:"0px",paddingBlockEnd:"0px"};
    element.setAttribute("data-moving", "");
    const animation = element.animate([from, to], {
      duration, easing: currentStyle.getPropertyValue("--flood-sys-motion-easing-enter").trim() || "ease-out", fill: "forwards",
    });
    running.current = animation;
    animation.onfinish = () => {
      setRetainPanel(expanded);
      if (expanded) {
        animation.cancel();
        running.current = null;
        element.removeAttribute("data-moving");
      }
    };
  }, [expanded, disabled]);
  useBrowserLayoutEffect(() => {
    if (!expanded && !retainPanel) {
      running.current?.cancel();
      running.current = null;
      panel.current?.removeAttribute("data-moving");
    }
  }, [expanded, retainPanel]);
  const button = <Button ref={trigger} variant="ghost" size={controlSize} id={`${id}-trigger`} type="button" disabled={disabled} aria-expanded={expanded} aria-controls={`${id}-panel`}
    className="flood-disclosure__trigger" onClick={() => onExpandedChange(!expanded)}>
    <span className="flood-disclosure__title">{title}</span>
    {headerMeta != null && <span className="flood-disclosure__meta">{headerMeta}</span>}
    <IconSlot size="2xs" className="flood-disclosure__indicator">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 8 9 8 9-8" />
      </svg>
    </IconSlot>
  </Button>;
  return <div {...props} id={id} ref={root} data-open={expanded} data-variant={variant} data-trigger-width={triggerWidth} className={["flood-disclosure", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}>
    {createElement(headingLevel ? `h${headingLevel}` : "div", {className:"flood-disclosure__heading"}, button, headerAction != null && <div className="flood-disclosure__action">{headerAction}</div>)}
    <div ref={panel} id={`${id}-panel`} className="flood-disclosure__panel" hidden={!expanded && !retainPanel}
      onFocusCapture={() => {focusedInside.current = true;}} onBlurCapture={event => {if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) focusedInside.current = false;}}>{children}</div>
  </div>;
});
