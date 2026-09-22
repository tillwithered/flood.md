// Keep the scroll gutter stable while revealing the thumb only during scrolling.
export function observeScrollActivity(root: Document) {
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();
  function onScroll(event: Event) {
    const element = event.target === root ? root.documentElement : event.target;
    if (!(element instanceof Element)) return;
    clearTimeout(timers.get(element));
    element.setAttribute("data-scrolling", "true");
    timers.set(element, setTimeout(() => {
      element.removeAttribute("data-scrolling");
      timers.delete(element);
    }, 800));
  }
  root.addEventListener("scroll", onScroll, { capture: true, passive: true });
  return () => {
    root.removeEventListener("scroll", onScroll, true);
    for (const [element, timer] of timers) {
      clearTimeout(timer);
      element.removeAttribute("data-scrolling");
    }
    timers.clear();
  };
}
