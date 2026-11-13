import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {AppTopBar, Button, Drawer, Inline, ScrollArea, SkipLink, type AppShellProps, type AppTopBarProps} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const ApplicationTopBar = /* @__PURE__ */ forwardRef<HTMLElement, AppTopBarProps>(function ApplicationTopBar({
  start, end, bordered, className, ...props
}, ref) {
  return <header {...props} ref={ref} className={["flood-app-top-bar", className].filter(Boolean).join(" ")} data-bordered={bordered || undefined}>
    {start != null && <Inline align="center" gap="2" className="flood-app-top-bar__start">{start}</Inline>}
    {end != null && <Inline align="center" gap="2" className="flood-app-top-bar__end">{end}</Inline>}
  </header>;
});

export const ApplicationShell = /* @__PURE__ */ forwardRef<HTMLDivElement, AppShellProps>(function ApplicationShell({
  navigation, navigationSide, navigationDrawer, topBar, footer, scroll, mainId, mainAs: Main = "main", mainLabel, mainRef,
  scrollLabel, scrollOrientation = "both", scrollContentInset = "scrollbar", skipLabel, children, className, ...props
}, ref) {
  const generatedId = useId();
  const contentId = mainId ?? `flood-app-${generatedId}`;
  const root = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const focusAfterResize = useRef(false);
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(false);
  const below = navigationDrawer?.below;
  const useDrawer = Boolean(navigationDrawer && narrow);
  useImperativeHandle(ref, () => root.current!, []);

  useBrowserLayoutEffect(() => {
    const node = root.current;
    if (!node || below === undefined) {
      setNarrow(false);
      setOpen(false);
      return;
    }
    const update = () => {
      const width = node.getBoundingClientRect().width;
      if (!width) return;
      const next = width < below;
      if (next === narrow) return;
      const active = node.ownerDocument.activeElement;
      focusAfterResize.current = Boolean(next ? dock.current?.contains(active) : trigger.current === active || drawer.current?.contains(active));
      if (!next) setOpen(false);
      setNarrow(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [below, narrow]);

  useBrowserLayoutEffect(() => {
    if (!focusAfterResize.current) return;
    focusAfterResize.current = false;
    const target = useDrawer ? trigger.current : root.current?.ownerDocument.getElementById(contentId);
    target?.focus({preventScroll: true});
  }, [contentId, useDrawer]);

  const navigationSlot = !useDrawer && navigation != null && navigation !== false
    ? <div ref={dock} className="flood-app-shell__navigation">{navigation}</div>
    : null;
  const navigationTrigger = useDrawer && navigationDrawer ? <Drawer
    ref={drawer} title={navigationDrawer.title} side={navigationSide} size={navigationDrawer.size ?? "sm"}
    open={open} onOpenChange={setOpen}
    trigger={({ref: drawerTrigger, ...buttonProps}) => <Button {...buttonProps} ref={node => {
      trigger.current = node;
      drawerTrigger(node);
    }} variant="subtle" size="sm">{navigationDrawer.triggerLabel ?? "Navigation"}</Button>}
  >{open && navigationDrawer.renderContent(() => setOpen(false))}</Drawer> : null;
  const chrome = typeof topBar === "function"
    ? topBar(navigationTrigger)
    : <>{navigationTrigger && <AppTopBar start={navigationTrigger} />}{topBar}</>;
  return <div {...props} ref={root} className={["flood-app-shell", className].filter(Boolean).join(" ")} data-scroll={scroll}>
    <SkipLink href={`#${contentId}`}>{skipLabel}</SkipLink>
    {navigationSide === "start" && navigationSlot}
    <div className="flood-app-shell__workspace">
      {chrome}
      <Main ref={mainRef} id={contentId} aria-label={mainLabel} tabIndex={-1} className="flood-app-shell__main">
        {scroll === "content"
          ? <ScrollArea orientation={scrollOrientation} contentInset={scrollContentInset} aria-label={scrollLabel} className="flood-app-shell__scroll">{children}</ScrollArea>
          : children}
      </Main>
      {footer}
    </div>
    {navigationSide === "end" && navigationSlot}
  </div>;
});
