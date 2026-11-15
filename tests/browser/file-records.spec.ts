import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chooseSelectOption,chooseStudioSheetOption} from "./select-helpers";
let bundled:Promise<string>;

test("ImageComparison reveals aligned versions with pointer and keyboard input", async ({page}, info) => {
  await page.goto("/components/image-comparison");
  const comparison = page.locator(".preview-stage .flood-image-comparison");
  const frame = comparison.locator(".flood-image-comparison__frame");
  const divider = frame.locator(".flood-image-comparison__divider");
  const grip = frame.locator(".flood-image-comparison__grip");
  const slider = comparison.getByRole("slider",{name:"Line version, visible percentage"});
  await expect(slider).toHaveValue("50");
  await expect(frame.getByRole("img")).toHaveCount(2);
  await frame.getByRole("img").evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode())));
  await page.evaluate(()=>document.fonts.ready);
  const box = (await frame.boundingBox())!;
  const middle = box.x+box.width/2;
  expect((await divider.boundingBox())!.x).toBeCloseTo(middle,0);
  await comparison.screenshot({path:info.outputPath("image-comparison-rest.png")});
  await page.mouse.move(middle,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.7,box.y+box.height/2,{steps:6});
  await page.mouse.up();
  await expect(slider).toHaveValue("70");
  await expect(slider).toBeFocused();
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await slider.press("End");
  await expect(slider).toHaveValue("100");
  const endGrip = (await grip.boundingBox())!;
  expect(endGrip.x+endGrip.width).toBeCloseTo(box.x+box.width,0);
  expect(await frame.boundingBox()).toEqual(box);
  await comparison.screenshot({path:info.outputPath("image-comparison-end.png")});

  if (info.project.name === "desktop") {
    await chooseSelectOption(page.getByRole("combobox",{name:"ImageComparison prop direction"}),"rtl");
  } else {
    await comparison.evaluate(node=>node.setAttribute("dir","rtl"));
  }
  await slider.press("Home");
  expect((await divider.boundingBox())!.x).toBeCloseTo(box.x+box.width-1,0);
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("1");
  await frame.click({position:{x:box.width/4,y:box.height/2}});
  await expect(slider).toHaveValue("75");
  await comparison.screenshot({path:info.outputPath("image-comparison-rtl.png")});
  await page.getByRole("checkbox",{name:"ImageComparison prop disabled"}).check();
  await expect(slider).toBeDisabled();
  await frame.click({position:{x:box.width/2,y:box.height/2}});
  await expect(slider).toHaveValue("75");
});

test("UploadQueue keeps intake available while rows scroll and returns focus after cancellation", async ({page}, info) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/upload-queue");
  const queue = page.getByRole("region",{name:"Uploads",exact:true});
  const scroller = queue.getByRole("region",{name:"Files in queue"});
  const files = queue.getByRole("list",{name:"Files in queue"});
  const browse = queue.getByRole("button",{name:"Browse",exact:true});
  await expect(files.getByRole("listitem")).toHaveCount(3);
  await expect(files.getByRole("progressbar")).toHaveCount(2);
  const width = (await files.boundingBox())!.width;
  await chooseSelectOption(page.getByRole("combobox",{name:"UploadQueue prop maxListHeight",exact:true}),"8rem");
  await expect(scroller).toHaveAttribute("data-scrollbars","overlay");
  const pickerTop = (await browse.boundingBox())!.y;
  await scroller.evaluate(node => {node.scrollTop = node.scrollHeight;});
  expect(await scroller.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect((await files.boundingBox())!.width).toBeCloseTo(width,0);
  expect((await browse.boundingBox())!.y).toBeCloseTo(pickerTop,0);
  await scroller.evaluate(node => {node.scrollTop = 0;});
  await queue.screenshot({path:info.outputPath("upload-queue-overflow.png")});

  await page.getByRole("checkbox",{name:"UploadQueue prop showExamples",exact:true}).uncheck();
  await expect(files).toHaveCount(0);
  await queue.screenshot({path:info.outputPath("upload-queue-empty.png")});
  const [picker] = await Promise.all([page.waitForEvent("filechooser"),browse.press("Enter")]);
  await picker.setFiles(["first.txt","second.txt"].map(name=>({name,mimeType:"text/plain",buffer:Buffer.from("example")})));
  const first = files.getByRole("button",{name:"Cancel upload: first.txt"});
  const second = files.getByRole("button",{name:"Cancel upload: second.txt"});
  await first.press("Enter");
  await expect(second).toBeFocused();
  await second.press("Enter");
  await expect(files).toHaveCount(0);
  await expect(browse).toBeFocused();
});

test("FileThumbnail reserves size while loading and uses the same fallback in file rows", async ({page}, info) => {
  let resolveImage!: () => void;
  const waiting = new Promise<void>(resolve => {resolveImage = resolve;});
  await page.route("**/flood-mark.png",async route=>{
    await waiting;
    await route.continue();
  });
  await page.goto("/components/file-thumbnail",{waitUntil:"domcontentloaded"});
  const thumbnail = page.locator(".preview-stage .flood-file-thumbnail");
  const artwork = thumbnail.locator("img");
  const glyph = thumbnail.locator("svg");
  await expect(glyph).toBeVisible();
  await expect(artwork).toBeHidden();
  const before = await thumbnail.evaluate(node=>[node.clientWidth,node.clientHeight]);
  resolveImage();
  await expect(artwork).toBeVisible();
  await expect(glyph).toHaveCount(0);
  expect(await thumbnail.evaluate(node=>[node.clientWidth,node.clientHeight])).toEqual(before);
  await expect(thumbnail).toHaveAttribute("aria-hidden","true");
  await chooseSelectOption(page.getByRole("combobox",{name:"FileThumbnail prop presentation"}),"tile");
  const tile = await thumbnail.evaluate(node=>[node.clientWidth,node.clientHeight]);
  await chooseSelectOption(page.getByRole("combobox",{name:"FileThumbnail prop image"}),"unavailable");
  await expect(artwork).toHaveCount(0);
  await expect(glyph).toBeVisible();
  expect(await thumbnail.evaluate(node=>[node.clientWidth,node.clientHeight])).toEqual(tile);
  await thumbnail.screenshot({path:info.outputPath("file-thumbnail-fallback.png")});

  await page.goto("/components/file-item");
  const row = page.locator(".preview-stage .flood-file-item");
  const rowThumbnail = row.locator(".flood-file-thumbnail");
  const rowBefore = await rowThumbnail.boundingBox();
  await chooseSelectOption(page.getByRole("combobox",{name:"FileItem prop thumbnail"}),"image");
  await expect(rowThumbnail.locator("img")).toBeVisible();
  const rowAfter = await rowThumbnail.boundingBox();
  expect([rowAfter!.width,rowAfter!.height]).toEqual([rowBefore!.width,rowBefore!.height]);
  await row.screenshot({path:info.outputPath("file-row-with-thumbnail.png")});

  await page.goto("/components/upload-item");
  await page.getByRole("checkbox",{name:"UploadItem prop showThumbnail"}).check();
  const upload = page.locator(".preview-stage .flood-upload-item");
  await expect(upload.locator(".flood-file-thumbnail img")).toBeVisible();
  await expect(upload.getByRole("progressbar")).toBeVisible();
  await upload.screenshot({path:info.outputPath("upload-with-thumbnail.png")});
});

test("FileCard keeps thumbnail geometry, filename and commands independent", async ({page}, info) => {
  await page.goto("/components/file-card");
  const card = page.locator(".preview-stage .flood-file-card").first();
  const frame = card.locator(".flood-file-card__preview");
  const image = frame.locator("img");
  await expect(image).toHaveAttribute("data-ready","true");
  const dimensions = () => frame.evaluate(node => [node.clientWidth,node.clientHeight]);
  const before = await dimensions();
  await chooseSelectOption(page.getByRole("combobox",{name:"FileCard prop thumbnail",exact:true}),"unavailable");
  await expect(image).toHaveCount(0);
  await expect(frame.locator("svg")).toBeVisible();
  expect(await dimensions()).toEqual(before);
  await chooseSelectOption(page.getByRole("combobox",{name:"FileCard prop thumbnail",exact:true}),"image");
  await expect(image).toHaveAttribute("data-ready","true");
  await page.getByRole("checkbox",{name:"FileCard prop selectable"}).check();
  await page.getByRole("checkbox",{name:"FileCard prop longName"}).check();
  const filename = "Flood-brand-mark-original-transparent-background.png";
  const link = card.getByRole("link",{name:filename,exact:true});
  await expect(link).toHaveAttribute("href","/flood-mark.png");
  await expect(link.locator("span").last()).toHaveText(".png");
  const select = card.getByRole("checkbox",{name:"Select "+filename});
  const download = card.getByRole("link",{name:"Download: "+filename});
  const preview = card.getByRole("button",{name:"Preview: "+filename});
  await select.press("Space");
  await expect(select).toBeChecked();
  await expect(card).toHaveAttribute("data-selected","true");
  const [file] = await Promise.all([page.waitForEvent("download"),download.press("Enter")]);
  expect(file.suggestedFilename()).toBe(filename);
  await expect(select).toBeChecked();
  await card.screenshot({path:info.outputPath("file-card-selected.png")});

  await page.getByRole("checkbox",{name:"FileCard prop narrow"}).check();
  await page.getByRole("checkbox",{name:"FileCard prop showRemove"}).check();
  const footer = card.locator(".flood-file-card__footer");
  const commands = card.locator(".flood-file-card__commands");
  await expect(commands.getByRole("button",{name:"Preview: "+filename})).toBeVisible();
  const commandCenters = await commands.locator("button, a").evaluateAll(nodes=>nodes.map(node=>{
    const box=node.getBoundingClientRect();
    return box.y+box.height/2;
  }));
  expect(Math.max(...commandCenters)-Math.min(...commandCenters)).toBeLessThan(1);
  expect(await footer.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await card.screenshot({path:info.outputPath("file-card-narrow-footer.png")});

  const artworkBounds = (await frame.boundingBox())!;
  await chooseSelectOption(page.getByRole("combobox",{name:"FileCard prop previewPlacement"}),"thumbnail");
  expect(await frame.boundingBox()).toMatchObject({width:artworkBounds.width,height:artworkBounds.height});
  await expect(card.getByRole("button",{name:"Preview: "+filename})).toHaveCount(1);
  await expect(card.locator(".flood-file-card__media").getByRole("button")).toBeVisible();
  await card.screenshot({path:info.outputPath("file-card-narrow-thumbnail.png")});
  await preview.press("Enter");
  const dialog = page.getByRole("dialog",{name:filename});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img",{name:filename})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(preview).toBeFocused();
  await expect(select).toBeChecked();

  await page.getByRole("checkbox",{name:"FileCard prop disabled"}).check();
  await expect(select).toBeDisabled();
  await expect(preview).toBeDisabled();
  await expect(download).toHaveCount(0);
  await expect(link).toHaveCount(0);
  if (info.project.name === "desktop") {
    await page.getByRole("checkbox",{name:"FileCard prop showRemove"}).uncheck();
    await page.getByRole("checkbox",{name:"FileCard prop disabled"}).uncheck();
    await page.getByRole("checkbox",{name:"FileCard prop longName"}).uncheck();
    await page.getByRole("checkbox",{name:"FileCard prop gallery"}).check();
    await page.getByRole("checkbox",{name:"FileCard prop description"}).check();
    const grid = page.locator(".preview-stage .flood-grid");
    await expect(grid.locator("img[data-ready]")).toHaveCount(2);
    const previewPositions = () => grid.locator(".flood-file-card__preview").evaluateAll(nodes =>
      nodes.map(node=>node.getBoundingClientRect().y));
    const tops = await previewPositions();
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
    const metadataCenters = await grid.locator(".flood-file-meta").evaluateAll(nodes => nodes.map(node=>{
      const bounds = node.getBoundingClientRect();
      return bounds.y + bounds.height / 2;
    }));
    expect(Math.max(...metadataCenters) - Math.min(...metadataCenters)).toBeLessThan(1);
    await grid.screenshot({path:info.outputPath("file-card-gallery.png")});
    await chooseSelectOption(page.getByRole("combobox",{name:"FileCard prop thumbnailPlacement"}),"body");
    const bodyTops = await previewPositions();
    expect(bodyTops[0]).toBeGreaterThan(bodyTops[1]);
  }
});

test("plain file lists leave the containing surface in charge and retain file actions", async ({page}, info) => {
  await page.goto("/components/file-list");
  const choose = (property:string, value:string) =>
    chooseSelectOption(page.getByRole("combobox",{name:`FileList prop ${property}`,exact:true}),value);
  const files = page.locator(".preview-stage").getByRole("list",{name:"Attachments"});
  await expect(files).toHaveCSS("border-top-width","1px");
  await choose("appearance","plain");
  await choose("metadataVariant","plain");
  await expect(files).toHaveCSS("border-top-width","0px");
  await expect(files).toHaveCSS("padding-inline-start","0px");
  await expect(files.locator(".flood-file-meta").first()).toContainText("2.4 MB");
  await expect(files.locator(".flood-file-meta.flood-badge")).toHaveCount(0);
  await expect(files.getByRole("button",{name:"Preview: Brand guidelines.pdf"})).toBeVisible();
  await expect(files.getByRole("button",{name:"Remove: Brand guidelines.pdf"})).toBeVisible();
  await files.screenshot({path:info.outputPath("file-list-plain.png")});
});

test("a file download uses a named native icon link and preserves the filename", async ({page}, info) => {
  await page.goto("/components/file-item");
  await page.getByRole("checkbox", {name:"FileItem prop showDownload"}).check();
  const row = page.locator(".preview-stage .flood-file-item");
  const download = row.getByRole("link", {name:"Download: Flood mark.png"});
  const preview = row.getByRole("button", {name:"Preview: Flood mark.png"});
  await expect(download).toHaveAttribute("download", "Flood mark.png");
  const [linkBox, buttonBox] = await Promise.all([download.boundingBox(), preview.boundingBox()]);
  expect(linkBox!.width).toBeCloseTo(buttonBox!.width);
  expect(linkBox!.height).toBeCloseTo(buttonBox!.height);
  await preview.focus();
  await preview.press("Tab");
  await expect(download).toBeFocused();
  await row.screenshot({path:info.outputPath("file-download-focus.png")});
  const [file] = await Promise.all([page.waitForEvent("download"), download.press("Enter")]);
  expect(file.suggestedFilename()).toEqual("Flood mark.png");
  await page.getByRole("checkbox", {name:"FileItem prop disabled"}).check();
  await expect(download).toHaveCount(0);
  await expect(preview).toBeDisabled();
});

test("IconLink navigates from its native keyboard focus", async ({page}, info) => {
  await page.goto("/components/icon-link");
  const link = page.locator(".preview-stage").getByRole("link", {name:"Read the installation guide"});
  await link.focus();
  await expect(link).toBeFocused();
  await link.screenshot({path:info.outputPath("icon-link-focus.png")});
  await link.press("Enter");
  await expect(page).toHaveURL(/\/docs\/installation$/);
});

test("resumable uploads preserve progress and keyboard position, then report processing separately", async ({page}, info) => {
  await page.goto("/components/upload-item");
  await page.getByRole("checkbox", {name:"UploadItem prop allowPause"}).check();
  const row = page.locator(".preview-stage .flood-upload-item");
  const pause = row.getByRole("button",{name:/^Pause upload:/});
  const resume = row.getByRole("button",{name:/^Resume upload:/});
  const cancel = row.getByRole("button",{name:/^Cancel upload:/});
  const progress = row.getByRole("progressbar");
  await page.evaluate(()=>document.fonts.ready);
  const cancelBefore = await cancel.boundingBox();
  await row.screenshot({path:info.outputPath("upload-transferring.png")});
  await pause.focus();
  await pause.press("Enter");
  await expect(resume).toBeFocused();
  await expect(row.getByText("Paused · 45%")).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow","45");
  await expect(progress.locator(".flood-indicator__fill")).toHaveCSS("animation-name","none");
  expect(await cancel.boundingBox()).toEqual(cancelBefore);
  await resume.blur();
  await row.screenshot({path:info.outputPath("upload-paused.png")});
  await resume.press("Enter");
  await expect(pause).toBeFocused();
  await expect(progress).toHaveAttribute("aria-valuenow","45");
  const select = page.getByRole("combobox",{name:"UploadItem prop state"});
  if (await select.isVisible()) await chooseSelectOption(select,"processing");
  else await chooseStudioSheetOption(page,"State","processing");
  await expect(progress).toHaveAccessibleName("Processing: Brand guidelines.pdf");
  await expect(progress).not.toHaveAttribute("aria-valuenow");
  await expect(pause).toHaveCount(0);
  await expect(row.getByRole("button",{name:/^Remove:/})).toHaveCount(0);
  await expect(cancel).toBeVisible();
  await row.screenshot({path:info.outputPath("upload-processing.png")});
  if (await select.isVisible()) await chooseSelectOption(select,"paused");
  else await chooseStudioSheetOption(page,"State","paused");
  const progressSelect = page.getByRole("combobox",{name:"UploadItem prop progress"});
  if (await progressSelect.isVisible()) await chooseSelectOption(progressSelect,"unknown");
  else await chooseStudioSheetOption(page,"Progress","unknown");
  await expect(row.getByText("Paused",{exact:true})).toBeVisible();
  await expect(progress).toHaveCount(0);
});

test("FileName preserves the extension and discloses the full name from the existing link", async ({page}) => {
  await page.goto("/components/file-name");
  const name = "Flood-brand-mark-original-transparent-background.png";
  const root = page.locator(".preview-stage .flood-file-name");
  await chooseSelectOption(page.getByRole("combobox", {name:"FileName prop overflow"}), "truncate");
  const line = root.locator(".flood-file-name__line");
  const suffix = line.getByText(".png", {exact:true});
  await expect(line).toHaveAttribute("tabindex", "0");
  await expect(suffix).toBeVisible();
  await line.focus();
  await expect(root.getByRole("tooltip")).toHaveText(name);
  await line.press("Escape");
  await expect(root.getByRole("tooltip")).toBeHidden();
  await page.getByRole("checkbox", {name:"FileName prop linked"}).check();
  const link = root.getByRole("link", {name, exact:true});
  await expect(link).toHaveAttribute("download", name);
  await expect(link).not.toHaveAttribute("tabindex");
  await link.focus();
  await expect(root.getByRole("tooltip")).toHaveText(name);
});

test("the upload row keeps progress and cancel beside a compact file name", async ({page}) => {
  await page.goto("/components/upload-item");
  await page.getByRole("checkbox", {name:"UploadItem prop longName"}).check();
  const row = page.locator(".preview-stage .flood-upload-item");
  const cancel = row.getByRole("button", {name:/Cancel upload:/});
  const before = (await row.boundingBox())!.height;
  await chooseSelectOption(page.getByRole("combobox", {name:"UploadItem prop nameOverflow"}), "truncate");
  const line = row.locator(".flood-file-name__line");
  await expect(line.getByText(".pdf", {exact:true})).toBeVisible();
  await expect(row.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
  await expect(cancel).toBeVisible();
  expect((await row.boundingBox())!.height).toBeLessThan(before);
  const [name, action, body] = await Promise.all([line.boundingBox(),cancel.boundingBox(),row.boundingBox()]);
  expect(name!.x + name!.width).toBeLessThan(action!.x);
  expect(await row.evaluate(node=>node.scrollWidth)).toBeLessThanOrEqual(body!.width + 1);
});
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));const directory=resolve(`.artifacts/file-records-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,FileMeta,FileList,FileItem,UploadList,UploadItem,ImagePreview,Button,Checkbox}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[state,S]=useState('uploading'),[removed,R]=useState(false),[disabled,D]=useState(false),[unknown,U]=useState(false),[count,C]=useState(0),[missing,M]=useState(false);return h(FloodRoot,null,h('h1',null,'File records'),
h(FileList,{label:'Attachments'},h(FileItem,{id:'simple',name:'Empty.txt',size:0}),h(FileItem,{name:'Attachment-with-a-very-long-file-name-that-needs-to-wrap-properly-in-narrow-layouts.pdf',size:2400000,mimeType:'PDF',onPreview:()=>C(x=>x+1),onRemove:()=>R(true),hidden:removed,disabled}),h(FileItem,{id:'bare',name:'Bare.txt'})),
h(UploadList,{label:'Uploads'},h(UploadItem,{name:'Cover.png',size:850000,state,progress:unknown?undefined:45,error:'Connection interrupted',disabled,downloadHref:'/test-image.svg',onCancel:()=>S('cancelled'),onRetry:()=>S('uploading'),onRemove:()=>S('queued'),onPreview:()=>C(x=>x+1)})),
h(ImagePreview,{title:'Cover preview',src:missing?'/missing-image.svg':'/test-image.svg',alt:'Preview artwork',zoomable:true,caption:'Project artwork',trigger:props=>h(Button,props,'View image')}),
h(Button,{onClick:()=>S('error')},'Fail upload'),h(Button,{onClick:()=>S('success')},'Complete upload'),h(Button,{onClick:()=>M(true)},'Missing image'),h(Checkbox,{label:'Disable actions',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Unknown progress',checked:unknown,onChange:e=>U(e.currentTarget.checked)}),h('div',{id:'metas'},h(FileMeta,{id:'both',format:'PDF',size:2400000,lang:'en'}),h(FileMeta,{id:'format-only',format:'SVG'}),h(FileMeta,{id:'size-only',size:0,lang:'en'}),h(FileMeta,{id:'no-meta'})),h('output',{'aria-label':'Invocations'},count));}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"FileRecords"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>File records</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:34rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__file-records.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto("/__file-records.html");}
test("File rows keep list semantics, omit absent slots and invoke independent actions",async({page})=>{
  await open(page);const list=page.getByRole("list",{name:"Attachments"});await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(page.locator("#simple")).toContainText("0 B");await expect(page.locator("#bare .flood-data-list-item__description")).toHaveCount(0);await expect(page.locator("#bare .flood-data-list-item__trailing")).toHaveCount(0);
  await list.getByRole("button",{name:/^Preview:/}).click();await expect(page.getByLabel("Invocations")).toHaveText("1");
  await list.getByRole("button",{name:/^Remove:/}).click();await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.evaluate(()=>document.documentElement.style.fontSize="20px");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test("UploadItem exposes applicable actions and determinate or unknown progress",async({page})=>{
  await open(page);const list=page.getByRole("list",{name:"Uploads"});const progress=list.getByRole("progressbar");await expect(progress).toHaveAttribute("aria-valuenow","45");
  await expect(list.locator('.flood-status-indicator__dot')).toBeVisible();
  const statusBox=(await list.locator('.flood-status-indicator').boundingBox())!,barBox=(await progress.boundingBox())!;
  const nameBox=(await list.locator('.flood-file-item__name').boundingBox())!;
  const download = list.getByRole("link", {name:"Download: Cover.png"});
  await expect(download).toHaveCount(0);
  expect(statusBox.x).toBeCloseTo(nameBox.x,1);
  expect(barBox.x).toBeGreaterThan(statusBox.x+statusBox.width);
  expect(barBox.width).toBeGreaterThan(8);
  expect(barBox.y+barBox.height/2).toBeCloseTo(statusBox.y+statusBox.height/2,0);
  await expect(list.getByRole("button",{name:/^Remove:/})).toHaveCount(0);await expect(list.getByRole("button",{name:/^Retry upload:/})).toHaveCount(0);
  await page.getByRole("checkbox",{name:"Unknown progress"}).check();await expect(progress).not.toHaveAttribute("aria-valuenow");
  await list.getByRole("button",{name:/^Cancel upload:/}).click();await expect(progress).toHaveCount(0);await expect(list).toContainText("Cancelled");
  await list.getByRole("button",{name:/^Retry upload:/}).click();await expect(progress).toBeVisible();
  await page.getByRole("button",{name:"Fail upload",exact:true}).click();await expect(list).toContainText("Connection interrupted");await expect(list.getByRole("button",{name:/^Cancel upload:/})).toHaveCount(0);
  await page.getByRole("button",{name:"Complete upload",exact:true}).click();await expect(list).toContainText("Uploaded");await expect(list.getByRole("button",{name:/^Preview:/})).toBeVisible();
  await expect(download).toHaveAttribute("download", "Cover.png");
});
test("Disabled file and upload actions do not invoke callbacks",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Disable actions"}).check();
  await expect(page.getByRole("list",{name:"Attachments"}).getByRole("button",{name:/^Preview:/})).toBeDisabled();
  await expect(page.getByRole("button",{name:/^Cancel upload:/})).toBeDisabled();await expect(page.getByLabel("Invocations")).toHaveText("0");
});
test("ImagePreview loads lazily, keeps the frame stable and scrolls at actual size",async({page})=>{
  let requests=0,release:()=>void=()=>{};const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/test-image.svg",async route=>{requests++;await held;await route.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="pink"/></svg>'});});
  await open(page);expect(requests).toBe(0);const trigger=page.getByRole("button",{name:"View image",exact:true});await trigger.click();
  const dialog=page.getByRole("dialog",{name:"Cover preview"});
  const media=dialog.locator(".flood-image-preview__media");
  const toggle=dialog.getByRole("button",{name:"Actual size"});
  const image=dialog.getByRole("img",{name:"Preview artwork"});
  const frame=()=>media.evaluate(node=>[node.clientWidth,node.clientHeight]);
  await expect(dialog.getByRole("status")).toBeVisible();
  await expect(toggle).toBeDisabled();
  await expect.poll(()=>requests).toBe(1);
  const before=await frame();
  release();
  await expect(media).toHaveAttribute("data-state","loaded");
  expect(await frame()).toEqual(before);
  expect((await image.boundingBox())!.width).toBeLessThanOrEqual(before[0]);
  await toggle.focus();
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed","true");
  await expect(toggle).toBeFocused();
  expect(await image.evaluate(node=>node.clientWidth)).toBe(1200);
  expect(await frame()).toEqual(before);
  const viewport=dialog.getByRole("region",{name:"Image at actual size"});
  await expect(viewport).toHaveAttribute("data-scrollbars","overlay");
  await expect(viewport.locator("..").locator(".flood-scroll-area__track")).toHaveCount(2);
  await page.keyboard.press("Tab");
  await expect(viewport).toBeFocused();
  const offset=()=>viewport.evaluate(node=>[node.scrollLeft,node.scrollTop]);
  const [left,top]=await offset();
  const [centerX,centerY]=await viewport.evaluate(node=>[(node.scrollWidth-node.clientWidth)/2,(node.scrollHeight-node.clientHeight)/2]);
  expect(left).toBeCloseTo(centerX,0);
  expect(top).toBeCloseTo(centerY,0);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect.poll(async()=>{const [x,y]=await offset();return Math.min(x-left,y-top);}).toBeGreaterThan(0);
  await expect(dialog.getByRole("button",{name:"Close",exact:true})).toBeInViewport();
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed","false");
  await expect(viewport).toHaveCount(0);
  expect(await frame()).toEqual(before);
  expect(requests).toBe(1);
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
});
test("ImagePreview shows failure feedback instead of a broken image",async({page})=>{
  await page.route("**/missing-image.svg",route=>route.fulfill({status:404,body:"missing"}));await open(page);await page.getByRole("button",{name:"Missing image",exact:true}).click();await page.getByRole("button",{name:"View image",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Cover preview"});await expect(dialog.getByText("Could not load the image.",{exact:true})).toBeVisible();await expect(dialog.getByRole("img")).toHaveCount(0);
});

test("FileMeta combines format and size without empty separators and shares the filename row",async({page})=>{
 await open(page);await expect(page.locator('#both')).toContainText('PDF');await expect(page.locator('#both')).toContainText('2.4 MB');
 await expect(page.locator('#format-only')).toHaveText('SVG');await expect(page.locator('#size-only')).toHaveText('0 B');await expect(page.locator('#no-meta')).toHaveCount(0);
 const name=(await page.locator('#simple .flood-file-item__name').boundingBox())!,chip=(await page.locator('#simple .flood-file-meta').boundingBox())!;
 expect(chip.x).toBeGreaterThan(name.x+name.width);expect(chip.y).toBeLessThan(name.y+name.height);await expect(page.locator('#simple .flood-data-list-item__description')).toHaveCount(0);
});

test('file records keep full text, metadata and actions inside a constrained host at enlarged RTL text',async({page})=>{
 await open(page);
 for(const direction of ['ltr','rtl'])for(const font of [16,32]){
  await page.setViewportSize({width:960,height:900});
  await page.evaluate(({direction,font})=>{document.documentElement.dir=direction;document.documentElement.style.fontSize=font+'px';for(const list of document.querySelectorAll<HTMLElement>('.flood-file-list'))list.style.inlineSize='min(100%, 224px)';},{direction,font});
  for(const label of ['Attachments','Uploads']){
   const list=page.getByRole('list',{name:label,exact:true});
   const overflow=await list.evaluate(root=>{
    const outer=root.getBoundingClientRect(),bad:string[]=[];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;
    while((node=walker.nextNode())){
     if(!node.textContent?.trim())continue;
     let hidden=false;
     for(let owner=node.parentElement;owner&&owner!==root;owner=owner.parentElement){const css=getComputedStyle(owner),box=owner.getBoundingClientRect();if(css.display==='none'||css.visibility==='hidden'||(css.clipPath==='inset(50%)'&&box.width<=1&&box.height<=1)){hidden=true;break;}}
     if(hidden)continue;
     const range=document.createRange();range.selectNodeContents(node);for(const rect of range.getClientRects())if(rect.width&&(rect.left<outer.left-1||rect.right>outer.right+1))bad.push(node.textContent);
    }
    return bad;
   });
   expect(overflow,`${label}, ${direction}, root ${font}px: painted text crosses the container`).toEqual([]);
   const actions=list.getByRole('button');
   for(let i=0;i<await actions.count();i++){
    const action=actions.nth(i);await action.focus();await action.scrollIntoViewIfNeeded();
    const outer=(await list.boundingBox())!,box=(await action.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(outer.x-1);expect(box.x+box.width).toBeLessThanOrEqual(outer.x+outer.width+1);
   }
  }
  await expect(page.getByRole('list',{name:'Uploads',exact:true}).getByRole('progressbar')).toBeVisible();
  await expect(page.getByRole('list',{name:'Uploads',exact:true}).locator('.flood-status-indicator__dot')).toBeVisible();
 }
 const attachments=page.getByRole('list',{name:'Attachments',exact:true});
 await attachments.getByRole('button',{name:/^Remove:/}).click();
 await expect(attachments.locator('.flood-file-item[hidden]')).toBeHidden();
 await expect(attachments.getByRole('listitem')).toHaveCount(2);
});

test('upload progress stays beside a short status and reflows below a long status', async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto('/components/upload-list');
  await page.getByRole('checkbox',{name:'UploadList prop narrow'}).check();
  const row = page.getByRole('list',{name:'Uploads',exact:true}).locator('[data-upload-state="uploading"]');
  const status = row.locator('.flood-status-indicator');
  const progress = row.locator('.flood-indicator');
  const action = row.getByRole('button',{name:/^Cancel upload:/});
  const [shortLabel,shortTrack,media,title,button,bounds] = await Promise.all([
    status.boundingBox(),progress.boundingBox(),row.locator('.flood-data-list-item__media').boundingBox(),
    row.locator('.flood-data-list-item__title').boundingBox(),action.boundingBox(),row.boundingBox(),
  ]);
  expect(shortTrack!.width).toBeGreaterThanOrEqual(64);
  expect(shortTrack!.y + shortTrack!.height / 2).toBeCloseTo(shortLabel!.y + shortLabel!.height / 2,0);
  expect(media!.y).toBeCloseTo(title!.y,0);
  expect(button!.x + button!.width).toBeCloseTo(bounds!.x + bounds!.width,0);
  await page.getByRole('checkbox',{name:'UploadList prop longStatus'}).check();
  const [longLabel,longTrack] = await Promise.all([status.boundingBox(),progress.boundingBox()]);
  expect(longTrack!.y).toBeGreaterThan(longLabel!.y + longLabel!.height);
  expect(longTrack!.width).toBeGreaterThan(shortTrack!.width);
  await action.press('Enter');
  await expect(page.getByRole('button',{name:/^Retry upload:/}).first()).toBeFocused();
});
test("ImageGallery switches sources in the same frame and keeps navigation focused", async ({page}, info) => {
  await page.goto("/components/image-gallery");
  await page.getByRole("checkbox",{name:"ImageGallery prop missingImage"}).check();
  const opener = page.getByRole("button",{name:"View images"});
  const requests: string[] = [];
  page.on("request",request=>{if (request.resourceType()==="image") requests.push(new URL(request.url()).pathname);});
  await opener.click();
  const dialog = page.getByRole("dialog",{name:"Flood assets"});
  const next = dialog.getByRole("button",{name:"Next image"});
  const frame = dialog.locator(".flood-image-preview__media");
  await expect(frame).toHaveAttribute("data-state","loaded");
  await expect(dialog.getByRole("img",{name:"Pink Flood mark"})).toBeVisible();
  expect(requests).not.toContain("/charts-share.png");
  const frameSize = await frame.boundingBox();
  await page.evaluate(()=>document.fonts.ready);
  await dialog.screenshot({path:info.outputPath("image-gallery-ready.png")});
  await next.press("Enter");
  await expect(dialog.getByRole("img",{name:"Flood chart examples"})).toBeVisible();
  await expect(next).toBeFocused();
  await expect(dialog.getByRole("navigation",{name:"Images"})).toContainText("2 / 3");
  await next.press("ArrowRight");
  await expect(dialog.getByText("Could not load the image.")).toBeVisible();
  expect((await frame.boundingBox())!.height).toBeCloseTo(frameSize!.height,1);
  await expect(next).toBeFocused();
  await dialog.screenshot({path:info.outputPath("image-gallery-unavailable.png")});
  await next.press("Enter");
  await expect(dialog.getByRole("img",{name:"Pink Flood mark"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("ImageGallery thumbnails scroll independently and only open on activation", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/components/image-gallery");
  await chooseSelectOption(page.getByRole("combobox",{name:"ImageGallery prop navigation"}),"thumbnails");
  await page.getByRole("checkbox",{name:"ImageGallery prop missingImage"}).check();
  await page.setViewportSize({width:350,height:844});
  await page.getByRole("button",{name:"View images"}).click();
  const dialog = page.getByRole("dialog",{name:"Flood assets"});
  const toolbar = dialog.getByRole("toolbar",{name:"Images"});
  const first = toolbar.getByRole("button",{name:"Pink Flood mark"});
  const last = toolbar.getByRole("button",{name:"Flood workspace illustration"});
  const rail = dialog.locator(".flood-image-gallery__thumbnails");
  const media = dialog.locator(".flood-image-preview__media");
  await expect(first).toHaveAttribute("aria-pressed","true");
  await expect(media).toHaveAttribute("data-state","loaded");
  const size = (await media.boundingBox())!;
  await expect.poll(()=>rail.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeGreaterThan(0);
  await first.press("End");
  await expect(last).toBeFocused();
  await expect(first).toHaveAttribute("aria-pressed","true");
  await expect.poll(()=>rail.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);
  await last.press("Enter");
  await expect(last).toHaveAttribute("aria-pressed","true");
  await expect(media).toHaveAttribute("data-state","error");
  expect((await media.boundingBox())!.width).toBeCloseTo(size.width,1);
  expect((await media.boundingBox())!.height).toBeCloseTo(size.height,1);
  await dialog.screenshot({path:info.outputPath("gallery-thumbnail-rail-narrow.png")});
  await last.press("Home");
  await expect(first).toBeFocused();
  await first.click();
  await expect(media).toHaveAttribute("data-state","loaded");
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>document.fonts.ready);
  await dialog.screenshot({path:info.outputPath("gallery-thumbnail-rail.png")});
});
