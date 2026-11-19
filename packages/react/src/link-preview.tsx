import {forwardRef} from "react";
import {AspectRatio, Image, Link, Stack, Text, type LinkPreviewProps} from "./index.js";

export const ResourceLinkPreview = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkPreviewProps>(function ResourceLinkPreview(
  {href, title, source, description, thumbnailSrc, className, ...props}, ref,
) {
  return <Link {...props} ref={ref} href={href} className={["flood-link-preview", className].filter(Boolean).join(" ")}>
    {thumbnailSrc && <AspectRatio ratio={1} className="flood-link-preview__thumbnail" aria-hidden="true">
      <Image key={thumbnailSrc} src={thumbnailSrc} alt="" loading="lazy" decoding="async" onError={event => {
        event.currentTarget.hidden = true;
      }} />
    </AspectRatio>}
    <Stack gap="1" className="flood-link-preview__copy">
      <Text className="flood-link-preview__title">{title}</Text>{" "}
      {description && <><Text size="compact" tone="subtle">{description}</Text>{" "}</>}
      <Text size="helper" tone="subtle" dir="auto">{source}</Text>
    </Stack>
  </Link>;
});
