import { useEffect, useRef, useState } from "react";

export function useInlineOverflow(text: string, enabled = true) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const measure = () => setOverflow(node.clientWidth < node.scrollWidth);
    measure();
    const Observer = node.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(measure);
    observer?.observe(node);
    const fonts = node.ownerDocument.fonts;
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      observer?.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [text, enabled]);

  return { ref, overflow: enabled && overflow };
}
