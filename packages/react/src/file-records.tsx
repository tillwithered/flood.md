import {forwardRef,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import {AspectRatio,Card,CursorPagination,DataListItem,IconSlot,IconButton,IconLink,Link,Badge,FileMeta,FileName,FileThumbnail,StatusIndicator,Progress,Dialog,Image,Spinner,Inline,Text,Toggle,Toolbar,ScrollArea,VisuallyHidden,type FileCardProps,type FileThumbnailProps,type FileMetaProps,type FileNameProps,type FileItemProps,type UploadItemProps,type ImagePreviewProps,type ImageGalleryProps} from "./index.js";
import {hasFieldContent} from "./field-state.js";
import {AnchoredOverlay} from "./overlays.js";
import {useInlineOverflow} from "./use-inline-overflow.js";
const cx=(...parts:Array<string|undefined>)=>parts.filter(Boolean).join(" ");

function sizeText(bytes:number,locale?:string){
  if(!Number.isFinite(bytes)||bytes<0)throw new Error("Flood file size must be finite and nonnegative");
  const units=["B","kB","MB","GB","TB"],unit=bytes===0?0:Math.max(0,Math.min(4,Math.floor(Math.log10(bytes)/3)));
  return `${new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(bytes/1000**unit)} ${units[unit]}`;
}
export const FileMetadata = /* @__PURE__ */ forwardRef<HTMLSpanElement,FileMetaProps>(function FileMetadata({format,size,formatSize,variant="chip",className,...props},ref){
  if(format!==undefined&&!format.trim())throw new Error("Flood FileMeta format must be nonempty when supplied");
  if(size!==undefined&&(!Number.isFinite(size)||size<0))throw new Error("Flood file size must be finite and nonnegative");
  if(format===undefined&&size===undefined)return null;
  const bytes=size===undefined?undefined:(formatSize??((value:number)=>sizeText(value,props.lang)))(size);
  const content = <>
    {format&&<bdi>{format}</bdi>}{format&&bytes&&<span aria-hidden="true">·</span>}{bytes&&<bdi>{bytes}</bdi>}
  </>;
  const frame = {...props, className:cx("flood-file-meta",className)};
  return variant === "plain"
    ? <Text {...frame} ref={ref} as="span" size="helper" tone="subtle" data-file-meta-plain="">{content}</Text>
    : <Badge {...frame} ref={ref} size="sm" tone="neutral">{content}</Badge>;
});

function fileExtension(name: string) {
  const boundary = name.lastIndexOf(".");
  const extension = boundary > 0 ? name.slice(boundary + 1) : "";
  return /^[a-z0-9]{1,12}$/i.test(extension) ? extension : "";
}

function CompactFileName({name, href, download, hidden}: Pick<FileNameProps, "name" | "href" | "download" | "hidden">) {
  const extension = fileExtension(name);
  const suffix = extension ? `.${extension}` : "";
  const stem = suffix ? name.slice(0, -suffix.length) : name;
  const base = useInlineOverflow(stem, !hidden);
  const end = useInlineOverflow(suffix, Boolean(suffix) && !hidden);
  const clipped = base.overflow || end.overflow;
  return <AnchoredOverlay kind="tooltip" inlineTooltip className="flood-truncated-text__tooltip"
    content={name} dir="auto" align="center" disabled={!clipped} trigger={trigger => {
      const pieces = <>
        <span ref={base.ref}>{stem}</span>
        {suffix && <span dir="ltr" ref={end.ref}>{suffix}</span>}
      </>;
      const shared = {...trigger, "aria-describedby":undefined, className:"flood-file-name__line"};
      return href
        ? <Link {...shared} href={href} download={download ? name : undefined} aria-label={name}>{pieces}</Link>
        : <span {...shared} tabIndex={clipped ? 0 : undefined}>{pieces}</span>;
    }} />;
}

export const FileNameText = /* @__PURE__ */ forwardRef<HTMLSpanElement, FileNameProps>(function FileNameText(
  {name, href, download, overflow, hidden, className, dir = "auto", ...props}, ref,
) {
  if (!name.trim()) throw new Error("Flood FileName requires a nonempty file name");
  return <span {...props} ref={ref} hidden={hidden} dir={dir} data-overflow={overflow} className={cx("flood-file-name",className)}>
    {overflow === "truncate" ? <CompactFileName key={href ? "link" : "text"} name={name} href={href} download={download} hidden={hidden} />
      : href ? <Link href={href} download={download ? name : undefined}>{name}</Link> : name}
  </span>;
});
function Glyph({kind}:{kind:"file"|"preview"|"download"|"remove"|"retry"|"cancel"|"pause"|"resume"}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="file"?<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>:
      kind==="preview"?<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>:
      kind==="download"?<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>:
      kind==="retry"?<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>:
      kind==="pause"?<path d="M9 5v14m6-14v14"/>:
      kind==="resume"?<path d="m8 5 11 7-11 7Z"/>:<path d="m6 6 12 12M18 6 6 18"/>}
  </svg>;
}

function fileFormat(name:string,format:FileItemProps["format"],mimeType:string|undefined) {
  const extension = fileExtension(name);
  return format === null ? undefined : format ?? mimeType ?? (extension ? extension.toUpperCase() : undefined);
}

type FileCommandsProps = Pick<FileItemProps,"name"|"onPreview"|"downloadHref"|"onRemove"|"disabled"|"labels"> & {extraActions?:ReactNode};
function fileCommands({name,onPreview,downloadHref,onRemove,disabled,labels={},extraActions}:FileCommandsProps) {
  const downloadDestination = disabled ? undefined : downloadHref;
  if (!onPreview && !downloadDestination && !onRemove && !hasFieldContent(extraActions)) return undefined;
  return <>
    {onPreview && <IconButton label={`${labels.preview ?? "Preview"}: ${name}`} title={labels.preview ?? "Preview"}
      variant="ghost" size="sm" disabled={disabled} onClick={onPreview}><Glyph kind="preview"/></IconButton>}
    {downloadDestination && <IconLink href={downloadDestination} download={name} label={`${labels.download ?? "Download"}: ${name}`}
      title={labels.download ?? "Download"} variant="ghost" size="sm"><Glyph kind="download"/></IconLink>}
    {extraActions}
    {onRemove && <IconButton label={`${labels.remove ?? "Remove"}: ${name}`} title={labels.remove ?? "Remove"}
      variant="ghost" size="sm" disabled={disabled} onClick={onRemove}><Glyph kind="remove"/></IconButton>}
  </>;
}

interface RowProps extends FileItemProps { extraActions?:ReactNode; }
const FileRow = /* @__PURE__ */ forwardRef<HTMLLIElement,RowProps>(function FileRow({
  name,nameOverflow,size,mimeType,format,metadataVariant,thumbnail,thumbnailSrc,thumbnailFit,description,href,download=false,onPreview,downloadHref,onRemove,disabled=false,
  labels={},formatSize,className,extraActions,...props
},ref){
  if(!name.trim())throw new Error("Flood FileItem requires a nonempty file name");
  if(size!==undefined&&(!Number.isFinite(size)||size<0))throw new Error("Flood file size must be finite and nonnegative");
  const displayedFormat=fileFormat(name,format,mimeType);
  return <DataListItem {...props} ref={ref} className={cx("flood-file-item",className)}
    media={hasFieldContent(thumbnail)
      ? <span className="flood-file-item__thumbnail" aria-hidden="true">{thumbnail}</span>
      : <FileThumbnail className="flood-file-item__thumbnail" src={thumbnailSrc} fit={thumbnailFit}/>}
    title={<span className="flood-file-item__heading" data-name-overflow={nameOverflow}>
      <FileName name={name} overflow={nameOverflow} href={disabled ? undefined : href} download={download} hidden={props.hidden} className="flood-file-item__name" />
      <FileMeta format={displayedFormat} size={size} variant={metadataVariant} formatSize={formatSize} lang={props.lang}/>
    </span>}
    description={hasFieldContent(description)?description:undefined}
    actions={fileCommands({name,onPreview,downloadHref,onRemove,disabled,labels,extraActions})}/>;
});
export const FileRecord = /* @__PURE__ */ forwardRef<HTMLLIElement,FileItemProps>(function FileRecord(props,ref){return <FileRow {...props} ref={ref}/>;});

function FileThumbnailArtwork({src,fit,presentation}: Pick<FileThumbnailProps,"src"|"fit"|"presentation">) {
  const [state,setState] = useState<"pending"|"ready"|"failed">("pending");
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(()=>{
    const image = imageRef.current;
    if (image?.complete) setState(image.naturalWidth ? "ready" : "failed");
  },[]);
  return <>
    {state !== "ready" && <IconSlot size={presentation === "tile" ? "xl" : "lg"}><Glyph kind="file"/></IconSlot>}
    {src && state !== "failed" && <Image ref={imageRef} src={src} alt="" fit={fit} loading="lazy" decoding="async"
      className="flood-file-thumbnail__image" data-ready={state === "ready" || undefined}
      onLoad={()=>setState("ready")} onError={()=>setState("failed")}/>}
  </>;
}

export const FileThumbnailSurface = /* @__PURE__ */ forwardRef<HTMLDivElement,FileThumbnailProps>(function FileThumbnailSurface(
  {src,fit,presentation,ratio,className,...props},ref,
){
  const frame = {...props,ref,className:cx("flood-file-thumbnail",className),"data-presentation":presentation,"aria-hidden":true as const};
  const artwork = <FileThumbnailArtwork key={src ?? ""} src={src} fit={fit} presentation={presentation}/>;
  return presentation === "tile"
    ? <AspectRatio {...frame} ratio={ratio}>{artwork}</AspectRatio>
    : <div {...frame}>{artwork}</div>;
});

export const FileGalleryCard = /* @__PURE__ */ forwardRef<HTMLDivElement,FileCardProps>(function FileGalleryCard({
  name,nameOverflow="truncate",size,mimeType,format,description,href,download,onPreview,downloadHref,onRemove,
  disabled=false,labels,formatSize,thumbnailSrc,thumbnailFit="cover",thumbnailRatio=4/3,thumbnailPlacement="top",previewPlacement="footer",selection,
  density="compact",headingSize="group",footerDivider=false,className,...props
},ref){
  const displayedFormat = fileFormat(name,format,mimeType);
  const previewOnThumbnail = previewPlacement === "thumbnail" && onPreview;
  const commands = fileCommands({name,onPreview:previewOnThumbnail ? undefined : onPreview,downloadHref,onRemove,disabled,labels});
  const meta = displayedFormat !== undefined || size !== undefined;
  const artwork = <FileThumbnail className="flood-file-card__preview" presentation="tile" src={thumbnailSrc} fit={thumbnailFit} ratio={thumbnailRatio}/>;
  const previewLabel = labels?.preview ?? "Preview";
  const preview = previewOnThumbnail ? <div className="flood-file-card__media">
    {artwork}
    <IconButton className="flood-file-card__preview-action" label={`${previewLabel}: ${name}`} title={previewLabel}
      size="sm" variant="subtle" disabled={disabled} onClick={event=>{
        event.currentTarget.focus({preventScroll:true});
        onPreview();
      }}><Glyph kind="preview"/></IconButton>
  </div> : artwork;
  return <Card {...props} ref={ref} density={density} headingSize={headingSize} footerDivider={footerDivider} className={cx("flood-file-card",className)}
    media={thumbnailPlacement === "top" ? preview : undefined}
    title={<FileName name={name} href={disabled ? undefined : href} download={download} overflow={nameOverflow} hidden={props.hidden}/>}
    description={description} selection={selection && {...selection,disabled:disabled || selection.disabled}}
    footer={(meta || commands) && <Inline gap="2" className="flood-file-card__footer">
      {meta && <FileMeta format={displayedFormat} size={size} formatSize={formatSize} lang={props.lang}/>}
      {commands && <Inline gap="1" className="flood-file-card__commands">{commands}</Inline>}
    </Inline>}>
    {thumbnailPlacement === "body" ? preview : undefined}
  </Card>;
});

const uploadStatus = {
  queued:"Waiting to upload", uploading:"Uploading", paused:"Paused", processing:"Processing",
  success:"Uploaded", error:"Upload failed", cancelled:"Cancelled",
} satisfies Record<UploadItemProps["state"], string>;

export const UploadRecord = /* @__PURE__ */ forwardRef<HTMLLIElement,UploadItemProps>(function UploadRecord({
  state,progress,error,onPause,onResume,onCancel,onRetry,onPreview,onRemove,href,downloadHref,labels={},disabled=false,className,...props
},ref){
  if(!Object.hasOwn(uploadStatus,state))throw new Error("Flood UploadItem requires a supported state");
  if(progress!==undefined&&(!Number.isFinite(progress)||progress<0||progress>100))throw new Error("Flood upload progress must be between 0 and 100");
  const paused = state === "paused";
  const transferring = state === "uploading";
  const processing = state === "processing";
  const active = state === "queued" || transferring || paused || processing;
  const retry = state === "error" || state === "cancelled";
  const status = state === "error" ? error || labels.error || uploadStatus.error : labels[state] ?? uploadStatus[state];
  const transferProgress = transferring || paused ? progress : undefined;
  const percent = transferProgress === undefined ? "" :
    ` · ${new Intl.NumberFormat(props.lang, {style:"percent", maximumFractionDigits:0}).format(transferProgress / 100)}`;
  const transferAction = paused ? onResume : transferring ? onPause : undefined;
  const transferLabel = paused ? labels.resume ?? "Resume upload" : labels.pause ?? "Pause upload";
  const operation = active
    ? {label: labels.cancel??"Cancel upload", glyph: "cancel" as const, action: onCancel}
    : {label: labels.retry??"Retry upload", glyph: "retry" as const, action: retry ? onRetry : undefined};
  return <FileRow {...props} ref={ref} labels={labels} disabled={disabled} href={state==="success"?href:undefined}
    onPreview={state==="success"?onPreview:undefined} downloadHref={state==="success"?downloadHref:undefined}
    onRemove={active?undefined:onRemove} className={cx("flood-upload-item",className)}
    data-upload-state={state} description={<div className="flood-upload-item__status-row">
      <StatusIndicator label={status+percent} tone={state==="error"?"error":state==="success"?"success":"neutral"} size="sm" presentation="wrap"/>
      {(transferring || processing || (paused && transferProgress !== undefined)) &&
        <Progress label={`${status}: ${props.name}`} value={transferProgress} tone={paused ? "neutral" : "accent"} size="sm" hideLabel/>}
    </div>} extraActions={(transferAction || operation.action) && <>
      {transferAction && <IconButton label={`${transferLabel}: ${props.name}`} title={transferLabel} variant="ghost" size="sm" disabled={disabled} onClick={transferAction}>
        <Glyph kind={paused ? "resume" : "pause"}/>
      </IconButton>}
      {operation.action && <IconButton label={`${operation.label}: ${props.name}`} variant="ghost" size="sm" disabled={disabled} onClick={operation.action}>
        <Glyph kind={operation.glyph}/>
      </IconButton>}
    </>}/>;
});

type PreviewContentProps = Pick<ImagePreviewProps, "src" | "alt" | "caption" | "downloadHref" | "zoomable"> &
  Required<Pick<ImagePreviewProps, "actualSizeLabel" | "viewportLabel" | "downloadLabel" | "loadingLabel" | "errorLabel">>;

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function PreviewContent({src,alt,caption,loadingLabel,errorLabel,downloadHref,downloadLabel,zoomable,actualSizeLabel,viewportLabel}:PreviewContentProps){
  const [state,setState]=useState<"loading"|"loaded"|"error">("loading");
  const [actualSize,setActualSize]=useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const enlarged = Boolean(zoomable && actualSize && state === "loaded");
  useBrowserLayoutEffect(() => {
    const node = viewport.current;
    if (!enlarged || !node) return;
    const direction = getComputedStyle(node).direction === "rtl" ? -1 : 1;
    node.scrollTo({
      left: direction * (node.scrollWidth - node.clientWidth) / 2,
      top: (node.scrollHeight - node.clientHeight) / 2,
    });
  }, [enlarged]);
  const download = downloadHref && <Link href={downloadHref} download variant="subtle" size="sm">{downloadLabel}</Link>;
  return <>
    {zoomable && <Inline gap="2" className="flood-image-preview__toolbar">
      <Toggle size="sm" variant="subtle" pressed={enlarged} disabled={state!=="loaded"} onPressedChange={setActualSize}>{actualSizeLabel}</Toggle>
      {download}
    </Inline>}
    <figure className="flood-image-preview__figure">
      <div className="flood-image-preview__media" data-state={state} data-enlarged={enlarged || undefined}>
        <ScrollArea ref={viewport} className="flood-image-preview__viewport" orientation={enlarged ? "both" : "vertical"} contentInset="none" tabIndex={enlarged ? 0 : -1}
          aria-label={enlarged ? viewportLabel : undefined}>
          <Image src={src} alt={alt} fit="contain" hidden={state==="error"} className="flood-image-preview__image"
            onLoad={()=>setState("loaded")} onError={()=>setState("error")}/>
        </ScrollArea>
        {state==="loading"&&<Spinner label={loadingLabel}/>}
        {state==="error"&&<StatusIndicator label={errorLabel} tone="error" presentation="wrap" role="status"/>}
      </div>
      {hasFieldContent(caption)&&<figcaption className="flood-image-preview__caption">{caption}</figcaption>}
    </figure>
    {!zoomable && download && <Inline className="flood-image-preview__actions">{download}</Inline>}
  </>;
}

export const ModalImagePreview = /* @__PURE__ */ forwardRef<HTMLDialogElement,ImagePreviewProps>(function ModalImagePreview({
  src,alt,caption,downloadHref,downloadLabel="Download image",zoomable=false,actualSizeLabel="Actual size",viewportLabel="Image at actual size",
  loadingLabel="Loading image…",errorLabel="Could not load the image.",className,...props
},ref){
  if(!src.trim()||typeof alt!=="string"||![downloadLabel,loadingLabel,errorLabel,actualSizeLabel,viewportLabel].every(label=>label.trim()))throw new Error("Flood ImagePreview requires a source, explicit alt text and nonempty labels");
  return <Dialog {...props} ref={ref} className={cx("flood-image-preview",className)}>
    <PreviewContent key={src} src={src} alt={alt} caption={caption} downloadHref={downloadHref} downloadLabel={downloadLabel}
      zoomable={zoomable} actualSizeLabel={actualSizeLabel} viewportLabel={viewportLabel} loadingLabel={loadingLabel} errorLabel={errorLabel}/>
  </Dialog>;
});

function GalleryThumbnails({items, selectedId, label, getPositionLabel, onSelect}: {
  items: ImageGalleryProps["items"];
  selectedId: string;
  label: string;
  getPositionLabel: NonNullable<ImageGalleryProps["getPositionLabel"]>;
  onSelect: (id: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  useBrowserLayoutEffect(() => {
    const rail = viewport.current;
    if (!rail) return;
    const showSelected = () => {
      const selected = rail.querySelector('[aria-pressed="true"]');
      if (!selected || !rail.clientWidth) return;
      const {left,right} = rail.getBoundingClientRect();
      const button = selected.getBoundingClientRect();
      rail.scrollLeft += button.left < left ? button.left-left : button.right > right ? button.right-right : 0;
    };
    showSelected();
    const observer = new ResizeObserver(showSelected);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [selectedId, items]);
  return <ScrollArea ref={viewport} orientation="horizontal" contentInset="none" tabIndex={-1} className="flood-image-gallery__thumbnails">
    <Toolbar label={label} variant="plain" className="flood-image-gallery__strip">
      {items.map((item,index) => {
        const name = item.thumbnailLabel?.trim() || item.alt.trim() || getPositionLabel(index+1,items.length);
        return <div key={item.id} className="flood-image-gallery__thumbnail">
          <FileThumbnail src={item.thumbnailSrc} presentation="tile" fit="contain" />
          <Toggle size="sm" variant="ghost" className="flood-image-gallery__thumbnail-action"
            aria-label={name} title={name} pressed={item.id===selectedId} onPressedChange={()=>onSelect(item.id)}/>
        </div>;
      })}
    </Toolbar>
  </ScrollArea>;
}

export const ModalImageGallery = /* @__PURE__ */ forwardRef<HTMLDialogElement, ImageGalleryProps>(function ModalImageGallery({
  items,currentId,defaultCurrentId,onCurrentIdChange,zoomable=false,actualSizeLabel="Actual size",viewportLabel="Image at actual size",
  loadingLabel="Loading image…",errorLabel="Could not load the image.",downloadLabel="Download image",navigationLabel="Images",
  previousLabel="Previous image",nextLabel="Next image",getPositionLabel=(position,total)=>`${position} / ${total}`,
  navigation="arrows",className,onKeyDown,...props
},ref){
  const [localId,setLocalId]=useState(defaultCurrentId);
  if (items.some(item=>!item.id.trim()||!item.src.trim()||typeof item.alt!=="string") ||
      new Set(items.map(item=>item.id)).size!==items.length) {
    throw new Error("Flood ImageGallery requires unique image IDs, sources and explicit alt text");
  }
  if (!items.length) return null;
  const index = Math.max(0,items.findIndex(item=>item.id===(currentId??localId)));
  const image = items[index];
  const select = (next: string) => {
    if (next === image.id) return;
    if (currentId === undefined) setLocalId(next);
    onCurrentIdChange?.(next);
  };
  const navigate = (offset: number) => select(items[(index + offset + items.length) % items.length].id);
  const position = getPositionLabel(index+1,items.length);
  return <Dialog {...props} ref={ref} className={cx("flood-image-preview","flood-image-gallery",className)} onKeyDown={event=>{
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || items.length < 2 ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    const target = event.target as HTMLElement;
    if (target.closest(".flood-image-preview__figure,.flood-image-preview__toolbar,.flood-image-preview__actions")) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    event.preventDefault();
    navigate((event.key === "ArrowRight") !== rtl ? 1 : -1);
  }}>
    <PreviewContent key={JSON.stringify([image.id,image.src])} {...image} zoomable={zoomable} actualSizeLabel={actualSizeLabel} viewportLabel={viewportLabel}
      loadingLabel={loadingLabel} errorLabel={errorLabel} downloadLabel={downloadLabel}/>
    {items.length > 1 && (navigation === "thumbnails"
      ? <GalleryThumbnails items={items} selectedId={image.id} label={navigationLabel} getPositionLabel={getPositionLabel} onSelect={select}/>
      : <CursorPagination className="flood-image-gallery__navigation" label={navigationLabel}
        previousLabel={previousLabel} nextLabel={nextLabel} position={position} variant="ghost"
        previous={{onSelect:()=>navigate(-1)}} next={{onSelect:()=>navigate(1)}}/>)}
    <VisuallyHidden role="status">{position}{image.alt && ` · ${image.alt}`}</VisuallyHidden>
  </Dialog>;
});
