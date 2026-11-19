import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Button, ScrollArea } from "./index.js";

export interface MessageScrollerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Name of the scrollable conversation. */
  label: string;
  children: ReactNode;
  jumpLabel?: string;
  /** Initial position for this mounted conversation. */
  initialPosition?: "latest" | "start";
}

const bottomTolerance = 4;

/** Follows new content only while the reader is at the end of a conversation. */
export const MessageScroller = /* @__PURE__ */ forwardRef<HTMLDivElement, MessageScrollerProps>(function MessageScroller(
  { label, children, jumpLabel = "Latest messages", initialPosition = "latest", className, ...props }, ref,
) {
  const viewportId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const following = useRef(initialPosition === "latest");
  const followedOffset = useRef<number | null>(null);
  const [hasOlderPosition, setHasOlderPosition] = useState(false);

  useEffect(() => {
    const node = viewport.current;
    const body = content.current;
    if (!node || !body) return;
    function syncPosition() {
      if (!node) return;
      const overflows = node.scrollHeight - node.clientHeight > bottomTolerance;
      if (following.current) {
        node.scrollTop = node.scrollHeight;
        followedOffset.current = node.scrollTop;
      }
      setHasOlderPosition(overflows && !following.current);
    }
    syncPosition();
    if (typeof ResizeObserver === "undefined") return;
    const observe = new ResizeObserver(syncPosition);
    observe.observe(node);
    observe.observe(body);
    return () => observe.disconnect();
  }, []);

  function jumpToLatest() {
    const node = viewport.current;
    if (!node) return;
    following.current = true;
    node.scrollTop = node.scrollHeight;
    followedOffset.current = node.scrollTop;
    node.focus({ preventScroll: true });
    setHasOlderPosition(false);
  }

  return <div {...props} ref={ref} className={["flood-message-scroller", className].filter(Boolean).join(" ")}>
    <ScrollArea id={viewportId} ref={viewport} aria-label={label} contentInset="scrollbar" className="flood-message-scroller__viewport"
      onScroll={event => {
        if (event.target !== event.currentTarget) return;
        const node = event.currentTarget;
        // A queued scroll event can arrive after a new chunk has grown the transcript.
        if (following.current && node.scrollTop === followedOffset.current) return;
        following.current = node.scrollHeight - node.clientHeight - node.scrollTop <= bottomTolerance;
        setHasOlderPosition(!following.current);
      }}>
      <div ref={content} className="flood-message-scroller__content">{children}</div>
    </ScrollArea>
    {hasOlderPosition && <div className="flood-message-scroller__jump">
      <Button type="button" size="sm" variant="outline" aria-controls={viewportId} onClick={jumpToLatest}>
        {jumpLabel}
      </Button>
    </div>}
  </div>;
});
