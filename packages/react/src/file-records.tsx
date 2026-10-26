import {forwardRef,useState,type ReactNode} from "react";
import {DataListItem,IconSlot,IconButton,Link,Stack,StatusIndicator,Progress,Dialog,Image,Spinner,Text,type FileItemProps,type UploadItemProps,type ImagePreviewProps} from "./index.js";
import {hasFieldContent} from "./field-state.js";
const cx=(...parts:Array<string|undefined>)=>parts.filter(Boolean).join(" ");

function sizeText(bytes:number,locale?:string){
  if(!Number.isFinite(bytes)||bytes<0)throw new Error("Flood file size must be finite and nonnegative");
  const units=["B","kB","MB","GB","TB"],unit=bytes===0?0:Math.max(0,Math.min(4,Math.floor(Math.log10(bytes)/3)));
  return `${new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(bytes/1000**unit)} ${units[unit]}`;
}
function Glyph({kind}:{kind:"file"|"preview"|"remove"|"retry"|"cancel"}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="file"?<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>:
      kind==="preview"?<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>:
      kind==="retry"?<><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>:<path d="m6 6 12 12M18 6 6 18"/>}
  </svg>;
}
interface RowProps extends FileItemProps { extraActions?:ReactNode; }
const FileRow = /* @__PURE__ */ forwardRef<HTMLLIElement,RowProps>(function FileRow({
  name,size,mimeType,thumbnail,description,href,download=false,onPreview,onRemove,disabled=false,
  labels={},formatSize,className,extraActions,...props
},ref){
  if(!name.trim())throw new Error("Flood FileItem requires a nonempty file name");
  if(size!==undefined&&(!Number.isFinite(size)||size<0))throw new Error("Flood file size must be finite and nonnegative");
  const bytes=size===undefined?undefined:(formatSize??((value:number)=>sizeText(value,props.lang)))(size);
  return <DataListItem {...props} ref={ref} className={cx("flood-file-item",className)}
    media={<span className="flood-file-item__thumbnail" aria-hidden="true">{hasFieldContent(thumbnail)?thumbnail:<IconSlot size="lg"><Glyph kind="file"/></IconSlot>}</span>}
    title={href&&!disabled?<Link href={href} download={download?name:undefined} className="flood-file-item__name">{name}</Link>:<span className="flood-file-item__name" dir="auto">{name}</span>}
    description={(bytes||mimeType||hasFieldContent(description))?<Stack gap="1">
      {(bytes||mimeType)&&<span className="flood-file-item__metadata">{bytes&&<span>{bytes}</span>}{mimeType&&<span>{mimeType}</span>}</span>}
      {hasFieldContent(description)&&description}
    </Stack>:undefined}
    actions={(onPreview||onRemove||hasFieldContent(extraActions))?<>
      {onPreview&&<IconButton label={`${labels.preview??"Preview"}: ${name}`} variant="ghost" size="sm" disabled={disabled} onClick={onPreview}><Glyph kind="preview"/></IconButton>}
      {extraActions}
      {onRemove&&<IconButton label={`${labels.remove??"Remove"}: ${name}`} variant="ghost" size="sm" disabled={disabled} onClick={onRemove}><Glyph kind="remove"/></IconButton>}
    </>:undefined}/>;
});
export const FileRecord = /* @__PURE__ */ forwardRef<HTMLLIElement,FileItemProps>(function FileRecord(props,ref){return <FileRow {...props} ref={ref}/>;});

export const UploadRecord = /* @__PURE__ */ forwardRef<HTMLLIElement,UploadItemProps>(function UploadRecord({
  state,progress,error,onCancel,onRetry,onPreview,onRemove,href,labels={},disabled=false,className,...props
},ref){
  if(!["queued","uploading","success","error","cancelled"].includes(state))throw new Error("Flood UploadItem requires a supported state");
  if(progress!==undefined&&(!Number.isFinite(progress)||progress<0||progress>100))throw new Error("Flood upload progress must be between 0 and 100");
  const active=state==="queued"||state==="uploading",retry=state==="error"||state==="cancelled";
  const status=state==="error"?(error||labels.error||"Upload failed"):labels[state]??({queued:"Waiting to upload",uploading:"Uploading",success:"Uploaded",error:"Upload failed",cancelled:"Cancelled"}[state]);
  const percent=state==="uploading"&&progress!==undefined?` · ${new Intl.NumberFormat(props.lang,{maximumFractionDigits:0}).format(progress)}%`:"";
  return <FileRow {...props} ref={ref} labels={labels} disabled={disabled} href={state==="success"?href:undefined}
    onPreview={state==="success"?onPreview:undefined} onRemove={active?undefined:onRemove} className={cx("flood-upload-item",className)}
    data-upload-state={state} description={<div className="flood-upload-item__status-row" data-progress={state==="uploading"||undefined}>
      <StatusIndicator label={status+percent} tone={state==="error"?"error":state==="success"?"success":"neutral"} size="sm"/>
      {state==="uploading"&&<Progress label={`${labels.uploading??"Uploading"}: ${props.name}`} value={progress} size="sm" hideLabel/>}
    </div>} extraActions={(active&&onCancel||retry&&onRetry)?<>
      {active&&onCancel&&<IconButton label={`${labels.cancel??"Cancel upload"}: ${props.name}`} variant="ghost" size="sm" disabled={disabled} onClick={onCancel}><Glyph kind="cancel"/></IconButton>}
      {retry&&onRetry&&<IconButton label={`${labels.retry??"Retry upload"}: ${props.name}`} variant="ghost" size="sm" disabled={disabled} onClick={onRetry}><Glyph kind="retry"/></IconButton>}
    </>:undefined}/>;
});

function PreviewContent({src,alt,caption,loadingLabel,errorLabel}:{src:string;alt:string;caption?:ReactNode;loadingLabel:string;errorLabel:string}){
  const [state,setState]=useState<"loading"|"loaded"|"error">("loading");
  return <figure className="flood-image-preview__figure">
    <div className="flood-image-preview__media" data-state={state}>
      <Image src={src} alt={alt} hidden={state==="error"} className="flood-image-preview__image" onLoad={()=>setState("loaded")} onError={()=>setState("error")}/>
      {state==="loading"&&<Spinner label={loadingLabel}/>}
      {state==="error"&&<Text as="p" size="compact" tone="subtle" role="status">{errorLabel}</Text>}
    </div>
    {hasFieldContent(caption)&&<figcaption className="flood-image-preview__caption">{caption}</figcaption>}
  </figure>;
}
export const ModalImagePreview = /* @__PURE__ */ forwardRef<HTMLDialogElement,ImagePreviewProps>(function ModalImagePreview({
  src,alt,caption,downloadHref,downloadLabel="Download image",loadingLabel="Loading image…",errorLabel="Could not load the image.",className,...props
},ref){
  if(!src.trim()||typeof alt!=="string"||![downloadLabel,loadingLabel,errorLabel].every(label=>label.trim()))throw new Error("Flood ImagePreview requires a source, explicit alt text and nonempty labels");
  return <Dialog {...props} ref={ref} className={cx("flood-image-preview",className)}>
    <PreviewContent key={src} src={src} alt={alt} caption={caption} loadingLabel={loadingLabel} errorLabel={errorLabel}/>
    {downloadHref&&<div className="flood-image-preview__actions"><Link href={downloadHref} download variant="subtle" size="sm">{downloadLabel}</Link></div>}
  </Dialog>;
});
