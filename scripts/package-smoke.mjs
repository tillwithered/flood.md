import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { initProject, doctor } from "../packages/cli/lib/index.mjs";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run test:packages.");
function npm(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
await mkdir(".artifacts", { recursive: true });
const archives = [];
for (const name of ["tokens", "react", "agent", "cli"]) {
  const [packed] = JSON.parse(
    npm([
      "pack",
      `./packages/${name}`,
      "--pack-destination",
      ".artifacts",
      "--json",
    ]),
  );
  assert.ok(packed.files.some((file) => file.path === "LICENSE"));
  if (name === "react") {
    for (const path of ["dist/foundations.css", "dist/fonts/InterVariable.woff2", "dist/fonts/LICENSE.txt"])
      assert.ok(packed.files.some((file) => file.path === path), `Missing ${path}`);
  }
  archives.push(resolve(".artifacts", packed.filename));
}
const root = await mkdtemp(join(tmpdir(), "flood-consumer-"));
try {
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "clean-flood-consumer",
      private: true,
      type: "module",
      dependencies: { react: "19.3.1", "react-dom": "19.3.1" },
      devDependencies: { "@types/react": "19.3.0", "@types/react-dom": "19.3.0" },
    }),
  );
  await initProject(root, {
    installer: () =>
      npm(
        ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...archives],
        root,
      ),
  });
  await doctor(root);
  await writeFile(
    join(root, "check.mjs"),
    `import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {Button} from '@flood-md/react'; import {tokenNames} from '@flood-md/tokens/foundations'; import {readFileSync} from 'node:fs'; if(!renderToStaticMarkup(createElement(Button,null,'Ready')).includes('Ready')) throw Error('render failed'); const css=readFileSync(new URL(import.meta.resolve('@flood-md/react/styles.css')),'utf8'); if(!css.includes('@flood-md/tokens/tokens.css')) throw Error('missing token import'); if(tokenNames['sys.color.content.default']!=='--flood-sys-color-content-default') throw Error('foundation import failed'); for(const name of ['foundations.css','foundations.manifest.json','neutral.dark.tokens.json']) readFileSync(new URL(import.meta.resolve('@flood-md/tokens/'+name)));`,
  );
  const result = spawnSync(process.execPath, ["check.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  await writeFile(
    join(root, "foundation-types.mts"),
    `import { tokenNames, type TokenName } from '@flood-md/tokens/foundations';
const name: TokenName = 'sys.color.content.default';
const css: '--flood-sys-color-content-default' = tokenNames[name];
import { createElement, createRef, type ComponentPropsWithRef } from 'react';
import { Tabs, Breadcrumb, Pagination, type TabsProps, type BreadcrumbProps, type PaginationProps, Tooltip, Popover, Dialog, type TooltipProps, type PopoverProps, type DialogProps, type OverlayTriggerProps, Collapsible, Accordion, type CollapsibleProps, type AccordionProps, SegmentedControl, type SegmentedControlProps, Toggle, ToggleGroup, type ToggleProps, type ToggleGroupProps, ButtonGroup, InputGroup, type ButtonGroupProps, type InputGroupProps, RadioGroup, CheckboxGroup, type RadioGroupProps, type CheckboxGroupProps, Label, Fieldset, type LabelProps, type FieldsetProps, ScrollArea, type ScrollAreaProps, Select, type SelectProps, type HeadingProps, type TextProps, type InputProps, type IconButtonProps, type CodeSnippetProps } from '@flood-md/react';
import { Menu, type MenuProps, DescriptionList, Table, type DescriptionListProps, type TableProps, Progress, Meter, Alert, type ProgressProps, type MeterProps, type AlertProps, Badge, Spinner, Skeleton, Avatar, type BadgeProps, type SpinnerProps, type SkeletonProps, type AvatarProps, Link, type LinkProps } from '@flood-md/react';
const actionMenu: MenuProps = {label:'Actions',trigger:props=>createElement('button',props,'Actions'),items:[{id:'open',label:'Open'},{id:'divider',type:'separator'},{id:'delete',label:'Delete',tone:'danger'}],onAction:id=>id satisfies string};
createElement(Menu,{...actionMenu,ref:createRef<HTMLDivElement>()});
// @ts-expect-error Action labels are required.
const badMenu: MenuProps = {...actionMenu,items:[{id:'open'}]};
const descriptions: DescriptionListProps = {items:[{id:'project',term:'Project',description:'Flood'}],layout:'inline',density:'compact',dividers:true};
const table: TableProps = {caption:'Projects',children:createElement('tbody',null,createElement('tr',null,createElement('td',null,'Flood'))),density:'comfortable',hideCaption:true};
createElement(DescriptionList,{...descriptions,ref:createRef<HTMLDListElement>()});
createElement(Table,{...table,ref:createRef<HTMLTableElement>(),onClick:event=>event.currentTarget.rows.length});
// @ts-expect-error Stable identity is required for description items.
const missingIdentity: DescriptionListProps = {items:[{term:'Project',description:'Flood'}]};
// @ts-expect-error Table requires its accessible caption.
const unnamedTable: TableProps = {children:null};
const taskProgress: ProgressProps = {label:'Upload',value:50,max:100,hideLabel:true};
const boundedMeter: MeterProps = {label:'Storage',value:10,min:-20,max:20,valueText:'10 GB'};
const inlineAlert: AlertProps = {title:'Saved',tone:'success',announcement:'polite',icon:null};
createElement(Progress,{...taskProgress,ref:createRef<HTMLDivElement>()});
createElement(Meter,{...boundedMeter,ref:createRef<HTMLDivElement>()});
createElement(Alert,{...inlineAlert,ref:createRef<HTMLDivElement>()});
// @ts-expect-error Meter requires a known value.
const unknownMeter: MeterProps = {label:'Storage'};
// @ts-expect-error Alert announcement must name a supported urgency.
const badAnnouncement: AlertProps = {announcement:'always'};
const badge: BadgeProps = {tone:'success',variant:'outline',size:'sm'};
const spinner: SpinnerProps = {label:'Loading',decorative:false,size:'lg'};
const skeleton: SkeletonProps = {shape:'circle',width:'2rem',height:'2rem',animate:false};
const avatar: AvatarProps = {name:'Alex Morgan',src:'/alex.png',fallback:'AM',decorative:true};
createElement(Badge,{...badge,ref:createRef<HTMLSpanElement>()});
createElement(Spinner,{...spinner,ref:createRef<HTMLSpanElement>()});
createElement(Skeleton,{...skeleton,ref:createRef<HTMLSpanElement>()});
createElement(Avatar,{...avatar,ref:createRef<HTMLSpanElement>()});
// @ts-expect-error Avatar requires an accessible identity even in a decorative composition.
const badAvatar: AvatarProps = {src:'/alex.png'};
// @ts-expect-error Skeleton is decorative and does not accept focusable child content.
const badSkeleton: SkeletonProps = {children:'Interactive'};
const navigationLink: LinkProps = {href:'/docs',variant:'subtle',size:'sm',target:'_blank',rel:'noopener'};
createElement(Link,{...navigationLink,ref:createRef<HTMLAnchorElement>()});
// @ts-expect-error Navigation has no button disabled contract.
const disabledLink: LinkProps = {href:'/docs',disabled:true};
const tabs: TabsProps = {label:'Sections',items:[{value:'a',label:'Alpha',content:'Content'}],value:'a',onValueChange:value=>value satisfies string};
const crumbs: BreadcrumbProps = {items:[{label:'Home',href:'/'},{label:'Current'}]};
const pages: PaginationProps = {page:1,pageCount:20,siblingCount:1,getHref:page=>'?page='+page,onPageChange:page=>page satisfies number};
createElement(Tabs,{...tabs,ref:createRef<HTMLDivElement>()});
createElement(Breadcrumb,{...crumbs,ref:createRef<HTMLElement>()});
createElement(Pagination,{...pages,ref:createRef<HTMLElement>()});
// @ts-expect-error Tabs selection is a single string.
const badTabs: TabsProps = {...tabs,value:['a']};
// @ts-expect-error Pagination has a bounded sibling window.
const badPages: PaginationProps = {...pages,siblingCount:10};
const overlayTrigger = (props: OverlayTriggerProps) => createElement('button',props,'Open');
const tooltip: TooltipProps = {content:'Help',trigger:overlayTrigger,side:'top'};
const popover: PopoverProps = {title:'Settings',trigger:overlayTrigger,open:true,onOpenChange:value=>value satisfies boolean};
const modal: DialogProps = {title:'Create',trigger:overlayTrigger,initialFocusRef:createRef<HTMLInputElement>()};
createElement(Tooltip,{...tooltip,ref:createRef<HTMLDivElement>()});
createElement(Popover,{...popover,ref:createRef<HTMLDivElement>()});
createElement(Dialog,{...modal,ref:createRef<HTMLDialogElement>()});
// @ts-expect-error Tooltip content is text, not interactive React elements.
const badTooltip: TooltipProps = {...tooltip,content:createElement('button',null,'Action')};
const disclosure: CollapsibleProps = {title:'Advanced',open:true,onOpenChange:value=>value satisfies boolean};
const accordion: AccordionProps = {label:'FAQ',items:[{value:'a',title:'Question',content:'Answer'}],value:['a'],headingLevel:2};
createElement(Collapsible,{...disclosure,ref:createRef<HTMLDivElement>()});
createElement(Accordion,{...accordion,ref:createRef<HTMLDivElement>()});
// @ts-expect-error Accordion uses an array even in single expansion mode.
const badAccordion: AccordionProps = {...accordion,value:'a'};
const segments: SegmentedControlProps = {label:'Time range',hideLabel:true,name:'period',value:'day',options:[{value:'day',label:'Day'}],onValueChange:value=>value satisfies string};
createElement(SegmentedControl,{...segments,ref:createRef<HTMLFieldSetElement>()});
// @ts-expect-error SegmentedControl owns one string value, not an array.
const badSegments: SegmentedControlProps = {...segments,value:['day']};
const toggleProps: ToggleProps = {pressed: true, iconOnly: true, 'aria-label': 'Bold', onPressedChange: value => value satisfies boolean};
const toggleGroupProps: ToggleGroupProps = {label: 'Formatting', selectionMode: 'single', value: ['bold'], options: [{value: 'bold', label: 'Bold'}], onValueChange: value => value satisfies string[]};
createElement(Toggle, {...toggleProps, ref: createRef<HTMLButtonElement>()});
createElement(ToggleGroup, {...toggleGroupProps, ref: createRef<HTMLDivElement>()});
// @ts-expect-error Toggle owns aria-pressed; use pressed.
const invalidToggle: ToggleProps = {'aria-pressed': true};
const actions: ButtonGroupProps = {label: 'Editing', orientation: 'vertical'};
const connectedField: InputGroupProps = {name: 'website', start: 'https://', type: 'url', required: true};
const actionsElement = createElement(ButtonGroup, {...actions, ref: createRef<HTMLDivElement>()});
const connectedFieldElement = createElement(InputGroup, {...connectedField, ref: createRef<HTMLInputElement>()});
// @ts-expect-error Adorned input supports text-like controls, not file pickers.
const fileGroup: InputGroupProps = {type: 'file'};
const radioGroup: RadioGroupProps = {name: 'visibility', legend: 'Visibility', hideLabel: true, options: [{value: 'private', label: 'Private'}], value: 'private', required: true};
const checkboxGroup: CheckboxGroupProps = {name: 'updates', legend: 'Updates', options: [{value: 'news', label: 'News'}], value: ['news']};
const radioGroupElement = createElement(RadioGroup, {...radioGroup, ref: createRef<HTMLFieldSetElement>()});
const checkboxGroupElement = createElement(CheckboxGroup, checkboxGroup);
// @ts-expect-error Multiple choice uses an array value.
const badGroupValue: CheckboxGroupProps = {...checkboxGroup, value: 'news'};
const label: LabelProps = {htmlFor: 'project', required: true};
const labelElement = createElement(Label, {...label, ref: createRef<HTMLLabelElement>()}, 'Project');
const fieldset: FieldsetProps = {legend: 'Preferences', disabled: true, status: 'warning'};
const groupElement = createElement(Fieldset, {...fieldset, ref: createRef<HTMLFieldSetElement>()});
// @ts-expect-error A group must have a legend.
const unnamedGroup: FieldsetProps = {disabled: true};
const heading: HeadingProps = {level: 3, size: 'large'};
const display: HeadingProps = {level: 1, size: 'display'};
const lead: TextProps = {as: 'p', size: 'lead'};
const snippet: CodeSnippetProps = {code: 'npm install example', id: 'command'};
// @ts-expect-error CodeSnippet requires literal code content.
const badSnippet: CodeSnippetProps = {id: 'missing-code'};
const input: InputProps = {size: 30, controlSize: 'xl', status: 'warning', readOnly: true};
// @ts-expect-error Field status has a closed semantic vocabulary.
const badStatus: InputProps = {status: 'orange'};
const select: SelectProps = {size: 4, multiple: true, defaultValue: ['team'], controlSize: 'xl', invalid: true};
const scroll: ScrollAreaProps = {orientation: 'both', contentInset: 'scrollbar', style: {maxHeight: '12rem'}, 'aria-label': 'History'};
const scrollRef = createRef<HTMLDivElement>();
const scrollElement = createElement(ScrollArea, {...scroll, ref: scrollRef});
// @ts-expect-error Only the documented scroll axes are supported.
const badScroll: ScrollAreaProps = {orientation: 'diagonal'};
const scrollRole: TokenName = 'sys.scrollbar.size';
const selectRef = createRef<HTMLSelectElement>();
const referencedSelect: ComponentPropsWithRef<typeof Select> = {ref: selectRef, name: 'visibility'};
const selectElement = createElement(Select, {...referencedSelect, onChange: event => { const options: HTMLOptionsCollection = event.currentTarget.options; void options; }});
// @ts-expect-error Visual control size cannot replace native select list size.
const badSelect: SelectProps = {size: 'xl'};
const icon: IconButtonProps = {label: 'Add item', size: '2xl'};
// @ts-expect-error Visual size must not replace the native input size attribute.
const badInput: InputProps = {size: 'xl'};
// @ts-expect-error Icon-only actions require a name.
const badIcon: IconButtonProps = {size: 'md'};
// @ts-expect-error Unknown roles must be rejected rather than widened to string.
const typo: TokenName = 'sys.color.content.defalt';
void css; void typo;
void heading; void display; void lead; void snippet; void badSnippet; void input; void icon; void badInput; void badIcon;
void select; void referencedSelect; void selectElement; void badSelect;
void scroll; void scrollElement; void badScroll; void scrollRole;
`,
  );
  const types = spawnSync(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      join(root, "foundation-types.mts"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--types",
      "node",
      "--typeRoots",
      resolve("node_modules/@types"),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(types.status, 0, types.stdout || types.stderr);
  const cli = spawnSync(
    process.execPath,
    [join(root, "node_modules/@flood-md/cli/bin/flood.mjs"), "doctor"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(cli.status, 0, cli.stderr);
  await readFile(join(root, "node_modules/@flood-md/react/dist/index.d.ts"));
  await writeFile(join(root, "react-compat.mjs"), `
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Link,Badge,Spinner,Skeleton,Avatar,Progress,Meter,Alert,DescriptionList,Table,Menu} from '@flood-md/react';
import {FloodRoot, Heading, Field, Input, Select, ScrollArea, IconButton, Toggle, ToggleGroup, SegmentedControl, Collapsible, Accordion, Tooltip, Popover, Dialog, Tabs, Breadcrumb, Pagination} from '@flood-md/react';
const html=renderToStaticMarkup(h(FloodRoot,null,
  h(Heading,{level:1},'Ready'),
  h(Menu,{label:'Actions',trigger:p=>h('button',p,'Actions'),items:[{id:'open',label:'Open'}]}),
  h(DescriptionList,{items:[{id:'name',term:'Name',description:'Flood'}]}),h(Table,{caption:'Projects'},h('tbody',null,h('tr',null,h('td',null,'Flood')))),
  h(Progress,{label:'Upload',value:50}),h(Meter,{label:'Storage',value:75}),h(Alert,{title:'Saved'},'Ready'),
  h(Badge,{tone:'success'},'Active'),h(Spinner,{label:'Loading workspace'}),h(Skeleton,{shape:'circle'}),h(Avatar,{name:'Alex Morgan',src:'/alex.svg'}),
  h(Link,{href:'/docs',variant:'subtle',size:'sm'},'Documentation'),
  h(Toggle,{defaultPressed:true},'Bold'),
  h(Tabs,{label:'Sections',items:[{value:'a',label:'Alpha',content:'Content'}]}),
  h(Breadcrumb,{items:[{label:'Home',href:'/'},{label:'Current'}]}),
  h(Pagination,{page:1,pageCount:20,getHref:page=>'?page='+page}),
  h(Tooltip,{content:'Help',trigger:props=>h('button',props,'Help')}),
  h(Popover,{title:'Settings',trigger:props=>h('button',props,'Settings')}),
  h(Dialog,{title:'Create',trigger:props=>h('button',props,'Create')}),
  h(Collapsible,{title:'Advanced',defaultOpen:true},'Details'),
  h(Accordion,{label:'FAQ',items:[{value:'a',title:'Question',content:'Answer'}]}),
  h(SegmentedControl,{label:'Period',hideLabel:true,name:'period',defaultValue:'day',options:[{value:'day',label:'Day'}]}),
  h(ToggleGroup,{label:'Formatting',options:[{value:'bold',label:'Bold'}],defaultValue:['bold']}),
  h(ScrollArea,{'aria-label':'History',style:{maxHeight:'12rem'}},'Local activity'),
  h(Field,{label:'Name',hideLabel:true,required:true},p=>h(Input,{...p,name:'name'})),
  h(Field,{label:'Visibility',required:true},p=>h(Select,{...p,name:'visibility',defaultValue:'team'},h('option',{value:'private'},'Private'),h('option',{value:'team'},'Team'))),
  h(IconButton,{label:'Add'},'+')));
if(!html.includes('data-flood-theme="dark"')||!html.includes('required=""')||!html.includes('aria-label="Add"')||!html.includes('flood-scroll-area__viewport')||!html.includes('<select')||!html.includes('selected=""')||!html.includes('aria-pressed="true"')||!html.includes('flood-toggle-group')||!html.includes('flood-segmented')||!html.includes('aria-expanded=')||!html.includes('flood-accordion')||!html.includes('flood-dialog')||!html.includes('role="tooltip"')||!html.includes('role="tablist"')||!html.includes('flood-pagination')||!html.includes('flood-breadcrumb')) throw Error('React compatibility render');
for(const name of ['flood-badge','flood-loading','flood-skeleton','flood-avatar','flood-indicator','flood-alert','flood-description-list','flood-table','flood-menu']) if(!html.includes(name)) throw Error('Missing content export '+name);
`);
  for (const reactVersion of ["19.3.1", "18.3.1"]) {
    if (reactVersion === "18.3.1")
      npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", `react@${reactVersion}`, `react-dom@${reactVersion}`], root);
    const compatibility = spawnSync(process.execPath, ["react-compat.mjs"], { cwd: root, encoding: "utf8" });
    assert.equal(compatibility.status, 0, compatibility.stderr);
  }
  console.log(
    "Clean consumer: four tarballs, font/license, typed props, CLI doctor and React 18/19 foundation SSR pass.",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
