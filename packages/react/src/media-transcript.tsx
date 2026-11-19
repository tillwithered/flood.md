import { forwardRef, useEffect, useRef, useState } from "react";
import { Button, DataList, HighlightText, Inline, ScrollArea, Stack, Text, type MediaTranscriptProps } from "./index.js";

export function mediaTimeLabel(seconds: number) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const remainder = String(total % 60).padStart(2,"0");
  return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${remainder}` : `${minutes}:${remainder}`;
}

export const SynchronizedTranscript = /* @__PURE__ */ forwardRef<HTMLDivElement, MediaTranscriptProps>(function SynchronizedTranscript({
  label, cues, currentTime, onSeek, defaultFollowing = true, maxViewportHeight = "18rem",
  query, labels, className, ...props
}, ref) {
  const viewport = useRef<HTMLDivElement>(null);
  const activeRow = useRef<HTMLButtonElement>(null);
  const lastAutoScroll = useRef<number | undefined>(undefined);
  const [following, setFollowing] = useState(defaultFollowing);
  if (!label.trim() || !Number.isFinite(currentTime) || currentTime < 0 ||
    new Set(cues.map(cue => cue.id)).size !== cues.length ||
    cues.some((cue,index) => !cue.id.trim() || !cue.text.trim() || !Number.isFinite(cue.start) ||
      cue.start < (cues[index-1]?.start ?? 0) || (cue.end !== undefined && (!Number.isFinite(cue.end) || cue.end <= cue.start)))) {
    throw new Error("Flood MediaTranscript requires named, ordered cues and nonnegative playback time");
  }
  let activeId: string | undefined;
  for (const cue of cues) {
    if (cue.start > currentTime) break;
    activeId = cue.end === undefined || cue.end > currentTime ? cue.id : undefined;
  }

  useEffect(() => {
    const view = viewport.current, row = activeRow.current;
    if (!following || !row || !view || !view.clientHeight) return;
    const bounds = view.getBoundingClientRect(), item = row.getBoundingClientRect();
    if (item.top < bounds.top || item.bottom > bounds.bottom) {
      view.scrollTop += (item.top - bounds.top + (item.height - bounds.height) / 2) * view.clientHeight / bounds.height;
      lastAutoScroll.current = view.scrollTop;
    }
  }, [activeId, following]);

  return <div {...props} ref={ref} className={["flood-media-transcript",className].filter(Boolean).join(" ")}>
    <Stack gap="2">
      <Inline gap="2" className="flood-media-transcript__controls">
        <Text as="span" size="compact">{label}</Text>
        {cues.length > 0 && <Button variant="ghost" size="sm" type="button"
          onClick={() => setFollowing(!following)}>
          {following ? labels?.pause ?? "Pause following" : labels?.follow ?? "Follow playback"}
        </Button>}
      </Inline>
      {cues.length ? <ScrollArea ref={viewport} aria-label={label} tabIndex={0} style={{maxBlockSize:maxViewportHeight}}
        className="flood-media-transcript__viewport"
        onWheel={() => setFollowing(false)} onTouchMove={() => setFollowing(false)}
        onScroll={event => {
          if (Math.abs(event.currentTarget.scrollTop - (lastAutoScroll.current ?? -1)) > .5) setFollowing(false);
          lastAutoScroll.current = undefined;
        }}
        onKeyDown={event => {
          if (["PageUp","PageDown","Home","End","ArrowUp","ArrowDown","Tab"].includes(event.key)) setFollowing(false);
        }}>
        <DataList dividers={false}>
          {cues.map(cue => {
            const current = cue.id === activeId;
            return <li key={cue.id}>
              <Button ref={current?activeRow:undefined} type="button" size="sm" variant={current?"subtle":"ghost"}
                aria-current={current?"time":undefined} className="flood-media-transcript__cue"
                onClick={() => onSeek(cue.start,cue)}>
                <time dateTime={`PT${cue.start}S`}>{mediaTimeLabel(cue.start)}</time>
                <span>{query?<HighlightText query={query}>{cue.text}</HighlightText>:cue.text}</span>
              </Button>
            </li>;
          })}
        </DataList>
      </ScrollArea> : <Text size="compact" tone="subtle">{labels?.empty ?? "No transcript available"}</Text>}
    </Stack>
  </div>;
});
