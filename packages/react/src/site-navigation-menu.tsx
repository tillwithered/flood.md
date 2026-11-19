import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import type { NavigationMenuLink, NavigationMenuProps } from "./index.js";
import { Button, IconSlot, Link, Stack, Surface, Text } from "./index.js";

export const SiteNavigationMenu = /* @__PURE__ */ forwardRef<HTMLElement, NavigationMenuProps>(function SiteNavigationMenu({
  label, items, currentHref, size, className, onBlur, onKeyDown, ...props
}, ref) {
  const id = useId();
  const nav = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [openId, setOpenId] = useState<string>();
  const open = items.some(item => item.id === openId && "links" in item);
  useImperativeHandle(ref, () => nav.current!, []);

  useEffect(() => {
    const element = nav.current;
    if (!open || !element) return;
    const dismiss = (event: PointerEvent) => {
      if (!event.composedPath().includes(element)) setOpenId(undefined);
    };
    element.ownerDocument.addEventListener("pointerdown", dismiss);
    return () => element.ownerDocument.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function destination(item: NavigationMenuLink, nested = false) {
    return <Link href={item.href} variant="ghost" size={size} aria-current={currentHref === item.href ? "page" : undefined}
      className={nested ? "flood-navigation-menu__destination" : undefined}
      onClick={event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpenId(undefined);
      }}>
      {nested ? <Stack gap="1">
        <Text as="span" size="label">{item.label}</Text>
        {item.description && <Text as="span" size="helper" tone="subtle">{item.description}</Text>}
      </Stack> : item.label}
    </Link>;
  }

  return <nav {...props} ref={nav} aria-label={label} className={["flood-navigation-menu", className].filter(Boolean).join(" ")}
    onBlur={event => {
      onBlur?.(event);
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenId(undefined);
    }} onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape" || !open) return;
      event.preventDefault();
      event.stopPropagation();
      setOpenId(undefined);
      trigger.current?.focus({ preventScroll: true });
    }}>
    <ul role="list" className="flood-navigation-menu__items">
      {items.map((item, index) => {
        if (!("links" in item)) return <li key={item.id}>{destination(item)}</li>;
        const expanded = openId === item.id;
        const panelId = `${id}-${index}`;
        return <li key={item.id}>
          <Button size={size} variant="ghost" aria-expanded={expanded} aria-controls={panelId}
            disabled={!item.links.length} ref={expanded ? trigger : undefined}
            onClick={event => {
              event.currentTarget.focus({ preventScroll: true });
              setOpenId(expanded ? undefined : item.id);
            }}>
            {item.label}
            <IconSlot size={size}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4" /></svg></IconSlot>
          </Button>
          <Surface padding="2" elevation="overlay" id={panelId} hidden={!expanded} className="flood-navigation-menu__panel">
            <ul role="list" aria-label={item.label}>
              {item.links.map(link => <li key={link.id}>{destination(link, true)}</li>)}
            </ul>
          </Surface>
        </li>;
      })}
    </ul>
  </nav>;
});
