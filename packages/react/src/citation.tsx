import {forwardRef, useId, useImperativeHandle, useRef} from "react";
import {Button, Link, Text, VisuallyHidden, type CitationProps} from "./index.js";
import {AnchoredOverlay} from "./overlays.js";

export const InlineCitation = /* @__PURE__ */ forwardRef<HTMLButtonElement, CitationProps>(function InlineCitation(
  {label, title, source, href, excerpt, className}, ref,
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const excerptId = useId();
  useImperativeHandle(ref, () => triggerRef.current!, []);

  return <AnchoredOverlay kind="popover" inlinePopover chrome="minimal" title={title}
    className="flood-citation" aria-describedby={excerpt ? excerptId : undefined}
    trigger={({ref: setAnchor, ...trigger}) => <Button {...trigger}
      ref={node => { triggerRef.current = node; setAnchor(node); }}
      className={["flood-citation__trigger", className].filter(Boolean).join(" ")}
      variant="subtle" size="2xs">
      <span dir="auto">{label}</span><VisuallyHidden>{` ${title}`}</VisuallyHidden>
    </Button>}>
    <Text size="helper" tone="subtle" dir="auto">{source}</Text>
    <Link className="flood-citation__link" href={href} dir="auto">{title}</Link>
    {excerpt && <Text id={excerptId} size="compact" dir="auto">{excerpt}</Text>}
  </AnchoredOverlay>;
});
