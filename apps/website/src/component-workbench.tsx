import { Fragment, createElement, useEffect, useId, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent, type KeyboardEvent } from "react";
import { House, Folder, Layers3, Bell, ChartNoAxesColumn, Settings, CircleHelp, ArrowRight, Copy, Plus, Undo2, Redo2, History, Bold, Italic, Underline, Share2, CalendarDays, CalendarRange, Calendar, Pencil, Archive, Trash2, Ellipsis, ChevronDown, CircleCheck, CircleAlert, CircleX, Paperclip, MessageCircle, ThumbsUp } from "lucide-react";
import * as Flood from "@flood-md/react";
import type { ComponentPage } from "./component-catalog";
import "./component-workbench.css";
import { importStatements } from "../project-imports.mjs";
import release from "./release.json";
import { phoneViewport, touchPhone, useStudioMedia } from "./studio-media";

type Values = Record<string, string | boolean>;
type Knob = { name: string; label?: string; options?: string[]; initial: string | boolean };
type Binding = { expression: string; value: unknown };
type ElementRecipe = { tag: string; props?: Record<string, unknown>; children?: Array<ElementRecipe | string | Binding>; field?: ElementRecipe; previewSlot?: CSSProperties; previewFeedback?: true; previewClassName?: string };
const element = (tag: string, props: Record<string, unknown> = {}, ...children: Array<ElementRecipe | string | Binding>): ElementRecipe => ({ tag, props, children });
const binding = (expression: string, value: unknown): Binding => ({ expression, value });
const cardMedia = () => binding(
  '<FileThumbnail presentation="tile" ratio={16 / 9} src="/charts-share.png" />',
  <Flood.FileThumbnail presentation="tile" ratio={16 / 9} src="/charts-share.png"/>,
);
const focusRecoveredActivity = (node: HTMLUListElement | null) => {
  node?.focus({preventScroll:true});
};
const sizes = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
const spaces = ["0", "1", "2", "3", "4", "6", "8", "12"];
const variants = ["solid", "subtle", "outline", "ghost"];
const statusGlyphs = {CircleHelp, History, CircleCheck, CircleAlert, CircleX, Bell};
const filePreviewImages = ["none","image","unavailable"];
const uploadQueueExamples = [
  {id:"brand",name:"Brand guidelines.pdf",size:2400000,state:"uploading",progress:45},
  {id:"cover",name:"Cover.png",size:850000,state:"processing"},
  {id:"logo",name:"Logo.svg",size:18400,state:"success"},
] as const satisfies readonly Flood.UploadQueueEntry[];
const filePreviewImage = (state: string | boolean) =>
  state === "image" ? "/flood-mark.png" : state === "unavailable" ? "/missing-file-preview.png" : undefined;
const notificationTriggerItems = [
  {id:"mention",title:"Maya mentioned you",href:"/components/comment-thread",timeLabel:"09:24"},
  {id:"export",title:"Export ready for approval",href:"/components/activity-timeline",timeLabel:"08:52"},
];
const statusExamples = {neutral:["Not started","CircleHelp"],accent:["In progress","History"],success:["All systems operational","CircleCheck"],warning:["Needs attention","CircleAlert"],error:["Service interrupted","CircleX"],info:["Update available","Bell"]} as const;
const reactionOptions = [
  {id:"helpful",label:"Helpful",icon:"👍"},
  {id:"celebrate",label:"Celebrate",icon:"🙌"},
  {id:"heart",label:"Love",icon:"❤️"},
  {id:"eyes",label:"Seen",icon:"👀"},
];
const projectTableColumns: Flood.DataTableColumn[] = [
  { id: "name", label: "Project", sortable: true, hideable: false, pinned: "start", width: "10rem", resizable: true, minWidth: 120, maxWidth: 320 },
  { id: "status", label: "Status", sortable: true },
  { id: "members", label: "Members", numeric: true, sortable: true },
  { id: "owner", label: "Owner", sortable: true, width: "8.5rem", resizable: true, minWidth: 88, maxWidth: 240 },
  { id: "team", label: "Team", sortable: true, width: "6.5rem" },
  { id: "priority", label: "Priority", sortable: true },
  { id: "region", label: "Region", sortable: true },
  { id: "budget", label: "Budget", unit: "USD", numeric: true, sortable: true },
  { id: "trend", label: "5-week trend" },
];
const projectLoadingColumnWidths = { name:154, status:120, members:100, owner:120, team:99, priority:94, region:92, budget:144, trend:124 };
const projectTableRows: Flood.DataTableRow[] = [
  { id: "design", label: "Design system", cells: { name: "Design system", status: "Active", members: 12, owner: "Maya", team: "Design", priority: "High", region: "Global", budget: 12000 } },
  { id: "website", label: "Website", cells: { name: "Website", status: "Active", members: 4, owner: "Noah", team: "Growth", priority: "Normal", region: "Europe", budget: 8000 } },
  { id: "agents", label: "Agent guides", cells: { name: "Agent guides", status: "Draft", members: 2, owner: "Sam", team: "Content", priority: "Normal", region: "Global", budget: 4500 } },
  { id: "mobile", label: "Mobile app", cells: { name: "Mobile app", status: "Draft", members: 8, owner: "Maya", team: "Product", priority: "High", region: "Asia", budget: 15000 } },
  { id: "research", label: "Research", selectionDisabled: true, cells: { name: "Research", status: "Archived", members: 3, owner: "Sam", team: "Research", priority: "Low", region: "Europe", budget: 3000 } },
  { id: "marketing", label: "Marketing", cells: { name: "Marketing", status: "Active", members: 6, owner: "Noah", team: "Growth", priority: "Normal", region: "Americas", budget: 7600 } },
  { id: "support", label: "Support", cells: { name: "Support", status: "Active", members: 5, owner: "Sam", team: "Operations", priority: "High", region: "Global", budget: 6000 } },
];
const projectBudgetTrends: Record<string, number[]> = {
  design: [7200, 8800, 8400, 10100, 12000],
  website: [8400, 9200, 8900, 8600, 8000],
  agents: [3500, 4000, 3900, 4400, 4500],
  mobile: [10400, 11500, 13200, 12400, 15000],
  research: [2900, 3000, 3100, 2900, 3000],
  marketing: [6900, 7200, 7100, 7800, 7600],
  support: [5200, 5900, 5800, 6100, 6000],
};
const milestoneRows = [
  { name: "Foundations", due: "Oct 24", status: "Complete", tone: "success" },
  { name: "Table components", due: "Nov 14", status: "In progress", tone: "accent" },
  { name: "Documentation", due: "Nov 21", status: "Planned", tone: "neutral" },
];
const projectMilestones = element("Table", { caption: "Design system milestones", hideCaption: true, density: "compact" },
  element("thead", {}, element("tr", {}, ...["Milestones", "Due", "Status"].map(label => element("th", { scope: "col" }, label)))),
  element("tbody", {}, ...milestoneRows.map(({ name, due, status, tone }) =>
    element("tr", {},
      element("th", { scope: "row" }, name),
      element("td", {}, due),
      element("td", {}, element("StatusIndicator", { label: status, tone, size: "sm" })),
    ),
  )),
);
const budgetTrendLabel = (values: number[]) => `Five-week budget: USD ${values[0]} to ${values.at(-1)}`;
const budgetFormat = new Intl.NumberFormat("en-US");
const projectStatusTones = { Active: "success", Draft: "info", Archived: "neutral" } as const;
const projectOwners = ["Maya", "Noah", "Sam"];
type ProjectEditField = "budget" | "status" | "owner";
type ProjectEdits = Record<string, Partial<Record<ProjectEditField, string>>>;
const budgetError = "Enter a non-negative amount with up to two decimal places.";
function parseProjectBudget(value: string) {
  const amount = value.trim();
  return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount)
    ? Number(amount.replaceAll(",", ""))
    : NaN;
}
const projectRowsForPreview = (longList: boolean): Flood.DataTableRow[] => longList ? [
  ...projectTableRows,
  ...projectTableRows.map(row => ({
    ...row, id: `${row.id}-next`, label: `${row.label} · Q2`, cells: { ...row.cells, name: `${row.label} · Q2` },
  })),
] : projectTableRows;
function projectTablePreviewRows(longList: boolean, edits: ProjectEdits, update: PreviewActions["setProjectEdit"]) {
  const domain = [0, Math.max(16000, ...Object.values(edits).map(edit => Number(edit.budget ?? 0)))] as const;
  return projectRowsForPreview(longList).map(row => {
    const values = [...projectBudgetTrends[row.id.replace(/-next$/, "")]];
    const edit = edits[row.id];
    const budget = edit?.budget === undefined ? values[values.length - 1] : Number(edit.budget);
    values[values.length - 1] = budget;
    const status = (edit?.status ?? row.cells.status) as keyof typeof projectStatusTones;
    const owner = String(edit?.owner ?? row.cells.owner);
    const choice = (field: "status" | "owner", selected: string, options: string[], content: ReactNode) => {
      const label = `${field === "status" ? "Status" : "Owner"} for ${row.label}`;
      return <Flood.Menu label={label} items={options.map(option => ({
        id: option, label: option, type: "radio", group: field, checked: selected === option,
        closeOnSelect: true, onCheckedChange: () => update(row.id, field, option),
      }))} trigger={props => <Flood.Button {...props} variant="ghost" size="sm" aria-label={`${label}: ${selected}`}>
        {content}<Flood.IconSlot size="xs"><ChevronDown /></Flood.IconSlot>
      </Flood.Button>} />;
    };
    return {
      ...row,
      sortValues: { budget, status, owner, priority: String(row.cells.priority) },
      cells: {
        ...row.cells,
        status: choice("status", status, Object.keys(projectStatusTones), <Flood.Badge size="sm" tone={projectStatusTones[status]}>{status}</Flood.Badge>),
        priority: <Flood.Badge size="sm" tone={row.cells.priority === "High" ? "warning" : "neutral"}>{row.cells.priority}</Flood.Badge>,
        owner: choice("owner", owner, projectOwners, owner),
        budget: <Flood.Editable label={`Budget for ${row.label}`} hideLabel value={budgetFormat.format(budget)}
          previewVariant="ghost" controlSize="sm" inputMode="decimal" blurAction="cancel" editorOverlayWidth="fit-content"
          validate={value => Number.isSafeInteger(Math.round(parseProjectBudget(value) * 100)) ? undefined : budgetError}
          onCommit={value => update(row.id, "budget", String(parseProjectBudget(value)))} />,
        trend: <Flood.Sparkline label={budgetTrendLabel(values)} values={values} domain={domain} size="sm" />,
      },
      expandedContent: row.id === "design" ? renderRecipe(projectMilestones) : undefined,
    };
  });
}
const projectPreviewRowsCode = (longList: boolean) => JSON.stringify(projectRowsForPreview(longList)) + ".map(row => {\n" +
  "    const trends: Record<string, number[]> = " + JSON.stringify(projectBudgetTrends) + ";\n" +
  '    const values = [...trends[row.id.replace(/-next$/, "")]];\n' +
  '    const edit = projectEdits[row.id];\n' +
  '    const budget = edit?.budget === undefined ? values[values.length - 1] : Number(edit.budget);\n' +
  '    values[values.length - 1] = budget;\n' +
  '    const status = (edit?.status ?? row.cells.status) as keyof typeof statusTones;\n' +
  '    const owner = edit?.owner ?? row.cells.owner;\n' +
  '    const choice = (field: "status" | "owner", selected: string, options: string[], content: ReactNode) => {\n' +
  '      const label = `${field === "status" ? "Status" : "Owner"} for ${row.label}`;\n' +
  '      return <Menu label={label} items={options.map(option => ({ id: option, label: option, type: "radio", group: field,\n' +
  '        checked: selected === option, closeOnSelect: true, onCheckedChange: () => updateProject(row.id, field, option) }))}\n' +
  '        trigger={props => <Button {...props} variant="ghost" size="sm" aria-label={`${label}: ${selected}`}>{content}<IconSlot size="xs"><ChevronDown /></IconSlot></Button>} />;\n' +
  '    };\n' +
  '    return { ...row, sortValues: { budget, status, owner, priority: row.cells.priority }, cells: { ...row.cells,\n' +
  '      status: choice("status", status, Object.keys(statusTones), <Badge size="sm" tone={statusTones[status]}>{status}</Badge>),\n' +
  '      priority: <Badge size="sm" tone={row.cells.priority === "High" ? "warning" : "neutral"}>{row.cells.priority}</Badge>,\n' +
  '      owner: choice("owner", owner, ' + JSON.stringify(projectOwners) + ', owner),\n' +
  '      budget: <Editable label={`Budget for ${row.label}`} hideLabel value={new Intl.NumberFormat("en-US").format(budget)}\n' +
  '        previewVariant="ghost" controlSize="sm" inputMode="decimal" blurAction="cancel" editorOverlayWidth="fit-content"\n' +
  '        validate={value => Number.isSafeInteger(Math.round(parseBudget(value) * 100)) ? undefined : ' + JSON.stringify(budgetError) + '}\n' +
  '        onCommit={value => updateProject(row.id, "budget", String(parseBudget(value)))} />,\n' +
  '      trend: <Sparkline label={`Five-week budget: USD ${values[0]} to ${budget}`} values={values} domain={budgetDomain} size="sm" /> },\n' +
  "      expandedContent: row.id === \"design\" ? (\n" + printRecipe(projectMilestones, new Set(), new Set(), 4) + "\n      ) : undefined };\n" +
  "  })";
const collectionPreviewProperties=[{id:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"}]},{id:"owner",label:"Owner",options:[{value:"maya",label:"Maya"},{value:"noah",label:"Noah"}]},{id:"priority",label:"Priority",options:[{value:"urgent",label:"Urgent"},{value:"normal",label:"Normal"}]}];
const studioDestinations = [
  {value:"overview",label:"Overview",href:"#shell-overview"},
  {value:"projects",label:"Projects",href:"#shell-projects"},
  {value:"archive",label:"Archive",href:"#shell-archive"},
];
const studioNavigationCode = JSON.stringify(studioDestinations);
const select = (name: string, options: string[], initial: string): Knob => ({ name, options, initial });
const statusKnob = () => select("status", ["none", "error", "warning", "success", "info"], "none");
const toggle = (name: string, initial = false): Knob => ({ name, initial });
const choiceCardIndicator = select("indicatorPlacement", ["start", "end"], "start");
const knobs: Record<string, Knob[]> = {
  "app-shell": [select("scroll", ["content", "page"], "content"), {...select("navigationSide", ["start", "end"], "start"), label:"Navigation side"}, {...select("navigationMode", ["auto", "docked", "drawer", "none"], "auto"), label:"Navigation mode"}, {...toggle("showTopBar", true), label:"Show top bar"}, {...toggle("showFooter"), label:"Show footer"}],
  "app-top-bar": [toggle("bordered"), toggle("showActions", true)],
  "navigation-item": [{...toggle("compareStates"),label:"Compare states"},select("mode",["link","branch","link-branch","action"],"link-branch"),select("size",["sm","md","lg"],"sm"),select("variant",["quiet","standard"],"quiet"),select("labelOverflow",["wrap","truncate"],"wrap"),toggle("compact"),toggle("current",true),toggle("disabled"),toggle("icon",true),toggle("badge"),toggle("showTrailingAction"),toggle("longLabel")],
  "navigation-group": [select("size",["sm","md","lg"],"sm"),toggle("hideLabel"),toggle("separator"),toggle("collapsible"),toggle("compact"),toggle("showHeadingAction",true)],
  sidebar: [toggle("collapsed"),select("variant",["quiet","standard"],"quiet"),select("size",["sm","md","lg"],"sm"),select("side",["start","end"],"start"),select("width",["14rem","16rem","19rem"],"16rem"),toggle("longNavigation"),toggle("branchGuides",true),select("headerLayout",["inline","stacked"],"inline"),toggle("collapsible",true)],
  "collection-view-switcher": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["18rem","32rem","52rem"],"52rem"),toggle("editable",true),toggle("dirty"),toggle("disabled")],
  "collection-toolbar": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["24rem","40rem","52rem"],"52rem"),select("align",["stretch","split","end"],"stretch"),{...select("visibleFilters",["all","1"],"all"),label:"Visible filters"},toggle("showFilters",true),toggle("showClear",true),toggle("disabled")],
  "filter-group": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),select("maxConditions",["none","1","2","3","5"],"none"),toggle("allowDuplicateProperties"),toggle("hideLabel",true),toggle("disabled")],
  "filter-condition": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),toggle("removable",true),toggle("hideLabel",true),toggle("disabled")],
  "bulk-action-bar": [select("counter",["label","number","none"],"label"),select("selectionCount",["1","2","9","10","99","100","999"],"2"),select("width",["16rem","24rem","32rem"],"32rem"),select("size",["sm","md","lg","xl"],"sm"),select("maxVisibleActions",["1","2","3"],"2"),select("morePresentation",["label","icon","auto"],"label"),toggle("pending"),toggle("disabled")],
  "autocomplete": [select("controlSize", ["sm","md","lg","xl"], "md"),select("loadState",["ready","loading","error"],"ready"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "overflow-actions": [select("containerVariant",["contained","plain"],"contained"),select("shape",["pill","rounded"],"pill"),select("width",["14rem","24rem","40rem"],"24rem"),select("size",["sm","md","lg","xl"],"md"),select("variant",variants,"subtle"),select("morePresentation",["label","icon","auto"],"label"),select("maxVisibleActions",["auto","1","2","3"],"auto"),toggle("disabled")],
  "menubar": [select("controlSize",["sm","md","lg","xl"],"sm"),toggle("disabled")],
  "time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("interval", ["900", "1800", "3600"], "1800"),toggle("hideLabel"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "date-time-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("precision", ["minute", "second"], "minute"),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"),toggle("required",true),toggle("hideLabel"),toggle("readOnly"),toggle("disabled")],
  "file-meta": [select("variant", ["chip", "plain"], "chip"),select("format", ["PDF", "PNG", "SVG", "ZIP", "none"], "PDF"),select("size", ["0", "18400", "850000", "2400000"], "2400000"),toggle("showSize",true)],
  "file-name": [select("overflow", ["wrap", "truncate"], "wrap"),toggle("longName",true),toggle("linked"),{...toggle("narrow",true),label:"Narrow width"}],
  "file-item": [select("density", ["compact", "comfortable"], "comfortable"),select("nameOverflow", ["wrap", "truncate"], "wrap"),select("thumbnail",filePreviewImages,"none"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("showDownload"),toggle("longName"),toggle("disabled")],
  "file-thumbnail": [select("presentation",["inline","tile"],"inline"),select("image",filePreviewImages,"image"),select("fit",["cover","contain"],"contain")],
  "file-card": [select("thumbnail",["image","none","unavailable"],"image"),select("thumbnailPlacement",["top","body"],"top"),select("previewPlacement",["footer","thumbnail"],"footer"),{...select("fit",["cover","contain"],"contain"),label:"Thumbnail fit"},{...select("ratio",["4:3","16:9","1:1"],"4:3"),label:"Thumbnail ratio"},select("nameOverflow",["wrap","truncate"],"truncate"),select("density",["compact","comfortable"],"compact"),toggle("showSize",true),toggle("showType",true),toggle("showDownload",true),toggle("showPreview",true),toggle("showRemove"),toggle("selectable"),toggle("longName"),toggle("description"),toggle("disabled"),toggle("gallery"),{...toggle("narrow"),label:"Narrow card"}],
  "file-list": [select("appearance", ["panel", "plain", "embedded"], "panel"),select("density", ["compact", "comfortable"], "comfortable"),select("nameOverflow", ["wrap", "truncate"], "wrap"),select("metadataVariant", ["chip","plain"], "chip"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("longName"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "upload-item": [select("state", ["queued", "uploading", "paused", "processing", "success", "error", "cancelled"], "uploading"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),select("nameOverflow", ["wrap", "truncate"], "wrap"),toggle("longName"),toggle("showThumbnail"),toggle("showActions",true),{...toggle("allowPause"),label:"Allow pause"},toggle("disabled")],
  "upload-list": [select("density", ["compact", "comfortable"], "comfortable"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),select("nameOverflow", ["wrap", "truncate"], "wrap"),toggle("longName"),toggle("showActions",true),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"},{...toggle("longStatus"),label:"Long status"}],
  "upload-queue": [select("density",["compact","comfortable"],"compact"),select("maxListHeight",["8rem","12rem","18rem"],"18rem"),{...toggle("showExamples",true),label:"Show sample files"}],
  "image-preview": [select("image", ["brand", "missing"], "brand"),toggle("showCaption",true),toggle("zoomable",true),toggle("showDownload"),toggle("disabled")],
  "image-gallery": [select("navigation",["arrows","thumbnails"],"arrows"),toggle("zoomable"),toggle("showDownload"),{...toggle("missingImage"),label:"Include unavailable image"}],
  "data-table": [select("density", ["compact", "comfortable"], "comfortable"),select("pageSize", ["3", "5", "10", "15"], "5"),select("paginationPresentation", ["numbered", "compact", "arrows"], "numbered"),toggle("stickyHeader"),toggle("selectable",true),toggle("showResults",true),toggle("showSelection",true),{...toggle("replaceResults"),label:"Swap result count on selection"},{...toggle("cursorPages"),label:"Cursor pagination"},toggle("striped"),select("state", ["ready", "loading", "error"], "ready"),select("loadingAppearance", ["spinner", "message", "skeleton"], "spinner"),toggle("refreshing"),toggle("emptyRows"),toggle("customEmpty",true),toggle("customError")],
  "list-skeleton": [select("density", ["compact", "comfortable"], "comfortable"), select("rows", ["2", "3", "5"], "3"), toggle("media",true), toggle("description",true), toggle("metadata",true), {...toggle("reserveSelectionSpace"),label:"Reserve selection space"}, toggle("dividers"), toggle("animate",true)],
  "table-skeleton": [select("density", ["compact", "comfortable"], "comfortable"), select("rows", ["2", "3", "4", "5"], "4"), toggle("secondaryLine",true), toggle("animate",true), toggle("loaded"), toggle("striped")],
  "card-skeleton": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showMedia"), toggle("description",true), toggle("headerAction",true), toggle("footerAction",true),toggle("footerDivider",true), toggle("loaded"), toggle("animate",true)],
  "data-list": [select("density", ["compact", "comfortable"], "comfortable"),toggle("dividers",true),toggle("selectable"),{...toggle("reserveSelectionSpace"),label:"Reserve selection space"},toggle("showDescription",true),toggle("showMedia",true),toggle("showDetails"),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle"),{...toggle("narrow"),label:"Narrow panel"}],
  "data-list-item": [select("density", ["compact", "comfortable"], "comfortable"),select("layout", ["row", "content"], "row"),toggle("selectable"),toggle("showDescription",true),toggle("showMedia",true),toggle("showDetails"),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle"),{...toggle("narrow"),label:"Narrow panel"}],
  "metadata-list": [select("size", ["sm", "md"], "sm"),toggle("showIcons",true),toggle("longValue"),{...toggle("narrow"),label:"Narrow panel"}],
  "notification-item": [{...toggle("checked",true),label:"Unread"},toggle("showMedia",true),toggle("showActions",true),toggle("showDescription",true)],
  "notification-list": [select("density", ["compact", "comfortable"], "compact"),{...toggle("checked",true),label:"Unread first row"},toggle("showMedia",true),toggle("showActions",true),toggle("showDescription",true),{...toggle("constrainWidth"),label:"Narrow width"},{...toggle("longTime"),label:"Long timestamp"}],
  "notification-inbox": [select("density",["compact","comfortable"],"compact"),select("appearance",["default","overlay"],"default"),select("state",["ready","loading","error"],"ready"),toggle("showMedia",true),toggle("showMarkAll",true),{...toggle("constrainWidth"),label:"Narrow width"},toggle("empty")],
  "notification-trigger": [select("size",["sm","md","lg"],"sm"),select("variant",["ghost","subtle","outline"],"ghost"),{...select("demoUnread",["0","1","2"],"2"),label:"Unread count"},toggle("disabled")],
  "check-card": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("showDescription",true),toggle("showMetadata",true),toggle("indeterminate"),toggle("readOnly"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "radio-card": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("showDescription",true),toggle("showMetadata",true),toggle("readOnly"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "radio-card-group": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "check-card-group": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "color-swatch": [select("size", ["sm", "md", "lg"], "md"), select("value", ["#ff47a8", "#ffffff", "#78b8ff"], "#ff47a8")],
  "color-palette": [select("appearance", ["swatches", "labeled"], "swatches"), toggle("disabled"), toggle("readOnly"), toggle("disableLast")],
  "color-picker": [select("controlSize", ["sm", "md", "lg"], "md"), toggle("hideLabel"), toggle("readOnly"), toggle("disabled"), toggle("presets", true)],
  "hover-card": [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "center"), toggle("disabled")],
  "tree-select": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  tree: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("multiple"), toggle("hideLabel"), toggle("showDescriptions"), toggle("readOnly"), toggle("disabled"), toggle("loading"), toggle("empty")],
  "navigation-tree": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["introduction", "installation", "button"], "installation"), toggle("branchGuides", true), toggle("disableLast"), toggle("loading")],
  "context-menu": [select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("disabled")],
  "error-summary": [select("appearance", ["banner", "inline"], "banner"), select("announcement", ["off", "polite", "assertive"], "off"), toggle("showErrors", true), {...toggle("showFormError"),label:"Form-wide error"}, toggle("showDescription"), toggle("autoFocus")],
  "resizable-panels": [select("orientation", ["horizontal", "vertical"], "horizontal"), {...select("defaultValue", ["30", "50", "70"], "50"),label:"Initial split"}, toggle("disabled")],
  "range-calendar": [select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "date-range-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "time-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  calendar: [select("granularity", ["day", "month", "year"], "day"),toggle("showViewControls",true),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "date-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "command-list": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("hideLabel"), toggle("loading"), toggle("disabled"), toggle("disableLast", true), {...toggle("showDetails"),label:"Show details"}, {...toggle("constrainWidth"),label:"Narrow width"}],
  "command-palette": [select("density", ["comfortable", "compact"], "comfortable"), select("scenario", ["pages", "commands", "empty", "loading"], "pages"), toggle("grouped", true), toggle("disableLast", true)],
  "search-trigger": [select("variant",variants,"subtle"),select("size",sizes,"sm"),toggle("iconOnly"),toggle("fullWidth"),toggle("showShortcut",true),toggle("longLabel"),toggle("disabled")],
  editable: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), {...select("blurAction", ["commit", "cancel", "none"], "commit"),label:"On blur"}, {...toggle("showActions", true),label:"Save / cancel"}, toggle("hideLabel"), toggle("readOnly"), toggle("disabled")],
  "tag-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("maxVisibleTags",["all","0","1","2","3"],"all"),toggle("manyTags"),statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "list-box": [select("options", ["frameworks", "people"], "frameworks"), select("appearance", ["surface", "plain"], "surface"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("required"), toggle("empty"),toggle("showDescription",true),toggle("multiple"), toggle("hideLabel"), toggle("readOnly"), toggle("disabled"), {...toggle("manyOptions"),label:"More options"}],
  "pin-input": [select("length", ["4", "6", "8"], "6"), select("mode", ["numeric", "alphanumeric"], "numeric"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("mask"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  rating: [select("max", ["3", "5", "10"], "5"), select("size", ["sm", "md", "lg"], "md"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "rating-value": [select("appearance", ["stars", "compact"], "stars"), select("value", ["4.7", "3.5", "0", "unrated"], "4.7"), select("max", ["5", "10"], "5"), select("size", ["sm", "md", "lg"], "md"), toggle("showValue", true), toggle("showCount", true)],
  "rating-summary": [select("scenario", ["rated", "single", "empty", "ten-star"], "rated"), select("layout", ["auto", "stacked"], "auto"), {...toggle("narrow"),label:"Narrow panel"}],
  dropzone: [select("density",["comfortable","compact"],"comfortable"),toggle("multiple", true), toggle("clearable", true), toggle("required"), toggle("disabled")],
  "file-drop-target": [toggle("multiple",true),toggle("disabled")],
  "character-count": [select("count", ["0", "24", "40", "48"], "24"), select("mode", ["count", "remaining"], "count")],

  "navigation-list": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["overview", "activity", "settings"], "overview"), toggle("grouped", true), toggle("showDescriptions")],
  steps: [select("orientation", ["horizontal", "vertical"], "horizontal"), select("currentValue", ["details", "access", "review"], "access"), {...toggle("narrow"), label:"Narrow panel"}, toggle("interactive"), toggle("error"), toggle("disableLast")],
  "step-progress": [select("step", ["1", "2", "3"], "2")],
  "page-header": [select("headingSize", ["page", "large", "display"], "large"), toggle("showDescription"), toggle("showActions", true)],
  section: [{...select("headingLevel", ["2", "3", "4", "5", "6"], "2"),label:"Heading level (HTML)"}, {...select("headingSize", ["group", "section", "page", "large", "display"], "section"),label:"Heading size"}, toggle("showDescription", true), toggle("showActions", true)],
  split: [select("side", ["start", "end"], "end"), select("ratio", ["balanced", "main", "aside"], "main"), select("collapseAt", ["sm", "md", "lg", "never"], "sm"), select("gap", spaces, "6")],
  center: [toggle("inline"), select("maxWidth", ["16rem", "24rem", "100%"], "16rem"), select("minHeight", ["8rem", "12rem", "16rem"], "12rem")],
  "skip-link": [],

  "avatar-group": [select("size", ["sm", "md", "lg"], "md"), select("max", ["2", "3", "4", "5"], "4"), select("overflowPresentation", ["count", "popover"], "count"), select("spacing", ["auto", "separated"], "auto"), select("layout", ["wrap", "fit"], "wrap"), {...toggle("constrainWidth"),label:"Narrow width"}, toggle("presence"), toggle("longNames"), {...toggle("manyPeople"),label:"More people"}],
  "author-meta": [select("size", ["sm", "md"], "md"), {...toggle("metadata", true), label:"Show metadata"}, select("metadataPlacement", ["below","inline"], "below"), select("nameOverflow",["wrap","truncate"],"wrap"), toggle("presence"), {...toggle("longName"), label:"Long name"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  comment: [select("size", ["sm", "md"], "md"), select("actionVisibility", ["on-interaction", "always"], "on-interaction"), {...toggle("metadata", true), label:"Show timestamp"}, {...toggle("showAttachment"), label:"Show attachment"}, {...toggle("showReaction", true), label:"Existing reactions"}, {...toggle("showActions", true), label:"Show actions"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("longMessage"), label:"Long message"}],
  "reaction-picker": [toggle("disabled"), {...toggle("showReaction"), label:"Existing reactions"}],
  "reaction-button": [toggle("checked"), toggle("disabled")],
  "comment-thread": [select("size", ["sm", "md"], "sm"), select("actionVisibility", ["on-interaction", "always"], "on-interaction"), toggle("dividers"), {...toggle("showActions", true), label:"Show actions"}, {...toggle("showComposer", true), label:"Show composer"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  "comment-composer": [{...toggle("replyContext", true), label:"Reply context"}, toggle("disabled")],
  "status-indicator": [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "success"), select("size", ["sm", "md", "lg"], "md"), select("presentation", ["label", "chip", "icon", "wrap"], "label"), {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("showPeers"), label:"Compare with Badge and Tag"}, {...toggle("announce"), label:"Announce to screen readers"}],
  figure: [select("captionPosition", ["before", "after"], "after"), toggle("showCaption", true)],
  blockquote: [toggle("attribution", true)],
  "inline-code": [select("size", ["sm", "md", "lg"], "md"), toggle("wrap", true), toggle("longValue")],
  metric: [select("state", ["ready", "loading", "unavailable"], "ready"), select("size", ["sm", "md", "lg"], "md"), select("direction", ["up", "down", "flat"], "up"), select("tone", ["neutral", "success", "warning", "error", "info"], "success"), toggle("trend", true), toggle("hint", true),{...toggle("showUnit"),label:"Show unit"}],
  "metric-delta": [select("variant",["plain","chip"],"plain"), select("direction",["up","down","flat"],"down"), select("tone",["neutral","success","warning","error","info","accent"],"neutral"), {...toggle("showContext",true),label:"Show period"}],
  "metric-card": [select("state", ["ready", "loading", "unavailable"], "ready"), select("layout", ["inline", "stacked"], "inline"), select("size", ["sm", "md", "lg"], "md"), select("comparisonStyle", ["plain", "chip"], "plain"), {...select("chartState", ["follow metric", "ready", "loading"], "follow metric"),label:"Chart state"}, toggle("showChart",true), toggle("showComparison",true), {...toggle("narrow"),label:"Narrow card"}],
  "metric-group": [select("scenario", ["ready", "mixed", "loading"], "ready"), select("appearance", ["plain", "panel"], "plain"), select("layout", ["grid", "rows"], "grid"), select("size", ["sm", "md", "lg"], "sm"), {...toggle("longLabel"),label:"Long label"}, {...toggle("showComparison",true),label:"Show comparison"}, {...toggle("narrow"),label:"Narrow panel"}],
  sparkline: [select("size", ["sm", "md"], "md"), select("tone", ["neutral", "accent", "success", "warning", "error"], "accent"), select("variant", ["line", "area"], "area"), select("series", ["rising", "falling", "gaps"], "rising"), toggle("showLabel")],
  "line-chart": [select("variant", ["line", "area"], "area"), select("curve", ["linear", "smooth"], "smooth"), select("data", ["complete", "month", "gap", "single", "empty"], "complete"), toggle("comparison", true), {...toggle("showYAxis"), label:"Y axis"}, {...toggle("showLegend"), label:"Legend"}],
  "bar-chart": [select("layout", ["grouped", "stacked", "percent"], "grouped"), select("data", ["complete", "missing", "signed", "zero", "empty"], "complete"), toggle("comparison", true), {...toggle("showLegend"), label:"Legend"}],
  "donut-chart": [select("data", ["complete", "single", "zero", "empty"], "complete"), {...toggle("showLegend"), label:"Legend"}],
  "composition-bar": [select("layout", ["inline", "rows"], "inline"), select("readout", ["value", "share", "both"], "value"), select("data", ["complete", "long labels", "small share", "zero", "empty"], "complete"), {...toggle("narrow"), label:"Narrow width"}],
  "heatmap": [select("data", ["complete", "gaps", "empty"], "complete")],
  "scatter-chart": [select("data", ["complete", "single", "empty"], "complete")],
  "range-chart": [select("data", ["complete", "gap", "empty"], "complete"), {...toggle("midpoint", true), label:"Median"}],
  "dumbbell-chart": [select("data", ["complete", "missing", "empty"], "complete")],
  "box-plot": [select("data", ["complete", "gap", "flat", "empty"], "complete"), {...toggle("outliers", true), label:"Outliers"}],
  "bullet-chart": [select("data", ["complete", "zero", "empty"], "complete")],
  "waterfall-chart": [select("data", ["complete", "signed", "empty"], "complete")],
  "histogram": [select("data", ["complete", "zero", "empty"], "complete")],
  "bar-list": [select("tone", ["accent", "neutral"], "accent"), select("data", ["ranked", "zero", "empty"], "ranked")],
  timeline: [select("mode", ["activity", "progress"], "activity"), select("layout", ["feed", "schedule", "stacked"], "feed"), select("density", ["compact","comfortable"], "comfortable"), toggle("descriptions", true), toggle("times", true), {...toggle("constrainWidth"), label:"Narrow width"}],
  "activity-timeline": [select("density", ["compact","comfortable"], "compact"), {...toggle("descriptions", true), label:"Event details"}, toggle("times", true), {...toggle("constrainWidth"), label:"Narrow width"}, toggle("empty")],

  "copy-button": [select("size", sizes, "md"), select("variant", variants, "subtle"), toggle("iconOnly"), toggle("disabled")],
  "copyable-value": [select("appearance", ["text", "code"], "text"), select("overflow", ["wrap", "truncate"], "wrap"), toggle("longValue"), {...toggle("constrainWidth"), label:"Narrow width"}],
  "reveal-value": [select("appearance",["text","code"],"code"),select("overflow",["wrap","truncate"],"truncate"),toggle("allowCopy",true),toggle("longValue"),{...toggle("constrainWidth"),label:"Narrow width"}],
  "toast-region": [select("status", ["success", "info", "warning", "error", "neutral"], "success"), select("limit", ["1", "2", "3"], "3"), select("placement", ["bottom-end", "bottom-start", "top-end", "top-start"], "bottom-end"), toggle("inline"), toggle("autoDismiss"), {...toggle("longText"),label:"Long message"}, {...toggle("showAction"),label:"Show action"}],
  "file-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("multiple", true), toggle("clearable", true), statusKnob(), toggle("required"), toggle("disabled")],
  "file-trigger": [select("presentation", ["button", "icon"], "button"), toggle("multiple", true), toggle("imagesOnly"), toggle("disabled")],
  "avatar-picker": [select("source", ["stored", "initials"], "stored"), select("size", ["sm", "md", "lg"], "lg"), select("shape", ["circle", "rounded"], "circle"), toggle("removable", true), toggle("busy"), toggle("disabled")],
  "search-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("clearable", true), statusKnob(), toggle("disabled"), toggle("readOnly")],
  "password-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  "field-checklist": [select("scenario", ["pending", "mixed", "met"], "mixed"), {...toggle("constrainWidth"),label:"Narrow width"}],
  "password-strength": [select("scenario", ["pending", "fair", "strong"], "fair"), {...toggle("showRequirements",true),label:"Show requirements"}, {...toggle("constrainWidth"),label:"Narrow width"}],
  tag: [select("size", ["sm", "md", "lg"], "md"), toggle("removable", true), toggle("icon"), toggle("avatar"), toggle("longLabel"), toggle("disabled"), toggle("visible", true)],
  "tag-group": [select("size", ["sm", "md", "lg"], "md"), select("content", ["filters", "people"], "filters"), {...select("maxVisibleTags", ["all", "2", "3"], "2"), label:"Visible tags"}, toggle("removable", true), toggle("narrow"), toggle("disabled")],
  "multi-select": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("options", ["frameworks", "people"], "frameworks"), select("maxVisibleTags",["all","0","1","2","3"],"all"),toggle("manyTags"),toggle("clearable"), statusKnob(), toggle("required"), toggle("disabled"), toggle("readOnly"), toggle("disableLast"), toggle("longLabels")],
  combobox: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("options", ["frameworks", "people"], "frameworks"), toggle("clearable"), statusKnob(), toggle("required"), toggle("disabled"), toggle("readOnly"), toggle("disableLast")],
  "number-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("appearance", ["stepper", "plain"], "stepper"), select("step", ["1", "0.1", "5"], "1"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  "number-range-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("example", ["filled", "empty", "reversed"], "filled"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  slider: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("range"), select("step", ["1", "5", "10"], "1"), select("valuePlacement", ["below-label", "inline"], "below-label"), {...toggle("showValue", true), label:"Show value"}, statusKnob(), toggle("disabled"), toggle("readOnly")],
  container: [select("size", ["sm", "md", "lg", "full"], "lg"), select("gutter", spaces, "6")],
  grid: [select("columns", ["auto", "1", "2", "3", "4", "6"], "auto"), select("minItemWidth", ["10rem", "16rem", "24rem"], "16rem"), select("gap", spaces, "4")],
  "visually-hidden": [toggle("focusable")],
  "aspect-ratio": [select("ratio", ["1", "1.3333333333333333", "1.7777777777777777", "2"], "1.7777777777777777")],
  "image-comparison": [select("fit", ["contain", "cover"], "contain"), select("direction", ["ltr", "rtl"], "ltr"), toggle("disabled"), {...toggle("narrow"),label:"Narrow preview"}],
  image: [select("fit", ["cover", "contain"], "cover"), toggle("decorative")],
  list: [toggle("ordered"), toggle("marker", true), select("gap", spaces, "2")],
  "empty-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription", true), toggle("showIcon", true), toggle("showActions", true)],
  "no-results": [select("layout", ["row", "inline", "centered"], "row"), select("density", ["compact", "comfortable"], "compact"), toggle("showReset", true), {...toggle("narrow"), label:"Narrow width"}],
  "error-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription", true), toggle("showRetry", true), toggle("retrying")],
  card: [select("density", ["compact", "comfortable"], "comfortable"), select("elevation", ["default", "raised"], "default"), select("headingSize", ["group","section","page"],"section"),toggle("showMedia"), toggle("showTitle", true), toggle("showDescription", true), toggle("showActions", true),toggle("longHeader"), toggle("showFooter", true), toggle("footerDivider",true),toggle("selectable"),toggle("selectionDisabled"),{...toggle("narrow"),label:"Narrow panel"}],
  toolbar: [select("variant",["contained","plain"],"contained"),select("shape",["rounded","pill"],"rounded"),select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("loop", true), toggle("disableUndo")],
  kbd: [select("size", ["sm", "md", "lg"], "sm")],
  "keyboard-shortcut": [select("size",["sm","md","lg"],"sm"),select("presentation",["keys","compact"],"keys"),select("example",["two keys","three keys","macOS glyphs"],"three keys"),toggle("rtl")],
  menu: [{...select("scenario", ["actions", "preferences", "mixed", "submenus"], "actions"),label:"Example"}, select("controlSize", ["sm", "md", "lg", "xl"], "sm"), select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("icons", true), toggle("shortcuts"), toggle("iconTrigger"), toggle("disableArchive", true), toggle("disabled")],
  "description-list": [select("layout", ["inline", "columns", "stacked", "grid"], "inline"), select("density", ["compact", "comfortable"], "compact"), toggle("dividers"), toggle("longValue"), {...toggle("truncateValue"),label:"Truncate owner"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("showActions"), label:"Copy actions"}],
  "value-change": [select("layout", ["inline", "adaptive", "stacked"], "inline"), {...select("scenario", ["status", "assignee", "added", "removed"], "status"), label:"Change"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  "change-list": [select("layout", ["inline", "columns", "stacked"], "inline"), select("valueLayout", ["inline", "adaptive", "stacked"], "inline"), select("density", ["compact","comfortable"], "compact"), toggle("dividers"), {...toggle("constrainWidth"), label:"Narrow width"}],
  "comparison-table": [select("density", ["compact","comfortable"], "comfortable"), {...toggle("highlightCurrent",true),label:"Highlight current plan"}, {...toggle("constrainWidth"),label:"Narrow width"}],
  table: [select("density", ["compact", "comfortable"], "comfortable"), select("cellVerticalAlign", ["top", "middle", "bottom"], "middle"), toggle("striped"), toggle("hideCaption"), select("minWidth", ["auto", "32rem", "48rem"], "32rem"), toggle("empty"), toggle("footer", true)],
  progress: [select("layout", ["stacked", "inline"], "stacked"), select("value", ["0", "25", "50", "75", "100"], "50"), toggle("indeterminate"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "accent"), toggle("showValue", true), {...toggle("narrow"),label:"Narrow width"}],
  meter: [select("layout", ["stacked", "inline"], "stacked"), select("value", ["0", "25", "50", "75", "100"], "50"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "neutral"), toggle("showValue", true), toggle("reference"), {...toggle("narrow"),label:"Narrow width"}],
  "capacity-meter": [select("used", ["0", "58", "90", "100", "112"], "90"), select("layout", ["stacked", "inline"], "stacked"), select("size", ["sm", "md", "lg"], "md"), {...toggle("narrow"),label:"Narrow width"}],
  "progress-ring": [select("value", ["0", "25", "50", "75", "100"], "50"), toggle("indeterminate"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "accent"), toggle("showValue", true), {...toggle("narrow"),label:"Narrow width"}],
  alert: [select("tone", ["neutral", "info", "success", "warning", "error"], "info"), select("appearance", ["banner", "inline"], "banner"), select("announcement", ["off", "polite", "assertive"], "off"), toggle("showTitle", true), toggle("showIcon", true), toggle("showAction", false), {...toggle("narrow"),label:"Narrow panel"}],
  badge: [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "neutral"), select("variant", ["subtle", "outline"], "subtle"), select("size", ["sm", "md", "lg"], "md")],
  "count-badge": [select("count", ["0", "4", "24", "99", "137"], "137"), select("presentation", ["count", "dot"], "count"), select("max", ["9", "99"], "99"), {...toggle("showZero"), label:"Show zero"}],
  spinner: [select("size", ["sm", "md", "lg"], "md"), toggle("decorative")],
  "loading-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription"), toggle("announce")],
  skeleton: [select("shape", ["text", "rounded", "circle"], "text"), toggle("animate", true)],
  avatar: [select("size", ["2xs", "xs", "sm", "md", "lg"], "md"), select("shape", ["circle", "rounded"], "circle"), select("image", ["loaded", "missing", "broken"], "loaded"), select("presence", ["none", "online", "away", "busy", "offline"], "none"), toggle("decorative")],
  tabs: [select("variant", ["contained", "line"], "contained"), select("activationMode", ["automatic", "manual"], "automatic"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("showCounts"), {...toggle("narrow"),label:"Narrow width"}, toggle("disabled"), toggle("disableLast")],
  breadcrumb: [select("layout",["wrap","compact"],"wrap"),select("separator", ["/", "›"], "/"),select("maxVisibleItems",["2","3","4"],"2"),toggle("deepPath"),toggle("longTitle"),toggle("currentLink"),{...toggle("narrow"),label:"Narrow panel"}],
  pagination: [select("presentation", ["numbered", "compact", "arrows"], "numbered"), select("pageCount", ["1", "5", "20", "100"], "20"), select("siblingCount", ["0", "1", "2"], "1"), select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("links"), toggle("disabled"), {...toggle("narrow"),label:"Narrow panel"}, {...toggle("localizedNumbers"),label:"Localized digits"}],
  "cursor-pagination": [select("variant", ["subtle","ghost"], "subtle"), select("controlSize", ["sm", "md", "lg", "xl"], "sm"), select("request", ["idle","previous","next"], "idle"), {...toggle("showPosition", true), label:"Show range"}, toggle("rtl")],
  tooltip: [select("side", ["top", "bottom", "left", "right"], "top"), select("align", ["start", "center", "end"], "center"), select("delay", ["0", "150", "300", "600"], "300"), toggle("disabled")],
  popover: [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("defaultOpen"), toggle("disabled")],
  "help-tip": [select("side", ["top", "bottom", "left", "right"], "top"), toggle("disabled")],
  "alert-dialog": [toggle("defaultOpen"), toggle("confirmDisabled"), toggle("disabled")],
  drawer: [select("side", ["start", "end", "top", "bottom"], "end"), select("size", ["sm", "md", "lg"], "md"), toggle("showFooter", true), toggle("longContent"), toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  sheet: [select("size", ["sm", "md", "lg"], "md"), toggle("showFooter"), toggle("longContent"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  dialog: [toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  collapsible: [select("variant", ["framed", "flush"], "framed"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("defaultOpen"), toggle("disabled")],
  accordion: [select("variant", ["framed", "flush"], "framed"), select("expansionMode", ["single", "multiple"], "single"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("headingLevel", ["2", "3", "4", "5", "6"], "3"), toggle("disabled"), toggle("disableLast")],
  "segmented-control": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("content", ["text", "counts", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("fullWidth"), toggle("disabled"), toggle("disableLast")],
  toggle: [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("defaultPressed"), toggle("iconOnly"), toggle("disabled"), toggle("loading")],
  "toggle-group": [select("selectionMode", ["single", "multiple"], "multiple"), select("content", ["text", "icons", "mixed"], "mixed"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("disableLast")],
  "scroll-area": [select("orientation", ["vertical", "horizontal", "both"], "vertical"), select("contentInset", ["scrollbar", "none"], "scrollbar")],
  "button-group": [select("content", ["text", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled")],
  "split-button": [select("variant", ["solid", "subtle", "outline"], "solid"), select("size", sizes, "md"), toggle("disabled"), toggle("primaryDisabled")],
  "input-group": [select("start", ["https://", "+7", "@", "$", "icon", "action", "none"], "https://"), select("end", ["action", "icon-action", "kg", "USD", "%", "@company.com", "none"], "action"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  button: [select("tone", ["default", "danger"], "default"), select("variant", variants, "solid"), select("size", sizes, "md"), toggle("disabled"), toggle("loading"), {...toggle("retainFocus"),label:"Keep focus while loading"}],
  "icon-button": [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  "icon-link": [select("variant", variants, "subtle"), select("size", sizes, "md")],
  input: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  select: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled")],
  textarea: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  checkbox: [toggle("indeterminate"), toggle("checked", true), toggle("hideLabel"), toggle("disabled")],
  radio: [toggle("checked", true), toggle("disabled")],
  switch: [select("layout", ["inline", "row"], "inline"), toggle("checked", true), toggle("disabled"), toggle("readOnly"), toggle("description")],
  "switch-group": [select("density", ["compact", "comfortable"], "comfortable"), toggle("dividers"), toggle("description",true), toggle("disabled"), {...toggle("narrow"),label:"Narrow panel"}],
  "setting-row": [select("layout",["adaptive","inline","stacked"],"adaptive"), select("valueOverflow",["wrap","truncate"],"wrap"), toggle("description", true), {...toggle("showAction", true), label:"Show action"}, {...toggle("showValue"),label:"Show value"}, {...toggle("longValue"),label:"Long value"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  "setting-group": [select("density",["compact","comfortable"],"comfortable"), toggle("dividers"), {...toggle("constrainWidth"),label:"Narrow width"}],
  text: [select("size", ["lead", "body", "compact", "label", "helper"], "body"), select("tone", ["default", "subtle", "error", "success", "warning", "info"], "default")],
  "expandable-text": [select("lines", ["2", "3", "4"], "3"), select("size", ["body", "compact"], "body"), {...toggle("constrainWidth"),label:"Narrow width"}, {...toggle("shortText"),label:"Short text"}],
  "truncated-text": [select("tooltipSide", ["bottom","top","left","right"], "bottom"), {...toggle("constrainWidth",true),label:"Narrow width"}, {...toggle("shortText"),label:"Short text"}],
  timestamp: [select("format", ["date", "time", "date-time"], "date-time"), select("locale", ["en", "en-GB", "ru-RU"], "en"), select("timeZone", ["UTC", "America/New_York"], "UTC"), select("size", ["helper", "compact"], "helper"), {...toggle("relativeTo"), label:"Relative time"}],
  heading: [select("size", ["display", "large", "page", "section", "group"], "page"), select("level", ["1", "2", "3", "4", "5", "6"], "2")],
  stack: [select("gap", spaces, "4")],
  inline: [select("gap", spaces, "4"), select("align", ["start", "center", "end", "baseline"], "center")],
  surface: [select("elevation", ["default", "raised", "overlay"], "default"), select("padding", spaces, "6")],
  "icon-slot": [select("size", sizes, "md"), { name: "label", initial: "" }],
  "code-snippet": [select("codeDirection", ["ltr", "rtl", "auto"], "ltr"), { name: "code", initial: `npx @flood-md/cli@${release.version} init` }, toggle("showPrompt", true), toggle("copyAction", true)],
  label: [toggle("required")],
  "message-composer": [select("layout", ["stacked", "compact"], "stacked"), {...toggle("replyContext"), label:"Reply context"}, toggle("allowAttachments", true), {...select("maxVisibleAttachments", ["all", "2", "3"], "2"), label:"Visible files"}, toggle("disabled")],
  "radio-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled"), toggle("required")],
  "checkbox-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled")],
  fieldset: [select("legendSize", ["label", "section"], "label"), select("layout", ["stacked", "aligned"], "stacked"), statusKnob(), toggle("disabled"), toggle("hint", true), toggle("showHelp"), {...toggle("constrainWidth"), label:"Narrow width"}],
  field: [select("layout",["stacked","adaptive"],"stacked"),statusKnob(), toggle("required", true), toggle("error", true), toggle("hint", true), toggle("showHelp")],
  "form-actions": [select("layout", ["auto", "status-below", "stacked"], "auto"), select("align", ["start", "end"], "end"), toggle("showSecondary",true), toggle("showStatus",true), {...toggle("constrainWidth"),label:"Narrow width"}],
  "save-status": [select("state", ["idle","dirty","saving","saved","error"], "saved"), toggle("announce",true)],
  link: [select("variant", ["text", ...variants], "text"), select("size", sizes, "md")], divider: [], "flood-root": [],
};
const avatarPresenceExamples = [
  {state:"online", label:"Online"},
  {state:"away", label:"Away"},
  {state:"busy", label:"Busy"},
  {state:"offline", label:"Offline"},
] as const;

function componentKnobs(component: ComponentPage): Knob[] {
  const labelHosts = ["file-input", "search-input", "password-input", "multi-select", "combobox", "field", "fieldset", "radio-group", "checkbox-group", "segmented-control", "input", "input-group", "number-input", "slider", "textarea", "select", "progress", "progress-ring", "meter"];
  const source = [...(knobs[component.slug] ?? []), ...(labelHosts.includes(component.slug) ? [{...toggle("hideLabel"), label: "Hide label"}] : [])];
  return source.map(knob => {
    const prop = component.contract?.props.find(item => item.name === knob.name);
    const options = knob.options && prop?.options?.length ? (knob.name === "status" ? ["none", ...prop.options.map(String)] : knob.name === "columns" ? ["auto", ...prop.options.map(String)] : prop.options.map(String)) : knob.options;
    const value = component.slug === "accordion" && knob.name === "headingLevel" ? 2
      : component.slug === "list-skeleton" && ["media","description","metadata"].includes(knob.name) ? knob.initial
      : component.slug === "card-skeleton" && ["description","headerAction","footerAction"].includes(knob.name) ? knob.initial
      : prop?.defaultLiteral;
    const initial = value === undefined ? knob.initial : typeof knob.initial === "boolean" ? (typeof value === "boolean" ? value : knob.initial) : String(value);
    return { ...knob, options, initial };
  });
}
const initialValues = (component: ComponentPage): Values => Object.fromEntries(componentKnobs(component).map(knob => [knob.name, knob.initial]));
const registry = { ...Flood, Plus, ArrowRight, Copy, Undo2, Redo2, History, Bold, Italic, Underline, Share2 } as unknown as Record<string, Parameters<typeof createElement>[0]>;
const isBinding = (value: unknown): value is Binding => Boolean(value && typeof value === "object" && "expression" in value && "value" in value);

function renderRecipe(node: ElementRecipe, extraProps: Record<string, unknown> = {}): ReactNode {
  const props = Object.fromEntries(Object.entries(node.props ?? {}).map(([key, value]) => [key, isBinding(value) ? value.value : value]));
  if (node.previewClassName) props.className = [props.className, node.previewClassName].filter(Boolean).join(" ");
  const tag = registry[node.tag] ?? node.tag;
  const rendered = node.field ? createElement(tag, props, ((control: Record<string, unknown>) => renderRecipe(node.field!, control)) as unknown as ReactNode)
    : createElement(tag, { ...extraProps, ...props }, ...(node.children ?? []).map((child, index) => typeof child === "string" ? child : isBinding(child) ? child.value as ReactNode : createElement(Fragment, { key: index }, renderRecipe(child))));
  return node.previewSlot ? createElement("div", {style:node.previewSlot}, rendered) : rendered;
}

function printRecipe(node: ElementRecipe, imports: Set<string>, icons: Set<string>, depth = 0): string {
  if (node.tag in Flood) imports.add(node.tag);
  if (["Plus", "ArrowRight", "Copy", "Undo2", "Redo2", "History", "Bold", "Italic", "Underline", "Share2"].includes(node.tag)) icons.add(node.tag);
  const pad = "  ".repeat(depth);
  const props = Object.entries(node.props ?? {}).filter(([key, value]) => value !== undefined && !(value === false && ["disabled", "loading", "invalid", "readOnly", "required", "hideLabel"].includes(key))).map(([key, value]) => {
    if (isBinding(value)) return `${key}={${value.expression}}`;
    return typeof value === "string" && !/[\\"<>&\n\r]/.test(value) ? `${key}=${JSON.stringify(value)}` : `${key}={${JSON.stringify(value)}}`;
  }).join(" ");
  const open = `<${node.tag}${props ? ` ${props}` : ""}>`;
  if (node.field) {
    const child = printRecipe(node.field, imports, icons, depth + 2).trimStart().replace(`<${node.field.tag}`, `<${node.field.tag} {...control}`);
    return `${pad}${open}\n${pad}  {(control) => (\n${"  ".repeat(depth + 2)}${child}\n${pad}  )}\n${pad}</${node.tag}>`;
  }
  const children = node.children ?? [];
  if (!children.length) return `${pad}${open.slice(0, -1)} />`;
  const printText = (text: string) => /^[^<>{}&\n\r]+$/.test(text) && text.trim() === text ? text : `{${JSON.stringify(text)}}`;
  if (children.length === 1 && typeof children[0] === "string") return `${pad}${open}${printText(children[0])}</${node.tag}>`;
  return `${pad}${open}\n${children.map((child) => typeof child === "string" ? `${pad}  ${printText(child)}` : isBinding(child) ? `${pad}  {${child.expression}}` : printRecipe(child, imports, icons, depth + 1)).join("\n")}\n${pad}</${node.tag}>`;
}

function budgetRangeExample(example: unknown): [number | null, number | null] {
  if (example === "empty") return [null, null];
  return example === "reversed" ? [5000, 1200] : [1200, 5000];
}

interface PreviewActions {
  palette: {value: string; select: (color: string) => void};
  avatarPicker: { file: File | null | undefined; error: string; select: (file: File) => void; remove: () => void };
  budgetRange: { values: [number | null, number | null]; set: (index: 0 | 1, value: number | null) => void };
  composer: {
    draft: string;
    setDraft: (value: string) => void;
    streaming: boolean;
    setStreaming: (value: boolean) => void;
    attachments: Flood.MessageAttachment[];
    addFiles: (files: File[]) => void;
    removeFile: (id: string) => void;
    send: () => void;
  };
  thread: {
    replies: Array<{id: string; body: string}>;
    submit: () => void;
    cancel: () => void;
    openFrom: (event: MouseEvent<HTMLButtonElement>) => void;
    focusEditor: (form: HTMLFormElement | null) => void;
  };
  reactions: { selected: readonly string[]; set: (id: string, pressed: boolean) => void };
  inbox: {unread: Readonly<Record<string, boolean>>; set: (id: string, unread: boolean) => void; markAll: () => void; retry: () => void};
  phone?: boolean;
  projectEdits: ProjectEdits;
  setProjectEdit: (id: string, field: ProjectEditField, value: string) => void;
  listSelection: Readonly<Record<string, boolean>>;
  setListSelection: (id: string, checked: boolean) => void;
  shellDrawerOpen:boolean;
  setShellDrawerOpen:(open:boolean)=>void;
  navValue:string;
  setNavValue:(value:string)=>void;
  setCollapsed:(value:boolean)=>void;
  restoreTable:()=>void;
  viewValue:string;
  setViewValue:(value:string)=>void;
  toolbarSearch: string;
  setToolbarSearch: (value:string)=>void;
  toolbarOpen: boolean;
  setToolbarOpen: (value:boolean)=>void;
  draftFilters: Flood.FilterGroupValue;
  setDraftFilters: (value:Flood.FilterGroupValue)=>void;
  filterGroup: Flood.FilterGroupValue;
  setFilterGroup: (value: Flood.FilterGroupValue) => void;
  filterValue: Flood.FilterConditionValue;
  setFilterValue: (value: Flood.FilterConditionValue) => void;
  fileStates: Record<string,string>;
  uploadQueue: {
    selected: {id:string; name:string; size:number}[];
    add: (files:File[])=>void;
    remove: (id:string)=>void;
  };
  removedTagIds: readonly string[];
  removeTag: (id: string) => void;
  setFileState: (id:string,state:string)=>void;
  menuChecked: boolean;
  setMenuChecked: (checked: boolean) => void;
  menuDensity: string;
  setMenuDensity: (density: string) => void;
  notifications: Flood.ToastItem[];
  retryToast: (id: string) => void;
  addToast: () => void;
  dismissToast: (id: string) => void;
  status: string;
  setStatus: (status: string) => void;
  checked: (value: boolean) => void;
  visible: (value: boolean) => void;
  copy: () => void;
  page: number;
  setPage: (page: number) => void;
}

function recipeFor(slug: string, values: Values, actions: PreviewActions): ElementRecipe {
  const v = values;
  const help = (label: string, content: string) => binding(
    `<HelpTip label={${JSON.stringify(label)}} content={${JSON.stringify(content)}}${slug === "help-tip" ? ` side={${JSON.stringify(v.side)}} disabled={${Boolean(v.disabled)}}` : ""} />`,
    <Flood.HelpTip label={label} content={content} side={slug === "help-tip" ? v.side as Flood.HelpTipProps["side"] : undefined} disabled={Boolean(v.disabled)} />,
  );
  const fieldStatus = v.invalid || (slug === "field" && v.error) ? "error" : v.status === "none" ? undefined : v.status;
  const message = ({ error: "Please review this value.", warning: "Check this value before continuing.", success: "Looks good.", info: "You can change this later." } as Record<string, string>)[String(fieldStatus)];
  const text = (value: string) => element("Text", { as: "p", size: "compact" }, value);
  const status: ElementRecipe = {
    ...element("Text", { as: "p", size: "compact", role: "status" }, binding("status", actions.status)),
    previewFeedback: true,
  };
  const action = binding('() => setStatus("Action completed locally.")', () => actions.setStatus("Action completed locally."));
  const choice = {
    checked: binding("checked", Boolean(v.checked)), disabled: Boolean(v.disabled),
    onChange: binding("(event) => setChecked(event.currentTarget.checked)", (event: { currentTarget: { checked: boolean } }) => actions.checked(event.currentTarget.checked)),
  };
  const reactionPicker = () => element("ReactionPicker", {
    options:binding("options.map(option => ({...option, selected:selected.includes(option.id)}))", reactionOptions.map(option => ({...option,selected:actions.reactions.selected.includes(option.id)}))),
    onSelect:binding("setReaction",actions.reactions.set),
    disabled:v.disabled,
  });
  const reactionChips = () => {
    const chips = reactionOptions.flatMap((option,index) => {
      const pressed = actions.reactions.selected.includes(option.id);
      const count = (v.showReaction && index < 2 ? 2 - index : 0) + Number(pressed);
      return count ? [<Flood.ReactionButton key={option.id} label={option.label} icon={option.icon} count={count}
        pressed={pressed} onPressedChange={next=>actions.reactions.set(option.id,next)} disabled={Boolean(v.disabled)} />] : [];
    });
    const code = `options.map((option, index) => {
      const pressed = selected.includes(option.id);
      const count = (${Boolean(v.showReaction)} && index < 2 ? 2 - index : 0) + Number(pressed);
      return count ? <ReactionButton key={option.id} label={option.label} icon={option.icon} count={count}
        pressed={pressed} onPressedChange={next => setReaction(option.id, next)}${v.disabled ? " disabled" : ""} /> : null;
    })`;
    return binding(code,chips);
  };
  switch (slug) {
    case "message-composer": {
      const composer = actions.composer;
      return element("MessageComposer", {
        label: v.replyContext ? "Reply" : "Message",
        placeholder: v.replyContext ? "Write a reply…" : "Write a message…",
        layout: v.layout,
        replyContext: v.replyContext ? "Replying to Maya Chen" : undefined,
        value: binding("draft", composer.draft),
        onValueChange: binding("setDraft", composer.setDraft),
        onSend: binding("send", composer.send),
        streaming: binding("streaming", composer.streaming),
        onStop: binding("() => setStreaming(false)", () => composer.setStreaming(false)),
        attachments: binding("attachments", composer.attachments),
        maxVisibleAttachments: v.maxVisibleAttachments === "all" ? undefined : Number(v.maxVisibleAttachments),
        onRemoveAttachment: binding("removeFile", composer.removeFile),
        onFilesSelect: v.allowAttachments ? binding("addFiles", composer.addFiles) : undefined,
        disabled: v.disabled,
        style: { maxInlineSize: "36rem" },
      });
    }
    case "comment-composer": return element("Stack",{gap:"3",style:{width:"26rem",maxInlineSize:"100%"}},
      element("Comment",{size:"sm",author:{name:"Maya Chen"}},
        "Could you check the export against the source file?"),
      element("CommentThread",{"aria-label":"Posted comments",hidden:binding("replies.length === 0",actions.thread.replies.length===0),items:binding(
        'replies.map(reply => ({...reply, author:{name:"Alex Morgan"}}))',
        actions.thread.replies.map(reply=>({...reply,author:{name:"Alex Morgan"}})),
      )}),
      element("CommentComposer",{
        label:binding('replying ? "Reply" : "Comment"',v.replyContext?"Reply":"Comment"),
        placeholder:binding('replying ? "Write a reply…" : "Write a comment…"',v.replyContext?"Write a reply…":"Write a comment…"),
        value:binding("draft",actions.composer.draft), onValueChange:binding("setDraft",actions.composer.setDraft),
        onSend:binding("submitReply",actions.thread.submit),
        replyContext:binding('replying ? "Replying to Maya Chen" : undefined',v.replyContext?"Replying to Maya Chen":undefined),
        onCancel:binding("replying ? () => setReplying(false) : undefined",v.replyContext?actions.thread.cancel:undefined),
        disabled:v.disabled,
      }));
    case "navigation-item": {
      const mode=String(v.mode),branch=mode==="branch"||mode==="link-branch",linked=mode==="link"||mode==="link-branch";
      const label=v.longLabel?"Projects and shared workspace resources":mode==="action"?"Project settings":"Projects";
      const icon=v.icon||v.compareStates?binding("<Folder />",createElement(Folder)):undefined;
      const trailing=v.badge||v.compareStates?binding('<Badge size="sm">4</Badge>',createElement(Flood.Badge,{size:"sm"},"4")):undefined;
      const trailingActionCode=`<Popover title="About this row" trigger={props => <IconButton {...props} label="About this row" size=${JSON.stringify(v.size)} variant="ghost"><Ellipsis /></IconButton>}>The action is separate from the destination.</Popover>`;
      const trailingAction=(v.compareStates||v.showTrailingAction&&!v.compact&&mode!=="action")?binding(trailingActionCode,
        createElement(Flood.Popover,{title:"About this row",trigger:props=>createElement(Flood.IconButton,{...props,label:"About this row",size:v.size as Flood.ContentSize,variant:"ghost"},createElement(Ellipsis))},"The action is separate from the destination.")):undefined;
      const base={label,labelOverflow:v.labelOverflow,size:v.size,variant:v.variant,compact:v.compact,current:v.current,disabled:v.disabled,icon,trailing,trailingAction};
      if(!v.compareStates&&v.compact&&branch){
        const item={value:"projects",label,icon:v.icon?createElement(Folder):undefined,disabled:Boolean(v.disabled),...(linked?{href:"#projects"}:{}),children:[{value:"design",label:"Design system",href:"#design"},{value:"website",label:"Website",href:"#website"}]};
        const itemCode=`[{value:"projects",label:${JSON.stringify(label)},${v.icon?'icon:<Folder/>,':''}disabled:${Boolean(v.disabled)},${linked?'href:"#projects",':''}children:[{value:"design",label:"Design system",href:"#design"},{value:"website",label:"Website",href:"#website"}]}]`;
        return element("div",{style:{width:"4.5rem",maxWidth:"100%"}},element("NavigationTree",{label:"Project navigation",compact:true,size:v.size,currentValue:v.current?"projects":undefined,items:binding(itemCode,[item])}));
      }
      if(!v.compareStates&&mode==="action"){
        const props={...base,icon:v.icon?createElement(Folder):undefined,trailing:v.badge?createElement(Flood.Badge,{size:"sm"},"4"):undefined};
        const propsCode=`label=${JSON.stringify(label)} labelOverflow=${JSON.stringify(v.labelOverflow)} size=${JSON.stringify(v.size)} variant=${JSON.stringify(v.variant)} compact={${Boolean(v.compact)}} current={${Boolean(v.current)}} disabled={${Boolean(v.disabled)}}${v.icon?' icon={<Folder/>}':''}${v.badge?' trailing={<Badge size="sm">4</Badge>}':''}`;
        return element("div",{style:{width:v.compact?"4.5rem":"16rem",maxWidth:"100%"}},element("Dialog",{title:"Project settings",trigger:binding(`trigger => <NavigationItem ${propsCode} actionProps={trigger} controlRef={trigger.ref} tooltip={trigger["aria-expanded"] !== true} />`,(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.NavigationItem,{...props,actionProps:trigger,controlRef:trigger.ref,tooltip:trigger["aria-expanded"]!==true} as Flood.NavigationItemProps))},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"Design system"})}));
      }
      const disclosure=branch||v.compareStates?binding('{expanded, onExpandedChange:setExpanded, label:expanded?"Collapse projects":"Expand projects", controls:expanded?"navigation-item-children":undefined}',{expanded:actions.menuChecked,onExpandedChange:actions.setMenuChecked,label:actions.menuChecked?"Collapse projects":"Expand projects",controls:actions.menuChecked?"navigation-item-children":undefined}):undefined;
      const indent=`calc(var(--flood-sys-control-${v.size}-icon-size) + var(--flood-sys-space-2))`;
      const childCode=`expanded && <Stack id="navigation-item-children" gap="1" style={{paddingInlineStart:${JSON.stringify(indent)}}}><NavigationItem label="Design system" href="#design" size=${JSON.stringify(v.size)} /><NavigationItem label="Website" href="#website" size=${JSON.stringify(v.size)} /></Stack>`;
      const child=actions.menuChecked?createElement(Flood.Stack,{id:"navigation-item-children",gap:"1",style:{paddingInlineStart:indent}},createElement(Flood.NavigationItem,{label:"Design system",href:"#design",size:v.size as Flood.ContentSize}),createElement(Flood.NavigationItem,{label:"Website",href:"#website",size:v.size as Flood.ContentSize})):null;
      if(v.compareStates){
        const row={size:v.size,variant:v.variant,icon};
        return element("Stack",{gap:"1",style:{width:"18rem",maxWidth:"100%"}},
          element("NavigationItem",{...row,label:"Overview",href:"#overview"}),
          element("NavigationItem",{...row,label:"Projects",href:"#projects",current:true,disclosure}),
          binding(childCode,child),
          element("NavigationItem",{...row,label:"Activity",href:"#activity",trailing,trailingAction}),
          element("NavigationItem",{...row,label:"Archive",href:"#archive",disabled:true}));
      }
      return element("Stack",{gap:"1",style:{width:v.compact?"4.5rem":"16rem",maxWidth:"100%"}},element("NavigationItem",{...base,href:linked?"#projects":undefined,disclosure}),...(branch?[binding(childCode,child)]:[]));
    }
    case "navigation-group": {
      const count=Number(actions.status)||2;
      const projectName=(index:number)=>["Design system","Website"][index]??`Project ${index+1}`;
      const children=Array.from({length:count},(_,index)=>createElement(Flood.NavigationItem,{key:index,label:projectName(index),href:`#project-${index+1}`,icon:createElement(Folder),size:v.size as Flood.ContentSize,compact:Boolean(v.compact)}));
      const childrenCode=`Array.from({length: projectCount}, (_,index) => <NavigationItem key={index} label={["Design system","Website"][index] ?? ("Project " + (index+1))} href={"#project-"+(index+1)} icon={<Folder/>} size=${JSON.stringify(v.size)} compact={${Boolean(v.compact)}} />)`;
      return element("div",{style:{width:v.compact?"4.5rem":"16rem",maxWidth:"100%"}},element("NavigationGroup",{label:"Projects",size:v.size,hideLabel:v.hideLabel,separator:v.separator,collapsible:v.collapsible,compact:v.compact,expanded:binding("expanded",actions.menuChecked),onExpandedChange:binding("setExpanded",actions.setMenuChecked),headingAction:v.showHeadingAction?binding(`<IconButton label="Add project" variant="ghost" size=${JSON.stringify(v.size)} iconSize="2xs" onClick={() => setProjectCount(count => count+1)}><Plus/></IconButton>`,createElement(Flood.IconButton,{label:"Add project",variant:"ghost",size:v.size as Flood.ControlSize,iconSize:"2xs",onClick:()=>actions.setStatus(String(count+1))},createElement(Plus))):undefined},binding(childrenCode,children)));
    }
    case "sidebar": {
      const groupCode=`[{id:"workspace",label:"Workspace",branchGuides:${Boolean(v.branchGuides)},items:[{value:"overview",label:"Overview",href:"#overview",icon:<House/>,linkProps:{onClick:()=>setCurrent("overview")}},{value:"activity",label:"Activity",href:"#activity",icon:<Bell/>,trailing:<Badge size="sm">4</Badge>,linkProps:{onClick:()=>setCurrent("activity")}},{value:"projects",label:"Projects",icon:<Folder/>,children:[{value:"design",label:"Design system",href:"#design",linkProps:{onClick:()=>setCurrent("design")}},{value:"website",label:"Website",href:"#website",linkProps:{onClick:()=>setCurrent("website")}}]},{value:"reports",label:"Reports",href:"#reports",icon:<ChartNoAxesColumn/>,disabled:true}]},{id:"library",label:"Library",items:[{value:"archive",label:"Archive",href:"#archive",icon:<Archive/>,linkProps:{onClick:()=>setCurrent("archive")}}${v.longNavigation?',...Array.from({length:16},(_,index)=>({value:"collection-"+index,label:"Collection "+(index+1),href:"#collection-"+index,icon:<Folder/>,linkProps:{onClick:()=>setCurrent("collection-"+index)}}))':''}]}]`;
      const nav=(value:string,label:string,Icon:typeof House)=>({value,label,href:"#"+value,icon:createElement(Icon),linkProps:{onClick:()=>actions.setNavValue(value)}});
      const groups=[{id:"workspace",label:"Workspace",branchGuides:Boolean(v.branchGuides),items:[nav("overview","Overview",House),{...nav("activity","Activity",Bell),trailing:createElement(Flood.Badge,{size:"sm"},"4")},{value:"projects",label:"Projects",icon:createElement(Folder),children:[{value:"design",label:"Design system",href:"#design",linkProps:{onClick:()=>actions.setNavValue("design")}},{value:"website",label:"Website",href:"#website",linkProps:{onClick:()=>actions.setNavValue("website")}}]},{...nav("reports","Reports",ChartNoAxesColumn),disabled:true}]},{id:"library",label:"Library",items:[nav("archive","Archive",Archive),...(v.longNavigation?Array.from({length:16},(_,index)=>nav("collection-"+index,"Collection "+(index+1),Folder)):[])]}];
      const header=({collapsed}:{collapsed:boolean})=>createElement(Flood.Inline,{gap:"2"},createElement(Flood.IconSlot,{size:v.size as Flood.ContentSize},createElement(Folder)),...(!collapsed?[createElement(Flood.Text,{key:"name",size:"label"},"Flood Studio")]:[]));
      const footer=({collapsed}:{collapsed:boolean})=>createElement(Flood.NavigationTree,{label:"Preferences",compact:collapsed,size:v.size as Flood.ContentSize,currentValue:actions.navValue,items:[nav("settings","Settings",Settings),nav("help","Help",CircleHelp)]});
      return element("div",{style:{height:"var(--flood-workbench-shell-height, 40rem)",maxWidth:"100%"}},element("Sidebar",{label:"Workspace navigation",variant:v.variant,groups:binding(groupCode,groups),currentValue:binding("current",actions.navValue),collapsed:binding("collapsed",v.collapsed),onCollapsedChange:binding("setCollapsed",actions.setCollapsed),defaultExpandedValues:["projects"],size:v.size,side:v.side,width:v.width,collapsible:v.collapsible,headerLayout:v.headerLayout,
        header:binding('({collapsed}) => <Inline gap="2"><IconSlot size="'+v.size+'"><Folder /></IconSlot>{!collapsed && <Text size="label">Flood Studio</Text>}</Inline>',header),
        footer:binding('({collapsed}) => <NavigationTree label="Preferences" compact={collapsed} size="'+v.size+'" currentValue={current} items={[{value:"settings",label:"Settings",href:"#settings",icon:<Settings/>,linkProps:{onClick:()=>setCurrent("settings")}},{value:"help",label:"Help",href:"#help",icon:<CircleHelp/>,linkProps:{onClick:()=>setCurrent("help")}}]} />',footer),
      }));
    }
    case "collection-view-switcher": return element("div",{style:{width:v.width,maxWidth:"100%"}},element("CollectionViewSwitcher",{
      label:"Project view",controlSize:v.controlSize,disabled:v.disabled,
      views:[{id:"all",name:"All projects"},{id:"active",name:"Active projects"},{id:"archived",name:"Archived projects",disabled:true}],
      value:binding("view",actions.viewValue),onValueChange:binding("setView",actions.setViewValue),
      actions:[...(v.dirty&&v.editable?[{id:"update",label:"Update view",priority:20}]:[]),{id:"create",label:"Save as new view",priority:10},...(v.dirty?[{id:"reset",label:"Reset view"}]:[]),...(v.editable?[{id:"rename",label:"Rename"},{id:"delete",label:"Delete view",tone:"danger"}]:[])],
      onAction:binding("(id) => setAction(id)",actions.setStatus),
    }));
    case "collection-toolbar": {
      const properties=collectionPreviewProperties;
      const content=element("Stack",{gap:"4"},
        element("FilterGroup",{label:"Project conditions",properties:binding("properties",properties),controlSize:v.controlSize,value:binding("draftFilters",actions.draftFilters),onValueChange:binding("setDraftFilters",actions.setDraftFilters)}),
        element("Inline",{gap:"3"},element("Button",{disabled:binding("draftFilters.conditions.some(condition => !condition.values.length)",actions.draftFilters.conditions.some(condition=>!condition.values.length)),onClick:binding("() => {setFilters(draftFilters); setFilterOpen(false);}",()=>{actions.setFilterGroup(actions.draftFilters);actions.setToolbarOpen(false);})},"Apply filters"),element("Button",{variant:"subtle",onClick:binding("() => setFilterOpen(false)",()=>actions.setToolbarOpen(false))},"Cancel")));
      return element("div",{style:{width:v.width,maxWidth:"100%"}},element("CollectionToolbar",{
        label:"Project collection",controlSize:v.controlSize,disabled:v.disabled,align:v.align,
        appliedFilterDisplay:v.visibleFilters==="all"?undefined:{maxVisibleTags:Number(v.visibleFilters)},
        summaryPrefix:binding('filters.match === "any" && filters.conditions.length > 1 ? "Any:" : undefined',actions.filterGroup.match === "any" && actions.filterGroup.conditions.length > 1 ? "Any:" : undefined),
        searchValue:binding("search",actions.toolbarSearch),onSearchValueChange:binding("setSearch",actions.setToolbarSearch),searchLabel:"Search projects",searchPlaceholder:"Search projects…",
        appliedFilters:binding('filters.conditions.map(condition => {const property = properties.find(property => property.id === condition.property)!; return {id:condition.id, label:property.label + (condition.operator === "is" ? ": " : " excludes ") + condition.values.map(value => property.options.find(option => option.value === value)?.label ?? value).join(", ")};})',actions.filterGroup.conditions.map(condition=>{const property=properties.find(property=>property.id===condition.property)!;return{id:condition.id,label:property.label+(condition.operator==="is"?": ":" excludes ")+condition.values.map(value=>property.options.find(option=>option.value===value)?.label??value).join(", ")};})),
        onRemoveFilter:binding("(id) => setFilters(current => ({...current, conditions: current.conditions.filter(condition => condition.id !== id)}))",(id:string)=>actions.setFilterGroup({...actions.filterGroup,conditions:actions.filterGroup.conditions.filter(condition=>condition.id!==id)})),
        onClear:v.showClear?binding('() => {setSearch(""); setFilters({match:"all", conditions:[]});}',()=>{actions.setToolbarSearch("");actions.setFilterGroup({match:"all",conditions:[]});}):undefined,
        filtersOpen:binding("filterOpen",actions.toolbarOpen),onFiltersOpenChange:binding("(open) => {setFilterOpen(open); if(open) setDraftFilters(filters);}",(open:boolean)=>{actions.setToolbarOpen(open);if(open)actions.setDraftFilters(actions.filterGroup);}),
        filterTitle:"Project filters",filterPanelClassName:"workbench-filter-panel",
        filterContent:v.showFilters?binding(printRecipe(content,new Set(),new Set(),0),renderRecipe(content)):undefined,
      }));
    }
    case "filter-group": return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},element("FilterGroup",{
      label:"Project conditions",controlSize:v.controlSize,disabled:v.disabled,hideLabel:v.hideLabel,
      allowDuplicateProperties:v.allowDuplicateProperties,maxConditions:v.maxConditions==="none"?undefined:Number(v.maxConditions),
      properties:[{id:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"archived",label:"Archived"}]},{id:"owner",label:"Owner",options:[{value:"maya",label:"Maya"},{value:"noah",label:"Noah"}]},{id:"priority",label:"Priority",options:[{value:"urgent",label:"Urgent"},{value:"normal",label:"Normal"}]}],
      value:binding("filters",actions.filterGroup),onValueChange:binding("setFilters",actions.setFilterGroup),
    }));
    case "filter-condition": return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},...(actions.status === "Condition removed" ? [] : [element("FilterCondition",{
      label:"Condition 1",controlSize:v.controlSize,disabled:v.disabled,hideLabel:v.hideLabel,
      properties:[{id:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"archived",label:"Archived"}]},{id:"owner",label:"Owner",options:[{value:"maya",label:"Maya"},{value:"noah",label:"Noah"}]}],
      value:binding("condition",actions.filterValue),onValueChange:binding("setCondition",actions.setFilterValue),
      onRemove:v.removable?binding('() => setStatus("Condition removed")',()=>actions.setStatus("Condition removed")):undefined,
    })]),status);
    case "bulk-action-bar": return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},element("BulkActionBar",{label:"Selected projects",selectionCount:actions.status==="Selection cleared"?0:Number(v.selectionCount),counter:v.counter,size:v.size,maxVisibleActions:Number(v.maxVisibleActions),morePresentation:v.morePresentation,pending:v.pending,disabled:v.disabled,items:[{id:"archive",label:"Archive",priority:10},{id:"pause",label:"Pause"},{id:"activate",label:"Set active"}],onAction:binding("(id) => setStatus(id)",(id:string)=>actions.setStatus(id)),onClear:binding('() => setStatus("Selection cleared")',()=>actions.setStatus("Selection cleared"))}),status);
    case "autocomplete": return element("div",{style:{width:"26rem",maxWidth:"100%"}},{tag:"Field",props:{label:"Team"},field:element("Autocomplete",{name:"team",controlSize:v.controlSize,loadState:v.loadState,required:v.required,readOnly:v.readOnly,disabled:v.disabled,options:[{value:"design",label:"Design",group:"Product"},{value:"engineering",label:"Engineering",group:"Product"},{value:"operations",label:"Operations",group:"Business"}]})});
    case "overflow-actions": {
      const items = [
        { id: "save", label: "Save", priority: 10 },
        { id: "duplicate", label: "Duplicate" },
        { id: "archive", label: "Archive" },
        { id: "delete", label: "Delete", tone: "danger" },
      ] satisfies Flood.OverflowAction[];
      return element("Stack", { gap: "4", style: { width: v.width, maxWidth: "100%" } },
        element("OverflowActions", {
          label: "Document actions", size: v.size, variant: v.variant, shape: v.shape,
          containerVariant: v.containerVariant, morePresentation: v.morePresentation,
          maxVisibleActions:v.maxVisibleActions==="auto"?undefined:Number(v.maxVisibleActions), disabled: v.disabled, items,
          onAction: binding(
            `(id) => setStatus("Selected action: " + (new Map(${JSON.stringify(items.map(({ id, label }) => [id, label]))}).get(id) ?? id))`,
            (id: string) => actions.setStatus(`Selected action: ${items.find(item => item.id === id)?.label ?? id}`),
          ),
        }), status);
    }
    case "menubar": return element("Stack",{gap:"4"},element("Menubar",{label:"Editor commands",controlSize:v.controlSize,disabled:v.disabled,menus:[{id:"file",label:"File",items:[{id:"new",label:"New document"},{id:"export",type:"submenu",label:"Export",items:[{id:"pdf",label:"PDF"},{id:"text",label:"Plain text"}]}]},{id:"edit",label:"Edit",items:[{id:"undo",label:"Undo"},{id:"redo",label:"Redo",disabled:true}]},{id:"help",label:"Help",items:[{id:"shortcuts",label:"Keyboard shortcuts"}]}],onAction:binding('(menu, id) => setStatus(menu + ":" + id)',(menu:string,id:string)=>actions.setStatus(menu+":"+id))}),status);
    case "time-picker": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TimePicker",{label:"Start time",name:"time",defaultValue:"09:30",min:"08:00",max:"18:00",interval:Number(v.interval),controlSize:v.controlSize,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-time-range-picker": return element("div",{style:{width:"34rem",maxWidth:"100%"}},element("DateTimeRangePicker",{key:String(v.precision),label:"Booking",startDateName:"startDate",startTimeName:"startTime",endDateName:"endDate",endTimeName:"endTime",defaultValue:{start:{date:"2026-10-27",time:v.precision==="second"?"09:00:00":"09:00"},end:{date:"2026-10-27",time:v.precision==="second"?"18:00:00":"18:00"}},precision:v.precision,locale:v.locale,controlSize:v.controlSize,required:v.required,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled}));
    case "file-meta": return element("FileMeta",{lang:"en-US",variant:v.variant,format:v.format==="none"?undefined:v.format,size:v.showSize?Number(v.size):undefined});
    case "file-name": return element("div",{style:{inlineSize:v.narrow?"13rem":"32rem",maxInlineSize:"100%"}},
      element("FileName",{name:v.longName?"Flood-brand-mark-original-transparent-background.png":"Flood mark.png",
        overflow:v.overflow,href:v.linked?"/flood-mark.png":undefined,download:v.linked || undefined}));
    case "file-thumbnail": return element("FileThumbnail",{
      src:filePreviewImage(v.image),presentation:v.presentation,fit:v.fit,
      style:v.presentation==="tile"?{width:"16rem",maxInlineSize:"100%"}:undefined,
    });
    case "file-card": {
      const name = v.longName ? "Flood-brand-mark-original-transparent-background.png" : "Flood mark.png";
      const ratio = v.ratio === "16:9" ? 16/9 : v.ratio === "1:1" ? 1 : 4/3;
      const card = (label: string, src: string | undefined, href: string | undefined, bytes: number, description?:string) => {
        const key = JSON.stringify(label);
        const setState = (state: "preview" | "removed") => binding(
          `() => setFileStates(current => ({...current, [${key}]: ${JSON.stringify(state)}}))`,
          () => actions.setFileState(label,state),
        );
        return [element("FileCard",{
          hidden:v.showRemove ? binding(`fileStates[${key}] === "removed"`,actions.fileStates[label] === "removed") : undefined,
          name:label,lang:"en-US",description,thumbnailSrc:src,href,thumbnailFit:v.fit,thumbnailRatio:ratio,thumbnailPlacement:v.thumbnailPlacement,density:v.density,nameOverflow:v.nameOverflow,
          size:v.showSize?bytes:undefined,format:v.showType?undefined:null,downloadHref:v.showDownload?href:undefined,
          disabled:v.disabled,previewPlacement:v.previewPlacement,
          onPreview:v.showPreview && href ? setState("preview") : undefined,
          onRemove:v.showRemove ? setState("removed") : undefined,
          selection:v.selectable?binding(
            `{label:${JSON.stringify("Select "+label)}, checked:Boolean(listSelection[${key}]), onCheckedChange:(checked: boolean) => setListSelection(current => ({...current, [${key}]:checked}))}`,
            {label:"Select "+label,checked:Boolean(actions.listSelection[label]),
              onCheckedChange:(checked:boolean)=>actions.setListSelection(label,checked)},
          ):undefined,
        }),...(v.showPreview && href ? [element("ImagePreview",{
          title:label,src:href,alt:label,zoomable:true,
          open:binding(`fileStates[${key}] === "preview"`,actions.fileStates[label] === "preview"),
          onOpenChange:binding(`(open: boolean) => {if (!open) setFileStates(current => ({...current, [${key}]: undefined}));}`,
            (open:boolean)=>{if(!open)actions.setFileState(label,"");}),
          trigger:binding("() => null",()=>null),
        })] : [])];
      };
      const primary = card(name,filePreviewImage(v.thumbnail),"/flood-mark.png",1454337,v.description?"Transparent artwork for the website and presentations.":undefined);
      if (!v.gallery) return element("div",{style:{width:v.narrow?"12rem":"18rem",maxInlineSize:"100%"}},...primary);
      return element("Grid",{gap:"4",minItemWidth:"14rem",style:{width:"46rem",maxInlineSize:"100%"}},
        ...primary,...card("Analytics dashboard.png","/charts-share.png","/charts-share.png",42713),
        ...card("Asset usage notes.pdf",undefined,undefined,27400));
    }
    case "file-item":
    case "file-list": return element("div",{style:{width:v.narrow?"17rem":"32rem",maxWidth:"100%"}},element("FileList",{label:"Attachments",density:v.density,appearance:v.appearance},...["brand",...(slug==="file-list"?["logo","cover"]:[])].map((id,index)=>{
      const name=v.longName&&index===0?"Brand-guidelines-and-product-design-system-documentation-final-version.pdf":["Brand guidelines.pdf","Logo.svg","Cover.png"][index];
      if (v.showDownload || v.thumbnail && v.thumbnail !== "none") return element("FileItem", {
        name:v.longName ? "Flood-brand-mark-original-transparent-background.png" : "Flood mark.png", nameOverflow:v.nameOverflow,
        size:v.showSize ? 1454337 : undefined, format:v.showType ? "PNG" : null, downloadHref:v.showDownload?"/flood-mark.png":undefined,
        thumbnailSrc:filePreviewImage(v.thumbnail),thumbnailFit:"contain",disabled:v.disabled,
        onPreview:v.showActions ? action : undefined,
      });
      return element("FileItem",{lang:"en-US",name,nameOverflow:v.nameOverflow,metadataVariant:v.metadataVariant,format:v.showType?undefined:null,size:v.showSize?[2400000,18400,850000][index]:undefined,mimeType:v.showType?["PDF","SVG","PNG"][index]:undefined,disabled:v.disabled,hidden:binding(`fileStates[${JSON.stringify(id)}] === "removed"`,actions.fileStates[id]==="removed"),onPreview:v.showActions?action:undefined,onRemove:v.showActions?binding(`() => setFileStates(current => ({...current, ${JSON.stringify(id)}: "removed"}))`,()=>actions.setFileState(id,"removed")):undefined});
    })),status);
    case "upload-item":
    case "upload-list": return element("div",{style:{width:v.narrow?"17rem":"32rem",maxWidth:"100%"}},element("UploadList",{label:"Uploads",density:v.density??"comfortable"},...["brand",...(slug==="upload-list"?["logo","cover"]:[])].map((id,index)=>{
      const initial=slug==="upload-item"?String(v.state):["uploading","success","error"][index];
      const raw=actions.fileStates[id],state=raw==="removed"?initial:raw??initial;
      const set=(next:string)=>binding(`() => setFileStates(current => ({...current, ${JSON.stringify(id)}: ${JSON.stringify(next)}}))`,()=>actions.setFileState(id,next));
      const name=v.longName&&index===0?"Brand-guidelines-and-product-design-system-documentation-final-version.pdf":["Brand guidelines.pdf","Logo.svg","Cover.png"][index];
      return element("UploadItem",{lang:"en-US",name:v.showThumbnail?(v.longName?"Flood-brand-mark-original-transparent-background.png":"Flood mark.png"):name,
        thumbnailSrc:v.showThumbnail?"/flood-mark.png":undefined,thumbnailFit:v.showThumbnail?"contain":undefined,
        nameOverflow:v.nameOverflow,size:v.showThumbnail?1454337:[2400000,18400,850000][index],state:binding(`(fileStates[${JSON.stringify(id)}] === "removed" ? undefined : fileStates[${JSON.stringify(id)}]) ?? ${JSON.stringify(initial)}`,state),hidden:binding(`fileStates[${JSON.stringify(id)}] === "removed"`,raw==="removed"),progress:v.progress==="unknown"?undefined:Number(v.progress),labels:v.longStatus?{uploading:"Uploading to the workspace"}:undefined,error:state==="error"?"Connection interrupted. Try again.":undefined,disabled:v.disabled,onPause:v.showActions&&v.allowPause?set("paused"):undefined,onResume:v.showActions&&v.allowPause?set("uploading"):undefined,onCancel:v.showActions?set("cancelled"):undefined,onRetry:v.showActions?set("uploading"):undefined,onRemove:v.showActions?set("removed"):undefined});
    })),status);
    case "upload-queue": {
      const examples = v.showExamples ? uploadQueueExamples : [];
      const visible = examples.filter(file => actions.fileStates[file.id] !== "removed").map(file => ({
        ...file, state:actions.fileStates[file.id]==="cancelled" ? "cancelled" as const : file.state,
        onCancel:()=>actions.setFileState(file.id,"cancelled"),
        onRemove:()=>actions.setFileState(file.id,"removed"),
      }));
      return element("Surface",{padding:"4",style:{width:"32rem",maxInlineSize:"100%"}},element("UploadQueue",{
        title:"Uploads",listLabel:"Files in queue",density:v.density,maxListHeight:v.maxListHeight,
        entries:binding("entries",[
          ...visible,
          ...actions.uploadQueue.selected.map(file=>({...file,state:"queued",onCancel:()=>actions.uploadQueue.remove(file.id)})),
        ]),
        picker:binding('{label:"Add files", chooseLabel:"Browse", onFilesSelect:addFiles}',{
          label:"Add files",chooseLabel:"Browse",onFilesSelect:actions.uploadQueue.add,
        }),
      }));
    }
    case "image-preview": return element("ImagePreview",{title:"Flood mark",src:v.image==="missing"?"/missing-preview.png":"/flood-mark.png",alt:"Pink Flood mark",caption:v.showCaption?"Original Flood brand asset.":undefined,zoomable:v.zoomable,downloadHref:v.showDownload?"/flood-mark.png":undefined,disabled:v.disabled,trigger:binding('(props) => <Button {...props} variant="subtle">Preview image</Button>',(props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Preview image</Flood.Button>)});
    case "image-gallery": {
      const items = [
        {id:"mark",src:"/flood-mark.png",alt:"Pink Flood mark",caption:"Flood mark"},
        {id:"charts",src:"/charts-share.png",alt:"Flood chart examples",caption:"Chart examples"},
        ...(v.navigation==="thumbnails" ? [
          {id:"avatar",src:"/avatar-demo.svg",alt:"Sample avatar",caption:"Sample avatar"},
        ] : []),
        ...(v.missingImage?[{id:"missing",src:"/missing-preview.png",alt:"Flood workspace illustration",caption:"Workspace illustration"}]:[]),
      ].map(image=>({...image,
        thumbnailSrc:v.navigation==="thumbnails" && image.id!=="missing"?image.src:undefined,
        downloadHref:v.showDownload && image.id!=="missing"?image.src:undefined,
      }));
      return element("ImageGallery",{title:"Flood assets",items,navigation:v.navigation,zoomable:v.zoomable,
        trigger:binding('(props) => <Button {...props} variant="subtle">View images</Button>',(props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">View images</Flood.Button>)});
    }

    case "data-table": {
      const pageSize = Number(v.pageSize);
      const columns = actions.phone ? projectTableColumns.map(({pinned,...column}) => column) : projectTableColumns;
      const previewRows = v.emptyRows ? [] : projectTablePreviewRows(Boolean(v.stickyHeader), actions.projectEdits, actions.setProjectEdit);
      const pageStart = (actions.page - 1) * pageSize;
      const pageEnd = actions.page * pageSize;
      const sourceRows = "emptyRows ? [] : " + projectPreviewRowsCode(Boolean(v.stickyHeader));
      const cursor = v.cursorPages ? binding(`{
        previous: page > 1 ? {onSelect: () => setPage(page - 1)} : undefined,
        next: !emptyRows && page * ${pageSize} < ${previewRows.length} ? {onSelect: () => setPage(page + 1)} : undefined,
        position: emptyRows ? undefined : [(page - 1) * ${pageSize} + 1, Math.min(page * ${pageSize}, ${previewRows.length})].join("–"),
      }`, {
        previous: actions.page > 1 ? {onSelect:() => actions.setPage(actions.page - 1)} : undefined,
        next: pageEnd < previewRows.length ? {onSelect:() => actions.setPage(actions.page + 1)} : undefined,
        position: previewRows.length ? `${pageStart + 1}–${Math.min(pageEnd, previewRows.length)}` : undefined,
      }) : undefined;
      return element("Surface", {padding:"0", style:{
      width:"100%", maxWidth:"100%", overflow:"clip",
      border:"var(--flood-sys-stroke-width) solid var(--flood-sys-color-border-decorative)",
    }},
      element("DataTable", {
        key: v.loadingAppearance,
        caption: "Projects",
        hideCaption: true,
        toolbar: binding('<Text size="compact">Projects</Text>', <Flood.Text size="compact">Projects</Flood.Text>),
        density: v.density,
        pageSize: Number(v.pageSize),
        paginationPresentation:v.paginationPresentation,
        paginationMode:v.cursorPages ? "cursor" : undefined,
        cursorPagination:cursor,
        selectable: v.selectable,
        showResults: v.showResults,
        showSelection: v.showSelection && v.replaceResults ? "replace-results" : v.showSelection,
        striped: v.striped,
        showColumnVisibility: true,
        defaultExpandedIds: [],
        state: binding("tableState", v.state),
        loadingAppearance: v.loadingAppearance,
        defaultColumnWidths: v.loadingAppearance === "skeleton" ? projectLoadingColumnWidths : undefined,
        refreshing: v.refreshing || undefined,
        stickyHeader: v.stickyHeader || undefined,
        maxViewportHeight: v.stickyHeader ? "16rem" : undefined,
        minWidth: "min-content",
        onRetry: binding('() => setTableState("ready")', actions.restoreTable),
        emptyContent: v.customEmpty
          ? binding('<EmptyState title="No projects yet" />', renderRecipe(element("EmptyState", {title:"No projects yet"})))
          : undefined,
        errorContent: v.customError
          ? binding('<ErrorState title="Could not load the rows." headingLevel={3} density="compact" layout="row" onRetry={() => setTableState("ready")} />',
              <Flood.ErrorState title="Could not load the rows." headingLevel={3} density="compact" layout="row" onRetry={actions.restoreTable} />)
          : undefined,
        columns: v.cursorPages ? columns.map(({sortable,...column}) => column) : columns,
        rows: v.cursorPages
          ? binding(`(${sourceRows}).slice((page - 1) * ${pageSize}, page * ${pageSize})`,previewRows.slice(pageStart,pageEnd))
          : binding(sourceRows,previewRows),
      }), status);
    }

    case "notification-trigger": {
      const items = notificationTriggerItems.map((item,index) => ({...item,unread:actions.inbox.unread[item.id] ?? (index < Number(v.demoUnread))}));
      const unreadCount = items.filter(item => item.unread).length;
      return element("Popover",{
        title:"Notifications",align:"center",chrome:"title-only",disabled:v.disabled,
        style:{inlineSize:"20rem",padding:"var(--flood-sys-space-3)"},
        trigger:binding(
          `(props) => <NotificationTrigger {...props} label="Notifications" unreadCount={items.filter(item => item.unread).length} size=${JSON.stringify(v.size)} variant=${JSON.stringify(v.variant)} disabled={${v.disabled}} />`,
          (props:Flood.OverlayTriggerProps) => <Flood.NotificationTrigger {...props} label="Notifications" unreadCount={unreadCount}
            size={v.size as Flood.ControlSize} variant={v.variant as Flood.ButtonProps["variant"]} disabled={Boolean(v.disabled)} />,
        ),
      }, element("NotificationInbox",{
        label:"Recent notifications",appearance:"overlay",items:binding("items",items),
        onUnreadChange:binding("(id, unread) => setInboxUnread(current => ({...current, [id]: unread}))",actions.inbox.set),
        onMarkAllRead:binding("() => setInboxUnread({mention: false, export: false})",actions.inbox.markAll),
      }));
    }
    case "notification-inbox": {
      const records = [
        {id:"mention",title:"Maya mentioned you",href:"/components/comment-thread",description:"Export review · Final attachments",unread:true,timeLabel:"09:24"},
        {id:"export",title:"Export ready for approval",href:"/components/activity-timeline",unread:true,timeLabel:"08:52"},
        {id:"settings",title:"Workspace preferences updated",href:"/playground/settings",unread:false,timeLabel:"Yesterday"},
      ];
      const avatar = v.showMedia ? <Flood.Avatar name="Maya Chen" size="sm" decorative /> : undefined;
      const items = v.empty ? [] : records.map((item,index) => ({...item,unread:actions.inbox.unread[item.id] ?? item.unread,media:index === 0 ? avatar : undefined}));
      const source = v.empty ? "[]" : `[${records.map((item,index) =>
        `{...${JSON.stringify(item)}, unread: inboxUnread["${item.id}"] ?? ${item.unread}${index === 0 && avatar ? ', media: <Avatar name="Maya Chen" size="sm" decorative />' : ""}}`,
      ).join(",\n")}]`;
      return element("NotificationInbox",{
        label:"Project notifications",items:binding(source,items),density:v.density,appearance:v.appearance,style:{width:v.constrainWidth?"16rem":v.appearance==="overlay"?"19rem":"29rem",maxInlineSize:"100%"},
        state:binding("inboxState", v.state),onRetry:binding('() => setInboxState("ready")',actions.inbox.retry),
        loadingPlaceholder:{media:Boolean(v.showMedia), description:true, metadata:true},
        onUnreadChange:binding("(id, unread) => setInboxUnread(current => ({...current, [id]: unread}))",actions.inbox.set),
        onMarkAllRead:v.showMarkAll ? binding("() => setInboxUnread({mention: false, export: false, settings: false})",actions.inbox.markAll) : undefined,
      });
    }
    case "notification-item":
    case "notification-list": {
      const primary = element("NotificationItem",{
        title:"Maya mentioned you",href:"/components/comment-thread",
        description:v.showDescription ? "Export review · Final attachments" : undefined,
        unread:choice.checked,timeLabel:v.longTime?"14 November, 09:24":"09:24",dateTime:"2026-11-14T09:24:00",
        media:v.showMedia ? binding('<Avatar name="Maya Chen" size="sm" decorative />',<Flood.Avatar name="Maya Chen" size="sm" decorative />) : undefined,
        onUnreadChange:v.showActions ? binding("setChecked",actions.checked) : undefined,
      });
      return element("NotificationList",{
        label:"Project notifications",density:v.density,style:{width:v.constrainWidth?"14rem":"29rem",maxInlineSize:"100%"},
      },primary,...(slug==="notification-list" ? [
        element("NotificationItem",{title:"Export ready for approval",href:"/components/timeline",
          description:v.showDescription?"Source file attached":undefined,timeLabel:"08:52",dateTime:"2026-11-14T08:52:00"}),
        element("NotificationItem",{title:"Workspace preferences updated",href:"/playground/settings",timeLabel:"Yesterday"}),
      ] : []));
    }
    case "data-list":
    case "data-list-item": {
      const titles = slug === "data-list" ? ["Design system", "Website", "Agent guides"] : ["Design system"];
      const rows = titles.map((title,index) => {
        const displayTitle = v.longTitle ? title+" — foundations, components and documentation" : title;
        const facts = [{id:"team",value:["Design team","Growth team","Platform team"][index]}, {id:"members",value:["8 members","4 members","6 members"][index]}];
        const label = title+" details";
        return element("DataListItem",{
          layout:v.layout,
          selection:v.selectable && index < 2 ? binding(
            `{label: ${JSON.stringify("Select "+title)}, checked: Boolean(listSelection[${JSON.stringify(title)}]), disabled: ${index === 1}, onCheckedChange: (checked: boolean) => setListSelection(current => ({ ...current, [${JSON.stringify(title)}]: checked }))}`,
            {label:"Select "+title,checked:Boolean(actions.listSelection[title]),disabled:index === 1,onCheckedChange:(checked:boolean)=>actions.setListSelection(title,checked)},
          ) : undefined,
          title:binding(`<Link href="#project-${index}">{${JSON.stringify(displayTitle)}}</Link>`,<Flood.Link href={`#project-${index}`}>{displayTitle}</Flood.Link>),
          description:v.showDescription?["Foundations and reusable components","Documentation and live examples","Design instructions for your agent"][index]:undefined,
          details:v.showDetails?binding(`<MetadataList label={${JSON.stringify(label)}} items={${JSON.stringify(facts)}} />`,<Flood.MetadataList label={label} items={facts}/>):undefined,
          media:v.showMedia?binding(`<Avatar name=${JSON.stringify(title)} size="sm" />`,<Flood.Avatar name={title} size="sm"/>):undefined,
          metadata:v.showMetadata?"Updated today":undefined,
          actions:v.showActions?binding('<Button variant="subtle" size="sm" onClick={() => setStatus("Action completed locally.")}>Manage</Button>',<Flood.Button variant="subtle" size="sm" onClick={()=>actions.setStatus("Action completed locally.")}>Manage</Flood.Button>):undefined,
        });
      });
      return element("div",{style:{width:v.narrow?"16rem":"34rem",maxWidth:"100%"}},
        element("DataList",{density:v.density,dividers:slug==="data-list"?v.dividers:true,reserveSelectionSpace:v.reserveSelectionSpace},...rows),status);
    }
    case "metadata-list": {
      const team = v.longValue ? "Product accessibility and internationalization research" : "Design team";
      return element("div",{style:{width:v.narrow?"12rem":"27rem",maxInlineSize:"100%"}},element("MetadataList",{
        label:"Project details",size:v.size,
        items:binding(`[{id:"team",value:${JSON.stringify(team)}${v.showIcons?",icon:<Layers3 />":""}}, {id:"updated",value:<time dateTime="2026-11-14">Updated Nov 14</time>${v.showIcons?",icon:<CalendarDays />":""}}]`,
          [{id:"team",value:team,icon:v.showIcons?<Layers3/>:undefined},
            {id:"updated",value:<time dateTime="2026-11-14">Updated Nov 14</time>,icon:v.showIcons?<CalendarDays/>:undefined}]),
      }));
    }
    case "radio-card-group":
    case "check-card-group": {
      const radio = slug==="radio-card-group";
      const options = radio ? [
        {value:"starter",label:"Starter",description:"1 project, up to 3 members",metadata:"Free"},
        {value:"team",label:"Team",description:"Unlimited projects, up to 25 members",metadata:"$12 / month"},
        {value:"enterprise",label:"Enterprise",description:"Single sign-on and audit logs",metadata:"Contact sales",disabled:true},
      ] : [
        {value:"product",label:"Product updates",description:"New features and improvements",metadata:"Monthly"},
        {value:"security",label:"Security advisories",description:"Find out when an update needs your attention",metadata:"As needed"},
        {value:"events",label:"Community events",description:"Talks and workshops",metadata:"Monthly"},
      ];
      return element("div",{style:{inlineSize:v.narrow?"17rem":"42rem",maxInlineSize:"100%"}},
        element(radio?"RadioCardGroup":"CheckCardGroup",{
          legend:radio?"Plan":"Email subscriptions", name:radio?"plan":"subscriptions",
          defaultValue:radio?"starter":["security"], options, density:v.density, indicatorPlacement:v.indicatorPlacement, disabled:v.disabled,
        }));
    }
    case "check-card": return element("div",{style:{width:v.narrow?"14rem":"28rem",maxWidth:"100%"}},element("CheckCard",{label:"Product updates",description:v.showDescription?"A summary of new features and improvements.":undefined,metadata:v.showMetadata?"Monthly":undefined,name:"updates",value:"product",density:v.density,indicatorPlacement:v.indicatorPlacement,indeterminate:v.indeterminate,readOnly:v.readOnly,disabled:v.disabled}));
    case "radio-card": return element("div",{style:{width:v.narrow?"14rem":"28rem",maxWidth:"100%"}},element("Fieldset",{legend:"Plan"},element("Stack",{gap:"2"},element("RadioCard",{name:"preview-plan",value:"starter",label:"Starter",description:v.showDescription?"1 project, up to 3 members":undefined,metadata:v.showMetadata?"Free":undefined,defaultChecked:true,density:v.density,indicatorPlacement:v.indicatorPlacement,readOnly:v.readOnly,disabled:v.disabled}),element("RadioCard",{name:"preview-plan",value:"team",label:"Team",description:v.showDescription?"Unlimited projects, up to 25 members":undefined,metadata:v.showMetadata?"$12 / month":undefined,density:v.density,indicatorPlacement:v.indicatorPlacement,readOnly:v.readOnly,disabled:v.disabled}))));
    case "color-swatch": return element("ColorSwatch", {label:"Accent color",value:v.value,size:v.size});
    case "color-palette": return element("ColorPalette", {
      label:"Accent colors", appearance:v.appearance, disabled:v.disabled, readOnly:v.readOnly,
      options:[
        {value:"#ff47a8",label:"Pink"},
        {value:"#ffffff",label:"White"},
        {value:"#78b8ff",label:"Blue"},
        {value:"#65c99c",label:"Mint",disabled:Boolean(v.disableLast)},
      ],
      value:binding("color",actions.palette.value),onValueChange:binding("setColor",actions.palette.select),
      style:{maxInlineSize:"24rem"},
    });
    case "color-picker": return element("div",{style:{width:"24rem",maxWidth:"100%"}},element("ColorPicker",{label:"Accent color",defaultValue:"#ff47a8",name:"accent",controlSize:v.controlSize,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,presets:v.presets?["#ff47a8","#ffffff","#78b8ff","#65c99c"]:undefined}));
    case "hover-card": return element("HoverCard",{title:"Alex Morgan",side:v.side,align:v.align,disabled:v.disabled,trigger:binding('(props) => <Button {...props} variant="subtle">Alex Morgan</Button>',(props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Alex Morgan</Flood.Button>)},element("Stack",{gap:"3"},text("Product designer · London"),element("Link",{href:"https://github.com/tillwithered"},"View profile")));
    case "tree-select": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TreeSelect",{label:"Destination",name:"destination",controlSize:v.controlSize,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled,items:[{value:"design",label:"Design",selectable:false,children:[{value:"foundations",label:"Foundations"},{value:"components",label:"Components"}]},{value:"engineering",label:"Engineering",selectable:false,children:[{value:"web",label:"Website"},{value:"api",label:"API"}]}]}));
    case "date-time-picker": return element("div",{style:{width:"32rem",maxWidth:"100%"}},element("DateTimePicker",{key:String(v.precision),label:"Schedule",dateName:"date",timeName:"time",controlSize:v.controlSize,precision:v.precision,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled,defaultValue:{date:"2026-10-26",time:v.precision==="second"?"09:30:00":"09:30"}}));
    case "tag": {
      const name = v.avatar ? "Maya Chen" : "Design";
      return element("Tag",{size:v.size,disabled:v.disabled,hidden:binding("!visible",!v.visible),
        icon:v.icon && !v.avatar?binding("<Plus />",<Plus />):undefined,
        avatar:v.avatar ? {name} : undefined,
        onRemove:v.removable?binding("() => setVisible(false)",()=>actions.visible(false)):undefined,removeLabel:`Remove ${name}`},
      v.longLabel ? v.avatar ? "Maya Elizabeth Chen" : "Design systems and thoughtfully composed interfaces" : name);
    }
    case "tag-group": {
      const people = v.content === "people";
      const items = people ? ["Maya Chen", "Sam Rivera", "Noah Park", "Lena Hofmann"].map(name => ({
        id: name, label: name, avatar: {name},
      })) : [
        {id:"status",label:"Status: Active"},
        {id:"owner",label:"Owner: Maya Chen"},
        {id:"priority",label:"Priority: Urgent"},
        {id:"team",label:"Team: Product design and research"},
      ];
      return element("div",{style:{width:v.narrow?"13rem":"26rem",maxInlineSize:"100%"}},element("TagGroup",{
        label:people?"Project collaborators":"Project filters", size:v.size, disabled:v.disabled,
        items:binding(`${JSON.stringify(items)}.filter(item => !removedTagIds.includes(item.id))`,items.filter(item=>!actions.removedTagIds.includes(item.id))),
        maxVisibleTags:v.maxVisibleTags==="all"?undefined:Number(v.maxVisibleTags),
        onRemove:v.removable?binding("(id) => setRemovedTagIds(ids => [...ids, id])",actions.removeTag):undefined,
      }));
    }
    case "avatar-group": {
      const people = ["Alex Morgan","Sam Lee","June Park","Robin Smith",v.longNames ? "Mika Chen de la Cruz Fitzgerald" : "Mika Chen"];
      if (v.manyPeople) people.push("Mina Patel","Noah Tucker","Lina Rao","Leon Baker","Ana Walsh","Jules Rivera","Ari Walker");
      return element("div",{style:{inlineSize:v.constrainWidth?"7rem":v.layout==="fit"?"20rem":undefined,maxInlineSize:"100%"}},
        element("AvatarGroup",{label:"Project collaborators",size:v.size,max:Number(v.max),
          overflowPresentation:v.overflowPresentation,spacing:v.spacing,layout:v.layout,items:people.map((name,index)=>({id:String(index),name,
            presence:v.presence ? avatarPresenceExamples[index % avatarPresenceExamples.length] : undefined}))}));
    }
    case "author-meta": return element("AuthorMeta", {
      name:v.longName ? "Alexandra Konstantinova" : "Maya Chen", size:v.size, metadataPlacement:v.metadataPlacement,nameOverflow:v.nameOverflow,
      presence:v.presence ? avatarPresenceExamples[0] : undefined,
      metadata:v.metadata ? binding('<Timestamp dateTime="2026-11-14">14 Nov</Timestamp>', <Flood.Timestamp dateTime="2026-11-14">14 Nov</Flood.Timestamp>) : undefined,
      style:v.constrainWidth ? {maxInlineSize:"9rem"} : undefined,
    });
    case "comment": {
      const message = "I checked the export against the source. Can you include the original attachment before we send it for review?"
        + (v.longMessage ? " The final two pages contain the line-item breakdown and the payment references. Reviewers will need both to reconcile the totals with the original invoice." : "");
      const comment = element("Comment", {
        size:v.size, actionVisibility:v.actionVisibility,
        author:v.metadata
          ? binding('{name:"Maya Chen", metadata:<Timestamp dateTime="2026-11-14">14 Nov</Timestamp>}', {name:"Maya Chen",metadata:<Flood.Timestamp dateTime="2026-11-14">14 Nov</Flood.Timestamp>})
          : {name:"Maya Chen"},
        actions:v.showActions ? binding(`<CopyButton iconOnly size="xs" variant="ghost" copyLabel="Copy message" value={${JSON.stringify(message)}} />`,
          <Flood.CopyButton iconOnly size="xs" variant="ghost" copyLabel="Copy message" value={message} />) : undefined,
        onReply:v.showActions ? binding("openReply",actions.thread.openFrom) : undefined,
        attachments:v.showAttachment ? binding('<FileList label="Attachments" appearance="embedded"><FileItem lang="en" name="Source export.pdf" format={null} size={2400000} metadataVariant="plain" /></FileList>',
          <Flood.FileList label="Attachments" appearance="embedded"><Flood.FileItem lang="en" name="Source export.pdf" format={null} size={2400000} metadataVariant="plain" /></Flood.FileList>) : undefined,
        reactions:reactionChips(),
        reactionPicker:binding(printRecipe(reactionPicker(),new Set(),new Set()),renderRecipe(reactionPicker())),
      },v.longMessage ? element("ExpandableText",{lines:3,size:v.size === "sm" ? "compact" : "body"},message) : message);
      if (!v.showActions) return {...comment, props:{...comment.props,style:{width:v.constrainWidth ? "16rem" : "29rem",maxInlineSize:"100%"}}};
      const composer = element("CommentComposer",{
        ref:binding("focusReplyEditor",actions.thread.focusEditor),
        label:"Reply",placeholder:"Write a reply…",replyContext:"Replying to Maya Chen",
        value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),
        onSend:binding("submitReply",actions.thread.submit),onCancel:binding("cancelReply",actions.thread.cancel),
      });
      const posted = element("CommentThread",{"aria-label":"Posted replies",hidden:binding("replies.length === 0",actions.thread.replies.length===0),items:binding(
        'replies.map(reply => ({...reply, author:{name:"Alex Morgan"}}))',
        actions.thread.replies.map(reply=>({...reply,author:{name:"Alex Morgan"}})),
      )});
      return element("Stack",{gap:"3",style:{width:v.constrainWidth?"16rem":"29rem",maxInlineSize:"100%"}},comment,posted,
        binding(`replying && (${printRecipe(composer,new Set(),new Set())})`,v.replyContext ? renderRecipe(composer) : null));
    }
    case "reaction-picker": return element("Inline",{gap:"1",align:"center"},reactionChips(),reactionPicker());
    case "reaction-button": return element("ReactionButton", {
      label:"Helpful", icon:"👍", count:binding("checked ? 7 : 6", v.checked ? 7 : 6), pressed:choice.checked,
      onPressedChange:binding("setChecked", actions.checked), disabled:v.disabled,
    });
    case "comment-thread": {
      const rows = [
        {id:"maya", name:"Maya Chen", dateTime:"2026-11-14T10:24:00", time:"10:24", body:"Please include the original attachment before we send the export for review."},
        {id:"sam", name:"Sam Rivera", dateTime:"2026-11-14T11:05:00", time:"11:05", body:"I found the source file. I’ll attach it before approval."},
      ];
      const items = rows.map(row => ({
        id:row.id, author:{name:row.name,metadata:<Flood.Timestamp dateTime={row.dateTime}>{row.time}</Flood.Timestamp>}, body:row.body,
        actions:v.showActions ? <Flood.CopyButton iconOnly size="xs" variant="ghost" copyLabel="Copy message" value={row.body} /> : undefined,
      }));
      const source = '[' + rows.map(row => `{id:${JSON.stringify(row.id)}, author:{name:${JSON.stringify(row.name)}, metadata:<Timestamp dateTime=${JSON.stringify(row.dateTime)}>${row.time}</Timestamp>}, body:${JSON.stringify(row.body)}${v.showActions ? `, actions:<CopyButton iconOnly size="xs" variant="ghost" copyLabel="Copy message" value={${JSON.stringify(row.body)}} />` : ""}}`).join(",\n") + ']';
      const replies = actions.thread.replies.map(reply => ({...reply,author:{name:"Alex Morgan"}}));
      const data = [{...items[0],replies:[items[1],...replies]}];
      const dataCode = v.showComposer ? '[{...seed[0], replies:[seed[1], ...replies.map(reply => ({...reply,author:{name:"Alex Morgan"}}))]}]' : '[{...seed[0], replies:[seed[1]]}]';
      const thread = element("CommentThread",{
        "aria-label":"Review comments",size:v.size,dividers:v.dividers,actionVisibility:v.actionVisibility,
        items:binding(`(() => { const seed = ${source}; return ${dataCode}; })()`,data),
      });
      const composer = element("CommentComposer",{
        label:"Reply",placeholder:"Write a reply…",sendLabel:"Post reply",
        style:{marginInlineStart:`calc(var(--flood-sys-control-${v.size}-height) + var(--flood-sys-space-2))`,inlineSize:"auto"},
        value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),onSend:binding("submitReply",actions.thread.submit),
      });
      return element("Stack",{gap:"3",style:{width:v.constrainWidth?"16rem":"29rem",maxInlineSize:"100%"}},thread,
        ...(v.showComposer ? [composer] : []));
    }
    case "status-indicator": {
      const [label,glyph] = statusExamples[v.tone as keyof typeof statusExamples];
      const status = element("StatusIndicator",{label,tone:v.tone,size:v.size,announce:v.announce,presentation:v.presentation,
        icon:v.presentation==="icon" ? binding(`<${glyph} />`,createElement(statusGlyphs[glyph])) : undefined,
        style:v.constrainWidth ? {maxInlineSize:"7rem"} : undefined});
      return v.showPeers ? element("Inline", {gap:"3",align:"center"}, status,
        element("Badge", {size:v.size,variant:"outline"}, "Platform"),
        element("Tag", {size:v.size}, "Design")) : status;
    }
    case "figure": return element("Figure",{caption:v.showCaption?"Homepage, desktop layout":undefined,captionPosition:v.captionPosition},element("Surface",{padding:"8",elevation:"raised"},element("Text",{as:"p",size:"compact"},"Project preview")));
    case "blockquote": return element("Blockquote",{attribution:v.attribution?"The Flood team":undefined},"Good interfaces make room for what matters.");
    case "inline-code": return element("Text",{as:"p",size:"compact"},"Import ",element("InlineCode",{size:v.size,wrap:v.wrap},v.longValue?"@/ui/project-settings/notifications/preferences":"@/ui/button")," in your project.");
    case "timestamp": return element("Timestamp", {dateTime:"2026-11-14T09:30:00Z",
      format:v.format, relativeTo:v.relativeTo?"2026-11-14T11:30:00Z":undefined,
      lang:v.locale,timeZone:v.timeZone,size:v.size});
    case "metric": return element("Metric",{label:v.showUnit?"Transfer speed":"Monthly revenue",
      value:v.state==="ready"?(v.showUnit?"124":"$24,580"):null,unit:v.showUnit?"MB/s":undefined,size:v.size,state:v.state,
      hint:v.hint?"Last 30 days":undefined,
      trend:v.trend?{label:v.direction==="up"?"12.8% higher":v.direction==="down"?"4.2% lower":"No change",direction:v.direction,tone:v.tone}:undefined});
    case "metric-delta": return element("MetricDelta",{
      label:v.direction==="up"?"8% higher":v.direction==="down"?"8% lower":"No change",
      direction:v.direction,variant:v.variant,tone:v.tone,context:v.showContext?"vs last week":undefined,
    });
    case "metric-card": {
      const values = [19940,21060,22650,22240,21180,21970,23140,22800,21800,22500,23860,24580];
      const label = "Six months of revenue with two dips and a new high in the latest month";
      return element("MetricCard",{
        metric:{label:"Monthly revenue",value:v.state==="ready"?"$24,580":null,state:v.state,size:v.size,
          trend:v.showComparison?{direction:"up",tone:"success",label:"12.8% higher",context:"vs last month",variant:v.comparisonStyle}:undefined},
        layout:v.layout,style:{width:v.narrow?"12rem":"24rem",maxInlineSize:"100%"},
        chartLoading:v.showChart && v.chartState !== "follow metric" ? v.chartState === "loading" : undefined,
        chart:v.showChart?binding(`<Sparkline label={${JSON.stringify(label)}} values={${JSON.stringify(values)}} />`,
          <Flood.Sparkline label={label} values={values}/>):undefined,
      });
    }
    case "metric-group": return element("MetricGroup",{
      label:"API performance",
      appearance:v.appearance,
      layout:v.layout,
      size:v.size,
      style:{inlineSize:v.narrow?"15rem":v.layout==="rows"?"24rem":"38rem",maxInlineSize:"100%"},
      items:[
        {id:"requests",label:"Requests",value:v.scenario==="loading"?null:v.scenario==="mixed"?0:"1.2M",state:v.scenario==="loading"?"loading":"ready"},
        {id:"latency",label:v.longLabel?"P95 response time across all regions":"P95 response time",value:v.scenario==="ready"?"186":null,state:v.scenario==="ready"?"ready":"loading",unit:"ms",
          trend:v.showComparison?{label:"8% lower",direction:"down",tone:"success",context:"vs last week"}:undefined},
        {id:"availability",label:"Availability",value:v.scenario==="ready"?"99.98%":null,state:v.scenario==="ready"?"ready":v.scenario==="mixed"?"unavailable":"loading"},
      ],
    });
    case "sparkline": {
      const values = v.series === "falling" ? [12000, 10400, 11200, 9500, 8000] : [8000, 8900, v.series === "gaps" ? null : 8500, 10700, 12000];
      const label = v.series === "gaps" ? "Revenue rose from $8,000 to $12,000 with one missing week" : v.series === "falling" ? "Revenue fell from $12,000 to $8,000" : "Revenue rose from $8,000 to $12,000";
      return element("Sparkline", {values, label, size:v.size, tone:v.tone, variant:v.variant, showLabel:v.showLabel});
    }
    case "line-chart": {
      const monthly = v.data === "month";
      const categories = monthly ? Array.from({length:30}, (_, i) => `Jun ${i + 1}`) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const current = monthly ? [36,42,37,48,53,43,46,59,55,48,57,71,68,62,51,63,74,69,78,72,64,75,93,85,92,78,87,106,95,101] : [38, 55, 48, 74, 68, 96, 87];
      const previous = monthly ? [27,33,38,31,42,47,35,41,46,40,49,55,52,58,49,61,57,62,55,68,62,58,67,73,69,64,76,70,78,83] : [32, 39, 36, 52, 47, 62, 58];
      if (v.data === "single") { categories.splice(1); current.splice(1); }
      const series = [
        {id:"current", label:monthly ? "This month" : "This week", values:current.map((value, i) => v.data === "gap" && i === 3 ? null : value)},
        ...(v.comparison ? [{id:"previous", label:monthly ? "Last month" : "Last week", values:previous.slice(0, categories.length)}] : []),
      ];
      return element("Surface", {padding:"6", style:{width:"50rem",maxWidth:"100%"}},
        element("Stack", {gap:"4"},
          ...(v.data === "complete" || monthly ? [element("Metric", {label:monthly ? "Monthly visits" : "Weekly visits", value:new Intl.NumberFormat("en").format(current.reduce((sum, value) => sum + value, 0))})] : []),
          element("LineChart", {label:"Daily visits", categories, series:v.data === "empty" ? [] : series, domain:[0,120], variant:v.variant, curve:v.curve, showYAxis:v.showYAxis || undefined, showLegend:v.showLegend || undefined})));
    }
    case "bar-chart": {
      const percent = v.layout === "percent";
      const signed = !percent && v.data === "signed";
      const stacked = v.layout !== "grouped";
      const categories = stacked ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"] : ["Product", "Design", "Growth", "Support", "Platform"];
      const actual = percent ? [380, 180, 460, 180, 540] : signed ? [38, -16, 30, 0, 24] : [38, 29, 46, 18, 54];
      const plan = percent ? [320, 420, 40, 240, 180] : signed ? [32, -10, 24, 12, 26] : [32, 36, 40, 24, 48];
      const observations = (values: number[]) => values.map((value, index) => v.data === "zero" && index === 2 ? 0 : value);
      const series = [
        {id:"actual", label:stacked ? "Web" : "Actual", values:observations(actual).map((value, i) => v.data === "missing" && i === 2 ? null : value)},
        ...(v.comparison ? [{id:"plan", label:stacked ? "Email" : "Plan", values:observations(plan)}] : []),
        ...(percent && v.comparison ? [{id:"chat", label:"Chat", values:observations([300, 150, 100, 180, 180])}] : []),
      ];
      const label = percent ? "Request share by channel" : stacked ? (signed ? "Change in requests by channel" : "Requests by channel") : (signed ? "Budget change by team" : "Hours by team");
      return element("Surface", {padding:"6", style:{width:"46rem",maxWidth:"100%"}},
        element("Stack", {gap:"4"}, element("Heading", {level:2,size:"group"}, label),
          element("BarChart", {label, categories, series:v.data === "empty" ? [] : series, layout:stacked ? v.layout : undefined, showLegend:v.showLegend || undefined})));
    }
    case "donut-chart": {
      const items = [
        {id:"direct", label:"Direct", value:6420},
        {id:"search", label:"Search", value:3720},
        {id:"referrals", label:"Referrals", value:1960},
        {id:"social", label:"Social", value:900},
      ];
      return element("Surface", {padding:"6", style:{width:"26rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Traffic sources"),
          element("DonutChart", {label:"Traffic sources", totalLabel:"Visits", showLegend:v.showLegend || undefined,
            items:v.data === "empty" ? [] : v.data === "single" ? items.slice(0, 1) :
              items.map(item => v.data === "zero" ? {...item, value:0} : item)})));
    }
    case "composition-bar": {
      const items = [
        {id:"original",label:"Originals",value:54},
        {id:"exports",label:"Exports",value:24},
        {id:"backups",label:v.data === "long labels" ? "Archived workspace backups" : "Backups",value:14},
        {id:"other",label:"Other",value:v.data === "small share" ? .04 : 8},
      ];
      const parts = v.data === "empty" ? [] : v.data === "zero" ? items.map(item=>({...item,value:0})) : items;
      return element("Surface", {padding:"4",style:{width:v.narrow ? "17rem" : "35rem",maxInlineSize:"100%"}},
        element("Stack", {gap:"4"}, element("Heading", {level:2,size:"group"}, "Storage by file type"),
          element("CompositionBar", {label:"Storage by file type",items:parts,layout:v.layout,readout:v.readout,
            formatValue:binding('(amount) => `${amount} GB`',(amount:number)=>`${amount} GB`)})));
    }
    case "heatmap": {
      const columns = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
      const readings = [
        [4, 13, 23, 20, 12, 6],
        [7, 17, 32, 26, 18, 8],
        [5, 22, 38, 30, 20, 9],
        [8, 26, 41, 33, 19, 11],
        [4, 16, 29, 22, 11, 3],
        [0, 5, 10, 7, 3, 0],
        [0, 2, 5, 4, 2, 0],
      ];
      const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
        id:label, label, values:readings[i].map((value, j) => v.data === "gaps" && i === 2 && j >= 3 ? null : value),
      }));
      return element("Surface", {padding:"4", style:{width:"36rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Requests by hour"),
          element("Heatmap", {label:"Requests by hour", columns, rows:v.data === "empty" ? [] : rows, max:42})));
    }
    case "scatter-chart": {
      const samples = [[12,110],[18,136],[24,121],[31,155],[39,147],[43,177],[52,162],[58,204],[65,195],[72,235],[78,216],[86,265],[95,252],[104,301]];
      const points = samples.map(([x, y], i) => ({id:String(i + 1), label:`Run ${i + 1}`, x, y}));
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Response time by traffic"),
          element("ScatterChart", {label:"Response time by traffic", xLabel:"Requests / sec", yLabel:"Response time (ms)",
            points:v.data === "empty" ? [] : v.data === "single" ? points.slice(6, 7) : points})));
    }
    case "range-chart": {
      const samples = [[84,162,119],[92,176,125],[78,149,106],[104,207,151],[92,188,133],[66,134,93],[71,145,98]];
      const items = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label, i) => {
        const [low, high, midpoint] = samples[i];
        const missing = v.data === "gap" && i === 2;
        return {id:label, label, low:missing ? null : low, high:missing ? null : high,
          midpoint:!missing && v.midpoint ? midpoint : undefined};
      });
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Daily response time"),
          element("RangeChart", {label:"Daily response time in milliseconds", items:v.data === "empty" ? [] : items,
            lowLabel:"P10 (ms)", highLabel:"P90 (ms)", midpointLabel:"Median (ms)"})));
    }
    case "dumbbell-chart": {
      const items = [
        {id:"api",label:"API",before:242,after:164},
        {id:"search",label:"Search",before:188,after:128},
        {id:"billing",label:"Billing",before:153,after:190},
        {id:"auth",label:"Auth",before:112,after:112},
        {id:"reports",label:"Reports",before:279,after:218},
      ];
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Response time before and after"),
          element("DumbbellChart", {label:"Response time before and after", domain:[80,300],
            items:v.data === "empty" ? [] : items.map(item => v.data === "missing" && item.id === "billing" ? {...item,after:null} : item),
            formatValue:binding('(value: number) => `${value} ms`', (value:number)=>`${value} ms`)})));
    }
    case "box-plot": {
      const rows = [
        ["api", "API", 42, 74, 96, 128, 176],
        ["search", "Search", 32, 58, 88, 154, 210],
        ["billing", "Billing", 54, 87, 117, 145, 185],
        ["auth", "Auth", 26, 43, 58, 71, 102],
        ["reports", "Reports", 66, 91, 131, 171, 224],
      ] as const;
      const items = rows.map(([id, label, low, q1, median, q3, high], index) => ({
        id, label,
        summary:v.data === "gap" && index === 2 ? null :
          v.data === "flat" && index === 2 ? {low:median, q1:median, median, q3:median, high:median} : {low, q1, median, q3, high},
        outliers:v.outliers && index === 0 ? [203] : undefined,
      }));
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Request latency (ms)"),
          element("BoxPlot", {label:"Request latency by service", items:v.data === "empty" ? [] : items, domain:[0, 240]})));
    }
    case "bullet-chart": {
      const items = [
        {id:"web",label:"Web",value:74,target:80},
        {id:"email",label:"Email",value:56,target:50},
        {id:"chat",label:"Chat",value:42,target:65},
      ];
      return element("Surface", {padding:"4", style:{width:"36rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Resolved requests"),
          element("BulletChart", {label:"Resolved requests by channel", items:v.data === "empty" ? [] :
            items.map(item => v.data === "zero" ? {...item,value:0} : item), max:100})));
    }
    case "histogram": {
      const counts = [5, 16, 34, 49, 41, 28, 17, 9, 4, 0];
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, "Request latency distribution"),
          element("Histogram", {label:"Request latency distribution", xLabel:"Latency (ms)", countLabel:"Requests",
            start:0, binWidth:50, counts:v.data === "empty" ? [] : v.data === "zero" ? counts.map(() => 0) : counts})));
    }
    case "waterfall-chart": {
      const signed = v.data === "signed";
      const label = signed ? "Cash balance" : "Net revenue";
      const steps = signed ? [
        {id:"opening",label:"Opening",value:8000,kind:"total"},
        {id:"payroll",label:"Payroll",value:-11000},
        {id:"receipts",label:"Receipts",value:7000},
        {id:"rent",label:"Rent",value:-2000},
        {id:"closing",label:"Closing",value:2000,kind:"total"},
      ] : [
        {id:"gross",label:"Gross",value:32000,kind:"total"},
        {id:"upsells",label:"Upsells",value:6000},
        {id:"refunds",label:"Refunds",value:-4500},
        {id:"fees",label:"Fees",value:-2500},
        {id:"net",label:"Net",value:31000,kind:"total"},
      ];
      return element("Surface", {padding:"4", style:{width:"42rem",maxWidth:"100%"}},
        element("Stack", {gap:"3"}, element("Heading", {level:2,size:"group"}, label),
          element("WaterfallChart", {label, steps:v.data === "empty" ? [] : steps,
            formatValue:binding('(value: number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format(value)',
              new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format)})));
    }
    case "bar-list": {
      const items = [
        {id:"overview", label:"Overview", value:214},
        {id:"components", label:"Components", value:136},
        {id:"installation", label:"Installation", value:82},
        {id:"foundations", label:"Foundations", value:34},
      ];
      return element("Surface", {padding:"4", style:{width:"26rem",maxWidth:"100%"}},
        element("Stack", {gap:"4"}, element("Heading", {level:2,size:"group"}, "Visits by page"),
          element("BarList", {label:"Visits by page", tone:v.tone, items:v.data === "empty" ? [] : items.map(item => v.data === "zero" ? {...item, value:0} : item)})));
    }
    case "activity-timeline":
    case "timeline": {
      const grouped = slug === "activity-timeline";
      const activity = grouped || v.mode === "activity";
      const layout = grouped ? "feed" : v.layout;
      const width = {width:v.constrainWidth?"18rem":"34rem",maxInlineSize:"100%"};
      if (grouped && v.empty) return element("ActivityTimeline", {label:"Export activity",groups:[],style:width,
        emptyContent:binding('<EmptyState title="No activity yet" />', <Flood.EmptyState title="No activity yet" />)});
      if (activity && layout !== "stacked") {
        const when = (time: string) => ({timeLabel:v.times ? time : undefined, dateTime:`2026-11-14T${time}:00`});
        const comments = [
          {id:"maya",author:{name:"Maya Chen"},body:"The source file is attached. Could you check the export before approval?"},
          {id:"sam",author:{name:"Sam Rivera"},body:"Checked the export against the source. Both are ready."},
        ];
        const reaction = element("ReactionButton",{label:"Helpful",icon:binding("<ThumbsUp />",<ThumbsUp />),count:binding("checked ? 3 : 2",v.checked ? 3 : 2),pressed:choice.checked,onPressedChange:binding("setChecked",actions.checked)});
        const reactionCode = printRecipe(reaction,new Set(),new Set());
        const thread = element("Collapsible",{title:"2 comments",variant:"flush",controlSize:"sm",defaultOpen:true},
          element("CommentThread",{"aria-label":"Export review comments",items:binding(
            `[{...${JSON.stringify(comments[0])}, reactions:${reactionCode}}, ${JSON.stringify(comments[1])}]`,
            [{...comments[0],reactions:renderRecipe(reaction)},comments[1]])}));
        const file = element("FileList",{label:"Attached files",appearance:"embedded"},
          element("FileItem",{name:"Source export.pdf",format:null,size:2400000,metadataVariant:"plain",lang:"en-US"}));
        const handoff = element("Alert",{tone:"warning",appearance:"inline"},"The export link expires at 17:00.");
        const approvalChange = element("ValueChange",{layout:"adaptive",
          before:binding('<StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />',<Flood.StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />),
          after:binding('<StatusIndicator label="Ready for approval" tone="success" presentation="chip" size="sm" />',<Flood.StatusIndicator label="Ready for approval" tone="success" presentation="chip" size="sm" />),
        });
        const rows: Array<{item:Flood.TimelineItem; content?:ElementRecipe; icon?:Binding}> = layout === "feed" ? [
          {item:{id:"requested",title:"Review requested",...when("09:10")}},
          {item:{id:"file",title:"Maya Chen attached the source file",...when("09:24")},icon:binding("<Paperclip />",<Paperclip />),content:file},
          {item:{id:"review",title:"Export reviewed",...when("10:12")},icon:binding("<MessageCircle />",<MessageCircle />),content:thread},
          {item:{id:"complete",title:"Approval status changed",...when("11:20")},content:approvalChange},
        ] : [
          {item:{id:"queued",title:"Export queued",...when("09:10")}},
          {item:{id:"ready",title:"Export ready",...when("09:24"),connector:"dashed"},content:file},
          {item:{id:"handoff",title:"Client handoff",...when("11:30")},content:handoff},
          {item:{id:"expiry",title:"Link expires",...when("17:00")}},
        ];
        const items = rows.map(({item, content, icon}) => ({...item, icon:icon?.value as ReactNode,
          content:v.descriptions && content ? renderRecipe(content) : undefined}));
        const source = '[\n' + rows.map(({item, content, icon}) => {
          const properties = [JSON.stringify(item).slice(1, -1)];
          if(icon) properties.push(`icon:${icon.expression}`);
          if(v.descriptions && content) properties.push(`content:(${printRecipe(content,new Set(),new Set())})`);
          return `{ ${properties.join(", ")} }`;
        }).join(",\n") + '\n]';
        if (grouped) {
          const first = {id:"13-nov",label:"13 November",dateTime:"2026-11-13"};
          const second = {id:"14-nov",label:"14 November",dateTime:"2026-11-14"};
          const priorItems = [
            {id:"export-created",title:"Export created",timeLabel:v.times ? "15:42" : undefined,dateTime:"2026-11-13T15:42:00"},
            {id:"maya-assigned",title:"Assigned to Maya Chen",timeLabel:v.times ? "16:03" : undefined,dateTime:"2026-11-13T16:03:00"},
          ];
          return element("ActivityTimeline",{label:"Export activity",density:v.density,style:width,groups:binding(
            `[${JSON.stringify({...first,items:priorItems})}, {...${JSON.stringify(second)}, items: ${source}}]`,
            [{...first,items:priorItems},{...second,items}],
          )});
        }
        return element("Timeline",{label:layout === "feed" ? "Export activity" : "Export schedule",mode:"activity",layout,
          density:v.density,items:binding(source,items),style:width});
      }
      return element("Timeline", {
        label: activity ? "Ticket activity" : "Project progress",
        mode: activity ? "activity" : "progress",
        density: v.density,
        style:v.constrainWidth ? {maxInlineSize:"18rem"} : undefined,
        items: activity ? [
          {id:"opened", title:"Ticket opened", description:v.descriptions ? "Maya Chen reported an export issue." : undefined, dateTime:"2026-10-26T09:00:00Z", timeLabel:v.times ? "09:00" : undefined},
          {id:"reproduced", title:"Issue reproduced", description:v.descriptions ? "Sam Rivera reproduced the failure." : undefined, dateTime:"2026-10-26T10:30:00Z", timeLabel:v.times ? "10:30" : undefined},
          {id:"assigned", title:"Assigned to Engineering", description:v.descriptions ? "The export service team owns the investigation." : undefined, dateTime:"2026-10-26T11:15:00Z", timeLabel:v.times ? "11:15" : undefined},
        ] : [
          {id:"created", title:"Project created", state:"complete", description:v.descriptions ? "Your workspace is ready." : undefined, dateTime:"2026-10-26T09:00:00Z", timeLabel:v.times ? "09:00" : undefined},
          {id:"review", title:"Design review", state:"current", description:v.descriptions ? "Reviewing the dark foundations." : undefined, dateTime:"2026-10-26T10:30:00Z", timeLabel:v.times ? "10:30" : undefined},
          {id:"release", title:"Release", state:"upcoming", description:v.descriptions ? "Publish when the review is complete." : undefined},
        ],
      });
    }

    case "tree": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Tree", {label:"Project files",controlSize:v.controlSize,multiple:v.multiple,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,defaultExpandedValues:["source","ui","docs"],items:v.empty?[]:[{value:"source",label:"Source",selectable:false,children:[{value:"ui",label:"Components",selectable:false,children:[{value:"button",label:"Button.tsx",description:v.showDescriptions?"Reusable project action":undefined},{value:"input",label:"Input.tsx"}]},{value:"tokens",label:"tokens.json"}]},{value:"docs",label:"Documentation",hasChildren:true,loading:v.loading,children:v.loading?undefined:[{value:"intro",label:"Introduction.md"}]},{value:"readme",label:"README.md"},{value:"archived",label:"Archived",disabled:true}]}));
    case "navigation-tree": return element("div", {style:{width:"24rem",maxWidth:"100%"}}, element("NavigationTree",{label:"Documentation",size:v.size,branchGuides:v.branchGuides,currentValue:v.currentValue,defaultExpandedValues:["start","components"],items:[{value:"start",label:"Getting started",children:[{value:"introduction",label:"Introduction",href:"#introduction"},{value:"installation",label:"Installation",href:"#installation"}]},{value:"components",label:"Components",children:[{value:"button",label:"Button",href:"#button"},{value:"input",label:"Input",href:"#input",disabled:v.disableLast}]},...(v.loading?[{value:"more",label:"More guides",content:"Loading guides…"}]:[])]}));
    case "navigation-list": return element("div", {style:{width:"20rem",maxWidth:"100%"}}, element("NavigationList", {label:"Project navigation",currentValue:v.currentValue,size:v.size,items:[{value:"overview",label:"Overview",href:"#overview",group:v.grouped?"Workspace":undefined,description:v.showDescriptions?"Your project at a glance":undefined},{value:"activity",label:"Activity",href:"#activity",group:v.grouped?"Workspace":undefined,description:v.showDescriptions?"Recent changes and updates":undefined},{value:"settings",label:"Settings",href:"#settings",group:v.grouped?"Manage":undefined,description:v.showDescriptions?"Project preferences":undefined}]}));
    case "steps": return element("div",{style:{width:v.narrow?"16rem":"40rem",maxWidth:"100%"}},element("Steps",{label:"Project setup",orientation:v.orientation,currentValue:v.currentValue,items:[{value:"details",title:"Details",description:"Name your project"},{value:"access",title:"Access",description:"Invite your team",status:v.error?"error":undefined},{value:"review",title:"Review",description:"Check and finish",disabled:v.disableLast}],onStepChange:v.interactive?binding('(value) => setStatus(`Step requested: ${value}`)',(value:string)=>actions.setStatus(`Step requested: ${value}`)):undefined}),status);
    case "step-progress": {
      const step = Number(v.step);
      const titles = ["Project details", "Team access", "Review and finish"];
      return element("div", {style:{width:"20rem", maxWidth:"100%"}},
        element("StepProgress", {title:titles[step - 1], step, totalSteps:titles.length}));
    }
    case "app-shell": {
      const side = v.navigationSide === "end" ? "end" : "start";
      const drawer = v.navigationMode === "drawer";
      const responsive = v.navigationMode === "auto";
      const destinations = studioDestinations;
      const drawerCode = `<Drawer title="Workspace navigation" side="${side}" open={drawerOpen} onOpenChange={setDrawerOpen} trigger={props => <Button {...props} size="sm" variant="subtle">Navigation</Button>}><NavigationList label="Workspace" items={destinations.map(item => ({...item, linkProps: {onClick: event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setDrawerOpen(false); }}}))} /></Drawer>`;
      const drawerNavigation = drawer ? <Flood.Drawer title="Workspace navigation" side={side} open={actions.shellDrawerOpen} onOpenChange={actions.setShellDrawerOpen}
        trigger={props => <Flood.Button {...props} size="sm" variant="subtle">Navigation</Flood.Button>}>
        <Flood.NavigationList label="Workspace" items={destinations.map(item => ({...item, linkProps:{onClick:event => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) actions.setShellDrawerOpen(false);
        }}}))} />
      </Flood.Drawer> : undefined;
      const groups = [{id:"workspace",label:"Workspace",hideLabel:true,items:destinations.map((item, index) => ({
        ...item, icon: createElement([House, Folder, Archive][index]),
      }))}];
      const projects = [
        {name:"Design system",detail:"Component library",status:"In progress",tone:"info"},
        {name:"Website",detail:"Marketing",status:"In review",tone:"warning"},
        {name:"Agent guides",detail:"Documentation",status:"In progress",tone:"info"},
        {name:"Release kit",detail:"Product launch",status:"Ready",tone:"success"},
      ] as const;
      const archivedProjects = ["Research library", "Brand exploration"];
      return element("AppShell", {
        scroll:v.scroll, scrollContentInset:"none", navigationSide:side, mainAs:"section", mainLabel:"Workspace preview",
        skipLabel:"Skip to workspace preview", style:v.scroll==="content"?{blockSize:"var(--flood-workbench-shell-height, 20rem)",width:"100%"}:{width:"100%"},
        navigation:v.navigationMode==="docked"||responsive?binding(
          `<Sidebar label="Workspace navigation" size="sm" width="13rem" side="${side}" currentValue="overview" headerLayout="inline" header={({collapsed}) => collapsed ? null : <Inline gap="2" style={{ flexWrap: "nowrap", whiteSpace: "nowrap", overflow: "clip" }}><IconSlot size="sm"><Layers3 /></IconSlot><Text size="label">Flood</Text></Inline>} footer={({collapsed}) => <Inline gap="2" style={{ flexWrap: "nowrap", whiteSpace: "nowrap", overflow: "clip" }}><Avatar name="Maya Chen" size="sm" decorative={!collapsed} />{!collapsed && <Text size="compact">Maya Chen</Text>}</Inline>} groups={[{id:"workspace",label:"Workspace",hideLabel:true,items:destinations.map((item, index) => { const Icon = [House, Folder, Archive][index]; return {...item, icon:<Icon />}; })}]} />`,
          <Flood.Sidebar label="Workspace navigation" size="sm" width="13rem" side={side} currentValue="overview" groups={groups} headerLayout="inline"
            header={({collapsed})=>collapsed ? null : <Flood.Inline gap="2" style={{flexWrap:"nowrap",whiteSpace:"nowrap",overflow:"clip"}}><Flood.IconSlot size="sm"><Layers3 /></Flood.IconSlot><Flood.Text size="label">Flood</Flood.Text></Flood.Inline>}
            footer={({collapsed})=><Flood.Inline gap="2" style={{flexWrap:"nowrap",whiteSpace:"nowrap",overflow:"clip"}}><Flood.Avatar name="Maya Chen" size="sm" decorative={!collapsed} />{!collapsed && <Flood.Text size="compact">Maya Chen</Flood.Text>}</Flood.Inline>} />,
        ):undefined,
        navigationDrawer:responsive?binding(
          '{below:480,title:"Workspace navigation",renderContent:close => <NavigationList label="Workspace" items={destinations.map(item => ({...item,linkProps:{onClick:event => {if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close();}}}))} />}',
          {below:480,title:"Workspace navigation",renderContent:(close:()=>void)=><Flood.NavigationList label="Workspace" items={destinations.map(item=>({...item,linkProps:{onClick:event=>{
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close();
          }}}))} />},
        ):undefined,
        topBar:responsive&&v.showTopBar?binding(
          'navigationTrigger => <AppTopBar bordered start={<>{navigationTrigger}<Text>Flood Studio</Text></>} />',
          (navigationTrigger:ReactNode)=><Flood.AppTopBar bordered start={<>{navigationTrigger}<Flood.Text>Flood Studio</Flood.Text></>} />,
        ):v.showTopBar||drawer?binding(
          `<AppTopBar${v.showTopBar?' bordered':''} start={<>${drawer?drawerCode:''}${v.showTopBar?'<Text>Flood Studio</Text>':''}</>} />`,
          <Flood.AppTopBar bordered={Boolean(v.showTopBar)} start={<>{drawerNavigation}{v.showTopBar&&<Flood.Text>Flood Studio</Flood.Text>}</>} />,
        ):undefined,
        footer:v.showFooter?binding('<Surface padding="2"><Text size="helper">All changes saved</Text></Surface>', <Flood.Surface padding="2"><Flood.Text size="helper">All changes saved</Flood.Text></Flood.Surface>):undefined,
      }, element("Stack", {gap:"6",style:{padding:"var(--flood-sys-space-6)",maxInlineSize:"76rem",marginInline:"auto"}},
        element("PageHeader", {title:"Overview", headingLevel:2, headingSize:"page", headingId:"shell-overview"}),
        {...element("Grid", {minItemWidth:"9rem",gap:"3"},
          ...[["Current projects",projects.length],["In review",projects.filter(project=>project.status==="In review").length],["Archived",archivedProjects.length]].map(([label,value])=>
            element("Card", {density:"compact"}, element("Metric", {label,value,size:"md"}))),
        ), previewClassName:"app-shell-preview-metrics"},
        element("section", {id:"shell-projects"},
          element("Card", {title:"Projects", headingLevel:3, density:"compact"},
            element("DataList", {"aria-label":"Projects",density:"compact",dividers:true},
              ...projects.map(project=>element("DataListItem", {title:project.name,description:project.detail,
                metadata:binding(`<StatusIndicator size="sm" label="${project.status}" tone="${project.tone}" />`,
                  <Flood.StatusIndicator size="sm" label={project.status} tone={project.tone} />),
              })),
            ),
          ),
        ),
        element("section", {id:"shell-archive"},
          element("Card", {title:"Archive", headingLevel:3, density:"compact"},
            element("DataList", {"aria-label":"Archived projects",density:"compact",dividers:true},
              ...archivedProjects.map(title=>element("DataListItem", {title}))),
          ),
        ),
      ));
    }
    case "app-top-bar": return element("div", {style:{width:"36rem",maxWidth:"100%"}}, element("AppTopBar", {
      bordered:v.bordered,
      start:binding('<Breadcrumb label="Workspace path" items={[{label:"Projects",href:"#projects"},{label:"Overview"}]} />', <Flood.Breadcrumb label="Workspace path" items={[{label:"Projects",href:"#projects"},{label:"Overview"}]} />),
      end:v.showActions?binding('<Button variant="subtle" size="sm">Search</Button>', <Flood.Button variant="subtle" size="sm">Search</Flood.Button>):undefined,
    }));
    case "page-header": return element("div", {style:{width:"36rem",maxWidth:"100%"}}, element("PageHeader", {
      title:"Projects", headingLevel:2, headingSize:v.headingSize,
      description:v.showDescription?"Only projects shared with your workspace are listed here.":undefined,
      actions:v.showActions?binding('<Button size="sm">New project</Button>', <Flood.Button size="sm">New project</Flood.Button>):undefined
    }));
    case "section": return element("div",{style:{width:"36rem",maxWidth:"100%"}},element("Section",{title:"Project settings",description:v.showDescription?"Manage the details your team shares.":undefined,headingLevel:Number(v.headingLevel),headingSize:v.headingSize,actions:v.showActions?binding('<Button variant="subtle" size="sm" onClick={() => setStatus("Edit requested.")}>Edit</Button>',<Flood.Button variant="subtle" size="sm" onClick={()=>actions.setStatus("Edit requested.")}>Edit</Flood.Button>):undefined},element("Surface",{elevation:"raised",padding:"4"},text("Section content stays separate from its heading and supporting text."))),status);
    case "split": return element("div",{style:{width:"42rem",maxWidth:"100%"}},element("Split",{side:v.side,ratio:v.ratio,collapseAt:v.collapseAt,gap:v.gap,main:binding('<Surface elevation="raised" padding="4"><Text as="p" size="compact">Main content</Text></Surface>',<Flood.Surface elevation="raised" padding="4"><Flood.Text as="p" size="compact">Main content</Flood.Text></Flood.Surface>),aside:binding('<Surface elevation="default" padding="4"><Text as="p" size="compact">Supporting content</Text></Surface>',<Flood.Surface elevation="default" padding="4"><Flood.Text as="p" size="compact">Supporting content</Flood.Text></Flood.Surface>)}));
    case "center": return element("div",{style:{width:"36rem",maxWidth:"100%"}},element("Surface",{elevation:"raised",padding:"4"},element("Center",{inline:v.inline,maxWidth:v.maxWidth,minHeight:v.minHeight},element("Text",{as:"p",size:"compact"},"This content is centered within a constrained area."))));
    case "skip-link": return element("Stack",{gap:"4"},element("SkipLink",{href:"#skip-link-example-content",id:"skip-link-example"},"Skip to example content"),element("Button",{variant:"subtle",onClick:binding('() => document.getElementById("skip-link-example")?.focus()',()=>document.getElementById("skip-link-example")?.focus())},"Focus skip link"),element("div",{id:"skip-link-example-content",tabIndex:-1},text("The skip link moves keyboard focus here. Press Tab to continue.")));

    case "list-box": {
      const people = v.options === "people";
      const options: Flood.ComboboxOption[] = people ? [
        {value:"maya",label:"Maya Chen",description:"Product design",avatar:{}},
        {value:"sam",label:"Sam Rivera",description:"Engineering",avatar:{}},
        {value:"unassigned",label:"Unassigned"},
        {value:"noah",label:"Noah Park",description:"Operations",avatar:{},disabled:true},
      ] : [{value:"react",label:"React",description:"Component-based interfaces"},{value:"vue",label:"Vue",description:"Progressive interfaces"},
        {value:"svelte",label:"Svelte"},{value:"locked",label:"Unavailable framework",disabled:true}];
      if (v.manyOptions) {
        const extra = people ? ["Lena Hofmann","Alex Morgan","Ari Walker","Robin Smith","June Park","Mina Patel"] : ["Angular","Astro","Qwik","Solid","Lit","Preact"];
        options.push(...extra.map(label=>({value:label,label,avatar:people?{}:undefined})));
      }
      const first = options[0].value;
      return element("ListBox", {key:`${v.options}-${v.multiple}-${v.empty}`,required:v.required,status:fieldStatus,message,
        description:v.showDescription?"Type a name to jump to an option.":undefined,
        label:people?(v.multiple?"Reviewers":"Assignee"):(v.multiple?"Frameworks":"Framework"),
        name:people?"people":"framework",multiple:v.multiple,defaultValue:v.empty?(v.multiple?[]:""):v.multiple?[first]:first,
        options,appearance:v.appearance,controlSize:v.controlSize,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,style:{width:"26rem",maxWidth:"100%"}});
    }
    case "pin-input": return element("PinInput", {key:String(v.length)+String(v.mode),label:"Verification code",name:"code",length:Number(v.length),mode:v.mode,controlSize:v.controlSize,mask:v.mask,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled});
    case "rating": return element("Rating", {key:String(v.max),label:"Your experience",name:"experience",defaultValue:3,max:Number(v.max),size:v.size,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled});
    case "rating-value": return element("RatingValue", {value:v.value==="unrated"?null:Number(v.value),max:Number(v.max),
      count:v.showCount?128:undefined,size:v.size,appearance:v.appearance,showValue:v.showValue});
    case "rating-summary": {
      const counts = v.scenario === "empty" ? [0,0,0,0,0] : v.scenario === "single" ? [0,0,0,1,0] :
        v.scenario === "ten-star" ? [0,1,2,2,5,8,13,20,32,67] : [2,0,4,20,102];
      return element("Surface",{padding:"6",style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("Section",{title:"Customer ratings",headingSize:"group"},
          element("RatingSummary",{label:"Rating breakdown",counts,layout:v.layout})));
    }
    case "dropzone": return element("Dropzone", {label:"Project attachments",name:"attachments",density:v.density,multiple:v.multiple,clearable:v.clearable,required:v.required,disabled:v.disabled,style:{width:"26rem",maxWidth:"100%"}});
    case "file-drop-target": return element("Stack",{gap:"3", style:{width:"28rem",maxWidth:"100%"}},element("FileDropTarget",{
      label:"Import files",multiple:v.multiple,disabled:v.disabled,
      onFilesSelect:binding('(files) => setStatus(files.map(file => file.name).join(", "))',
        (files:File[]) => actions.setStatus(files.map(file => file.name).join(", "))),
    }),status);
    case "character-count": return element("CharacterCount", {count:Number(v.count),max:40,mode:v.mode});

    case "copy-button": return element("CopyButton",{value:"npm install @flood-md/react",size:v.size,variant:v.variant,iconOnly:v.iconOnly,disabled:v.disabled});
    case "reveal-value": return element("div",{style:{width:v.constrainWidth?"12rem":"24rem",maxInlineSize:"100%"}},
      element("RevealValue",{appearance:v.appearance,overflow:v.overflow,copyable:v.allowCopy,
        value:v.longValue?"flood_demo_3f089bf2d2e34452a4e66d53e6af0cf1":"flood_demo_3f089bf2",
        showLabel:"Show token",hideLabel:"Hide token",copyLabel:"Copy token",hiddenValueLabel:"Token hidden"}));
    case "copyable-value": return element("div",{style:{maxInlineSize:v.constrainWidth?"12rem":"28rem"}},
      element("CopyableValue",{
        value:v.longValue?"https://flood.md/docs/installation":"https://flood.md/mcp",
        copyLabel:"Copy URL", appearance:v.appearance, overflow:v.overflow,
      }));
    case "toast-region": {
      const copy = v.longText ? {
        title: "Project preferences were saved",
        description: "Project members will receive the new weekly activity summary on Monday.",
      } : {};
      const status = v.status as Flood.ToastItem["status"];
      const duration = v.autoDismiss ? 5000 : 0;
      const retryCopy = {
        title: "Could not save project preferences",
        description: "Your edits are still available.",
      };
      const previewItems = actions.notifications.map(item => {
        if (!v.showAction) return {...item, ...copy, status, duration};
        if (item.status === "success") return item;
        return {...item, ...retryCopy, status:"error" as const, duration:0,
          action:{label:"Retry save", onClick:() => actions.retryToast(item.id)}};
      });
      const installExample = v.showAction
        ? `notifications.map(item => item.status === "success" ? item : ({
        ...item, ...${JSON.stringify(retryCopy)}, status: "error" as const, duration: 0,
        action: {label: "Retry save", onClick: () => retryToast(item.id)}
      }))`
        : `notifications.map(item => ({...item, ...${JSON.stringify(copy)}, status: ${JSON.stringify(status)} as const, duration: ${duration}}))`;
      return element("Stack",{gap:"4"},
        element("Button",{size:"sm",variant:"subtle",onClick:binding('() => setNotifications(current => [...current, {id: crypto.randomUUID(), title: "Changes saved", description: "Your project preferences are up to date.", duration: 0}])',actions.addToast)},"Show notification"),
        element("ToastRegion",{inline:v.inline||undefined,placement:v.inline?undefined:v.placement,hotkey:false,limit:Number(v.limit),
          items:binding(installExample,previewItems),
          onDismiss:binding('(id) => setNotifications(current => current.filter(item => item.id !== id))',actions.dismissToast)}));
    }
    case "file-input": return {tag:"Field",props:{label:"Attachments",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("FileInput",{name:"attachments",multiple:v.multiple,clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled})};
    case "file-trigger": return element("Stack", {gap:"3"}, element("FileTrigger", {
      label:"Attach files", multiple:v.multiple, disabled:v.disabled, accept:v.imagesOnly?"image/*":undefined,
      onFilesSelect: binding('(files) => setStatus(files.map(file => file.name).join(", "))',
        (files: File[]) => actions.setStatus(files.map(file => file.name).join(", "))),
      trigger: v.presentation === "icon" ? binding(
        '(trigger) => <IconButton {...trigger} label="Attach files" title="Attach files"><Paperclip /></IconButton>',
        (trigger: Flood.FileTriggerControlProps) => <Flood.IconButton {...trigger} label="Attach files" title="Attach files"><Paperclip /></Flood.IconButton>,
      ) : undefined,
    }), status);
    case "avatar-picker": {
      const avatar = actions.avatarPicker;
      return element("AvatarPicker", {
        label:"Profile photo", name:"Alex Morgan", size:v.size, shape:v.shape, busy:v.busy, disabled:v.disabled,
        src:v.source === "stored" ? binding('file === null ? undefined : "/avatar-demo.svg"', avatar.file === null ? undefined : "/avatar-demo.svg") : undefined,
        file:binding("file", avatar.file), error:binding("error", avatar.error || undefined),
        onFileSelect:binding("selectPhoto", avatar.select),
        onRemove:v.removable?binding("removePhoto", avatar.remove):undefined,
      });
    }
    case "search-input": case "password-input": return {tag:"Field",props:{label:slug === "search-input" ? "Search components" : "Password",hideLabel:v.hideLabel,status:fieldStatus,message},field:element(slug === "search-input" ? "SearchInput" : "PasswordInput",{name:slug,defaultValue:slug === "search-input" ? "Design systems" : "flood-demo-password",autoComplete:slug === "search-input" ? "off" : "new-password",controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly,...(slug === "search-input" ? {clearable:v.clearable} : {})})};
    case "field-checklist": case "password-strength": {
      const password = slug === "password-strength";
      const passed = v.scenario === "met" || v.scenario === "strong";
      const pending = v.scenario === "pending";
      const items = [
        {id:"first",label:password ? "Meets the minimum length" : "PDF file",status:pending ? "pending" : "met"},
        {id:"second",label:password ? "Allowed by your organization" : "Under 10 MB",status:pending ? "pending" : passed ? "met" : "unmet"},
      ];
      const width = v.constrainWidth ? "12rem" : "22rem";
      if (!password) return element("div",{style:{width,maxWidth:"100%"}},element("FieldChecklist",{label:"Upload requirements",items}));
      const assessment = pending ? undefined : {value:passed ? 4 : 2,max:4,valueText:passed ? "Strong" : "Fair",tone:passed ? "success" : "warning"};
      return element("Stack",{gap:"3",style:{width,maxWidth:"100%"}},
        {tag:"Field",props:{label:"New password"},field:element("PasswordInput",{name:"new-password",autoComplete:"new-password",readOnly:true,value:pending ? "" : "example-password"})},
        element("PasswordStrength",{assessment,requirements:v.showRequirements ? items : undefined}));
    }
    case "multi-select":
    case "combobox": {
      if (v.options === "people") {
        const multi = slug === "multi-select";
        const options: Flood.ComboboxOption[] = [
          {value:"maya",label:v.longLabels ? "Maya Elizabeth Chen" : "Maya Chen",description:"Product design",avatar:{}},
          {value:"sam",label:"Sam Rivera",description:"Engineering",avatar:{}},
          {value:"noah",label:"Noah Park",description:"Operations",disabled:Boolean(v.disableLast),avatar:{}},
        ];
        if (multi && v.manyTags) options.push({value:"lena",label:"Lena Hofmann",avatar:{}},{value:"alex",label:"Alex Morgan",avatar:{}});
        if (!multi) options.push({value:"unassigned",label:"Unassigned"});
        return {tag:"Field",props:{label:multi?"Reviewers":"Assignee",hideLabel:v.hideLabel,status:fieldStatus,message},field:element(multi?"MultiSelect":"Combobox",{
          key:`people-${Boolean(v.manyTags)}`,name:multi?"reviewers":"assignee",placeholder:"Find a person",
          defaultValue:multi?(v.manyTags?["maya","sam","noah","lena","alex"]:["maya","sam"]):"maya", options,
          maxVisibleTags:multi&&v.maxVisibleTags!=="all"?Number(v.maxVisibleTags):undefined,
          clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled,readOnly:v.readOnly,
        })};
      }
      if (slug === "combobox") return {tag:"Field",props:{label:"Framework",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("Combobox",{key:"framework",name:"framework",placeholder:"Choose a framework",options:[{value:"react",label:"React",description:"Component-based interfaces",keywords:["next","remix"]},{value:"vue",label:"Vue",description:"Progressive interfaces",keywords:["nuxt"]},{value:"svelte",label:"Svelte",description:"Compiled interfaces",disabled:Boolean(v.disableLast)}],clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled,readOnly:v.readOnly})};
      return {tag:"Field",props:{label:"Frameworks",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("MultiSelect",{
      key:String(v.manyTags),name:"frameworks",placeholder:"Search frameworks",
      maxVisibleTags:v.maxVisibleTags==="all"?undefined:Number(v.maxVisibleTags),
      defaultValue:v.manyTags?["react","vue","angular","solid","qwik"]:["react","vue"],
      options:[{value:"react",label:v.longLabels?"React for thoughtfully composed product interfaces":"React",description:"Component-based interfaces"},
        {value:"vue",label:v.longLabels?"Vue for progressive web applications":"Vue"},
        ...(v.manyTags?[{value:"angular",label:"Angular"},{value:"solid",label:"Solid"},{value:"qwik",label:"Qwik"}]:[]),
        {value:"svelte",label:"Svelte",disabled:Boolean(v.disableLast)}],
      clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled,readOnly:v.readOnly,
      })};
    }
    case "number-input": return {tag:"Field",props:{label:"Seats",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("NumberInput",{name:"seats",defaultValue:5,min:0,max:20,step:Number(v.step),controlSize:v.controlSize,appearance:v.appearance,disabled:v.disabled,readOnly:v.readOnly})};
    case "number-range-field": {
      const [minimum, maximum] = actions.budgetRange.values;
      const endpoint = (label: string, name: string, index: 0 | 1) => binding(
        `{label: "${label}", name: "${name}", value: range[${index}], onValueChange: (value) => updateBound(${index}, value)}`,
        { label, name, value: actions.budgetRange.values[index], onValueChange: (value: number | null) => actions.budgetRange.set(index, value) },
      );
      return element("NumberRangeField", {label: "Budget (USD)", controlSize: v.controlSize, min: 0,
        start: endpoint("Minimum", "budgetMin", 0), end: endpoint("Maximum", "budgetMax", 1),
        error: binding("rangeError", minimum !== null && maximum !== null && minimum > maximum ? "Maximum must be at least the minimum." : undefined),
        required: v.required, disabled: v.disabled, readOnly: v.readOnly, style:{width:"100%",maxWidth:"24rem"}});
    }
    case "slider": return element("Slider",{key:v.range?"range":"single",label:v.range?"Price range":"Volume",name:"level",defaultValue:v.range?[25,75]:[50],min:0,max:100,step:Number(v.step),showValue:v.showValue,valuePlacement:v.valuePlacement,controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly,hideLabel:v.hideLabel,status:fieldStatus,message});
    case "container": return element("div", {style:{width:"100%"}}, element("Container", {size:v.size,gutter:v.gutter},element("Text",{as:"p",size:"compact"},"Content stays within a readable width.")));
    case "grid": return element("Grid", {columns:v.columns === "auto"?undefined:Number(v.columns),minItemWidth:v.minItemWidth,gap:v.gap}, ...["First", "Second", "Third"].map(label=>element("Surface",{padding:"4"},element("Text",{size:"compact"},label))));
    case "visually-hidden": return element("Stack", {gap:"3"}, element("Text", {as:"p",size:"compact"},v.focusable?"Press Tab to reveal the link.":"Supporting text remains available to assistive technology."),element("VisuallyHidden",{focusable:v.focusable},v.focusable?element("Link",{href:"#usage"},"Skip to example code"):"Changes save automatically."));
    case "aspect-ratio": return element("div", {style:{width:"22rem",maxWidth:"100%"}},element("AspectRatio",{ratio:Number(v.ratio)},element("Image",{src:"/flood-mark.png",alt:"Flood logo",fit:"contain"})));
    case "image": return element("div", {style:{width:"12rem",maxWidth:"100%"}},element("AspectRatio",{ratio:1.5},element("Image",{src:"/flood-mark.png",alt:v.decorative?"":"Flood logo",fit:v.fit,width:160,height:160})));
    case "image-comparison": return element("ImageComparison",{
      label:"Line version, visible percentage", ratio:2, fit:v.fit, dir:v.direction, disabled:v.disabled,
      before:{src:"/comparison-line.png",alt:"Weekly visits plotted with straight line segments",label:"Line"},
      after:{src:"/comparison-area.png",alt:"The same weekly visits plotted with a smooth line and area fill",label:"Area"},
      style:{inlineSize:v.narrow?"18rem":"44rem",maxInlineSize:"100%"},
    });
    case "list": return element("List", {ordered:v.ordered,marker:v.marker,gap:v.gap},element("li",{},"Install the matching packages."),element("li",{},"Import the stylesheet."),element("li",{},"Compose with Flood."));
    case "empty-state": return element("Stack",{gap:"4",style:{width:"26rem",maxInlineSize:"100%"}},element("EmptyState",{title:"No projects yet",description:v.showDescription?"Projects you create appear here.":undefined,density:v.density,layout:v.layout,icon:v.showIcon?binding('<Plus />',<Plus />):undefined,actions:v.showActions?binding('<Button size="sm" onClick={() => setStatus("Creation requested locally.")}>Create project</Button>',<Flood.Button size="sm" onClick={()=>actions.setStatus("Creation requested locally.")}>Create project</Flood.Button>):undefined}),status);
    case "no-results": {
      const recovered = v.state === "ready";
      return element("Surface", {padding:"4",style:{width:v.narrow?"15rem":"30rem",maxInlineSize:"100%"}},
        element("NoResults", {title:"No matching projects",layout:v.layout,density:v.density,
          hidden:binding("recovered",recovered),onReset:v.showReset ? binding("() => setRecovered(true)",actions.restoreTable) : undefined}),
        binding('recovered && <DataList aria-label="Projects" tabIndex={-1} ref={node => { node?.focus({ preventScroll: true }); }}><DataListItem title="Design system" /><DataListItem title="Website refresh" /></DataList>',
          recovered ? <Flood.DataList aria-label="Projects" tabIndex={-1} ref={focusRecoveredActivity}>
            <Flood.DataListItem title="Design system" /><Flood.DataListItem title="Website refresh" />
          </Flood.DataList> : null));
    }
    case "error-state": {
      const recovered = v.state === "ready";
      return element("div",{style:{width:"26rem",maxInlineSize:"100%"}},
        element("ErrorState",{
          title:"Could not load project activity",description:v.showDescription?"The activity service did not respond.":undefined,
          layout:v.layout,density:v.density,retrying:v.retrying,hidden:binding("recovered",recovered),
          onRetry:v.showRetry?binding("() => setRecovered(true)",actions.restoreTable):undefined,
        }),
        binding('recovered && <DataList aria-label="Project activity" tabIndex={-1} ref={node => { node?.focus({ preventScroll: true }); }}><DataListItem title="Design review completed" description="Maya Chen" metadata="09:24" /></DataList>',
          recovered ? <Flood.DataList aria-label="Project activity" tabIndex={-1} ref={focusRecoveredActivity}><Flood.DataListItem title="Design review completed" description="Maya Chen" metadata="09:24" /></Flood.DataList> : null));
    }
    case "card": return element("div", {style:{width:v.narrow?"16rem":v.longHeader?"30rem":"26rem",maxWidth:"100%"}},
      element("Card", {
        density:v.density,elevation:v.elevation,headingSize:v.headingSize,title:v.showTitle?(v.longHeader?"Design system rollout":"Project details"):undefined,
        media:v.showMedia?cardMedia():undefined,
        description:v.showDescription?"Release on 12 November":undefined,
        actions:v.showActions?(v.longHeader?binding('<Link href="/playground/settings" size="sm" variant="subtle">Workspace settings</Link>',
          <Flood.Link href="/playground/settings" size="sm" variant="subtle">Workspace settings</Flood.Link>)
          :binding('<Badge tone="success">Active</Badge>', <Flood.Badge tone="success">Active</Flood.Badge>)):undefined,
        footer:v.showFooter?binding('<Button variant="subtle" size="sm" onClick={() => setStatus("Opened locally.")}>Open project</Button>',
          <Flood.Button variant="subtle" size="sm" onClick={()=>actions.setStatus("Opened locally.")}>Open project</Flood.Button>):undefined,
        footerDivider:v.footerDivider,
        selection:v.selectable?binding(
          `{label:"Select project", checked:Boolean(listSelection.project), disabled:${Boolean(v.selectionDisabled)}, onCheckedChange:(checked: boolean) => setListSelection(current => ({...current, project:checked}))}`,
          {label:"Select project",checked:Boolean(actions.listSelection.project),disabled:Boolean(v.selectionDisabled),
            onCheckedChange:(checked:boolean)=>actions.setListSelection("project",checked)},
        ):undefined,
      },element("Text",{as:"p",size:"compact"},"Homepage and checkout")),status);
    case "kbd": return element("Kbd", {size:v.size}, "Esc");
    case "keyboard-shortcut": {
      const mac = v.example === "macOS glyphs";
      const keys = mac ? ["⌘", "⇧", "K"] : v.example === "three keys" ? ["Ctrl", "Shift", "K"] : ["Alt", "K"];
      return element("Inline",{dir:v.rtl ? "rtl" : undefined},element("KeyboardShortcut",{keys,label:mac ? "Command plus Shift plus K" : undefined,size:v.size,presentation:v.presentation}));
    }
    case "toolbar": {
      const vertical = v.orientation === "vertical";
      const iconRail = vertical && v.shape === "pill";
      const labeledColumn = vertical && !iconRail;
      const control = {
        variant: "ghost", size: "sm",
        style: labeledColumn ? { inlineSize: "100%" } : undefined,
      };
      const undo = { ...control, disabled: v.disableUndo, onClick: binding('() => setStatus("Undone locally.")', () => actions.setStatus("Undone locally.")) };
      const share = { ...control, onClick: binding('() => setStatus("Shared locally.")', () => actions.setStatus("Shared locally.")) };
      return element("Stack", { gap: "4" }, element("Toolbar", {
        label: "Editor actions", variant: v.variant, shape: v.shape, orientation: v.orientation, loop: v.loop,
      },
      labeledColumn ? element("Button", undo, "Undo") : element("IconButton", { ...undo, label: "Undo" }, element("Undo2")),
      ...["Bold", "Italic"].map(label => labeledColumn
        ? element("Toggle", control, label)
        : element("Toggle", { ...control, "aria-label": label, iconOnly: true }, element(label))),
      element("Divider", { "aria-orientation": vertical ? "horizontal" : "vertical" }),
      iconRail ? element("IconButton", { ...share, label: "Share" }, element("Share2")) : element("Button", share, "Share")),
      status);
    }
    case "context-menu": return element("Stack",{gap:"4"},element("ContextMenu",{label:"Project actions",controlSize:v.controlSize,disabled:v.disabled,items:[{id:"rename",label:"Rename"},{id:"duplicate",label:"Duplicate"},{id:"export",type:"submenu",label:"Export",items:[{id:"json",label:"JSON"},{id:"markdown",label:"Markdown"}]}],onAction:binding('(id) => setStatus(`Selected ${id}.`)',(id:string)=>actions.setStatus(`Selected ${id}.`))},element("Surface",{padding:"6",style:{width:"26rem",maxWidth:"100%",minHeight:"10rem",display:"grid",placeItems:"center"}},element("Text",{size:"compact"},"Right-click or use Shift+F10."))),status);
    case "error-summary": {
      const projectMessage="Enter a project name.", emailMessage="Enter an email address.";
      return element("div",{style:{width:"28rem",maxWidth:"100%"}},element("Stack",{gap:"4"},
        element("ErrorSummary",{title:"Review the form",appearance:v.appearance,
          errors:v.showErrors?[{id:"project",fieldId:"summary-project",message:projectMessage},{id:"email",fieldId:"summary-email",message:emailMessage}]:[],
          formErrors:v.showFormError?[{id:"workspace-limit",message:"This workspace has reached its project limit."}]:undefined,
          description:v.showDescription?"The project hasn’t been created.":undefined,announcement:v.announcement,autoFocus:v.autoFocus}),
        {...element("Field",{id:"summary-project",label:"Project name",status:v.showErrors?"error":undefined,message:v.showErrors?projectMessage:undefined}),field:element("Input",{name:"project"})},
        {...element("Field",{id:"summary-email",label:"Email",status:v.showErrors?"error":undefined,message:v.showErrors?emailMessage:undefined}),field:element("Input",{name:"email",type:"email"})}));
    }
    case "resizable-panels": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("ResizablePanels",{key:`${v.orientation}-${v.defaultValue}`,label:"Resize workspace",orientation:v.orientation,defaultValue:Number(v.defaultValue),disabled:v.disabled,style:{height:"16rem"},main:binding('<Surface padding="4" style={{height:"100%"}}><Text size="compact">Navigation</Text></Surface>',<Flood.Surface padding="4" style={{height:"100%"}}><Flood.Text size="compact">Navigation</Flood.Text></Flood.Surface>),secondary:binding('<Surface padding="4" style={{height:"100%"}}><Text size="compact">Workspace</Text></Surface>',<Flood.Surface padding="4" style={{height:"100%"}}><Flood.Text size="compact">Workspace</Flood.Text></Flood.Surface>)}));
    case "range-calendar": return element("div",{style:{width:"22rem",maxWidth:"100%"}},element("RangeCalendar",{label:"Choose travel dates",defaultValue:{start:"2026-10-12",end:"2026-10-18"},today:"2026-10-26",locale:v.locale,weekStartsOn:Number(v.weekStartsOn),readOnly:v.readOnly,disabled:v.disabled}));
    case "date-range-field": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("DateRangeField",{label:"Travel dates",startName:"start",endName:"end",defaultValue:{start:"2026-10-12",end:"2026-10-18"},controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-range-picker": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("DateRangePicker",{label:"Travel dates",startName:"start",endName:"end",defaultValue:{start:"2026-10-12",end:"2026-10-18"},today:"2026-10-26",locale:v.locale,controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "time-field": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TimeField",{key:String(v.precision),label:"Start time",name:"startTime",defaultValue:v.precision === "second"?"09:30:00":"09:30",precision:v.precision,controlSize:v.controlSize,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "calendar": return element("div",{style:{width:"22rem",maxWidth:"100%"}},element("Calendar",{key:v.granularity,granularity:v.granularity,showViewControls:v.showViewControls,label:"Choose a date",defaultValue:v.granularity==="year"?"2026":v.granularity==="month"?"2026-10":"2026-10-26",today:"2026-10-26",locale:v.locale,weekStartsOn:Number(v.weekStartsOn),readOnly:v.readOnly,disabled:v.disabled}));
    case "date-picker": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("DatePicker",{label:"Start date",name:"start",defaultValue:"2026-10-26",today:"2026-10-26",locale:v.locale,controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-field": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("DateField",{label:"Start date",name:"start",defaultValue:"2026-10-26",controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "command-list": {
      const items = [
        {id:"create",label:"New project",keywords:["add","create"],group:"Projects"},
        {id:"recent",label:"Recent projects",group:"Projects"},
        {id:"settings",label:"Open settings",group:"Workspace"},
        {id:"invite",label:"Invite team",disabled:v.disableLast,group:"Workspace"},
      ];
      const first = {...items[0], description:"Start without a template", shortcut:"Alt+1"};
      const commandItems = v.showDetails ? binding(
        `[{ ...(${JSON.stringify(first)}), icon: <Plus /> }, ...${JSON.stringify(items.slice(1))}]`,
        [{...first,icon:<Plus />}, ...items.slice(1)],
      ) : items;
      const hostShortcut = v.showDetails && !v.disabled && !v.loading ? binding(
        `event => { if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat && !event.nativeEvent.isComposing && event.code === "Digit1") { event.preventDefault(); setStatus("Command: create"); } }`,
        (event:KeyboardEvent) => {
          if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat && !event.nativeEvent.isComposing && event.code === "Digit1") {
            event.preventDefault();
            actions.setStatus("Command: create");
          }
        },
      ) : undefined;
      return element("div", {style:{width:v.constrainWidth ? "15rem" : "28rem",maxWidth:"100%"}},
        element("CommandList", {label:"Search commands",controlSize:v.controlSize,hideLabel:v.hideLabel,loading:v.loading,
          disabled:v.disabled,items:commandItems,onKeyDown:hostShortcut,
          onAction:binding('(id) => setStatus(`Command: ${id}`)',(id:string)=>actions.setStatus(`Command: ${id}`)),
        }),status);
    }
    case "editable": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Editable", {label:"Project name",defaultValue:"Flood workspace",name:"project",placeholder:"Name your project",controlSize:v.controlSize,blurAction:v.blurAction,showActions:v.showActions,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled}));
    case "tag-input": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("TagInput", {
      key:String(v.manyTags),label:"Topics",name:"topics",placeholder:"Add a topic…",controlSize:v.controlSize,
      maxVisibleTags:v.maxVisibleTags==="all"?undefined:Number(v.maxVisibleTags),
      defaultValue:v.manyTags?["Design","React","Accessibility","Typography","Navigation","Release notes"]:["Design","React"],
      status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled,
    }));
    case "menu": {
      const preferences = v.scenario === "preferences";
      const withChoices = v.scenario === "preferences" || v.scenario === "mixed";
      const entries = preferences ? [] : [{id:"rename",label:"Rename…",glyph:"Pencil",shortcut:"F2"},{id:"duplicate",label:"Duplicate",glyph:"Copy",shortcut:"⌘D"},{id:"archive",label:"Archive",glyph:"Archive",disabled:Boolean(v.disableArchive)}];
      const glyphs = {Pencil,Copy,Archive,Trash2};
      const objects: Flood.MenuItem[] = entries.map(({glyph,shortcut,...item})=>({...item,...(v.shortcuts&&shortcut?{shortcut}:{}),...(v.icons&&glyph?{icon:createElement(glyphs[glyph as keyof typeof glyphs])}:{})})) as Flood.MenuItem[];
      const sourceEntries = entries.map(({glyph,shortcut,...item})=>JSON.stringify({...item,...(v.shortcuts&&shortcut?{shortcut}:{})}).replace(/}$/,v.icons&&glyph?`,"icon":<${glyph} />}`:"}"));
      if (v.scenario === "submenus" || v.scenario === "mixed") {
        const submenu: Flood.MenuSubmenuItem = {id:"export",type:"submenu",label:"Export",items:[{id:"copy-link",label:"Copy link"},{id:"download",type:"submenu",label:"Download",items:[{id:"download-json",label:"JSON"},{id:"download-markdown",label:"Markdown"}]}]};
        objects.push(submenu);sourceEntries.push(JSON.stringify(submenu));
      }
      if (withChoices) {
        if (!preferences) { objects.push({id:"preferences",type:"separator"}); sourceEntries.push('{id:"preferences",type:"separator"}'); }
        objects.push({id:"notifications",type:"checkbox",label:"Notifications",checked:actions.menuChecked,onCheckedChange:actions.setMenuChecked},{id:"density-divider",type:"separator"},
          ...["Compact","Comfortable"].map(label=>({id:label,type:"radio" as const,group:"Density",label,checked:actions.menuDensity===label,onCheckedChange:()=>actions.setMenuDensity(label)})));
        sourceEntries.push('{id:"notifications",type:"checkbox",label:"Notifications",checked:notificationsEnabled,onCheckedChange:setNotificationsEnabled}', '{id:"density-divider",type:"separator"}',
          ...["Compact","Comfortable"].map(label=>`{id:${JSON.stringify(label)},type:"radio",group:"Density",label:${JSON.stringify(label)},checked:density===${JSON.stringify(label)},onCheckedChange:()=>setDensity(${JSON.stringify(label)})}`));
      }
      if (!preferences) {
        objects.push({id:"danger-divider",type:"separator"},{id:"delete",label:"Delete project",tone:"danger",...(v.icons?{icon:<Trash2/>}:{})});
        sourceEntries.push('{id:"danger-divider",type:"separator"}', `{id:"delete",label:"Delete project",tone:"danger"${v.icons?',icon:<Trash2/>':""}}`);
      }
      const source = `[${sourceEntries.join(", ")}]`;
      const menuLabel = preferences ? "View settings" : "Project actions";
      return element("Stack",{gap:"4"},element("Menu",{label:menuLabel,items:binding(source,objects),side:v.side,align:v.align,controlSize:v.controlSize,disabled:v.disabled,
        onAction:binding('(id) => setStatus(`Selected ${id}.`)',(id:string)=>actions.setStatus(`Selected ${id}.`)),
        trigger:v.iconTrigger?binding(`(trigger) => <IconButton {...trigger} label=${JSON.stringify(menuLabel)}><Ellipsis /></IconButton>`,(p:Flood.OverlayTriggerProps)=>createElement(Flood.IconButton,{...p,label:menuLabel},createElement(Ellipsis))):binding(`(trigger) => <Button {...trigger} variant="subtle">${menuLabel}</Button>`,(p:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...p,variant:"subtle"},menuLabel))}),status);
    }
    case "description-list": {
      const items = [
        {id:"project",term:"Project",description:"Flood design system"},
        {id:"version",term:"Version",description:release.version},
        {id:"owner",term:"Owner",valueOverflow:v.truncateValue?"truncate":undefined,description:v.longValue?"design-system-maintainers@a-very-long-example-company.example":"Design team"},
      ];
      const copyAction = (term: string) => `Copy ${term.toLowerCase()}`;
      const itemsProp = v.showActions ? binding(
        `[${items.map(item => item.id === "project" ? JSON.stringify(item) :
          `{...(${JSON.stringify(item)}), action: <CopyButton iconOnly size="xs" variant="ghost" copyLabel=${JSON.stringify(copyAction(item.term))} value=${JSON.stringify(item.description)} />}`).join(",\n")}]`,
        items.map(item => item.id === "project" ? item : {...item,
          action:<Flood.CopyButton iconOnly size="xs" variant="ghost" copyLabel={copyAction(item.term)} value={item.description} />,
        }),
      ) : items;
      return element("div", {style:{width:v.constrainWidth?"16rem":v.layout==="grid"?"36rem":"28rem",maxWidth:"100%"}},
        element("DescriptionList", {"aria-label":"Project details",layout:v.layout,density:v.density,dividers:v.dividers,items:itemsProp}));
    }
    case "value-change": {
      const status = v.scenario === "status";
      const before = status ? binding('<StatusIndicator label="Draft" presentation="chip" size="sm" />',<Flood.StatusIndicator label="Draft" presentation="chip" size="sm" />)
        : v.scenario === "assignee" ? "Alexandra Konstantinova" : v.scenario === "removed" ? "Approval reminder" : undefined;
      const after = status ? binding('<StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />',<Flood.StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />)
        : v.scenario === "assignee" ? "Release operations team" : v.scenario === "added" ? "Approval reminder" : undefined;
      return element("div",{style:{width:v.constrainWidth?"12rem":"26rem",maxInlineSize:"100%"}},
        element("ValueChange",{before,after,layout:v.layout}));
    }
    case "change-list": return element("ChangeList",{
      "aria-label":"Project changes",density:v.density,layout:v.layout,valueLayout:v.valueLayout,dividers:v.dividers,
      style:{width:v.constrainWidth?"17rem":"30rem",maxInlineSize:"100%"},
      items:[
        {id:"owner",label:"Owner",before:"Maya Chen",after:"Sam Rivera"},
        {id:"due",label:"Due date",before:"14 Nov",after:"21 Nov"},
        {id:"budget",label:"Budget",before:"$4,500",after:"$5,000"},
        {id:"reminder",label:"Reminder",after:"1 day before"},
      ],
    });
    case "comparison-table": return element("Surface",{
      padding:"4",style:{width:v.constrainWidth?"18rem":"38rem",maxInlineSize:"100%"},
    },element("ComparisonTable",{
      caption:"Backup plans",criterionLabel:"Criterion",density:v.density,
      featuredColumnId:v.highlightCurrent?"current":undefined,
      columns:[{id:"current",label:"Current plan"},{id:"standard",label:"Standard"},{id:"extended",label:"Extended"}],
      rows:[
        {id:"price",label:"Monthly price",numeric:true,cells:{current:"$24",standard:"$38",extended:"$58"}},
        {id:"retention",label:"Retention (days)",numeric:true,cells:{current:7,standard:30,extended:90}},
        {id:"restore",label:"Restore tests per month",numeric:true,cells:{current:0,standard:1,extended:4}},
        {id:"region",label:"Backup region",cells:{current:"US East",standard:"EU Central"}},
      ],
    }));
    case "table-skeleton": {
      const columns = [
        {id:"project",label:"Project",width:"48%",placeholderLines:v.secondaryLine ? 2 : undefined},
        {id:"owner",label:"Owner",width:"26%"},
        {id:"members",label:"Members",width:"26%",align:"end"},
      ];
      const data = [
        ["Design system","Libraries","Maya","12"], ["Website","Growth","Noah","8"],
        ["Help center","Support","Sam","4"], ["Agent guides","Platform","Maya","6"],
        ["Mobile app","Product","Noah","10"],
      ].slice(0, Number(v.rows));
      const tableProps = {caption:"Workspace projects",hideCaption:true,density:v.density,striped:v.striped};
      const table = v.loaded ? element("Table", {...tableProps,style:{tableLayout:"fixed"}},
        element("colgroup",{},...columns.map(column=>element("col",{style:{width:column.width}}))),
        element("thead",{},element("tr",{},...columns.map(column=>element("th",{scope:"col","data-align":column.align},element("TruncatedText",{},column.label))))),
        element("tbody",{},...data.map(([project,team,owner,members])=>element("tr",{},
          element("td",{},element("Stack",{gap:"1"},element("Text",{size:"compact"},project),
            ...(v.secondaryLine ? [element("Text",{size:"helper",tone:"subtle"},team)] : []))),
          element("td",{},owner), element("td",{"data-align":"end"},members)))))
        : element("TableSkeleton", {...tableProps,columns,rows:Number(v.rows),animate:v.animate});
      return element("Surface",{padding:"0",style:{inlineSize:"34rem",maxInlineSize:"100%"}},table);
    }
    case "table": return element("Table", {caption:"Workspace projects",density:v.density,cellVerticalAlign:v.cellVerticalAlign,striped:v.striped,hideCaption:v.hideCaption,style:{minWidth:v.minWidth}},
      element("thead", {}, element("tr", {}, ...["Project", "Status", "Members", "Storage"].map((name,index)=>element("th",{scope:"col",...(index>1?{"data-numeric":true}:{})},name)))),
      element("tbody", {}, ...(v.empty?[element("tr",{},element("td",{colSpan:4},"No projects yet."))]:[["Flood","Active","12","24 GB"],["Portal","Draft","8","16 GB"],["Studio","Active","20","10 GB"]].map(([name,status,members,storage])=>element("tr",{},element("th",{scope:"row"},name),element("td",{},element("Badge",{tone:status==="Active"?"success":"neutral",size:"sm"},status)),element("td",{"data-numeric":true},members),element("td",{"data-numeric":true},storage))))),
      ...(v.footer&&!v.empty?[element("tfoot",{},element("tr",{},element("th",{scope:"row",colSpan:2},"Total"),element("td",{"data-numeric":true},"40"),element("td",{"data-numeric":true},"50 GB")))]:[]));
    case "progress": case "meter": {
      const progress = slug === "progress";
      const unknown = progress && v.indeterminate;
      const valueText = progress ? (unknown ? "Estimating…" : `${v.value}%`) : `${v.value} of 100 GB`;
      return element("div", {style:{width:v.narrow ? "12rem" : "22rem",maxWidth:"100%"}},
        element(progress ? "Progress" : "Meter", {
          label:progress ? "Uploading files" : "Storage used",
          value:unknown ? undefined : Number(v.value),
          layout:v.layout,size:v.size,tone:v.tone,hideLabel:v.hideLabel,valueText:v.showValue ? valueText : undefined,
          reference:!progress && v.reference ? {value:75,label:"Included storage · 75 GB"} : undefined,
        }));
    }
    case "capacity-meter": return element("CapacityMeter", {
      label:"Storage used", used:Number(v.used), capacity:100, warningAt:85, unit:"GB", layout:v.layout, size:v.size,
      style:{width:v.narrow ? "12rem" : "22rem",maxInlineSize:"100%"},
    });
    case "progress-ring": return element("div", {style:{maxInlineSize:v.narrow ? "9rem" : "100%"}},
      element("ProgressRing", {
        label:"Exporting project files", value:v.indeterminate ? undefined : Number(v.value),
        valueText:v.showValue ? (v.indeterminate ? "Estimating…" : `${v.value}%`) : undefined,
        size:v.size, tone:v.tone, hideLabel:v.hideLabel,
      }));
    case "alert": return element("div", {style:{width:v.narrow?"14rem":"26rem",maxWidth:"100%"}}, element("Alert", {
      title:v.showTitle?({neutral:"Project note",info:"A new version is available",success:"Changes saved",warning:"Storage is almost full",error:"Changes could not be saved"} as Record<string,string>)[String(v.tone)]:undefined,
      tone:v.tone,appearance:v.appearance,announcement:v.announcement,icon:v.showIcon?undefined:null,
      action:v.showAction?binding('<Button size="sm" variant="ghost" onClick={() => setStatus("Storage opened.")}>View usage</Button>',
        <Flood.Button size="sm" variant="ghost" onClick={()=>actions.setStatus("Storage opened.")}>View usage</Flood.Button>):undefined,
    }, v.showAction ? "Storage usage is 92%." : "Your work stays here. Choose the next step when you are ready."),status);
    case "badge": return element("Badge", {tone:v.tone, variant:v.variant, size:v.size}, ({neutral:"Draft",accent:"Beta",success:"Active",warning:"Pending",error:"Failed",info:"Updated"} as Record<string,string>)[String(v.tone)]);
    case "count-badge": return element("Inline", {gap:"2"},
      element("Text", {size:"compact"}, "Inbox"),
      element("CountBadge", {count:Number(v.count), max:Number(v.max), presentation:v.presentation, showZero:v.showZero,
        formatLabel:binding('count => count === 1 ? "1 unread message" : `${count} unread messages`', (count:number) => count === 1 ? "1 unread message" : `${count} unread messages`)}));
    case "spinner": return element("Spinner", {size:v.size,decorative:v.decorative,label:"Loading workspace"});
    case "loading-state": return element("div",{style:{width:"26rem",maxInlineSize:"100%"}},element("LoadingState",{
      label:"Loading project activity…",
      description:v.showDescription?"Retrieving archived events may take a moment.":undefined,
      layout:v.layout,density:v.density,announce:v.announce,
    }));
    case "skeleton": return element("div", {style:{width:"16rem",maxWidth:"100%"}}, element("Skeleton", {shape:v.shape,animate:v.animate}));
    case "card-skeleton": {
      const style = {width:"26rem",maxInlineSize:"100%"};
      if (!v.loaded) return element("CardSkeleton", {
        density:v.density, description:v.description, headerAction:v.headerAction,
        mediaRatio:v.showMedia?16/9:undefined,
        footerAction:v.footerAction, footerDivider:v.footerDivider, animate:v.animate, style,
      });
      return element("Card", {
        title:"Project details", density:v.density, footerDivider:v.footerDivider, style,
        media:v.showMedia?cardMedia():undefined,
        description:v.description?"Release on 12 November":undefined,
        actions:v.headerAction?binding('<Badge tone="success">Active</Badge>',<Flood.Badge tone="success">Active</Flood.Badge>):undefined,
        footer:v.footerAction?binding('<Button variant="subtle" size="sm">Open project</Button>',<Flood.Button variant="subtle" size="sm">Open project</Flood.Button>):undefined,
      }, element("Text",{as:"p",size:"compact"},"Homepage and checkout"),
        element("Text",{as:"p",size:"compact"},"Owner: Maya Chen"));
    }
    case "list-skeleton": return element("ListSkeleton", {
      label:"Loading activity…", rows:Number(v.rows), density:v.density, media:v.media,
      description:v.description, metadata:v.metadata, reserveSelectionSpace:v.reserveSelectionSpace, dividers:v.dividers, animate:v.animate,
      style:{width:"29rem",maxInlineSize:"100%"},
    });
    case "avatar": return element("Avatar", {name:"Alex Morgan",size:v.size,shape:v.shape,decorative:v.decorative,
      presence:avatarPresenceExamples.find(({state})=>state===v.presence),
      src:v.image === "loaded" ? "/avatar-demo.svg" : v.image === "broken" ? "/missing-avatar.png" : undefined});
    case "tabs": return element("Tabs", {label:"Project sections", items:[{value:"overview",label:"Overview",content:"Keep the project context in one place."},{value:"activity",label:"Activity",count:v.showCounts?137:undefined,content:"Recent changes and project updates."},{value:"settings",label:"Settings",count:v.showCounts?0:undefined,content:"Choose the settings that fit this project.",disabled:Boolean(v.disableLast)}], variant:v.variant,activationMode:v.activationMode,orientation:v.orientation,controlSize:v.controlSize,disabled:v.disabled,style:{width:v.narrow?"12rem":"26rem",maxWidth:"100%",minHeight:"12rem"}});
    case "breadcrumb": return element("Stack", {gap:"4",style:v.narrow?{width:"16rem",maxInlineSize:"100%"}:undefined}, element("Breadcrumb", {
      items:[{label:"Workspace",href:"#workspace"},{label:"Projects",href:"#projects"},
        ...(v.deepPath?[{label:"Design system",href:"#design-system"},{label:"Releases",href:"#releases"}]:[]),
        {label:v.longTitle?"November accessibility and interaction release notes":"Flood",...(v.currentLink?{href:"#flood"}:{})}],
      separator:v.separator,layout:v.layout,maxVisibleItems:Number(v.maxVisibleItems),
      onClick:binding('event => { if (event.target instanceof Element && event.target.closest("a")) event.preventDefault(); }',
        (event:{target:EventTarget;preventDefault:()=>void})=>{if(event.target instanceof Element && event.target.closest("a"))event.preventDefault();}),
    }));
    case "cursor-pagination": {
      const ranges = ["1–25", "26–50", "51–64"];
      const target = (direction: "previous" | "next") => {
        const previous = direction === "previous";
        const nextPage = actions.page + (previous ? -1 : 1);
        const expression = previous ? "page > 1 ? {onSelect: () => setPage(page - 1)} : undefined" : "page < 3 ? {onSelect: () => setPage(page + 1)} : undefined";
        return binding(expression, nextPage >= 1 && nextPage <= ranges.length ? {onSelect:() => actions.setPage(nextPage)} : undefined);
      };
      return element("CursorPagination", {
        previous:target("previous"),next:target("next"),
        position:v.showPosition ? binding('["1–25", "26–50", "51–64"][page - 1]', ranges[actions.page - 1]) : undefined,
        variant:v.variant,controlSize:v.controlSize,pending:v.request === "idle" ? undefined : v.request,dir:v.rtl ? "rtl" : undefined,
      });
    }
    case "pagination": {
      const page=Math.min(actions.page,Number(v.pageCount));
      const formatPage = v.localizedNumbers ? binding('new Intl.NumberFormat("ar-u-nu-arab", {useGrouping:false}).format', new Intl.NumberFormat("ar-u-nu-arab",{useGrouping:false}).format) : undefined;
      return element("Stack",{gap:"4",style:v.narrow?{width:"12rem",maxInlineSize:"100%"}:undefined},element("Pagination",{page:binding("page",page),pageCount:Number(v.pageCount),siblingCount:Number(v.siblingCount),presentation:v.presentation,controlSize:v.controlSize,disabled:v.disabled,
        formatPage,
        onPageChange:binding("setPage",actions.setPage),...(v.links?{getHref:binding('page => `#page-${page}`',(page:number)=>`#page-${page}`),onClick:binding('event => event.preventDefault()', (event:{preventDefault:()=>void})=>event.preventDefault())}:{})}),...(v.presentation!=="numbered"?[]:[element("Text",{as:"p",size:"compact"},binding('`Page ${page} of '+v.pageCount+'`',`Page ${page} of ${v.pageCount}`))]));
    }
    case "tooltip": return element("Tooltip", {content:"Keep related actions within reach.", side:v.side, align:v.align, delay:Number(v.delay), disabled:v.disabled,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Hover or focus</Button>', (trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Hover or focus"))});
    case "popover": return element("Popover", {key:String(v.defaultOpen),title:"Project settings", side:v.side, align:v.align, defaultOpen:v.defaultOpen, disabled:v.disabled,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Project settings</Button>', (trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Project settings"))},
      element("Stack",{gap:"3"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"Flood"})}));
    case "alert-dialog": return element("Stack", {gap:"4"}, element("AlertDialog",{key:String(v.defaultOpen),title:"Archive this project?",description:"It will leave your active projects. You can restore it from the archive.",confirmLabel:"Archive project",defaultOpen:v.defaultOpen,disabled:v.disabled,confirmDisabled:v.confirmDisabled,onConfirm:binding('() => setStatus("Project archived locally.")',()=>actions.setStatus("Project archived locally.")),onCancel:binding('() => setStatus("Cancelled.")',()=>actions.setStatus("Cancelled.")),trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Archive project</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Archive project"))}), status);
    case "sheet":
    case "drawer": return element("Stack",{gap:"4"},element(slug === "sheet" ? "Sheet" : "Drawer",{key:String(v.defaultOpen),title:"Project settings",side:v.side,size:v.size,defaultOpen:v.defaultOpen,closeOnOutsideClick:v.closeOnOutsideClick,disabled:v.disabled,trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Open settings</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Open settings")),footer:v.showFooter?binding('<Button onClick={(event) => { setStatus("Preferences saved locally."); event.currentTarget.closest("dialog")?.close(); }}>Save changes</Button>',<Flood.Button onClick={event=>{actions.setStatus("Preferences saved locally.");event.currentTarget.closest("dialog")?.close();}}>Save changes</Flood.Button>):undefined},element("Stack",{gap:"4"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"Flood"})},{tag:"Field",props:{label:"Visibility"},field:element("Select",{defaultValue:"private"},element("option",{value:"private"},"Private"),element("option",{value:"team"},"Team"))},...(v.longContent?Array.from({length:12},(_,index)=>text(`Project note ${index+1}: Access review due on 12 November.`)):[]))),status);
    case "search-trigger": {
      const label = v.longLabel ? "Search projects, workspace settings and documents" : "Search workspace";
      const shortcut = v.showShortcut ? ["Alt","K"] : undefined;
      const keyHandler = v.showShortcut ? binding(
        '(event) => { if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat && event.code === "KeyK") { event.preventDefault(); event.currentTarget.click(); } }',
        (event:KeyboardEvent<HTMLButtonElement>) => {
          if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.code !== "KeyK") return;
          event.preventDefault();
          event.currentTarget.click();
        },
      ) : undefined;
      const trigger = (props:Flood.OverlayTriggerProps) => <Flood.SearchTrigger {...props} label={label} iconOnly={Boolean(v.iconOnly)}
        fullWidth={Boolean(v.fullWidth)} variant={v.variant as Flood.ButtonProps["variant"]} size={v.size as Flood.ControlSize}
        shortcut={shortcut} aria-keyshortcuts={shortcut ? "Alt+K" : undefined}
        onKeyDown={keyHandler?.value as ((event:KeyboardEvent<HTMLButtonElement>) => void) | undefined} />;
      const triggerCode = `(props) => <SearchTrigger {...props} label=${JSON.stringify(label)} iconOnly={${v.iconOnly}} fullWidth={${v.fullWidth}} variant=${JSON.stringify(v.variant)} size=${JSON.stringify(v.size)}${keyHandler ? ` shortcut={["Alt","K"]} aria-keyshortcuts="Alt+K" onKeyDown={${keyHandler.expression}}` : ""} />`;
      return element("Stack",{gap:"3",style:{inlineSize:"20rem",maxInlineSize:"100%"}},
        element("CommandPalette",{
          title:"Search workspace",searchLabel:"Search workspace pages",placeholder:"Search pages…",
          items:[{id:"projects",label:"Projects"},{id:"files",label:"Files"},{id:"settings",label:"Workspace settings"}],
          disabled:v.disabled,trigger:binding(triggerCode,trigger),
          onAction:binding("(id) => setStatus(id)",actions.setStatus),
        }),status);
    }
    case "command-palette": {
      const commands = v.scenario === "commands";
      const title = commands ? "Run a command" : "Go to page";
      const labels = commands ? ["New project", "Invite teammate", "Open settings"] : ["All projects", "Assigned to me", "Inbox", "Archive"];
      const items = v.scenario === "empty" ? [] : labels.map((label, index) => ({
        id: label, label, group: v.grouped ? (index < 2 ? "Projects" : "Workspace") : undefined,
        disabled: Boolean(v.disableLast && index === labels.length - 1),
      }));
      return element("Stack", {gap:"3"}, element("CommandPalette", {
        title, searchLabel: commands ? "Search commands" : "Search pages",
        placeholder: commands ? "Search commands…" : "Search pages…",
        emptyMessage: commands ? "No matching commands." : "No matching pages.",
        loadingMessage: "Loading pages…", loading:v.scenario === "loading", density:v.density, items,
        trigger:binding(`(props) => <SearchTrigger {...props} label=${JSON.stringify(title)} />`, (props:Flood.OverlayTriggerProps) => createElement(Flood.SearchTrigger, {...props,label:title})),
        onAction:binding("(id) => setStatus(id)", (id:string) => actions.setStatus(id)),
      }), status);
    }
    case "dialog": return element("Dialog", {key:String(v.defaultOpen),title:"Create a project",defaultOpen:v.defaultOpen,disabled:v.disabled,closeOnOutsideClick:v.closeOnOutsideClick,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Open dialog</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Open dialog"))},
      element("Stack",{gap:"4"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"My project"})},{tag:"Field",props:{label:"Visibility"},field:element("Select",{defaultValue:"private"},element("option",{value:"private"},"Private"),element("option",{value:"team"},"Team"))}));
    case "collapsible": return element("Collapsible", {
      key: String(v.defaultOpen), title: "Advanced settings", variant: v.variant, defaultOpen: v.defaultOpen, controlSize: v.controlSize, disabled: v.disabled,
    }, {tag:"Field",props:{label:"Project prefix"},field:element("Input",{defaultValue:"flood"})});
    case "accordion": {
      const items = [
        {value:"install", title:"How do I install Flood?", content:"Install the matching packages, import the stylesheet and add FloodRoot."},
        {value:"agents", title:"Can my agent use Flood?", content:"Yes. The versioned agent guide describes components, tokens and composition rules."},
        {value:"customize", title:"Can I customize the theme?", content:"Override semantic tokens within your project scope.", disabled:Boolean(v.disableLast)},
      ];
      return element("Accordion", {key:String(v.expansionMode), label:"Flood questions", items, variant:v.variant, expansionMode:v.expansionMode, controlSize:v.controlSize, headingLevel:Number(v.headingLevel), disabled:v.disabled});
    }
    case "segmented-control": {
      const showIcons = v.content === "icons" || v.content === "mixed";
      const names = ["Day", "Week", "Month"], counts = [2, 9, 20], glyphs = [CalendarDays, CalendarRange, Calendar], iconNames = ["CalendarDays", "CalendarRange", "Calendar"];
      const options = names.map((label, index) => ({
        value: label.toLowerCase(), label,
        ...(showIcons ? { icon: createElement(glyphs[index]) } : {}),
        ...(v.content === "counts" ? { count: counts[index] } : {}),
        disabled: Boolean(v.disableLast) && index === 2,
      }));
      const source = `[${options.map(({ value, label, count, disabled }, index) =>
        `{value: ${JSON.stringify(value)}, label: ${JSON.stringify(label)}${showIcons ? `, icon: <${iconNames[index]} />` : ""}${count === undefined ? "" : `, count: ${count}`}${disabled ? ", disabled: true" : ""}}`).join(", ")}]`;
      return element("Stack", { gap: "4", ...(v.fullWidth ? { style: { width: "26rem", maxWidth: "100%" } } : {}) }, element("SegmentedControl", {
        label: "Time range", hideLabel: v.hideLabel, name: "period", defaultValue: "day", options: binding(source, options), controlSize: v.controlSize, orientation: v.orientation,
        iconOnly: v.content === "icons", fullWidth: v.fullWidth, disabled: v.disabled,
        onValueChange: binding('(value) => setStatus(`Selected: ${value}.`)', (value: string) => actions.setStatus(`Selected: ${value}.`)),
      }), status);
    }
    case "toggle": return element("Stack", { gap: "4" }, element("Toggle", {
      key: String(v.defaultPressed), defaultPressed: v.defaultPressed, iconOnly: v.iconOnly, "aria-label": v.iconOnly ? "Bold" : undefined,
      variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading,
      onPressedChange: binding('(pressed) => setStatus(pressed ? "Bold enabled." : "Bold disabled.")', (pressed: boolean) => actions.setStatus(pressed ? "Bold enabled." : "Bold disabled.")),
    }, v.iconOnly ? element("Bold") : "Bold"), status);
    case "toggle-group": {
      const names = ["Bold", "Italic", "Underline"], glyphs = [Bold, Italic, Underline];
      const options = names.map((label, index) => ({ value: label.toLowerCase(), label, ...(v.content !== "text" ? { icon: createElement(glyphs[index]) } : {}), disabled: Boolean(v.disableLast) && index === 2 }));
      const source = `[${names.map((label, index) => `{value: ${JSON.stringify(label.toLowerCase())}, label: ${JSON.stringify(label)}${v.content !== "text" ? `, icon: <${label} />` : ""}${v.disableLast && index === 2 ? ", disabled: true" : ""}}`).join(", ")}]`;
      return element("Stack", { gap: "4" }, element("ToggleGroup", {
        key: String(v.selectionMode), label: "Text formatting", selectionMode: v.selectionMode, orientation: v.orientation,
        size: v.size, variant: v.variant, disabled: v.disabled, iconOnly: v.content === "icons", defaultValue: ["bold"], options: binding(source, options),
        onValueChange: binding('(value) => setStatus(value.length ? value.join(", ") : "No formatting selected.")', (value: string[]) => actions.setStatus(value.length ? value.join(", ") : "No formatting selected.")),
      }), status);
    }
    case "scroll-area": {
      const horizontal = v.orientation === "horizontal";
      return element("Surface", { padding: "4", style: { width: "100%", maxWidth: "26rem" } },
        element("ScrollArea", { orientation: v.orientation, contentInset: v.contentInset, "aria-label": "Project notes", style: { height: "12rem", width: "100%" } },
          element(horizontal ? "Inline" : "Stack", {
            gap: "4", style: horizontal ? { flexWrap: "nowrap", width: "max-content" } : v.orientation === "both" ? { minWidth: "42rem" } : {},
          }, ...Array.from({ length: 12 }, (_, index) => element("Text", {
            as: "p", size: "compact", ...(horizontal ? { style: { width: "12rem", flex: "none" } } : {}),
          }, `Project note ${index + 1}: Access review due on 12 November.`)))));
    }
    case "button-group": return element("Stack", { gap: "4" }, element("ButtonGroup", { label: "Editing actions", orientation: v.orientation }, ...["Undo", "Redo", "History"].map((label, index) => {
      const props = { variant: v.variant, size: v.size, disabled: v.disabled, onClick: binding(`() => setStatus(${JSON.stringify(label + " selected.")})`, () => actions.setStatus(label + " selected.")) };
      const icon = element(["Undo2", "Redo2", "History"][index]);
      return v.content === "icons" || (v.content === "mixed" && index === 2)
        ? element("IconButton", { ...props, label }, icon)
        : element("Button", props, ...(v.content === "mixed" ? [element("IconSlot", { size: v.size }, icon), label] : [label]));
    })), status);
    case "split-button": {
      const items: Flood.MenuItem[] = [{id:"csv",label:"Export CSV"}, {id:"json",label:"Export JSON"}];
      return element("Stack", { gap: "4" }, element("SplitButton", {
        label: "Export report", menuLabel: "Export formats", size: v.size, variant: v.variant, disabled: v.disabled,
        items: binding(JSON.stringify(items), items),
        primaryButtonProps: binding(
          `{disabled: ${Boolean(v.primaryDisabled)}, onClick: () => setStatus("PDF export selected.")}`,
          {disabled: Boolean(v.primaryDisabled), onClick: () => actions.setStatus("PDF export selected.")},
        ),
        onAction: binding('(id) => setStatus(id.toUpperCase() + " export selected.")',
          (id: string) => actions.setStatus(id.toUpperCase() + " export selected.")),
      }, "Export PDF"), status);
    }
    case "input-group": {
      const actionSize = v.controlSize === "sm" ? "2xs" : "sm";
      const actionProps = { variant: "subtle", size: actionSize, disabled: Boolean(v.disabled), onClick: () => actions.setStatus("Opened locally.") } as const;
      const button = binding(`<Button variant="subtle" size="${actionSize}" disabled={${String(v.disabled)}} onClick={() => setStatus("Opened locally.")}>Open</Button>`, createElement(Flood.Button, actionProps, "Open"));
      const iconAction = binding(`<IconButton label="Open" variant="subtle" size="${actionSize}" disabled={${String(v.disabled)}} onClick={() => setStatus("Opened locally.")}><ArrowRight /></IconButton>`, createElement(Flood.IconButton, { ...actionProps, label: "Open" }, createElement(ArrowRight)));
      const startAction = binding(`<IconButton label="Add" variant="subtle" size="${actionSize}" disabled={${String(v.disabled)}} onClick={() => setStatus("Added locally.")}><Plus /></IconButton>`, createElement(Flood.IconButton, { ...actionProps, label: "Add", onClick: () => actions.setStatus("Added locally.") }, createElement(Plus)));
      const start = v.start === "none" ? undefined : v.start === "action" ? startAction : v.start === "icon" ? binding('<IconSlot><Copy /></IconSlot>', createElement(Flood.IconSlot, {}, createElement(Copy))) : v.start;
      const end = v.end === "none" ? undefined : v.end === "action" ? button : v.end === "icon-action" ? iconAction : v.end;
      const [label, value, type] = v.start === "+7" ? ["Phone number (+7)", "999 123 45 67", "tel"] : v.start === "@" ? ["Username", "flood", "text"] : v.start === "$" ? ["Amount in dollars", "100", "text"] : v.end === "kg" ? ["Weight in kilograms", "72", "text"] : ["Website", "example.com", "text"];
      return element("Stack", { gap: "4" }, { tag: "Field", props: { label, hideLabel: v.hideLabel, status: fieldStatus, message }, field: element("InputGroup", {
        key: `${v.start}-${v.end}`, start, end, type,
        controlSize: v.controlSize, disabled: v.disabled, readOnly: v.readOnly, name: "website", defaultValue: value,
      }) }, status);
    }
    case "button": return element("Stack", { gap: "4" }, element("Inline", {}, element("Button", { variant: v.variant, tone: v.tone, size: v.size, disabled: v.disabled, loading: v.loading && (v.retainFocus ? "retain-focus" : true), onClick: action }, "Save changes")), status);
    case "icon-button": return element("Stack", { gap: "4" }, element("Inline", {}, element("IconButton", { label: "Add idea", variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, element("Plus"))), status);
    case "input": case "textarea": return { tag: "Field", props: { label: slug === "input" ? "Project name" : "Project note", hideLabel: v.hideLabel, status: fieldStatus, message }, field: element(slug === "input" ? "Input" : "Textarea", { controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, readOnly: v.readOnly, defaultValue: slug === "input" ? "My project" : "Homepage and checkout" }) };
    case "select": return { tag: "Field", props: { label: "Project visibility", hideLabel: v.hideLabel, status: fieldStatus, message }, field: element("Select", { name: "visibility", controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, defaultValue: "private" }, element("option", { value: "private" }, "Private"), element("option", { value: "team" }, "Team"), element("option", { value: "public" }, "Public")) };
    case "checkbox": return element("Checkbox", { ...choice, indeterminate:v.indeterminate, hideLabel:v.hideLabel, label: "Receive project updates", name: "updates" });
    case "switch": return element("div", {style:v.layout === "row" ? {width:"24rem",maxInlineSize:"100%"} : undefined},
      element("Switch", {...choice, label:"Email notifications", name:"notifications", layout:v.layout,readOnly:v.readOnly,
        description:v.description ? "Receive an email when a review needs your attention." : undefined}));
    case "switch-group": return element("SwitchGroup",{
      legend:"Notifications",legendSize:"section",density:v.density,dividers:v.dividers,disabled:v.disabled,
      style:{width:v.narrow?"15rem":"27rem",maxInlineSize:"100%"},
    },
    element("Switch",{layout:"row",label:"New assignments",name:"assignmentAlerts",defaultChecked:true,
      description:v.description?"Email when a request is assigned to you.":undefined}),
    element("Switch",{layout:"row",label:"Weekly summary",name:"weeklyDigest",
      description:v.description?"One email on Monday with open requests.":undefined}));
    case "setting-row": return element("SettingRow", {
      label:"Flood documentation",
      description:v.description ? "Setup and usage guides." : undefined,
      action:v.showAction ? binding('<Link href="/docs" variant="subtle" size="sm">Open docs</Link>', <Flood.Link href="/docs" variant="subtle" size="sm">Open docs</Flood.Link>) : undefined,
      value:v.longValue ? "https://flood.md/docs/installation"
        : v.showValue ? binding('<Badge size="sm" variant="outline">Public</Badge>',<Flood.Badge size="sm" variant="outline">Public</Flood.Badge>) : undefined,
      valueOverflow:v.valueOverflow,
      layout:v.layout,
      style:{width:v.constrainWidth?"15rem":"28rem",maxInlineSize:"100%"},
    });
    case "setting-group": return element("SettingGroup",{
      title:"Workspace preferences",density:v.density,dividers:v.dividers,
      style:{width:v.constrainWidth?"16rem":"32rem",maxInlineSize:"100%"},
    },element("Switch",{layout:"row",label:"Weekly summary",description:"Receive one email with the week's activity.",defaultChecked:true}),
    {tag:"Field",props:{label:"Default view",layout:"adaptive",hint:"Opens when you enter the workspace."},field:element("Select",{name:"defaultView",controlSize:"sm",defaultValue:"overview"},
      element("option",{value:"overview"},"Overview"),element("option",{value:"activity"},"Activity"))},
    element("SettingRow",{label:"Time zone",description:"Used for dates in workspace activity.",value:"UTC",
      action:binding('<Link href="/playground/settings" variant="subtle" size="sm">Change time zone</Link>',<Flood.Link href="/playground/settings" variant="subtle" size="sm">Change time zone</Flood.Link>),
    }),element("SettingRow",{label:"Help center",action:binding('<Link href="/docs" variant="subtle" size="sm">Read docs</Link>',<Flood.Link href="/docs" variant="subtle" size="sm">Read docs</Flood.Link>)}));
    case "radio": return element("fieldset", { style: { margin: 0, padding: 0, border: 0 } }, element("legend", {}, "Project visibility"), element("Stack", { gap: "2" }, element("Radio", { label: "Private", name: "workbench-visibility", value: "private", disabled: v.disabled, checked: binding("checked", Boolean(v.checked)), onChange: binding("() => setChecked(true)", () => actions.checked(true)) }), element("Radio", { label: "Public", name: "workbench-visibility", value: "public", disabled: v.disabled, checked: binding("!checked", !v.checked), onChange: binding("() => setChecked(false)", () => actions.checked(false)) })));
    case "text": return element("Text", { as: "p", size: v.size, tone: v.tone }, "Quarterly revenue");
    case "expandable-text": return element("div",{style:{width:v.constrainWidth?"15rem":"26rem",maxInlineSize:"100%"}},
      element("ExpandableText",{lines:Number(v.lines),size:v.size},
        v.shortText ? "The export is ready for review."
          : "The export covers the full billing period. The original file contains the individual entries and payment reference for each invoice. Keep it with the summary so reviewers can reconcile the totals with the source."));
    case "truncated-text": return element("div",{style:{width:v.constrainWidth?"14rem":"34rem",maxInlineSize:"100%"}},
      element("Text",{as:"div",size:"compact"},element("TruncatedText",{tooltipSide:v.tooltipSide},
        v.shortText?"Workspace activity export":"Workspace activity export for October 2026.csv")));
    case "heading": return element("Heading", { size: v.size, level: Number(v.level) }, "Room for ideas.");
    case "stack": return element("Stack", { gap: v.gap }, text("One shared foundation."), text("A clear rhythm between things."), element("Button", { variant: "subtle", onClick: action }, "Try an action"), status);
    case "inline": return element("Inline", { gap: v.gap, align: v.align }, element("Button", { onClick: action }, "Save changes"), element("Button", { variant: "subtle", onClick: binding('() => setStatus("Cancelled locally.")', () => actions.setStatus("Cancelled locally.")) }, "Cancel"), status);
    case "surface": return element("Surface", { elevation: v.elevation, padding: v.padding }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Your workspace"), text("A surface gives related content a shared place.")));
    case "icon-slot": return element("IconSlot", { size: v.size, label: v.label || undefined }, element("ArrowRight"));
    case "code-snippet": return element("Stack", { gap: "3" }, element("CodeSnippet", { codeDirection:v.codeDirection, code: String(v.code), ...(v.showPrompt ? { prompt: "$" } : {}), ...(v.copyAction ? { action: binding(`<Button variant="subtle" size="sm" onClick={copy}>Copy</Button>`, createElement(Flood.Button, { variant: "subtle", size: "sm", onClick: actions.copy }, "Copy")) } : {}) }), ...(v.copyAction ? [status] : []));
    case "radio-group": case "checkbox-group": {
      const radio = slug === "radio-group";
      const options = radio ? [{ value: "private", label: "Private" }, { value: "team", label: "Team" }, { value: "public", label: "Public", disabled: true }] : [{ value: "updates", label: "Product updates" }, { value: "releases", label: "Release notes" }, { value: "marketing", label: "Marketing", disabled: true }];
      return element("Stack", { gap: "4" }, element(radio ? "RadioGroup" : "CheckboxGroup", {
        name: radio ? "visibility" : "notifications", legend: radio ? "Visibility" : "Notifications", hideLabel: v.hideLabel, options,
        defaultValue: radio ? "private" : ["updates"], orientation: v.orientation, status: fieldStatus, message,
        disabled: v.disabled, ...(radio ? { required: v.required } : {}),
        onValueChange: radio ? binding('value => setStatus("Selected: " + value)', (value: string) => actions.setStatus("Selected: " + value)) : binding('value => setStatus("Selected: " + (value.join(", ") || "none"))', (value: string[]) => actions.setStatus("Selected: " + (value.join(", ") || "none"))),
      }), status);
    }
    case "label": return element("Stack", { gap: "2" }, element("Label", { htmlFor: "label-example", required: v.required }, "Project name"), element("Input", { id: "label-example", required: v.required, defaultValue: "My project" }));
    case "fieldset": {
      const aligned = v.layout === "aligned";
      return element("div", {style:{width:v.constrainWidth?"16rem":"30rem",maxInlineSize:"100%"}},
        element("Fieldset", {legendSize:v.legendSize, layout:v.layout, hideLabel:v.hideLabel, legend:aligned?"Workspace":"Notifications",
          disabled:v.disabled, hint:v.hint ? (aligned?"These settings apply to the whole team.":"Choose the updates you want.") : undefined,
          status:fieldStatus, message},
          ...(aligned ? [
            {tag:"Field",props:{label:"Workspace name"},field:element("Input",{name:"workspace",defaultValue:"Studio North"})},
            {tag:"Field",props:{label:"Project prefix",labelAside:v.showHelp ? help("About project prefixes","The prefix appears at the start of issue IDs, like SN-42.") : undefined},field:element("Input",{name:"prefix",defaultValue:"SN"})},
          ] : [
            element("Checkbox",{label:"Product updates",name:"updates",defaultChecked:true}),
            element("Checkbox",{label:"Release notes",name:"releases"}),
          ])));
    }
    case "help-tip": return {tag:"Field",props:{label:"Project prefix",labelAside:help("About project prefixes","The prefix appears at the start of issue IDs, like SN-42.")},field:element("Input",{name:"prefix",defaultValue:"SN"})};
    case "field": return { tag: "Field", props: { label: "Project name", layout:v.layout, labelAside: v.showHelp ? help("About project names","Changing the display name leaves existing project links intact.") : undefined, hideLabel: v.hideLabel, status: fieldStatus, message: v.error ? undefined : message, required: v.required, hint: v.hint ? "Visible to your team." : undefined, error: v.error ? "Enter a project name." : undefined }, field: element("Input", { name: "project", defaultValue: "" }) };
    case "save-status": return element("SaveStatus",{state:v.state,announce:v.announce});
    case "form-actions": return element("form",{
      "aria-label":"Project settings",
      style:{width:v.constrainWidth?"15rem":"28rem",maxInlineSize:"100%"},
      onSubmit:binding('event => { event.preventDefault(); setStatus("Changes saved"); }',
        (event:{preventDefault:()=>void})=>{event.preventDefault();actions.setStatus("Changes saved");}),
      onReset:binding('() => setStatus("Changes discarded")',()=>actions.setStatus("Changes discarded")),
    },element("Stack",{gap:"4"},{
      tag:"Field",props:{label:"Project name",required:true},field:element("Input",{name:"project",defaultValue:"Design system"}),
    },element("FormActions",{
      align:v.align,layout:v.layout,
      primary:binding('<Button type="submit" size="sm">Save</Button>',<Flood.Button type="submit" size="sm">Save</Flood.Button>),
      secondary:v.showSecondary?binding('<Button type="reset" size="sm" variant="subtle">Discard changes</Button>',<Flood.Button type="reset" size="sm" variant="subtle">Discard changes</Flood.Button>):undefined,
      status:v.showStatus?binding('<SaveStatus state={status === "Changes saved" ? "saved" : "idle"} label={status || undefined} />',
        <Flood.SaveStatus state={actions.status==="Changes saved"?"saved":"idle"} label={actions.status || undefined} />):undefined,
    })));
    case "divider": return element("Stack", { gap: "4" }, text("Workspace"), element("Divider"), text("Account"));
    case "flood-root": return element("Surface", { padding: "6" }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Neutral. Dark. Local."), text("This composition uses FloodRoot without changing the document theme.")));
    case "link": return element("Link", { href: "/docs/installation", variant: v.variant, size: v.size }, "Read the installation guide");
    case "icon-link": return element("IconLink", {href:"/docs/installation",label:"Read the installation guide",title:"Read the installation guide",variant:v.variant,size:v.size}, element("ArrowRight"));
    default: return text("Choose a component to explore.");
  }
}

function StudioChoice({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const currentLabel = options.find(option => option.value === value)?.label ?? value;
  return <Flood.Sheet title={label} size="sm" open={open} onOpenChange={setOpen} initialFocusRef={list}
    trigger={props => <Flood.Button {...props} size="sm" variant="subtle" className="studio-choice">
      <span className="studio-choice-value"><Flood.Text tone="subtle">{label}: </Flood.Text>{currentLabel}</span>
      <Flood.IconSlot size="sm"><ChevronDown /></Flood.IconSlot>
    </Flood.Button>}>
    <Flood.ListBox ref={list} label={label} hideLabel appearance="plain" selectionBehavior="manual"
      options={options} value={value}
      onValueChange={next => { if (typeof next === "string") { onChange(next); setOpen(false); } }} />
  </Flood.Sheet>;
}

export function ComponentWorkbench({ component, onCodeChange, onImportsChange, importMode = "package", studioHeading, studioReference }: { studioHeading?: ReactNode; studioReference?: ReactNode; component: ComponentPage; onCodeChange: (code: string) => void; onImportsChange?: (names: string[]) => void; importMode?: "package" | "project" }) {
  const studio = Boolean(studioHeading);
  const phone = useStudioMedia(phoneViewport);
  const useChoiceSheets = useStudioMedia(touchPhone);
  const id = useId();
  const [state, setState] = useState(() => ({ slug: component.slug, values: initialValues(component) }));
  const resetAction = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [inboxUnread, setInboxUnread] = useState<Record<string, boolean>>({});
  const setReaction = (id: string, pressed: boolean) => setSelectedReactions(current =>
    pressed ? (current.includes(id) ? current : [...current,id]) : current.filter(reaction=>reaction!==id));
  const [replies, setReplies] = useState<Array<{id: string; body: string}>>([]);
  const replyTrigger = useRef<HTMLButtonElement | null>(null);
  const replyForm = useRef<HTMLFormElement | null>(null);
  const focusReplyEditor = useRef((form: HTMLFormElement | null) => {
    replyForm.current = form;
    form?.querySelector("textarea")?.focus({preventScroll:true});
  }).current;
  const submitReply = () => {
    const body = draft.trim();
    if (!body) return;
    setReplies(current => [...current, {id:crypto.randomUUID(), body}]);
    setDraft("");
  };
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Flood.MessageAttachment[]>([]);
  const addFiles = (files: File[]) => {
    const selected = files.map(file => ({ id: crypto.randomUUID(), label: file.name }));
    setAttachments(current => [...current, ...selected]);
  };
  const removeFile = (id: string) => setAttachments(current => current.filter(file => file.id !== id));
  const send = () => { setDraft(""); setAttachments([]); setStreaming(true); };
  const [filterValue, setFilterValue] = useState<Flood.FilterConditionValue>({property:"status",operator:"is",values:["active"]});
  const [navValue,setNavValue]=useState("overview");
  const [viewValue,setViewValue]=useState("all");
  const [filterGroup, setFilterGroup] = useState<Flood.FilterGroupValue>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});
  const [toolbarSearch,setToolbarSearch]=useState("");
  const [toolbarOpen,setToolbarOpen]=useState(false);
  const [shellDrawerOpen,setShellDrawerOpen]=useState(false);
  const [draftFilters,setDraftFilters]=useState<Flood.FilterGroupValue>({match:"all",conditions:[]});
  const [menuChecked, setMenuChecked] = useState(true);
  const [menuDensity, setMenuDensity] = useState("Compact");
  const [resetKey, setResetKey] = useState(0);
  const [pagination, setPagination] = useState({slug:component.slug,page:1});
  const [notifications, setNotifications] = useState<Flood.ToastItem[]>([{id:"welcome",title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]);
  const stage = useRef<HTMLDivElement>(null);
  const previewFrame = useRef<HTMLDivElement>(null);
  const studioToolbar = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [frameWidth, setFrameWidth] = useState("auto");
  const [zoom, setZoom] = useState("100");
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    const toolbar = studioToolbar.current;
    const article = toolbar?.closest<HTMLElement>("article, main");
    if (!studio || !toolbar || !article) return;
    const measure = () => article.style.setProperty("--studio-toolbar-height", `${toolbar.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    measure();
    return () => {
      observer.disconnect();
      article.style.removeProperty("--studio-toolbar-height");
    };
  }, [studio]);
  useEffect(() => {
    const canvas = stage.current;
    const frame = previewFrame.current;
    if (!studio || zoom !== "fit" || !canvas || !frame) return;
    const measure = () => {
      const style = getComputedStyle(canvas);
      const width = canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = canvas.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const scale = Math.min(1, width / Math.max(1, frame.offsetWidth), height / Math.max(1, frame.offsetHeight));
      setFitScale(Math.max(.01, Math.floor(scale * 100) / 100));
      canvas.scrollTo(0, 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observer.observe(frame);
    measure();
    return () => observer.disconnect();
  }, [studio, zoom, frameWidth, component.slug, resetKey]);
  const drag = useRef<{ pointer: number; x: number; y: number; origin: typeof pan } | null>(null);
  const resetViewPosition = () => {
    setPan({ x: 0, y: 0 });
    stage.current?.scrollTo(0, 0);
  };
  const values = state.slug === component.slug ? state.values : initialValues(component);
  const [fileStates,setFileStates] = useState<Record<string,string>>({});
  const [selectedUploads,setSelectedUploads] = useState<PreviewActions["uploadQueue"]["selected"]>([]);
  const uploadQueue: PreviewActions["uploadQueue"] = {
    selected:selectedUploads,
    add:files=>{
      const picked = files.map(file=>({id:crypto.randomUUID(),name:file.name,size:file.size}));
      setSelectedUploads(current=>[...current,...picked]);
    },
    remove:id=>setSelectedUploads(current=>current.filter(file=>file.id!==id)),
  };
  useEffect(()=>setSelectedUploads([]),[component.slug]);
  const [removedTagIds,setRemovedTagIds] = useState<string[]>([]);
  const [projectEdits, setProjectEdits] = useState<ProjectEdits>({});
  const [listSelection, setListSelection] = useState<Record<string, boolean>>({});
  const [budgetRange, setBudgetRange] = useState(() => budgetRangeExample(values.example));
  const [photo, setPhoto] = useState<File | null>();
  const [photoError, setPhotoError] = useState("");
  const [paletteColor, setPaletteColor] = useState("#ff47a8");
  const resetPhoto = () => { setPhoto(undefined); setPhotoError(""); };
  const setProjectEdit: PreviewActions["setProjectEdit"] = (id, field, value) => {
    const document = stage.current?.ownerDocument;
    const row = document?.activeElement?.closest("tr");
    const table = row?.closest("table");
    setProjectEdits(current => ({ ...current, [id]: { ...current[id], [field]: value } }));
    if (row && table) document?.defaultView?.requestAnimationFrame(() => {
      if (!row.isConnected && document.activeElement === document.body) {
        table.tHead?.querySelector<HTMLButtonElement>(`[data-data-table-column="${field}"] button`)?.focus();
      }
    });
  };
  const change = (name: string, value: string | boolean) => { setState({ slug: component.slug, values: { ...values, ...(name === "status" ? { invalid: false, ...(component.slug === "field" ? { error: false } : {}) } : {}), [name]: value } }); setStatus(""); if(name==="state")setFileStates({}); if(component.slug==="number-range-field" && name==="example")setBudgetRange(budgetRangeExample(value)); if(component.slug==="avatar-picker" && name==="source")resetPhoto(); if(name==="demoUnread")setInboxUnread({}); };
  const callback = useRef(onCodeChange);
  const importsCallback = useRef(onImportsChange);
  useEffect(() => { callback.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { importsCallback.current = onImportsChange; }, [onImportsChange]);
  useEffect(() => { setStatus("");setNavValue("overview");setViewValue("all");setToolbarSearch("");setToolbarOpen(false);setShellDrawerOpen(false);setDraftFilters({match:"all",conditions:[]}); setFilterValue({property:"status",operator:"is",values:["active"]});setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]}); setFileStates({}); setRemovedTagIds([]); }, [component.slug]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(values.code)); setStatus("Copied command."); }
    catch { setStatus("Select the code and copy it manually."); }
  };
  const usesPagination = component.slug === "pagination" || component.slug === "cursor-pagination" || component.slug === "data-table" && Boolean(values.cursorPages);
  const previewPageCount = component.slug === "pagination" ? Number(values.pageCount)
    : component.slug === "data-table" ? Math.max(1,Math.ceil((values.emptyRows ? 0 : projectRowsForPreview(Boolean(values.stickyHeader)).length) / Number(values.pageSize)))
    : 3;
  const currentPage = usesPagination
    ? Math.min(pagination.slug === component.slug ? pagination.page : 1, previewPageCount)
    : 1;
  function openReply(event: MouseEvent<HTMLButtonElement>) {
    replyTrigger.current = event.currentTarget;
    replyForm.current?.querySelector("textarea")?.focus({preventScroll:true});
    change("replyContext", true);
  }
  function cancelReply() {
    change("replyContext", false);
    if (component.slug === "comment") replyTrigger.current?.focus({preventScroll:true});
  }
  const retryToast = (id: string) => setNotifications(current => current.map(item => item.id === id ? {id,title:"Preferences saved",status:"success",duration:5000} : item));
  const recipe = recipeFor(component.slug, values, { uploadQueue, retryToast, inbox:{unread:inboxUnread,set:(id, unread)=>setInboxUnread(current=>({...current,[id]:unread})),markAll:()=>setInboxUnread({mention:false,export:false,settings:false}),retry:()=>change("state","ready")}, reactions:{selected:selectedReactions,set:setReaction}, thread:{replies,submit:submitReply,cancel:cancelReply,openFrom:openReply,focusEditor:focusReplyEditor}, composer: {draft, setDraft, streaming, setStreaming, attachments, addFiles, removeFile, send}, phone, projectEdits, setProjectEdit,listSelection,setListSelection:(id,checked)=>setListSelection(current=>({...current,[id]:checked})), shellDrawerOpen,setShellDrawerOpen,navValue,setNavValue,setCollapsed:(next)=>change("collapsed",next),restoreTable:()=>change("state","ready"),viewValue,setViewValue,toolbarSearch,setToolbarSearch,toolbarOpen,setToolbarOpen,draftFilters,setDraftFilters,filterGroup,setFilterGroup,filterValue,setFilterValue,removedTagIds,removeTag:id=>setRemovedTagIds(ids=>[...ids,id]),fileStates,setFileState:(id,next)=>setFileStates(current=>({...current,[id]:next})), menuChecked, setMenuChecked, menuDensity, setMenuDensity, notifications, addToast:()=>setNotifications(current=>[...current,{id:crypto.randomUUID(),title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]), dismissToast:id=>setNotifications(current=>current.filter(item=>item.id!==id)), status, setStatus:(next)=>{if(next==="Condition removed")resetAction.current?.focus({preventScroll:true});setStatus(next);}, checked: (checked) => change("checked", checked), visible: visible => {
    change("visible", visible);
    if (!visible) queueMicrotask(() => stage.current?.ownerDocument.getElementById(`${id}-visible`)?.focus());
  }, copy, page:currentPage,setPage:page=>setPagination({slug:component.slug,page}),
    palette:{value:paletteColor,select:setPaletteColor},
    avatarPicker: {
      file:photo, error:photoError,
      select:file=>{
        if (!file.type.startsWith("image/")) { setPhotoError("Choose an image file."); return; }
        setPhotoError("");
        setPhoto(file);
      },
      remove:()=>{ setPhoto(null); setPhotoError(""); },
    },
    budgetRange: {
      values: budgetRange,
      set: (index, value) => setBudgetRange(current => index === 0 ? [value, current[1]] : [current[0], value]),
    },
  });
  const hasFeedback = recipe.children?.some(child => typeof child !== "string" && !isBinding(child) && child.previewFeedback);
  const showFeedbackSlot = hasFeedback || component.slug === "code-snippet";
  const previewRecipe = hasFeedback ? {
    ...recipe,
    children: recipe.children?.filter(child => typeof child === "string" || isBinding(child) || !child.previewFeedback),
  } : recipe;
  const imports = new Set<string>(["FloodRoot"]), icons = new Set<string>();
  const jsx = printRecipe(element("FloodRoot", {}, recipe), imports, icons, 2);
  if (component.slug === "comment-thread" || (values.metadata && ["author-meta", "comment"].includes(component.slug))) imports.add("Timestamp");
  if (component.slug === "help-tip" || (component.slug === "field" && values.showHelp) ||
    (component.slug === "fieldset" && values.showHelp && values.layout === "aligned")) imports.add("HelpTip");
  if (component.slug === "code-snippet" && values.copyAction) imports.add("Button");
  if (["tooltip", "popover", "dialog", "alert-dialog", "drawer", "hover-card", "image-preview", "image-gallery"].includes(component.slug)) imports.add("Button");
  if (component.slug === "menu") { imports.add(values.iconTrigger ? "IconButton" : "Button"); if (values.iconTrigger) icons.add("Ellipsis"); if (values.icons) for (const name of ["Pencil", "Copy", "Archive", "Trash2"]) icons.add(name); }
  if (component.slug === "input-group") {
    if (values.end === "action") imports.add("Button");
    if (values.start === "action") { imports.add("IconButton"); icons.add("Plus"); }
    if (values.start === "icon") { imports.add("IconSlot"); icons.add("Copy"); }
    if (values.end === "icon-action") { imports.add("IconButton"); icons.add("ArrowRight"); }
  }
  if (component.slug === "toggle-group" && values.content !== "text") { icons.add("Bold"); icons.add("Italic"); icons.add("Underline"); }
  if (component.slug === "segmented-control" && (values.content === "icons" || values.content === "mixed")) { icons.add("CalendarDays"); icons.add("CalendarRange"); icons.add("Calendar"); }
  let preamble = "";
  const usesPalette = component.slug === "color-palette";
  if (usesPalette) preamble += '  const [color, setColor] = useState("#ff47a8");\n';
  const usesAvatarPicker = component.slug === "avatar-picker";
  if (usesAvatarPicker) preamble += `  const [file, setFile] = useState<File | null>();
  const [error, setError] = useState("");
  const selectPhoto = (image: File) => {
    if (!image.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setError("");
    setFile(image);
  };
  const removePhoto = () => {
    setFile(null);
    setError("");
  };
`;
  if (component.slug === "file-trigger" && values.presentation === "icon") {
    imports.add("IconButton");
    icons.add("Paperclip");
  }
  const usesBudgetRange = component.slug === "number-range-field";
  if (usesBudgetRange) preamble += `  const [range, setRange] = useState<[number | null, number | null]>(${JSON.stringify(budgetRangeExample(values.example))});
  const updateBound = (index: 0 | 1, value: number | null) => {
    setRange(current => index === 0 ? [value, current[1]] : [current[0], value]);
  };
  const [minimum, maximum] = range;
  const rangeError = minimum !== null && maximum !== null && minimum > maximum
    ? "Maximum must be at least the minimum."
    : undefined;
`;
  if (component.slug === "tag-group") preamble += '  const [removedTagIds, setRemovedTagIds] = useState<string[]>([]);\n';
  if (component.slug === "message-composer") preamble += `  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; label: string }[]>([]);
  function addFiles(files: File[]) {
    const selected = files.map(file => ({ id: crypto.randomUUID(), label: file.name }));
    setAttachments(current => [...current, ...selected]);
  }
  const removeFile = (id: string) => setAttachments(current => current.filter(file => file.id !== id));
  function send() {
    setDraft("");
    setAttachments([]);
    setStreaming(true);
  }
`;
  const commentComposer = component.slug === "comment-composer";
  const errorState = component.slug === "error-state" || component.slug === "no-results";
  if (errorState) {
    imports.add("DataList");
    imports.add("DataListItem");
    preamble += '  const [recovered, setRecovered] = useState(false);\n';
  }
  const commentReply = component.slug === "comment" && Boolean(values.showActions);
  const threadComposer = component.slug === "comment-thread" && Boolean(values.showComposer);
  const reactionSelection = component.slug === "comment" || component.slug === "reaction-picker";
  if (reactionSelection) {
    imports.add("ReactionButton");
    preamble += `  const options = ${JSON.stringify(reactionOptions)};
  const [selected, setSelected] = useState<string[]>([]);
  function setReaction(id: string, pressed: boolean) {
    setSelected(current => pressed ? (current.includes(id) ? current : [...current, id]) : current.filter(reaction => reaction !== id));
  }
`;
  }
  if (commentComposer) preamble += `  const [replying, setReplying] = useState(${Boolean(values.replyContext)});
`;
  if (commentReply) {
    imports.add("CommentComposer");
    preamble += `  const [replying, setReplying] = useState(false);
  const replyTrigger = useRef<HTMLButtonElement | null>(null);
  const replyForm = useRef<HTMLFormElement | null>(null);
  const focusReplyEditor = useRef((form: HTMLFormElement | null) => {
    replyForm.current = form;
    form?.querySelector("textarea")?.focus({ preventScroll: true });
  }).current;
  function openReply(event: MouseEvent<HTMLButtonElement>) {
    replyTrigger.current = event.currentTarget;
    replyForm.current?.querySelector("textarea")?.focus({ preventScroll: true });
    setReplying(true);
  }
  function cancelReply() {
    setReplying(false);
    replyTrigger.current?.focus({ preventScroll: true });
  }
`;
  }
  if (threadComposer || commentComposer || commentReply) preamble += `  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState<Array<{id: string; body: string}>>([]);
  function submitReply() {
    const body = draft.trim();
    if (!body) return;
    const id = crypto.randomUUID();
    setReplies(current => [...current, {id, body}]);
    setDraft("");
  }
`;
  const navigationState=component.slug==="navigation-group"||component.slug==="navigation-item"&&(values.compareStates||!values.compact&&["branch","link-branch"].includes(String(values.mode)));
  if(component.slug==="navigation-item"){
    imports.add("NavigationItem");if(values.icon||values.compareStates)icons.add("Folder");if(values.badge||values.compareStates)imports.add("Badge");
    if(values.compareStates||values.showTrailingAction&&!values.compact&&values.mode!=="action"){imports.add("Popover");imports.add("IconButton");icons.add("Ellipsis");}
    if(navigationState)preamble+='  const [expanded, setExpanded] = useState(true);\n';
  }
  if(component.slug==="navigation-group"){
    imports.add("NavigationItem");icons.add("Folder");if(values.showHeadingAction){imports.add("IconButton");icons.add("Plus");}
    preamble+='  const [expanded, setExpanded] = useState(true);\n  const [projectCount, setProjectCount] = useState(2);\n';
  }
  if (component.slug === "sidebar") {for(const name of ["Inline","IconSlot","Text","Badge","NavigationTree"])imports.add(name);for(const name of ["House","Folder","Bell","ChartNoAxesColumn","Archive","Settings","CircleHelp"])icons.add(name);preamble += '  const [current, setCurrent] = useState("overview");\n  const [collapsed, setCollapsed] = useState(' + JSON.stringify(values.collapsed) + ');\n';}
  if (component.slug === "data-table") {
    for (const name of ["Sparkline", "Text", "Badge", "Menu", "Button", "IconSlot", "Editable"]) imports.add(name);
    icons.add("ChevronDown");
    printRecipe(projectMilestones, imports, icons);
    if (values.customEmpty) imports.add("EmptyState");
    if (values.customError) imports.add("ErrorState");
    preamble += '  const [tableState, setTableState] = useState<"ready"|"loading"|"error">(' + JSON.stringify(values.state) + ');\n' +
      '  const [emptyRows] = useState(' + JSON.stringify(values.emptyRows) + ');\n' +
      '  type Field = "budget" | "status" | "owner";\n' +
      '  const [projectEdits, setProjectEdits] = useState<Record<string, Partial<Record<Field, string>>>>({});\n' +
      '  const updateProject = (id: string, field: Field, value: string) => {\n' +
      '    const row = document.activeElement?.closest("tr");\n' +
      '    const table = row?.closest("table");\n' +
      '    setProjectEdits(current => ({ ...current, [id]: { ...current[id], [field]: value } }));\n' +
      '    if (row && table) requestAnimationFrame(() => {\n' +
      '      if (!row.isConnected && document.activeElement === document.body) {\n' +
      '        table.tHead?.querySelector<HTMLButtonElement>(`[data-data-table-column="${field}"] button`)?.focus();\n' +
      '      }\n' +
      '    });\n' +
      '  };\n' +
      '  const statusTones = ' + JSON.stringify(projectStatusTones) + ' as const;\n' +
      '  const budgetDomain = [0, Math.max(16000, ...Object.values(projectEdits).map(edit => Number(edit.budget ?? 0)))] as const;\n' +
      '  const parseBudget = (value: string) => /^(?:\\d+|\\d{1,3}(?:,\\d{3})+)(?:\\.\\d{1,2})?$/.test(value.trim())\n' +
      '    ? Number(value.replaceAll(",", "")) : NaN;\n';
  }
  if (component.slug === "collection-view-switcher") preamble += '  const [view, setView] = useState("all");\n  const [, setAction] = useState("");\n';
  if (component.slug === "collection-toolbar") { for(const name of ["Stack","Inline","FilterGroup","Button"])imports.add(name); preamble += "  const properties = " + JSON.stringify(collectionPreviewProperties) + ";\n"; preamble += '  const [search, setSearch] = useState("");\n  const [filterOpen, setFilterOpen] = useState(false);\n  const [filters, setFilters] = useState<{match:"all"|"any";conditions:{id:string;property:string;operator:"is"|"is-not";values:string[]}[]}>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});\n  const [draftFilters, setDraftFilters] = useState(filters);\n'; }
  if (component.slug === "filter-group") preamble += '  const [filters, setFilters] = useState<{match:"all"|"any";conditions:{id:string;property:string;operator:"is"|"is-not";values:string[]}[]}>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});\n';
  if (component.slug === "filter-condition") preamble += '  const [condition, setCondition] = useState<{property:string;operator:"is"|"is-not";values:string[]}>({property:"status",operator:"is",values:["active"]});\n';
  if (["file-item","file-list","upload-item","upload-list"].includes(component.slug)) preamble += '  const [fileStates, setFileStates] = useState<Record<string, "queued" | "uploading" | "paused" | "processing" | "success" | "error" | "cancelled" | "removed">>({});\n';
  const usesFileCardState = component.slug === "file-card" && (values.showRemove || values.showPreview);
  if (usesFileCardState) preamble += '  const [fileStates, setFileStates] = useState<Record<string, "preview" | "removed" | undefined>>({});\n';
  if (component.slug === "upload-queue") preamble += `  const [selected, setSelected] = useState<{id:string; name:string; size:number}[]>([]);
  const [states, setStates] = useState<Record<string,"cancelled"|"removed">>({});
  const samples: {id:string; name:string; size:number; state:"uploading"|"processing"|"success"; progress?:number}[] = ${JSON.stringify(values.showExamples ? uploadQueueExamples : [])};
  function addFiles(files: File[]) {
    const picked = files.map(file => ({id:crypto.randomUUID(), name:file.name, size:file.size}));
    setSelected(current => [...current, ...picked]);
  }
  const entries = [
    ...samples.filter(file => states[file.id] !== "removed").map(file => ({
      ...file, state: states[file.id] === "cancelled" ? "cancelled" as const : file.state,
      onCancel: () => setStates(current => ({...current,[file.id]:"cancelled"})),
      onRemove: () => setStates(current => ({...current,[file.id]:"removed"})),
    })),
    ...selected.map(file => ({...file, state:"queued" as const,
      onCancel: () => setSelected(current => current.filter(item => item.id !== file.id))})),
  ];
`;
  if (component.slug === "toast-region") {
    preamble += '  const [notifications, setNotifications] = useState<import("react").ComponentProps<typeof ToastRegion>["items"]>([{id:"welcome",title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]);\n';
    if (values.showAction) preamble += '  const retryToast = (id: string) => setNotifications(current => current.map(item => item.id === id ? {id,title:"Preferences saved",status:"success",duration:5000} : item));\n';
  }
  const usesPresence = component.slug === "tag";
  if (usesPresence) { preamble += `  const [visible, setVisible] = useState(${JSON.stringify(Boolean(values.visible))});\n`; if (values.icon) icons.add("Plus"); }
  if (["data-list", "data-list-item"].includes(component.slug)) { imports.add("Link"); if(values.showMedia)imports.add("Avatar"); if(values.showActions)imports.add("Button"); if(values.showDetails)imports.add("MetadataList"); }
  if (component.slug === "metadata-list" && values.showIcons) { icons.add("Layers3"); icons.add("CalendarDays"); }
  const timelineFeed = component.slug === "activity-timeline" && !values.empty || component.slug === "timeline" && values.mode === "activity" && values.layout === "feed";
  const usesChecked = ["checkbox", "radio", "switch", "reaction-button", "notification-item", "notification-list"].includes(component.slug) ||
    (timelineFeed && Boolean(values.descriptions));
  if (["section","page-header","app-top-bar"].includes(component.slug) && values.showActions) imports.add("Button");
  if (component.slug === "app-top-bar") imports.add("Breadcrumb");
  if (component.slug === "app-shell") {
    imports.add("StatusIndicator");
    if (values.navigationMode === "docked" || values.navigationMode === "auto") {
      for (const name of ["Sidebar", "Inline", "IconSlot", "Text", "Avatar"]) imports.add(name);
      for (const icon of ["House", "Folder", "Layers3", "Archive"]) icons.add(icon);
    }
    if (values.showTopBar) { imports.add("AppTopBar"); imports.add("Text"); }
    if (values.showFooter) { imports.add("Surface"); imports.add("Text"); }
    if (values.navigationMode === "drawer") {
      for (const name of ["AppTopBar","Drawer","Button","NavigationList"]) imports.add(name);
      preamble += '  const [drawerOpen, setDrawerOpen] = useState(false);\n';
    }
    if (values.navigationMode === "auto") imports.add("NavigationList");
    if (values.navigationMode !== "none") preamble += `  const destinations = ${studioNavigationCode};\n`;
  }
  if (component.slug === "split") { imports.add("Surface"); imports.add("Text"); }
  if (component.slug === "resizable-panels") { imports.add("Surface"); imports.add("Text"); }
  if (component.slug === "comparison-table") imports.add("Surface");
  if (component.slug === "card") {
    if (values.showActions) imports.add(values.longHeader ? "Link" : "Badge");
    if (values.showFooter) imports.add("Button");
  }
  if (values.showMedia && (component.slug === "card" || component.slug === "card-skeleton" && values.loaded)) imports.add("FileThumbnail");
  if (component.slug === "empty-state") { if (values.showIcon) icons.add("Plus"); if (values.showActions) imports.add("Button"); }
  if (component.slug === "metric-card" && values.showChart) imports.add("Sparkline");
  if (component.slug === "status-indicator" && values.presentation === "icon") icons.add(statusExamples[values.tone as keyof typeof statusExamples][1]);
  if (component.slug === "value-change" && values.scenario === "status") imports.add("StatusIndicator");
  if (["comment", "comment-thread"].includes(component.slug) && values.showActions) imports.add("CopyButton");
  if (component.slug === "description-list" && values.showActions) imports.add("CopyButton");
  if (component.slug === "command-palette") imports.add("SearchTrigger");
  if (component.slug === "command-list" && values.showDetails) icons.add("Plus");
  if (component.slug === "comment" && values.showAttachment) for(const name of ["FileList","FileItem"]) imports.add(name);
  if (component.slug === "comment") imports.add("ReactionPicker");
  if (["notification-item","notification-list","notification-inbox"].includes(component.slug) && values.showMedia && !values.empty) imports.add("Avatar");
  if (component.slug === "notification-inbox") preamble +=
    `  const [inboxState, setInboxState] = useState<"ready" | "loading" | "error">(${JSON.stringify(values.state)});\n` +
    '  const [inboxUnread, setInboxUnread] = useState<Record<string, boolean>>({});\n';
  if (component.slug === "notification-trigger") {
    imports.add("NotificationTrigger");
    preamble += '  const [inboxUnread, setInboxUnread] = useState<Record<string, boolean>>({});\n' +
      `  const items = ${JSON.stringify(notificationTriggerItems)}.map((item, index) => ({ ...item, unread: inboxUnread[item.id] ?? (index < ${Number(values.demoUnread)}) }));\n`;
  }
  if (component.slug === "activity-timeline" && values.empty) imports.add("EmptyState");
  if (timelineFeed || component.slug === "timeline" && values.mode === "activity" && values.layout === "schedule") {
    if(timelineFeed) for(const icon of ["Paperclip","MessageCircle"]) icons.add(icon);
    if(values.descriptions) {
      for(const name of ["FileList","FileItem"]) imports.add(name);
      for(const name of timelineFeed ? ["Collapsible","CommentThread","ReactionButton","StatusIndicator","ValueChange"] : ["Alert"]) imports.add(name);
      if(timelineFeed) icons.add("ThumbsUp");
    }
  }
  if (component.slug === "setting-row" && values.showAction) imports.add("Link");
  if (component.slug === "setting-row" && values.showValue) imports.add("Badge");
  if (component.slug === "setting-group") imports.add("Link");
  if (component.slug === "form-actions") {
    imports.add("Button");
    if (values.showStatus) imports.add("SaveStatus");
  }
  const usesStatus = hasFeedback || ["file-trigger","form-actions","filter-condition","file-item", "file-list", "upload-item", "upload-list","data-table","data-list", "data-list-item","context-menu", "command-list", "command-palette", "steps", "section", "drawer", "alert-dialog", "empty-state", "card", "toolbar", "menu", "breadcrumb", "segmented-control", "toggle", "toggle-group", "button", "button-group", "split-button", "input-group", "icon-button", "stack", "inline", "radio-group", "checkbox-group"].includes(component.slug) || (component.slug === "code-snippet" && Boolean(values.copyAction));
  if (usesChecked) preamble += `  const [checked, setChecked] = useState(${JSON.stringify(Boolean(values.checked))});\n`;
  const usesRecordSelection = ["data-list", "data-list-item", "card", "file-card"].includes(component.slug) && values.selectable;
  if (usesRecordSelection) preamble +=
    '  const [listSelection, setListSelection] = useState<Record<string, boolean>>({});\n';
  if (component.slug === "menu" && ["preferences", "mixed"].includes(String(values.scenario))) preamble += '  const [notificationsEnabled, setNotificationsEnabled] = useState(true);\n  const [density, setDensity] = useState("Compact");\n';
  if (usesStatus) preamble += '  const [status, setStatus] = useState("");\n';
  if (usesPagination) preamble += `  const [page, setPage] = useState(${currentPage});\n`;
  if (component.slug === "code-snippet" && values.copyAction) preamble += `  async function copy() {\n    try {\n      await navigator.clipboard.writeText(${JSON.stringify(String(values.code))});\n      setStatus("Copied command.");\n    } catch {\n      setStatus("Select the code and copy it manually.");\n    }\n  }\n`;
  const stylesheet = importMode === "project" ? "@/ui/styles.css" : "@flood-md/react/styles.css";
  const code = '"use client";\n\n' + (component.slug === "data-table" ? 'import { useState, type ReactNode } from "react";\n' : commentReply ? 'import { useRef, useState, type MouseEvent } from "react";\n' : usesFileCardState || usesPalette || usesAvatarPicker || usesBudgetRange || reactionSelection || commentComposer || errorState || threadComposer || navigationState || usesPresence || usesChecked || usesStatus || usesRecordSelection || (component.slug === "app-shell" && values.navigationMode === "drawer") || component.slug === "toast-region" || component.slug === "filter-group" || component.slug === "collection-toolbar" || component.slug === "collection-view-switcher" || component.slug === "sidebar" || usesPagination || ["notification-inbox", "notification-trigger"].includes(component.slug) || component.slug === "message-composer" || ["tag-group","upload-queue"].includes(component.slug) ? 'import { useState } from "react";\n' : "") + importStatements([...imports].sort(), importMode) + "\n" + (icons.size ? `import { ${[...icons].sort().join(", ")} } from "lucide-react";\n` : "") + `import "${stylesheet}";\n\nexport function Example() {\n` + preamble + `  return (\n${jsx}\n  );\n}\n`;
  useEffect(() => { callback.current(code); importsCallback.current?.([...imports].sort()); }, [code]);

  const controls = componentKnobs(component).filter(knob => {
    if(component.slug==="breadcrumb"&&knob.name==="maxVisibleItems")return values.layout==="compact";
    if(component.slug==="card" && knob.name==="selectionDisabled") return Boolean(values.selectable);
    if(component.slug==="timeline" && values.mode==="progress" && knob.name==="layout")return false;
    if(component.slug==="navigation-item"&&values.compareStates)return ["compareStates","size","variant"].includes(knob.name);
    if (component.slug === "fieldset" && knob.name === "showHelp" && values.layout !== "aligned") return false;
    if (component.slug === "toast-region" && (
      (values.inline && knob.name === "placement") ||
      (values.showAction && ["status", "autoDismiss", "longText"].includes(knob.name))
    )) return false;
    return !(component.slug === "menu" && values.scenario === "preferences" && ["icons", "shortcuts", "disableArchive"].includes(knob.name));
  });
  const hasFocusAction = ["input", "input-group", "textarea", "select"].includes(component.slug);
  const spacious = ["navigation-item","navigation-group","sidebar","collection-view-switcher","collection-toolbar","filter-group","calendar","time-picker","file-item", "upload-item","data-list", "data-list-item", "check-card", "radio-card","color-picker", "date-time-picker", "tree-select", "tree", "navigation-tree", "list-box", "navigation-list", "steps", "section", "center", "container", "grid", "aspect-ratio", "empty-state", "card", "table", "description-list", "accordion", "input", "input-group", "textarea", "select", "field", "label", "fieldset", "radio-group", "checkbox-group", "scroll-area", "surface", "flood-root", "stack", "code-snippet"].includes(component.slug);
  const labelFor = (knob: Knob) => knob.label
    ?? ({ controlSize: "Size", contentInset: "Content clearance", copyAction: "Copy button", label: "Accessible name" } as Record<string, string>)[knob.name]
    ?? (knob.name[0].toUpperCase() + knob.name.slice(1).replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`));
  const resetPreview = () => {
      setDraft(""); setAttachments([]); setSelectedUploads([]); setStreaming(false); setReplies([]); setSelectedReactions([]); setInboxUnread({}); setListSelection({});
      setState({ slug: component.slug, values: initialValues(component) });
      setStatus(""); setPagination({slug:component.slug,page:1}); setResetKey(key => key + 1);
      resetViewPosition();
      setFilterValue({property:"status",operator:"is",values:["active"]});
      setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});
      setFileStates({}); setRemovedTagIds([]); setNavValue("overview"); setViewValue("all"); setToolbarSearch(""); setToolbarOpen(false);
      setProjectEdits({});
      setBudgetRange(budgetRangeExample(initialValues(component).example));
      resetPhoto();
      setPaletteColor("#ff47a8");
      setShellDrawerOpen(false); setDraftFilters({match:"all",conditions:[]}); setMenuChecked(true); setMenuDensity("Compact");
      setNotifications([{id:"welcome",title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]);
  };
  const previewActions = <Flood.Inline gap="2" className="workbench-actions">
    <Flood.Button ref={resetAction} className="workbench-reset" variant="subtle" size="sm" aria-label="Reset" title="Reset preview" onClick={resetPreview}>
      <Flood.IconSlot className="workbench-reset-icon" size="sm"><Undo2 /></Flood.IconSlot>
      <span>Reset</span>
    </Flood.Button>
  </Flood.Inline>;
  const frameWidths = [{ value: "auto", label: "Auto width" }, ...["1200", "768", "390"].map(value => ({ value, label: `${value} px` }))];
  const widthControl = <Flood.Select aria-label="Frame width" className="studio-width-control" controlSize="sm" value={frameWidth} onChange={event => setFrameWidth(event.currentTarget.value)}>
    {frameWidths.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </Flood.Select>;
  const changeZoom = (value: string) => {
    if (value === "fit") resetViewPosition();
    setZoom(value);
  };
  const zoomLevels = [...["50", "75", "100", "125", "150", "200"].map(value => ({ value, label: `${value}%` })),
    { value: "fit", label: zoom === "fit" ? `Fit · ${Math.round(fitScale * 100)}%` : "Fit" }];
  const zoomControl = <Flood.Select aria-label="Canvas zoom" className="studio-zoom-control" controlSize="sm" value={zoom} onChange={event => changeZoom(event.currentTarget.value)}>
    {zoomLevels.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </Flood.Select>;
  const fitAction = <Flood.Button variant={zoom === "fit" ? "solid" : "subtle"} size="sm" aria-pressed={zoom === "fit"} onClick={() => changeZoom("fit")}>Fit</Flood.Button>;
  const resetViewAction = <Flood.Button variant="subtle" size="sm" onClick={() => {
    setFrameWidth("auto");
    setZoom("100");
    resetViewPosition();
  }}>Reset view</Flood.Button>;
  const viewTrigger = (props: Flood.OverlayTriggerProps) =>
    <Flood.Button {...props} size="sm" variant="subtle" aria-label="View options">View</Flood.Button>;
  const viewControls = <Flood.Stack gap="2">
    {useChoiceSheets ? <>
      <StudioChoice label="Frame width" value={frameWidth} options={frameWidths} onChange={setFrameWidth} />
      <StudioChoice label="Canvas zoom" value={zoom} options={zoomLevels} onChange={changeZoom} />
    </> : <Flood.Inline gap="2">{widthControl}{zoomControl}</Flood.Inline>}
    <Flood.Inline gap="2">{fitAction}{resetViewAction}</Flood.Inline>
  </Flood.Stack>;
  const propertyControls = (controls.length > 0 || hasFocusAction) && (
    <div className="workbench-controls" data-flood-surface="filled" role="group" aria-label={`${component.name} API controls`}>
      {controls.map((knob) => typeof knob.initial === "boolean" ?
        <div className="workbench-control workbench-control--toggle" key={knob.name}>
          <Flood.Checkbox id={`${id}-${knob.name}`} label={labelFor(knob)} aria-label={`${component.name} ${knob.name === "hideLabel" && ["input", "input-group", "textarea", "select"].includes(component.slug) ? "Field wrapper" : "prop"} ${knob.name}`} checked={Boolean(values[knob.name])} onChange={(event) => change(knob.name, event.currentTarget.checked)} />
        </div> : studio && useChoiceSheets && knob.options ?
        <div className="workbench-control workbench-control--select" key={knob.name}>
          <StudioChoice label={labelFor(knob)} value={String(values[knob.name])}
            options={knob.options.map(value => ({ value, label: value }))} onChange={value => change(knob.name, value)} />
        </div> :
        <Flood.Label className={studio && knob.options ? "workbench-control workbench-control--select" : "workbench-control"} htmlFor={`${id}-${knob.name}`} key={knob.name}>
          {(!studio || !knob.options) && <span>{labelFor(knob)}</span>}
          {knob.options ? <Flood.Select controlSize="sm" id={`${id}-${knob.name}`}
            aria-label={knob.name === "scenario" ? labelFor(knob) : `${component.name} prop ${knob.name}`}
            title={studio ? `${labelFor(knob)}: ${values[knob.name]}` : undefined}
            style={studio ? { "--studio-select-prefix": JSON.stringify(`${labelFor(knob)}: `) } as CSSProperties : undefined}
            value={String(values[knob.name])} onChange={event => change(knob.name, event.currentTarget.value)}>
            {knob.options.map(option => <option value={option} key={option}>{option}</option>)}
          </Flood.Select> : <Flood.Input controlSize="sm" id={`${id}-${knob.name}`} aria-label={`${component.name} prop ${knob.name}`} type="text" value={String(values[knob.name])} placeholder={knob.name === "label" ? "Decorative without a label" : undefined} onChange={(event) => change(knob.name, event.currentTarget.value)} />}
        </Flood.Label>)}
      {hasFocusAction && <Flood.Button className="workbench-focus" variant="subtle" size="md" aria-label="Focus control" disabled={Boolean(values.disabled)} onClick={() => stage.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")?.focus()}>Focus</Flood.Button>}
    </div>
  );
  return <section className="component-workbench" data-studio={studio || undefined} aria-label={`${component.name} live playground`}>
    {!studio && <div className="workbench-title" data-flood-surface="filled"><Flood.Text size="compact" tone="subtle">Preview</Flood.Text>{previewActions}</div>}
    {studio && <header className="studio-header">{studioHeading}</header>}
    <div className="workbench-canvas" data-feedback={showFeedbackSlot || undefined}>
      <Flood.ScrollArea orientation="both" contentInset="none" className="workbench-stage preview-stage" data-component={component.slug} data-size={["heading", "timeline", "activity-timeline", "comment-thread", "toast-region", "dropzone", "color-picker", "data-table", "file-list", "upload-list", "upload-queue", "date-time-range-picker", "line-chart", "bar-chart", "donut-chart", "heatmap", "scatter-chart", "range-chart", "bullet-chart", "waterfall-chart", "histogram", "box-plot", "dumbbell-chart", "bar-list"].includes(component.slug) ? "display" : spacious ? "regular" : "compact"}
        data-wide-frame={studio && (frameWidth !== "auto" || component.previewLayout === "workspace") || undefined} ref={stage} key={component.slug + resetKey}
        role={studio ? "region" : undefined} aria-label={studio ? "Preview canvas" : undefined} tabIndex={studio ? 0 : undefined}
        onPointerDown={event=>{
          const canvas = event.currentTarget;
          if (!studio || event.pointerType === "touch" || event.button !== 0 || drag.current) return;
          if (event.target !== canvas && event.target !== canvas.firstElementChild && event.target !== previewFrame.current) return;
          drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, origin: pan };
          canvas.setPointerCapture(event.pointerId);
          canvas.dataset.dragging = "";
          event.preventDefault();
        }}
        onPointerMove={event=>{
          const start=drag.current;
          if(start?.pointer!==event.pointerId) return;
          setPan({ x: start.origin.x + event.clientX - start.x, y: start.origin.y + event.clientY - start.y });
        }}
        onLostPointerCapture={event => {
          if (drag.current?.pointer !== event.pointerId) return;
          drag.current = null;
          delete event.currentTarget.dataset.dragging;
        }}
        style={studio ? {
          "--studio-frame-width": frameWidth === "auto" ? "100cqw" : `${frameWidth}px`,
          "--studio-zoom": zoom === "fit" ? fitScale : Number(zoom) / 100,
          "--studio-pan-x": `${pan.x}px`,
          "--studio-pan-y": `${pan.y}px`,
        } as CSSProperties : undefined}
      ><Flood.FloodRoot ref={previewFrame}>{renderRecipe(previewRecipe)}</Flood.FloodRoot></Flood.ScrollArea>
      {showFeedbackSlot && <Flood.Text as="p" size="compact" tone="subtle" role="status" className="workbench-feedback">{status}</Flood.Text>}
    </div>
    {studio && <div ref={studioToolbar} className="studio-action-row">
      <Flood.Inline gap="2" className="studio-tools" data-flood-surface="filled">
        <Flood.Inline gap="2" className="studio-view-controls">
          {widthControl}{zoomControl}{fitAction}{resetViewAction}
        </Flood.Inline>
        <div className="studio-compact-tools">
          {phone ? <Flood.Sheet title="Preview options" size="sm" trigger={viewTrigger}>{viewControls}</Flood.Sheet>
            : <Flood.Popover title="Preview options" chrome="minimal" side="top" trigger={viewTrigger}>{viewControls}</Flood.Popover>}
        </div>
        {previewActions}
      </Flood.Inline>
      {studioReference}
    </div>}
    {studio && propertyControls && <div className="studio-properties">
      <Flood.Text as="p" size="label" className="studio-properties-title">Properties</Flood.Text>
      <Flood.ScrollArea orientation="horizontal" contentInset="none" aria-label="Preview properties">{propertyControls}</Flood.ScrollArea>
    </div>}
    {!studio && propertyControls}
  </section>;
}
