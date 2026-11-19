import { forwardRef, useRef, useState, type CSSProperties } from "react";
import { Button, FileThumbnail, ImageGallery, Text, type ImageMosaicItem, type ImageMosaicProps } from "./index.js";

const visibleLimit = 4;
const imageLabel = (item: ImageMosaicItem, position: number, additional: number) => {
  const subject = item.alt.trim() || item.thumbnailLabel?.trim() || `Image ${position}`;
  return additional ? `Open ${subject} and ${additional} more` : `Open ${subject}`;
};

export const ImageMosaicContent = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageMosaicProps>(function ImageMosaicContent({
  items, label, formatImageLabel = imageLabel, formatAdditionalCount = count => `+${count}`,
  galleryProps, className, ...props
}, ref) {
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [openerId, setOpenerId] = useState<string>();
  const [currentId, setCurrentId] = useState<string>();
  if (!items.length) return null;
  const visible = items.slice(0, visibleLimit);
  const ratio = visible[0].aspectRatio;
  const singleRatio = ratio && Number.isFinite(ratio) && ratio > 0 ? Math.max(0.8, Math.min(2, ratio)) : 1.6;

  return <div {...props} ref={ref} className={["flood-image-mosaic", className].filter(Boolean).join(" ")}>
    <ImageGallery {...galleryProps} title={label} items={items} currentId={currentId} open={open}
      onCurrentIdChange={setCurrentId} onOpenChange={setOpen}
      getFallbackFocus={() => list.current?.querySelector<HTMLButtonElement>("button") ?? null}
      trigger={({ ref: _singleTrigger, onClick, "aria-expanded": _expanded, ...trigger }) => (
        <ul ref={list} className="flood-image-mosaic__grid" role="list" aria-label={label}
          data-count={visible.length} style={{ "--flood-image-mosaic-single-ratio": singleRatio } as CSSProperties}>
          {visible.map((item, index) => {
            const additional = index === visibleLimit - 1 ? items.length - visibleLimit : 0;
            return <li key={item.id} className="flood-image-mosaic__tile">
              <FileThumbnail src={item.thumbnailSrc ?? item.src} />
              <Button {...trigger} variant="ghost" className="flood-image-mosaic__action"
                aria-label={formatImageLabel(item, index + 1, additional)} aria-expanded={open && openerId === item.id}
                onClick={event => {
                  setOpenerId(item.id);
                  setCurrentId(item.id);
                  // The shared dialog focuses this tile and restores it when the viewer closes.
                  onClick?.(event);
                }}>
                {additional > 0 && <Text aria-hidden="true" size="lead" className="flood-image-mosaic__count">{formatAdditionalCount(additional)}</Text>}
              </Button>
            </li>;
          })}
        </ul>
      )} />
  </div>;
});
