import {forwardRef, useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode} from "react";
import {IconButton, Inline, ScrollArea, Stack, Text, VisuallyHidden} from "./index.js";
import {PageArrow} from "./navigation.js";

export interface CarouselItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly CarouselItem[];
  /** Target size of a slide. It can shrink to the viewport. Defaults to one full slide. */
  slideSize?: CSSProperties["inlineSize"];
  labels?: {
    previous?: string;
    next?: string;
    viewport?: string;
    carousel?: string;
    slide?: string;
    position?: (first: number, last: number, total: number) => string;
  };
}

type Reading = {first: number; last: number; previous: boolean; next: boolean};

function geometry(viewport: HTMLDivElement, slides: HTMLDivElement) {
  const direction = getComputedStyle(viewport).direction === "rtl" ? -1 : 1;
  const current = direction * viewport.scrollLeft;
  const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const bounds = viewport.getBoundingClientRect();
  const edge = direction === -1 ? bounds.right : bounds.left;
  const tracks = Array.from(slides.children).map(slide => {
    const rect = slide.getBoundingClientRect();
    const start = direction * ((direction === -1 ? rect.right : rect.left) - edge);
    return {start, end: start + rect.width};
  });
  return {direction, current, maximum, tracks};
}

/** A horizontally scrolling collection with slide-sized stops and visible paging controls. */
export const Carousel = /* @__PURE__ */ forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {label, items, slideSize = "100%", labels, className, lang, ...props}, ref,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const slides = useRef<HTMLDivElement>(null);
  const id = useId();
  const [reading, setReading] = useState<Reading>({first: 0, last: 0, previous: false, next: false});

  useEffect(() => {
    const node = viewport.current;
    const track = slides.current;
    if (!node || !track) return;
    let frame = 0;
    const view = node.ownerDocument.defaultView!;
    const read = () => {
      frame = 0;
      const {current, maximum, tracks} = geometry(node, track);
      // Count the first intersecting item and the last one that fits completely.
      const first = Math.max(0, tracks.findIndex(item => item.end > 1));
      let last = first;
      for (let index = first + 1; index < tracks.length && tracks[index].end < node.clientWidth + 1; index++) last = index;
      const previous = current > 1;
      const next = maximum - current > 1;
      setReading(old => old.first === first && old.last === last && old.previous === previous && old.next === next
        ? old : {first, last, previous, next});
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(read);
    };
    const observer = new view.ResizeObserver(schedule);
    observer.observe(node);
    observer.observe(track);
    node.addEventListener("scroll", schedule, {passive: true});
    schedule();
    return () => {
      observer.disconnect();
      view.cancelAnimationFrame(frame);
      node.removeEventListener("scroll", schedule);
    };
  }, [items.length, slideSize, props.dir]);

  function move(action: "previous" | "next" | "first" | "last") {
    const node = viewport.current;
    const track = slides.current;
    if (!node || !track) return;
    const {current, direction, maximum, tracks} = geometry(node, track);
    let destination = action === "first" || action === "previous" ? 0 : maximum;
    if (action === "previous") {
      for (let index = tracks.length - 1; index >= 0; index--) {
        if (tracks[index].start >= -1) continue;
        destination = current + tracks[index].start;
        break;
      }
    } else if (action === "next") {
      destination = current + (tracks.find(item => item.start > 1)?.start ?? maximum - current);
    }
    node.scrollTo({left: direction * Math.max(0, Math.min(maximum, destination)), top: 0});
  }

  if (!items.length) return null;
  if (!label.trim() || new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood Carousel requires a label and uniquely identified, named slides");
  }
  const total = items.length;
  const first = Math.min(reading.first + 1, total);
  const last = Math.min(reading.last + 1, total);
  const numbers = new Intl.NumberFormat(lang);
  const range = first === last ? numbers.format(first) : `${numbers.format(first)}–${numbers.format(last)}`;
  const position = labels?.position?.(first, last, total) ?? `${range} / ${numbers.format(total)}`;
  return <Stack {...props} ref={ref} lang={lang} gap="2" role="group"
    aria-label={props["aria-labelledby"] ? undefined : label} aria-roledescription={labels?.carousel ?? "carousel"}
    className={["flood-carousel", className].filter(Boolean).join(" ")}>
    <ScrollArea id={id} ref={viewport} orientation="horizontal" role="group" aria-label={labels?.viewport ?? label}
      tabIndex={total > 1 ? 0 : -1} className="flood-carousel__viewport" onKeyDown={event => {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const action = {Home: "first", End: "last", ArrowLeft: rtl ? "next" : "previous",
          ArrowRight: rtl ? "previous" : "next"}[event.key] as Parameters<typeof move>[0] | undefined;
        if (!action) return;
        event.preventDefault();
        move(action);
      }}>
      <div ref={slides} className="flood-carousel__slides" style={{"--flood-carousel-slide-size": slideSize} as CSSProperties}>
        {items.map((item, index) => <div key={item.id} className="flood-carousel__slide" role="group"
          aria-label={`${numbers.format(index + 1)} / ${numbers.format(total)} · ${item.label}`}
          aria-roledescription={labels?.slide ?? "slide"}>{item.content}</div>)}
      </div>
    </ScrollArea>
    {total > 1 && <Inline gap="2" align="center" className="flood-carousel__controls">
      <IconButton label={labels?.previous ?? "Previous slide"} aria-controls={id} size="sm" variant="ghost"
        aria-disabled={!reading.previous} onClick={reading.previous ? () => move("previous") : undefined}>
        <PageArrow previous />
      </IconButton>
      <Text size="helper" tone="subtle" className="flood-carousel__position" aria-hidden="true">{position}</Text>
      <IconButton label={labels?.next ?? "Next slide"} aria-controls={id} size="sm" variant="ghost"
        aria-disabled={!reading.next} onClick={reading.next ? () => move("next") : undefined}>
        <PageArrow previous={false} />
      </IconButton>
      <VisuallyHidden role="status">{position}</VisuallyHidden>
    </Inline>}
  </Stack>;
});
