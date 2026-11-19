"use client";

import {useId, useRef, useState} from "react";
import {BulkActionBar, EmptyState, FileCard, FileCardGrid, Heading, ImagePreview, Inline,
  SegmentedControl, Stack, VisuallyHidden} from "@flood-md/react";

const files = [
  {id:"mark", name:"Flood mark.png", src:"/flood-mark.png", alt:"Pink Flood brand mark", size:1454337, description:"Transparent artwork for the website and presentations."},
  {id:"charts", name:"Analytics dashboard.png", src:"/charts-share.png", alt:"Flood chart examples on a dark dashboard", size:42713},
  {id:"avatar", name:"Profile avatar.svg", src:"/avatar-demo.svg", alt:"Example profile avatar"},
];

const views = [{value:"active",label:"Active"},{value:"archived",label:"Archived"}];

export function FileGallery() {
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [view, setView] = useState("active");
  const [archived, setArchived] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const inArchive = view === "archived";
  const visibleFiles = files.filter(file => archived.has(file.id) === inArchive);

  function clearSelection() {
    heading.current?.focus({preventScroll:true});
    setSelected(new Set());
  }

  function moveSelected() {
    setArchived(current => {
      const next = new Set(current);
      for (const id of selected) {
        if (inArchive) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    setAnnouncement(`${selected.size} ${selected.size === 1 ? "file" : "files"} ${inArchive ? "restored" : "archived"}.`);
    clearSelection();
  }

  return <section aria-labelledby={headingId}>
    <Stack gap="4">
      <Inline gap="3" style={{justifyContent:"space-between"}}>
        <Heading id={headingId} ref={heading} tabIndex={-1} level={2} size="section">Files</Heading>
        <SegmentedControl name={headingId} label="File view" hideLabel controlSize="sm"
          options={views} value={view} onValueChange={value => {
            setView(value);
            setSelected(new Set());
            setAnnouncement("");
          }} />
      </Inline>
      {visibleFiles.length ? <FileCardGrid role="group" aria-label={inArchive ? "Archived files" : "Active files"}
        minItemWidth="16rem" maxColumns={3} preserveColumns>
        {visibleFiles.map(file => <FileCard key={file.id} name={file.name} href={file.src} size={file.size}
          description={file.description} thumbnailSrc={file.src} thumbnailFit="contain" thumbnailPlacement="body"
          previewPlacement="thumbnail" downloadHref={file.src}
          selection={{label:`Select ${file.name}`, checked:selected.has(file.id), onCheckedChange:checked => {
            setSelected(current => {
              const next = new Set(current);
              if (checked) next.add(file.id);
              else next.delete(file.id);
              return next;
            });
            setAnnouncement("");
          }}}
          renderPreview={trigger => <ImagePreview title={file.name} src={file.src} alt={file.alt} trigger={trigger}
            downloadHref={file.src} />} />)}
      </FileCardGrid> : <EmptyState title={inArchive ? "No archived files" : "No active files"} headingLevel={3} />}
      <BulkActionBar label="Selected files" placement="viewport" selectionCount={selected.size}
        items={[{id:"move",label:inArchive ? "Restore files" : "Archive files"}]} onAction={moveSelected}
        onClear={clearSelection} />
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Stack>
  </section>;
}
