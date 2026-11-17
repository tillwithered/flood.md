import {forwardRef, useId} from "react";
import {AspectRatio, Image, Link, Stack, Text, type LinkPreviewProps} from "./index.js";

export const ResourceLinkPreview = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkPreviewProps>(function ResourceLinkPreview(
  {href, title, source, description, thumbnailSrc, className, "aria-describedby": describedBy, ...props}, ref,
) {
  const id = useId();
  const titleId = `${id}-title`;
  const sourceId = `${id}-source`;
  const excerptId = `${id}-excerpt`;
  return <Link {...props} ref={ref} href={href} className={["flood-link-preview", className].filter(Boolean).join(" ")}
    aria-labelledby={[props["aria-labelledby"], titleId, description ? excerptId : undefined, sourceId].filter(Boolean).join(" ")}
    aria-describedby={describedBy}>
    {thumbnailSrc && <AspectRatio ratio={1} className="flood-link-preview__thumbnail" aria-hidden="true">
      <Image key={thumbnailSrc} src={thumbnailSrc} alt="" loading="lazy" decoding="async" onError={event => {
        event.currentTarget.hidden = true;
      }} />
    </AspectRatio>}
    <Stack gap="1" className="flood-link-preview__copy">
      <Text id={titleId} className="flood-link-preview__title">{title}</Text>
      {description && <Text id={excerptId} size="compact" tone="subtle">{description}</Text>}
      <Text id={sourceId} size="helper" tone="subtle" dir="auto">{source}</Text>
    </Stack>
  </Link>;
});
