import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import type {CopyButtonProps, ToastRegionProps, ToastItem} from "./index.js";
import {Button, IconButton, IconSlot, Spinner, VisuallyHidden} from "./index.js";

export const ClipboardAction = forwardRef<HTMLButtonElement, CopyButtonProps>(function ClipboardAction({
  value, copyLabel = "Copy", copiedLabel = "Copied", errorLabel = "Failed",
  resetDelay = 2000, onCopied, onCopyError, className, disabled, size = "md", variant = "subtle", "aria-label": accessibleLabel, ...props
}, ref) {
  if (!Number.isFinite(resetDelay) || resetDelay < 0) throw new Error("Flood CopyButton resetDelay must be finite and nonnegative");
  const [phase, setPhase] = useState<"idle" | "copied" | "error">("idle");
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); }; }, []);
  const label = phase === "copied" ? copiedLabel : phase === "error" ? errorLabel : copyLabel;
  const copy = async (node: HTMLButtonElement) => {
    if (pending || node.matches(":disabled")) return;
    clearTimeout(timer.current); setPending(true);
    const view = node.ownerDocument.defaultView;
    try {
      if (!view?.navigator.clipboard?.writeText) throw new Error("Clipboard writing is unavailable in this context");
      await view.navigator.clipboard.writeText(value);
    } catch (error) {
      if (alive.current) { setPending(false); setPhase("error"); }
      onCopyError?.(error);
      return;
    }
    if (alive.current) {
      setPending(false); setPhase("copied"); clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (alive.current) setPhase("idle"); }, resetDelay);
    }
    onCopied?.();
  };
  return <><Button {...props} ref={ref} type="button" size={size} variant={variant} disabled={disabled || pending} aria-label={accessibleLabel ? (phase === "idle" ? accessibleLabel : `${label}: ${accessibleLabel}`) : label}
    className={["flood-copy-button", className].filter(Boolean).join(" ")} onClick={event => { void copy(event.currentTarget); }}>
    <span className="flood-copy-button__labels" aria-hidden="true">{[copyLabel,copiedLabel,errorLabel].map((text,index) => <span key={index} data-visible={index === (phase === "copied" ? 1 : phase === "error" ? 2 : 0) || undefined}>
      <IconSlot size={size}>{pending ? <Spinner decorative /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{index === 1 ? <path d="m5 12 4 4L19 6"/> : index === 2 ? <path d="m6 6 12 12M18 6 6 18"/> : <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/></>}</svg>}</IconSlot>
      <span>{text}</span>
    </span>)}</span>
  </Button><VisuallyHidden role="status">{phase === "idle" ? "" : label}</VisuallyHidden></>;
});

function TimedToast({item, closeLabel, onDismiss}: {item: ToastItem; closeLabel: string; onDismiss: (id: string) => void}) {
  const duration = item.duration ?? (item.action || item.status === "error" ? 0 : 5000);
  if (!Number.isFinite(duration) || duration < 0) throw new Error("Flood toast duration must be finite and nonnegative");
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [hidden, setHidden] = useState(false);
  const node = useRef<HTMLLIElement>(null), remaining = useRef(duration), callback = useRef(onDismiss), requested = useRef(false);
  useEffect(() => { callback.current = onDismiss; }, [onDismiss]);
  useEffect(() => { remaining.current = duration; requested.current = false; }, [duration]);
  useEffect(() => {
    const document = node.current?.ownerDocument;
    if (!document) return;
    const update = () => setHidden(document.hidden);
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!duration || hover || focus || hidden || requested.current) return;
    const started = Date.now();
    const timer = setTimeout(() => { if (requested.current) return; requested.current = true; callback.current(item.id); }, remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [duration, hover, focus, hidden, item.id]);
  const dismiss = () => {
    requested.current = true;
    const document = node.current?.ownerDocument;
    if (node.current?.contains(document?.activeElement ?? null)) {
      const region = node.current?.closest<HTMLElement>(".flood-toast-region");
      const sibling = node.current?.nextElementSibling ?? node.current?.previousElementSibling;
      (sibling?.querySelector<HTMLElement>("button:not(:disabled)") ?? region)?.focus({preventScroll:true});
    }
    onDismiss(item.id);
  };
  return <li ref={node} className="flood-toast" data-status={item.status ?? "neutral"}
    onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}
    onFocusCapture={() => setFocus(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false); }}>
    <div className="flood-toast__message" role={item.status === "error" ? "alert" : "status"} aria-atomic="true">
      <div className="flood-toast__title">{item.title}</div>
      {item.description && <div className="flood-toast__description">{item.description}</div>}
    </div>
    <IconButton label={`${closeLabel}: ${item.title}`} size="sm" variant="ghost" className="flood-toast__close" onClick={dismiss}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></IconButton>
    {item.action && <Button size="sm" variant="subtle" className="flood-toast__action" onClick={item.action.onClick}>{item.action.label}</Button>}
  </li>;
}

export const NotificationRegion = forwardRef<HTMLDivElement, ToastRegionProps>(function NotificationRegion({
  items, onDismiss, label = "Notifications", closeLabel = "Dismiss notification", placement = "bottom-end", limit = 3,
  inline = false, hotkey = true, className, ...props
}, forwardedRef) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Flood ToastRegion limit must be a positive integer");
  const ids = new Set<string>();
  for (const item of items) { if (!item.id.trim() || ids.has(item.id) || !item.title.trim()) throw new Error("Flood toasts require unique nonempty IDs and titles"); ids.add(item.id); }
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => node.current!, []);
  useEffect(() => {
    const element = node.current, document = element?.ownerDocument;
    if (!hotkey || !element || !document) return;
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "F8" || event.altKey || event.ctrlKey || event.metaKey || !element.querySelector(".flood-toast") || element.hidden || Array.from(document.querySelectorAll<HTMLElement>(".flood-toast-region")).find(region => !region.hidden && region.getClientRects().length > 0 && region.querySelector(".flood-toast")) !== element) return;
      event.preventDefault(); (element.querySelector<HTMLElement>('button:not(:disabled)') ?? element).focus({preventScroll:true});
    };
    document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key);
  }, [hotkey]);
  return <div {...props} ref={node}
    role="region" aria-label={label} tabIndex={-1} className={["flood-toast-region",className].filter(Boolean).join(" ")} data-placement={placement} data-inline={inline || undefined}>
    <ol className="flood-toast-region__list">{items.slice(0,limit).map(item => <TimedToast key={item.id} item={item} closeLabel={closeLabel} onDismiss={onDismiss}/>)}</ol>
  </div>;
});
