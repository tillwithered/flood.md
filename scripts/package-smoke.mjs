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
    for (const path of ["dist/foundations.css", "dist/fonts/InterVariable.woff2", "dist/fonts/InterVariable-Italic.woff2", "dist/fonts/LICENSE.txt"])
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
import { Container, Grid, AspectRatio, Image, List, VisuallyHidden, EmptyState, type CheckboxProps, type ContainerProps, type GridProps, type AspectRatioProps, type ImageProps, type ListProps, type VisuallyHiddenProps, type EmptyStateProps, Card, type CardProps, Toolbar, Kbd, type ToolbarProps, type KbdProps, Menu, type MenuProps, DescriptionList, Table, type DescriptionListProps, type TableProps, Progress, Meter, Alert, type ProgressProps, type MeterProps, type AlertProps, Badge, Spinner, Skeleton, Avatar, type BadgeProps, type SpinnerProps, type SkeletonProps, type AvatarProps, Link, type LinkProps } from '@flood-md/react';
createElement(Container,{size:'lg',gutter:'4',ref:createRef<HTMLDivElement>()},createElement(Grid,{columns:3,minItemWidth:'16rem'},'Content'));
createElement(AspectRatio,{ratio:16/9},createElement(Image,{src:'/image.png',alt:'Preview',fit:'contain',ref:createRef<HTMLImageElement>()}));
createElement(List,{ordered:true,start:2,marker:false,ref:createRef<HTMLUListElement|HTMLOListElement>()},createElement('li',null,'First'));
createElement(VisuallyHidden,{focusable:true},createElement('a',{href:'#main'},'Skip to main'));
createElement(EmptyState,{title:'No items',actions:createElement('button',null,'Add')});
const mixed: CheckboxProps = {label:'Select all',indeterminate:true,name:'all'};
// @ts-expect-error Images require a deliberate alternative text decision.
const unnamedImage: ImageProps = {src:'/preview.png'};
const card: CardProps = {title:'Details',description:'Project settings',headingLevel:3,density:'compact',footer:createElement('button',null,'Save')};
createElement(Card,{...card,ref:createRef<HTMLDivElement>()},'Body');
// @ts-expect-error Card does not supply link-wrapper behavior.
const linkedCard: CardProps = {href:'/project'};
const toolbar: ToolbarProps = {label:'Actions',orientation:'vertical',loop:false};
createElement(Toolbar,{...toolbar,ref:createRef<HTMLDivElement>()},createElement('button',null,'Action'));
const key: KbdProps = {size:'lg'};
createElement(Kbd,{...key,ref:createRef<HTMLElement>()},'Enter');
// @ts-expect-error Toolbar needs a name.
const unnamedToolbar: ToolbarProps = {};
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
  await writeFile(join(root, "candidate-types.mts"), `
import {createElement as h, createRef, type ComponentPropsWithRef} from 'react';
import {Editable, TagInput, CommandList, DateField, TimeField, Calendar, DatePicker, DateRangeField, RangeCalendar, DateRangePicker, ResizablePanels, ErrorSummary, ContextMenu, Tree, NavigationTree, Menu, Popover,
 type EditableProps, type TagInputProps, type CommandListProps, type DateFieldProps, type TimeFieldProps, type CalendarProps, type DatePickerProps, type DateRangeValue, type DateRangeFieldProps, type RangeCalendarProps, type DateRangePickerProps, type ResizablePanelsProps, type ErrorSummaryProps, type ErrorSummaryItem, type ContextMenuProps, type TreeProps, type TreeItem, type NavigationTreeProps, type NavigationTreeItem, type MenuItem, type MenuCheckboxItem, type MenuRadioItem, type MenuSubmenuItem, type PopoverProps} from '@flood-md/react';
const editable: EditableProps = {label:'Project',value:'Flood',editing:true,inputRef:createRef<HTMLInputElement>(),blurAction:'cancel',onCommit:value=>value satisfies string,onEditingChange:value=>value satisfies boolean};
h(Editable,{...editable,ref:createRef<HTMLDivElement>()});
const tags: TagInputProps = {label:'Tags',name:'tags',value:['design'],delimiters:[',',';'],onValueChange:value=>value satisfies string[],onBlur:event=>event.currentTarget.value satisfies string};
h(TagInput,{...tags,ref:createRef<HTMLInputElement>()});
const commands: CommandListProps = {label:'Commands',items:[{id:'open',label:'Open',keywords:['project'],group:'Projects'}],query:'open',onQueryChange:value=>value satisfies string,onAction:id=>id satisfies string};
h(CommandList,{...commands,ref:createRef<HTMLInputElement>()});
const date: DateFieldProps = {label:'Date',name:'date',value:'2026-10-26',order:'year-month-day',validationMessage:'Host validation',end:h('button',null,'Action'),onValueChange:value=>value satisfies string};
h(DateField,{...date,ref:createRef<HTMLDivElement>()});
const time: TimeFieldProps = {label:'Time',value:'12:30:45',precision:'second',step:15,segmentLabels:{second:'Second'},onValueChange:value=>value satisfies string};
h(TimeField,{...time,ref:createRef<HTMLDivElement>()});
const calendar: CalendarProps = {label:'Calendar',value:'2026-10-26',visibleMonth:'2026-10',today:'2026-10-26',weekStartsOn:1,locale:'en-GB',isDateDisabled:date=>date.endsWith('-01'),onDateSelect:value=>value satisfies string,onVisibleMonthChange:value=>value satisfies string};
h(Calendar,{...calendar,ref:createRef<HTMLDivElement>()});
const picker: DatePickerProps = {label:'Pick date',value:'2026-10-26',open:false,onOpenChange:value=>value satisfies boolean,calendarLabel:'Choose date',today:'2026-10-26',weekStartsOn:1};
h(DatePicker,{...picker,ref:createRef<HTMLDivElement>()});
const range: DateRangeValue = {start:'2026-10-26',end:'2026-10-28'};
const rangeField: DateRangeFieldProps = {label:'Dates',value:range,startName:'start',endName:'end',startLabel:'Arrival',endLabel:'Departure',isRangeDisabled:value=>value.start===value.end,onValueChange:value=>value satisfies DateRangeValue};
h(DateRangeField,{...rangeField,ref:createRef<HTMLDivElement>()});
const rangeCalendar: RangeCalendarProps = {label:'Range',value:range,today:'2026-10-26',rangeLabels:{chooseStart:'Choose start'},onRangeSelect:value=>value satisfies DateRangeValue};
h(RangeCalendar,{...rangeCalendar,ref:createRef<HTMLDivElement>()});
const rangePicker: DateRangePickerProps = {...rangeField,open:false,today:'2026-10-26',onOpenChange:value=>value satisfies boolean};
h(DateRangePicker,{...rangePicker,ref:createRef<HTMLDivElement>()});
const panels: ResizablePanelsProps = {label:'Workspace',main:h('main',null,'Main'),secondary:h('aside',null,'Inspector'),value:60,min:20,max:80,orientation:'vertical',onValueChange:value=>value satisfies number,onValueCommit:value=>value satisfies number};
h(ResizablePanels,{...panels,ref:createRef<HTMLDivElement>()});
const error: ErrorSummaryItem = {id:'date-error',fieldId:'date',message:'Choose a date'};
const summary: ErrorSummaryProps = {title:'Review fields',errors:[error],announcement:'polite',autoFocus:false,onSelect:(item,event)=>{item.fieldId satisfies string;event.currentTarget satisfies HTMLAnchorElement;}};
h(ErrorSummary,{...summary,ref:createRef<HTMLDivElement>()});
const checkbox: MenuCheckboxItem = {id:'notify',type:'checkbox',label:'Notifications',checked:'mixed',onCheckedChange:value=>value satisfies boolean};
const radio: MenuRadioItem = {id:'compact',type:'radio',label:'Compact',group:'Density',checked:true,onCheckedChange:value=>value satisfies boolean};
const submenu: MenuSubmenuItem = {id:'export',type:'submenu',label:'Export',items:[{id:'json',label:'JSON'}]};
const menuItems: readonly MenuItem[] = [checkbox,radio,submenu];
h(Menu,{label:'Actions',items:menuItems,trigger:props=>h('button',props,'Actions'),ref:createRef<HTMLDivElement>()});
const context: ContextMenuProps = {label:'Context',items:menuItems,children:h('span',null,'Document'),onAction:id=>id satisfies string};
h(ContextMenu,{...context,ref:createRef<HTMLDivElement>()});
const treeItem: TreeItem = {value:'folder',label:'Folder',hasChildren:true,children:[{value:'file',label:'File'}]};
const tree: TreeProps = {label:'Files',items:[treeItem],value:['file'],multiple:true,expandedValues:['folder'],onValueChange:value=>value satisfies string|string[],onExpandedValuesChange:value=>value satisfies string[]};
h(Tree,{...tree,ref:createRef<HTMLDivElement>()});
const navigationItem: NavigationTreeItem = {value:'docs',label:'Docs',href:'/docs',children:[{value:'install',label:'Install',href:'/docs/install',linkProps:{target:'_blank',download:true,onClick:event=>event.currentTarget.href satisfies string}}]};
const navigation: NavigationTreeProps = {label:'Documentation',items:[navigationItem],currentValue:'install',expandedValues:['docs'],onExpandedValuesChange:value=>value satisfies string[],expandLabel:(item,expanded)=>(expanded?'Collapse ':'Expand ')+item.label};
h(NavigationTree,{...navigation,ref:createRef<HTMLElement>()});
const positionReference = createRef<HTMLDivElement>();
const positioned: PopoverProps = {title:'Settings',trigger:props=>h('button',props,'Settings'),positionReference};
h(Popover,{...positioned,ref:createRef<HTMLDivElement>()});
const commandRef: ComponentPropsWithRef<typeof CommandList> = {...commands,ref:createRef<HTMLInputElement>()};
const navigationRef: ComponentPropsWithRef<typeof NavigationTree> = {...navigation,ref:createRef<HTMLElement>()};
void commandRef;void navigationRef;
// @ts-expect-error Editable requires an accessible name.
const unnamedEditable: EditableProps = {value:'Flood'};
// @ts-expect-error TagInput owns an array of text tokens.
const scalarTags: TagInputProps = {label:'Tags',value:'design'};
// @ts-expect-error DateField owns its segmented input children.
const dateChildren: DateFieldProps = {label:'Date',children:'Input'};
// @ts-expect-error TimeField has a bounded precision vocabulary.
const badPrecision: TimeFieldProps = {label:'Time',precision:'millisecond'};
// @ts-expect-error Calendar week starts use weekday indices 0 through 6.
const badWeek: CalendarProps = {label:'Calendar',weekStartsOn:7};
// @ts-expect-error DatePicker owns its trailing calendar action.
const pickerEnd: DatePickerProps = {label:'Date',end:'Action'};
// @ts-expect-error Range fields accept an ordered pair rather than a scalar date.
const scalarRange: DateRangeFieldProps = {label:'Range',value:'2026-10-26'};
// @ts-expect-error ContextMenu requires content that owns the context gesture.
const missingContext: ContextMenuProps = {label:'Context',items:menuItems};
// @ts-expect-error A checkbox preference must expose its controlled change callback.
const missingChoice: MenuCheckboxItem = {id:'choice',type:'checkbox',label:'Choice',checked:true};
// @ts-expect-error Submenus cannot also be destructive actions.
const destructiveSubmenu: MenuSubmenuItem = {...submenu,tone:'danger'};
// @ts-expect-error NavigationTree does not own application object selection.
const selectionNavigation: NavigationTreeProps = {...navigation,value:['install']};
`);
  function checkConsumerTypes() {
  const types = spawnSync(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      join(root, "foundation-types.mts"),
      join(root, "candidate-types.mts"),
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
  }
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
import {Link,Badge,Spinner,Skeleton,Avatar,Progress,Meter,Alert,DescriptionList,Table,Menu,Toolbar,Kbd,Card,Container,Grid,AspectRatio,Image,List,VisuallyHidden,EmptyState} from '@flood-md/react';
import {FloodRoot, Heading, Field, Input, Select, ScrollArea, IconButton, Toggle, ToggleGroup, SegmentedControl, Collapsible, Accordion, Tooltip, Popover, Dialog, Tabs, Breadcrumb, Pagination} from '@flood-md/react';
const html=renderToStaticMarkup(h(FloodRoot,null,
  h(Heading,{level:1},'Ready'),
  h(Container,null,h(Grid,null,h(AspectRatio,null,h(Image,{src:'/preview.png',alt:'Preview'})))),h(List,null,h('li',null,'First')),h(VisuallyHidden,null,'Hidden description'),h(EmptyState,{title:'No items'}),
  h(Card,{title:'Details',description:'Project settings',footer:h('button',null,'Save')},'Body'),
  h(Toolbar,{label:'Tools'},h('button',null,'Undo')),h(Kbd,null,'Enter'),
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
for(const name of ['flood-container','flood-grid','flood-aspect-ratio','flood-image','flood-list','flood-empty-state','flood-card','flood-toolbar','flood-kbd','flood-badge','flood-loading','flood-skeleton','flood-avatar','flood-indicator','flood-alert','flood-description-list','flood-table','flood-menu']) if(!html.includes(name)) throw Error('Missing content export '+name);
`);
  await writeFile(join(root, "candidate-compat.mjs"), `
import assert from 'node:assert/strict';
import {createElement as h,createRef} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import * as Flood from '@flood-md/react';
const names=['Editable','TagInput','CommandList','DateField','TimeField','Calendar','DatePicker','DateRangeField','RangeCalendar','DateRangePicker','ResizablePanels','ErrorSummary','ContextMenu','Tree','NavigationTree'];
for(const name of names)assert.ok(Flood[name], 'Missing candidate export '+name);
const {FloodRoot,Editable,TagInput,CommandList,DateField,TimeField,Calendar,DatePicker,DateRangeField,RangeCalendar,DateRangePicker,ResizablePanels,ErrorSummary,ContextMenu,Tree,NavigationTree,Menu,Popover}=Flood;
const date='2026-10-26',range={start:date,end:'2026-10-28'};
const items=[{id:'notify',type:'checkbox',label:'Notifications',checked:'mixed',onCheckedChange:()=>{}},{id:'compact',type:'radio',group:'Density',label:'Compact',checked:true,onCheckedChange:()=>{}},{id:'export',type:'submenu',label:'Export',items:[{id:'json',label:'JSON'}]}];
const html=render(h(FloodRoot,null,
 h(Editable,{label:'Project',name:'candidate-project',defaultValue:'Flood'}),
 h(TagInput,{label:'Tags',name:'candidate-tags',defaultValue:['design','engineering']}),
 h(CommandList,{label:'Commands',items:[{id:'open',label:'Open project',group:'Projects'}]}),
 h(DateField,{id:'candidate-date',label:'Date',name:'candidate-date',defaultValue:date,end:h('button',null,'Date action')}),
 h(TimeField,{label:'Time',name:'candidate-time',defaultValue:'12:30:45',precision:'second'}),
 h(Calendar,{label:'Calendar',defaultValue:date,defaultVisibleMonth:'2026-10',today:date,locale:'en-US'}),
 h(DatePicker,{label:'Pick date',name:'candidate-picked-date',defaultValue:date,today:date}),
 h(DateRangeField,{label:'Range',startName:'candidate-start',endName:'candidate-end',defaultValue:range}),
 h(RangeCalendar,{label:'Range calendar',defaultValue:range,defaultVisibleMonth:'2026-10',today:date}),
 h(DateRangePicker,{label:'Pick range',startName:'candidate-picker-start',endName:'candidate-picker-end',defaultValue:range,today:date}),
 h(ResizablePanels,{label:'Workspace',main:'Main panel',secondary:'Inspector',defaultValue:60}),
 h(ErrorSummary,{title:'Review fields',errors:[{id:'date-error',fieldId:'candidate-date',message:'Choose a date'}]}),
 h(Menu,{label:'Preferences',items,defaultOpen:true,trigger:props=>h('button',props,'Preferences')}),
 h(ContextMenu,{label:'Document actions',items,defaultOpen:true},h('span',null,'Document')),
 h(Tree,{label:'Files',items:[{value:'folder',label:'Folder',children:[{value:'file',label:'File'}]}],defaultExpandedValues:['folder'],defaultValue:'file'}),
 h(NavigationTree,{label:'Docs',items:[{value:'docs',label:'Docs',children:[{value:'install',label:'Install',href:'/docs/install'}]}],currentValue:'install',defaultExpandedValues:['docs']}),
 h(Popover,{title:'Positioned settings',positionReference:createRef(),trigger:props=>h('button',props,'Settings')})
));
const cssURL=new URL(import.meta.resolve('@flood-md/react/styles.css'));
const css=readFileSync(cssURL,'utf8')+readFileSync(new URL('./foundations.css',cssURL),'utf8');
for(const name of ['flood-editable','flood-tag-input','flood-command-list','flood-date-field','flood-time-field','flood-calendar','flood-date-picker','flood-date-range-field','flood-range-calendar','flood-date-range-picker','flood-resizable-panels','flood-error-summary','flood-context-menu','flood-tree','flood-navigation-tree']){
 assert.ok(html.includes(name),'Missing candidate SSR anatomy '+name);
 assert.ok(css.includes('.'+name),'Missing packaged candidate CSS '+name);
}
for(const [name,value] of [['candidate-project','Flood'],['candidate-tags','design'],['candidate-tags','engineering'],['candidate-date',date],['candidate-time','12:30:45'],['candidate-picked-date',date],['candidate-start',range.start],['candidate-end',range.end],['candidate-picker-start',range.start],['candidate-picker-end',range.end]]){
 const inputs=html.match(/<input\\b[^>]*>/g)??[];
 assert.ok(inputs.some(input=>input.includes('name="'+name+'"')&&input.includes('value="'+value+'"')),'Missing canonical SSR form value '+name+'='+value);
}
assert.ok(html.includes('role="menuitemcheckbox"')&&html.includes('aria-checked="mixed"')&&html.includes('role="menuitemradio"')&&html.includes('aria-haspopup="menu"'),'Missing preference/submenu SSR semantics');
assert.ok(html.includes('href="#candidate-date"'),'Missing error-summary field link');
assert.ok(html.includes('role="tree"')&&html.includes('role="treeitem"')&&html.includes('role="separator"'),'Missing application tree or resizable separator semantics');
const navigation=render(h(NavigationTree,{label:'Docs',items:[{value:'install',label:'Install',href:'/docs/install'}],currentValue:'install'}));
assert.ok(navigation.includes('<nav')&&navigation.includes('<ul')&&navigation.includes('aria-current="page"')&&!navigation.includes('role="tree"'),'NavigationTree must retain native navigation semantics');
`);
  for (const reactVersion of ["19.3.1", "18.3.1"]) {
    if (reactVersion === "18.3.1")
      npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", `react@${reactVersion}`, `react-dom@${reactVersion}`, "@types/react@18", "@types/react-dom@18"], root);
    // Compile against the independently installed matching major, not checkout declarations.
    checkConsumerTypes();
    const compatibility = spawnSync(process.execPath, ["react-compat.mjs"], { cwd: root, encoding: "utf8" });
    assert.equal(compatibility.status, 0, compatibility.stderr);
    const candidate = spawnSync(process.execPath, ["candidate-compat.mjs"], { cwd: root, encoding: "utf8" });
    assert.equal(candidate.status, 0, candidate.stderr || candidate.stdout);
  }
  console.log(
    "Clean consumer: four tarballs, font/license, typed props/refs, CLI doctor and React 18/19 foundation + 0.2.7 API/form SSR pass.",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
