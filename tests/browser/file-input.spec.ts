import {test,expect} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let bundle:Promise<string>;
async function fixture(){
 const file=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/'));const directory=resolve(`.artifacts/file-input-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.mjs');
 await writeFile(entry,`import React,{useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,FileInput,Field,Button}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;function App(){const[changes,C]=useState(''),[submitted,S]=useState('');return h(FloodRoot,null,h('h1',null,'File selection'),h('form',{id:'upload',onSubmit:e=>{e.preventDefault();S(Array.from(new FormData(e.currentTarget).getAll('files'),f=>f.name).join('|'))}},h(Field,{label:'Documents',id:'documents'},p=>h(FileInput,{...p,name:'files',multiple:true,required:true,onFilesChange:files=>C(files.map(f=>f.name).join('|'))})),h(Button,{type:'submit'},'Submit'),h(Button,{type:'reset'},'Reset')),h('fieldset',{disabled:true},h('legend',null,'Unavailable'),h(Field,{label:'Disabled files'},p=>h(FileInput,{...p}))),h('output',{'aria-label':'Changes'},changes),h('output',{'aria-label':'Submitted'},submitted));}createRoot(document.getElementById('app')).render(h(App));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Fixture'}}});const output=Array.isArray(result)?result[0].output:result.output;return '<!doctype html><html lang="en"><title>File selection</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
const documents=[{name:'design-notes.txt',mimeType:'text/plain',buffer:Buffer.from('Notes')},{name:'tokens.json',mimeType:'application/json',buffer:Buffer.from('{}')}];

test("FileDropTarget delivers native picks and file drops without retaining a form selection", async ({page}, info) => {
  await page.goto("/components/file-drop-target");
  const target = page.locator(".preview-stage").getByRole("group",{name:"Import files"});
  const choose = target.getByRole("button",{name:"Choose files"});
  const feedback = page.locator(".workbench-feedback");
  const [picker] = await Promise.all([page.waitForEvent("filechooser"), choose.press("Enter")]);
  await picker.setFiles(documents[0]);
  await expect(feedback).toHaveText("design-notes.txt");
  await expect(target.locator('input[type="file"]')).toHaveValue("");
  await target.screenshot({path:info.outputPath("file-drop-target-ready.png")});

  const drag = (type:string, file:string, child = false) => target.evaluate((node,{type,file,child}) => {
    const data = new DataTransfer();
    if (file) data.items.add(new File(["content"],file,{type:"text/plain"}));
    else data.setData("text/plain","text only");
    return !(child ? node.querySelector("button")! : node).dispatchEvent(new DragEvent(type,{dataTransfer:data,bubbles:true,cancelable:true}));
  },{type,file,child});
  expect(await drag("dragenter","")).toBe(false);
  await expect(target).not.toHaveAttribute("data-dragging");
  expect(await drag("dragenter","drop.txt")).toBe(true);
  await drag("dragenter","drop.txt",true);
  await drag("dragleave","drop.txt",true);
  await expect(target).toHaveAttribute("data-dragging","true");
  await target.screenshot({path:info.outputPath("file-drop-target-dragging.png")});
  expect(await drag("drop","drop.txt")).toBe(true);
  await expect(feedback).toHaveText("drop.txt");
  await expect(target).not.toHaveAttribute("data-dragging");
  await expect(target.locator('input[type="file"]')).toHaveValue("");

  await page.getByRole("checkbox",{name:"FileDropTarget prop disabled",exact:true}).check();
  await expect(choose).toBeDisabled();
  expect(await drag("drop","ignored.txt")).toBe(true);
  await expect(feedback.filter({hasText:"ignored.txt"})).toHaveCount(0);

  await page.getByRole("checkbox",{name:"FileDropTarget prop disabled",exact:true}).uncheck();
  await page.getByRole("checkbox",{name:"FileDropTarget prop multiple",exact:true}).uncheck();
  await target.evaluate(node => {
    const data = new DataTransfer();
    for (const name of ["first.txt","second.txt"]) data.items.add(new File(["content"],name));
    node.dispatchEvent(new DragEvent("drop",{dataTransfer:data,bubbles:true,cancelable:true}));
  });
  await expect(feedback).toHaveText("first.txt");
});

test("FileTrigger delivers each native pick and the composer uses it for attachments", async ({page}) => {
  await page.goto("/components/file-trigger");
  const stage = page.locator(".preview-stage");
  const attach = stage.getByRole("button", {name:"Attach files", exact:true});
  const [first] = await Promise.all([page.waitForEvent("filechooser"), attach.press("Enter")]);
  await first.setFiles(documents);
  await expect(page.locator(".workbench-feedback")).toHaveText("design-notes.txt, tokens.json");
  await expect(stage.locator('input[type="file"]')).toHaveValue("");
  const [second] = await Promise.all([page.waitForEvent("filechooser"), attach.click()]);
  await second.setFiles(documents[0]);
  await expect(page.locator(".workbench-feedback")).toHaveText("design-notes.txt");
  await expect(stage.locator('input[type="file"]')).toHaveValue("");

  await page.goto("/components/message-composer");
  await page.getByRole("checkbox", {name:"MessageComposer prop allowAttachments"}).check();
  const composer = stage.locator(".flood-message-composer");
  const [composerPicker] = await Promise.all([
    page.waitForEvent("filechooser"),
    composer.getByRole("button", {name:"Attach files"}).click(),
  ]);
  const longName = "Quarterly-review-attachment-with-a-long-name-and-no-spaces.pdf";
  await composerPicker.setFiles([...documents, {name:longName,mimeType:"application/pdf",buffer:Buffer.from("Review")}]);
  const attachments = composer.getByRole("list", {name:"Attachments"});
  const editor = composer.getByRole("textbox", {name:"Message"});
  const send = composer.getByRole("button", {name:"Send message"});
  const more = attachments.getByRole("button", {name:"Show 1 more"});
  await expect(attachments.getByText("design-notes.txt")).toBeVisible();
  await expect(attachments.getByText(longName)).toHaveCount(0);
  await expect(send).toBeEnabled();
  await editor.fill("Please review the attachments.");
  await more.click();
  await expect(attachments.getByText(longName)).toBeVisible();
  await expect(editor).toHaveValue("Please review the attachments.");
  await attachments.getByRole("button", {name:"Show fewer"}).click();
  await expect(attachments.getByText(longName)).toHaveCount(0);
  await attachments.getByRole("button", {name:"Remove design-notes.txt"}).click();
  await expect(editor).toBeFocused();
  await expect(attachments.getByText(longName)).toBeVisible();
  await expect(attachments.getByText("design-notes.txt")).toHaveCount(0);
});

test("AvatarPicker replaces and removes a selected image, with failed selection preserving the preview", async ({page}) => {
  await page.goto("/components/avatar-picker");
  const picker = page.getByRole("group", {name:"Profile photo", exact:true});
  const choose = picker.getByRole("button", {name:"Change photo"});
  const [dialog] = await Promise.all([page.waitForEvent("filechooser"), choose.click()]);
  await dialog.setFiles(documents[0]);
  await expect(picker.getByRole("alert")).toHaveText("Choose an image file.");
  const image = picker.locator(".flood-avatar__image");
  await expect(image).toHaveAttribute("src", "/avatar-demo.svg");
  const photo = {name:"photo.svg", mimeType:"image/svg+xml", buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#7c5899"/></svg>')};
  const [replacement] = await Promise.all([page.waitForEvent("filechooser"), choose.click()]);
  await replacement.setFiles(photo);
  await expect(image).toHaveAttribute("src", /^blob:/);
  await expect(image).toHaveAttribute("data-ready", "true");
  await expect(picker.getByRole("alert")).toHaveCount(0);
  const previousUrl = (await image.getAttribute("src"))!;

  const remove = picker.getByRole("button", {name:"Remove photo"});
  await remove.press("Enter");
  await expect(remove).toHaveCount(0);
  await expect(picker.getByRole("button", {name:"Choose photo"})).toBeFocused();
  await expect(picker.getByRole("img", {name:"Alex Morgan"})).toHaveText("AM");
  await expect.poll(() => page.evaluate(async url => fetch(url).then(() => false, () => true), previousUrl)).toBe(true);

  await page.getByRole("checkbox", {name:"AvatarPicker prop busy"}).check();
  await expect(picker.getByRole("button", {name:"Choose photo"})).toBeDisabled();
  await expect(picker).toHaveAttribute("aria-busy", "true");
});

test('FileInput submits actual files, clears once, resets, and keeps native validity',async({page})=>{
 bundle??=fixture();await page.route('**/__file-input.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__file-input.html');const input=page.getByLabel('Documents',{exact:true});
 expect(await input.evaluate((n:HTMLInputElement)=>n.checkValidity())).toBe(false);await input.setInputFiles(documents[0]);await input.setInputFiles(documents[1]);await input.evaluate((node:HTMLInputElement)=>{const transfer=new DataTransfer();transfer.items.add(node.files![0]);node.files=transfer.files;node.dispatchEvent(new Event('change',{bubbles:true}));});await expect(page.getByRole('status',{name:'Changes'})).toHaveText('design-notes.txt|tokens.json');await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('status',{name:'Submitted'})).toHaveText('design-notes.txt|tokens.json');await page.getByRole('button',{name:'Clear files',exact:true}).click();await expect(input).toBeFocused();await expect(page.getByRole('status',{name:'Changes'})).toHaveText('');expect(await input.evaluate((n:HTMLInputElement)=>n.files!.length)).toBe(0);await input.setInputFiles(documents);await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.flood-file-input__summary').first()).toHaveText('Choose files');expect(await input.evaluate((n:HTMLInputElement)=>n.files!.length)).toBe(0);await expect(page.getByLabel('Disabled files')).toBeDisabled();
 // The real focusable input opens the chooser; cancelling does not clear selection.
 await input.setInputFiles(documents);const chooser=page.waitForEvent('filechooser');await input.press('Space');await chooser;await input.dispatchEvent('cancel');await expect(page.locator('.flood-file-input__summary').first()).toHaveText('Selected files (2)');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
test('FileInput catalog handles long names, RTL, enlarged text and stable preview',async({page})=>{
 await page.goto('/components/file-input');const stage=page.locator('.preview-stage'),input=stage.getByLabel('Attachments',{exact:true});await expect(input).toBeAttached();await page.screenshot({path:'.artifacts/file-input-default.png'});const before=await stage.boundingBox();await input.setInputFiles(documents);await expect(stage.locator('.flood-file-input__summary')).toHaveText('Selected files (2)');expect((await stage.boundingBox())!.height).toBe(before!.height);await expect(stage.locator('.flood-file-input__name')).toHaveText(['design-notes.txt','tokens.json']);await stage.screenshot({path:'.artifacts/file-input-multiple-two.png'});const inputY=(await input.boundingBox())!.y;await stage.locator('summary').click();await expect(stage.locator('.flood-file-input__name').first()).not.toBeVisible();expect((await input.boundingBox())!.y).toBe(inputY);await stage.locator('summary').click();await stage.getByRole('button',{name:'Remove file design-notes.txt'}).click();await expect(stage.locator('.flood-file-input__name')).toHaveText(['tokens.json']);await expect(stage.getByRole('button',{name:'Remove file tokens.json'})).toBeFocused();expect(await input.evaluate((n:HTMLInputElement)=>Array.from(n.files!,f=>f.name))).toEqual(['tokens.json']);await stage.screenshot({path:'.artifacts/file-input-multiple.png'});await stage.getByRole('button',{name:'Clear files'}).click();await input.setInputFiles([{name:'A-very-long-project-attachment-name-that-should-remain-inside-its-container.pdf',mimeType:'application/pdf',buffer:Buffer.from('preview')}]);await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const sizes=await stage.locator('.flood-file-input').evaluate(node=>{const input=node.querySelector('input')!.getBoundingClientRect(),action=node.querySelector('button')!.getBoundingClientRect(),outer=node.getBoundingClientRect();return{inputLeft:input.left,inputRight:input.right,actionLeft:action.left,actionRight:action.right,left:outer.left,right:outer.right}});expect(sizes.inputLeft).toBeGreaterThanOrEqual(sizes.actionRight);expect(sizes.actionLeft).toBeGreaterThanOrEqual(sizes.left);expect(sizes.inputRight).toBeLessThanOrEqual(sizes.right);await stage.scrollIntoViewIfNeeded();await page.screenshot({path:'.artifacts/file-input-rtl.png'});
});
