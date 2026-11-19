import {forwardRef, useEffect, useId, useLayoutEffect, useRef, useState} from "react";
import {Alert, Button, Inline, Stack, Text, VisuallyHidden, type ContentAdvisoryProps} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const WarnedContent = /* @__PURE__ */ forwardRef<HTMLDivElement, ContentAdvisoryProps>(function WarnedContent(
  {title, description, children, showLabel = "Show content", hideLabel = "Hide content", mediaRatio, revealed,
    defaultRevealed = false, onRevealedChange, className, ...props}, ref,
) {
  const [localRevealed, setLocalRevealed] = useState(defaultRevealed);
  const isRevealed = revealed ?? localRevealed;
  const id = useId();
  const contentId = `${id}-content`;
  const descriptionId = `${id}-warning`;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const focusWasInContent = useRef(false);

  useBrowserLayoutEffect(() => {
    if (isRevealed || !focusWasInContent.current) return;
    focusWasInContent.current = false;
    const toggle = toggleRef.current;
    const owner = toggle?.ownerDocument;
    if (toggle && owner?.activeElement === owner?.body) toggle.focus({preventScroll: true});
  }, [isRevealed]);

  if (mediaRatio !== undefined && (!Number.isFinite(mediaRatio) || mediaRatio <= 0)) {
    throw new RangeError("Flood ContentAdvisory mediaRatio requires a finite positive ratio");
  }
  const media = mediaRatio !== undefined;
  const toggle = <Button ref={toggleRef} size="sm" variant="subtle" aria-controls={contentId} aria-expanded={isRevealed}
    aria-describedby={description && (!media || !isRevealed) ? descriptionId : undefined} onClick={() => {
      const next = !isRevealed;
      if (revealed === undefined) setLocalRevealed(next);
      onRevealedChange?.(next);
    }}>
    <span className="flood-content-advisory__action-labels">
      <span aria-hidden={isRevealed || undefined}>{showLabel}</span>
      <span aria-hidden={!isRevealed || undefined}>{hideLabel}</span>
    </span>
    <VisuallyHidden>{` ${title}`}</VisuallyHidden>
  </Button>;
  const content = <div id={contentId} className="flood-content-advisory__content" hidden={!isRevealed}
    onFocusCapture={() => { focusWasInContent.current = true; }}
    onBlurCapture={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusWasInContent.current = false;
    }}>
    {isRevealed && children}
  </div>;
  return <Stack {...props} ref={ref} gap="2" className={["flood-content-advisory", className].filter(Boolean).join(" ")}>
    {media ? <>
      <Inline className="flood-content-advisory__controls">{toggle}</Inline>
      <div className="flood-content-advisory__frame" style={{aspectRatio:mediaRatio}}>
        <Stack gap="1" className="flood-content-advisory__placeholder" aria-hidden={isRevealed || undefined}>
          <Text size="label">{title}</Text>
          {description && <Text id={descriptionId} size="helper" tone="subtle">{description}</Text>}
        </Stack>
        {content}
      </div>
    </> : <>
      <Alert tone="warning" title={title} action={toggle}>
        {description && <span id={descriptionId}>{description}</span>}
      </Alert>
      {content}
    </>}
  </Stack>;
});
