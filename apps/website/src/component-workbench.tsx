import { Fragment, createElement, useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent, type KeyboardEvent, type FormEvent } from "react";
import { House, Folder, Layers3, Bell, ChartNoAxesColumn, Settings, CircleHelp, ArrowRight, Copy, Plus, Undo2, Redo2, History, Bold, Italic, Underline, Share2, CalendarDays, CalendarRange, Calendar, Pencil, Archive, Trash2, Ellipsis, ChevronDown, CircleCheck, CircleAlert, CircleX, Paperclip, MessageCircle, ThumbsUp, Eye, EyeOff, Lock, LockOpen, BookOpen, CreditCard, Globe, Package, ShieldCheck } from "lucide-react";
import * as Flood from "@flood-md/react";
import { Laptop, Smartphone, Monitor, Repeat2, BellOff } from "lucide-react";
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
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
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
const notificationHistory = [
  {id:"comment",title:"Sam replied to your comment",href:"/components/comment-thread",timeLabel:"08:31"},
  {id:"access",title:"Workspace access updated",href:"/playground/settings",timeLabel:"08:15"},
  {id:"source",title:"Source file attached",href:"/components/file-item",timeLabel:"Yesterday"},
  {id:"plan",title:"Review moved to Friday",href:"/components/activity-timeline",timeLabel:"Yesterday"},
  {id:"approve",title:"Brand guide approved",href:"/components/document-preview",timeLabel:"Yesterday"},
  {id:"invite",title:"Maya joined the workspace",href:"/playground/settings",timeLabel:"Mon"},
  {id:"review",title:"Review requested",href:"/components/activity-timeline",timeLabel:"Mon"},
  {id:"project",title:"Project archived",href:"/playground/collections",timeLabel:"Mon"},
];
const statusExamples = {neutral:["Not started","CircleHelp"],accent:["In progress","History"],success:["All systems operational","CircleCheck"],warning:["Needs attention","CircleAlert"],error:["Service interrupted","CircleX"],info:["Update available","Bell"]} as const;
const cardDeckExamples = [
  {id:"line",label:"Compare trends",image:"/comparison-line.png",href:"/components/line-chart",action:"View line chart"},
  {id:"area",label:"Show volume over time",image:"/comparison-area.png",href:"/playground/charts",action:"Explore the chart playground"},
  {id:"library",label:"Explore chart patterns",image:"/charts-share.png",href:"/docs/charts",action:"Read chart guide"},
];
const reminderPresets = [
  {id:"later",label:"Later today",dateTime:"2026-11-17T16:00:00Z"},
  {id:"tomorrow",label:"Tomorrow morning",dateTime:"2026-11-18T09:00:00Z"},
];
const snoozePresets = [
  {id:"hour",label:"In an hour",until:"Today, 15:00"},
  {id:"tomorrow",label:"Tomorrow morning",until:"Tomorrow, 09:00"},
  {id:"monday",label:"Next Monday",until:"Monday, 09:00"},
];
const logPreviewEntries: readonly Flood.LogEntry[] = [
  {id:"1",dateTime:"2026-11-16T12:00:01Z",severity:"debug",source:"gateway",message:"Health check received"},
  {id:"2",dateTime:"2026-11-16T12:00:04Z",severity:"info",source:"identity",message:"Session created"},
  {id:"3",dateTime:"2026-11-16T12:00:06Z",severity:"warning",source:"cache",message:"Response exceeded latency budget"},
  {id:"4",dateTime:"2026-11-16T12:00:09Z",severity:"error",source:"storage",message:"Upload exceeded size limit",
    payload:'{\n  "status": 413,\n  "requestId": "req_95b",\n  "limitMb": 20\n}'},
  {id:"5",dateTime:"2026-11-16T12:00:11Z",severity:"info",source:"gateway",message:"Project loaded"},
  {id:"6",dateTime:"2026-11-16T12:00:16Z",severity:"info",source:"worker",message:"Index rebuilt"},
];
const precedingLogPreviewEntries: readonly Flood.LogEntry[] = [
  {id:"old-3",dateTime:"2026-11-16T11:59:24Z",severity:"info",source:"worker",message:"Jobs resumed"},
  {id:"old-2",dateTime:"2026-11-16T11:59:34Z",severity:"debug",source:"cache",message:"Cache key created"},
  {id:"old-1",dateTime:"2026-11-16T11:59:48Z",severity:"info",source:"gateway",message:"Connection accepted"},
];
const incomingLogPreviewEntry: Flood.LogEntry = {
  id:"7",dateTime:"2026-11-16T12:00:23Z",severity:"info",source:"storage",message:"Upload accepted",
};
const thumbnailPreviewItems = [
  {id:"overview",label:"Chart overview",src:"/charts-share.png"},
  {id:"line",label:"Weekly line chart",src:"/comparison-line.png"},
  {id:"area",label:"Weekly area chart",src:"/comparison-area.png"},
  {id:"mark",label:"Pink Flood mark",src:"/flood-mark.png"},
  {id:"avatar",label:"Sample profile artwork",src:"/avatar-demo.svg"},
] as const;
const tracePreviewSpans: readonly Flood.TraceSpan[] = [
  {id:"request",label:"GET /files",start:0,duration:640,children:[
    {id:"auth",label:"Verify session",start:12,duration:85},
    {id:"storage",label:"Read workspace files",start:101,duration:463,children:[
      {id:"cache",label:"Cache lookup",start:102,duration:93},
      {id:"db",label:"Read object metadata",start:201,duration:311,status:{label:"Retried",tone:"warning"}},
      {id:"access",label:"Record access",start:564,duration:146},
    ]},
    {id:"render",label:"Encode response",start:575,duration:57},
  ]},
  {id:"archive",label:"Send trace archive",start:672,duration:98},
];
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
const adjacentRecordExamples = [
  {title:"Review access logs",detail:"Confirm which members opened the original export."},
  {title:"Restore export permissions",detail:"Reopen access for the support team after review."},
  {title:"Audit export retention across workspaces",detail:"Verify the retention window for shared export links."},
];
const choiceCardIndicator = select("indicatorPlacement", ["start", "end"], "start");
const knobs: Record<string, Knob[]> = {
  "app-shell": [select("scroll", ["content", "page"], "content"), {...select("navigationSide", ["start", "end"], "start"), label:"Navigation side"}, {...select("navigationMode", ["auto", "docked", "drawer", "none"], "auto"), label:"Navigation mode"}, {...toggle("showTopBar", true), label:"Show top bar"}, {...toggle("showFooter"), label:"Show footer"}],
  "app-top-bar": [select("layout", ["wrap", "compact"], "wrap"), toggle("bordered"), toggle("showActions", true),
    {...toggle("deepPath"), label:"Deep path"}, {...toggle("narrow"), label:"Narrow width"}],
  "navigation-item": [{...toggle("compareStates"),label:"Compare states"},select("mode",["link","branch","link-branch","action"],"link-branch"),select("size",["sm","md","lg"],"sm"),select("variant",["quiet","standard"],"quiet"),select("labelOverflow",["wrap","truncate"],"wrap"),toggle("compact"),toggle("current",true),toggle("disabled"),toggle("icon",true),toggle("badge"),toggle("showTrailingAction"),toggle("longLabel")],
  "navigation-group": [select("size",["sm","md","lg"],"sm"),toggle("hideLabel"),toggle("separator"),toggle("collapsible"),toggle("compact"),toggle("showHeadingAction",true)],
  sidebar: [toggle("collapsed"),select("variant",["quiet","standard"],"quiet"),select("size",["sm","md","lg"],"sm"),select("side",["start","end"],"start"),select("width",["14rem","16rem","19rem"],"16rem"),toggle("longNavigation"),toggle("branchGuides",true),select("headerLayout",["inline","stacked"],"inline"),toggle("collapsible",true)],
  "collection-view-switcher": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["18rem","32rem","52rem"],"52rem"),toggle("editable",true),toggle("dirty"),toggle("disabled")],
  "environment-switcher": [select("size",["sm","md","lg"],"sm"),select("variant",["outline","ghost"],"outline"),{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "link-preview": [{...toggle("thumbnail",true),label:"Show thumbnail"},{...toggle("description",true),label:"Show description"}],
  "profile-links": [select("surface",["default","raised","overlay"],"raised"),{...toggle("featured",true),label:"Featured link"},{...toggle("narrow"),label:"Narrow width"},{...toggle("longLabel"),label:"Long label"}],
  "advisor-finding": [select("scenario",["Access policy","Missing index","Unused index"],"Missing index"),toggle("evidence",true),toggle("defaultEvidenceOpen"),toggle("remediation",true)],
  "policy-evaluation": [select("scenario",["finance route","default route","missing data"],"finance route"),{...toggle("narrow"),label:"Narrow width"}],
  "record-merge-review": [select("scenario",["Review","Pending","Failed"],"Review"),toggle("longTitles")],
  "receipt-match-review": [select("scenario",["Amount differs","Verified","Missing evidence"],"Amount differs"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "restriction-summary": [select("scenario",["layered policy","category allowlist","unrestricted"],"layered policy"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "network-allowlist": [select("scenario",["Allowlist","All networks","No networks","Empty allowlist"],"Allowlist"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("rtl")],
  "cidr-field": [{...select("familyMode",["Any","IPv4","IPv6"],"Any"),label:"Address family"},toggle("disabled"),toggle("rtl")],
  "approval-chain": [select("scenario",["pending","changes requested","approved"],"pending"),select("density",["compact","comfortable"],"comfortable"),{...toggle("requirement",true),label:"Show approval count"},toggle("inDrawer")],
  "evidence-checklist": [select("scenario",["Missing receipt","Under review","Complete","No requirements"],"Missing receipt"),select("elevation",["default","raised","overlay"],"raised"),toggle("showAction",true)],
  "scheduled-task-list": [select("scenario",["Mixed","No tasks"],"Mixed"),toggle("showAction",true)],
  "scheduled-run-history": [select("scenario",["Recent runs","Empty"],"Recent runs"),select("timeZone",["UTC","America/New_York"],"UTC"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "approval-request": [select("scenario",["ready","submitting","error"],"ready"),{...toggle("narrow"),label:"Narrow width"},toggle("showRoute")],
  "collection-toolbar": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["24rem","40rem","52rem"],"52rem"),select("align",["stretch","split","end"],"stretch"),{...select("visibleFilters",["all","1"],"all"),label:"Visible filters"},toggle("showFilters",true),toggle("showClear",true),toggle("disabled")],
  "filter-group": [select("mode",["choice","typed"],"choice"),select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),select("maxConditions",["none","1","2","3","5"],"none"),toggle("allowDuplicateProperties"),toggle("hideLabel",true),toggle("disabled")],
  "filter-condition": [select("mode",["choice","typed"],"choice"),select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),toggle("removable",true),toggle("hideLabel",true),toggle("disabled")],
  "money-field": [select("currency",["USD","EUR","JPY","KWD"],"USD"),select("locale",["en-US","de-DE","ja-JP","ar-KW"],"en-US"),select("controlSize",["sm","md","lg","xl"],"md"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "spend-limit-form": [select("scenario",["Ready","Saving","Failed"],"Ready"),select("surface",["canvas","raised","inset"],"raised")],
  "key-value-row": [select("controlSize",["sm","md","lg","xl"],"sm"),select("valueMode",["single-line","multiline"],"single-line"),toggle("showEnabled",true),toggle("readOnly"),toggle("disabled")],
  "key-value-editor": [select("controlSize",["sm","md","lg","xl"],"sm"),select("valueMode",["single-line","multiline"],"single-line"),toggle("showEnabled",true),toggle("showError"),toggle("readOnly"),toggle("disabled")],
  "deadline-status": [select("state",["due soon","remaining","due now","overdue","paused"],"due soon"),select("presentation",["label","chip"],"label"),select("size",["sm","md","lg"],"md"),toggle("showDeadline",true)],
  "service-level-targets": [select("scenario",["Due soon","Paused","Overdue","Completed late"],"Due soon"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "deprecation-notice": [select("state",["deprecated","retired"],"deprecated"),select("appearance",["banner","inline"],"banner"),{...toggle("showCutoff",true),label:"Show cutoff"},{...toggle("showReplacement",true),label:"Show replacement"},{...toggle("narrow"),label:"Narrow width"}],
  "incomplete-response-notice": [select("scenario",["Partial answer","No output","Filtered","Unknown"],"Partial answer"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "log-row": [select("severity",["debug","info","warning","error"],"error"),toggle("showPayload",true)],
  "live-follow-control": [toggle("defaultFollowing",true),select("queued",["0","1","12","1000"],"12"),select("surface",["canvas","raised","inset"],"raised"),toggle("disabled")],
  "log-context": [select("scenario",["Ready","Loading earlier","Failed earlier"],"Ready"),{...toggle("narrow"),label:"Narrow width"}],
  "log-viewer": [toggle("defaultFollowing",true),{...toggle("searchable"),label:"Search messages"},
    {...toggle("incomingEntry"),label:"Simulate an entry"},toggle("empty")],
  "span-row": [toggle("showStatus"),toggle("instant"),toggle("clipStart")],
  "trace-waterfall": [{...toggle("storageWindow"),label:"Storage window"},toggle("empty")],
  "query-plan": [{...toggle("estimateOnly"),label:"Estimate only"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "database-session-list": [select("scenario",["Lock wait","Blocker hidden","No waits","Empty"],"Lock wait"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "index-recommendation": [select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("showStartup",true),label:"Show startup cost"}],
  "relative-time-range-picker": [select("controlSize",["sm","md","lg","xl"],"md"),toggle("hideLabel"),toggle("disabled")],
  "recovery-window": [select("scenario",["within window","outside window","latest point","single point","no selection"],"within window"),
    select("timeZone",["UTC","America/New_York"],"UTC"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "backup-picker": [select("surface",["raised","overlay"],"raised"),{...toggle("expireLatest"),label:"Latest unavailable"},toggle("empty"),{...toggle("narrow"),label:"Narrow width"}],
  "payment-method-picker": [select("scenario",["Quoted","Missing quote","Method unavailable","Empty"],"Quoted"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "backup-restore-dialog": [select("scenario",["Replace production","New project","Expired"],"Replace production"),select("timeZone",["UTC","America/New_York"],"UTC")],
  "deployment-region-picker": [select("surface",["raised","overlay"],"raised"),{...toggle("exact"),label:"Specific region required"},toggle("empty"),{...toggle("narrow"),label:"Narrow width"}],
  "time-zone-select": [{...toggle("summerReference"),label:"Summer reference"},select("controlSize",["sm","md","lg","xl"],"md"),toggle("readOnly"),toggle("disabled")],
  "content-language-picker": [select("locale",["en","fr","ja"],"en"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("readOnly"),toggle("disabled")],
  "model-picker": [select("catalog",["ready","loading","error"],"ready"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("readOnly")],
  "template-picker": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("existing"),label:"Existing priority"},{...toggle("fail"),label:"Reject apply"},toggle("pending")],
  "meeting-availability": [select("scenario",["Afternoon","Across midnight","No attendees"],"Afternoon"),select("surface",["canvas","raised","inset"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "recurrence-editor": [select("controlSize",["sm","md","lg","xl"],"md"),{...toggle("sundayStart"),label:"Week starts Sunday"},toggle("disabled")],
  "handle-field": [select("mode",["Hosted","Own domain"],"Hosted"),select("scenario",["Available","Checking","Unavailable","Long domain"],"Available"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "cron-schedule-field": [select("scenario",["Preview","Checking","Stale","No upcoming runs"],"Preview"),select("timeZone",["UTC","America/New_York"],"UTC"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("readOnly")],
  "quiet-hours-editor": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "unit-number-field": [select("controlSize",["sm","md","lg","xl"],"md"),toggle("readOnly"),toggle("disabled")],
  "suggestion-textarea": [select("controlSize",["sm","md","lg","xl"],"md"),toggle("readOnly"),toggle("disabled")],
  "query-input": [select("controlSize",["sm","md","lg","xl"],"sm"),toggle("showTokenError"),toggle("readOnly"),toggle("disabled")],
  "json-inspector": [select("defaultExpandedDepth",["0","1","2"],"1"),toggle("searchable",true)],
  "tool-call": [select("state",["queued","running","succeeded","failed","cancelled"],"succeeded"),select("variant",["flush","framed"],"flush"),
    {...toggle("showDetails",true),label:"Show details"},{...toggle("narrow"),label:"Narrow width"}],
  "tool-call-group": [select("scenario",["In progress","Partial failure","Completed","Empty"],"Partial failure"),
    {...toggle("narrow"),label:"Narrow width"}],
  "diff-stat": [select("example",["mixed","added","removed","unchanged","large"],"mixed"),toggle("showDistribution")],
  "code-diff": [select("layout",["unified","split"],"unified"),select("contextLines",["0","1","3"],"1"),toggle("wrap")],
  "changed-file-list": [{...toggle("reviewable",true),label:"Review controls"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "stack-frame": [toggle("showSource",true),toggle("defaultOpen")],
  "stack-trace": [select("density",["compact","comfortable"],"compact"),toggle("empty")],
  "dependency-graph": [select("example",["CI jobs","Tables"],"CI jobs"),select("presentation",["graph","list"],"graph"),toggle("empty")],
  "find-bar": [select("controlSize",["sm","md","lg","xl"],"sm"),toggle("showOptions",true),toggle("showReplace")],
  "bulk-action-bar": [select("counter",["label","number","none"],"label"),select("selectionCount",["1","2","9","10","99","100","999"],"2"),select("width",["16rem","24rem","32rem"],"32rem"),select("size",["sm","md","lg","xl"],"sm"),select("maxVisibleActions",["1","2","3"],"2"),select("morePresentation",["label","icon","auto"],"label"),toggle("pending"),toggle("disabled")],
  "autocomplete": [select("controlSize", ["sm","md","lg","xl"], "md"),select("loadState",["ready","loading","error"],"ready"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "swipe-actions": [select("size",["sm","md","lg"],"sm"),toggle("swipe",true),toggle("defaultOpen")],
  "hold-to-confirm": [select("holdMs",["600","900","1600"],"900"),select("size",["sm","md","lg"],"md"),select("tone",["default","danger"],"default"),toggle("disabled")],
  "overflow-actions": [select("containerVariant",["contained","plain"],"contained"),select("shape",["pill","rounded"],"pill"),select("width",["14rem","24rem","40rem"],"24rem"),select("size",["sm","md","lg","xl"],"md"),select("variant",variants,"subtle"),select("morePresentation",["label","icon","auto"],"label"),select("maxVisibleActions",["auto","1","2","3"],"auto"),toggle("disabled")],
  "menubar": [select("controlSize",["sm","md","lg","xl"],"sm"),toggle("disabled")],
  "time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("interval", ["900", "1800", "3600"], "1800"),toggle("hideLabel"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "date-time-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("precision", ["minute", "second"], "minute"),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"),toggle("required",true),toggle("hideLabel"),toggle("readOnly"),toggle("disabled")],
  "file-meta": [select("variant", ["chip", "plain"], "chip"),select("format", ["PDF", "PNG", "SVG", "ZIP", "none"], "PDF"),select("size", ["0", "18400", "850000", "2400000"], "2400000"),toggle("showSize",true)],
  "image-meta": [select("asset",["wide","square"],"wide"),select("variant",["plain","chip"],"plain"),select("locale",["en-US","de-DE"],"en-US"),
    {...toggle("showFileDetails",true),label:"Show file details"},{...toggle("narrow"),label:"Narrow width"}],
  "file-name": [select("overflow", ["wrap", "truncate"], "wrap"),toggle("longName",true),toggle("linked"),{...toggle("narrow",true),label:"Narrow width"}],
  "file-path": [select("platform",["POSIX","Windows"],"POSIX"),{...toggle("narrow",true),label:"Narrow width"},toggle("linked")],
  "file-item": [select("density", ["compact", "comfortable"], "comfortable"),select("nameOverflow", ["wrap", "truncate"], "wrap"),select("thumbnail",filePreviewImages,"none"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("showDownload"),toggle("longName"),toggle("disabled")],
  "file-thumbnail": [select("presentation",["inline","tile"],"inline"),select("image",filePreviewImages,"image"),select("fit",["cover","contain"],"contain")],
  "file-card": [select("thumbnail",["image","none","unavailable"],"image"),select("thumbnailPlacement",["top","body"],"top"),select("previewPlacement",["footer","thumbnail"],"footer"),{...select("fit",["cover","contain"],"contain"),label:"Thumbnail fit"},{...select("ratio",["4:3","16:9","1:1"],"4:3"),label:"Thumbnail ratio"},select("nameOverflow",["wrap","truncate"],"truncate"),select("density",["compact","comfortable"],"compact"),toggle("showSize",true),toggle("showType",true),toggle("showDownload",true),toggle("showPreview",true),toggle("showRemove"),toggle("selectable"),toggle("longName"),toggle("description"),toggle("disabled"),toggle("gallery"),{...toggle("narrow"),label:"Narrow card"}],
  "file-card-skeleton": [select("thumbnailPlacement",["top","body"],"top"),select("previewPlacement",["footer","thumbnail"],"footer"),
    {...select("ratio",["4:3","16:9","1:1"],"4:3"),label:"Thumbnail ratio"},select("density",["compact","comfortable"],"compact"),
    toggle("metadata",true),toggle("showDownload",true),toggle("showPreview",true),toggle("selectable",true),
    toggle("description"),{...toggle("narrow"),label:"Narrow card"},toggle("loaded"),toggle("animate",true)],
  "file-card-grid": [select("thumbnailPlacement",["top","body"],"body"),select("previewPlacement",["footer","thumbnail"],"footer"),
    toggle("description",true),toggle("loaded",true),{...toggle("narrow"),label:"Narrow grid"}],
  "file-list": [select("appearance", ["panel", "plain", "embedded"], "panel"),select("density", ["compact", "comfortable"], "comfortable"),select("nameOverflow", ["wrap", "truncate"], "wrap"),select("metadataVariant", ["chip","plain"], "chip"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("longName"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "file-list-skeleton": [select("appearance",["panel","plain"],"panel"),select("density",["compact","comfortable"],"comfortable"),select("metadata",["chip","plain","none"],"chip"),select("commands",["0","1","2"],"2"),toggle("description"),{...toggle("narrow"),label:"Narrow panel"},toggle("loaded"),toggle("animate",true)],
  "upload-item": [select("state", ["queued", "uploading", "paused", "processing", "success", "error", "cancelled"], "uploading"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),select("nameOverflow", ["wrap", "truncate"], "wrap"),toggle("longName"),toggle("showThumbnail"),toggle("showActions",true),{...toggle("allowPause"),label:"Allow pause"},toggle("disabled")],
  "upload-list": [select("density", ["compact", "comfortable"], "comfortable"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),select("nameOverflow", ["wrap", "truncate"], "wrap"),toggle("longName"),toggle("showActions",true),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"},{...toggle("longStatus"),label:"Long status"}],
  "upload-queue": [select("density",["compact","comfortable"],"compact"),select("maxListHeight",["8rem","12rem","18rem"],"18rem"),{...toggle("showExamples",true),label:"Show sample files"}],
  "image-preview": [select("image", ["brand", "missing"], "brand"),toggle("showCaption",true),
    {...toggle("showMeta"),label:"Show image metadata"},toggle("zoomable",true),toggle("showDownload"),toggle("disabled")],
  "image-gallery": [select("navigation",["arrows","thumbnails"],"arrows"),toggle("zoomable"),toggle("showDownload"),{...toggle("missingImage"),label:"Include unavailable image"}],
  "alt-text-disclosure": [select("example",["short","detailed","decorative"],"short"),{...toggle("narrow"),label:"Narrow width"}],
  "image-alt-text-editor": [select("image",["Chart","Brand mark"],"Chart"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("readOnly"),label:"Read only"}],
  "thumbnail-strip": [{...toggle("narrow"),label:"Narrow width"},
    {...toggle("missingThumbnail"),label:"Missing thumbnail"},select("surface",["raised","overlay"],"raised")],
  "zoom-control": [{...toggle("narrow"),label:"Narrow width"},{...toggle("showFit",true),label:"Show fit"}],
  "collection-cover": [select("count",["0","1","2","3"],"3"),{...toggle("missingThumbnail"),label:"Unavailable thumbnail"},{...toggle("narrow"),label:"Narrow width"}],
  "collection-card": [{...toggle("showActions",true),label:"Copy link"},{...toggle("empty"),label:"No artwork"},{...toggle("narrow"),label:"Narrow width"}],
  "image-mosaic": [select("count",["1","2","3","4","5"],"3"),{...toggle("missingThumbnail"),label:"Unavailable thumbnail"}],
  "document-preview": [select("pageState",["ready","loading","error","empty"],"ready"),{...toggle("singlePage"),label:"Single page"},{...toggle("inDrawer"),label:"Open from a drawer"}],
  "editable-grid": [select("density", ["compact", "comfortable"], "comfortable"), toggle("readOnly"), toggle("emptyRows")],
  "import-column-mapping": [select("scenario",["Draft","Field removed","Empty"],"Draft"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "reorder-list": [select("density", ["compact", "comfortable"], "comfortable"), toggle("rejectMoves"),toggle("disabled")],
  "kanban-board": [select("appearance",["open","contained"],"open"),select("cardLayout",["compact","project"],"compact"),select("dragActivation",["handle","card"],"handle"),toggle("showCounts",true),toggle("rejectMoves"),toggle("disabled")],
  "data-table": [select("density", ["compact", "comfortable"], "comfortable"),select("pageSize", ["3", "5", "10", "15"], "5"),select("paginationPresentation", ["numbered", "compact", "arrows"], "numbered"),toggle("stickyHeader"),toggle("selectable",true),toggle("showResults",true),toggle("showSelection",true),{...toggle("replaceResults"),label:"Swap result count on selection"},{...toggle("cursorPages"),label:"Cursor pagination"},toggle("striped"),select("state", ["ready", "loading", "error"], "ready"),select("loadingAppearance", ["spinner", "message", "skeleton"], "spinner"),toggle("refreshing"),toggle("emptyRows"),{...toggle("fixedColumns"),label:"Fixed columns"},toggle("customEmpty",true),toggle("customError")],
  "list-skeleton": [select("density", ["compact", "comfortable"], "comfortable"), select("rows", ["2", "3", "5"], "3"), toggle("media",true), toggle("description",true), toggle("metadata",true), {...toggle("reserveSelectionSpace"),label:"Reserve selection space"}, toggle("dividers"), toggle("animate",true)],
  "table-skeleton": [select("density", ["compact", "comfortable"], "comfortable"), select("rows", ["2", "3", "4", "5"], "4"), toggle("secondaryLine",true), toggle("animate",true), toggle("loaded"), toggle("striped")],
  "card-skeleton": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showMedia"), toggle("description",true),{...toggle("longDescription"),label:"Long description"}, toggle("headerAction",true), toggle("footerAction",true),toggle("footerDivider",true),toggle("selectable"),{...toggle("narrow"),label:"Narrow width"},toggle("loaded"), toggle("animate",true)],
  "data-list": [select("density", ["compact", "comfortable"], "comfortable"),toggle("dividers",true),toggle("selectable"),{...toggle("reserveSelectionSpace"),label:"Reserve selection space"},toggle("showDescription",true),toggle("showMedia",true),toggle("showDetails"),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle"),{...toggle("narrow"),label:"Narrow panel"}],
  "data-list-item": [select("density", ["compact", "comfortable"], "comfortable"),select("layout", ["row", "content"], "row"),toggle("selectable"),toggle("showDescription",true),toggle("showMedia",true),toggle("showDetails"),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle"),{...toggle("narrow"),label:"Narrow panel"}],
  "metadata-list": [select("size", ["sm", "md"], "sm"),toggle("showIcons",true),toggle("longValue"),{...toggle("narrow"),label:"Narrow panel"}],
  "notification-item": [{...toggle("checked",true),label:"Unread"},toggle("showMedia",true),toggle("showActions",true),toggle("showDescription",true)],
  "notification-list": [select("density", ["compact", "comfortable"], "compact"),{...toggle("checked",true),label:"Unread first row"},toggle("showMedia",true),toggle("showActions",true),toggle("showDescription",true),{...toggle("constrainWidth"),label:"Narrow width"},{...toggle("longTime"),label:"Long timestamp"}],
  "notification-inbox": [select("density",["compact","comfortable"],"compact"),select("appearance",["default","overlay"],"default"),select("state",["ready","loading","error"],"ready"),toggle("showMedia",true),toggle("showMarkAll",true),{...toggle("constrainWidth"),label:"Narrow width"},toggle("empty")],
  "notification-list-skeleton": [select("density",["compact","comfortable"],"compact"),toggle("showMedia",true),toggle("showActions",true),{...toggle("constrainWidth"),label:"Narrow width"},toggle("animate",true)],
  "notification-trigger": [select("size",["sm","md","lg"],"sm"),select("variant",["ghost","subtle","outline"],"ghost"),{...select("demoUnread",["0","1","2"],"2"),label:"Unread count"},toggle("longList"),toggle("disabled")],
  "check-card": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("showDescription",true),toggle("showMetadata",true),toggle("indeterminate"),toggle("readOnly"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "radio-card": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("showDescription",true),toggle("showMetadata",true),toggle("readOnly"),toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "radio-card-group": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "check-card-group": [select("density", ["compact", "comfortable"], "comfortable"),choiceCardIndicator,toggle("disabled"),{...toggle("narrow"),label:"Narrow panel"}],
  "color-swatch": [select("size", ["sm", "md", "lg"], "md"), select("value", ["#ff47a8", "#ffffff", "#78b8ff", "#ff47a866", "#00000000"], "#ff47a8")],
  "color-contrast": [select("scenario",["brand on charcoal","gray on white","black on white","same color"],"brand on charcoal"),
    select("textSize",["normal","large"],"normal"),{...toggle("narrow"),label:"Narrow width"}],
  "color-palette": [select("appearance", ["swatches", "labeled"], "swatches"), toggle("disabled"), toggle("readOnly"), toggle("disableLast")],
  "color-picker": [select("controlSize", ["sm", "md", "lg"], "md"), toggle("allowAlpha"), toggle("hideLabel"), toggle("readOnly"), toggle("disabled"), toggle("presets", true)],
  "color-filter": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("presets",true)],
  "gradient-editor": [select("controlSize",["sm","md","lg"],"sm"),toggle("readOnly"),toggle("disabled")],
  "hover-card": [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "center"), toggle("disabled")],
  "tree-select": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  tree: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("multiple"), toggle("hideLabel"), toggle("showDescriptions"), toggle("showRowActions"), toggle("readOnly"), toggle("disabled"), toggle("loading"), toggle("empty")],
  "navigation-tree": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["introduction", "installation", "button"], "installation"), toggle("branchGuides", true), toggle("disableLast"), toggle("loading")],
  "context-menu": [select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("disabled")],
  "error-summary": [select("appearance", ["banner", "inline"], "banner"), select("announcement", ["off", "polite", "assertive"], "off"), toggle("showErrors", true), {...toggle("showFormError"),label:"Form-wide error"}, toggle("showDescription"), toggle("autoFocus")],
  "resizable-panels": [select("orientation", ["horizontal", "vertical"], "horizontal"), {...select("defaultValue", ["30", "50", "70"], "50"),label:"Initial split"}, toggle("disabled")],
  "range-calendar": [select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "date-range-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "time-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  calendar: [select("selectionMode",["single","multiple"],"single"),select("granularity", ["day", "month", "year"], "day"),toggle("showViewControls",true),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "media-transcript": [toggle("highlight"),toggle("empty")],
  "media-seek-bar": [select("buffered",["Partial","Complete","None"],"Partial"),toggle("loading"),toggle("rtl")],
  "media-chapter-list": [toggle("thumbnails",true),toggle("disabled"),toggle("rtl")],
  "media-trim-range": [toggle("waveform",true),toggle("disabled"),toggle("rtl")],
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
  "rating-breakdown": [toggle("filterable",true),{...toggle("narrow"),label:"Narrow panel"}],
  dropzone: [select("density",["comfortable","compact"],"comfortable"),toggle("multiple", true), toggle("clearable", true), toggle("required"), toggle("disabled")],
  "file-drop-target": [toggle("multiple",true),toggle("disabled")],
  "character-count": [select("count", ["0", "24", "40", "48"], "24"), select("mode", ["count", "remaining"], "count")],

  "navigation-list": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["overview", "activity", "settings"], "overview"), toggle("grouped", true), toggle("showDescriptions")],
  steps: [select("orientation", ["horizontal", "vertical"], "horizontal"), select("currentValue", ["details", "access", "review"], "access"), {...toggle("narrow"), label:"Narrow panel"}, toggle("interactive"), toggle("error"), toggle("disableLast")],
  "step-progress": [select("step", ["1", "2", "3"], "2")],
  "page-header": [select("headingSize", ["page", "large", "display"], "large"), toggle("showDescription"), toggle("showActions", true),
    {...toggle("showMetadata"), label:"Show metadata"}, {...toggle("longTitle"), label:"Long title"}, {...toggle("secondaryAction"), label:"Secondary action"}, {...toggle("narrow"), label:"Narrow width"}],
  section: [{...select("headingLevel", ["2", "3", "4", "5", "6"], "2"),label:"Heading level (HTML)"}, {...select("headingSize", ["group", "section", "page", "large", "display"], "section"),label:"Heading size"}, toggle("showDescription", true), toggle("showActions", true)],
  split: [select("side", ["start", "end"], "end"), select("ratio", ["balanced", "main", "aside"], "main"), select("collapseAt", ["sm", "md", "lg", "never"], "sm"), select("gap", spaces, "6")],
  center: [toggle("inline"), select("maxWidth", ["16rem", "24rem", "100%"], "16rem"), select("minHeight", ["8rem", "12rem", "16rem"], "12rem")],
  "skip-link": [],

  "avatar-group": [select("size", ["sm", "md", "lg"], "md"), select("max", ["2", "3", "4", "5"], "4"), select("overflowPresentation", ["count", "popover"], "count"), select("spacing", ["auto", "separated"], "auto"), select("layout", ["wrap", "fit"], "wrap"), {...toggle("constrainWidth"),label:"Narrow width"}, toggle("presence"), toggle("longNames"), {...toggle("manyPeople"),label:"More people"}],
  "author-meta": [select("size", ["sm", "md"], "md"), {...toggle("metadata", true), label:"Show metadata"}, select("metadataPlacement", ["below","inline"], "below"), select("nameOverflow",["wrap","truncate"],"wrap"), toggle("presence"), {...toggle("longName"), label:"Long name"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  "profile-summary": [{...toggle("details",true),label:"Show details"},{...toggle("follow",true),label:"Show follow action"},
    {...toggle("longProfile"),label:"Long identity"},{...toggle("narrow"),label:"Narrow width"}],
  comment: [select("size", ["sm", "md"], "md"), select("actionVisibility", ["on-interaction", "always"], "on-interaction"), {...toggle("metadata", true), label:"Show timestamp"}, {...toggle("showAttachment"), label:"Show attachment"}, {...toggle("showReaction", true), label:"Existing reactions"}, {...toggle("showActions", true), label:"Show actions"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("longMessage"), label:"Long message"}],
  "reaction-picker": [toggle("disabled"), {...toggle("showReaction"), label:"Existing reactions"}],
  "reaction-button": [toggle("checked"), toggle("disabled")],
  "comment-thread": [select("size", ["sm", "md"], "sm"), select("actionVisibility", ["on-interaction", "always"], "on-interaction"), toggle("dividers"), {...toggle("showActions", true), label:"Show actions"}, {...toggle("showComposer", true), label:"Show composer"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("discloseReplies"), label:"Disclose replies"}],
  "review-thread": [select("scenario",["Ready","Pending","Rejected","Read only"],"Ready"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "comment-composer": [{...toggle("replyContext", true), label:"Reply context"}, toggle("disabled")],
  "status-indicator": [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "success"), select("size", ["sm", "md", "lg"], "md"), select("presentation", ["label", "chip", "icon", "wrap"], "label"), {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("showPeers"), label:"Compare with Badge and Tag"}, {...toggle("announce"), label:"Announce to screen readers"}],
  figure: [select("captionPosition", ["before", "after"], "after"), toggle("showCaption", true)],
  "media-credit": [select("scenario",["published","unverified","creator only"],"published"),{...toggle("narrow"),label:"Narrow width"}],
  blockquote: [toggle("attribution", true)],
  "inline-code": [select("size", ["sm", "md", "lg"], "md"), toggle("wrap", true), toggle("longValue")],
  "endpoint-label": [select("overflow",["truncate","wrap"],"truncate"),toggle("keepEnding",true),{...toggle("narrow"),label:"Narrow width"},{...toggle("extension"),label:"Extension method"}],
  "http-method": [select("variant",["text","outline"],"text"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "git-ref": [select("surface",["raised","inset"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "review-revision": [select("state",["stale","current","unreviewed"],"stale"),{...toggle("showPrevious",true),label:"Show reviewed revision"},{...toggle("narrow"),label:"Narrow width"}],
  "data-freshness": [select("state",["current","delayed","refreshing","failed","pending"],"delayed"),
    {...toggle("relative",true),label:"Relative time"},{...toggle("narrow"),label:"Narrow width"}],
  "commit-list": [{...toggle("showCopy",true),label:"Copy hashes"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "http-status": [toggle("showReason"),{...toggle("narrow"),label:"Narrow width"}],
  "http-request-row": [toggle("longPath",true),{...toggle("narrow"),label:"Narrow width"},select("surface",["canvas","raised","inset"],"raised")],
  "http-exchange-details": [select("scenario",["Created","Pending","No response","Headers only","Empty body"],"Created"),{...toggle("narrow"),label:"Narrow width"}],
  "row-change-details": [select("scenario",["Update","Partial before","Missing before","Insert","Delete"],"Update"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("searchable")],
  metric: [select("state", ["ready", "loading", "unavailable"], "ready"), select("size", ["sm", "md", "lg"], "md"), select("direction", ["up", "down", "flat"], "up"), select("tone", ["neutral", "success", "warning", "error", "info"], "success"), toggle("trend", true), toggle("hint", true),{...toggle("showUnit"),label:"Show unit"}],
  "metric-delta": [select("variant",["plain","chip"],"plain"), select("direction",["up","down","flat"],"down"), select("tone",["neutral","success","warning","error","info","accent"],"neutral"), {...toggle("showContext",true),label:"Show period"}],
  "metric-card": [select("state", ["ready", "loading", "unavailable"], "ready"), select("layout", ["inline", "stacked"], "inline"), select("size", ["sm", "md", "lg"], "md"), select("comparisonStyle", ["plain", "chip"], "plain"), {...select("chartState", ["follow metric", "ready", "loading"], "follow metric"),label:"Chart state"}, toggle("showChart",true), {...toggle("showChartLabel"),label:"Show chart label"}, toggle("showComparison",true), {...toggle("narrow"),label:"Narrow card"}],
  "metric-group": [select("scenario", ["ready", "mixed", "loading"], "ready"), select("appearance", ["plain", "panel"], "plain"), select("layout", ["grid", "rows"], "grid"), select("size", ["sm", "md", "lg"], "sm"), {...toggle("longLabel"),label:"Long label"}, {...toggle("longValue"),label:"Long value"}, {...toggle("showComparison",true),label:"Show comparison"}, {...toggle("narrow"),label:"Narrow panel"}],
  sparkline: [select("size", ["sm", "md"], "md"), select("tone", ["neutral", "accent", "success", "warning", "error"], "accent"), select("variant", ["line", "area"], "area"), select("series", ["rising", "falling", "gaps"], "rising"), toggle("showLabel")],
  "line-chart": [select("variant", ["line", "area"], "area"), select("curve", ["linear", "smooth"], "smooth"), select("data", ["complete", "month", "gap", "single", "empty"], "complete"), toggle("comparison", true), {...toggle("showYAxis"), label:"Y axis"}, {...toggle("showLegend"), label:"Legend"}],
  "bar-chart": [select("layout", ["grouped", "stacked", "percent"], "grouped"), select("data", ["complete", "missing", "signed", "zero", "empty"], "complete"), toggle("comparison", true), {...toggle("showLegend"), label:"Legend"}],
  "donut-chart": [select("data", ["complete", "single", "zero", "empty"], "complete"), {...toggle("showLegend"), label:"Legend"}],
  "composition-bar": [select("layout", ["inline", "rows"], "inline"), select("readout", ["value", "share", "both"], "value"), select("data", ["complete", "long labels", "small share", "zero", "empty"], "complete"), {...toggle("narrow"), label:"Narrow width"}],
  "heatmap": [select("data", ["complete", "gaps", "empty"], "complete")],
  "uptime-history": [select("window",["30","90"],"30"),select("scenario",["Incidents","Healthy","No data","Empty"],"Incidents"),{...toggle("narrow"),label:"Narrow width"}],
  "service-availability": [select("window",["30","90"],"30"),select("scenario",["Mixed","Healthy","No history","No services"],"Mixed")],
  "scatter-chart": [select("data", ["complete", "single", "empty"], "complete")],
  "range-chart": [select("data", ["complete", "gap", "empty"], "complete"), {...toggle("midpoint", true), label:"Median"}],
  "dumbbell-chart": [select("data", ["complete", "missing", "empty"], "complete")],
  "box-plot": [select("data", ["complete", "gap", "flat", "empty"], "complete"), {...toggle("outliers", true), label:"Outliers"}],
  "bullet-chart": [select("data", ["complete", "zero", "empty"], "complete")],
  "waterfall-chart": [select("data", ["complete", "signed", "empty"], "complete")],
  "histogram": [select("data", ["complete", "zero", "empty"], "complete")],
  "bar-list": [select("tone", ["accent", "neutral"], "accent"), select("data", ["ranked", "zero", "empty"], "ranked")],
  timeline: [select("mode", ["activity", "progress"], "activity"), select("layout", ["feed", "schedule", "stacked"], "feed"), select("density", ["compact","comfortable"], "comfortable"), toggle("descriptions", true), toggle("times", true), {...toggle("constrainWidth"), label:"Narrow width"}],
  "activity-timeline": [select("density", ["compact","comfortable"], "compact"), select("surface", ["canvas","default","raised","overlay"], "canvas"), {...select("periodConnector", ["solid","dashed","none"], "solid"),label:"Period connector"}, {...toggle("descriptions", true), label:"Event details"}, toggle("times", true), {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("longLabels"),label:"Long change labels"}, toggle("empty")],
  "audit-timeline": [select("density",["compact","comfortable"],"compact"),{...toggle("constrainWidth"),label:"Narrow width"},toggle("empty")],
  "project-update": [{...toggle("showChanges",true),label:"Show changes"},{...toggle("showProject",true),label:"Show project"},{...toggle("narrow"),label:"Narrow width"}],
  "dependency-schedule": [select("scenario",["Forecast conflict","Same day","Missing finish","No conflict"],"Forecast conflict"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "service-incident": [select("phase",["Investigating","Monitoring","Resolved"],"Monitoring"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "maintenance-window": [select("phase",["scheduled","in-progress","completed","canceled"],"scheduled"),select("timing",["Same day","Across midnight","Clock change"],"Same day"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "project-health": [select("scenario",["overdue","current","missing","not expected"],"overdue"),
    {...toggle("link",true),label:"Link to report"},{...toggle("narrow"),label:"Narrow width"}],
  "pipeline-run": [select("scenario",["Failed","Running","Succeeded"],"Failed"),{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "check-run-list": [select("scenario",["Failing check","Missing report","Ready"],"Failing check"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "evaluation-result": [select("scenario",["failed","passed","execution error","pending"],"failed"),
    {...toggle("narrow"),label:"Narrow width"}],
  "deployment-history": [select("scenario",["Failed","Building","Active","Empty"],"Failed"),{...toggle("narrow"),label:"Narrow width"},{...toggle("showActions",true),label:"Show actions"}],
  "release-target-matrix": [select("scenario",["Mixed rollout","Released","Empty"],"Mixed rollout"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "deployment-handoff": [select("scenario",["Preparing","Overlapping","Draining","Completed","Failed"],"Draining"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "replica-allocation": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("locked"),label:"Lock Virginia"},toggle("disabled")],
  "restart-policy-editor": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("restricted"),label:"Restricted plan"},toggle("disabled")],
  "service-runtime-status": [select("scenario",["Sleeping","Waking","Running","Wake failed","Unknown"],"Sleeping"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("announce")],
  "deployment-health-check": [select("scenario",["Checking","Passed","Timeout","No response","Not configured"],"Checking"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "deployment-rollback-dialog": [select("scenario",["Available","Expired","Already live"],"Available")],
  "citation": [{...toggle("showExcerpt",true),label:"Show excerpt"},{...toggle("narrow"),label:"Narrow width"}],
  "source-list": [{...toggle("showExcerpts",true),label:"Show excerpts"},{...toggle("showUnavailable"),label:"Unavailable source"},
    {...toggle("narrow"),label:"Narrow width"}],
  "search-result-item": [{...toggle("showExcerpts",true),label:"Show excerpts"},
    {...toggle("narrow"),label:"Narrow width"},select("surface",["raised","overlay"],"raised")],
  "connection-details": [select("scenario",["multiple","ipv4-only","pooler removed","single","empty"],"multiple"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "replication-status": [select("scenario",["Mixed","In sync","Unavailable","Empty"],"Mixed"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "service-endpoint-list": [select("scenario",["network routes","provisioning","private only","empty"],"network routes"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "domain-verification": [select("scenario",["waiting","verified","missing"],"waiting"),{...toggle("narrow"),label:"Narrow width"}],
  "delivery-attempts": [select("scenario",["Delivered","Failed","Pending"],"Delivered"),{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "retry-schedule": [select("state",["scheduled","exhausted"],"scheduled"),
    {...toggle("showDetails",true),label:"Show schedule details"},{...toggle("narrow"),label:"Narrow width"}],
  "record-relations": [{...toggle("showStatuses",true),label:"Show statuses"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "record-relation-suggestion": [select("scenario",["Ready","Pending","Refused"],"Ready"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "record-relation-form": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("accept",true),label:"Accept relationship"},toggle("pending")],
  "access-summary": [select("mode",["Scoped","Read only","Empty"],"Scoped"),{...toggle("delegated",true),label:"Delegated access"},{...toggle("narrow"),label:"Narrow width"}],
  "session-list": [select("scenario",["Multiple sessions","Current only","Current unknown","Empty"],"Multiple sessions"),{...toggle("narrow"),label:"Narrow width"}],
  "connected-account-list": [select("scenario",["Mixed connections","View only","Empty"],"Mixed connections"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "pending-invitation-list": [select("scenario",["Mixed","One scope","Empty"],"Mixed"),{...toggle("narrow"),label:"Narrow width"},toggle("actions",true)],
  "environment-variable-list": [select("scenario",["Production","Preview","Empty"],"Production"),{...toggle("narrow"),label:"Narrow width"}],
  "storage-bucket-policy": [select("scenario",["Public assets","Private uploads","Unknown"],"Public assets"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "volume-mount-summary": [select("scenario",["Mounted","Pending","Detached","Unknown"],"Mounted"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "temporary-access-link": [select("scenario",["Active","Expiring","Expired","Unavailable"],"Active"),select("access",["download","upload"],"download"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "variable-reference-picker": [select("scenario",["Available","Limited","Empty"],"Available"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("clearable")],
  "api-key-list": [select("scenario",["Inventory","Revoked","Empty"],"Inventory"),{...toggle("narrow"),label:"Narrow width"}],
  "passkey-list": [select("scenario",["Registered","Read only","Empty"],"Registered"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "key-rotation-summary": [select("scenario",["Scheduled","Immediate","Manual"],"Scheduled"),select("surface",["raised","overlay"],"overlay"),
    {...toggle("narrow"),label:"Narrow width"}],
  "permission-editor": [select("mode",["Edit","Review","Empty"],"Edit"),{...toggle("narrow"),label:"Narrow width"}],
  "access-invite-form": [select("scenario",["Ready","No roles","Sending","Failed"],"Ready"),select("surface",["canvas","raised","inset"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "sharing-panel": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("fail"),label:"Reject change"},toggle("pending")],
  "access-request-form": [select("scenario",["Ready","Sending","Failed","Requested","Unavailable"],"Ready"),toggle("showMessage",true),select("surface",["canvas","raised","inset"],"raised")],
  "batch-result": [select("scenario",["Partial","Succeeded","Empty"],"Partial"),{...toggle("showSucceeded"),label:"Show successes"},{...toggle("pending"),label:"Retry pending"},{...toggle("narrow"),label:"Narrow width"}],
  "collection-import-review": [select("scenario",["Some skipped","All eligible","None eligible","Unavailable"],"Some skipped"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "version-history": [{...toggle("allowRestore",true),label:"Allow restore"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "content-advisory": [select("presentation",["inline","media"],"inline"),{...toggle("description",true),label:"Show description"},{...toggle("narrow"),label:"Narrow width"}],
  "filtered-image": [select("visibility",["show","blur","hide"],"blur"),{...toggle("narrow"),label:"Narrow width"}],
  "muted-word-list": [select("surface",["raised","overlay"],"raised"),{...toggle("actions",true),label:"Show actions"},{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "muted-word-form": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("pending")],
  "content-label-settings": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("accept",true),label:"Accept changes"},toggle("empty")],
  "content-report-form": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("accept",true),label:"Accept report"},toggle("pending")],
  "environment-creation-form": [select("scenario",["Ready","Source removed","No sources"],"Ready"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("pending"),{...toggle("fail"),label:"Reject creation"}],
  "database-webhook-form": [select("catalog",["Ready","Table removed","Empty"],"Ready"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("pending"),{...toggle("fail"),label:"Reject creation"}],
  "log-export-form": [select("range",["Fixed","Recent"],"Fixed"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("fail"),label:"Fail download"},toggle("pending")],
  "content-report-status": [select("phase",["Submitted","In review","Action taken","No action taken"],"Action taken"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "moderation-notice": [select("scenario",["Can appeal","Appeal submitted","Decision upheld","Appeal accepted","Expired"],"Can appeal"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "account-standing": [select("scenario",["At risk","Good standing","Restricted","Unavailable"],"At risk"),select("surface",["canvas","raised","overlay"],"raised"),toggle("showHistory",true)],
  "moderation-appeal-form": [select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("accept",true),label:"Accept appeal"},toggle("pending")],

  "copy-button": [select("size", sizes, "md"), select("variant", variants, "subtle"), toggle("iconOnly"), toggle("disabled")],
  "follow-button": [{...toggle("privateProfile"),label:"Private profile"},toggle("pending"),toggle("disabled")],
  "publication-preview": [select("scenario",["Available","Pending","Link only"],"Available"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "starter-pack-preview": [select("scenario",["People and feeds","Feeds only","Empty"],"People and feeds"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "visual-search-form": [select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("pending"),toggle("disabled")],
  "copyable-value": [select("appearance", ["text", "code"], "text"), select("overflow", ["wrap", "truncate"], "wrap"), toggle("longValue"), {...toggle("constrainWidth"), label:"Narrow width"},{...toggle("identifiers"),label:"Request IDs"},{...toggle("preserveEnd"),label:"Keep ending"}],
  "reveal-value": [select("appearance",["text","code"],"code"),select("overflow",["wrap","truncate"],"truncate"),toggle("allowCopy",true),toggle("longValue"),{...toggle("constrainWidth"),label:"Narrow width"},{...toggle("inDetails"),label:"In details"}],
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
  "rollout-allocation": [select("scenario",["pilot","canary"],"pilot"),{...toggle("narrow"),label:"Narrow width"},toggle("readOnly")],
  container: [select("size", ["sm", "md", "lg", "full"], "lg"), select("gutter", spaces, "6")],
  grid: [select("columns", ["auto", "1", "2", "3", "4", "6"], "auto"), {...select("maxColumns", ["none", "1", "2", "3", "4"], "none"),label:"Max columns"}, select("minItemWidth", ["10rem", "16rem", "24rem"], "16rem"), select("gap", spaces, "4")],
  masonry: [{...select("columnLimit",["1","2","3","4"],"2"),label:"Max columns"},select("gap",["2","3","4","6"],"3"),{...toggle("narrow"),label:"Narrow width"},toggle("rtl")],
  "visually-hidden": [toggle("focusable")],
  "aspect-ratio": [select("ratio", ["1", "1.3333333333333333", "1.7777777777777777", "2"], "1.7777777777777777")],
  "image-comparison": [select("mode", ["swipe", "overlay"], "swipe"), select("fit", ["contain", "cover"], "contain"), select("direction", ["ltr", "rtl"], "ltr"), toggle("disabled"), {...toggle("narrow"),label:"Narrow preview"}],
  image: [select("fit", ["cover", "contain"], "cover"), toggle("decorative")],
  list: [toggle("ordered"), toggle("marker", true), select("gap", spaces, "2")],
  "empty-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription", true), toggle("showIcon", true), toggle("showActions", true)],
  "no-results": [select("layout", ["row", "inline", "centered"], "row"), select("density", ["compact", "comfortable"], "compact"), toggle("showReset", true), {...toggle("narrow"), label:"Narrow width"}],
  "error-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription", true), toggle("showRetry", true), toggle("retrying")],
  card: [select("density", ["compact", "comfortable"], "comfortable"), select("elevation", ["default", "raised"], "default"), select("headingSize", ["group","section","page"],"section"),toggle("showMedia"), toggle("showTitle", true), toggle("showDescription", true), toggle("showActions", true),toggle("longHeader"), toggle("showFooter", true), toggle("footerDivider",true),toggle("selectable"),toggle("selectionDisabled"),{...toggle("narrow"),label:"Narrow panel"}],
  toolbar: [select("variant",["contained","plain"],"contained"),select("shape",["rounded","pill"],"rounded"),select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("loop", true), toggle("disableUndo")],
  kbd: [select("size", ["sm", "md", "lg"], "sm")],
  "keyboard-shortcut": [select("size",["sm","md","lg"],"sm"),select("presentation",["keys","compact"],"keys"),select("example",["two keys","three keys","macOS glyphs","sequence"],"three keys"),toggle("rtl")],
  "shortcut-reference": [select("platform",["Windows","macOS"],"Windows"),{...toggle("narrow"),label:"Narrow width"},toggle("empty")],
  "shortcut-recorder": [toggle("allowSingleKey"),toggle("unassigned"),toggle("disabled")],
  menu: [{...select("scenario", ["actions", "preferences", "mixed", "submenus"], "actions"),label:"Example"}, select("controlSize", ["sm", "md", "lg", "xl"], "sm"), select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("icons", true), toggle("shortcuts"), toggle("iconTrigger"), toggle("disableArchive", true), toggle("disabled")],
  "description-list": [select("layout", ["inline", "columns", "stacked", "grid"], "inline"), select("density", ["compact", "comfortable"], "compact"), toggle("dividers"), toggle("longValue"), {...toggle("stackOwner"),label:"Stack owner"}, {...toggle("truncateValue"),label:"Truncate owner"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("showActions"), label:"Copy actions"}],
  "amount-breakdown": [select("example",["invoice","credit","total only"],"invoice"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},toggle("rtl")],
  "currency-conversion": [select("state",["Settled","Estimated","Pending","Refund"],"Settled"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "expense-settlement": [select("scenario",["Reimbursement","Repayment","External payment","Failed"],"Reimbursement"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "bill-payment-schedule": [select("scenario",["Partially paid","Needs release","No payments","Paid","Unavailable"],"Partially paid"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "refund-link-summary": [select("scenario",["Partial refund","Synced","Unlinked","Unavailable"],"Partial refund"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "expense-allocation-form": [select("total",["100.00","120.01","90.00"],"100.00"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},{...toggle("accept",true),label:"Accept split"},toggle("pending")],
  "temporary-spend-limit": [select("scenario",["Active","Requested","Declined","Expired"],"Active"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "expense-allocation-review": [select("scenario",["Changed total","Balanced","Overallocated","No split"],"Changed total"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "value-change": [select("layout", ["inline", "adaptive", "stacked"], "inline"), {...select("scenario", ["status", "assignee", "added", "removed"], "status"), label:"Change"}, {...toggle("constrainWidth"), label:"Narrow width"}, {...toggle("longLabels"),label:"Long labels"}],
  "text-annotation": [toggle("resolved"),toggle("active"),{...toggle("constrainWidth"),label:"Narrow width"}],
  "image-annotations": [{...toggle("narrow"),label:"Narrow width"},toggle("rtl"),{...toggle("edgePoint"),label:"Edge point"}],
  "image-focal-point": [{...toggle("narrow"),label:"Narrow width"},toggle("disabled")],
  "mention": [{...toggle("linked",true),label:"Link to profile"},{...toggle("alias"),label:"Display name"},{...toggle("narrow"),label:"Narrow width"},{...toggle("rtl"),label:"Right to left"}],
  "reply-reference": [{...toggle("unavailable"),label:"Unavailable source"},{...toggle("narrow"),label:"Narrow width"}],
  "quoted-post": [select("appearance",["outlined","embedded"],"outlined"),{...toggle("unavailable"),label:"Unavailable source"},{...toggle("narrow"),label:"Narrow width"},select("surface",["raised","overlay"],"raised")],
  "generation-preview": [select("state",["queued","generating","ready","failed","cancelled"],"generating"),toggle("partial"),{...toggle("narrow"),label:"Narrow width"}],
  "feed-update": [select("updates",["3","1","unknown","0"],"3"),select("placement",["header","overlay"],"header"),toggle("pending"),{...toggle("narrow"),label:"Narrow width"}],
  "feed-attribution": [{...toggle("linked",true),label:"Link to source"},{...toggle("showIcon",true),label:"Show icon"},select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "unread-marker": [{...toggle("allRead"),label:"All messages read"},{...toggle("narrow"),label:"Narrow width"},{...toggle("localized"),label:"Long label"}],
  "typing-indicator": [select("participants",["One person","Two people","Nobody"],"One person"),{...toggle("reserveSpace",true),label:"Reserve space"},{...toggle("narrow"),label:"Narrow width"}],
  "message-receipt": [select("state",["sending","sent","delivered","read","failed"],"delivered"),{...toggle("announce"),label:"Announce changes"},{...toggle("narrow"),label:"Narrow width"}],
  "group-read-receipt": [select("readers",["None","One","Two"],"Two"),{...toggle("narrow"),label:"Narrow width"}],
  "thread-trigger": [select("replies",["Two","One","None"],"Two"),toggle("unread",true),
    {...toggle("showDetails",true),label:"Show details"},{...toggle("narrow"),label:"Narrow width"}],
  "participant-popover": [select("roster",["Two people","Full roster","Empty"],"Two people"),{...toggle("narrow"),label:"Narrow width"}],
  "collaborator-presence": [select("scenario",["Live","Reconnecting","Empty","Unavailable"],"Live"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "identity-verification-badge": [select("evidence",["Two issuers","Single issuer","No evidence"],"Two issuers"),select("surface",["raised","overlay"],"raised")],
  "notification-subscription": [{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),{...toggle("narrow"),label:"Narrow width"}],
  "notification-channel-settings": [select("surface",["raised","overlay"],"raised"),{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),{...toggle("narrow"),label:"Narrow width"}],
  "estimate-menu": [select("scale",["Points","Sizes"],"Points"),select("surface",["raised","overlay"],"raised"),{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),{...toggle("narrow"),label:"Narrow width"}],
  "snooze-menu": [{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),{...toggle("narrow"),label:"Narrow width"}],
  "reminder-control": [{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "reply-audience": [{...toggle("accept",true),label:"Accept changes"},toggle("disabled"),{...toggle("narrow"),label:"Narrow width"}],
  "change-region": [select("state",["changed","active","unmarked"],"changed"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "text-revision": [select("state", ["pending", "accepted", "rejected"], "pending"), select("kind", ["replacement", "insertion", "deletion"], "replacement"), toggle("active"), {...toggle("constrainWidth"), label:"Narrow width"}],
  "change-list": [select("layout", ["inline", "columns", "stacked"], "inline"), select("valueLayout", ["inline", "adaptive", "stacked"], "inline"), select("density", ["compact","comfortable"], "compact"), toggle("dividers"), {...toggle("constrainWidth"), label:"Narrow width"},{...toggle("longLabels"),label:"Long labels"}],
  "environment-sync-review": [select("scenario",["Changes","No changes","Unavailable"],"Changes"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "agent-handoff": [select("state",["transferred","requested","failed","unknown"],"transferred"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "staged-changes": [{...toggle("allowDiscard",true),label:"Allow discard"},{...toggle("narrow"),label:"Narrow width"}],
  "comparison-table": [select("density", ["compact","comfortable"], "comfortable"), {...toggle("highlightCurrent",true),label:"Highlight current plan"}, {...toggle("constrainWidth"),label:"Narrow width"}],
  "migration-history": [select("scenario",["Differences","In sync","Production unavailable","Empty"],"Differences"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},
    {...toggle("staging"),label:"Show staging"}],
  table: [select("density", ["compact", "comfortable"], "comfortable"), select("cellVerticalAlign", ["top", "middle", "bottom"], "middle"), toggle("striped"), toggle("hideCaption"), select("minWidth", ["auto", "32rem", "48rem"], "32rem"), toggle("empty"), toggle("footer", true)],
  progress: [select("layout", ["stacked", "inline"], "stacked"), select("value", ["0", "25", "50", "75", "100"], "50"), toggle("indeterminate"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "accent"), toggle("showValue", true), {...toggle("narrow"),label:"Narrow width"}],
  meter: [select("layout", ["stacked", "inline"], "stacked"), select("value", ["0", "25", "50", "75", "100"], "50"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "neutral"), toggle("showValue", true), toggle("reference"), {...toggle("narrow"),label:"Narrow width"}],
  "capacity-meter": [select("used", ["0", "58", "90", "100", "112"], "90"), select("layout", ["stacked", "inline"], "stacked"), select("size", ["sm", "md", "lg"], "md"), {...toggle("narrow"),label:"Narrow width"}],
  "cycle-capacity": [select("scenario",["Above estimate","Below estimate","Matches estimate","Zero capacity","Unavailable"],"Above estimate"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "usage-limit": [select("policy",["hard-limit","soft-budget","allowance"],"hard-limit"),select("used",["58","84","100","112"],"84"),{...toggle("showNotification",true),label:"Show notification"},{...toggle("narrow"),label:"Narrow width"}],
  "context-window-meter": [select("scenario",["Working","Compacting","Compacted","Over limit"],"Working"),
    select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"},
    {...toggle("showThreshold",true),label:"Show threshold"},{...toggle("showBreakdown",true),label:"Show breakdown"}],
  "token-usage-breakdown": [select("scenario",["Reported","Totals only","Zero","Unavailable"],"Reported"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "usage-forecast": [select("scenario",["over budget","within budget","no forecast","already over"],"over budget"),select("surface",["raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "progress-ring": [select("value", ["0", "25", "50", "75", "100"], "50"), toggle("indeterminate"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "accent"), toggle("showValue", true), {...toggle("narrow"),label:"Narrow width"}],
  "milestone-progress": [{...toggle("narrow"),label:"Narrow width"},{...toggle("showDate",true),label:"Show target date"},{...toggle("showLink"),label:"Link milestone"}],
  "cycle-progress": [select("scenario",["Scope grew","Scope reduced","Complete","Empty"],"Scope grew"),select("surface",["default","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  alert: [select("tone", ["neutral", "info", "success", "warning", "error"], "info"), select("appearance", ["banner", "inline"], "banner"), select("announcement", ["off", "polite", "assertive"], "off"), toggle("showTitle", true), toggle("showIcon", true), toggle("showAction", false), {...toggle("narrow"),label:"Narrow panel"}],
  badge: [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "neutral"), select("variant", ["subtle", "outline"], "subtle"), select("size", ["sm", "md", "lg"], "md")],
  "count-badge": [select("count", ["0", "4", "24", "99", "137"], "137"), select("presentation", ["count", "dot"], "count"), select("max", ["9", "99"], "99"), {...toggle("showZero"), label:"Show zero"}],
  spinner: [select("size", ["sm", "md", "lg"], "md"), toggle("decorative")],
  "loading-state": [select("layout", ["centered", "inline", "row"], "centered"), select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription"), toggle("announce")],
  skeleton: [select("shape", ["text", "rounded", "circle"], "text"), toggle("animate", true)],
  avatar: [select("size", ["2xs", "xs", "sm", "md", "lg"], "md"), select("shape", ["circle", "rounded"], "circle"), select("image", ["loaded", "missing", "broken"], "loaded"), select("presence", ["none", "online", "away", "busy", "offline"], "none"), toggle("decorative")],
  tabs: [select("variant", ["contained", "line"], "contained"), select("activationMode", ["automatic", "manual"], "automatic"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), {...toggle("overflowControls"),label:"Overflow arrows"}, toggle("showCounts"), {...toggle("narrow"),label:"Narrow width"}, toggle("disabled"), toggle("disableLast")],
  breadcrumb: [select("layout",["wrap","compact"],"wrap"),select("separator", ["/", "›"], "/"),select("maxVisibleItems",["2","3","4"],"2"),toggle("deepPath"),toggle("longTitle"),toggle("currentLink"),{...toggle("narrow"),label:"Narrow panel"}],
  pagination: [select("presentation", ["numbered", "compact", "arrows"], "numbered"), select("pageCount", ["1", "5", "20", "100"], "20"), select("siblingCount", ["0", "1", "2"], "1"), select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("links"), toggle("disabled"), {...toggle("narrow"),label:"Narrow panel"}, {...toggle("localizedNumbers"),label:"Localized digits"}],
  "response-variants": [{...toggle("single"),label:"Single version"},{...toggle("rtl"),label:"Right to left"},{...toggle("narrow"),label:"Narrow width"}],
  "priority-indicator": [select("presentation",["label","chip","icon"],"label"),select("size",["sm","md","lg"],"sm")],
  "record-navigator": [select("presentation",["compact","labeled"],"compact"),{...toggle("rtl"),label:"Right to left"},{...toggle("narrow"),label:"Narrow width"}],
  "card-deck": [toggle("loop"),{...toggle("rtl"),label:"Right to left"},{...toggle("narrow"),label:"Narrow width"}],
  "cursor-pagination": [select("variant", ["subtle","ghost"], "subtle"), select("controlSize", ["sm", "md", "lg", "xl"], "sm"), select("request", ["idle","previous","next"], "idle"), {...toggle("showPosition", true), label:"Show range"}, toggle("rtl")],
  tooltip: [select("side", ["top", "bottom", "left", "right"], "top"), select("align", ["start", "center", "end"], "center"), select("delay", ["0", "150", "300", "600"], "300"), toggle("disabled")],
  popover: [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("defaultOpen"), toggle("disabled")],
  "help-tip": [select("side", ["top", "bottom", "left", "right"], "top"), toggle("disabled")],
  "alert-dialog": [toggle("defaultOpen"), toggle("confirmDisabled"), toggle("disabled")],
  drawer: [select("side", ["start", "end", "top", "bottom"], "end"), select("size", ["sm", "md", "lg"], "md"), toggle("showFooter", true), toggle("longContent"), toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  sheet: [select("size", ["sm", "md", "lg"], "md"), toggle("showFooter"), toggle("longContent"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  dialog: [toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  collapsible: [select("variant", ["framed", "flush"], "framed"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), {...toggle("fitTrigger"),label:"Fit trigger"}, toggle("defaultOpen"), toggle("disabled")],
  accordion: [select("variant", ["framed", "flush"], "framed"), select("expansionMode", ["single", "multiple"], "single"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("headingLevel", ["2", "3", "4", "5", "6"], "3"), toggle("disabled"), toggle("disableLast")],
  "segmented-control": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("content", ["text", "counts", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("fullWidth"), toggle("disabled"), toggle("disableLast")],
  toggle: [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("defaultPressed"), toggle("iconOnly"), toggle("disabled"), toggle("loading")],
  "toggle-group": [select("selectionMode", ["single", "multiple"], "multiple"), select("content", ["text", "icons", "mixed"], "mixed"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("disableLast")],
  "scroll-area": [select("orientation", ["vertical", "horizontal", "both"], "vertical"), select("contentInset", ["scrollbar", "none"], "scrollbar")],
  "button-group": [select("content", ["text", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled")],
  "split-button": [select("variant", ["solid", "subtle", "outline"], "solid"), select("size", sizes, "md"), toggle("disabled"), toggle("primaryDisabled"), {...toggle("empty"),label:"No alternatives"}],
  "save-to-collection": [select("size",["sm","md","lg"],"sm"),toggle("pending"),toggle("disabled"),toggle("empty")],
  "input-group": [select("start", ["https://", "+7", "@", "$", "icon", "action", "none"], "https://"), select("end", ["action", "icon-action", "kg", "USD", "%", "@company.com", "none"], "action"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  button: [select("tone", ["default", "danger"], "default"), select("variant", variants, "solid"), select("size", sizes, "md"), toggle("disabled"), {...select("loadingMode",["idle","loading","retain-focus"],"idle"),label:"Loading"}],
  "icon-button": [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  "icon-link": [select("variant", variants, "subtle"), select("size", sizes, "md")],
  input: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  select: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled")],
  textarea: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), {...toggle("autoGrow"),label:"Auto grow"}, statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  checkbox: [toggle("indeterminate"), toggle("checked", true), toggle("hideLabel"), toggle("disabled")],
  radio: [toggle("checked", true), toggle("disabled")],
  switch: [select("layout", ["inline", "row"], "inline"), toggle("checked", true), toggle("disabled"), toggle("readOnly"), toggle("description")],
  "switch-group": [select("density", ["compact", "comfortable"], "comfortable"), toggle("dividers"), toggle("description",true), toggle("disabled"), {...toggle("narrow"),label:"Narrow panel"}],
  "setting-row": [select("layout",["adaptive","inline","stacked"],"adaptive"), select("valueOverflow",["wrap","truncate"],"wrap"), toggle("description", true), {...toggle("showAction", true), label:"Show action"}, {...toggle("showValue"),label:"Show value"}, {...toggle("longValue"),label:"Long value"}, {...toggle("constrainWidth"), label:"Narrow width"}],
  "setting-group": [select("layout",["adaptive","aligned"],"adaptive"), select("density",["compact","comfortable"],"comfortable"), toggle("dividers"), {...toggle("constrainWidth"),label:"Narrow width"}],
  text: [select("size", ["lead", "body", "compact", "label", "helper"], "body"), select("tone", ["default", "subtle", "error", "success", "warning", "info"], "default"), {...toggle("multiline"),label:"Multiline example"},{...toggle("pretty"),label:"Pretty wrapping"}],
  "expandable-text": [select("lines", ["2", "3", "4"], "3"), select("size", ["body", "compact"], "body"), {...toggle("constrainWidth"),label:"Narrow width"}, {...toggle("shortText"),label:"Short text"}],
  "truncated-text": [select("tooltipSide", ["bottom","top","left","right"], "bottom"), {...toggle("constrainWidth",true),label:"Narrow width"}, {...toggle("shortText"),label:"Short text"},{...toggle("preserveEnd"),label:"Keep ending"}],
  timestamp: [select("format", ["date", "time", "date-time"], "date-time"), select("locale", ["en", "en-GB", "ru-RU"], "en"), select("timeZone", ["UTC", "America/New_York"], "UTC"), select("size", ["helper", "compact"], "helper"), {...toggle("relativeTo"), label:"Relative time"}, {...toggle("showExactTime"),label:"Show exact time"}],
  duration: [select("unit",["millisecond","second","minute","hour"],"millisecond"),select("precision",["0","2","3","6"],"3"),select("locale",["en","fr-FR"],"en"),select("surface",["canvas","raised","overlay"],"raised"),{...toggle("narrow"),label:"Narrow width"}],
  "numeric-value": [select("value",["99","999","1000","-1000","100000"],"999"),select("locale",["en","fr-FR","ar-EG"],"en"),select("align",["start","end"],"end"),{...toggle("reserve",true),label:"Reserve width"},select("surface",["default","raised","overlay"],"raised")],
  "timestamp-link": [select("surface", ["canvas", "raised", "overlay"], "raised"), {...toggle("relativeTo"),label:"Relative time"}],
  "highlight-text": [select("query", ["export","Export","[PDF]","none"], "export"),toggle("caseSensitive"),select("surface",["canvas","raised","overlay"],"raised")],
  heading: [select("size", ["display", "large", "page", "section", "group"], "page"), select("level", ["1", "2", "3", "4", "5", "6"], "2"), {...toggle("multiline"),label:"Multiline example"},{...toggle("balance"),label:"Balance lines"}],
  stack: [select("gap", spaces, "4")],
  inline: [select("gap", spaces, "4"), select("align", ["start", "center", "end", "baseline"], "center")],
  surface: [select("elevation", ["default", "raised", "overlay"], "default"), select("padding", spaces, "6")],
  "icon-slot": [select("size", sizes, "md"), { name: "label", initial: "" }],
  "icon-swap": [select("size",["xs","sm","md","lg"],"sm"),toggle("checked"),{...toggle("reduceMotion"),label:"Reduced motion"}],
  "code-snippet": [select("codeDirection", ["ltr", "rtl", "auto"], "ltr"), { name: "code", initial: `npx @flood-md/cli@${release.version} init` }, toggle("showPrompt", true), toggle("copyAction", true)],
  label: [toggle("required")],
  "message-composer": [select("layout", ["stacked", "compact"], "stacked"), {...toggle("replyContext"), label:"Reply context"}, toggle("allowAttachments", true), {...select("maxVisibleAttachments", ["all", "2", "3"], "2"), label:"Visible files"}, toggle("disabled")],
  "radio-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled"), toggle("required")],
  "checkbox-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled")],
  fieldset: [select("legendSize", ["label", "section"], "label"), select("layout", ["stacked", "aligned"], "stacked"), statusKnob(), toggle("disabled"), toggle("hint", true), toggle("showHelp"), {...toggle("constrainWidth"), label:"Narrow width"}],
  field: [select("layout",["stacked","adaptive"],"stacked"),statusKnob(), toggle("required", true), toggle("error", true), toggle("hint", true), toggle("showHelp")],
  "form-actions": [select("layout", ["auto", "status-below", "stacked"], "auto"), select("align", ["start", "end"], "end"), toggle("showSecondary",true), toggle("showStatus",true), {...toggle("constrainWidth"),label:"Narrow width"}],
  "save-status": [select("state", ["idle","dirty","saving","saved","error"], "saved"), toggle("announce",true)],
  "save-bar": [select("placement",["viewport","inline"],"viewport"),{...toggle("failSave"),label:"Fail save"},
    {...toggle("holdSave"),label:"Hold save"},{...toggle("narrow"),label:"Narrow width"}],
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
      : ["key-value-row","key-value-editor"].includes(component.slug) && knob.name === "showEnabled" ? knob.initial
      : prop?.defaultLiteral;
    const initial = value === undefined ? knob.initial : typeof knob.initial === "boolean" ? (typeof value === "boolean" ? value : knob.initial) : String(value);
    return { ...knob, options, initial };
  });
}
const initialValues = (component: ComponentPage): Values => Object.fromEntries(componentKnobs(component).map(knob => [knob.name, knob.initial]));
const registry = { ...Flood, Plus, ArrowRight, Copy, Undo2, Redo2, History, Bold, Italic, Underline, Share2 } as unknown as Record<string, Parameters<typeof createElement>[0]>;
const isBinding = (value: unknown): value is Binding => Boolean(value && typeof value === "object" && "expression" in value && "value" in value);

function fileImagePreview(name: string, src: string) {
  const preview = (trigger: Binding) => element("ImagePreview",{title:name,src,alt:name,zoomable:true,trigger});
  return binding(`trigger => (${printRecipe(preview(binding("trigger",null)),new Set(),new Set())})`,
    (trigger: Flood.DialogProps["trigger"]) => renderRecipe(preview(binding("trigger",trigger))));
}

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
  expenseLines: readonly Flood.ExpenseAllocationLine[];
  setExpenseAmount: (id: string, amount: string | null) => void;
  relationDraft: Flood.RecordRelationDraft;
  setRelationDraft: (value: Flood.RecordRelationDraft) => void;
  replicaCounts: Record<string, number>;
  setReplicaCount: (id: string, count: number) => void;
  outlineScroll: { current: HTMLDivElement | null };
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
  inbox: {filter: Flood.NotificationInboxFilter; setFilter: (filter: Flood.NotificationInboxFilter) => void; unread: Readonly<Record<string, boolean>>; set: (id: string, unread: boolean) => void; markAll: () => void; retry: () => void};
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
  approvalDraft: Flood.ApprovalRequestDraft;
  setApprovalDraft: (draft: Flood.ApprovalRequestDraft) => void;
  approvalOutcome: string;
  setApprovalOutcome: (outcome: string) => void;
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
  typedCondition: Flood.TypedFilterConditionValue;
  setTypedCondition: (value: Flood.TypedFilterConditionValue) => void;
  typedFilterGroup: Flood.TypedFilterGroupValue;
  setTypedFilterGroup: (value: Flood.TypedFilterGroupValue) => void;
  transcriptTime: number;
  setTranscriptTime: (time: number) => void;
  traceZoomId: string | null;
  setTraceZoom: (id: string | null) => void;
  gradient: Flood.GradientValue;
  setGradient: (value: Flood.GradientValue) => void;
  relativeRange: Flood.RelativeTimeRangeValue;
  setRelativeRange: (value: Flood.RelativeTimeRangeValue) => void;
  recurrence: Flood.RecurrenceValue;
  setRecurrence: (value: Flood.RecurrenceValue) => void;
  handleDraft: {hosted: string; custom: string};
  setHandleDraft: (update: (current: {hosted: string; custom: string}) => {hosted: string; custom: string}) => void;
  cronExpression: string;
  setCronExpression: (value: string) => void;
  quietHours: Flood.QuietHoursValue;
  setQuietHours: (value: Flood.QuietHoursValue) => void;
  muteDraft: Flood.MutedWordDraft;
  setMuteDraft: (value: Flood.MutedWordDraft) => void;
  inviteDraft: Flood.AccessInviteDraft;
  setInviteDraft: (value: Flood.AccessInviteDraft) => void;
  requestMessage: string;
  setRequestMessage: (value: string) => void;
  spendLimits: Flood.SpendLimitDraft;
  setSpendLimits: (value: Flood.SpendLimitDraft) => void;
  reportDraft: Flood.ContentReportDraft;
  setReportDraft: (draft: Flood.ContentReportDraft) => void;
  environmentDraft: Flood.EnvironmentCreationDraft;
  setEnvironmentDraft: (draft: Flood.EnvironmentCreationDraft) => void;
  webhookDraft: Flood.DatabaseWebhookDraft;
  setWebhookDraft: (draft: Flood.DatabaseWebhookDraft) => void;
  logExportDraft: Flood.LogExportDraft;
  setLogExportDraft: (draft: Flood.LogExportDraft) => void;
  restartPolicy: Flood.RestartPolicyDraft;
  setRestartPolicy: (draft: Flood.RestartPolicyDraft) => void;
  sharing: {effective:string;draft:string;error?:string};
  setSharing: (value: PreviewActions["sharing"]) => void;
  templateId: string;
  setTemplateId: (id: string) => void;
  paymentMethod: string;
  setPaymentMethod: (id: string) => void;
  quantity: Flood.UnitNumberValue;
  setQuantity: (value: Flood.UnitNumberValue) => void;
  gridRows: readonly Flood.EditableGridRow[];
  setGridChanges: (changes: readonly Flood.EditableGridChange[]) => void;
  reorderItems: readonly Flood.ReorderListItem[];
  boardColumns: readonly Flood.KanbanColumn[];
  moveBoardCard: (move: Flood.KanbanMove) => void;
  boardCardId: string | null;
  setBoardCardId: (id: string | null) => void;
  moveReorderItem: (move: Flood.ReorderMove) => void;
  pairs: Flood.KeyValueEntry[];
  setPairs: (value: Flood.KeyValueEntry[]) => void;
  findState: typeof initialFindState;
  setFindState: (value: typeof initialFindState) => void;
  treeLayer: typeof initialTreeLayer;
  setTreeLayer: (value: typeof initialTreeLayer) => void;
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
  focusRecordHeading: (heading: HTMLElement | null) => void;
  selectRecordPage: (page: number) => void;
  subscriptionMode: Flood.NotificationSubscriptionMode;
  setSubscriptionMode: (mode: Flood.NotificationSubscriptionMode) => void;
  replyAudience: string;
  estimate: Flood.EstimateChoice | null;
  setEstimate: (value: Flood.EstimateChoice | null) => void;
  setReplyAudience: (value: string) => void;
  savedProjectName: string;
  setSavedProjectName: (name: string) => void;
  savedReference: boolean;
  setSavedReference: (saved: boolean) => void;
  referenceCollections: Record<string, boolean>;
  setReferenceCollection: (id: string, selected: boolean) => void;
  checked: (value: boolean) => void;
  visible: (value: boolean) => void;
  copy: () => void;
  page: number;
  setPage: (page: number) => void;
}

const initialPairs: Flood.KeyValueEntry[] = [{id:"accept",key:"Accept",value:"application/json",enabled:true}];
const initialTreeLayer = {hidden:false,locked:false};
const previewQuerySuggestions: Flood.TextSuggestionItem[] = [
  {id:"status-open",label:"Open requests",description:"status:open",insertText:"status:open"},
  {id:"status-resolved",label:"Resolved requests",description:"status:resolved",insertText:"status:resolved"},
  {id:"status-negated",label:"Exclude resolved",description:"-status:resolved",insertText:"-status:resolved"},
];
const previewQueryFragment = /(?:^|\s)(-?st[\w:-]*)$/u;
const resolvePreviewQuery: NonNullable<Flood.QueryInputProps["resolveSuggestions"]> = ({value,caret}) => {
  const fragment = value.slice(0,caret).match(previewQueryFragment)?.[1];
  if (!fragment) return;
  const end = caret + (value.slice(caret).match(/^[\w:-]*/u)?.[0].length ?? 0);
  const items = previewQuerySuggestions.filter(item=>item.insertText.startsWith(fragment));
  return {label:"Request status",start:caret-fragment.length,end,items};
};
const findRegexSpecials = "\\^$.*+?()[]{}|";
const initialFindState = {
  source:"The Project brief opens after project setup. Review the project before sharing.",
  query:"project", active:1, replacement:"", caseSensitive:false, regex:false,
};
function findPreviewMatches(findState: typeof initialFindState) {
  const {query,source,caseSensitive,regex} = findState;
  let matches: RegExpMatchArray[] = [], queryError: string | undefined;
  try {
    const pattern = regex ? query : Array.from(query, char => findRegexSpecials.includes(char) ? "\\" + char : char).join("");
    if (query) matches = Array.from(source.matchAll(new RegExp(pattern, caseSensitive ? "g" : "gi"))).filter(match => match[0].length > 0);
  } catch { queryError = "Enter a valid regular expression."; }
  return {matches,queryError};
}
const initialTypedCondition: Flood.TypedFilterConditionValue = {property:"budget",kind:"number",operator:"at-least",number:1000};
const initialTypedGroup: Flood.TypedFilterGroupValue = {
  match:"all",conditions:[{id:"budget",...initialTypedCondition},{id:"title",property:"title",kind:"text",operator:"contains",text:"Design"}],
};
const typedFilterProperties = [
  {id:"budget",kind:"number",label:"Budget"},
  {id:"title",kind:"text",label:"Title"},
  {id:"updated",kind:"date",label:"Updated"},
] satisfies Flood.TypedFilterConditionProperty[];
const initialRelativeRange: Flood.RelativeTimeRangeValue = {
  mode:"relative",relative:{amount:24,unit:"hour"},timeZone:"UTC",
  absolute:{start:{date:"2026-11-15",time:"12:00"},end:{date:"2026-11-16",time:"12:00"}},
};
const initialQuantity: Flood.UnitNumberValue = {amount:500,unit:"g"};
const initialGradient:Flood.GradientValue = {kind:"linear",angle:90,stops:[
  {id:"start",position:0,color:"#ff47a8"},
  {id:"mid",position:55,color:"#8956eecc"},
  {id:"end",position:100,color:"#477aff30"},
]};
const initialRecurrence: Flood.RecurrenceValue = {
  frequency:"week",interval:2,weekdays:["mon","wed"],ending:"never",untilDate:"2026-11-21",occurrences:3,
};
const initialQuietHours: Flood.QuietHoursValue = {
  enabled:true,weekdays:["sun","mon","tue","wed","thu"],start:"22:00",end:"07:00",
};
const initialMuteDraft: Flood.MutedWordDraft = {
  term:"",scope:"text-and-tags",duration:"indefinite",excludeFollowing:false,
};
const initialReportDraft: Flood.ContentReportDraft = {reasonId:"",details:""};
const initialWebhookDraft: Flood.DatabaseWebhookDraft = {name:"Export updates",tableId:"exports",events:["update"],endpoint:"https://events.example/exports"};
const initialLogExportDraft: Flood.LogExportDraft = {format:"csv",rowLimit:500,lookbackSeconds:3600};
const initialRestartPolicy: Flood.RestartPolicyDraft = {mode:"on-failure",maxRestarts:5};
const initialSharing: PreviewActions["sharing"] = {effective:"restricted",draft:"restricted"};
const initialRelationDraft: Flood.RecordRelationDraft = {kindId:"blocked-by",targetId:""};
const initialExpenseLines: readonly Flood.ExpenseAllocationLine[] = [
  {id:"operations",label:"Operations",amount:"60.15"},
  {id:"growth",label:"Growth",amount:"39.85"},
];
const initialReplicaCounts: Record<string,number> = {fra:2,iad:1,sin:0};
const timeZoneExamples: readonly Flood.TimeZoneOption[] = [
  {value:"UTC"},{value:"America/New_York",aliases:["Eastern"]},{value:"Europe/Berlin"},
  {value:"Asia/Kolkata",aliases:["India"]},{value:"Asia/Tokyo"},
];
const initialGridRows: readonly Flood.EditableGridRow[] = [
  {id:"notebook",label:"Notebook",values:{product:"Notebook",stock:"36",reserved:"4"}},
  {id:"pencils",label:"Pencils",values:{product:"Pencils",stock:"124",reserved:"32"}},
  {id:"folders",label:"Folders",values:{product:"Folders",stock:"19",reserved:"7"}},
  {id:"labels",label:"Label rolls",values:{product:"Label rolls",stock:"68",reserved:"12"}},
];
const initialBoardColumns: readonly Flood.KanbanColumn[] = [
  {id:"queue",label:"Backlog",cards:[
    {id:"reports",title:"Usage reports",description:"Export weekly metrics as CSV.",metadata:"Release 14 · Maya Chen"},
    {id:"filters",title:"Saved filters",description:"Keep personal filters across visits.",metadata:"Release 14 · Sam Rivera"},
  ]},
  {id:"progress",label:"In progress",cards:[
    {id:"calendar",title:"Calendar shortcut",description:"Jump to today from the calendar header.",metadata:"Release 14 · Noah Park"},
  ]},
  {id:"done",label:"Done",cards:[]},
];
const projectBoardIcons = {Archive, BookOpen, CreditCard, Globe, Package, ShieldCheck};
const projectBoardRecords: readonly (Omit<Flood.KanbanColumn, "cards"> & {
  cards: readonly (Omit<Flood.KanbanCardData, "icon"> & {icon?: keyof typeof projectBoardIcons})[];
})[] = [
  {id:"planned",label:"Planned",cards:[
    {id:"billing",title:"Self-serve billing",icon:"CreditCard",description:"Let workspace admins update payment methods and invoices.",
      assignee:{name:"Maya Chen"},dueDate:{label:"24 Nov",dateTime:"2026-11-24"},status:{label:"At risk",tone:"warning"}},
    {id:"help",title:"Help center migration",icon:"BookOpen",description:"Move help articles and preserve existing links.",
      assignee:{name:"Sam Rivera"},status:{label:"On track",tone:"success"}},
  ]},
  {id:"active",label:"In progress",cards:[
    {id:"checkout",title:"International checkout",icon:"Globe",description:"Support local currencies and address formats.",
      assignee:{name:"Noah Park"},dueDate:{label:"27 Nov",dateTime:"2026-11-27"},status:{label:"Blocked",tone:"error"}},
    {id:"access",title:"Workspace access review for external collaborators",icon:"ShieldCheck",description:"Review guest access with workspace owners.",
      assignee:{name:"Amelia Reed"},dueDate:{label:"2 Dec",dateTime:"2026-12-02"}},
  ]},
  {id:"delivered",label:"Delivered",cards:[
    {id:"exports",title:"Usage data export",icon:"Package",description:"Export usage reports with a stable column schema.",
      assignee:{name:"Liam Evans"},dueDate:{label:"18 Nov",dateTime:"2026-11-18"},status:{label:"On track",tone:"success"}},
    {id:"archive",title:"Archive older reports",icon:"Archive"},
  ]},
];
const initialBoardExamples: Record<"compact" | "project", readonly Flood.KanbanColumn[]> = {
  compact: initialBoardColumns,
  project: projectBoardRecords.map(column=>({...column,cards:column.cards.map(({icon,...card})=>({
    ...card, icon:icon && createElement(projectBoardIcons[icon]),
  }))})),
};
function applyBoardMove(columns: readonly Flood.KanbanColumn[], move: Flood.KanbanMove) {
  const card = columns.find(column=>column.id===move.fromColumnId)?.cards.find(item=>item.id===move.cardId);
  const destination = columns.find(column=>column.id===move.toColumnId);
  if (!card || !destination || (move.beforeCardId && !destination.cards.some(item=>item.id===move.beforeCardId))) return columns;
  return columns.map(column=>{
    if (column.id!==move.fromColumnId && column.id!==move.toColumnId) return column;
    const cards = column.cards.filter(item=>item.id!==move.cardId);
    if (column.id===move.toColumnId) {
      const index = cards.findIndex(item=>item.id===move.beforeCardId);
      cards.splice(index<0 ? cards.length : index,0,card);
    }
    return {...column,cards};
  });
}
const initialReorderItems: readonly Flood.ReorderListItem[] = [
  {id:"overview",label:"Overview"},
  {id:"features",label:"Features"},
  {id:"pricing",label:"Pricing"},
  {id:"archive",label:"Archive",canContain:true},
  {id:"draft",label:"First draft",parentId:"archive"},
];
function applyPreviewMove(items: readonly Flood.ReorderListItem[], move: Flood.ReorderMove) {
  const byId = new Map(items.map(item=>[item.id,item]));
  const source = byId.get(move.sourceId), target = byId.get(move.targetId);
  if (!source || !target) return items;
  const within = (id:string, ancestorId:string) => {
    for (let parent=byId.get(id)?.parentId;parent;parent=byId.get(parent)?.parentId) if (parent===ancestorId) return true;
    return false;
  };
  const isMoving = (item: Flood.ReorderListItem) => item.id===source.id || within(item.id,source.id);
  const moved = items.filter(isMoving);
  const remaining = items.filter(item=>!isMoving(item));
  const parentId = move.placement==="inside" ? target.id : target.parentId;
  let insertion = remaining.findIndex(item=>item.id===target.id);
  if (move.placement!=="before") {
    insertion++;
    while (remaining[insertion] && within(remaining[insertion].id,target.id)) insertion++;
  }
  moved[0]={...source,parentId};
  return [...remaining.slice(0,insertion),...moved,...remaining.slice(insertion)];
}
const validateGridQuantity = (value:string) => /^\d+$/.test(value) ? undefined : "Enter a whole number of units.";
const gridPreviewColumns: readonly Flood.EditableGridColumn[] = [
  {id:"product",label:"Product",readOnly:true},
  {id:"stock",label:"In stock",align:"end",inputMode:"numeric",validate:validateGridQuantity},
  {id:"reserved",label:"Reserved",align:"end",inputMode:"numeric",validate:validateGridQuantity},
];
function applyGridPreviewChanges(rows: readonly Flood.EditableGridRow[], changes: readonly Flood.EditableGridChange[]) {
  return rows.map(row=>{
    const edits = changes.filter(change=>change.rowId===row.id);
    return edits.length ? {...row,values:{...row.values,...Object.fromEntries(edits.map(change=>[change.columnId,change.value]))}} : row;
  });
}

const estimateOptions = (scale: unknown): Flood.EstimateChoice[] => scale === "Points"
  ? [{id:"0",label:"0 points",shortLabel:"0"},{id:"1",label:"1 point",shortLabel:"1"},
    {id:"3",label:"3 points",shortLabel:"3"},{id:"5",label:"5 points",shortLabel:"5"}]
  : [{id:"s",label:"Small",shortLabel:"S"},{id:"m",label:"Medium",shortLabel:"M"},{id:"l",label:"Large",shortLabel:"L"}];

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
    case "cidr-field": {
      const read = 'status ? JSON.parse(status) : {draft:"",ranges:[]}';
      const state = actions.status ? JSON.parse(actions.status) as {draft:string;ranges:string[];error?:string} : {draft:"",ranges:[]};
      const entries = state.ranges.map((cidr):Flood.NetworkAllowlistEntry=>({
        id:cidr,cidr,family:cidr.includes(":")?"IPv6":"IPv4",
      }));
      const family = v.familyMode==="IPv4"||v.familyMode==="IPv6" ? v.familyMode : undefined;
      const submit = (event:FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const cidr = new FormData(event.currentTarget).get("cidr");
        if (typeof cidr !== "string" || !cidr) return;
        if (state.ranges.includes(cidr)) {
          actions.setStatus(JSON.stringify({...state,error:"This range is already in the list."}));
        } else {
          actions.setStatus(JSON.stringify({draft:"",ranges:[...state.ranges,cidr]}));
        }
        (event.currentTarget.elements.namedItem("cidr") as HTMLInputElement | null)?.focus();
      };
      return element("Surface",{padding:"4",elevation:"raised",dir:v.rtl?"rtl":"ltr",style:{inlineSize:"27rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("form",{onSubmit:binding(`event => {
            event.preventDefault();
            const cidr = new FormData(event.currentTarget).get("cidr");
            if (typeof cidr !== "string" || !cidr) return;
            const ranges = (${read}).ranges;
            setStatus(JSON.stringify(ranges.includes(cidr)
              ? {draft:cidr,ranges,error:"This range is already in the list."}
              : {draft:"",ranges:[...ranges,cidr]}));
            (event.currentTarget.elements.namedItem("cidr") as HTMLInputElement | null)?.focus();
          }`,submit)},element("Stack",{gap:"3"},
            element("CidrField",{label:"IP range",name:"cidr",family,required:true,disabled:v.disabled,
              placeholder:family==="IPv6"?"2001:db8::/32":"203.0.113.0/24",
              value:binding(`(${read}).draft`,state.draft),error:binding(`(${read}).error`,state.error),
              onValueChange:binding(`draft => setStatus(JSON.stringify({draft,ranges:(${read}).ranges}))`,
                (draft:string)=>actions.setStatus(JSON.stringify({draft,ranges:state.ranges})))}),
            element("Inline",{style:{justifyContent:"flex-end"}},
              element("Button",{type:"submit",size:"sm",disabled:v.disabled},"Add range")))),
          element("NetworkAllowlist",{title:"Draft access rules",
            access:binding(`{mode:"allowlist",entries:(${read}).ranges.map((cidr:string) => ({id:cidr,cidr,family:cidr.includes(":")?"IPv6":"IPv4"}))}`,
              {mode:"allowlist",entries})})));
    }
    case "network-allowlist": {
      const access: Flood.NetworkAccess = v.scenario === "All networks" ? {mode:"unrestricted"}
        : v.scenario === "No networks" ? {mode:"blocked"}
        : {mode:"allowlist",entries:v.scenario === "Empty allowlist" ? [] : [
            {id:"office",label:"Studio VPN",family:"IPv4",cidr:"203.0.113.24/29"},
            {id:"pipeline",label:"Build runners",family:"IPv6",cidr:"2001:db8:abcd:1234:5678:90ab:cdef:0/112"},
            {id:"recovery",label:"Recovery workstation",family:"IPv4",cidr:"198.51.100.42/32"},
          ]};
      return element("Surface",{padding:"4",elevation:v.surface,dir:v.rtl?"rtl":"ltr",
        style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("NetworkAllowlist",{title:"Database connections",access}));
    }
    case "restriction-summary": {
      const groups: Flood.RestrictionGroup[] = v.scenario === "unrestricted"
        ? [{id:"merchants",label:"Merchants",mode:"unrestricted"}]
        : v.scenario === "category allowlist"
          ? [{id:"categories",label:"Categories",mode:"allow-list",entries:[
              {id:"cloud",label:"Cloud infrastructure"}, {id:"software",label:"Software and subscriptions"},
              {id:"hosting",label:"Hosting and data services"},
            ]}]
          : [
              {id:"card",label:"Merchants",source:"This card",mode:"allow-list",entries:[
                {id:"github",label:"GitHub"}, {id:"linear",label:"Linear"}, {id:"railway",label:"Railway"},
              ]},
              {id:"company",label:"Merchants",source:"Company policy",mode:"block-list",entries:[
                {id:"bright",label:"BrightDesk"}, {id:"parcel",label:"ParcelPoint"},
              ]},
            ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:"Engineering card",headingSize:"group"},
          element("RestrictionSummary",{label:"Spending restrictions",groups})));
    }
    case "record-merge-review": return element("Surface", {padding:"4",style:{width:"28rem",maxWidth:"100%"}},
      element("Stack",{gap:"4"},
        element("Heading",{level:2,size:"section"},"Merge duplicate issue"),
        element("RecordMergeReview",{
          source:{id:"source",title:v.longTitles?"Invoice search resets after refresh while viewing archived results":"Invoice search resets after refresh",reference:"SUP-238"},
          destination:{id:"target",title:"Invoice search drops the active query",reference:"ENG-814"},
          consequence:"Comments and attachments move to ENG-814.",
          labels:{merge:"Merge issue"},
          pending:v.scenario==="Pending",
          error:v.scenario==="Failed"?"Couldn’t merge. Try again.":undefined,
          onMerge:binding('() => setStatus("Merged into ENG-814")',()=>actions.setStatus("Merged into ENG-814")),
          onCancel:binding('() => setStatus("Merge canceled")',()=>actions.setStatus("Merge canceled")),
        })),status);
    case "scheduled-task-list": {
      const paused = actions.status==="paused";
      const tasks: Flood.ScheduledTaskRecord[] = v.scenario==="No tasks"?[]:[
        {id:"digest",label:"Weekly release digest",state:"active",
          trigger:{kind:"schedule",label:"Mondays at 09:00 UTC",nextRun:{dateTime:"2026-11-23T09:00:00Z",children:"Nov 23, 09:00 UTC"}}},
        {id:"builds",label:"Summarize failed builds",state:"active",trigger:{kind:"event",label:"When a build fails"}},
        {id:"report",label:"Export the November report",state:"completed",trigger:{kind:"schedule",label:"One time · Nov 16"}},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{width:"34rem",maxWidth:"100%"}},
        element("Stack",{gap:"3"},element("Heading",{level:2,size:"group"},"Scheduled tasks"),
          element("ScheduledTaskList",{
            label:"Scheduled tasks",
            tasks:binding(
              `(${JSON.stringify(tasks)} as import("react").ComponentProps<typeof ScheduledTaskList>["tasks"]).map(task => paused && task.id === "digest" ? {...task, state: "paused"} : task)`,
              tasks.map(task => paused&&task.id==="digest"?{...task,state:"paused"}:task),
            ),
            renderAction:v.showAction?binding(
              'task => task.id === "digest" ? <Button size="sm" variant="ghost" onClick={() => setPaused(task.state === "active")}>{task.state === "active" ? "Pause" : "Resume"}</Button> : null',
              (task:Flood.ScheduledTaskRecord)=>task.id==="digest"?<Flood.Button size="sm" variant="ghost"
                onClick={()=>actions.setStatus(task.state==="active"?"paused":"")}>{task.state==="active"?"Pause":"Resume"}</Flood.Button>:null,
            ):undefined,
          })));
    }
    case "scheduled-run-history": {
      const runs: Flood.ScheduledRunRecord[] = v.scenario === "Empty" ? [] : [
        {id:"run-42",status:"running",trigger:"manual",startedAt:"2026-11-17T09:12:00Z",durationMs:26000},
        {id:"slot-09",status:"skipped",scheduledFor:"2026-11-17T09:00:00Z",detail:"The previous run was still active."},
        {id:"run-41",status:"failed",trigger:"schedule",startedAt:"2026-11-17T08:00:00Z",durationMs:3658000,detail:"The export connection timed out."},
        {id:"run-40",status:"succeeded",trigger:"schedule",startedAt:"2026-11-17T07:00:00Z",durationMs:42000},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"34rem",maxInlineSize:"100%"}},
        element("Section",{title:"Export runs",headingSize:"group"},
          element("ScheduledRunHistory",{label:"Export runs",runs,timeZone:v.timeZone})));
    }
    case "evidence-checklist": {
      const received = v.scenario==="Under review";
      const complete = v.scenario==="Complete";
      const requested = actions.status==="requested";
      const requirements: Flood.EvidenceRequirement[] = v.scenario==="No requirements"?[]:[
        {id:"receipt",label:"Itemized receipt",state:complete?"accepted":received?"received":"missing",
          detail:complete||received?"Northstar Print · invoice 0842":"Include the vendor, date and line items."},
        {id:"purpose",label:"Business purpose",state:"accepted",detail:"Printed samples for the spring catalog."},
        {id:"quote",label:"Second quote",state:complete?"waived":"requested"},
      ];
      return element("Surface",{padding:"4",elevation:v.elevation,style:{width:"34rem",maxWidth:"100%"}},
        element("Stack",{gap:"3"},
          element("Heading",{level:2,size:"group"},"Expense evidence"),
          element("EvidenceChecklist",{
            label:"Expense evidence",
            requirements:binding(
              `(${JSON.stringify(requirements)} as import("react").ComponentProps<typeof EvidenceChecklist>["requirements"]).map(item => requested && item.state === "missing" ? {...item, state: "requested"} : item)`,
              requirements.map(item=>requested&&item.state==="missing"?{...item,state:"requested"}:item),
            ),
            renderAction:v.showAction?binding(
              'item => item.id === "receipt" && (item.state === "missing" || item.state === "requested") ? <Button size="sm" variant="ghost" onClick={() => setRequested(item.state === "missing")}>{item.state === "missing" ? "Request receipt" : "Cancel request"}</Button> : null',
              (item:Flood.EvidenceRequirement)=>item.id==="receipt"&&(item.state==="missing"||item.state==="requested")
                ?<Flood.Button size="sm" variant="ghost" onClick={()=>actions.setStatus(item.state==="missing"?"requested":"")}>
                  {item.state==="missing"?"Request receipt":"Cancel request"}
                </Flood.Button>:null,
            ):undefined,
          })));
    }
    case "receipt-match-review": {
      const verified = v.scenario === "Verified";
      const missing = v.scenario === "Missing evidence";
      const fields: Flood.ReceiptMatchField[] = [
        {id:"amount",label:"Amount",receipt:missing?undefined:"$128.40",transaction:verified?"$128.40":"$182.40",differs:!verified&&!missing},
        {id:"merchant",label:"Merchant",receipt:missing?undefined:"Northstar Print",transaction:"Northstar Print"},
        {id:"date",label:"Date",receipt:"Nov 14, 2026",transaction:"Nov 14, 2026"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"31rem",maxInlineSize:"100%"}},
        element("ReceiptMatchReview",{title:"Receipt match",outcome:verified?"verified":missing?"unverified":"needs-review",fields}));
    }
    case "advisor-finding": {
      const access = v.scenario === "Access policy";
      const unused = v.scenario === "Unused index";
      const guide = `https://supabase.com/docs/guides/observability/advisors?lint=${access?"0007_policy_exists_rls_disabled":unused?"0005_unused_index":"0001_unindexed_foreign_keys"}`;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"30rem",maxInlineSize:"100%"}},
        element("AdvisorFinding",{
          key:`${v.scenario}:${v.defaultEvidenceOpen}`,
          title:access?"Row access policy is inactive":unused?"Index has no recorded scans":"Foreign key has no index",
          severity:access?"error":unused?"info":"warning",
          resource:access?"public.invoice_drafts":unused?"public.invoice_lines_created_at_idx":"public.invoice_lines",
          impact:access?"Drafts can be returned outside the intended account scope.":unused?"Writes maintain this index even though the scanner observed no reads using it.":"Deleting an invoice can scan invoice lines for references.",
          evidence:v.evidence?(access?"A policy exists for the table, but row-level security is disabled.":unused?"The index was not used during the last 14 days of recorded activity.":"The invoice_id foreign key has no supporting index."):undefined,
          rule:v.evidence?(access?"policy_with_rls_disabled":unused?"unused_index":"unindexed_foreign_key"):undefined,
          defaultEvidenceOpen:v.defaultEvidenceOpen,
          remediation:v.remediation?binding(
            `<Link href=${JSON.stringify(guide)}><Text size="compact">Remediation guide</Text></Link>`,
            <Flood.Link href={guide}><Flood.Text size="compact">Remediation guide</Flood.Text></Flood.Link>,
          ):undefined,
        }));
    }
    case "policy-evaluation": {
      const missing = v.scenario === "missing data";
      const fallback = v.scenario === "default route";
      const title = missing ? "Approval route unavailable" : fallback ? "Budget owner review required" : "Finance review required";
      const checks: Flood.PolicyCheck[] = [
        {id:"region",label:"Request is from the US entity",status:"matched",evidence:"Submitted by Studio US"},
        {id:"amount",label:"Amount is at least $5,000",status:missing?"unavailable":fallback?"unmatched":"matched",
          evidence:missing?"Amount was not provided":fallback?"Submitted amount is $2,200":"Submitted amount is $8,450"},
        {id:"budget",label:"Use the budget owner route",status:fallback?"matched":"skipped",
          evidence:fallback?"Request is below the finance review threshold":missing?"Waiting for the amount":"Finance route already matched"},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"30rem",maxInlineSize:"100%"}},
        element("PolicyEvaluation",{title,checks}));
    }
    case "approval-chain": {
      const financeState = v.scenario === "changes requested" ? "changes-requested" : v.scenario === "approved" ? "approved" : "pending";
      const stages: Flood.ApprovalChainStage[] = [
        {id:"owner",label:"Budget owner",status:"approved",reviewers:[{id:"maya",name:"Maya Chen"}]},
        {id:"finance",label:"Finance",status:financeState,reviewers:[
          {id:"sam",name:"Sam Rivera",detail:"Covering for Alex Morgan",status:financeState},
          {id:"leah",name:"Leah Brooks",status:"approved"},
        ],approvals:v.requirement ? {received:financeState === "approved" ? 2 : 1,required:2} : undefined,
          detail:financeState === "changes-requested" ? "Attach the itemized renewal quote." : undefined},
        {id:"procurement",label:"Procurement",status:v.scenario === "approved" ? "approved" : "queued"},
      ];
      const chain = element("ApprovalChain",{label:"Approval route",stages,density:v.density});
      if (v.inDrawer) return element("Drawer",{
        title:"Renew Northstar Analytics",
        trigger:binding('trigger => <Button {...trigger} variant="subtle">View approval route</Button>',
          (trigger:Flood.OverlayTriggerProps) => <Flood.Button {...trigger} variant="subtle">View approval route</Flood.Button>),
      },element("Section",{title:"Approval route",headingSize:"group"},chain));
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"28rem",maxInlineSize:"100%"}},
        element("Section",{title:"Approval route",headingSize:"group"},chain));
    }
    case "approval-request": {
      const options = [
        {id:"approve",label:"Approve",consequence:"Send the renewal to Finance for payment."},
        {id:"changes",label:"Request changes",consequence:"Return the request to its owner for edits.",note:{label:"What needs to change?",requiredMessage:"Describe the change you need."}},
        {id:"decline",label:"Decline",consequence:"Close the request.",note:{label:"Reason for declining",requiredMessage:"Give a reason for declining."}},
      ];
      const facts = [{id:"amount",term:"Amount",description:"$18,400"},{id:"owner",term:"Requested by",description:"Maya Chen"},{id:"date",term:"Renewal date",description:"Dec 1, 2026"}];
      const factsList = element("DescriptionList",{items:facts});
      const route: Flood.ApprovalChainStage[] = [
        {id:"owner",label:"Budget owner",status:"approved",reviewers:[{id:"maya",name:"Maya Chen"}]},
        {id:"finance",label:"Finance",status:"pending",reviewers:[{id:"sam",name:"Sam Rivera"}]},
      ];
      const financeStatus = actions.approvalOutcome
        ? actions.approvalDraft.decisionId === "approve" ? "approved" : actions.approvalDraft.decisionId === "changes" ? "changes-requested" : "rejected"
        : "pending";
      const evidence = v.showRoute ? element("Stack",{gap:"4"},factsList,
        element("Section",{title:"Approval route",headingSize:"group",style:{maxInlineSize:"28rem"}},
          element("ApprovalChain",{label:"Approval route",density:"compact",stages:binding(
            `[${JSON.stringify(route[0])}, {...${JSON.stringify(route[1])}, status: !outcome ? "pending" : draft.decisionId === "approve" ? "approved" : draft.decisionId === "changes" ? "changes-requested" : "rejected"}]`,
            [route[0], {...route[1], status:financeStatus}],
          )}))) : factsList;
      const preset: Flood.ApprovalRequestStatus | undefined = v.scenario==="submitting" ? {type:"submitting"}
        : v.scenario==="error" ? {type:"error",message:"The decision could not be recorded. Try again."}
        : undefined;
      const result: Flood.ApprovalRequestStatus | undefined = actions.approvalOutcome
        ? {type:"resolved",message:actions.approvalOutcome,tone:actions.approvalDraft.decisionId==="approve"?"success":"neutral"}
        : preset;
      const decision = ({decisionId}: Flood.ApprovalRequestDecision) => actions.setApprovalOutcome(
        decisionId==="approve" ? "Renewal sent to Finance." : decisionId==="changes" ? "Request returned to Maya." : "Renewal declined.",
      );
      return element("div",{style:{width:v.narrow?"22rem":"42rem",maxWidth:"100%"}},element("ApprovalRequest",{
        title:"Renew Northstar Analytics", description:"Annual subscription",
        options, evidence:binding(printRecipe(evidence,new Set(),new Set()),renderRecipe(evidence)),
        draft:binding("draft",actions.approvalDraft), onDraftChange:binding("setDraft",actions.setApprovalDraft),
        onDecision:binding('({decisionId}) => setOutcome(decisionId === "approve" ? "Renewal sent to Finance." : decisionId === "changes" ? "Request returned to Maya." : "Renewal declined.")',decision),
        status:binding(`outcome ? {type:"resolved",message:outcome,tone:draft.decisionId==="approve"?"success":"neutral"} : ${preset ? JSON.stringify(preset) : "undefined"}`,result),
      }));
    }
    case "profile-links": {
      const items = [
        {id:"website",label:"Website",href:"/"},
        {id:"guide",label:v.longLabel?"Design patterns and implementation guides":"Design guides",href:"/docs"},
        {id:"catalog",label:"Components",href:"/components"},
      ];
      const glyphs = [Globe,BookOpen,Package];
      const names = ["Globe","BookOpen","Package"];
      const links = binding(`[${items.map((item,index) => `{...(${JSON.stringify(item)}), icon: <${names[index]} />}`).join(", ")}]`,
        items.map((item,index) => ({...item,icon:createElement(glyphs[index])})));
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"15rem":"27rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("AuthorMeta",{name:"Flood Studio",metadata:"Open-source design system"}),
          element("ProfileLinks",{items:links,featuredId:v.featured?"website":undefined})));
    }
    case "link-preview": return element("div",{style:{inlineSize:"min(100%, 28rem)"}},element("LinkPreview",{
      href:"/components/line-chart",title:"Line charts in Flood",source:"flood.md",
      description:v.description?"Compare series and inspect exact values across a shared time axis.":undefined,
      thumbnailSrc:v.thumbnail?"/charts-share.png":undefined,
    }));
    case "visual-search-form": {
      const images: Record<string,Flood.VisualSearchImage> = {
        area:{id:"area",label:"Weekly area chart",thumbnailSrc:"/comparison-area.png"},
        line:{id:"line",label:"Weekly line chart",thumbnailSrc:"/comparison-line.png"},
      };
      const chosen = actions.viewValue === "all" ? "area" : actions.viewValue;
      const report = ({image,text}:Flood.VisualSearchQuery) => `Searching for ${[image?.label,text].filter(Boolean).join(" · ")}`;
      return element("Stack",{gap:"3",style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("Surface",{padding:"4",elevation:v.surface},
          element("VisualSearchForm",{
            label:"Find visual references",placeholder:"Add search terms…",
            value:binding("{text, image: images[view] ?? null}",{text:actions.toolbarSearch,image:images[chosen]??null}),
            onTextChange:binding("setText",actions.setToolbarSearch),
            onChooseImage:binding('() => setView(view === "area" ? "line" : "area")',()=>actions.setViewValue(chosen==="area"?"line":"area")),
            onRemoveImage:binding('() => setView("none")',()=>actions.setViewValue("none")),
            onSearch:binding('({image,text}) => setStatus("Searching for " + [image?.label,text].filter(Boolean).join(" · "))',
              (query:Flood.VisualSearchQuery)=>actions.setStatus(report(query))),
            pending:v.pending,disabled:v.disabled,
          })),status);
    }
    case "publication-preview":
      return element("Surface",{padding:"0",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"25rem",maxInlineSize:"100%"}},
        element("PublicationPreview",{
          publication:"Flood release notes",
          title:"What's new in charts",
          href:"/docs/charts",
          excerpt:"How to compare related series and inspect exact values.",
          subscription:v.scenario === "Link only" ? undefined : binding(
            `{subscribed: status === "subscribed", onSubscribedChange: value => setStatus(value ? "subscribed" : ""), pending: ${v.scenario === "Pending"}}`,
            {subscribed:actions.status==="subscribed",onSubscribedChange:(value:boolean)=>actions.setStatus(value?"subscribed":""),pending:v.scenario==="Pending"},
          ),
        }));
    case "environment-switcher": return element("div",{style:{width:v.narrow?"10rem":undefined,maxWidth:"100%"}},element("EnvironmentSwitcher",{
      label:"Environment",size:v.size,variant:v.variant,disabled:v.disabled,
      environments:[{id:"all",label:"Primary",scope:{label:"Production",tone:"warning"}},{id:"checkout",label:"Checkout rewrite",scope:{label:"Preview",tone:"info"}},{id:"sandbox",label:"Sandbox",scope:{label:"Development"}},{id:"legacy",label:"Legacy",disabled:true}],
      value:binding("environment",actions.viewValue),onValueChange:binding("setEnvironment",actions.setViewValue),
    }));
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
    case "filter-group": {
      const filters = v.mode === "typed" ? {
        mode:"typed",properties:typedFilterProperties,
        value:binding("typedFilters",actions.typedFilterGroup),onValueChange:binding("setTypedFilters",actions.setTypedFilterGroup),
      } : {
        properties:[{id:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"archived",label:"Archived"}]},{id:"owner",label:"Owner",options:[{value:"maya",label:"Maya"},{value:"noah",label:"Noah"}]},{id:"priority",label:"Priority",options:[{value:"urgent",label:"Urgent"},{value:"normal",label:"Normal"}]}],
        value:binding("filters",actions.filterGroup),onValueChange:binding("setFilters",actions.setFilterGroup),
      };
      return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},element("FilterGroup",{
      label:"Project conditions",controlSize:v.controlSize,disabled:v.disabled,hideLabel:v.hideLabel,
      allowDuplicateProperties:v.allowDuplicateProperties,maxConditions:v.maxConditions==="none"?undefined:Number(v.maxConditions),
      ...filters,
      }));
    }
    case "filter-condition": {
      const condition = v.mode === "typed" ? {
        mode:"typed",
        properties:typedFilterProperties,
        value:binding("typedCondition",actions.typedCondition),onValueChange:binding("setTypedCondition",actions.setTypedCondition),
      } : {
        properties:[{id:"status",label:"Status",options:[{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"archived",label:"Archived"}]},{id:"owner",label:"Owner",options:[{value:"maya",label:"Maya"},{value:"noah",label:"Noah"}]}],
        value:binding("condition",actions.filterValue),onValueChange:binding("setCondition",actions.setFilterValue),
      };
      return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},...(actions.status === "Condition removed" ? [] : [element("FilterCondition",{
      label:"Condition 1",controlSize:v.controlSize,disabled:v.disabled,hideLabel:v.hideLabel,
      ...condition,
      onRemove:v.removable?binding('() => setStatus("Condition removed")',()=>actions.setStatus("Condition removed")):undefined,
      })]),status);
    }
    case "bulk-action-bar": return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},element("BulkActionBar",{label:"Selected projects",selectionCount:actions.status==="Selection cleared"?0:Number(v.selectionCount),counter:v.counter,size:v.size,maxVisibleActions:Number(v.maxVisibleActions),morePresentation:v.morePresentation,pending:v.pending,disabled:v.disabled,items:[{id:"archive",label:"Archive",priority:10},{id:"pause",label:"Pause"},{id:"activate",label:"Set active"}],onAction:binding("(id) => setStatus(id)",(id:string)=>actions.setStatus(id)),onClear:binding('() => setStatus("Selection cleared")',()=>actions.setStatus("Selection cleared"))}),status);
    case "autocomplete": return element("div",{style:{width:"26rem",maxWidth:"100%"}},{tag:"Field",props:{label:"Team"},field:element("Autocomplete",{name:"team",controlSize:v.controlSize,loadState:v.loadState,required:v.required,readOnly:v.readOnly,disabled:v.disabled,options:[{value:"design",label:"Design",group:"Product"},{value:"engineering",label:"Engineering",group:"Product"},{value:"operations",label:"Operations",group:"Business"}]})});
    case "hold-to-confirm": return element("Stack",{gap:"4"},element("HoldToConfirm",{
      label:"Discard draft", title:"Discard this draft?", description:"Your unsaved edits will be removed.",
      confirmLabel:"Discard draft", holdMs:Number(v.holdMs), size:v.size, tone:v.tone, disabled:v.disabled,
      onConfirm:binding('() => setStatus("Draft discarded.")',()=>actions.setStatus("Draft discarded.")),
    }),status);
    case "swipe-actions": {
      const size = v.size as Flood.ControlSize;
      return element("Stack", {gap:"3", style:{width:"28rem",maxWidth:"100%"}},
        ...["Design review", "Access request", "November report"].map((name,index) =>
          element("SwipeActions",{
            key:`${name}:${v.defaultOpen}`,label:`Actions for ${name}`,size,swipe:v.swipe,
            defaultOpen:index===0&&v.defaultOpen,
            actions:binding(
              `<><IconButton label="Mark as read" size="${size}" variant="ghost" onClick={() => setStatus("Marked as read")}><CircleCheck /></IconButton><IconButton label="Archive" size="${size}" variant="ghost" onClick={() => setStatus("Archived")}><Archive /></IconButton></>`,
              <><Flood.IconButton label="Mark as read" size={size} variant="ghost" onClick={() => actions.setStatus("Marked as read")}><CircleCheck /></Flood.IconButton><Flood.IconButton label="Archive" size={size} variant="ghost" onClick={() => actions.setStatus("Archived")}><Archive /></Flood.IconButton></>,
            ),
          },element("Stack",{gap:"0"},
            element("Text",{size:"label"},element("TruncatedText",{},name)),
            element("Text",{size:"helper",tone:"subtle"},element("TruncatedText",{},["Project update","Workspace permissions","Analytics export"][index]!)),
          ))),status);
    }
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
    case "relative-time-range-picker": return element("Stack",{style:{width:"32rem",maxWidth:"100%"}},element("RelativeTimeRangePicker",{
      label:"Time range",hideLabel:v.hideLabel,controlSize:v.controlSize,disabled:v.disabled,
      value:binding("range",actions.relativeRange),onValueChange:binding("setRange",actions.setRelativeRange),
      timeZones:[{value:"UTC",label:"UTC"},{value:"Europe/Berlin",label:"Europe/Berlin"},{value:"America/Los_Angeles",label:"America/Los_Angeles"}],
    }));
    case "meeting-availability": {
      const overnight = v.scenario === "Across midnight";
      const attendees: Flood.MeetingAttendeeAvailability[] = v.scenario === "No attendees" ? [] : [
        {id:"maya",name:"Maya Chen",timeZone:"America/New_York",availability:overnight?"outside-hours":"available"},
        {id:"sam",name:"Sam Rivera",timeZone:"Europe/London",availability:overnight?"outside-hours":"busy"},
        {id:"aiko",name:"Aiko Tanaka",timeZone:"Asia/Tokyo",availability:overnight?"available":"outside-hours"},
        {id:"jules",name:"Jules Martin",detail:"Optional",availability:"unknown"},
      ];
      const slot = overnight
        ? {start:"2026-11-16T23:30:00Z",end:"2026-11-17T00:15:00Z"}
        : {start:"2026-11-16T16:00:00Z",end:"2026-11-16T16:45:00Z"};
      return element("Surface",{elevation:v.surface,padding:"4",style:{inlineSize:v.narrow?"20rem":"33rem",maxInlineSize:"100%"}},
        element("Section",{title:"Reviews sync",headingSize:"group"},
          element("MeetingAvailability",{label:"Attendee availability",slot,attendees})));
    }
    case "template-picker": {
      const templates: Flood.TemplatePickerOption[] = [
        {id:"incident",label:"Incident report",scope:"Operations",
          fields:[{id:"type",label:"Issue type",value:"Incident"},{id:"priority",label:"Priority",value:"High",replaces:v.existing === true}]},
        {id:"request",label:"Feature request",scope:"Workspace",
          fields:[{id:"type",label:"Issue type",value:"Feature"},{id:"status",label:"Status",value:"Triage"}]},
        {id:"access",label:"Access request",scope:"Security",unavailableReason:"Security team only"},
      ];
      const error = "Couldn’t apply the template. Try again.";
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("TemplatePicker",{
            templates,pending:v.pending,value:binding("templateId",actions.templateId),
            onValueChange:binding('(id) => { setTemplateId(id); setStatus(""); }',(id:string)=>{actions.setTemplateId(id);actions.setStatus("");}),
            onApply:binding(v.fail?`() => setStatus(${JSON.stringify(error)})`:'() => setStatus("Template applied")',
              ()=>actions.setStatus(v.fail?error:"Template applied")),
            error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
          }),
          element("Text",{size:"helper",tone:"subtle",role:"status",hidden:binding('status !== "Template applied"',actions.status!=="Template applied")},
            binding("status",actions.status))));
    }
    case "model-picker": {
      const models: Flood.ModelPickerOption[] = [
        {id:"northstar-core",label:"Core",provider:"Northstar",modelId:"core-v2",description:"Text and image input"},
        {id:"meridian-core",label:"Core",provider:"Meridian",modelId:"meridian-core-2",description:"Low-latency text"},
        {id:"northstar-vision",label:"Vision",provider:"Northstar",modelId:"vision-v1",description:"Image generation"},
        {id:"meridian-review",label:"Review",provider:"Meridian",modelId:"review-v3",unavailableReason:"Workspace access required"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"25rem",maxInlineSize:"100%"}},
        element("form",{"aria-label":"Run settings"},{
          tag:"Field",props:{label:"Model"},field:element("ModelPicker",{
            name:"model",placeholder:"Find a model",defaultValue:"northstar-core",
            models,loadState:v.catalog,readOnly:v.readOnly,controlSize:"sm",
          }),
        }));
    }
    case "content-language-picker": {
      const style = {inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"};
      const picker = element("form",{"aria-label":"Publication metadata"},{
        tag:"Field",props:{label:"Post languages"},field:element("ContentLanguagePicker",{
          name:"language",placeholder:"Find a language",locale:v.locale,
          languages:["en","th","ja","pt-BR","fr","sr-Latn","sr-Cyrl"].map(code=>({code})),
          defaultValue:["en","th"],maxVisibleTags:v.narrow?2:undefined,controlSize:"sm",
          readOnly:v.readOnly,disabled:v.disabled,
        }),
      });
      return v.surface === "canvas" ? element("div",{style},picker)
        : element("Surface",{padding:"4",elevation:v.surface,style},picker);
    }
    case "time-zone-select": return element("div",{style:{width:"24rem",maxWidth:"100%"}},element("TimeZoneSelect",{
      "aria-label":"Time zone",defaultValue:"America/New_York",referenceTime:v.summerReference?"2026-07-05T12:00:00Z":"2026-01-05T12:00:00Z",
      options:timeZoneExamples,controlSize:v.controlSize,readOnly:v.readOnly,disabled:v.disabled,
    }));
    case "handle-field": {
      const mode = v.mode === "Hosted" ? "hosted" : "custom";
      const domain = mode === "hosted"
        ? v.scenario === "Long domain" ? "design-references.international-workspace.example" : "studio.example"
        : undefined;
      const handle = domain ? `maya.${domain}` : "maya.example";
      const availability: Flood.HandleAvailability = v.scenario === "Unavailable"
        ? {handle,state:"unavailable",reason:"This handle is already in use."}
        : {handle,state:v.scenario === "Checking" ? "checking" : "available"};
      const draftKey = JSON.stringify(mode);
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"25rem",maxInlineSize:"100%"}},
        element("form",{"aria-label":"Profile identity"},
          element("HandleField",{
            name:"handle",value:binding(`handleDraft[${draftKey}]`,actions.handleDraft[mode]),
            onValueChange:binding(`value => setHandleDraft(current => ({...current,[${draftKey}]:value}))`,
              (value: string) => actions.setHandleDraft(current => ({...current,[mode]:value}))),
            domain,availability,controlSize:"sm",disabled:v.disabled,required:true,
          })));
    }
    case "cron-schedule-field": {
      const timeZone = String(v.timeZone);
      const hour = timeZone === "UTC" ? "09" : "14";
      const upcoming = v.scenario === "No upcoming runs" ? [] : [`2026-11-23T${hour}:00:00Z`,`2026-11-30T${hour}:00:00Z`];
      const known: Record<string, Flood.CronScheduleResult> = {
        "0 9 * * 1": {expression:"0 9 * * 1",timeZone,state:"ready",summary:"Mondays at 9:00 AM",upcoming},
        "0 99 * * 1": {expression:"0 99 * * 1",timeZone,state:"invalid",error:"Enter an hour from 0 to 23."},
      };
      const result = v.scenario === "Checking"
        ? binding(`{expression:cronExpression,timeZone:${JSON.stringify(timeZone)},state:"checking"}`,{expression:actions.cronExpression,timeZone,state:"checking"})
        : v.scenario === "Stale" ? {...known["0 9 * * 1"],timeZone:"UTC"}
        : binding(`(${JSON.stringify(known)} as Record<string, import("react").ComponentProps<typeof CronScheduleField>["result"]>)[cronExpression]`,known[actions.cronExpression]);
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"25rem",maxInlineSize:"100%"}},
        element("form",{"aria-label":"Job schedule"},
          element("CronScheduleField",{
            name:"schedule",timeZone,result,controlSize:"sm",readOnly:v.readOnly,
            value:binding("cronExpression",actions.cronExpression),
            onValueChange:binding("setCronExpression",actions.setCronExpression),
          })));
    }
    case "recurrence-editor": return element("form",{style:{width:"32rem",maxWidth:"100%"}},element("RecurrenceEditor",{
      label:"Repeat",value:binding("recurrence",actions.recurrence),onValueChange:binding("setRecurrence",actions.setRecurrence),
      names:{interval:"interval",frequency:"frequency",weekdays:"day",ending:"ending",untilDate:"untilDate",occurrences:"count"},
      weekStartsOn:v.sundayStart?0:1,controlSize:v.controlSize,disabled:v.disabled,
    }));
    case "quiet-hours-editor": return element("Surface",{
      padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"19rem":"34rem",maxInlineSize:"100%"},
    }, element("QuietHoursEditor",{
      timeZoneLabel:"New York time",
      value:binding("quietHours",actions.quietHours),onValueChange:binding("setQuietHours",actions.setQuietHours),
      disabled:v.disabled,
    }));
    case "deployment-region-picker": {
      const regions: Flood.DeploymentRegion[] = v.empty ? [] : [
        {id:"europe",label:"Europe",location:"Automatic placement within Europe",scope:"automatic",
          unavailableReason:v.exact?"Choose a specific location for this project.":undefined},
        {id:"frankfurt",label:"Frankfurt",location:"Germany",scope:"specific",code:"eu-central-1"},
        {id:"virginia",label:"Northern Virginia",location:"United States",scope:"specific",code:"us-east-1"},
        {id:"singapore",label:"Singapore",location:"Southeast Asia",scope:"specific",code:"ap-southeast-1",
          unavailableReason:"Capacity unavailable"},
      ];
      const read = 'status ? JSON.parse(status) : {current:"frankfurt",draft:"frankfurt"}';
      const selection = actions.status ? JSON.parse(actions.status) as {current:string;draft:string} : {current:"frankfurt",draft:"frankfurt"};
      const availableIds = regions.filter(region=>!region.unavailableReason).map(region=>region.id);
      const canApply = selection.current !== selection.draft && availableIds.includes(selection.draft);
      const blocked = `(${read}).current === (${read}).draft || !${JSON.stringify(availableIds)}.includes((${read}).draft)`;
      const submit = (event:FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const region = new FormData(event.currentTarget).get("region");
        if (canApply && region === selection.draft) actions.setStatus(JSON.stringify({current:region,draft:region}));
      };
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("form",{onSubmit:binding(`event => { event.preventDefault(); const region = new FormData(event.currentTarget).get("region"); if (!(${blocked}) && region === (${read}).draft) setStatus(JSON.stringify({current:region,draft:region})); }`,submit)},
          element("Stack",{gap:"4"},
            element("DeploymentRegionPicker",{label:"Deployment region",name:"region",required:true,regions,recommendedRegionId:"europe",
              currentRegionId:binding(`(${read}).current`,selection.current),
              value:binding(`(${read}).draft`,selection.draft),
              onValueChange:binding(`draft => setStatus(JSON.stringify({current:(${read}).current,draft}))`,
                (draft:string)=>actions.setStatus(JSON.stringify({current:selection.current,draft})))}),
            element("Inline",{style:{justifyContent:"flex-end"}},element("Button",{type:"submit",size:"sm",
              disabled:binding(blocked,!canApply)},"Apply region")))));
    }
    case "payment-method-picker": {
      const methods: Flood.PaymentMethodOption[] = v.scenario === "Empty" ? [] : [
        {id:"standard",label:"Standard ACH",arrival:"2–4 business days",fee:"$0.00",
          unavailableReason:v.scenario==="Method unavailable"?"Bank account verification required":undefined},
        {id:"priority",label:"Priority ACH",arrival:v.scenario==="Missing quote"?undefined:"Estimated tomorrow",
          fee:v.scenario==="Missing quote"?undefined:"$8.00"},
        {id:"wire",label:"Domestic wire",unavailableReason:"Recipient routing details missing"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"}},
        element("form",{"aria-label":"Payment setup"},
          element("PaymentMethodPicker",{label:"Payment method",name:"method",required:true,methods,disabled:v.disabled,
            value:binding("paymentMethod",actions.paymentMethod),onValueChange:binding("setPaymentMethod",actions.setPaymentMethod)})));
    }
    case "backup-picker": {
      const backups: Flood.BackupPoint[] = v.empty ? [] : [
        {id:"daily",label:"Daily backup",capturedAt:{dateTime:"2026-11-16T06:00:00Z",label:"Nov 16, 06:00 UTC"},
          unavailableReason:v.expireLatest?"Backup verification failed.":undefined},
        {id:"manual",label:"Before schema migration",capturedAt:{dateTime:"2026-11-15T18:45:00Z",label:"Nov 15, 18:45 UTC"}},
        {id:"weekly",label:"Weekly backup",capturedAt:{dateTime:"2026-11-09T06:00:00Z",label:"Nov 9, 06:00 UTC"},
          unavailableReason:"Retention period ended."},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("form",{onSubmit:binding("event => event.preventDefault()", (event:Event)=>event.preventDefault())},
          element("BackupPicker",{
            name:"backup",label:"Choose a backup",backups,required:true,
            value:binding("status",actions.status),onValueChange:binding("setStatus",actions.setStatus),
          })));
    }
    case "backup-restore-dialog": {
      const copy = v.scenario === "New project";
      const source: Flood.BackupRestoreSource = copy
        ? {project:"Billing production",kind:"snapshot",label:"Daily backup",dateTime:"2026-11-16T06:00:00Z"}
        : {project:"Billing production",kind:"point-in-time",dateTime:"2026-11-16T14:25:12Z"};
      const project = copy ? "Billing recovery" : "Billing production";
      const message = `Restore requested for ${project}.`;
      return element("Stack",{align:"center"},
        element("BackupRestoreDialog",{
          source,destination:{kind:copy?"new":"replace",project},timeZone:v.timeZone,
          impact:copy?"Storage objects are excluded.":"Billing will be unavailable during the restore.",
          unavailableReason:v.scenario==="Expired"?"This point is outside the current recovery window.":undefined,
          onConfirm:binding(`() => setStatus(${JSON.stringify(message)})`,()=>actions.setStatus(message)),
          trigger:binding('trigger => <Button {...trigger} variant="subtle">Review restore</Button>',
            (trigger:Flood.OverlayTriggerProps)=><Flood.Button {...trigger} variant="subtle">Review restore</Flood.Button>),
        }),status);
    }
    case "recovery-window": {
      const latest = "2026-11-16T16:42:18Z";
      const candidate = {"within window":"2026-11-15T09:30:12Z","outside window":"2026-11-12T09:30:12Z",
        "latest point":latest,"single point":latest,"no selection":undefined}[v.scenario as string];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"30rem",maxInlineSize:"100%"}},
        element("Section",{title:"Available restore points",headingSize:"group"},
          element("RecoveryWindow",{earliest:v.scenario==="single point"?latest:"2026-11-13T16:42:18Z",latest,
            selected:candidate,timeZone:v.timeZone,timeZoneLabel:v.timeZone==="UTC"?"UTC":"New York time"})));
    }
    case "incomplete-response-notice": {
      const partial = v.scenario === "Partial answer";
      const reason = v.scenario === "Filtered" ? "filtered" : v.scenario === "Unknown" ? "unknown" : "output-limit";
      const action = reason === "output-limit" ? binding(
        '<Link href="/components/token-usage-breakdown" size="sm" variant="ghost">Review usage</Link>',
        <Flood.Link href="/components/token-usage-breakdown" size="sm" variant="ghost">Review usage</Flood.Link>,
      ) : undefined;
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"33rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          ...(partial ? [element("Text",{as:"p",size:"compact"},"Two suppliers match the request. Northwind can deliver by Thursday. For the second supplier, the earliest delivery date is")] : []),
          element("IncompleteResponseNotice",{output:partial?"partial":"none",reason,action})));
    }
    case "deprecation-notice": {
      const retired = v.state === "retired";
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("Section",{title:"Export API",headingSize:"group"},
          element("DeprecationNotice",{
            state:v.state,appearance:v.appearance,
            cutoff:v.showCutoff?(retired?{dateTime:"2026-11-12",label:"Nov 12, 2026"}:{dateTime:"2026-12-01",label:"Dec 1, 2026"}):undefined,
            replacement:v.showReplacement?{label:"/v2/exports",href:"/components/endpoint-label"}:undefined,
          }, retired ? "Requests to the v1 endpoint now fail." : "The v1 endpoint accepts requests until the cutoff.")));
    }
    case "service-level-targets": {
      const resolutionStates: Record<string,Flood.ServiceLevelTargetState> = {
        "Due soon":{phase:"running",deadline:"2026-11-16T12:00:00Z",warningWithinMinutes:30},
        Paused:{phase:"paused",reason:"Waiting for the customer to share a receipt."},
        Overdue:{phase:"running",deadline:"2026-11-16T11:30:00Z",warningWithinMinutes:30},
        "Completed late":{phase:"missed",completedAt:"2026-11-16T11:44:00Z"},
      };
      const group = element("Section",{title:"Support targets",headingSize:"group"},element("ServiceLevelTargets",{
        label:"Response and resolution",now:"2026-11-16T11:49:00Z",timeZone:"UTC",
        targets:[
          {id:"reply",label:"First response",state:{phase:"met",completedAt:"2026-11-16T10:42:00Z"}},
          {id:"resolution",label:"Resolution",state:resolutionStates[String(v.scenario)]},
        ],
      }));
      const style = {inlineSize:v.narrow?"18rem":"34rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},group)
        : element("Surface",{style,padding:v.narrow?"4":"6",elevation:v.surface},group);
    }
    case "deadline-status": {
      const time = ({"due soon":"11:49","remaining":"09:45","due now":"12:00","overdue":"12:04","paused":"11:49"} as Record<string,string>)[String(v.state)] ?? "11:49";
      return element("DeadlineStatus",{deadline:"2026-11-16T12:00:00Z",now:`2026-11-16T${time}:00Z`,warningWithinMinutes:30,
        paused:v.state==="paused",presentation:v.presentation,size:v.size,showDeadline:v.showDeadline});
    }
    case "log-row": {
      const sample = logPreviewEntries.find(entry => entry.severity === v.severity) ?? logPreviewEntries[3];
      return element("DataList",{density:"compact",dividers:false,style:{width:"34rem",maxWidth:"100%"}},
        element("LogRow",{entry:{...sample,payload:v.showPayload ? logPreviewEntries[3].payload : undefined}}));
    }
    case "log-context": {
      const earlier = [...precedingLogPreviewEntries.slice(-1),...logPreviewEntries.slice(0,3)];
      const later = logPreviewEntries.slice(4);
      const previousPage = precedingLogPreviewEntries.slice(0,-1);
      const nextPage = [incomingLogPreviewEntry];
      return element("Surface",{elevation:"raised",padding:"4",style:{inlineSize:v.narrow?"20rem":"36rem",maxInlineSize:"100%"}},
        element("Section",{title:"Logs around the upload",headingSize:"group"},
          element("LogContext",{
            label:"Storage request context",anchor:logPreviewEntries[3],maxViewportHeight:v.narrow?"13rem":"15rem",
            before:binding(`(listSelection.earlier ? ${JSON.stringify([...previousPage,...earlier])} : ${JSON.stringify(earlier)}) as import("react").ComponentProps<typeof LogContext>["before"]`,
              actions.listSelection.earlier?[...previousPage,...earlier]:earlier),
            after:binding(`(listSelection.later ? ${JSON.stringify([...later,...nextPage])} : ${JSON.stringify(later)}) as import("react").ComponentProps<typeof LogContext>["after"]`,
              actions.listSelection.later?[...later,...nextPage]:later),
            earlier:binding(
              `{onLoad:() => setListSelection(current => ({...current,earlier:true})),exhausted:listSelection.earlier,pending:${v.scenario==="Loading earlier"},error:${v.scenario==="Failed earlier"?'listSelection.earlier ? undefined : "Couldn’t load earlier entries."':"undefined"}}`,{
              onLoad:()=>actions.setListSelection("earlier",true),exhausted:actions.listSelection.earlier,
              pending:v.scenario==="Loading earlier",error:v.scenario==="Failed earlier"&&!actions.listSelection.earlier?"Couldn’t load earlier entries.":undefined,
            }),
            later:binding('{onLoad:() => setListSelection(current => ({...current,later:true})),exhausted:listSelection.later}',{
              onLoad:()=>actions.setListSelection("later",true),exhausted:actions.listSelection.later,
            }),
          })));
    }
    case "environment-creation-form": {
      const sources = v.scenario === "No sources" ? [] : [
        ...(v.scenario === "Source removed" ? [] : [{id:"staging",label:"Staging",copyDescription:"Copies 3 services and their configuration. Databases start empty."}]),
        {id:"production",label:"Production",unavailableReason:"Restricted by project policy"},
        {id:"testing",label:"Testing",copyDescription:"Copies 2 services and their configuration."},
      ];
      const failure = "An environment with this name already exists.";
      const failed = actions.status === failure;
      const notice: ElementRecipe = {...element("Text",{as:"p",size:"compact",role:"status"},
        binding(`status === ${JSON.stringify(failure)} ? "" : status`,failed ? "" : actions.status)),previewFeedback:true};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"25rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("EnvironmentCreationForm",{
            "aria-label":"New environment",sources,pending:v.pending,
            draft:binding("environmentDraft",actions.environmentDraft),
            onDraftChange:binding("(draft) => { setEnvironmentDraft(draft); setStatus(''); }",(draft:Flood.EnvironmentCreationDraft) => {
              actions.setEnvironmentDraft(draft);
              actions.setStatus("");
            }),
            error:binding(`status === ${JSON.stringify(failure)} ? status : undefined`,failed ? failure : undefined),
            onSubmit:binding(v.fail ? `() => setStatus(${JSON.stringify(failure)})` :
              '(request) => setStatus(request.mode === "duplicate" ? request.name + " · " + request.sourceId : request.name)',
              (request:Flood.EnvironmentCreationRequest) => actions.setStatus(v.fail ? failure :
                request.mode === "duplicate" ? `${request.name} · ${request.sourceId}` : request.name)),
          }),notice));
    }
    case "database-webhook-form": {
      const tables = v.catalog === "Empty" ? [] : [
        ...(v.catalog === "Table removed" ? [] : [{id:"exports",label:"public.exports"}]),
        {id:"jobs",label:"public.jobs"},
      ];
      const failure = "This destination is blocked by the project’s outbound policy.";
      const failed = actions.status === failure;
      const notice: ElementRecipe = {...element("Text",{as:"p",size:"compact",role:"status"},
        binding(`status === ${JSON.stringify(failure)} ? "" : status`,failed ? "" : actions.status)),previewFeedback:true};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"25rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("DatabaseWebhookForm",{
            "aria-label":"New database webhook",tables,pending:v.pending,
            draft:binding("webhookDraft",actions.webhookDraft),
            onDraftChange:binding("(draft) => { setWebhookDraft(draft); setStatus(''); }",(draft:Flood.DatabaseWebhookDraft) => {
              actions.setWebhookDraft(draft);
              actions.setStatus("");
            }),
            error:binding(`status === ${JSON.stringify(failure)} ? status : undefined`,failed ? failure : undefined),
            onSubmit:binding(v.fail ? `() => setStatus(${JSON.stringify(failure)})` :
              '(request) => setStatus(request.name + " · " + request.events.map(event => event.toUpperCase()).join(", "))',
              (request:Flood.DatabaseWebhookDraft) => actions.setStatus(v.fail ? failure :
                `${request.name} · ${request.events.map(event => event.toUpperCase()).join(", ")}`)),
          }),notice));
    }
    case "log-export-form": {
      const range: Flood.LogExportFormProps["range"] = v.range === "Fixed"
        ? {kind:"fixed",label:"Nov 16 · 09:00–12:00 UTC"}
        : {kind:"recent",options:[{seconds:3600,label:"Last hour"},{seconds:21600,label:"Last 6 hours"},{seconds:86400,label:"Last 24 hours"}]};
      const error = "Couldn’t download logs. Try again.";
      const accepted = "Export requested";
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"26rem",maxInlineSize:"100%"}},
        element("Section",{title:"Download storage logs",headingSize:"group"},
          element("LogExportForm",{
            range,formats:[{id:"csv",label:"CSV"},{id:"json",label:"JSON"}],rowLimits:[100,500,1000],
            draft:binding("logExportDraft",actions.logExportDraft),
            onDraftChange:binding('(draft) => { setLogExportDraft(draft); setStatus(""); }',
              (draft:Flood.LogExportDraft)=>{actions.setLogExportDraft(draft);actions.setStatus("");}),
            onSubmit:binding(`(draft) => setStatus(${JSON.stringify(v.fail?error:accepted)})`,
              ()=>actions.setStatus(v.fail?error:accepted)),
            error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
            pending:v.pending,
          }),
          element("Text",{size:"helper",tone:"subtle",role:"status",hidden:binding(`status !== ${JSON.stringify(accepted)}`,actions.status!==accepted)},
            binding("status",actions.status))));
    }
    case "log-viewer": return element("LogViewer",{
      key:String(v.defaultFollowing),label:"Runtime log",defaultFollowing:v.defaultFollowing,maxViewportHeight:"16rem",
      searchable:v.searchable || undefined,
      entries:v.empty ? [] : [...precedingLogPreviewEntries,...logPreviewEntries,...(v.incomingEntry ? [incomingLogPreviewEntry] : [])],
      style:{width:"37rem",maxWidth:"100%"},
    });
    case "live-follow-control": return element("Surface",{elevation:v.surface,padding:"4",style:{inlineSize:"16rem",maxInlineSize:"100%"}},
      element("LiveFollowControl",{
        style:{justifyContent:"space-between"},
        following:binding(`status ? status === "following" : ${Boolean(v.defaultFollowing)}`,
          actions.status ? actions.status === "following" : Boolean(v.defaultFollowing)),
        queued:Number(v.queued), disabled:v.disabled,
        onFollowingChange:binding('(next) => setStatus(next ? "following" : "paused")',
          (next:boolean)=>actions.setStatus(next?"following":"paused")),
      }));
    case "span-row": return element("DataList",{density:"compact",dividers:false,style:{width:"36rem",maxWidth:"100%"}},
      element("SpanRow",{span:{id:"cache",label:"Cache lookup",start:102,duration:v.instant?0:93,
        status:v.showStatus?{label:"Cache miss",tone:"warning"}:undefined},domain:v.clipStart?[134,300]:[0,300]}));
    case "trace-waterfall": return element("TraceWaterfall",{label:"Request trace",spans:v.empty?[]:tracePreviewSpans,
      zoom:binding("{ spanId: traceZoomId, onChange: setTraceZoom }",{spanId:actions.traceZoomId,onChange:actions.setTraceZoom}),
      domain:v.storageWindow?[96,564]:undefined,style:{width:"44rem",maxWidth:"100%"}});
    case "database-session-list": {
      const consoleSession: Flood.DatabaseSessionRecord = {id:"console",label:"Admin console",pid:1372,
        state:"idle-in-transaction",duration:"Transaction open 8 min"};
      const lockWait = v.scenario === "No waits" ? undefined :
        {blockers:v.scenario === "Lock wait" ? [{id:consoleSession.id,label:consoleSession.label}] : undefined};
      const sessions: Flood.DatabaseSessionRecord[] = v.scenario === "Empty" ? [] : [
        {id:"sync",label:"Inventory sync",pid:1428,state:"active",operation:"Update inventory reservations",lockWait},
        ...(v.scenario === "Blocker hidden" ? [] : [consoleSession]),
        {id:"reports",label:"Reporting worker",pid:1485,state:"idle"},
      ];
      const sessionList = element("Section",{title:"Database sessions",headingSize:"group"},
        element("DatabaseSessionList",{label:"Postgres sessions",sessions,
          emptyContent:v.scenario === "Empty" ? binding('<Text size="compact" tone="subtle">No sessions found.</Text>',
            <Flood.Text size="compact" tone="subtle">No sessions found.</Flood.Text>) : undefined}));
      const style = {inlineSize:v.narrow?"19rem":"34rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},sessionList)
        : element("Surface",{style,padding:v.narrow?"4":"6",elevation:v.surface},sessionList);
    }
    case "index-recommendation": {
      const recommendation = element("IndexRecommendation",{
        title:"Index open orders by customer",
        estimate:{total:{before:128.32,after:24.6},...(v.showStartup ? {startup:{before:0,after:0.29}} : {})},
        sql:"CREATE INDEX ON public.orders (customer_id)\nWHERE status = 'open';",
      });
      const style = {inlineSize:v.narrow?"18rem":"31rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},recommendation)
        : element("Surface",{style,padding:v.narrow?"4":"6",elevation:v.surface},recommendation);
    }
    case "query-plan": {
      const actual = (rows:number,durationMs:number,loops = 1) => v.estimateOnly ? undefined : {rows,durationMs,loops};
      const root = {id:"join",label:"Nested Loop",estimatedRows:90,estimatedCost:84.23,actual:actual(128,4.816),children:[
        {id:"projects",label:"Index Scan",source:"projects_workspace_idx",estimatedRows:80,estimatedCost:31.42,actual:actual(64,0.438)},
        {id:"files",label:"Bitmap Heap Scan",source:"files",estimatedRows:1,estimatedCost:0.65,actual:actual(2,0.061,64),children:[
          {id:"files-index",label:"Bitmap Index Scan",source:"files_project_idx",estimatedRows:1,estimatedCost:0.38,actual:actual(2,0.019,64)},
        ]},
      ]};
      return element("QueryPlan",{label:"File search execution plan",root:v.empty ? null : root,
        style:{inlineSize:v.narrow ? "18rem" : "44rem",maxInlineSize:"100%"}});
    }
    case "json-inspector": return element("Stack",{style:{width:"35rem",maxWidth:"100%"}},element("JsonInspector",{
      key:String(v.defaultExpandedDepth),label:"API exchange",searchable:v.searchable,defaultExpandedDepth:Number(v.defaultExpandedDepth),
      value:{request:{method:"GET",path:"/api/projects"},response:{status:200,items:["Flood","Studio"],next:null}},
    }));
    case "tool-call": {
      const inputCode = '{ "query": "Export policy", "limit": 3 }';
      const output = v.state === "succeeded" ? "3 documents found."
        : v.state === "failed" ? "Search timed out. Try again." : undefined;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"31rem",maxInlineSize:"100%"}},
        element("ToolCall",{title:"Search workspace files",state:v.state,variant:v.variant,announce:true,
          input:v.showDetails ? binding(`<CodeSnippet code={${JSON.stringify(inputCode)}} />`,<Flood.CodeSnippet code={inputCode} />) : undefined,
          output:v.showDetails ? output : undefined}));
    }
    case "tool-call-group": {
      const done = v.scenario === "Completed";
      const partial = v.scenario === "Partial failure";
      const calls: Flood.GroupedToolCall[] = v.scenario === "Empty" ? [] : [
        {id:"search",title:"Search files",state:"succeeded",input:"Export policy",output:"3 documents found."},
        {id:"read",title:"Read export policy",state:done?"succeeded":"running",
          summary:"Check the policy for records retention.",output:done?"Retain customer exports for 30 days.":undefined},
        {id:"check",title:"Check workspace settings",state:done?"succeeded":partial?"failed":"queued",
          output:partial?"The settings service did not respond.":done?"Workspace policy verified.":undefined},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("ToolCallGroup",{title:"Workspace search",calls,announce:true}));
    }
    case "diff-stat": {
      const examples: Record<string, [string, number, number]> = {
        mixed: ["projects.ts", 128, 22],
        added: ["project-filters.ts", 36, 0],
        removed: ["legacy-query.ts", 0, 64],
        unchanged: ["client.ts", 0, 0],
        large: ["schema.generated.ts", 12480, 7832],
      };
      const [name, additions, deletions] = examples[String(v.example)] ?? examples.mixed;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"28rem",maxInlineSize:"100%"}},
        element("Inline",{gap:"3",style:{justifyContent:"space-between"}},
          element("Text",{size:"compact"},name),
          element("DiffStat",{additions,deletions,showDistribution:v.showDistribution})));
    }
    case "changed-file-list": {
      const files = [
        {id:"panel",path:"packages/workspace/src/views/export/ReviewPanel.tsx",href:"#changed-file-panel",changes:{additions:2,deletions:1},reviewed:false},
        {id:"fixture",path:"packages/workspace/tests/export/review-fixture.ts",href:"#changed-file-fixture",changes:{additions:1,deletions:0},reviewed:true},
      ];
      const review = (items:typeof files) => items.map(file=>({...file,reviewed:actions.listSelection[file.id] ?? file.reviewed}));
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"18rem":"44rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"6"},
          element("Section",{title:"Changed files",headingSize:"group"},
            element("ChangedFileList",{label:"Files in export review",
              files:v.empty ? [] : binding(`${JSON.stringify(files)}.map(file => ({...file, reviewed:listSelection[file.id] ?? file.reviewed}))`,review(files)),
              onReviewedChange:v.reviewable ? binding('(id, reviewed) => setListSelection(current => ({...current, [id]:reviewed}))',actions.setListSelection) : undefined})),
          ...(!v.empty ? [
            element("Section",{id:"changed-file-panel",tabIndex:-1,title:"ReviewPanel.tsx",headingSize:"group"},
              element("CodeDiff",{label:"ReviewPanel changes",wrap:true,hunks:[{id:"export-count",lines:[
                {id:"before",kind:"removed",oldLine:24,text:"return <Summary files={files} />;"},
                {id:"after",kind:"added",newLine:24,text:"const pending = files.filter(file => !file.reviewed);"},
                {id:"render",kind:"added",newLine:25,text:"return <Summary files={pending} />;"},
              ]}]})),
            element("Section",{id:"changed-file-fixture",tabIndex:-1,title:"review-fixture.ts",headingSize:"group"},
              element("CodeDiff",{label:"Review fixture changes",wrap:true,hunks:[{id:"pending-review",lines:[
                {id:"fixture",kind:"added",newLine:8,text:"const review = { id: 'export', reviewed: false };"},
              ]}]})),
          ] : [])));
    }
    case "code-diff": {
      const hunks: Flood.CodeDiffHunk[] = [{ id:"load", label:"loadProjects", lines:[
        {id:"start",kind:"context",oldLine:4,newLine:4,text:"async function loadProjects(teamId, signal) {"},
        {id:"read",kind:"context",oldLine:5,newLine:5,text:"  const client = getApiClient();"},
        {id:"first",kind:"context",oldLine:6,newLine:6,text:"  const page = 1;"},
        {id:"sort",kind:"context",oldLine:7,newLine:7,text:"  const order = 'updated';"},
        {id:"limit",kind:"context",oldLine:8,newLine:8,text:"  const limit = 20;"},
        {id:"prepare",kind:"context",oldLine:9,newLine:9,text:"  const query = { page, order, limit, teamId };"},
        {id:"options",kind:"context",oldLine:10,newLine:10,text:"  const options = { query, signal };"},
        {id:"project-path",kind:"context",oldLine:11,newLine:11,text:"  const path = '/projects';"},
        {id:"old-request",kind:"removed",oldLine:12,text:"  return client.get(path, options);"},
        {id:"new-request",kind:"added",newLine:12,text:"  return client.get('/v2' + path, options);"},
        {id:"end",kind:"context",oldLine:13,newLine:13,text:"}"},
      ] }];
      return element("Stack",{style:{width:"60rem",maxWidth:"100%"}},element("Surface",{padding:"3"},
        element("CodeDiff",{label:"src/projects.ts",hideCaption:false,hunks,layout:v.layout,contextLines:Number(v.contextLines),wrap:v.wrap})));
    }
    case "stack-frame":
    case "stack-trace": {
      const primary: Flood.StackFrameData = {id:"request",functionName:"loadProject",path:"src/data/workspace/projects.ts",line:19,column:8,source:[
        {line:18,text:"async function loadProject(projectId) {"},
        {line:19,text:"  return request(projectId);"},
        {line:20,text:"}"},
      ]};
      const secondary: Flood.StackFrameData = {id:"router",functionName:"handleRequest",path:"src/router.ts",line:6,source:[
        {line:5,text:"async function handleRequest(route) {"},
        {line:6,text:"  return loadProject(route.projectId);"},
        {line:7,text:"}"},
      ]};
      return element("Stack",{style:{width:"37rem",maxWidth:"100%"}},element("Surface",{padding:"3"},
        slug === "stack-frame" ? element("DataList",{density:"compact",dividers:false},
          element("StackFrame",{key:String(v.defaultOpen),frame:{...primary,source:v.showSource?primary.source:undefined},defaultOpen:v.defaultOpen}))
          : element("StackTrace",{label:"Request stack",frames:v.empty?[]:[primary,secondary,{id:"listener",functionName:"onRequest",path:"src/server.ts",line:31}],density:v.density})));
    }
    case "dependency-graph": {
      const dataLineage = v.example === "Tables";
      const nodes: Flood.DependencyGraphNode[] = dataLineage ? [
        {id:"orders",label:"Orders",description:"raw.orders"},
        {id:"accounts",label:"Accounts",description:"raw.accounts"},
        {id:"order-facts",label:"Order facts",description:"analytics.order_facts",dependsOn:["orders","accounts"]},
        {id:"daily-revenue",label:"Daily revenue",description:"reporting.daily_revenue",dependsOn:["order-facts"]},
        {id:"account-summary",label:"Account summary",description:"reporting.account_summary",dependsOn:["order-facts"]},
      ] : [
        {id:"build",label:"Build",status:{label:"Passed",tone:"success"}},
        {id:"typecheck",label:"Type check",dependsOn:["build"],status:{label:"Passed",tone:"success"}},
        {id:"browser",label:"Browser tests",dependsOn:["build"],status:{label:"Running",tone:"info"}},
        {id:"publish",label:"Publish",dependsOn:["typecheck","browser"],status:{label:"Waiting"}},
      ];
      return element("Stack",{style:{width:"49rem",maxWidth:"100%"}},element("DependencyGraph",{
        label:dataLineage?"Table dependencies":"Release jobs",nodes:v.empty?[]:nodes,presentation:v.presentation,
        activeId:binding("status || undefined",actions.status || undefined),
        onNodeActivate:binding("setStatus",actions.setStatus),
      }));
    }
    case "file-meta": return element("FileMeta",{lang:"en-US",variant:v.variant,format:v.format==="none"?undefined:v.format,size:v.showSize?Number(v.size):undefined});
    case "image-meta": {
      const square = v.asset === "square";
      const meta = element("ImageMeta",{dimensions:square?{width:1254,height:1254}:{width:1200,height:630},
        lang:v.locale,variant:v.variant,format:v.showFileDetails?"PNG":undefined,
        size:v.showFileDetails?(square?1454337:42713):undefined});
      return element("Surface",{elevation:"raised",padding:"3",style:{inlineSize:v.narrow?"15rem":"29rem",maxInlineSize:"100%"}},
        element("Figure",{caption:binding(printRecipe(meta,new Set(),new Set()),renderRecipe(meta))},
          element("AspectRatio",{ratio:2},element("Image",{fit:"contain",
            src:square?"/flood-mark.png":"/charts-share.png",alt:square?"Pink Flood mark":"Chart overview"}))));
    }
    case "file-name": return element("div",{style:{inlineSize:v.narrow?"13rem":"32rem",maxInlineSize:"100%"}},
      element("FileName",{name:v.longName?"Flood-brand-mark-original-transparent-background.png":"Flood mark.png",
        overflow:v.overflow,href:v.linked?"/flood-mark.png":undefined,download:v.linked || undefined}));
    case "file-path": {
      const separator = v.platform === "Windows" ? "\\" : "/";
      const directory = ["packages","workspace","src","views","export"].join(separator);
      const path = v.platform === "Windows" ? `C:\\work\\${directory}\\ReviewPanel.tsx` : `${directory}/ReviewPanel.tsx`;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"39rem",maxInlineSize:"100%"}},
        element("Section",{title:"Changed file",headingSize:"group"},
          element("FilePath",{path,separator,href:v.linked ? "#reviewed-path" : undefined}),
          element("Text",{id:"reviewed-path",tabIndex:-1,as:"p",size:"helper",tone:"subtle"},"Export review panel")));
    }
    case "file-thumbnail": return element("FileThumbnail",{
      src:filePreviewImage(v.image),presentation:v.presentation,fit:v.fit,
      style:v.presentation==="tile"?{width:"16rem",maxInlineSize:"100%"}:undefined,
    });
    case "file-card-grid":
    case "file-card-skeleton":
    case "file-card": {
      const loadingExample = slug === "file-card-skeleton";
      const gridExample = slug === "file-card-grid";
      const gallery = gridExample || v.gallery;
      const showPreview = gridExample || v.showPreview;
      const showDownload = gridExample || v.showDownload;
      const showSize = gridExample || v.showSize;
      const showType = gridExample || v.showType;
      const name = v.longName ? "Flood-brand-mark-original-transparent-background.png" : "Flood mark.png";
      const ratio = v.ratio === "16:9" ? 16/9 : v.ratio === "1:1" ? 1 : 4/3;
      const cardWidth = {width:v.narrow?"12rem":"18rem",maxInlineSize:"100%"};
      const grid = (...cards: ElementRecipe[]) => element("FileCardGrid",{
        role:"group","aria-label":"Files","aria-busy":gridExample&&!v.loaded || undefined,
        style:{width:gridExample&&v.narrow?"30rem":"46rem",maxInlineSize:"100%"},
      },...cards);
      const placeholder = (hasActions:boolean, description:boolean) => element("FileCardSkeleton",{
        style:gallery?undefined:cardWidth,thumbnailRatio:ratio,thumbnailPlacement:v.thumbnailPlacement,density:v.density,
        description:gridExample ? undefined : description,descriptionLines:gridExample && description ? 2 : undefined,
        metadata:loadingExample ? v.metadata : showType || showSize,reserveSelectionSpace:v.selectable,
        footerActions:hasActions?Number(showDownload)+Number(showPreview && v.previewPlacement === "footer"):0,
        previewOnThumbnail:hasActions && showPreview && v.previewPlacement === "thumbnail",animate:v.animate,
      });
      if ((loadingExample || gridExample) && !v.loaded) return gallery
        ? grid(placeholder(true,Boolean(v.description)),placeholder(true,false),placeholder(false,false))
        : placeholder(true,Boolean(v.description));
      const card = (label: string, src: string | undefined, href: string | undefined, bytes: number, description?:string) => {
        const key = JSON.stringify(label);
        return element("FileCard",{
          hidden:v.showRemove ? binding(`removedFiles[${key}] === true`,actions.fileStates[label] === "removed") : undefined,
          name:label,lang:"en-US",description,thumbnailSrc:src,href,thumbnailFit:v.fit ?? "contain",thumbnailRatio:ratio,thumbnailPlacement:v.thumbnailPlacement,density:v.density,nameOverflow:v.nameOverflow,
          size:showSize?bytes:undefined,format:showType?undefined:null,downloadHref:showDownload?href:undefined,
          disabled:v.disabled,previewPlacement:v.previewPlacement,
          renderPreview:showPreview && href ? fileImagePreview(label,href) : undefined,
          onRemove:v.showRemove ? binding(`() => setRemovedFiles(current => ({...current, [${key}]: true}))`,() => actions.setFileState(label,"removed")) : undefined,
          selection:v.selectable?binding(
            `{label:${JSON.stringify("Select "+label)}, checked:Boolean(listSelection[${key}]), onCheckedChange:(checked: boolean) => setListSelection(current => ({...current, [${key}]:checked}))}`,
            {label:"Select "+label,checked:Boolean(actions.listSelection[label]),
              onCheckedChange:(checked:boolean)=>actions.setListSelection(label,checked)},
          ):undefined,
        });
      };
      const primary = card(name,loadingExample||gridExample?"/flood-mark.png":filePreviewImage(v.thumbnail),"/flood-mark.png",1454337,
        v.description?(loadingExample?"Brand artwork":"Transparent artwork for the website and presentations."):undefined);
      if (!gallery) return element("div",{style:cardWidth},primary);
      return grid(
        primary,card("Analytics dashboard.png","/charts-share.png","/charts-share.png",42713),
        card("Asset usage notes.pdf",undefined,undefined,27400));
    }
    case "file-list-skeleton": {
      const style = {width:v.narrow?"15rem":"32rem",maxWidth:"100%"};
      const metadata = v.metadata === "none" ? undefined : v.metadata;
      if (!v.loaded) return element("FileListSkeleton", {
        label:"Loading review files…",appearance:v.appearance,density:v.density,animate:v.animate,style,
        rows:2,row:{metadata,description:v.description,actions:Number(v.commands)},
      });
      return element("FileList",{label:"Review files",appearance:v.appearance,density:v.density,style},
        ...["Flood mark.png","Logo.svg"].map((name,index)=>element("FileItem",{
          name,nameOverflow:"truncate",metadataVariant:metadata,format:metadata?undefined:null,
          size:metadata?[1454337,18400][index]:undefined,description:v.description?["Brand artwork","Website asset"][index]:undefined,
          downloadHref:Number(v.commands)>0?(index?"/avatar-demo.svg":"/flood-mark.png"):undefined,
          onPreview:Number(v.commands)>1?action:undefined,
        })),status);
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
      const thumbnailSrc = v.showThumbnail ? "/flood-mark.png" : undefined;
      const name = thumbnailSrc ? (v.longName ? "Flood-brand-mark-original-transparent-background.png" : "Flood mark.png") :
        v.longName && index === 0 ? "Brand-guidelines-and-product-design-system-documentation-final-version.pdf" : ["Brand guidelines.pdf","Logo.svg","Cover.png"][index];
      return element("UploadItem",{lang:"en-US",name,thumbnailSrc,thumbnailFit:v.showThumbnail?"contain":undefined,
        renderPreview:v.showActions && thumbnailSrc ? fileImagePreview(name,thumbnailSrc) : undefined,
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
    case "image-alt-text-editor": {
      const mark = v.image === "Brand mark";
      const image = mark ? {src:"/flood-mark.png",width:1254,height:1254,alt:"Flood brand mark"}
        : {src:"/comparison-area.png",width:801,height:403,alt:"Weekly visits chart"};
      const initial = mark ? "Pink four-lobed Flood mark." : "The current week stays above the previous week from Monday to Sunday.";
      const editor = element("ImageAltTextEditor",{image,readOnly:v.readOnly,maxCharacters:160,
        value:binding(`status ? JSON.parse(status) : ${JSON.stringify(initial)}`,actions.status ? JSON.parse(actions.status) : initial),
        onValueChange:binding("value => setStatus(JSON.stringify(value))",(value:string)=>actions.setStatus(JSON.stringify(value)))});
      const style = {inlineSize:v.narrow?"17rem":"37rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},editor)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},editor);
    }
    case "alt-text-disclosure": {
      const summary = "Weekly visits totaled 466. This week remained above the previous week from Monday to Sunday.";
      const detail = [
        summary,
        "The pink line shows this week. It starts low on Monday, climbs, and then dips before Thursday. It reaches a first peak around Thursday and a higher peak near the weekend before easing into Sunday.",
        "The gray dashed line shows the previous week. It follows a similar pattern at a lower level, with smaller changes across the week.",
        "The vertical scale is hidden. The graphic shows how the two weeks compare and where traffic rises or falls.",
      ].join("\n\n");
      const alt = v.example === "decorative" ? "" : v.example === "detailed" ? detail : summary;
      return element("Surface",{padding:"3",elevation:"raised",style:{inlineSize:v.narrow?"15rem":"27rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"2"},
          element("Image",{src:"/comparison-area.png",alt,style:{inlineSize:"100%",borderRadius:"var(--flood-sys-radius-field)"}}),
          ...(alt?[element("Inline",{style:{justifyContent:"end"}},element("AltTextDisclosure",{alt}))]:[])));
    }
    case "image-preview": {
      const metadata = element("ImageMeta",{format:"PNG",dimensions:{width:1254,height:1254},size:1454337});
      const caption = v.showMeta && v.image !== "missing"
        ? binding(printRecipe(metadata,new Set(),new Set()),renderRecipe(metadata))
        : v.showCaption ? "Original Flood brand asset." : undefined;
      return element("ImagePreview",{title:"Flood mark",src:v.image==="missing"?"/missing-preview.png":"/flood-mark.png",
        alt:"Pink Flood mark",caption,zoomable:v.zoomable,downloadHref:v.showDownload?"/flood-mark.png":undefined,disabled:v.disabled,
        trigger:binding('(props) => <Button {...props} variant="subtle">Preview image</Button>',
          (props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Preview image</Flood.Button>)});
    }
    case "collection-cover": case "collection-card": {
      const artwork: Flood.CollectionCoverImage[] = [
        {id:"area",src:"/comparison-area.png"},
        {id:"charts",src:"/charts-share.png",fit:"contain"},
        {id:"trend",src:"/comparison-line.png"},
      ];
      if (slug === "collection-cover") {
        const images = artwork.slice(0,Number(v.count)).map((image,index)=>index === 0 && v.missingThumbnail
          ? {...image,src:"/missing-preview.png"} : image);
        return element("CollectionCover",{images,style:{inlineSize:v.narrow?"16rem":"24rem",maxInlineSize:"100%"}});
      }
      const copyLink = {value:"https://flood.md/docs/charts",copyLabel:"Copy Chart studies link",size:"sm" as const,variant:"ghost" as const,iconOnly:true};
      return element("Grid",{gap:"4",minItemWidth:"14rem",style:{inlineSize:v.narrow?"17rem":"38rem",maxInlineSize:"100%"}},
        element("CollectionCard",{title:"Chart studies",href:"/docs/charts",artwork:v.empty?[]:artwork,countLabel:"3 images",
          actions:v.showActions?binding(`<CopyButton {...${JSON.stringify(copyLink)}} />`,createElement(Flood.CopyButton,copyLink)):undefined}),
        element("CollectionCard",{title:"Flood identity",href:"/components/image-gallery",
          artwork:[{id:"mark",src:"/flood-mark.png",fit:"contain"}],countLabel:"1 image"}));
    }
    case "image-mosaic": {
      const images = [
        {id:"mark",src:"/flood-mark.png",alt:"Pink Flood mark",aspectRatio:1},
        {id:"trend",src:"/comparison-line.png",alt:"Line comparison"},
        {id:"area",src:"/comparison-area.png",alt:"Area comparison"},
        {id:"overview",src:"/charts-share.png",alt:"Chart overview"},
        {id:"avatar",src:"/avatar-demo.svg",alt:"Sample avatar"},
      ].slice(0,Number(v.count)).map((image,index)=>index === 0 && v.missingThumbnail
        ? {...image,thumbnailSrc:"/missing-preview.png"} : image);
      const mosaic = element("ImageMosaic",{label:"Release screenshots",items:images});
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"32rem",maxInlineSize:"100%"}},
        element("Comment",{author:{name:"Maya Chen"},attachments:binding(printRecipe(mosaic,new Set(),new Set()),renderRecipe(mosaic))},
          "Assets for the charts release."));
    }
    case "zoom-control": {
      const zoom = Number(actions.status || 1);
      return element("Surface",{padding:"3",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"2"},
          element("ScrollArea",{id:"zoomed-asset",orientation:"both","aria-label":"Chart preview",
            style:{blockSize:v.narrow?"8rem":"14rem",background:"var(--flood-sys-color-surface-canvas)"}},
            element("Image",{src:"/comparison-line.png",alt:"Weekly line chart",fit:"contain",
              style:binding('{inlineSize: zoom * 100 + "%", maxInlineSize:"none", marginInline:"auto"}',
                {inlineSize:zoom*100+"%",maxInlineSize:"none",marginInline:"auto"})})),
          element("ZoomControl",{label:"Image zoom","aria-controls":"zoomed-asset",levels:[.5,.75,1,1.5,2],
            value:binding("zoom",zoom),onValueChange:binding("value => setStatus(String(value))",(value:number)=>actions.setStatus(String(value))),
            onFit:v.showFit?binding('() => setStatus("1")',()=>actions.setStatus("1")):undefined,
            style:{marginInlineStart:"auto"}})));
    }
    case "thumbnail-strip": {
      const selected = thumbnailPreviewItems.find(item=>item.id===actions.status) ?? thumbnailPreviewItems[0];
      const tiles = thumbnailPreviewItems.map(item=>({...item,src:v.missingThumbnail && item.id==="avatar"?undefined:item.src}));
      return element("Surface",{elevation:v.surface,padding:"3",style:{inlineSize:v.narrow?"16rem":"31rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("AspectRatio",{ratio:2},element("Image",{src:binding("selected.src",selected.src),alt:binding("selected.label",selected.label),fit:"contain"})),
          element("ThumbnailStrip",{label:"Flood assets",items:tiles,
            value:binding("selected.id",selected.id),onValueChange:binding("setStatus",actions.setStatus)})));
    }
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

    case "document-preview": {
      const sections = [
        ["Delivery summary","Project scope","Deliver the launch site, documentation updates, and an accessible component catalog.",
          "Handover","Provide repository access, asset sources, and a record of approved changes.",
          "Review","Project owners review the published pages before accepting delivery."],
        ["Schedule and milestones","Week 1","Review the existing content and agree on the routes that need to change.",
          "Week 2","Implement the agreed changes and check keyboard use and content wrapping.",
          "Week 3","Run acceptance checks on the candidate and schedule the handover."],
        ["Acceptance criteria","Documentation","Setup instructions and component APIs match the delivered package.",
          "Accessibility","Key tasks work with keyboard navigation and the focus order follows the page structure.",
          "Delivery record","Capture test evidence and any issues still open at handover."],
      ];
      const pages = sections.map(([title,...items]) => element("Surface",{
        padding:"6",style:{inlineSize:"36rem",maxInlineSize:"100%",minBlockSize:"31rem"},
      }, element("Stack",{gap:"6"},element("Heading",{level:3,size:"section"},title),
        ...Array.from({length:3},(_, item) => element("Stack",{gap:"2"},
          element("Heading",{level:4,size:"group"},items[item*2]),
          element("Text",{tone:"subtle"},items[item*2+1]))))));
      const state = v.pageState;
      const rendered = state === "loading" || state === "error"
        ? binding(`() => ({state:${JSON.stringify(state)}})`, () => ({state}))
        : binding(`page => ({state:"ready",content:([${pages.map(page=>printRecipe(page,new Set(),new Set())).join(",\n")}])[page - 1]})`,
          (page:number):Flood.DocumentPreviewPage => ({state:"ready",content:renderRecipe(pages[page - 1])}));
      const viewerProps = {title:"Statement of work",pageCount:state === "empty" ? 0 : v.singlePage ? 1 : 3,renderPage:rendered};
      if (!v.inDrawer) return element("DocumentPreview",{
        ...viewerProps,
        trigger:binding('(props) => <Button {...props} variant="subtle">Preview document</Button>',
          (props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Preview document</Flood.Button>),
      });
      const attachedPreview = (trigger: Binding) => element("DocumentPreview",{...viewerProps,trigger});
      return element("Drawer",{
        title:"Project documents",size:"sm",
        trigger:binding('(props) => <Button {...props} variant="subtle">Open project documents</Button>',
          (props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Open project documents</Flood.Button>),
      },element("FileList",{label:"Documents",appearance:"plain"},element("FileItem",{
        name:"Statement of work.pdf",size:758000,
        renderPreview:binding(`trigger => (${printRecipe(attachedPreview(binding("trigger",null)),new Set(),new Set())})`,
          (trigger: Flood.DialogProps["trigger"])=>renderRecipe(attachedPreview(binding("trigger",trigger)))),
      })));
    }
    case "kanban-board": {
      const lane=actions.boardColumns.find(column=>column.cards.some(card=>card.id===actions.boardCardId));
      const card=lane?.cards.find(card=>card.id===actions.boardCardId);
      const project = v.cardLayout==="project";
      return element("Stack",{style:{width:project ? "62rem" : "52rem",maxWidth:"100%"}},element("KanbanBoard",{
        label:project ? "Project portfolio" : "Release board",columns:binding("columns",actions.boardColumns),
        appearance:v.appearance,cardLayout:v.cardLayout,dragActivation:v.dragActivation,showCounts:v.showCounts,disabled:v.disabled,
        onCardOpen:binding("card => setCardId(card.id)",(card: Flood.KanbanCardData)=>actions.setBoardCardId(card.id)),
        onMove:v.rejectMoves ? binding('() => "This release is locked."',()=>"This release is locked.") : binding("moveCard",actions.moveBoardCard),
      }),element("Dialog",{
        title:binding('activeCard?.title ?? "Card details"',card?.title ?? "Card details"),
        description:binding("activeCard?.description",card?.description),
        open:binding("Boolean(activeCard)",Boolean(card)),
        trigger:binding("() => null",()=>null),
        onOpenChange:binding("open => { if (!open) setCardId(null); }",(open: boolean)=>{if(!open)actions.setBoardCardId(null);}),
      },element("Stack",{gap:"2"},
        element("Text",{size:"compact"},binding("activeLane?.label",lane?.label)),
        element("Text",{size:"compact",tone:"subtle"},binding("activeCard?.metadata",card?.metadata)),
      )));
    }
    case "reorder-list": {
      const blocked = () => "The section order is locked for review.";
      return element("Surface",{padding:"2",style:{width:"21rem",maxWidth:"100%"}},element("ReorderList",{
        label:"Page sections",density:v.density,disabled:v.disabled,maxViewportHeight:"18rem",
        items:binding("items",actions.reorderItems),
        onMove:v.rejectMoves ? binding('() => "The section order is locked for review."',blocked) : binding("moveItem",actions.moveReorderItem),
      }));
    }
    case "import-column-mapping": {
      const columns = v.scenario === "Empty" ? [] : [
        {id:"company",label:"Company",example:"Northwind"},
        {id:"work",label:"Work email",example:"team@example.com"},
        {id:"old",label:"Old email",example:"unknown"},
      ];
      const targets = [{id:"name",label:"Company name"},{id:"email",label:"Email"}];
      const initial = v.scenario === "Field removed" ? {company:"name",work:"old-email",old:null} : {company:"name",old:null};
      const value: Record<string,string|null> = actions.status ? JSON.parse(actions.status) : initial;
      const table = element("ImportColumnMapping",{caption:"Map contact CSV",columns,targets,disabled:v.disabled,
        value:binding("status ? JSON.parse(status) : " + JSON.stringify(initial),value),
        onMappingChange:binding("(sourceId, targetId) => setStatus(JSON.stringify({...(" +
          "status ? JSON.parse(status) : " + JSON.stringify(initial) + "), [sourceId]: targetId}))",
          (sourceId:string,targetId:string|null)=>actions.setStatus(JSON.stringify({...value,[sourceId]:targetId}))),
      });
      const style = {inlineSize:v.narrow?"17rem":"34rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},table)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"3":"6"},table);
    }
    case "editable-grid": return element("Stack",{style:{width:"36rem",maxWidth:"100%"}},
      element("EditableGrid",{caption:"Inventory quantities",density:v.density,readOnly:v.readOnly,
        columns:binding("columns",gridPreviewColumns),rows:v.emptyRows ? [] : binding("rows",actions.gridRows),
        onChanges:binding("applyChanges",actions.setGridChanges)}));
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
        columnLayout: v.fixedColumns ? "fixed" : undefined,
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
        minWidth: v.fixedColumns ? "61rem" : "min-content",
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
      const records = v.longList ? [...notificationTriggerItems,...notificationHistory] : notificationTriggerItems;
      const items = records.map((item,index) => ({...item,unread:actions.inbox.unread[item.id] ?? (index < Number(v.demoUnread))}));
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
        filter:binding("inboxFilter",actions.inbox.filter),onFilterChange:binding("setInboxFilter",actions.inbox.setFilter),
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
        loadingPlaceholder:{rows:[
          {media:Boolean(v.showMedia),descriptionLines:v.constrainWidth?2:1,metadata:true,action:true},
          {metadata:true,action:true},
          {titleLines:v.constrainWidth?2:1,metadata:true,action:true},
        ]},
        onUnreadChange:binding("(id, unread) => setInboxUnread(current => ({...current, [id]: unread}))",actions.inbox.set),
        onMarkAllRead:v.showMarkAll ? binding("() => setInboxUnread({mention: false, export: false, settings: false})",actions.inbox.markAll) : undefined,
      });
    }
    case "notification-list-skeleton": return element("NotificationListSkeleton", {
      label:"Loading project notifications…",density:v.density,animate:v.animate,
      style:{width:v.constrainWidth?"16rem":"28rem",maxInlineSize:"100%"},
      rows:[
        {media:Boolean(v.showMedia),descriptionLines:v.constrainWidth?2:1,metadata:true,action:Boolean(v.showActions)},
        {metadata:true,action:Boolean(v.showActions)},
        {titleLines:v.constrainWidth?2:1,metadata:true,action:Boolean(v.showActions)},
      ],
    });
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
    case "color-contrast": {
      const [foreground,background] = {
        "brand on charcoal":["#ff47a8","#262626"], "gray on white":["#777","#fff"],
        "black on white":["#000","#fff"], "same color":["#262626","#262626"],
      }[String(v.scenario)]!;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"15rem":"28rem",maxInlineSize:"100%"}},
        element("ColorContrast",{foreground,background,textSize:v.textSize,sample:"Your changes have been saved."}));
    }
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
    case "color-filter": return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"20rem":"27rem",maxInlineSize:"100%"}},
      element("Inline",{gap:"2",align:"center"},element("SearchInput",{"aria-label":"Search images",placeholder:"Search images…",controlSize:"sm",
        style:{inlineSize:v.narrow?"8rem":"13rem",maxInlineSize:"100%"}}),
        element("ColorFilter",{value:binding("status || null",actions.status||null),
          onValueChange:binding("value => setStatus(value ?? '')",(value:string|null)=>actions.setStatus(value??"")),
          presets:v.presets?["#aa6451","#758969","#496581","#e0c291"]:undefined})));
    case "color-picker": return element("div",{style:{width:"24rem",maxWidth:"100%"}},element("ColorPicker",{key:String(v.allowAlpha),allowAlpha:v.allowAlpha,label:"Accent color",defaultValue:v.allowAlpha?"#ff47a899":"#ff47a8",name:"accent",controlSize:v.controlSize,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,presets:v.presets?["#ff47a8","#ffffff","#78b8ff","#65c99c"]:undefined}));
    case "gradient-editor": return element("div",{style:{width:"28rem",maxWidth:"100%"}},element("GradientEditor",{
      label:"Gradient",controlSize:v.controlSize,readOnly:v.readOnly,disabled:v.disabled,
      value:binding("gradient",actions.gradient),onValueChange:binding("setGradient",actions.setGradient),
    }));
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
    case "starter-pack-preview": {
      const people = v.scenario === "People and feeds" ? [
        {id:"maya",name:"Maya Chen"},{id:"sam",name:"Sam Rivera"},{id:"noah",name:"Noah Park"},
        {id:"alex",name:"Alex Morgan"},{id:"leila",name:"Leila Santos"},{id:"jules",name:"Jules Martin"},
      ] : [];
      const feeds = v.scenario === "Empty" ? [] : [
        {id:"workbench",label:"Type workbench"},{id:"in-use",label:"Lettering in use"},{id:"critique",label:"Open critique"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"}},
        element("StarterPackPreview",{
          title:"Independent type designers",curator:"Maya Chen",
          description:"Type releases, work in progress, and open critiques.",
          people,feeds,
        }));
    }
    case "profile-summary": {
      const name = v.longProfile ? "Alexandra Konstantinova" : "Maya Chen";
      const followCode = `<FollowButton subject={${JSON.stringify(name)}} state={status === "following" ? "following" : "not-following"}
          onAction={intent => setStatus(intent === "follow" ? "following" : "")} />`;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"22rem",maxInlineSize:"100%"}},
        element("ProfileSummary",{name,handle:v.longProfile?"@alexandra-konstantinova.design.example":"@mayachen",
          description:v.details?"Designing collaboration tools for small teams.":undefined,
          facts:v.details?[{id:"followers",label:"followers",value:248},{id:"following",label:"following",value:96}]:undefined,
          actions:v.follow?binding(followCode,<Flood.FollowButton subject={name}
            state={actions.status === "following" ? "following" : "not-following"}
            onAction={intent=>actions.setStatus(intent === "follow" ? "following" : "")} />):undefined}));
    }
    case "reply-audience": {
      const {draft,setDraft} = actions.composer;
      const audience = element("ReplyAudience",{
        value:binding("audience",actions.replyAudience),disabled:v.disabled,
        onValueChange:binding(v.accept?"setAudience":"() => {}",v.accept?actions.setReplyAudience:()=>{}),
        options:[{id:"anyone",label:"Anyone can reply"},{id:"members",label:"Members only"},
          {id:"invited",label:"Invited reviewers",disabled:true},{id:"closed",label:"Replies off"}],
      });
      return element("MessageComposer",{style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"},
        label:"Post",placeholder:"Write an update…",sendLabel:"Publish",sendPresentation:"label",
        value:binding("draft",draft),onValueChange:binding("setDraft",setDraft),
        onSend:binding('() => setDraft("")',()=>setDraft("")),
        leadingActions:binding(printRecipe(audience,new Set(),new Set()),renderRecipe(audience))});
    }
    case "notification-subscription": {
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"}},
        element("Section",{title:"Export permissions",headingSize:"group"},
          element("Inline",{gap:"2"},
            element("NotificationSubscription",{label:"Notifications for Export permissions",value:binding("mode",actions.subscriptionMode),
              onValueChange:binding(v.accept?"setMode":"() => {}",v.accept?actions.setSubscriptionMode:()=>{}),disabled:v.disabled}),
            element("ParticipantPopover",{label:"Subscribers",participants:[{id:"sam",name:"Sam Rivera",detail:"Reviewer"}]}))));
    }
    case "notification-channel-settings": {
      const events: Flood.NotificationChannelEvent[] = [
        {id:"mentions",label:"Mentions and replies",enabled:true},
        {id:"assignments",label:"New assignments",enabled:false},
        {id:"workspace",label:"Workspace announcements",description:"Set by your workspace.",enabled:true,readOnly:true},
      ];
      const enabled = actions.listSelection.email ?? true;
      const draft = events.map(event => ({...event,enabled:actions.listSelection[event.id] ?? event.enabled}));
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"25rem",maxInlineSize:"100%"}},
        element("NotificationChannelSettings",{
          label:"Email notifications",
          description:"Sent to maya@studio.example.",
          enabled:binding("listSelection.email ?? true",enabled),
          events:binding(`${JSON.stringify(events)}.map(event => ({...event, enabled: listSelection[event.id] ?? event.enabled}))`,draft),
          onEnabledChange:binding(v.accept?'enabled => setListSelection(current => ({...current, email: enabled}))':'() => {}',
            v.accept?(enabled:boolean)=>actions.setListSelection("email",enabled):()=>{}),
          onEventChange:binding(v.accept?'(id, enabled) => setListSelection(current => ({...current, [id]: enabled}))':'() => {}',
            v.accept?actions.setListSelection:()=>{}),
          disabled:v.disabled,
        }));
    }
    case "reminder-control": {
      const remindAt = reminderPresets.find(preset => preset.id === actions.viewValue)?.dateTime;
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("Section",{title:"Review export permissions",headingSize:"group"},
          element("ReminderControl",{
            label:"Review export permissions",presets:binding("presets",reminderPresets),
            remindAt:binding("remindAt",remindAt),disabled:v.disabled,
            onSchedule:binding(v.accept?"setPreset":"() => {}",v.accept?actions.setViewValue:()=>{}),
            onClear:binding(v.accept?'() => setPreset("")':"() => {}",v.accept?()=>actions.setViewValue(""):()=>{}),
          })));
    }
    case "estimate-menu": {
      const options = estimateOptions(v.scale);
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"24rem",maxInlineSize:"100%"}},
        element("Inline",{gap:"2",align:"center",style:{justifyContent:"space-between"}},
          element("Text",{size:"compact"},"Review export permissions"),
          element("EstimateMenu",{
            label:"Estimate",options:binding("options",options),value:binding("estimate",actions.estimate),disabled:v.disabled,
            onValueChange:binding(v.accept ? "id => setEstimate(options.find(option => option.id === id) ?? null)" : "() => {}",
              (id:string|null) => { if (v.accept) actions.setEstimate(options.find(option => option.id === id) ?? null); }),
          })));
    }
    case "snooze-menu": {
      const until = snoozePresets.find(preset => preset.id === actions.viewValue)?.until;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"24rem",maxInlineSize:"100%"}},
        element("Section",{title:"Review export permissions",headingSize:"group"},
          element("Inline",{gap:"3"},
            element("SnoozeMenu",{
              label:"Snooze export notification",presets:binding("presets",snoozePresets),
              snoozedUntil:binding("until",until),
              onSnooze:binding(v.accept?"setPreset":"() => {}",v.accept?actions.setViewValue:()=>{}),
              onClear:binding(v.accept?'() => setPreset("")':"() => {}",v.accept?()=>actions.setViewValue(""):()=>{}),
              disabled:v.disabled,
            }),
            element("Text",{size:"helper",tone:"subtle",role:"status"},
              binding('until ?? ""',until??"")),
          )));
    }
    case "identity-verification-badge": {
      const issuers = [
        {id:"guild",name:"Independent Press Guild",detail:"Active member",href:"/components/citation"},
        {id:"studio",name:"Northstar Newsroom",detail:"Staff journalist"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:"18rem",maxInlineSize:"100%"}},
        element("Inline",{gap:"3",align:"center"},element("Avatar",{name:"Maya Chen",size:"sm",decorative:true}),
          element("Stack",{gap:"0"},element("Inline",{gap:"1",align:"center"},element("Text",{size:"label"},"Maya Chen"),
            element("IdentityVerificationBadge",{label:"Maya Chen’s verified identity",
              issuers:v.evidence==="No evidence"?[]:v.evidence==="Single issuer"?issuers.slice(0,1):issuers})),
            element("Text",{tone:"subtle",size:"helper"},"@maya.northstar.news"))));
    }
    case "participant-popover": {
      const participants = [
        {id:"maya",name:"Maya Chen",detail:"Issue owner"},
        {id:"sam",name:"Sam Rivera",detail:"Reviewer"},
        {id:"lee",name:"Lee Park",detail:"Support"},
        {id:"alex",name:"Alex Morgan",detail:"Engineering"},
        {id:"nia",name:"Nia James",detail:"Documentation"},
        {id:"eli",name:"Eli Nguyen",detail:"Design"},
        {id:"jules",name:"Jules Cohen",detail:"Product"},
        {id:"noah",name:"Noah Patel",detail:"Release coordinator"},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:"Export permissions",headingSize:"group"},
          element("Inline",{gap:"2"},element("ParticipantPopover",{label:"Subscribers",emptyLabel:"No subscribers",
            participants:v.roster==="Empty"?[]:v.roster==="Full roster"?participants:participants.slice(0,2)}))));
    }
    case "collaborator-presence": {
      const activity = [
        {id:"maya",name:"Maya Chen",activity:"editing"},
        {id:"sam",name:"Sam Rivera",activity:"viewing"},
        {id:"lee",name:"Lee Park",activity:"viewing"},
        {id:"nia",name:"Nia James",activity:"editing"},
        {id:"eli",name:"Eli Nguyen",activity:"viewing"},
      ] as const;
      const presence: Flood.CollaborationPresence = v.scenario === "Unavailable" ? {status:"unavailable"}
        : v.scenario === "Reconnecting" ? {status:"reconnecting",people:activity}
          : {status:"live",people:v.scenario === "Empty" ? [] : activity};
      const toolbar = element("AppTopBar",{
        start:binding('<Heading size="group">Export policy</Heading>',<Flood.Heading size="group">Export policy</Flood.Heading>),
        end:binding(`<CollaboratorPresence presence={${JSON.stringify(presence)}} />`,<Flood.CollaboratorPresence presence={presence} />),
      });
      const style = {inlineSize:v.narrow?"16rem":"33rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},toolbar)
        : element("Surface",{style,elevation:v.surface,padding:"0"},toolbar);
    }
    case "thread-trigger": {
      const replies = [
        {id:"sam",author:{name:"Sam Rivera"},body:"Found the original export."},
        {id:"lee",author:{name:"Lee Park"},body:"I’ll compare it with the approved version."},
      ].slice(0,v.replies==="None"?0:v.replies==="One"?1:2);
      const ownReplies = actions.thread.replies.map(reply=>({...reply,author:{name:"Alex Morgan"}}));
      const items = [...replies,...ownReplies];
      const newestReply = replies.length === 1 ? "2026-11-16T10:31:00Z" : "2026-11-16T10:42:00Z";
      const threadProps: Flood.ThreadTriggerProps = {
        replyCount: replies.length, unread: Boolean(v.unread && replies.length),
        participants:v.showDetails ? replies.map(({id,author})=>({id,name:author.name})) : undefined,
        latestReply:v.showDetails && replies.length ? {dateTime:newestReply} : undefined,
      };
      const body = element("Stack",{gap:"3"},
        element("CommentThread",{"aria-label":"Replies",size:"sm",hidden:binding(`${replies.length} + replies.length === 0`,!items.length),
          items:binding(`[...${JSON.stringify(replies)}, ...replies.map(reply => ({...reply, author:{name:"Alex Morgan"}}))]`,items)}),
        element("MessageComposer",{layout:"compact",label:"Reply",placeholder:"Write a reply…",
          value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),
          onSend:binding("submitReply",actions.thread.submit)}));
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"28rem",maxInlineSize:"100%"}},
        element("Comment",{author:{name:"Maya Chen"},size:"sm"},
          element("Stack",{gap:"1"},element("Text",{as:"p",size:"compact"},"Can someone check the original export?"),
            element("Popover",{title:replies.length?"Replies":"Reply",align:"start",
              trigger:binding(`(props) => <ThreadTrigger {...props} {...${JSON.stringify(threadProps)}} replyCount={${replies.length} + replies.length} latestReply={replies.length ? undefined : ${JSON.stringify(threadProps.latestReply) ?? "undefined"}} />`,
                (props:Flood.OverlayTriggerProps)=><Flood.ThreadTrigger {...props} {...threadProps}
                  replyCount={items.length} latestReply={ownReplies.length ? undefined : threadProps.latestReply}/>)},body))));
    }
    case "group-read-receipt": {
      const readers = [
        {id:"sam",name:"Sam Rivera",detail:"10:31"},
        {id:"lee",name:"Lee Park",detail:"10:42"},
      ].slice(0,v.readers==="None"?0:v.readers==="One"?1:2);
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("Comment",{author:{name:"Maya Chen"},size:"sm"},
          element("Stack",{gap:"1"},element("Text",{as:"p",size:"compact"},"The original export is ready for review."),
            element("Inline",{gap:"1",align:"center"},
              element("Timestamp",{dateTime:"2026-11-16T10:24:00Z"},"10:24"),
              element("GroupReadReceipt",{readers,align:"start"}),
              ...(readers.length===0?[element("MessageReceipt",{state:"delivered"})]:[])))));
    }
    case "message-receipt": {
      const metadata = element("Inline",{gap:"2",align:"center"},
        element("Timestamp",{dateTime:"2026-11-16T10:24:00Z"},"10:24"),
        element("MessageReceipt",{state:v.state,announce:v.announce || undefined}));
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"15rem":"26rem",maxInlineSize:"100%"}},
        element("Comment",{author:{name:"Maya Chen"},size:"sm"},
          element("Stack",{gap:"1"},element("Text",{as:"p",size:"compact"},"The original export is ready for review."),metadata)));
    }
    case "typing-indicator": {
      const label = v.participants==="Nobody"?undefined:v.participants==="Two people"?"Maya Chen and Sam Rivera are typing":"Maya Chen is typing";
      const {draft,setDraft} = actions.composer;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"2"},
          element("TypingIndicator",{label,reserveSpace:v.reserveSpace}),
          element("MessageComposer",{layout:"compact",label:"Message",placeholder:"Write a message…",
            value:binding("draft",draft),onValueChange:binding("setDraft",setDraft),onSend:binding('() => setDraft("")',()=>setDraft(""))})));
    }
    case "generation-preview": {
      const state = v.state as Flood.GenerationPreviewResult["state"];
      const current = actions.status === "cancelled" || actions.status === "generating" ? actions.status : state;
      const partialImage = {src:"/comparison-line.png",alt:"Partial render of the weekly visits chart",fit:"contain" as const};
      const finalImage = {src:"/comparison-area.png",alt:"Weekly visits with a filled trend line",fit:"contain" as const};
      const imageFor = (phase: Flood.GenerationPreviewResult["state"]) =>
        phase === "ready" ? finalImage : phase === "generating" && v.partial ? partialImage : undefined;
      const media = imageFor(current);
      const result = {
        state:current, media:media && createElement(Flood.Image,media),
        message:current === "failed" ? "The export timed out." : undefined,
      };
      const stateCode = (phase: Flood.GenerationPreviewResult["state"]) => {
        const image = imageFor(phase);
        return `{state: ${JSON.stringify(phase)}${image ? `, media: <Image {...${JSON.stringify(image)}} />` : ""}${phase === "failed" ? ', message: "The export timed out."' : ""}}`;
      };
      const phaseCode = `(status || ${JSON.stringify(state)})`;
      const canStop = current === "queued" || current === "generating";
      return element("GenerationPreview",{title:"Weekly visits chart",ratio:2,elevation:"raised",announce:true,
        style:{width:v.narrow?"17rem":"30rem",maxInlineSize:"100%"},
        result:binding(`status === "cancelled" ? ${stateCode("cancelled")} : status === "generating" ? ${stateCode("generating")} : ${stateCode(state)}`,result),
        actions:binding(`${phaseCode} === "ready" ? null : ${phaseCode} === "queued" || ${phaseCode} === "generating" ? <Button size="sm" variant="ghost" onClick={() => setStatus("cancelled")}>Stop</Button> : <Button size="sm" variant="outline" onClick={() => setStatus("generating")}>Retry</Button>`,
          current === "ready" ? null : <Flood.Button size="sm" variant={canStop ? "ghost" : "outline"}
            onClick={()=>actions.setStatus(canStop ? "cancelled" : "generating")}>{canStop ? "Stop" : "Retry"}</Flood.Button>),
      });
    }
    case "feed-attribution": return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"14rem":"29rem",maxInlineSize:"100%"}},
      element("Stack",{gap:"2"},
        element("FeedAttribution",{
          label:v.narrow ? "Reposted by Bluesky in the community updates feed" : "Reposted by Bluesky",
          avatarSize:"sm",
          href:v.linked ? "https://bsky.app/profile/bsky.app" : undefined,
          icon:v.showIcon ? binding("<Repeat2 />",<Repeat2 />) : undefined,
        }),
        element("Comment",{size:"sm",author:{name:"U.S. Consumer Product Safety Commission"}},"Outlook down Bluesky up")));
    case "feed-update": {
      const count = v.updates === "unknown" ? "unknown" : Number(v.updates);
      const newPosts = [
        {id:"review",anchorId:"feed-first-new-post",author:{name:"Maya Chen"},body:"The revised mockups are ready for review."},
        {id:"research",author:{name:"Evan Foster"},body:"I added notes from the last customer calls."},
        {id:"export",author:{name:"Sam Rivera"},body:"The source export is in the project folder."},
      ].slice(0, count === "unknown" ? 3 : count);
      const posts = [
        {id:"anna",author:{name:"Anna Ortiz"},body:"The new file viewer keeps your place when you switch between files."},
        {id:"nora",author:{name:"Nora Park"},body:"The export now includes the original attachments."},
        {id:"sam",author:{name:"Sam Rivera"},body:"The next review is on Thursday."},
        {id:"evan",author:{name:"Evan Foster"},body:"The workspace settings are ready to test."},
      ];
      const load = (event: MouseEvent<HTMLButtonElement>) => {
        const frame = event.currentTarget.closest("[data-feed-example]");
        actions.setStatus("loaded");
        requestAnimationFrame(()=>frame?.querySelector<HTMLElement>("#feed-first-new-post")?.focus());
      };
      const loaded = actions.status === "loaded";
      const label = (n: number | "unknown") => n === "unknown" ? "Load new posts" : `Load ${n} new ${n === 1 ? "post" : "posts"}`;
      const update = element("FeedUpdate",{count:binding(`status === "loaded" ? 0 : ${JSON.stringify(count)}`,loaded?0:count),
        placement:v.placement,pending:v.pending,announcement:"New posts available",
        formatLabel:binding('(n) => n === "unknown" ? "Load new posts" : `Load ${n} new ${n === 1 ? "post" : "posts"}`',label),
        onLoad:binding('event => { const frame = event.currentTarget.closest("[data-feed-example]"); setStatus("loaded"); requestAnimationFrame(() => frame?.querySelector<HTMLElement>("#feed-first-new-post")?.focus()); }',load)});
      return element("Surface",{padding:"4",elevation:"raised","data-feed-example":true,
        style:{inlineSize:v.narrow?"17rem":"31rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("div",{style:{position:"relative",display:"flex",alignItems:"center",minBlockSize:"var(--flood-sys-control-sm-height)"}},
            element("Heading",{as:"h2",size:"group"},"Activity"),
            ...(v.placement === "header" ? [update] : [])),
          element("div",{style:{position:"relative"}},
            element("div",{},...(v.placement === "overlay" ? [update] : [])),
            element("ScrollArea",{"aria-label":"Team posts",style:{blockSize:"15rem"}},
              element("Stack",{gap:"3"},
                binding(`status === "loaded" && <CommentThread aria-label="New posts" items={${JSON.stringify(newPosts)}} />`,
                  loaded?createElement(Flood.CommentThread,{"aria-label":"New posts",items:newPosts}):null),
                element("CommentThread",{items:posts,"aria-label":"Earlier posts"}))))));
    }
    case "unread-marker": {
      const items = [
        {id:"review",author:{name:"Maya Chen"},body:"The review link is ready."},
        {id:"export",anchorId:"new-export-message",author:{name:"Sam Rivera"},body:"I added the original export."},
        {id:"permission",author:{name:"Maya Chen"},body:"The support team now has access."},
      ];
      return element("Surface",{padding:"4",elevation:"raised",
        style:{inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"}},
        element("CommentThread",{"aria-label":"Release discussion",items,
          unreadBoundary:v.allRead?undefined:{beforeId:"export",label:v.localized?"Unread messages since you last opened this discussion":undefined}}));
    }
    case "quoted-post": {
      const original = {author:{name:"Bluesky Team"},
        content:"We want fun, genuine, and respectful exchanges that build friendships.",
        href:"https://bsky.social/about/blog/10-31-2025-building-healthier-social-media-update"};
      const embedded = v.appearance === "embedded";
      const metadata = <Flood.Timestamp dateTime="2025-10-31" lang="en-GB">31 Oct 2025</Flood.Timestamp>;
      const post = embedded && !v.unavailable
        ? binding(`{...(${JSON.stringify(original)}),author:{name:"Bluesky Team",metadata:<Timestamp dateTime="2025-10-31" lang="en-GB">31 Oct 2025</Timestamp>}}`,
          {...original,author:{...original.author,metadata}})
        : v.unavailable ? undefined : original;
      const quote = element("QuotedPost",{post,appearance:v.appearance,openLabel:embedded ? "Bluesky blog" : undefined});
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"18rem":"32rem",maxInlineSize:"100%"}},
        embedded ? element("Section",{title:"Discussion guidelines",headingSize:"group"},quote)
        : element("Comment",{author:{name:"Maya Chen"},size:"sm"},
          element("Stack",{gap:"2"},
            element("Text",{as:"p",size:"compact"},"I’d keep this in mind while we revise our discussion guidelines."),
            quote)));
    }
    case "reply-reference": {
      const original = {id:"request",anchorId:"review-request",author:{name:"Maya Chen"},
        body:"Could you include the original attachment before we send this for review?"};
      const reply = {id:"answer",author:{name:"Sam Rivera"},body:"I added the source export to the review package."};
      const reference = element("ReplyReference",{
        label:v.unavailable?"Original message unavailable":"In reply to Maya Chen",
        excerpt:v.unavailable?undefined:original.body,href:v.unavailable?undefined:"#review-request",
      });
      const items = v.unavailable ? [] : [original];
      const source = `[${items.map(item=>JSON.stringify(item)).join(",")}${items.length?",":""}{...${JSON.stringify(reply)},replyReference:(${printRecipe(reference,new Set(),new Set())})}]`;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"18rem":"29rem",maxInlineSize:"100%"}},
        element("CommentThread",{"aria-label":"Attachment review",items:binding(source,[...items,{...reply,replyReference:renderRecipe(reference)}])}));
    }
    case "mention": {
      const mention = element("Mention",{
        handle:"bsky.app",label:v.alias?(v.rtl?"فريق بلوسكاي":"BlueskyProtocolDocumentation"):undefined,
        href:v.linked?"https://bsky.app/profile/bsky.app":undefined,
      });
      return element("Surface",{padding:"4",elevation:"raised",dir:v.rtl?"rtl":"ltr",lang:v.rtl?"ar":"en",
        style:{inlineSize:v.narrow?"13rem":"29rem",maxInlineSize:"100%"}},
        element("Comment",{author:{name:v.rtl?"مايا تشين":"Maya Chen"},size:"sm"},
          v.rtl?"اسألوا ":"Could you ask ",mention,v.rtl?" عن توقيت التحديث؟":" about the release timing?"));
    }
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
      const replyItems = [items[1], ...replies];
      const repliesDisclosure = v.discloseReplies ? {label:replyItems.length === 1 ? "1 reply" : `${replyItems.length} replies`} : undefined;
      const data = [{...items[0],replies:replyItems,repliesDisclosure}];
      const replyItemsCode = v.showComposer ? '[seed[1], ...replies.map(reply => ({...reply, author:{name:"Alex Morgan"}}))]' : '[seed[1]]';
      const disclosureCode = v.discloseReplies ? ', repliesDisclosure:{label:items.length === 1 ? "1 reply" : items.length + " replies"}' : '';
      const dataCode = `const items = ${replyItemsCode}; return [{...seed[0], replies:items${disclosureCode}}];`;
      const thread = element("CommentThread",{
        "aria-label":"Review comments",size:v.size,dividers:v.dividers,actionVisibility:v.actionVisibility,
        items:binding(`(() => { const seed = ${source}; ${dataCode} })()`,data),
      });
      const composer = element("CommentComposer",{
        label:"Reply",placeholder:"Write a reply…",sendLabel:"Post reply",
        style:{marginInlineStart:`calc(var(--flood-sys-control-${v.size}-height) + var(--flood-sys-space-2))`,inlineSize:"auto"},
        value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),onSend:binding("submitReply",actions.thread.submit),
      });
      return element("Stack",{gap:"3",style:{width:v.constrainWidth?"16rem":"29rem",maxInlineSize:"100%"}},thread,
        ...(v.showComposer ? [composer] : []));
    }
    case "review-thread": {
      const rejected = v.scenario === "Rejected";
      const failure = "The discussion status could not be saved. Try again.";
      const items = [{
        id:"maya",author:{name:"Maya Chen"},body:"Which version should we link in the release notes?",
        replies:[{id:"sam",author:{name:"Sam Rivera"},body:"Use the versioned accessibility guide so readers can match it to their release."}],
      }];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"32rem",maxInlineSize:"100%"}},
        element("ReviewThread",{
          title:"Release notes review",
          items,
          resolved:binding('status.startsWith("resolved")',actions.status.startsWith("resolved")),
          onResolvedChange:v.scenario==="Read only"?undefined:binding(
            rejected ? '(next) => setStatus(next ? "open:error" : "resolved:error")' : '(next) => setStatus(next ? "resolved" : "open")',
            (next:boolean)=>actions.setStatus(rejected?(next?"open:error":"resolved:error"):(next?"resolved":"open"))),
          pending:v.scenario==="Pending",
          error:rejected?binding(`status.endsWith(":error") ? ${JSON.stringify(failure)} : undefined`,
            actions.status.endsWith(":error")?failure:undefined):undefined,
          resolution:"Decision: link to the versioned accessibility guide.",
        }));
    }
    case "priority-indicator": {
      const requests = [
        ["urgent","Restore billing exports"], ["high","Improve search indexing"],
        ["medium","Review workspace roles"], ["low","Update empty-state copy"],
        ["none","Explore saved views"],
      ];
      return element("Surface",{elevation:"raised",style:{width:"27rem",maxInlineSize:"100%"}},
        element("Table",{caption:"Triage queue",hideCaption:true,density:"compact"},
          element("thead",{},element("tr",{},element("th",{scope:"col"},"Request"),element("th",{scope:"col"},"Priority"))),
          element("tbody",{},...requests.map(([level,request])=>element("tr",{},
            element("th",{scope:"row"},request),
            element("td",{},element("PriorityIndicator",{level,presentation:v.presentation,size:v.size})))))));
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
    case "media-credit": {
      const props: Flood.MediaCreditProps = {
        creator:{label:"Flood Studio"},
        source:v.scenario==="creator only"?undefined:v.scenario==="unverified"
          ? {label:"Design reference archive",href:"/components/image-gallery",unverified:true}
          : {label:"Chart documentation",href:"/docs/charts"},
        published:v.scenario==="published"?{dateTime:"2026-11-16",label:"Nov 16, 2026"}:undefined,
      };
      const credit = binding(`<MediaCredit {...${JSON.stringify(props)}} />`, <Flood.MediaCredit {...props}/>);
      return element("Figure",{caption:credit,style:{inlineSize:v.narrow?"15rem":"32rem",maxInlineSize:"100%"}},
        element("Image",{src:"/comparison-area.png",alt:"Weekly visits with a smooth area plot"}));
    }
    case "blockquote": return element("Blockquote",{attribution:v.attribution?"The Flood team":undefined},"Good interfaces make room for what matters.");
    case "commit-list": {
      const commits = [
        {sha:"e7093263eba6e9df48a73e9673f400bfaee2efff",shortSha:"e709326",message:"kb: add sentry to the kb search (#53126)",
          href:"https://github.com/supabase/supabase/commit/e7093263eba6e9df48a73e9673f400bfaee2efff",author:"dshukertjr",dateTime:"2026-11-16"},
        {sha:"5b644385f66aea62e476b2c9c7deb40612949f9e",shortSha:"5b64438",message:"Keep the source file when a preview expires",
          author:"Sam Rivera",dateTime:"2026-11-15"},
        {sha:"51bd16d3d42fc1d87f9c24bb65278ac52eec9f83",shortSha:"51bd16d",message:"Document the export retention window",
          author:"Maya Chen",dateTime:"2026-11-14"},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"18rem":"38rem",maxInlineSize:"100%"}},
        element("Section",{title:"Release commits",headingSize:"group"},
          element("CommitList",{label:"Commits",copy:v.showCopy,commits:v.empty?[]:commits,
            empty:v.empty?binding('<EmptyState title="No commits in this release" />',<Flood.EmptyState title="No commits in this release" />):undefined})));
    }
    case "data-freshness": return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"15rem":"30rem",maxInlineSize:"100%"}},
      element("Section",{title:"Billing data",headingSize:"group"},
        element("DataFreshness",{state:v.state,updatedAt:v.state==="pending"?undefined:"2026-11-16T08:10:00Z",
          relativeTo:v.relative?"2026-11-16T09:00:00Z":undefined})));
    case "review-revision": return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"30rem",maxInlineSize:"100%"}},
      element("Stack",{gap:"4"},
        element("ReviewRevision",{revision:"e70932645c171cabbe8d12c52ffc11dfc5d048d7",
          reviewedRevision:v.showPrevious?"7c00a18daac9491e4510d868d024beaea1019b4e":undefined,
          state:v.state,compareHref:"#review-revision-diff"}),
        ...(v.state === "stale" ? [element("Section",{id:"review-revision-diff",tabIndex:-1,title:"Changes since review",headingSize:"group"},
          element("DiffStat",{additions:10,deletions:3}))] : [])));
    case "git-ref": {
      const revisions = [
        {kind:"branch",value:"feature/billing/reconciliation/import-preview",environment:"Preview"},
        {kind:"tag",value:"v0.2.15",environment:"Production"},
        {kind:"commit",value:"4d8f39b6d02c3415c7193e09a6c8027ee189be22",environment:"Staging"},
      ];
      const embed = (item:ElementRecipe)=>binding(printRecipe(item,new Set(),new Set()),renderRecipe(item));
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"19rem":"36rem",maxInlineSize:"100%"}},
        element("Section",{title:"Recent deployments",headingSize:"group"},
          element("DataList",{"aria-label":"Deployments",density:"compact",dividers:false},...revisions.map(revision =>
            element("DataListItem",{
              title:embed(element("GitRef",{kind:revision.kind,value:revision.value,preserveEnd:revision.kind==="branch"?14:undefined})),
              metadata:embed(element("Text",{tone:"muted",size:"helper"},revision.environment)),
            })))));
    }
    case "http-exchange-details": {
      const outcome: Flood.HttpRequestOutcome = v.scenario === "Pending" ? {kind:"pending"}
        : v.scenario === "No response" ? {kind:"no-response"} : {kind:"response",code:v.scenario === "Empty body"?204:201};
      return element("Surface",{elevation:"raised",padding:v.narrow?"4":"6",style:{inlineSize:v.narrow?"19rem":"34rem",maxInlineSize:"100%"}},
        element("Section",{title:"Request details",headingSize:"group"},
          element("HttpExchangeDetails",{
            method:"POST",path:"/api/v2/exports/monthly",outcome,duration:outcome.kind==="pending"?undefined:"242 ms",
            request:{headers:[
              {id:"content-type",name:"content-type",value:"application/json"},
              {id:"trace",name:"x-request-id",value:"req_2f950a1f9b0aa4ac5d3af184a192834"},
            ],body:v.scenario === "Headers only" ? undefined : '{\n  "period": "2026-11",\n  "format": "csv"\n}'},
            response:{headers:[
              {id:"cache",name:"cache-control",value:"no-store"},
              {id:"vary-1",name:"vary",value:"accept-encoding"},
              {id:"vary-2",name:"vary",value:"origin"},
            ],body:v.scenario === "Headers only" ? undefined : v.scenario === "Empty body" ? "" : '{\n  "id": "exp_1042",\n  "status": "queued"\n}'},
          })));
    }
    case "row-change-details": {
      const before: Flood.RowChangeCapture = {coverage:"complete",row:{id:"exp_1042",status:"queued",finished_at:null}};
      const after: Flood.RowChangeCapture = {coverage:"complete",row:{id:"exp_1042",status:"ready",finished_at:"2026-11-16T12:14:08Z"}};
      const partial: Flood.RowChangeCapture = {coverage:"partial",row:{id:"exp_1042"}};
      const event: Flood.RowChangeEvent = v.scenario === "Insert" ? {operation:"insert",after}
        : v.scenario === "Delete" ? {operation:"delete",before:partial}
        : {operation:"update",after,before:v.scenario==="Partial before"?partial:v.scenario==="Missing before"?undefined:before};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"31rem",maxInlineSize:"100%"}},
        element("RowChangeDetails",{table:"public.exports",event,searchable:v.searchable,
          timestamp:{dateTime:"2026-11-16T12:14:08Z",label:"12:14:08 UTC"}}));
    }
    case "http-request-row": {
      const path = v.longPath ? "/api/v2/organizations/studio-north/workspaces/customer-portal/exports/monthly" : "/api/v2/exports/monthly";
      return element("Surface",{elevation:v.surface,padding:"4",style:{inlineSize:v.narrow?"19rem":"36rem",maxInlineSize:"100%"}},
        element("Section",{title:"Recent requests",headingSize:"group"},
          element("DataList",{"aria-label":"Recent requests",density:"compact",dividers:false},
            element("HttpRequestRow",{method:"POST",path,preservePathEnd:8,outcome:{kind:"response",code:201},duration:"242 ms",
              source:"exports-api",timestamp:{dateTime:"2026-11-16T12:14:08Z",label:"12:14:08"}}),
            element("HttpRequestRow",{method:"GET",path:"/api/v2/exports/latest",outcome:{kind:"no-response"},source:"exports-api",duration:"2.0 s"}),
            element("HttpRequestRow",{method:"GET",path:"/api/v2/exports/queue",outcome:{kind:"pending"},source:"worker"}),
          )));
    }
    case "http-method": {
      const requests = [
        {method:"GET",path:"/projects"},
        {method:"POST",path:"/exports"},
        {method:"PROPFIND",path:"/archive"},
        {method:"Report-Delta",path:"/changes"},
      ];
      const table = element("Table",{caption:"HTTP requests",density:"compact"},
        element("thead",{},element("tr",{},element("th",{scope:"col"},"Method"),element("th",{scope:"col"},"Path"))),
        element("tbody",{},...requests.map(({method,path}) => element("tr",{},
          element("td",{},element("HttpMethod",{method,variant:v.variant})),
          element("td",{},element("Text",{size:"compact",tone:"subtle",dir:"ltr"},path))))));
      const style = {inlineSize:v.narrow?"17rem":"26rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},table)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},table);
    }
    case "endpoint-label":
    case "http-status": {
      const requests = [
        {method:"GET",path:"/rest/v1/projects",code:200,reason:"OK"},
        {method:"POST",path:"/rest/v1/projects/{project_id}/review-requests/{request_id}/attachments",code:201,reason:"Created"},
        {method:"PATCH",path:"/rest/v1/projects/{project_id}/members/{member_id}",code:429,reason:"Too many requests"},
        {method:v.extension?"Report-Delta":"DELETE",path:"/rest/v1/projects/{project_id}/tokens/{token_id}",code:503,reason:"Service unavailable"},
      ];
      const embed = (item:ElementRecipe)=>binding(printRecipe(item,new Set(),new Set()),renderRecipe(item));
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"21rem":"39rem",maxInlineSize:"100%"}},
        element("Section",{title:"Recent API requests",headingSize:"group"},
          element("DataList",{"aria-label":"Requests",density:"compact",dividers:false},...requests.map(request =>
            element("DataListItem",{
              title:embed(element("EndpointLabel",{method:request.method,path:request.path,overflow:v.overflow,
                preserveEnd:v.keepEnding || slug === "http-status" ? 12 : undefined})),
              metadata:embed(element("HttpStatus",{code:request.code,reason:v.showReason?request.reason:undefined,
                style:v.showReason ? {inlineSize:"9rem"} : undefined})),
            })))));
    }
    case "inline-code": return element("Text",{as:"p",size:"compact"},"Import ",element("InlineCode",{size:v.size,wrap:v.wrap},v.longValue?"@/ui/project-settings/notifications/preferences":"@/ui/button")," in your project.");
    case "timestamp": return element("Timestamp", {dateTime:"2026-11-14T09:30:00Z",
      format:v.format, relativeTo:v.relativeTo?"2026-11-14T11:30:00Z":undefined,
      showExactTime:v.showExactTime || undefined,lang:v.locale,timeZone:v.timeZone,size:v.size});
    case "numeric-value": return element("Surface",{padding:"4",elevation:v.surface},
      element("Text",{as:"p",size:"label"},
        element("NumericValue",{value:Number(v.value),reserveFor:v.reserve?-9999:undefined,lang:v.locale,align:v.align}),
        " ",element("Text",{as:"span",size:"compact",tone:"subtle"},"credits remaining")));
    case "duration": {
      const table = element("Table",{caption:"Query timings",density:"compact"},
        element("thead",{},element("tr",{},element("th",{scope:"col"},"Operation"),
          element("th",{scope:"col","data-numeric":true},"Duration"))),
        element("tbody",{},...(["Search files","Read cached result","Check empty queue"] as const).map((label,index) =>
          element("tr",{},element("th",{scope:"row"},label),
            element("td",{"data-numeric":true},element("Duration",{
              milliseconds:[2107.797,0.0004,0][index],unit:v.unit,maximumFractionDigits:Number(v.precision),lang:v.locale,
            }))))));
      const style = {inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},table)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},table);
    }
    case "timestamp-link": {
      const timestamp = element("TimestampLink", {href:"#export-review", dateTime:"2026-11-14T09:30:00Z",
        format:"time", relativeTo:v.relativeTo ? "2026-11-14T11:30:00Z" : undefined,
        "aria-label":v.relativeTo ? "2 hours ago, link to Maya Chen’s comment" : "9:30 AM, link to Maya Chen’s comment"});
      const thread = element("Stack", {gap:"4", style:{inlineSize:"24rem",maxInlineSize:"100%"}},
        element("Comment", {id:"export-review",tabIndex:-1,author:binding(
          `{name:"Maya Chen", metadata:${printRecipe(timestamp,new Set(),new Set())}}`,
          {name:"Maya Chen",metadata:renderRecipe(timestamp)},
        )}, "The original export is attached to the review."),
        element("Comment", {author:binding(
          '{name:"Sam Rivera", metadata:<Timestamp dateTime="2026-11-14T09:46:00Z" format="time" />}',
          {name:"Sam Rivera",metadata:<Flood.Timestamp dateTime="2026-11-14T09:46:00Z" format="time" />},
        )}, "Thanks. The totals match the source."));
      return v.surface === "canvas" ? thread : element("Surface",{elevation:v.surface,padding:"4",style:{maxInlineSize:"100%"}},thread);
    }
    case "highlight-text": {
      const match = element("Text",{as:"p"},element("HighlightText",{
        query:v.query === "none"?"":v.query,caseSensitive:v.caseSensitive || undefined,
      },"Export settings are included in the monthly export [PDF]."));
      return v.surface === "canvas" ? match : element("Surface",{elevation:v.surface,padding:"4"},match);
    }
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
      const label = v.showChartLabel ? "Six-month trend" : "Six months of revenue with two dips and a new high in the latest month";
      return element("MetricCard",{
        metric:{label:"Monthly revenue",value:v.state==="ready"?"$24,580":null,state:v.state,size:v.size,
          trend:v.showComparison?{direction:"up",tone:"success",label:"12.8% higher",context:"vs last month",variant:v.comparisonStyle}:undefined},
        layout:v.layout,style:{width:v.narrow?"12rem":"24rem",maxInlineSize:"100%"},
        chartLoading:v.showChart && v.chartState !== "follow metric" ? v.chartState === "loading" : undefined,
        chartMinHeight:v.showChart && v.showChartLabel ? "3.375rem" : undefined,
        chart:v.showChart?binding(`<Sparkline label={${JSON.stringify(label)}} values={${JSON.stringify(values)}}${v.showChartLabel ? " showLabel" : ""} />`,
          <Flood.Sparkline label={label} values={values} showLabel={Boolean(v.showChartLabel)}/>):undefined,
      });
    }
    case "metric-group": return element("MetricGroup",{
      label:"API performance",
      appearance:v.appearance,
      layout:v.layout,
      size:v.size,
      style:{inlineSize:v.narrow?(v.layout==="rows"&&v.longValue?"18rem":"15rem"):v.layout==="rows"?"24rem":"38rem",maxInlineSize:"100%"},
      items:[
        {id:"requests",label:"Requests",value:v.scenario==="loading"?null:v.scenario==="mixed"?0:"1.2M",state:v.scenario==="loading"?"loading":"ready"},
        {id:"latency",label:v.longLabel?"P95 response time across all regions":"P95 response time",value:v.scenario==="ready"?(v.longValue?"1,234.56":"186"):null,state:v.scenario==="ready"?"ready":"loading",unit:"ms",
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
    case "service-availability": {
      const days = Number(v.window);
      const history = v.scenario !== "No history";
      const healthy = v.scenario === "Healthy";
      const dateLabel = new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
      const periods = Array.from({length:days},(_,index) => {
        const date = new Date(Date.UTC(2026,10,17-days+index));
        return {id:date.toISOString().slice(0,10),label:dateLabel.format(date)};
      });
      const services: Flood.ServiceAvailabilityEntry[] = ["API","Builds","Deployments"].map((label,index)=>({
        id:label.toLowerCase(),label,
        currentStatus:!healthy&&index===1?{label:"Degraded",tone:"warning"}:{label:"Operational",tone:"success"},
        summary:history&&healthy?"100% uptime":undefined,
        observations:Object.fromEntries(periods.flatMap(({id},position) => {
          const daysAgo=days-position-1;
          if (!healthy && index===2 && daysAgo>=17 && daysAgo<=19) return [];
          const status = !healthy && daysAgo===6 && index<2 ? (index===0?"degraded":"outage")
            : !healthy && index===1 && daysAgo<2 ? "degraded" : "operational";
          return [[id,{status,detail:status==="outage"?"Workers could not start new builds.":undefined}]];
        })),
      }));
      return element("Surface",{padding:"4",elevation:"raised",style:{width:"40rem",maxWidth:"100%"}},
        element("ServiceAvailability",{
          title:"Service availability",
          description:history?`Past ${days} days`:undefined,
          periods:history?periods:[],
          services:v.scenario==="No services"?[]:services,
        }));
    }
    case "uptime-history": {
      const size = Number(v.window);
      const dateLabel = new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
      const periods: Flood.UptimePeriod[] = Array.from({length:size},(_,index) => {
        const date = new Date(Date.UTC(2026,10,16-size+1+index));
        const position = size-index;
        const status = v.scenario==="No data"?"unknown"
          : v.scenario==="Healthy"?"operational"
          : position===22?"outage":position===11||position===27?"degraded":position===10?"unknown":"operational";
        return {id:date.toISOString().slice(0,10),label:dateLabel.format(date),status,
          detail:status==="outage"?"The export queue stopped for 38 minutes."
            : status==="degraded"?"Exports took longer than usual.":undefined};
      });
      return element("Surface",{padding:"4",elevation:"raised",style:{width:v.narrow?"18rem":"36rem",maxWidth:"100%"}},
        element("UptimeHistory",{
          label:"Export API",
          periods:v.scenario==="Empty"?[]:periods,
          summary:v.scenario==="Healthy"?"100% uptime":v.scenario==="Incidents"?(size===30?"99.91% uptime":"99.97% uptime"):undefined,
        }));
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
    case "connection-details": {
      const direct = {
        id:"direct", label:"Direct connection", description:"For long-lived servers and database migrations.",
        host:"db.studio.example", port:"5432", user:"postgres",
      };
      const methods = v.scenario === "empty" ? [] : v.scenario === "single" ? [direct] : [direct, {
        id:"transaction", label:"Transaction pooler", description:"For short-lived serverless requests. Disable prepared statements for this pooler.",
        host:"pooler.studio.example", port:"6543", user:"postgres.studio",
      }, {
        id:"session", label:"Session pooler", description:"For persistent clients on IPv4-only networks.",
        host:"pooler.studio.example", port:"5432", user:"postgres.studio",
      }];
      const profiles: Flood.ConnectionDetailsProps["profiles"] = methods
        .filter(method => method.id !== "transaction" || v.scenario !== "pooler removed")
        .map(({id,label,description,host,port,user}) => id === "direct" && v.scenario === "ipv4-only"
          ? {id,label,unavailableReason:"This endpoint requires IPv6. Choose Session pooler from an IPv4-only network."}
          : {id,label,description,connection:`postgresql://${user}:[PASSWORD]@${host}:${port}/studio?sslmode=require`,
              parameters:[
                {id:"host",label:"Host",value:host},{id:"port",label:"Port",value:port},
                {id:"database",label:"Database",value:"studio"},{id:"user",label:"User",value:user},
              ]});
      return element("Surface",{padding:"4",elevation:v.surface,style:{width:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("ConnectionDetails",{key:v.scenario === "single" ? "single" : "catalog",title:"Connect to Postgres",headingSize:"group",profiles}));
    }
    case "replication-status": {
      const mixed = v.scenario === "Mixed";
      const unavailable = v.scenario === "Unavailable";
      const nodes: Flood.ReplicationNode[] = v.scenario === "Empty" ? [] : [
        {id:"fra",label:"Frankfurt",role:"primary",status:{label:"Available",tone:"success"}},
        {id:"iad",label:"Northern Virginia",role:"replica",status:{label:"Available",tone:"success"},
          lagMilliseconds:unavailable ? undefined : 0},
        {id:"sin",label:"Singapore",role:"replica",
          status:mixed ? {label:"Behind",tone:"warning"} : {label:"Available",tone:"success"},
          lagMilliseconds:unavailable ? undefined : mixed ? 8400 : 0},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("Section",{title:"Database replication",headingSize:"group"},
          element("ReplicationStatus",{label:"Database nodes",nodes})));
    }
    case "service-endpoint-list": {
      const internal: Flood.ServiceEndpoint = {id:"internal",label:"Service discovery",protocol:"DNS",scope:"private",
        address:"warehouse-sync.production.internal"};
      const endpoints: Flood.ServiceEndpoint[] = v.scenario === "empty" ? [] : [internal];
      if(v.scenario === "network routes") endpoints.unshift(
        {id:"web",label:"Web",protocol:"HTTPS",scope:"public",address:"https://sync.example.com"},
        {id:"proxy",label:"TCP proxy",protocol:"TCP",scope:"public",address:"edge-gateway.example.net:14386"},
      );
      if(v.scenario === "provisioning") endpoints.unshift(
        {id:"web",label:"Web",protocol:"HTTPS",scope:"public",status:{label:"Provisioning",tone:"info"}},
      );
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"31rem",maxInlineSize:"100%"}},
        element("Section",{title:"Service networking",headingSize:"group"},
          element("ServiceEndpointList",{label:"Network addresses",endpoints})));
    }
    case "domain-verification": {
      const verified=v.scenario==="verified", missing=v.scenario==="missing";
      return element("Surface",{padding:"4",style:{width:v.narrow?"17rem":"36rem",maxWidth:"100%"}},element("DomainVerification",{
        domain:"api.studio.example",
        status:verified?{label:"Verified",tone:"success"}:missing?{label:"Record not found",tone:"error"}:{label:"Waiting for DNS",tone:"warning"},
        records:[
          {id:"cname",type:"CNAME",name:"api",value:"gateway-4n8t.service.example",status:{label:"Found",tone:"success"}},
          {id:"txt",type:"TXT",name:"_verify.api",value:"flood-domain-verification=1bb10d65835b46ae87bdbec9f8c161c4",
            status:verified?{label:"Found",tone:"success"}:missing?{label:"Missing",tone:"error"}:{label:"Pending",tone:"neutral"}},
        ],
      }));
    }
    case "retry-schedule": {
      const attempts: Flood.DeliveryAttempt[] = [
        { id:"first", number:1, dateTime:"2026-11-16T12:00:00Z", status:"failed", response:"HTTP 503 Service Unavailable" },
        { id:"second", number:2, dateTime:"2026-11-16T12:04:00Z", status:"failed", response:"Connection timed out" },
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"31rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("EndpointLabel",{method:"POST",path:"/hooks/invoice-paid"}),
          element("RetrySchedule",v.state==="exhausted"?{state:"exhausted"}:{state:"scheduled",
            nextAt:v.showDetails?"2026-11-16T12:06:00Z":undefined,
            relativeTo:"2026-11-16T12:04:00Z",remaining:v.showDetails?2:undefined}),
          element("DeliveryAttempts",{label:"Invoice webhook delivery attempts",attempts})));
    }
    case "delivery-attempts": {
      const attempts: Flood.DeliveryAttempt[] = [
        { id:"initial", number:1, dateTime:"2026-11-16T12:00:00Z", status:"failed", response:"HTTP 503 Service Unavailable" },
        { id:"retry", number:2, dateTime:"2026-11-16T12:01:00Z", status:"failed", response:"Connection timed out",
          details:{ label:"Attempt 2 response", content:"The receiver did not respond within 10 seconds." } },
      ];
      if (v.scenario === "Delivered") {
        attempts.push({ id:"latest", number:3, dateTime:"2026-11-16T12:06:00Z", status:"delivered", response:"HTTP 204 No Content" });
      }
      if (v.scenario === "Pending") {
        attempts.push({ id:"latest", number:3, dateTime:"2026-11-16T12:06:00Z", status:"pending" });
      }
      return element("Surface",{padding:"4",style:{width:v.narrow?"17rem":"32rem",maxWidth:"100%"}},
        element("Stack",{gap:"3"},element("EndpointLabel",{method:"POST",path:"/hooks/invoice-paid"}),
          element("DeliveryAttempts",{
          label:"Invoice webhook delivery attempts", attempts:v.empty?[]:attempts, timeZone:"UTC",
        })));
    }
    case "record-relation-form": {
      const source = {id:"pilot",title:"Start warehouse pilot",reference:"FUL-241"};
      const kinds = [
        {id:"blocked-by",label:"Blocked by",description:"This work waits for the selected record."},
        {id:"blocks",label:"Blocking",description:"The selected record waits for this work."},
        {id:"related",label:"Related"},
      ];
      const targets = [
        source,
        {id:"carrier",title:"Certify the carrier feed",reference:"FUL-212",kindIds:["blocked-by","related"]},
        {id:"support",title:"Train warehouse support",reference:"FUL-248",kindIds:["blocks","related"]},
        {id:"report",title:"Review import results",reference:"FUL-257"},
      ];
      const accepted = "Relationship added";
      const error = "This relationship conflicts with an existing dependency.";
      const form = element("RecordRelationForm",{
        "aria-label":"Add relationship",source,kinds,targets,pending:v.pending,
        value:binding("relationDraft",actions.relationDraft),
        onValueChange:binding('(next) => { setRelationDraft(next); setStatus(""); }',
          (next:Flood.RecordRelationDraft) => {actions.setRelationDraft(next);actions.setStatus("");}),
        onSubmit:binding(`() => setStatus(${JSON.stringify(v.accept?accepted:error)})`,
          ()=>actions.setStatus(v.accept?accepted:error)),
        error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
      });
      const items = targets.filter(target=>target.id===actions.relationDraft.targetId);
      const chosenKind = kinds.find(kind=>kind.id===actions.relationDraft.kindId);
      const outcome = element("RecordRelations",{label:"Saved relationships",groupHeadingLevel:3,
        groups:binding(`[{id:relationDraft.kindId,label:(${JSON.stringify(kinds)}).find(kind => kind.id === relationDraft.kindId)?.label ?? "",items:(${JSON.stringify(targets)}).filter(target => target.id === relationDraft.targetId)}]`,
          chosenKind ? [{id:chosenKind.id,label:chosenKind.label,items}] : [])});
      const body = binding(
        `status === ${JSON.stringify(accepted)} ? (${printRecipe(outcome,new Set(),new Set())}) : (${printRecipe(form,new Set(),new Set())})`,
        renderRecipe(actions.status===accepted ? outcome : form),
      );
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"19rem":"30rem",maxInlineSize:"100%"}},
        element("Section",{title:"Add relationship",headingSize:"group"},body));
    }
    case "record-relation-suggestion": {
      const pending = v.scenario === "Pending";
      const refused = v.scenario === "Refused";
      const message = "This issue moved to another team. Open it and review the relationship again.";
      const decision = binding('(decision) => setStatus(decision === "accept" ? "Relationship accepted." : "Suggestion dismissed.")',
        (choice:Flood.RecordRelationSuggestionDecision) => actions.setStatus(choice === "accept" ? "Relationship accepted." : "Suggestion dismissed."));
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"34rem",maxInlineSize:"100%"}},
        element("Section",{title:"Triage",headingSize:"group"},
          element("DataList",{density:"compact",dividers:false,"aria-label":"Suggested relationships"},
            element("RecordRelationSuggestion",{title:"Delayed warehouse callbacks",reference:"FUL-213",href:"/components/record-relations",
              relation:"Possible related issue",reason:"Both reports mention carrier callbacks timing out after a retry.",
              pendingDecision:pending?"accept":undefined,error:refused?message:undefined,onDecision:decision}))),status);
    }
    case "record-relations": return element("div",{style:{width:v.narrow?"17rem":"34rem",maxWidth:"100%"}},
      element("RecordRelations",{
        label:"Relationships",
        groups:v.empty?[]:[
          {id:"blocked-by",label:"Blocked by",items:[{id:"carrier",reference:"FUL-212",title:"Certify the warehouse carrier feed",
            href:"/components/project-update",status:v.showStatuses?{label:"In progress",tone:"info"}:undefined}]},
          {id:"blocking",label:"Blocking",items:[{id:"pilot",reference:"FUL-241",title:"Start the warehouse pilot",
            status:v.showStatuses?{label:"Planned",tone:"neutral"}:undefined}]},
        ],
      }));
    case "collection-import-review": {
      const exclusions = [{id:"video",reason:"Unsupported videos",count:8},{id:"text",reason:"Text-only posts",count:3}];
      const assessment: Flood.CollectionImportAssessment = v.scenario==="Unavailable"
        ? {state:"unavailable",reason:"The source collection could not be read."}
        : {state:"checked",eligible:v.scenario==="None eligible"?0:48,
          exclusions:v.scenario==="All eligible"?undefined:exclusions};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"25rem",maxInlineSize:"100%"}},
        element("CollectionImportReview",{source:"Editorial references",destination:"Studio archive",assessment}));
    }
    case "batch-result": {
      const imported: Flood.BatchResultItem[] = [
        {id:"PO-186",label:"PO-186 · Field equipment",status:"succeeded"},
        {id:"PO-187",label:"PO-187 · Studio signage",status:"succeeded"},
        {id:"PO-188",label:"PO-188 · Backup drives",status:"succeeded"},
      ];
      const exceptions: Flood.BatchResultItem[] = [
        {id:"PO-189",label:"PO-189 · Shipping supplies",status:"failed",retryable:true,reason:"The accounting connection timed out."},
        {id:"PO-190",label:"PO-190 · Monitor stands",status:"failed",reason:"Create the vendor before importing this order."},
        {id:"PO-191",label:"PO-191 · Desk lamps",status:"skipped",reason:"This order has already been imported."},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{width:v.narrow?"18rem":"35rem",maxWidth:"100%"}},
        element("BatchResult",{
          title:"Purchase order import",items:v.scenario==="Empty"?[]:v.scenario==="Succeeded"?imported:[...imported,...exceptions],
          showSucceeded:v.showSucceeded,retryPending:v.pending,
          onRetry:binding('ids => setStatus(`Retry requested for ${ids.join(", ")}.`)',
            (ids:readonly string[])=>actions.setStatus(`Retry requested for ${ids.join(", ")}.`)),
        }),status);
    }
    case "pending-invitation-list": {
      const scope = (label: string) => v.scenario === "Mixed" ? label : undefined;
      const data: Flood.PendingInvitation[] = v.scenario === "Empty" ? [] : [
        {id:"alex",email:"alex@example.test",role:"Contributor",scope:scope("Customer portal"),state:"awaiting-acceptance",
          sentAt:{dateTime:"2026-11-14",label:"Nov 14"}},
        {id:"sam",email:"sam.rivera@example.test",role:"Viewer",scope:scope("Access reviews"),state:"expired"},
        {id:"casey",email:"casey.design-operations@example.test",role:"Viewer",scope:scope("Customer portal"),state:"delivery-failed"},
      ];
      const fallbackId = "invitation-review-preview";
      const renderActions = (invite: Flood.PendingInvitation) => <Flood.Inline gap="1">
        <Flood.Button size="sm" variant="ghost" aria-label={`Resend invitation to ${invite.email}`}
          onClick={()=>actions.setStatus(`Invitation resent to ${invite.email}.`)}>Resend</Flood.Button>
        {invite.state === "awaiting-acceptance" && <Flood.AlertDialog
          title="Revoke this invitation?" description={`The link sent to ${invite.email} will stop working.`} confirmLabel="Revoke invitation"
          getFallbackFocus={()=>document.getElementById(fallbackId)}
          onConfirm={()=>{actions.setListSelection(invite.id,true);actions.setStatus(`Invitation revoked for ${invite.email}.`);}}
          trigger={trigger=><Flood.Button {...trigger} size="sm" variant="ghost"
            aria-label={`Revoke invitation for ${invite.email}`}>Revoke</Flood.Button>} />}
      </Flood.Inline>;
      return element("Stack",{gap:"4"},element("Surface",{elevation:"raised",padding:"4",style:{width:v.narrow?"21rem":"42rem",maxWidth:"100%"}},
        element("Section",{title:"Invitations",headingSize:"group",id:fallbackId,tabIndex:-1},
          element("PendingInvitationList",{label:"Outstanding invitations",
            invitations:binding(`(${JSON.stringify(data)} as const).filter(invite => !listSelection[invite.id])`,data.filter(invite=>!actions.listSelection[invite.id])),
            renderActions:v.actions?binding(
              '(invite) => <Inline gap="1"><Button size="sm" variant="ghost" aria-label={`Resend invitation to ${invite.email}`} onClick={() => setStatus(`Invitation resent to ${invite.email}.`)}>Resend</Button>{invite.state === "awaiting-acceptance" && <AlertDialog title="Revoke this invitation?" description={`The link sent to ${invite.email} will stop working.`} confirmLabel="Revoke invitation" getFallbackFocus={() => document.getElementById("invitation-review-preview")} onConfirm={() => { setListSelection(current => ({...current,[invite.id]:true})); setStatus(`Invitation revoked for ${invite.email}.`); }} trigger={props => <Button {...props} size="sm" variant="ghost" aria-label={`Revoke invitation for ${invite.email}`}>Revoke</Button>} />}</Inline>',
              renderActions):undefined,
          }))),status);
    }
    case "session-list": {
      const data = [
        {id:"laptop",label:"Chrome on Windows",location:"London, UK",lastActive:{dateTime:"2026-11-16T15:20:00Z",label:"Active now"}},
        {id:"phone",label:"iPhone",location:"London, UK",lastActive:{dateTime:"2026-11-16T12:15:00Z",label:"Nov 16, 12:15"}},
        {id:"desktop",label:"Firefox on Linux",status:"unavailable" as const},
      ] as const;
      const entries = v.scenario==="Empty"?[]:v.scenario==="Current only"?data.slice(0,1):data;
      const glyphs = {laptop:{name:"Laptop",Icon:Laptop},phone:{name:"Smartphone",Icon:Smartphone},desktop:{name:"Monitor",Icon:Monitor}};
      const sessions = entries.map(entry=>({...entry,icon:createElement(glyphs[entry.id].Icon)}));
      const sessionCode = `[${entries.map(entry=>`{...${JSON.stringify(entry)}, icon:<${glyphs[entry.id].name} />}`).join(", ")}]`;
      const end = (session: Flood.AccountSession) => <Flood.AlertDialog title={`Sign out of ${session.label}?`}
        description="This device will need to sign in again." confirmLabel="Sign out"
        onConfirm={()=>actions.setStatus(`Sign-out requested for ${session.label}.`)}
        trigger={trigger=><Flood.Button {...trigger} size="sm" variant="ghost" aria-label={`Sign out of ${session.label}`}>Sign out</Flood.Button>}/>;
      return element("Surface",{padding:"4",elevation:"raised",style:{width:v.narrow?"18rem":"38rem",maxWidth:"100%"}},
        element("SessionList",{
          label:"Active sessions",currentId:v.scenario==="Current unknown"?undefined:"laptop",
          sessions:binding(sessionCode,sessions),
          renderEndAction:binding('session => <AlertDialog title={`Sign out of ${session.label}?`} description="This device will need to sign in again." confirmLabel="Sign out" onConfirm={() => setStatus(`Sign-out requested for ${session.label}.`)} trigger={trigger => <Button {...trigger} size="sm" variant="ghost" aria-label={`Sign out of ${session.label}`}>Sign out</Button>} />',end),
        }),status);
    }
    case "connected-account-list": {
      const accounts: Flood.ConnectedAccount[] = v.scenario === "Empty" ? [] : [
        {id:"work",provider:"GitHub",account:"maya-work",state:"connected"},
        {id:"personal",provider:"GitHub",account:"maya-personal",state:"reconnect"},
        {id:"calendar",provider:"Google Calendar",state:"disconnected"},
        {id:"slack",provider:"Slack",state:"unavailable",detail:"Disabled by your workspace"},
      ];
      const renderAction = (account: Flood.ConnectedAccount) => {
        if (account.state !== "connected" && account.state !== "reconnect") return;
        const reconnecting = account.state === "reconnect";
        const action = reconnecting ? "Reconnect" : "Manage";
        const title = `${action} ${account.account}`;
        return <Flood.Dialog title={title} description={reconnecting
          ? `Reauthorize ${account.provider} to restore access to this account.`
          : `This account is connected through ${account.provider}.`}
          trigger={trigger => <Flood.Button {...trigger} size="sm" variant={reconnecting ? "subtle" : "ghost"}
            aria-label={title}>{action}</Flood.Button>} />;
      };
      const list = element("Section",{title:"Connected accounts",headingSize:"group"},
        element("ConnectedAccountList",{label:"Connected accounts",accounts,
          renderAction:v.scenario === "Mixed connections" ? binding(
            'account => {\n    if (account.state !== "connected" && account.state !== "reconnect") return;\n    const reconnecting = account.state === "reconnect";\n    const action = reconnecting ? "Reconnect" : "Manage";\n    const title = `${action} ${account.account}`;\n    return <Dialog title={title} description={reconnecting ? `Reauthorize ${account.provider} to restore access to this account.` : `This account is connected through ${account.provider}.`} trigger={trigger => <Button {...trigger} size="sm" variant={reconnecting ? "subtle" : "ghost"} aria-label={title}>{action}</Button>} />;\n  }',
            renderAction,
          ) : undefined,
        }));
      const style = {inlineSize:v.narrow?"17rem":"38rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},list)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},list);
    }
    case "variable-reference-picker": {
      const references: Flood.VariableReferenceOption[] = [
        {id:"db-url",source:"Postgres",key:"DATABASE_URL"},
        {id:"db-host",source:"Postgres",key:"PRIVATE_HOST"},
        {id:"replica-url",source:"Read replica",key:"DATABASE_URL",disabled:v.scenario==="Limited",
          description:v.scenario==="Limited"?"Unavailable in this environment":undefined},
        {id:"region",source:"Shared",key:"DEFAULT_REGION"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"28rem",maxInlineSize:"100%"}},
        element("form",{onSubmit:binding("event => event.preventDefault()",(event:FormEvent)=>event.preventDefault())},
          {tag:"Field",props:{label:"Source variable",required:true},field:element("VariableReferencePicker",{
            name:"reference",references:v.scenario==="Empty"?[]:references,placeholder:"Search by service or key…",clearable:v.clearable,
          })}));
    }
    case "temporary-access-link": {
      const now = v.scenario === "Expired" ? "2026-11-17T09:30:00Z"
        : v.scenario === "Expiring" ? "2026-11-17T09:28:00Z" : "2026-11-17T09:00:00Z";
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"31rem",maxInlineSize:"100%"}},
        element("TemporaryAccessLink",{
          resource:v.access==="upload"?"November reconciliation":"November reconciliation.csv",
          access:v.access,
          state:v.scenario==="Unavailable" ? {status:"unavailable",reason:"The link has been revoked."}
            : {status:"issued",url:"https://files.example/reconciliation?token=preview",expiresAt:"2026-11-17T09:30:00Z"},
          now,
        }));
    }
    case "volume-mount-summary": {
      const attachment: Flood.VolumeAttachment = v.scenario === "Unknown" ? {state:"unknown"}
        : v.scenario === "Detached" ? {state:"detached"}
        : {state:v.scenario==="Pending"?"pending":"mounted",service:"Postgres",path:"/var/lib/postgresql/data"};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"}},
        element("VolumeMountSummary",{title:"Database volume",attachment,
          usage:v.scenario==="Unknown"?undefined:{used:4.2,capacity:5,warningAt:4,unit:"GB"}}));
    }
    case "storage-bucket-policy": {
      const unknown = v.scenario === "Unknown";
      const isPublic = v.scenario === "Public assets";
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:isPublic?"Brand assets":"Client uploads",headingSize:"group"},
          element("StorageBucketPolicy",{
            "aria-label":"Bucket policy",
            readAccess:unknown?"unknown":isPublic?"public":"private",
            uploadLimit:unknown?{source:"unknown"}:isPublic?{source:"bucket",bytes:8000000}:{source:"project",bytes:25000000},
            contentTypes:unknown?null:isPublic?["image/png","image/webp","image/svg+xml"]:[],
          })));
    }
    case "environment-variable-list": {
      const variables: Flood.EnvironmentVariable[] = v.scenario === "Empty" ? [] : [
        {id:"public-url",name:"PUBLIC_APP_URL",kind:"plain",value:v.scenario === "Production"
          ? "https://app.studio.example" : "https://review-portal-migration.preview.studio.example"},
        {id:"database",name:"DATABASE_URL",kind:"reference",source:"Postgres / PRIVATE_URL"},
        {id:"signing",name:"WEBHOOK_SIGNING_KEY",kind:"sealed"},
        {id:"prefix",name:"ASSET_PREFIX",kind:"plain",value:""},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:"Environment variables",headingSize:"group"},
          element("EnvironmentVariableList",{label:`${v.scenario === "Empty" ? "Preview" : v.scenario} variables`,variables})));
    }
    case "key-rotation-summary": {
      const retirement: Flood.KeyRetirement = v.scenario === "Scheduled"
        ? {mode:"scheduled",dateTime:"2026-11-19T16:45:00Z"}
        : {mode:v.scenario === "Immediate" ? "immediate" : "manual"};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:"Rotate warehouse key",headingSize:"group"},
          element("KeyRotationSummary",{
            current:{label:"Warehouse sync",fingerprint:"7f2a"},replacement:{label:"Warehouse sync v2",fingerprint:"a4c8"},retirement,
          })));
    }
    case "api-key-list": {
      const keys: Flood.ApiKeyRecord[] = v.scenario === "Empty" ? [] : [
        {id:"storefront",label:"Storefront",kind:"publishable",status:"active",scope:"Production"},
        {id:"warehouse",label:"Warehouse sync",kind:"secret",status:v.scenario === "Revoked" ? "revoked" : "active",
          scope:"Production",fingerprint:"•••• 7f2a",lastUsed:{dateTime:"2026-11-16T12:15:00Z",label:"Last used Nov 16"}},
        {id:"reporting",label:"Reporting job",kind:"secret",status:"expired",scope:"Staging",fingerprint:"•••• bb40"},
      ];
      const publicValue = "pk_example_storefront_8db7fq64q8vb6";
      const revoke = (key: Flood.ApiKeyRecord) => key.kind === "secret" ? <Flood.AlertDialog
        title={`Revoke ${key.label}?`} description="Requests using this key will lose access."
        confirmLabel="Revoke key" onConfirm={()=>actions.setStatus(`Revocation requested for ${key.label}.`)}
        trigger={trigger=><Flood.Button {...trigger} size="sm" variant="ghost" aria-label={`Revoke ${key.label}`}>Revoke</Flood.Button>}/> : undefined;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"34rem",maxInlineSize:"100%"}},
        element("Section",{title:"Project API keys",headingSize:"group"},
          element("ApiKeyList",{label:"Project API keys",keys,
            getPublishableValue:binding(`() => ${JSON.stringify(publicValue)}`,()=>publicValue),
            renderActions:binding('key => key.kind === "secret" ? <AlertDialog title={`Revoke ${key.label}?`} description="Requests using this key will lose access." confirmLabel="Revoke key" onConfirm={() => setStatus(`Revocation requested for ${key.label}.`)} trigger={trigger => <Button {...trigger} size="sm" variant="ghost" aria-label={`Revoke ${key.label}`}>Revoke</Button>} /> : undefined',revoke),
          })),status);
    }
    case "passkey-list": {
      const passkeys: Flood.PasskeyRecord[] = v.scenario === "Empty" ? [] : [
        {id:"work",label:"Work laptop",provider:"Windows Hello",added:{dateTime:"2026-11-10",label:"Nov 10"},
          lastUsed:{dateTime:"2026-11-16",label:"Nov 16"}},
        {id:"backup",label:"Backup security key",added:{dateTime:"2026-11-12",label:"Nov 12"},lastUsed:null},
        {id:"phone",label:"iPhone",provider:"iCloud Keychain",added:{dateTime:"2026-11-13",label:"Nov 13"}},
      ];
      const remove = (key: Flood.PasskeyRecord) => <Flood.AlertDialog
        title={`Remove ${key.label}?`} description="You will no longer be able to sign in with this passkey."
        confirmLabel="Remove passkey" onConfirm={()=>actions.setStatus(`Removal requested for ${key.label}.`)}
        trigger={trigger=><Flood.Button {...trigger} size="sm" variant="ghost" aria-label={`Remove ${key.label}`}>Remove</Flood.Button>}/>;
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("Section",{title:"Passkeys",headingSize:"group"},
          element("PasskeyList",{label:"Registered passkeys",passkeys,
            renderActions:v.scenario === "Registered" ? binding('key => <AlertDialog title={`Remove ${key.label}?`} description="You will no longer be able to sign in with this passkey." confirmLabel="Remove passkey" onConfirm={() => setStatus(`Removal requested for ${key.label}.`)} trigger={trigger => <Button {...trigger} size="sm" variant="ghost" aria-label={`Remove ${key.label}`}>Remove</Button>} />',remove) : undefined,
          })),status);
    }
    case "access-request-form": {
      const states: Record<string,Flood.AccessRequestState> = {
        Ready:{status:"ready"}, Sending:{status:"sending"}, Requested:{status:"requested"},
        Failed:{status:"failed",detail:"Couldn’t send your request. Try again."},
        Unavailable:{status:"unavailable",detail:"This project only allows invitations from its owners."},
      };
      const state = states[String(v.scenario)] ?? states.Ready;
      return element("Surface",{elevation:v.surface,padding:"6",style:{inlineSize:"26rem",maxInlineSize:"100%",textAlign:"start"}},
        element("Section",{title:"Project access",headingSize:"group"},
          element("AccessRequestForm",{
            resource:{id:"roadmap",label:"Release roadmap"}, account:"maya@example.test",
            state:binding(`status ? {status:"requested"} : ${JSON.stringify(state)}`,actions.status?states.Requested:state),
            message:v.showMessage?binding("{value:requestMessage,onChange:setRequestMessage,maxLength:300}",
              {value:actions.requestMessage,onChange:actions.setRequestMessage,maxLength:300}):undefined,
            onSubmit:binding('() => setStatus("Requested")',()=>actions.setStatus("Requested")),
          })));
    }
    case "sharing-panel": {
      const scopes: Flood.SharingScope[] = [
        {id:"restricted",label:"Restricted",description:"Only the people listed here can open this collection."},
        {id:"link",label:"Anyone with the link",description:"Anyone with the link can view this collection."},
        {id:"public",label:"Public",description:"Anyone can find and view this collection."},
      ];
      const error = "Access couldn’t be updated. Try again.";
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"}},
        element("SharingPanel",{
          title:"Share Type archive",scopes,pending:v.pending,
          members:[{id:"maya",name:"Maya Chen",role:"Owner"},{id:"sam",name:"Sam Rivera",role:"Editor"}],
          effectiveScope:binding("sharing.effective",actions.sharing.effective),
          draftScope:binding("sharing.draft",actions.sharing.draft),
          onDraftScopeChange:binding('(draft) => setSharing({...sharing,draft,error:undefined})',
            (draft:string)=>actions.setSharing({...actions.sharing,draft,error:undefined})),
          onApply:binding(v.fail ? `() => setSharing({...sharing,error:${JSON.stringify(error)}})` : '(scope) => setSharing({effective:scope,draft:scope})',
            (scope:string)=>actions.setSharing(v.fail?{...actions.sharing,error}:{effective:scope,draft:scope})),
          error:binding("sharing.error",actions.sharing.error),
          shareUrl:binding('sharing.effective !== "restricted" ? "https://example.com/collections/type-archive" : undefined',
            actions.sharing.effective!=="restricted"?"https://example.com/collections/type-archive":undefined),
        }));
    }
    case "access-invite-form": {
      const roles: Flood.AccessInviteRole[] = v.scenario === "No roles" ? [] : [
        {id:"viewer",label:"Viewer",description:"Can read project issues and reports."},
        {id:"contributor",label:"Contributor",description:"Can create and update issues in this project."},
        {id:"maintainer",label:"Maintainer",description:"Can change project settings and manage access."},
      ];
      return element("Stack",{gap:"4"},
        element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"27rem",maxInlineSize:"100%",textAlign:"start"}},
          element("Section",{title:"Invite to project",headingSize:"group"},
            element("AccessInviteForm",{
              scope:{id:"portal",label:"Customer portal"}, roles,
              value:binding("inviteDraft",actions.inviteDraft),
              onValueChange:binding('(next) => { setStatus(""); setInviteDraft(next); }',
                (next:Flood.AccessInviteDraft)=>{actions.setStatus("");actions.setInviteDraft(next);}),
              onSubmit:binding('(invite) => setStatus("Invitation sent to " + invite.email + ".")',
                (invite:Flood.AccessInviteDraft)=>actions.setStatus("Invitation sent to "+invite.email+".")),
              pending:v.scenario === "Sending",
              error:v.scenario === "Failed" && !actions.status ? "Couldn’t send the invitation. Try again." : undefined,
            }))),
        status);
    }
    case "permission-editor": {
      const groups: Flood.RolePermissionGroup[] = v.mode === "Empty" ? [] : [
        {id:"deployments",label:"Deployments",permissions:[
          {id:"view",label:"View deployments",granted:true,inheritedFrom:"Member"},
          {id:"deploy",label:"Start deployments",granted:false,description:"Deploy an approved build to Production."},
          {id:"rollback",label:"Roll back deployments",granted:true,description:"Restore the previous successful release."},
        ]},
        {id:"secrets",label:"Secrets",permissions:[
          {id:"rotate",label:"Rotate environment secrets",granted:false,inheritedFrom:"Production policy"},
        ]},
      ];
      const draft = groups.map(group=>({...group,permissions:group.permissions.map(permission=>
        ({...permission, granted:actions.listSelection[permission.id] ?? permission.granted}))}));
      const groupCode = `${JSON.stringify(groups)}.map(group => ({...group, permissions: group.permissions.map(permission => ({...permission, granted: listSelection[permission.id] ?? permission.granted}))}))`;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("PermissionEditor",{label:"Release operator",groups:binding(groupCode,draft),
          onGrantChange:v.mode === "Edit" ? binding('(id, granted) => setListSelection(current => ({...current, [id]: granted}))',actions.setListSelection) : undefined}));
    }
    case "access-summary": {
      const readOnly = v.mode === "Read only";
      const permissions: Flood.AccessPermission[] = [
        {id:"receipts",resource:"Receipts",access:"read",description:"Open receipts attached to expense reports."},
        {id:"notes",resource:"Review notes",access:readOnly?"read":"read-write",
          description:readOnly?"Read the notes attached to expense reports.":"Read and add notes to expense reports."},
        {id:"payments",resource:"Payments",access:"none",description:"Payments can only be sent by the Finance team."},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{width:v.narrow?"18rem":"36rem",maxWidth:"100%"}},
        element("AccessSummary",{
          actor:"Expense assistant",scope:"Finance workspace",actingFor:v.delegated?"Maya Chen":undefined,
          permissions:v.mode==="Empty"?[]:permissions,
        }));
    }
    case "version-history": {
      const versions = [
        {id:"handoff",label:"Handoff confirmed",description:"Maya Chen · Nov 16, 14:32",body:"The beta opens Friday at 10:00 UTC. Support will join the first handoff and monitor the first ten exports."},
        {id:"review",label:"Support review",description:"Sam Rivera · Nov 15, 11:20",body:"The beta opens Friday at 10:00 UTC. Send the export checklist to Support before inviting the first cohort."},
        {id:"draft",label:"Initial draft",description:"Maya Chen · Nov 13, 09:05",body:"Invite the first cohort after the dry run. Confirm the beta date after the final export check."},
      ];
      const bodies = Object.fromEntries(versions.map(version => [version.id, version.body]));
      const restore = (version: Flood.HistoryVersion) => <Flood.AlertDialog
        title="Restore this version?" description={`Request to restore “${version.label}”.`} confirmLabel="Request restore"
        onConfirm={() => actions.setStatus(`Restore requested for ${version.label}.`)}
        trigger={trigger => <Flood.Button {...trigger} size="sm" variant="subtle">Restore version</Flood.Button>} />;
      return element("Surface",{padding:"4",style:{width:v.narrow?"20rem":"40rem",maxWidth:"100%"}},
        element("VersionHistory",{
          label:"Launch notes versions", currentId:"handoff",
          versions:v.empty?[]:versions.map(({id,label,description})=>({id,label,description})),
          renderPreview:binding(
            `({id}) => <Text as="p">{(${JSON.stringify(bodies)} as Record<string, string>)[id]}</Text>`,
            ({id}: Flood.HistoryVersion) => <Flood.Text as="p">{bodies[id]}</Flood.Text>,
          ),
          renderRestore:v.allowRestore?binding(
            'version => <AlertDialog title="Restore this version?" description={`Request to restore “${version.label}”.`} confirmLabel="Request restore" onConfirm={() => setStatus(`Restore requested for ${version.label}.`)} trigger={trigger => <Button {...trigger} size="sm" variant="subtle">Restore version</Button>} />',
            restore,
          ):undefined,
        }),status);
    }
    case "content-report-form": {
      const reasons = [
        {id:"spam",label:"Spam",description:"Unwanted promotions or repeated posts."},
        {id:"harassment",label:"Harassment",description:"Content targeting or threatening someone."},
        {id:"other",label:"Something else",requiresDetails:true},
      ];
      const error = "Report could not be sent. Try again.";
      const accepted = "Report submitted";
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"19rem":"28rem",maxInlineSize:"100%"}},
        element("Section",{title:"Report post",headingSize:"group"},
          element("ContentReportForm",{
            reasons,
            subject:binding('<Text size="helper" tone="subtle">Post by @jules.example</Text>',
              <Flood.Text size="helper" tone="subtle">Post by @jules.example</Flood.Text>),
            draft:binding("reportDraft",actions.reportDraft),
            onDraftChange:binding('(draft) => { setReportDraft(draft); setStatus(""); }',
              (draft:Flood.ContentReportDraft)=>{actions.setReportDraft(draft);actions.setStatus("");}),
            onSubmit:binding(v.accept?`() => setStatus(${JSON.stringify(accepted)})`:`() => setStatus(${JSON.stringify(error)})`,
              ()=>actions.setStatus(v.accept?accepted:error)),
            error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
            pending:v.pending,
          }),
          element("Text",{size:"helper",tone:"subtle",role:"status"},
            binding(`status === ${JSON.stringify(accepted)} ? status : ""`,actions.status===accepted?accepted:""))));
    }
    case "content-report-status": {
      const reviews: Record<string,Flood.ContentReportReview> = {
        Submitted:{phase:"submitted"},
        "In review":{phase:"in-review"},
        "Action taken":{phase:"action-taken",summary:"We removed the comment because it contained an unsolicited promotion."},
        "No action taken":{phase:"no-action",summary:"We reviewed the comment and found that it did not violate our spam policy."},
      };
      const record = element("ContentReportStatus",{
        title:"Comment by @jules.example",reason:"Spam",submittedAt:{dateTime:"2026-11-14"},review:reviews[String(v.phase)],
      });
      const style = {inlineSize:v.narrow?"18rem":"28rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},record)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},record);
    }
    case "account-standing": {
      const standing = v.scenario==="At risk"?"at-risk":v.scenario==="Good standing"?"good":v.scenario==="Restricted"?"restricted":"unknown";
      const record = element("AccountStanding",{
        title:"Account standing",standing,
        activeStrikes:standing==="good"?0:standing==="at-risk"?2:standing==="restricted"?3:undefined,
        nextExpiry:standing==="at-risk"||standing==="restricted"?{dateTime:"2026-12-01"}:undefined,
        description:standing==="at-risk"?"Another violation may temporarily restrict posting."
          :standing==="restricted"?"You can read and reply to messages. Publishing is paused.":undefined,
        historyAction:v.showHistory?binding(
          '<Drawer title="Moderation history" size="sm" trigger={props => <Button {...props} size="sm" variant="subtle">View history</Button>}><ModerationNotice title="Posting restriction" headingLevel={3} effect="expired" reason="Unsolicited promotions in comments." /></Drawer>',
          <Flood.Drawer title="Moderation history" size="sm" trigger={props=><Flood.Button {...props} size="sm" variant="subtle">View history</Flood.Button>}>
            <Flood.ModerationNotice title="Posting restriction" headingLevel={3} effect="expired" reason="Unsolicited promotions in comments." />
          </Flood.Drawer>,
        ):undefined,
      });
      const style = {inlineSize:"28rem",maxInlineSize:"100%"};
      return v.surface==="canvas"?element("div",{style},record):element("Surface",{style,elevation:v.surface,padding:"4"},record);
    }
    case "moderation-notice": {
      const appealAction = <Flood.Dialog title="Appeal decision"
        trigger={props => <Flood.Button {...props} size="sm" variant="subtle">Appeal decision</Flood.Button>}>
        <Flood.Text>Include the context you want the reviewer to consider.</Flood.Text>
      </Flood.Dialog>;
      const deadline = {dateTime:"2026-11-23T12:00:00Z",children:"Nov 23, 12:00 UTC"};
      const appeals: Record<string,Flood.ModerationNoticeAppeal | undefined> = {
        "Can appeal":{state:"available",action:appealAction,deadline},
        "Appeal submitted":{state:"submitted"},
        "Decision upheld":{state:"upheld"},
        "Appeal accepted":{state:"overturned"},
        Expired:undefined,
      };
      const effect = v.scenario === "Appeal accepted" ? "reversed" : v.scenario === "Expired" ? "expired" : "active";
      const notice = element("ModerationNotice",{
        title:"Posting restriction",
        reason:"We found unsolicited promotions in several of your comments.",
        effect,
        endsAt:{dateTime:"2026-11-17T12:00:00Z",children:"Nov 17, 12:00 UTC"},
        appeal: v.scenario === "Can appeal" ? binding(
          `{ state: "available", deadline: ${JSON.stringify(deadline)}, action: <Link href="/moderation/appeals/new">Appeal decision</Link> }`,
          appeals["Can appeal"],
        ) : appeals[String(v.scenario)],
      });
      const style = {inlineSize:v.narrow?"18rem":"28rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},notice)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},notice);
    }
    case "moderation-appeal-form": {
      const decision = {id:"restriction-38",title:"Posting restriction",
        reason:"We found unsolicited promotions in several of your comments."};
      const accepted = "Appeal submitted";
      const error = "We couldn’t submit your appeal. Try again.";
      const submitted = actions.status === accepted;
      const outcome = element("ModerationNotice",{title:decision.title,reason:decision.reason,effect:"active",appeal:{state:"submitted"}});
      const form = element("ModerationAppealForm",{
          "aria-label":"Appeal decision",decision,maxLength:240,
          value:binding("draft",actions.composer.draft),
          onValueChange:binding('(next) => { setDraft(next); setStatus(""); }',
            (next:string)=>{actions.composer.setDraft(next);actions.setStatus("");}),
          onSubmit:binding(`() => setStatus(${JSON.stringify(v.accept?accepted:error)})`,
            ()=>actions.setStatus(v.accept?accepted:error)),
          pending:v.pending,
          error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
      });
      const body = binding(
        `status === ${JSON.stringify(accepted)} ? (${printRecipe(outcome,new Set(),new Set())}) : (${printRecipe(form,new Set(),new Set())})`,
        renderRecipe(submitted ? outcome : form),
      );
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"19rem":"30rem",maxInlineSize:"100%"}},
        element("Section",{title:"Appeal decision",headingSize:"group"},body));
    }
    case "content-label-settings": {
      const source: Flood.ContentLabelPreference[] = v.empty ? [] : [
        {id:"spoilers",label:"Spoilers",description:"Reveals a story or result.",visibility:"warn"},
        {id:"automated",label:"Automated posts",visibility:"show"},
        {id:"graphic",label:"Graphic imagery",visibility:"hide",lockedReason:"Set by your workspace."},
      ];
      const choices: Record<string,Flood.ContentLabelVisibility> = actions.status ? JSON.parse(actions.status) : {};
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"35rem",maxInlineSize:"100%"}},
        element("ContentLabelSettings",{
          title:"Community Moderation",
          preferences:binding(`(${JSON.stringify(source)} as const).map(row => ({...row,visibility: (JSON.parse(status || "{}") as Record<string, import("react").ComponentProps<typeof ContentLabelSettings>["preferences"][number]["visibility"]>)[row.id] ?? row.visibility}))`,
            source.map(row=>({...row,visibility:choices[row.id]??row.visibility}))),
          onVisibilityChange:binding(v.accept?'(id, next) => setStatus(JSON.stringify({...JSON.parse(status || "{}"), [id]:next}))':'() => {}',
            v.accept?(id:string,next:Flood.ContentLabelVisibility)=>actions.setStatus(JSON.stringify({...choices,[id]:next})):()=>{}),
        }));
    }
    case "muted-word-form": {
      const duplicate = "This phrase is already muted.";
      const submitMute = (draft:Flood.MutedWordDraft) => {
        if (draft.term.toLowerCase() === "season finale") {
          actions.setStatus(duplicate);
        } else {
          actions.setStatus(`Muted “${draft.term}”.`);
          actions.setMuteDraft(initialMuteDraft);
        }
      };
      return element("Stack",{align:"center"},
        element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"29rem",maxInlineSize:"100%",textAlign:"start"}},
          element("Section",{title:"Add muted word",headingSize:"group"},
            element("MutedWordForm",{
              value:binding("muteDraft",actions.muteDraft),
              onValueChange:binding('(next) => { setStatus(""); setMuteDraft(next); }',
                (next:Flood.MutedWordDraft)=>{actions.setStatus("");actions.setMuteDraft(next);}),
              onSubmit:binding(
                '(draft) => { if (draft.term.toLowerCase() === "season finale") { setStatus("This phrase is already muted."); return; } setStatus("Muted “" + draft.term + "”."); setMuteDraft(initialMuteDraft); }',
                submitMute),
              termError:binding(`status === ${JSON.stringify(duplicate)} ? status : undefined`,actions.status === duplicate ? duplicate : undefined),
              pending:v.pending,
            }))),
        element("Text",{size:"helper",tone:"subtle",role:"status"},
          binding(`status === ${JSON.stringify(duplicate)} ? "" : status`,actions.status === duplicate ? "" : actions.status)));
    }
    case "muted-word-list": {
      const rules: Flood.MutedWordRule[] = [
        {id:"finale",term:"season finale",scope:"text-and-tags",excludeFollowing:true,expiration:{dateTime:"2026-11-30T16:00:00Z",label:"Nov 30, 16:00 UTC"}},
        {id:"giveaway",term:"#giveaway",scope:"tags-only"},
      ];
      const restoreFocus = (button:HTMLButtonElement) => {
        const row = button.closest("li");
        const sibling = row?.nextElementSibling ?? row?.previousElementSibling;
        (sibling?.querySelector("button") ?? button.closest("section"))?.focus();
      };
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"31rem",maxInlineSize:"100%"}},
        element("MutedWordList",{
          tabIndex:-1,
          rules:binding(v.empty?"[]":`(${JSON.stringify(rules)} as const).filter(rule => !listSelection[rule.id])`,
            v.empty?[]:rules.filter(rule=>!actions.listSelection[rule.id])),
          renderRuleAction:v.actions?binding(
            '(rule) => <Button size="sm" variant="ghost" aria-label={\`Remove mute for \${rule.term}\`} onClick={event => { const button = event.currentTarget; const row = button.closest("li"); const sibling = row?.nextElementSibling ?? row?.previousElementSibling; (sibling?.querySelector("button") ?? button.closest("section"))?.focus(); setListSelection(current => ({...current,[rule.id]:true})); }}>Remove</Button>',
            (rule:Flood.MutedWordRule) => <Flood.Button size="sm" variant="ghost" aria-label={`Remove mute for ${rule.term}`}
              onClick={event=>{restoreFocus(event.currentTarget);actions.setListSelection(rule.id,true);}}>Remove</Flood.Button>,
          ):undefined,
        }));
    }
    case "filtered-image":
      return element("Grid",{maxColumns:2,minItemWidth:"12rem",gap:"3",
        style:{inlineSize:v.narrow?"16rem":"36rem",maxInlineSize:"100%"}},
        element("FilteredImage",{image:{src:"/comparison-line.png",alt:"Line chart showing two series"},ratio:1.6,visibility:v.visibility,
          blurredLabel:"Flagged image blurred"}),
        element("FilteredImage",{image:{src:"/comparison-area.png",alt:"Area chart showing two series"},ratio:1.6,visibility:"show"}));
    case "content-advisory": return element("div",{style:{width:v.narrow?"16rem":"28rem",maxWidth:"100%"}},
      element("ContentAdvisory",{
        title:"Contains the final result",
        description:v.description?"The chart shows which series ended higher.":undefined,
        showLabel:"Show chart",hideLabel:"Hide chart",
        mediaRatio:v.presentation==="media"?2:undefined,
      },element("Image",{src:"/comparison-line.png",alt:"Example line chart with two comparison series"})));
    case "project-health": {
      const report: Flood.ProjectHealthReport = v.scenario === "missing" ? {state:"missing"}
        : v.scenario === "not expected" ? {state:"not-expected"}
        : {state:v.scenario === "current" ? "current":"overdue",health:"at-risk",
            dateTime:"2026-11-14",dateLabel:"Nov 14",href:v.link?"/components/project-update":undefined};
      const healthDetails = (details: Flood.ProjectHealthReport) => binding(
        `<ProjectHealth report={${JSON.stringify(details)}} />`, <Flood.ProjectHealth report={details}/>,
      );
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"34rem",maxInlineSize:"100%"}},
        element("Section",{title:"Portfolio",headingSize:"group"},
          element("DataList",{"aria-label":"Project health",density:"compact",dividers:false},
            element("DataListItem",{title:"Warehouse rollout",details:healthDetails(report)}),
            element("DataListItem",{title:"Billing migration",details:healthDetails({
              state:"current",health:"on-track",dateTime:"2026-11-16",dateLabel:"Nov 16",
            })}),
          )));
    }
    case "dependency-schedule": {
      const finish = v.scenario === "Missing finish" ? undefined
        : v.scenario === "Forecast conflict" ? {date:"2026-11-20",kind:"forecast"}
        : {date:v.scenario === "Same day" ? "2026-11-17" : "2026-11-14",kind:"planned"};
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"17rem":"29rem",maxInlineSize:"100%"}},
        element("Section",{title:"Pilot dependency",headingSize:"group"},
          element("DependencySchedule",{
            predecessor:{label:"Carrier certification",finish},
            successor:{label:"Warehouse pilot",start:"2026-11-17"},
          })));
    }
    case "project-update": return element("div", {style:{width:v.narrow?"19rem":"37rem",maxWidth:"100%"}},
      element("ProjectUpdate",{
        title:"Carrier certification is complete", project:v.showProject?"Warehouse rollout":undefined,
        status:{label:"At risk",tone:"warning"}, author:{name:"Maya Chen"},
        postedAt:{dateTime:"2026-11-16T10:00:00Z",label:"Nov 16, 2026"},
        changes:v.showChanges?{label:"Changes since last update",items:[{id:"start",label:"Pilot start",before:"Nov 18",after:"Nov 20"}]}:undefined,
      },"The pilot moves to Friday so the team can verify export reconciliation before the first shipment."));
    case "service-incident": {
      const investigating = v.phase === "Investigating";
      const resolved = v.phase === "Resolved";
      const updates = [
        ...(resolved ? [{id:"resolved",title:"Connections recovered",dateTime:"2026-11-16T14:42:00Z",timeLabel:"14:42 UTC",
          description:"New connections have returned to normal in all regions."}] : []),
        ...(!investigating ? [{id:"mitigated",title:"Connection pool capacity restored",dateTime:"2026-11-16T14:26:00Z",timeLabel:"14:26 UTC",
          description:"Error rates are falling as connection pools recover."}] : []),
        {id:"started",title:"Elevated connection errors confirmed",dateTime:"2026-11-16T14:08:00Z",timeLabel:"14:08 UTC",
          description:"Some applications in Frankfurt could not open new database connections."},
      ];
      const incident = element("ServiceIncident",{
        title:"Trouble opening database connections",status:{label:v.phase,tone:resolved?"success":investigating?"warning":"info"},
        updates:investigating?[]:updates,
      }, resolved ? "New database connections are working normally again."
        : investigating ? "New connections in Frankfurt may time out."
        : "New connections in Frankfurt are recovering. Retries may still be needed.");
      const style = {inlineSize:v.narrow?"18rem":"34rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},incident)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},incident);
    }
    case "maintenance-window": {
      const phase = v.phase as Flood.MaintenanceWindowPhase;
      const timing = v.timing === "Across midnight"
        ? {start:"2026-11-30T23:30:00Z",end:"2026-12-01T01:00:00Z"}
        : v.timing === "Clock change"
          ? {start:"2026-11-01T05:30:00Z",end:"2026-11-01T06:30:00Z",timeZone:"America/New_York"}
          : {start:"2026-11-30T13:00:00Z",end:"2026-11-30T15:00:00Z"};
      const impact = {
        scheduled:"Existing pooled connections may disconnect briefly during the upgrade.",
        "in-progress":"Pooled connections may drop while traffic switches to the new version.",
        completed:"The upgrade is complete. Pooled connections are operating normally.",
        canceled:"The upgrade has been canceled. The pooler will remain available.",
      };
      const window = element("MaintenanceWindow",{title:"Connection pool upgrade",scope:"Shared pooler · Production",phase,...timing},impact[phase]);
      const style = {inlineSize:v.narrow?"16rem":"29rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},window)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},window);
    }
    case "service-runtime-status": {
      const states: Record<string,Flood.ServiceRuntimeState> = {
        Sleeping:{phase:"sleeping",since:"2026-11-18T09:41:00Z"},
        Waking:{phase:"waking",since:"2026-11-18T09:53:00Z",elapsedMilliseconds:2100},
        Running:{phase:"running",since:"2026-11-18T09:53:03Z",startupMilliseconds:3270},
        "Wake failed":{phase:"wake-failed",since:"2026-11-18T09:54:00Z",reason:"The process exited before it started accepting connections."},
        Unknown:{phase:"unknown"},
      };
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"17rem":"25rem",maxInlineSize:"100%"}},
        element("ServiceRuntimeStatus",{title:"Export worker",state:states[String(v.scenario)],announce:v.announce}));
    }
    case "deployment-health-check": {
      const configuration = {path:"/ready",timeoutSeconds:60};
      const states: Record<string,Flood.DeploymentHealthCheckState> = {
        Checking:{...configuration,phase:"checking",elapsedSeconds:28,lastProbe:{kind:"http",code:503,reason:"Warming up"}},
        Passed:{...configuration,phase:"passed",elapsedSeconds:34,lastProbe:{kind:"http",code:204,reason:"No Content"}},
        Timeout:{...configuration,phase:"failed",elapsedSeconds:60,lastProbe:{kind:"http",code:503,reason:"Service Unavailable"}},
        "No response":{...configuration,phase:"failed",elapsedSeconds:60,lastProbe:{kind:"no-response",reason:"Connection refused"}},
        "Not configured":{phase:"not-configured"},
      };
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"}},
        element("DeploymentHealthCheck",{state:states[String(v.scenario)],
          description:v.scenario==="Timeout"?"The endpoint did not become ready before the timeout.":undefined}));
    }
    case "deployment-rollback-dialog": {
      const current = {id:"dep-1042",label:"Restrict export link access"};
      const target = v.scenario === "Already live" ? current : {id:"dep-1038",label:"Stabilize preview exports"};
      return element("Stack",{gap:"3",align:"center"},
        element("DeploymentRollbackDialog",{
          current,target,
          description:"Production will serve the selected build with its original configuration.",
          unavailableReason:v.scenario === "Expired" ? "This build is past its retention window." : undefined,
          onConfirm:binding(
            '(targetId, currentId) => setStatus("Rollback requested: " + currentId + " → " + targetId)',
            (targetId:string, currentId:string) => actions.setStatus("Rollback requested: " + currentId + " → " + targetId),
          ),
          trigger:binding(
            '(props) => <Button {...props} variant="subtle">Review rollback</Button>',
            (props:Flood.OverlayTriggerProps) => <Flood.Button {...props} variant="subtle">Review rollback</Flood.Button>,
          ),
        }),
        status,
      );
    }
    case "restart-policy-editor":
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"28rem",maxInlineSize:"100%"}},
        element("form",{"aria-label":"Storage worker runtime settings"},
          element("RestartPolicyEditor",{
            layout:"aligned",legendSize:"section",controlSize:"sm",modeName:"restartPolicy",limitName:"maxRestarts",
            value:binding("restartPolicy",actions.restartPolicy),
            onValueChange:binding("setRestartPolicy",actions.setRestartPolicy),
            maxAllowedRestarts:v.restricted?10:undefined,
            unavailableModes:v.restricted?{always:"Always is unavailable on this plan."}:undefined,
            disabled:v.disabled,
          })));
    case "replica-allocation": {
      const options = [
        {id:"fra",label:"Frankfurt"},
        {id:"iad",label:"Virginia",lockedReason:v.locked?"Managed by production policy.":undefined},
        {id:"sin",label:"Singapore"},
      ];
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,
        style:{inlineSize:v.narrow?"18rem":"30rem",maxInlineSize:"100%"}},
        element("ReplicaAllocation",{
          title:"Regional replicas",minimum:1,maximum:4,disabled:v.disabled,
          regions:binding(`(${JSON.stringify(options)}).map(region => ({...region,replicas:replicaCounts[region.id]}))`,
            options.map(region=>({...region,replicas:actions.replicaCounts[region.id]}))),
          onReplicaChange:binding("(id, count) => setReplicaCounts(current => ({...current,[id]:count}))",actions.setReplicaCount),
        }));
    }
    case "deployment-handoff": {
      const states: Record<string,Flood.DeploymentHandoffState> = {
        Preparing:{phase:"preparing"}, Overlapping:{phase:"overlapping"},
        Draining:{phase:"draining",expectedEnd:{dateTime:"2026-11-16T14:32:00Z",children:"14:32 UTC"}},
        Completed:{phase:"completed"}, Failed:{phase:"failed",reason:"The readiness endpoint timed out."},
      };
      const handoff = element("Section",{title:"Production handoff",headingSize:"group"},
        element("DeploymentHandoff",{
          label:"Production release pair",
          previous:{id:"deploy-41",label:"Stabilize preview exports",revision:{kind:"commit",value:"e709326"}},
          replacement:{id:"deploy-42",label:"Restrict export link access",revision:{kind:"commit",value:"f5bc452"}},
          state:states[String(v.scenario)],
        }));
      const style = {inlineSize:v.narrow?"19rem":"34rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},handoff)
        : element("Surface",{style,padding:v.narrow?"4":"6",elevation:v.surface},handoff);
    }
    case "deployment-history": {
      const latest = v.scenario === "Active" ? "active" : v.scenario === "Building" ? "building" : "failed";
      const deployments = [
        {id:"run-42",label:"Validate export permissions",status:latest,
          revision:{kind:"commit",value:"f5bc452"},dateTime:"2026-11-16",
          description:latest==="failed"?"Health check timed out.":undefined},
        {id:"run-41",label:"Stabilize preview exports",status:latest==="active"?"superseded":"active",
          revision:{kind:"commit",value:"e709326"},dateTime:"2026-11-15"},
        {id:"run-40",label:"Add access checks to export links",status:"superseded",
          revision:{kind:"commit",value:"7c00a18"},dateTime:"2026-11-14"},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"19rem":"37rem",maxInlineSize:"100%"}},
        element("Section",{title:"Production deployments",headingSize:"group"},
          element("DeploymentHistory",{label:"Production deployments",deployments:v.scenario==="Empty"?[]:deployments,
            emptyContent:v.scenario==="Empty"?binding('<EmptyState title="No deployments yet" />',<Flood.EmptyState title="No deployments yet" />):undefined,
            renderActions:v.showActions?binding(
              '({id}) => <CopyButton value={id} copyLabel={`Copy deployment ID ${id}`} iconOnly variant="ghost" size="sm" />',
              ({id}:Flood.DeploymentRecord) => <Flood.CopyButton value={id} copyLabel={`Copy deployment ID ${id}`} iconOnly variant="ghost" size="sm" />,
            ):undefined})));
    }
    case "release-target-matrix": {
      const version = {label:"v2.14.0"};
      const staged: Flood.ReleaseTarget[] = [
        {id:"staging",label:"Staging",live:version,status:"released"},
        {id:"canary",label:"Canary",live:{label:"v2.13.0"},status:"deploying"},
        {id:"production",label:"Production",live:{label:"v2.13.0"},status:"failed",detail:"Readiness check timed out."},
        {id:"sandbox",label:"Sandbox",live:null,status:"not-started"},
        {id:"eu",label:"EU preview",status:"unknown"},
      ];
      const targets = v.scenario === "Empty" ? [] : v.scenario === "Released"
        ? staged.map(({id,label}) => ({id,label,live:version,status:"released" as const}))
        : staged;
      return element("Surface",{elevation:v.surface,padding:"4",style:{inlineSize:v.narrow?"19rem":"34rem",maxInlineSize:"100%"}},
        element("ReleaseTargetMatrix",{caption:"Rollout of v2.14.0",targets}));
    }
    case "evaluation-result": {
      const scenario = String(v.scenario);
      const outcome = scenario === "execution error" ? "error" : scenario as Flood.EvaluationOutcome;
      const graded = outcome === "passed" || outcome === "failed";
      const code = (value: string) => binding(`<CodeSnippet code={${JSON.stringify(value)}} />`,<Flood.CodeSnippet code={value}/>);
      const checks: Flood.CheckRun[] = [
        {id:"schema",label:"Response schema",status:"passed"},
        {id:"route",label:"Correct queue",status:outcome==="passed"?"passed":"failed",
          detail:outcome==="failed"?"Refund requests belong in Billing.":undefined},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"36rem",maxInlineSize:"100%"}},
        element("EvaluationResult",{
          title:"Route a refund request",outcome,reason:outcome==="error"?"The provider timed out.":undefined,
          expected:code('{"queue": "billing"}'),
          output:graded?code(outcome==="passed"?'{"queue": "billing"}':'{"queue": "general"}'):undefined,
          checks:graded?checks:undefined,
        }));
    }
    case "check-run-list": {
      const failed = v.scenario === "Failing check";
      const missing = v.scenario === "Missing report";
      const checks: Flood.CheckRun[] = [
        {id:"types",label:"Type check",status:"passed"},
        {id:"browser",label:"Browser tests",status:failed ? "failed" : missing ? "running" : "passed",
          blocking:failed || missing,detail:failed ? "File review failed on Firefox" : undefined,
          href:failed ? "#browser-check-log" : undefined},
        {id:"package",label:"Package verification",status:missing ? "not-reported" : "passed",blocking:missing},
        {id:"visuals",label:"Visual snapshots",status:"skipped"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"31rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Section",{title:"Checks",headingSize:"group"},
            element("CheckRunList",{label:"Checks for this revision",checks:v.empty ? [] : checks,blockingLabel:"Blocks merge"})),
          ...(!v.empty && failed ? [element("Section",{id:"browser-check-log",tabIndex:-1,title:"Browser test log",headingSize:"group"},
            element("CodeSnippet",{code:"Firefox: changed file remains unreviewed after Space"}))] : [])));
    }
    case "pipeline-run": {
      const failed=v.scenario==="Failed", running=v.scenario==="Running";
      const logs=element("CodeSnippet",{code:"Migration 024\nColumn project_id is missing from release_events."});
      const stages: Flood.PipelineStage[] = [
        {id:"checkout",label:"Fetch source",status:"succeeded",duration:"3s"},
        {id:"build",label:"Build image",status:"succeeded",duration:"42s"},
        {id:"migrate",label:"Apply migrations",status:failed?"failed":running?"running":"succeeded",
          duration:running?"8s":"19s",description:failed?"The release database is missing a required column.":undefined,
          details:failed?{label:"Migration logs",content:renderRecipe(logs)}:undefined},
        {id:"deploy",label:"Deploy service",status:failed?"skipped":running?"queued":"succeeded",duration:failed||running?undefined:"31s"},
      ];
      const stageCode=stages.map(({details,...stage})=>{
        const data=JSON.stringify(stage);
        if (!details) return data;
        return data.slice(0,-1)+`,details:{label:${JSON.stringify(details.label)},content:${printRecipe(logs,new Set(),new Set())}}}`;
      });
      return element("div",{style:{width:v.narrow?"17rem":"36rem",maxWidth:"100%"}},element("PipelineRun",{
        label:"Production deployment stages",stages:binding(v.empty?"[]":`[${stageCode.join(",") }]`,v.empty?[]:stages),
      }));
    }
    case "search-result-item": {
      return element("Surface",{padding:v.narrow?"3":"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"35rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"2"},element("Heading",{level:2,size:"group"},"Results for “retry”"),
          element("DataList",{"aria-label":"Documentation results",dividers:false,density:"compact"},
            element("SearchResultItem",{title:"Motion",context:"Guide",href:"/docs/motion#component-states",query:"retry",
              excerpt:v.showExcerpts?{source:"Component states",text:"The retry decision updates in place…"}:undefined}),
            element("SearchResultItem",{title:"Reply in the right channel",context:"Recipe",href:"/docs/recipes/support-reply",query:"retry",
              excerpt:v.showExcerpts?{text:"… retrying a failed send after changing channels.",query:"retrying"}:undefined}),
            element("SearchResultItem",{title:"RetrySchedule",context:"Component",href:"/components/retry-schedule",query:"retry"}))));
    }
    case "source-list": {
      const first = {id:"citations",marker:"1",title:"Web search · Output and citations",source:"OpenAI API documentation",
        href:"https://developers.openai.com/api/docs/guides/tools-web-search#output-and-citations",
        excerpt:v.showExcerpts?"Response annotations identify the linked source and where the citation appears in the answer.":undefined};
      const sources = [first,{id:"progress",marker:"2",title:"Update the client during a response",source:"ChatKit Python SDK",
        href:v.showUnavailable?undefined:"https://openai.github.io/chatkit-python/guides/update-client-during-response/",
        excerpt:v.showExcerpts?"Progress updates can keep the conversation informative while a tool runs.":undefined}];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"29rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("Text",{as:"p",size:"compact"},"Web search provides citations in the response. ",
            element("Citation",{label:first.marker,title:first.title,source:first.source,href:first.href,excerpt:first.excerpt})),
          element("Heading",{level:2,size:"group"},"Sources"),
          element("SourceList",{label:"Sources",sources})));
    }
    case "citation": return element("div",{style:{width:v.narrow?"15rem":"29rem",maxWidth:"100%"}},
      element("Text",{as:"p"},"Damaged returns require a photo. ",
        element("Citation",{
          label:"1", title:"Warehouse exception policy",source:"Operations handbook · § 4.2",
          href:"/docs",
          excerpt:v.showExcerpt?"Attach a photo that shows the damaged item before approving the return.":undefined,
        })));
    case "audit-timeline": return element("AuditTimeline",{
      label:"Request history",density:v.density,headingLevel:2,
      style:{width:v.constrainWidth?"14rem":"33rem",maxInlineSize:"100%"},
      emptyContent:v.empty?binding('<EmptyState title="No activity yet" />',<Flood.EmptyState title="No activity yet"/>):undefined,
      groups:v.empty?[]:[
        {id:"nov-14",label:"14 November",dateTime:"2026-11-14",items:[
          {id:"review",title:"Maya Chen updated the request",timeLabel:"11:20",dateTime:"2026-11-14T11:20:00",changes:[
            {id:"owner",label:"Owner",before:"Alexandra Konstantinova",after:"Sam Rivera"},
            {id:"limit",label:"Approval limit",before:"$0",after:"$4,500"},
          ]},
          {id:"due",title:"Sam Rivera set a due date",timeLabel:"11:08",dateTime:"2026-11-14T11:08:00",changes:[
            {id:"date",label:"Due date",after:"21 Nov"},
          ]},
        ]},
        {id:"nov-13",label:"13 November",dateTime:"2026-11-13",items:[
          {id:"opened",title:"Maya Chen created the request",timeLabel:"15:42",dateTime:"2026-11-13T15:42:00"},
        ]},
      ],
    });
    case "activity-timeline":
    case "timeline": {
      const grouped = slug === "activity-timeline";
      const activity = grouped || v.mode === "activity";
      const layout = grouped ? "feed" : v.layout;
      const width = {width:v.constrainWidth?(v.longLabels?"14rem":"18rem"):"34rem",maxInlineSize:"100%"};
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
          labels:v.longLabels?{before:"Previous value",after:"Current value"}:undefined,
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
            {id:"maya-assigned",title:"Assigned to Maya Chen",timeLabel:v.times ? "16:03" : undefined,dateTime:"2026-11-13T16:03:00",connector:v.periodConnector as Flood.TimelineItem["connector"]},
          ];
          const timeline = element("ActivityTimeline",{label:"Export activity",headingLevel:2,density:v.density,style:v.surface === "canvas"?width:undefined,groups:binding(
            `[${JSON.stringify({...first,items:priorItems})}, {...${JSON.stringify(second)}, items: ${source}}]`,
            [{...first,items:priorItems},{...second,items}],
          )});
          return v.surface === "canvas" ? timeline : element("Surface",{elevation:v.surface,padding:"4",style:width},timeline);
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

    case "tree": {
      const {treeLayer, setTreeLayer} = actions;
      const rowActions: Flood.TreeItem["actions"] = v.showRowActions ? [
        {id:"visibility",kind:"toggle",label:"Hide Button.tsx",pressed:treeLayer.hidden,icon:treeLayer.hidden?<EyeOff/>:<Eye/>,onPressedChange:hidden=>setTreeLayer({...treeLayer,hidden})},
        {id:"lock",kind:"toggle",label:"Lock Button.tsx",pressed:treeLayer.locked,icon:treeLayer.locked?<Lock/>:<LockOpen/>,onPressedChange:locked=>setTreeLayer({...treeLayer,locked})},
      ] : undefined;
      const buttonItem = {value:"button",label:"Button.tsx",description:v.showDescriptions?"Reusable project action":undefined};
      const inputItem = {value:"input",label:"Input.tsx"};
      const tokenItem = {value:"tokens",label:"tokens.json"};
      const docsItem = {value:"docs",label:"Documentation",hasChildren:true,loading:Boolean(v.loading),children:v.loading?undefined:[{value:"intro",label:"Introduction.md"}]};
      const readmeItem = {value:"readme",label:"README.md"};
      const archivedItem = {value:"archived",label:"Archived",disabled:true};
      const items = v.empty ? [] : [
        {value:"source",label:"Source",selectable:false,children:[
          {value:"ui",label:"Components",selectable:false,children:[{...buttonItem,actions:rowActions},inputItem]},tokenItem,
        ]},
        docsItem, readmeItem, archivedItem,
      ];
      const expression = v.showRowActions && !v.empty
        ? `[{value:"source",label:"Source",selectable:false,children:[{value:"ui",label:"Components",selectable:false,children:[{...(${JSON.stringify(buttonItem)}),actions:rowActions},${JSON.stringify(inputItem)}]},${JSON.stringify(tokenItem)}]},${JSON.stringify(docsItem)},${JSON.stringify(readmeItem)},${JSON.stringify(archivedItem)}]`
        : JSON.stringify(items);
      return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Tree", {
        label:"Project files",controlSize:v.controlSize,multiple:v.multiple,hideLabel:v.hideLabel,
        readOnly:v.readOnly,disabled:v.disabled,defaultExpandedValues:["source","ui","docs"],
        items:binding(expression,items),
      }));
    }
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
    case "app-top-bar": {
      const items = v.deepPath ? [{label:"Flood Studio",href:"#studio"},{label:"Projects",href:"#projects"},
        {label:"Design system",href:"#design-system"},{label:"Release readiness and accessibility"}]
        : [{label:"Projects",href:"#projects"},{label:"Overview"}];
      const layout = v.layout === "compact" ? "compact" : "wrap";
      return element("div", {style:{width:v.narrow?"20rem":"36rem",maxWidth:"100%"}}, element("AppTopBar", {
        bordered:v.bordered,layout,
        start:binding(`<Breadcrumb label="Workspace path" layout="${layout}" items={${JSON.stringify(items)}} />`,
          <Flood.Breadcrumb label="Workspace path" layout={layout} items={items} />),
        end:v.showActions?binding('<Button variant="subtle" size="sm">Search</Button>', <Flood.Button variant="subtle" size="sm">Search</Flood.Button>):undefined,
      }));
    }
    case "page-header": return element("div", {style:{width:v.narrow?"16rem":v.longTitle?"48rem":"36rem",maxWidth:"100%"}}, element("PageHeader", {
      title:v.longTitle?"Payment reconciliation and approvals":"Projects", headingLevel:2, headingSize:v.headingSize,
      metadata:v.showMetadata?binding('<Badge size="sm">12 open</Badge>',<Flood.Badge size="sm">12 open</Flood.Badge>):undefined,
      description:v.showDescription?(v.longTitle?"Match payments to invoices before the monthly close.":"Only projects shared with your workspace are listed here."):undefined,
      actions:v.showActions?binding(
        v.secondaryAction?'<><Button variant="outline" size="sm">Download report</Button><Button size="sm">Start review</Button></>':'<Button size="sm">New project</Button>',
        v.secondaryAction?<><Flood.Button variant="outline" size="sm">Download report</Flood.Button><Flood.Button size="sm">Start review</Flood.Button></>:<Flood.Button size="sm">New project</Flood.Button>,
      ):undefined
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
    case "rating-breakdown": {
      const reviews = [
        {id:"maya",stars:5,body:"Exported the report on the first try."},
        {id:"sam",stars:4,body:"Clean export. I’d like a CSV preset."},
        {id:"leah",stars:5,body:"Dates stayed consistent across the report."},
        {id:"alex",stars:2,body:"The download timed out twice."},
      ];
      const activeRating = v.filterable ? actions.status : "";
      const visible = reviews.filter(review => !activeRating || String(review.stars) === activeRating);
      const reviewFilter = v.filterable ? '.filter(review => !status || String(review.stars) === status)' : '';
      return element("Surface",{padding:"4",style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Section",{title:v.filterable?"Filter by rating":"Ratings",headingSize:"group"},
            element("RatingBreakdown",{label:"Ratings by star",counts:[0,1,0,1,2],filter:v.filterable?binding(
              '{value: status ? Number(status) : null, onValueChange: value => setStatus(value === null ? "" : String(value))}',
              {value:actions.status ? Number(actions.status) : null,onValueChange:(value:number|null)=>actions.setStatus(value===null?"":String(value))},
            ):undefined})),
          element("Section",{title:"Reviews",headingSize:"group"},
            element("DataList",{"aria-label":"Customer reviews",density:"compact",dividers:false,style:{minBlockSize:"11rem"}},
              binding(`${JSON.stringify(reviews)}${reviewFilter}.map(review =>
                <DataListItem key={review.id} title={review.body} metadata={<RatingValue value={review.stars} appearance="compact" size="sm" />} />)`,
              visible.map(review=><Flood.DataListItem key={review.id} title={review.body}
                metadata={<Flood.RatingValue value={review.stars} appearance="compact" size="sm" />} />))))));
    }
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
    case "follow-button": {
      const access = v.privateProfile ? "requested" : "following";
      const selected = actions.status === "requested" || actions.status === "following" ? actions.status : "not-following";
      return element("Surface",{padding:"4",elevation:"raised",
        style:{inlineSize:"21rem",maxInlineSize:"100%"}},
        element("Inline",{gap:"3",style:{justifyContent:"space-between"}},
          element("AuthorMeta",{name:"Maya Chen",metadata:"@mayachen"}),
          element("FollowButton",{subject:"Maya Chen",
            state:binding('status === "requested" || status === "following" ? status : "not-following"',selected),
            pending:v.pending,disabled:v.disabled,
            onAction:binding(`intent => setStatus(intent === "follow" ? "${access}" : "")`,
              (intent:Flood.FollowIntent)=>actions.setStatus(intent === "follow" ? access : ""))})));
    }
    case "reveal-value": {
      const reveal = element("RevealValue",{appearance:v.appearance,overflow:v.overflow,copyable:v.allowCopy,
        value:v.longValue?"flood_demo_3f089bf2d2e34452a4e66d53e6af0cf1":"flood_demo_3f089bf2",
        showLabel:"Show token",hideLabel:"Hide token",copyLabel:"Copy token",hiddenValueLabel:"Token hidden"});
      return v.inDetails ? element("DescriptionList",{
        "aria-label":"Token details",layout:"columns",style:{width:v.constrainWidth?"14.5rem":"28rem",maxInlineSize:"100%"},
        items:binding(`[{id:"name",term:"Name",description:"Read API"},{id:"token",term:"Token",description:${printRecipe(reveal,new Set(),new Set())}}]`,[
          {id:"name",term:"Name",description:"Read API"},{id:"token",term:"Token",description:renderRecipe(reveal)},
        ]),
      }) : element("div",{style:{width:v.constrainWidth?"9rem":"24rem",maxInlineSize:"100%"}},reveal);
    }
    case "copyable-value": return v.identifiers ? element("Stack",{gap:"2",style:{width:v.constrainWidth?"12rem":"28rem",maxInlineSize:"100%"}},
      ...["0174","0179"].map(suffix=>element("CopyableValue",{
        value:`req_workflow_recovery_${suffix}`, appearance:v.appearance, overflow:v.overflow,
        preserveEnd:v.preserveEnd?4:undefined,copyLabel:`Copy request ${suffix}`,
      }))) : element("div",{style:{maxInlineSize:v.constrainWidth?"12rem":"28rem"}},
      element("CopyableValue",{
        value:v.longValue?"https://flood.md/docs/installation":"https://flood.md/mcp",
        copyLabel:"Copy URL", appearance:v.appearance, overflow:v.overflow, preserveEnd:v.preserveEnd?4:undefined,
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
    case "find-bar": {
      const {findState,setFindState} = actions;
      const {matches,queryError} = findPreviewMatches(findState);
      const activeMatch = Math.min(findState.active,matches.length) || null;
      const update = (changes: Partial<typeof findState>) => setFindState({...findState,...changes});
      const step = (direction: number) => update({active:((activeMatch ?? 1)-1+direction+matches.length)%matches.length+1});
      const apply = (all: boolean) => {
        const chosen = all ? matches : activeMatch ? [matches[activeMatch-1]] : [];
        update({source:chosen.reduceRight((source, hit) => {
          const index = hit.index!;
          return source.slice(0,index)+findState.replacement+source.slice(index+hit[0].length);
        },findState.source),active:1});
      };
      const replace = v.showReplace ? binding(
        "{value: findState.replacement, onValueChange: replacement => updateFind({replacement}), onReplace: () => replaceFind(false), onReplaceAll: () => replaceFind(true)}",
        {value:findState.replacement,onValueChange:(replacement:string)=>update({replacement}),onReplace:()=>apply(false),onReplaceAll:()=>apply(true)},
      ) : undefined;
      return element("Surface",{padding:"3",style:{width:"35rem",maxWidth:"100%"}},element("Stack",{gap:"3"},
        element("FindBar",{
          controlSize:v.controlSize,query:binding("findState.query",findState.query),
          onQueryChange:binding("query => updateFind({query, active: 1})",(query:string)=>update({query,active:1})),
          matchCount:binding("matches.length",matches.length),activeMatch:binding("activeMatch",activeMatch),queryError:binding("queryError",queryError),replace,
          onNextMatch:binding("() => stepFind(1)",()=>step(1)),onPreviousMatch:binding("() => stepFind(-1)",()=>step(-1)),
          caseSensitive:v.showOptions?binding("findState.caseSensitive",findState.caseSensitive):undefined,
          onCaseSensitiveChange:v.showOptions?binding("caseSensitive => updateFind({caseSensitive, active: 1})",(caseSensitive:boolean)=>update({caseSensitive,active:1})):undefined,
          regularExpression:v.showOptions?binding("findState.regex",findState.regex):undefined,
          onRegularExpressionChange:v.showOptions?binding("regex => updateFind({regex, active: 1})",(regex:boolean)=>update({regex,active:1})):undefined,
        }),
        element("Text",{as:"p",size:"compact"},element("HighlightText",{
          query:binding("matches[(activeMatch ?? 0) - 1]?.[0] ?? ''",matches[(activeMatch ?? 0)-1]?.[0] ?? ""),
          caseSensitive:binding("findState.caseSensitive",findState.caseSensitive),
        },binding("findState.source",findState.source)))));
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
    case "unit-number-field": return element("Stack",{style:{width:"24rem",maxWidth:"100%"}},element("UnitNumberField",{
      label:"Package weight",amountName:"weight",unitName:"unit",min:0,step:.001,readOnly:v.readOnly,disabled:v.disabled,controlSize:v.controlSize,
      units:[{value:"g",label:"g"},{value:"kg",label:"kg"}],
      value:binding("quantity",actions.quantity),onValueChange:binding("setQuantity",actions.setQuantity),
    }));
    case "suggestion-textarea": return element("Stack",{style:{width:"30rem",maxWidth:"100%"}},{
      tag:"Field",props:{label:"Reply"},field:element("SuggestionTextarea",{
        rows:3,controlSize:v.controlSize,readOnly:v.readOnly,disabled:v.disabled,placeholder:"Type @ for people or / for commands",
        value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),
        suggestions:[
          {trigger:"@",label:"People",items:[{id:"maya",label:"Maya Chen",insertText:"@Maya Chen"},{id:"sam",label:"Sam Rivera",insertText:"@Sam Rivera"}]},
          {trigger:"/",label:"Commands",items:[{id:"thanks",label:"Thank the customer",insertText:"Thanks for the details."},{id:"review",label:"Request review",insertText:"Could you check this before we send it?"}]},
        ],
      }),
    });
    case "query-input": {
      const tokens = [
        {id:"owner",label:"Owner: Maya"},
        v.showTokenError ? {id:"queue",label:"Queue: Imports",error:"Choose a queue that exists."} : undefined,
      ].filter((token): token is NonNullable<typeof token>=>Boolean(token));
      return element("QueryInput",{
        style:{width:"32rem",maxWidth:"100%"},controlSize:v.controlSize,label:"Search requests",
        placeholder:"Search by text or ID",readOnly:v.readOnly,disabled:v.disabled,
        value:binding("draft",actions.composer.draft),onValueChange:binding("setDraft",actions.composer.setDraft),
        tokens:binding(`${JSON.stringify(tokens)}.filter(token => !removedTagIds.includes(token.id))`,tokens.filter(token=>!actions.removedTagIds.includes(token.id))),
        onTokenRemove:binding("id => setRemovedTagIds(ids => [...ids, id])",actions.removeTag),
        resolveSuggestions:binding("resolveSuggestions",resolvePreviewQuery),
      });
    }
    case "key-value-row":
    case "key-value-editor": {
      const props = { controlSize:v.controlSize, valueMode:v.valueMode, showEnabled:v.showEnabled, readOnly:v.readOnly, disabled:v.disabled };
      return element("Stack", {style:{width:"38rem",maxWidth:"100%"}},
        slug === "key-value-row" ? element("KeyValueRow", {...props,
          value:binding("pairs[0]",actions.pairs[0] ?? initialPairs[0]),
          onValueChange:binding("pair => setPairs([pair])",(pair:Flood.KeyValueEntry)=>actions.setPairs([pair])),
        }) : element("KeyValueEditor", {...props,label:"Request headers",maxRows:6,
          value:binding("pairs",actions.pairs),onValueChange:binding("setPairs",actions.setPairs),
          errorsById:v.showError?{accept:{value:"Use a valid media type."}}:undefined,
        }));
    }
    case "spend-limit-form": return element("Stack",{gap:"4"},
      element("Surface",{elevation:v.surface,padding:"6",style:{inlineSize:"26rem",maxInlineSize:"100%",textAlign:"start"}},
        element("Section",{title:"Monthly compute spending",headingSize:"group"},
          element("SpendLimitForm",{
            currency:"USD", value:binding("limits",actions.spendLimits),
            capEffect:"Pauses compute workloads until the next billing cycle.",
            alertEffect:"Emails workspace admins at this amount.",
            pending:v.scenario === "Saving",
            error:v.scenario === "Failed" && !actions.status ? "Couldn’t save the limits. Try again." : undefined,
            onValueChange:binding('(next) => { setLimits(next); setStatus(""); }',
              (next:Flood.SpendLimitDraft)=>{actions.setSpendLimits(next);actions.setStatus("");}),
            onSubmit:binding('() => setStatus("Limits saved.")',()=>actions.setStatus("Limits saved.")),
          }))),status);
    case "money-field": return element("Stack",{gap:"3",style:{width:"18rem",maxWidth:"100%"}},{
      tag:"Field",props:{label:"Refund amount"},
      field:element("MoneyField",{key:`${v.currency}-${v.locale}`,name:"amount",currency:v.currency,locale:v.locale,
        defaultValue:v.currency==="JPY"?"1299":"1299.50",min:"0",max:"2000",controlSize:v.controlSize,
        required:v.required,readOnly:v.readOnly,disabled:v.disabled})
    });
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
    case "rollout-allocation": {
      const canary = v.scenario === "canary";
      const initial = canary ? 0.125 : 25;
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"16rem":"28rem",maxInlineSize:"100%"}},
        element("Section",{title:"Checkout rollout",headingSize:"group"},
          element("RolloutAllocation",{label:"Traffic allocation",candidateLabel:"New checkout",baselineLabel:"Current checkout",
            precision:canary?3:0,readOnly:v.readOnly,value:binding(`Number(status || ${initial})`,Number(actions.status || initial)),
            onValueChange:binding("value => setStatus(String(value))",(value:number)=>actions.setStatus(String(value))),
          })));
    }
    case "slider": return element("Slider",{key:v.range?"range":"single",label:v.range?"Price range":"Volume",name:"level",defaultValue:v.range?[25,75]:[50],min:0,max:100,step:Number(v.step),showValue:v.showValue,valuePlacement:v.valuePlacement,controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly,hideLabel:v.hideLabel,status:fieldStatus,message});
    case "container": return element("div", {style:{width:"100%"}}, element("Container", {size:v.size,gutter:v.gutter},element("Text",{as:"p",size:"compact"},"Content stays within a readable width.")));
    case "grid": return element("Grid", {
      columns:v.columns === "auto"?undefined:Number(v.columns),
      maxColumns:v.maxColumns === "none"?undefined:Number(v.maxColumns),
      minItemWidth:v.minItemWidth,gap:v.gap,
    }, ...["First", "Second", "Third"].map(label=>element("Surface",{padding:"4"},element("Text",{size:"compact"},label))));
    case "masonry": {
      const gallery = [
        {href:"/components/image",src:"/flood-mark.png",label:"Flood mark",width:1254,height:1254},
        {href:"/components/line-chart",src:"/comparison-area.png",label:"Smooth line chart",width:801,height:403},
        {href:"/docs/charts",src:"/charts-share.png",label:"Flood charts",width:1200,height:630},
        {href:"/components/image-comparison",src:"/comparison-line.png",label:"Straight line chart",width:801,height:403},
      ];
      return element("div",{style:{inlineSize:v.narrow?"17rem":"38rem",maxInlineSize:"100%"}},
        element("Masonry",{"aria-label":"Flood visual library",maxColumns:Number(v.columnLimit),minColumnWidth:"11rem",gap:v.gap,dir:v.rtl?"rtl":"ltr"},
          ...gallery.map(({href,src,label,width,height})=>{
            const image = element("Image",{src,alt:label,width,height,fit:"contain",
              style:{display:"block",inlineSize:"100%",blockSize:"auto",borderRadius:"inherit"}});
            return element("li",{key:src},element("Link",{href,style:{display:"block",borderRadius:"var(--flood-sys-radius-field)"}},
              src === "/flood-mark.png" ? element("Surface",{padding:"4",style:{borderRadius:"inherit"}},image) : image));
          })));
    }
    case "visually-hidden": return element("Stack", {gap:"3"}, element("Text", {as:"p",size:"compact"},v.focusable?"Press Tab to reveal the link.":"Supporting text remains available to assistive technology."),element("VisuallyHidden",{focusable:v.focusable},v.focusable?element("Link",{href:"#usage"},"Skip to example code"):"Changes save automatically."));
    case "aspect-ratio": return element("div", {style:{width:"22rem",maxWidth:"100%"}},element("AspectRatio",{ratio:Number(v.ratio)},element("Image",{src:"/flood-mark.png",alt:"Flood logo",fit:"contain"})));
    case "image": return element("div", {style:{width:"12rem",maxWidth:"100%"}},element("AspectRatio",{ratio:1.5},element("Image",{src:"/flood-mark.png",alt:v.decorative?"":"Flood logo",fit:v.fit,width:160,height:160})));
    case "image-comparison": return element("ImageComparison",{
      label:v.mode==="overlay"?"Line version opacity":"Line version, visible percentage",
      mode:v.mode, ratio:2, fit:v.fit, dir:v.direction, disabled:v.disabled,
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
      const keys = v.example === "sequence" ? [["G"],["D"]] : mac ? ["⌘", "⇧", "K"] : v.example === "three keys" ? ["Ctrl", "Shift", "K"] : ["Alt", "K"];
      return element("Inline",{dir:v.rtl ? "rtl" : undefined},element("KeyboardShortcut",{keys,label:mac ? "Command plus Shift plus K" : undefined,size:v.size,presentation:v.presentation}));
    }
    case "shortcut-recorder": {
      const recorder = element("ShortcutRecorder",{
        key:String(v.unassigned),
        label:"Command palette shortcut",
        defaultValue:v.unassigned ? null : {key:"k",code:"KeyK",modifiers:["Control"]},
        disabled:v.disabled,
        requireModifier:!v.allowSingleKey,
        validate:binding('shortcut => shortcut.modifiers.length === 1 && shortcut.modifiers.includes("Control") && shortcut.code === "KeyP" ? "Already assigned to Go to file." : undefined',
          (shortcut:Flood.RecordedShortcut)=>shortcut.modifiers.length===1&&shortcut.modifiers.includes("Control")&&shortcut.code==="KeyP"?"Already assigned to Go to file.":undefined),
      });
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"26rem",maxInlineSize:"100%"}},
        element("SettingGroup",{title:"Keyboard shortcuts"},
          element("SettingRow",{label:"Command palette",action:binding(printRecipe(recorder,new Set(),new Set()),renderRecipe(recorder))}),
          element("SettingRow",{label:"Go to file",value:binding('<KeyboardShortcut keys={["Ctrl","P"]} />',<Flood.KeyboardShortcut keys={["Ctrl","P"]} />)})));
    }
    case "shortcut-reference": {
      const mac = v.platform === "macOS";
      const groups: Flood.ShortcutReferenceGroup[] = [
        {id:"workspace",label:"Workspace",items:[
          {id:"search",label:"Open command palette",keys:[mac?"⌘":"Ctrl","K"],spokenKeys:mac?"Command plus K":undefined,keywords:["search"]},
          {id:"help",label:"Show keyboard shortcuts",keys:["?"]},
        ]},
        {id:"service",label:"Service view",items:[
          {id:"deployments",label:"Go to deployments",keys:[["G"],["D"]]},
          {id:"variables",label:"Go to variables",keys:[["G"],["V"]]},
        ]},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{width:v.narrow?"18rem":"28rem",maxWidth:"100%",minBlockSize:v.empty?undefined:"18.5rem"}},
        element("ShortcutReference",{groups:v.empty?[]:groups,headingLevel:2}));
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
    case "calendar": {
      const selection = v.selectionMode === "multiple" ? {
        selectionMode:"multiple",label:"Choose unavailable days",defaultSelectedDates:["2026-10-06","2026-10-15","2026-10-26"],
        clearSelectionLabel:"Clear selection",
      } : {
        label:"Choose a date",granularity:v.granularity,
        defaultValue:v.granularity==="year"?"2026":v.granularity==="month"?"2026-10":"2026-10-26",
      };
      return element("div",{style:{width:"22rem",maxWidth:"100%"}},element("Calendar",{
        key:`${v.selectionMode}-${v.granularity}`,showViewControls:v.showViewControls,
        today:"2026-10-26",locale:v.locale,weekStartsOn:Number(v.weekStartsOn),readOnly:v.readOnly,disabled:v.disabled,...selection,
      }));
    }
    case "media-trim-range": {
      const initial = [8.5, 32] as const;
      const range = actions.status ? JSON.parse(actions.status) as [number, number] : initial;
      const peaks = [3,9,19,14,32,47,23,8,7,31,53,44,64,34,22,11,17,41,56,73,52,36,12,20,33,47,38,8,4,21,34,53,36,65,42,24,11,26,48,59,32,18,42,51,27,16,5,2]
        .map(peak => peak / 100);
      return element("Surface",{elevation:"raised",padding:"4",dir:v.rtl?"rtl":"ltr",style:{inlineSize:"32rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("Text",{as:"p",size:"label",style:{margin:0}},"Trim recording"),
          element("MediaTrimRange",{label:"Trim recording",labels:{start:"Start",end:"End",length:"Clip length"},
            duration:42.5,minimumLength:.5,waveform:v.waveform?peaks:undefined,disabled:v.disabled,
            value:binding('status ? JSON.parse(status) : [8.5, 32]',range),
            onValueChange:binding("next => setStatus(JSON.stringify(next))",(next:[number,number])=>actions.setStatus(JSON.stringify(next)))})));
    }
    case "media-chapter-list": {
      const chapters = [
        {id:"overview",label:"Read the overview",start:0,thumbnail:v.thumbnails?{src:"/charts-share.png"}:undefined},
        {id:"comparison",label:"Compare two periods",start:29.5,thumbnail:v.thumbnails?{src:"/comparison-line.png"}:undefined},
        {id:"investigate",label:"Investigate the busiest days",start:64,thumbnail:v.thumbnails?{src:"/comparison-area.png"}:undefined},
      ];
      const currentTime = binding("time",actions.transcriptTime);
      const onSeek = binding("setTime",actions.setTranscriptTime);
      return element("Surface",{elevation:"raised",padding:"4",dir:v.rtl?"rtl":"ltr",style:{inlineSize:"32rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Stack",{gap:"1"},
            element("Text",{as:"p",size:"label",style:{margin:0}},"Read a traffic report"),
            element("MediaSeekBar",{label:"Playback position",duration:94,chapterStarts:chapters.map(chapter=>chapter.start),
              buffered:[[0,45]],currentTime,onSeek,disabled:v.disabled})),
          element("MediaChapterList",{label:"Chapters",chapters,currentTime,onSeek,disabled:v.disabled})));
    }
    case "media-seek-bar":
    case "media-transcript": {
      const cues: Flood.MediaTranscriptCue[] = [
        {id:"overview",start:0,text:"Begin with the main service overview."},
        {id:"filter",start:12,text:"Filter the requests by deployment and status."},
        {id:"errors",start:24,text:"Open a failing request and inspect its response."},
        {id:"find",start:38,text:"Copy the request ID to find its related events."},
        {id:"review",start:54,text:"Review the full trace before retrying the request."},
        {id:"share",start:72,text:"Share the trace with the service owner."},
      ];
      const transcript = element("MediaTranscript",{
        label:"Transcript",cues:v.empty?[]:cues,query:v.highlight?"request":undefined,
        maxViewportHeight:slug === "media-seek-bar" ? "17rem" : "11rem",
        currentTime:binding("time",actions.transcriptTime),onSeek:binding("setTime",actions.setTranscriptTime),
      });
      if (slug === "media-transcript") return element("Stack",{style:{width:"34rem",maxWidth:"100%"}},transcript);
      const duration = 84.5;
      return element("Surface",{elevation:"raised",padding:"4",dir:v.rtl?"rtl":"ltr",style:{inlineSize:"32rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Stack",{gap:"1"},
            element("Text",{as:"p",size:"label",style:{margin:0},dir:"ltr"},"Investigating a failed request"),
            element("MediaSeekBar",{label:"Playback position",duration:v.loading?undefined:duration,
              currentTime:binding("time",actions.transcriptTime),onSeek:binding("setTime",actions.setTranscriptTime),
              buffered:v.buffered==="Complete"?[[0,duration]]:v.buffered==="Partial"?[[0,28],[45,68]]:undefined})),
          ...(v.loading ? [] : [transcript])));
    }
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
    case "expense-allocation-form": {
      const error = "The split could not be saved. Try again.";
      const accepted = "Split saved";
      return element("Surface",{padding:v.narrow?"4":"6",elevation:v.surface,
        style:{inlineSize:v.narrow?"19rem":"30rem",maxInlineSize:"100%"}},
      element("Section",{title:"Split expense",headingSize:"group"},
        element("ExpenseAllocationForm",{
          "aria-label":"Split expense",currency:"USD",total:v.total,pending:v.pending,
          lines:binding("lines",actions.expenseLines),
          onAmountChange:binding('(id, amount) => { setLines(current => current.map(line => line.id === id ? {...line,amount} : line)); setStatus(""); }',
            (id:string,amount:string|null)=>{actions.setExpenseAmount(id,amount);actions.setStatus("");}),
          onSubmit:binding(`() => setStatus(${JSON.stringify(v.accept?accepted:error)})`,
            ()=>actions.setStatus(v.accept?accepted:error)),
          error:binding(`status === ${JSON.stringify(error)} ? status : undefined`,actions.status===error?error:undefined),
        }),
        element("Text",{size:"helper",tone:"subtle",role:"status"},binding(
          `status === ${JSON.stringify(accepted)} ? status : ""`,actions.status===accepted?accepted:"")),
      ));
    }
    case "temporary-spend-limit": {
      const reset = "2026-12-01T05:00:00Z";
      const states: Record<string,Flood.TemporarySpendLimitState> = {
        Active:{status:"active",effectiveLimit:"$4,500.00",resetsAt:reset},
        Requested:{status:"requested",expectedResetAt:reset},
        Declined:{status:"declined",decisionNote:"Use the venue’s existing purchase order."},
        Expired:{status:"expired",endedAt:reset},
      };
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"18rem":"26rem",maxInlineSize:"100%"}},
        element("TemporarySpendLimit",{
          title:"Events card",baseLimit:"$3,000.00",requestedIncrease:"$1,500.00",
          state:states[String(v.scenario)],reason:"Deposit for the team offsite",timeZone:"America/New_York",
        }));
    }
    case "expense-allocation-review": {
      const total = v.scenario === "Changed total" ? "120.01" : v.scenario === "Overallocated" ? "90.00" : "100.00";
      const lines = v.scenario === "No split" ? [] : [
        {id:"ops",label:"Operations",amount:"60.15"},
        {id:"growth",label:"Growth",amount:"39.85"},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"17rem":"24rem",maxInlineSize:"100%"}},
        element("Section",{title:"Expense allocation",headingSize:"group"},
          element("ExpenseAllocationReview",{currency:"USD",total,lines})));
    }
    case "amount-breakdown": {
      const credit = v.example === "credit";
      const format = new Intl.NumberFormat(v.rtl?"ar-EG":"en-US",{style:"currency",currency:"USD"}).format;
      const rows = v.example === "total only" ? [] : [
        {id:"subtotal",label:v.rtl?"المجموع الفرعي":"Subtotal",amount:format(credit?240:12000)},
        ...(!credit?[{id:"tax",label:v.rtl?"الضريبة":"Tax",amount:format(960)}]:[]),
        {id:"credit",label:v.rtl?"رصيد الحساب":"Account credit",amount:format(credit?-360:-1250)},
      ];
      const title = v.rtl?"ملخص الفاتورة":"Invoice summary";
      const total = {label:credit?(v.rtl?"الرصيد المتبقي":"Credit balance"):(v.rtl?"المبلغ المستحق":"Amount due"),amount:format(credit?-120:v.example==="total only"?0:11710)};
      return element("Surface",{padding:"4",elevation:v.surface,dir:v.rtl?"rtl":"ltr",lang:v.rtl?"ar":"en",
        style:{inlineSize:v.narrow?"15rem":"25rem",maxInlineSize:"100%"}},
        element("Section",{title,headingSize:"group"},
          element("AmountBreakdown",{"aria-label":title,rows,total})));
    }
    case "refund-link-summary": {
      const original: Flood.RefundOriginalCharge | null | undefined = v.scenario === "Unavailable" ? undefined :
        v.scenario === "Unlinked" ? null : {merchant:"Northstar Supply",dateTime:"2026-11-12",
          amount:{amount:"186.40",currency:"USD"}};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("RefundLinkSummary",{refund:{amount:"42.00",currency:"USD"},original,
          lockedReason:v.scenario === "Synced" ? "This link is locked because the refund has synced to accounting." : undefined}));
    }
    case "bill-payment-schedule": {
      const first: Flood.BillPaymentScheduleEntry = {id:"first",label:"First payment",amount:"$800.00",status:"paid",date:{dateTime:"2026-11-12",children:"Nov 12"}};
      const second: Flood.BillPaymentScheduleEntry = {id:"second",label:"Second payment",amount:"$1,600.00",status:"paid",date:{dateTime:"2026-11-24",children:"Nov 24"}};
      const waiting = v.scenario === "Needs release";
      const remaining = { "Partially paid":"$1,600.00","Needs release":"$1,600.00","No payments":"$2,400.00",Paid:"$0.00" }[String(v.scenario)];
      const payments: Flood.BillPaymentScheduleEntry[] | undefined = v.scenario === "Unavailable" ? undefined
        : v.scenario === "No payments" ? []
        : [first, v.scenario === "Paid" ? second : {...second,amount:"$1,200.00",status:waiting?"awaiting-release":"scheduled"}];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"18rem":"28rem",maxInlineSize:"100%"}},
        element("BillPaymentSchedule",{total:"$2,400.00",remaining,unscheduled:payments?.length && v.scenario !== "Paid" ? "$400.00" : undefined,payments}));
    }
    case "expense-settlement": {
      let state: Flood.ExpenseSettlementState = {status:"awaiting-payment"};
      if (v.scenario === "Repayment") state = {status:"processing"};
      if (v.scenario === "External payment") state = {status:"settled",channel:"external",dateTime:"2026-11-16"};
      if (v.scenario === "Failed") state = {status:"failed"};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"25rem",maxInlineSize:"100%"}},
        element("ExpenseSettlement",{
          kind:v.scenario==="Repayment"?"repayment":"reimbursement",
          employee:"Maya Chen",company:"Studio North",state,
          amount:{amount:v.scenario==="Repayment"?"24.00":"186.40",currency:"USD"},
          detail:v.scenario==="Failed"?"The recipient bank rejected the transfer.":undefined,
        }));
    }
    case "currency-conversion": {
      const refund = v.state === "Refund";
      const target: Flood.ConversionTarget = v.state === "Pending" ? {state:"pending",currency:"USD"}
        : v.state === "Estimated" ? {state:"estimated",currency:"USD",amount:"175.63",rate:"0.7318"}
          : {state:"settled",currency:"USD",amount:refund?"−43.97":"175.87",rate:refund?undefined:"0.7328"};
      const conversion = element("Section",{title:refund?"Refund":"Card transaction",headingSize:"group"},
        element("CurrencyConversion",{"aria-label":"Currency conversion",
          original:{amount:refund?"−60.00":"240.00",currency:"CAD"},target}));
      const style = {inlineSize:v.narrow?"16rem":"29rem",maxInlineSize:"100%"};
      return v.surface === "canvas" ? element("div",{style},conversion)
        : element("Surface",{style,elevation:v.surface,padding:v.narrow?"4":"6"},conversion);
    }
    case "description-list": {
      const items = [
        {id:"project",term:"Project",description:"Flood design system"},
        {id:"version",term:"Version",description:release.version},
        {id:"owner",term:"Owner",layout:v.stackOwner?"stacked":undefined,valueOverflow:v.truncateValue?"truncate":undefined,description:v.longValue?"design-system-maintainers@a-very-long-example-company.example":"Design team"},
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
    case "image-focal-point": {
      const image = {src:"/comparison-area.png",alt:"Weekly visits chart",width:801,height:403};
      const defaultPoint = {x:.74,y:.40};
      const point = actions.status ? JSON.parse(actions.status) as Flood.ImageFocalPointValue : defaultPoint;
      const readPoint = 'status ? JSON.parse(status) : {x:.74,y:.40}';
      const cropRadius = "var(--flood-sys-radius-field)";
      const cover = (ratio:number, label:string) => element("Stack",{gap:"1"},
        element("Text",{size:"compact",tone:"muted"},label),
        element("AspectRatio",{ratio},element("Image",{...image,alt:"",fit:"cover",
          style:binding(`{borderRadius: "${cropRadius}", objectPosition: ((${readPoint}).x * 100) + "%" + " " + ((${readPoint}).y * 100) + "%"}`,
            {borderRadius:cropRadius,objectPosition:`${point.x * 100}% ${point.y * 100}%`})})));
      return element("Stack",{gap:"4",style:{inlineSize:v.narrow?"18rem":"32rem",maxInlineSize:"100%"}},
        element("ImageFocalPoint",{label:"Preview focal point",horizontalLabel:"Horizontal",verticalLabel:"Vertical",image,
          value:binding(readPoint,point),disabled:v.disabled,
          onValueChange:binding("point => setStatus(JSON.stringify(point))",(next:Flood.ImageFocalPointValue)=>actions.setStatus(JSON.stringify(next)))}),
        element("Grid",{columns:2,gap:"3"},cover(2.8,"Banner crop"),cover(1.6,"Card crop")));
    }
    case "image-annotations": {
      const annotations = [
        {id:"count",label:"Visit count",x:.105,y:.18},
        {id:"peak",label:"Weekend peak",x:.81,y:.39},
        {id:"label",label:"Last tick",x:v.edgePoint?1:.95,y:v.edgePoint?1:.90},
      ];
      const feedback = {
        count:{title:"Visit count",body:"Can we label this as unique visits if returning visitors are excluded?"},
        peak:{title:"Weekend peak",body:"What ran on Saturday? It may explain the jump in visits."},
        label:{title:"Last tick",body:"Give the last tick the same inset as the first one."},
      };
      const current = (actions.status || "count") as keyof typeof feedback;
      return element("Stack",{gap:"3",dir:v.rtl?"rtl":"ltr",style:{inlineSize:v.narrow?"18rem":"38rem",maxInlineSize:"100%"}},
        element("ImageAnnotations",{
          label:"Chart review",image:{src:"/comparison-area.png",alt:"An area chart showing weekly visits",width:801,height:403},
          annotations,activeId:binding('status || "count"',current),onAnnotationSelect:binding("setStatus",actions.setStatus),
        }),
        element("Surface",{padding:"4",elevation:"raised"},
          element("ReviewThread",{
            dir:"ltr",
            lang:"en",
            title:binding(`(${JSON.stringify(feedback)})[status || "count"].title`,feedback[current].title),
            items:binding(`[{id:"sam",author:{name:"Sam Rivera"},body:(${JSON.stringify(feedback)})[status || "count"].body}]`,
              [{id:"sam",author:{name:"Sam Rivera"},body:feedback[current].body}]),
            resolved:false,
          })));
    }
    case "text-annotation": return element("Stack",{gap:"4",style:{inlineSize:v.constrainWidth?"15rem":"32rem",maxInlineSize:"100%"}},
      element("Text",{as:"p"},"Keep the source file available until ",
        element("TextAnnotation",{id:"retention-text",discussionId:"retention-review",resolved:v.resolved,active:v.active},
          "the next scheduled release is available"),"."),
      element("Surface",{padding:"4",elevation:"raised"},
        element("Section",{id:"retention-review",tabIndex:-1,title:"Source file retention",headingSize:"group"},
          element("Stack",{gap:"3"},
            element("Comment",{size:"sm",author:{name:"Sam Rivera"}},"Keep it in the shared project folder until the launch is reviewed."),
            element("Link",{href:"#retention-text"},"Back to text")))));
    case "change-region": return element("Surface",{padding:"4",elevation:v.surface,
      style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
      element("Section",{title:"Release handoff",headingSize:"group"},
        element("Stack",{gap:"4"},
          element("ChangeRegion",{state:"unmarked"},element("Text",{as:"p",size:"compact"},
            "The release includes the workspace settings and the new file picker.")),
          element("ChangeRegion",{state:v.state,id:"handoff-launch-check",label:"Launch check edited by Maya Chen",tabIndex:-1},
            element("Text",{as:"p",size:"compact"},
              "Before publishing, verify that both features work in a new workspace with the default permissions.")),
          element("ChangeRegion",{state:"unmarked"},element("Text",{as:"p",size:"compact"},
            "After publishing, send the updated guide to the support team.")))));
    case "text-revision": return element("Text", {style:{maxInlineSize:v.constrainWidth?"12rem":"28rem"}},
      "Share the review notes ",
      element("TextRevision", {before:v.kind==="insertion"?undefined:"with the project lead",
        after:v.kind==="deletion"?undefined:"with the project team",state:v.state,active:v.active}),
      "."
    );
    case "value-change": {
      const status = v.scenario === "status";
      const before = status ? binding('<StatusIndicator label="Draft" presentation="chip" size="sm" />',<Flood.StatusIndicator label="Draft" presentation="chip" size="sm" />)
        : v.scenario === "assignee" ? "Alexandra Konstantinova" : v.scenario === "removed" ? "Approval reminder" : undefined;
      const after = status ? binding('<StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />',<Flood.StatusIndicator label="In review" tone="warning" presentation="chip" size="sm" />)
        : v.scenario === "assignee" ? "Release operations team" : v.scenario === "added" ? "Approval reminder" : undefined;
      return element("div",{style:{width:v.constrainWidth?"12rem":"26rem",maxInlineSize:"100%"}},
        element("ValueChange",{before,after,layout:v.layout,labels:v.longLabels?{before:"Previous value",after:"Current value"}:undefined}));
    }
    case "agent-handoff": {
      const details = {
        transferred:"Review the refund against the original charge.",
        requested:"Wait for the billing agent to accept the request.",
        failed:"The billing agent was unavailable.",
        unknown:undefined,
      };
      const state = v.state as Flood.AgentHandoffState;
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("AgentHandoff",{from:{label:"Support triage"},to:{label:"Billing review"},state,detail:details[state]}));
    }
    case "environment-sync-review": {
      const groups = v.scenario === "Unavailable" ? null : v.scenario === "No changes" ? [] : [
        {id:"web",label:"Web service",changes:[
          {id:"replicas",label:"Replicas",before:1,after:2},
          {id:"health",label:"Health check",after:"/ready"},
        ]},
        {id:"worker",label:"Queue worker",changes:[
          {id:"queue",label:"Legacy queue",before:"exports-v1"},
        ]},
      ];
      return element("Surface",{padding:"4",elevation:v.surface,
        style:{inlineSize:v.narrow?"18rem":"29rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Heading",{level:2,size:"group"},"Review environment sync"),
          element("EnvironmentSyncReview",{
            source:{id:"production",label:"Production"},
            destination:{id:"staging",label:v.narrow?"Staging · European integration":"Staging"},
            groups,
          })));
    }
    case "staged-changes": {
      const resources: Flood.StagedChangeGroup[] = [
        {id:"web",label:"Web service",changes:[
          {id:"region",label:"Region",before:"US East",after:"EU West"},
          {id:"health",label:"Health check path",after:"/ready"},
        ]},
        {id:"jobs",label:"Queue worker",changes:[
          {id:"queue",label:"Legacy queue",before:"scheduled-export-jobs"},
        ]},
      ];
      const groups = resources.map(group=>({...group,changes:group.changes.filter(change=>!actions.listSelection[change.id])}));
      const discard = (change:Flood.ChangeListItem, group:Flood.StagedChangeGroup) =>
        <Flood.Button size="sm" variant="ghost" aria-label={`Discard ${change.label} from ${group.label}`}
          onClick={event=>{
            event.currentTarget.closest("[data-staged-preview]")?.querySelector<HTMLElement>("[data-draft-heading]")?.focus({preventScroll:true});
            actions.setListSelection(change.id,true);
          }}>Discard</Flood.Button>;
      return element("Surface",{padding:"4",elevation:"raised","data-staged-preview":true,
        style:{inlineSize:v.narrow?"17rem":"32rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"3"},
          element("Heading",{level:2,size:"group",tabIndex:-1,"data-draft-heading":true},"Proposed changes"),
          element("StagedChanges",{label:"Proposed changes",
            groups:binding(`${JSON.stringify(resources)}.map(group => ({...group,changes:group.changes.filter(change=>!listSelection[change.id])}))`,groups),
            renderDiscard:v.allowDiscard?binding(
              ' (change, group) => <Button size="sm" variant="ghost" aria-label={`Discard ${change.label} from ${group.label}`} onClick={event => { event.currentTarget.closest("[data-staged-preview]")?.querySelector<HTMLElement>("[data-draft-heading]")?.focus({preventScroll:true}); setListSelection(current => ({...current,[change.id]:true})); }}>Discard</Button>',discard):undefined,
          })));
    }
    case "change-list": return element("ChangeList",{
      "aria-label":"Project changes",density:v.density,layout:v.layout,valueLayout:v.valueLayout,dividers:v.dividers,
      labels:v.longLabels?{before:"Previous value",after:"Current value"}:undefined,
      style:{width:v.constrainWidth?"17rem":"30rem",maxInlineSize:"100%"},
      items:[
        {id:"owner",label:"Owner",before:"Maya Chen",after:"Sam Rivera"},
        {id:"due",label:"Due date",before:"14 Nov",after:"21 Nov"},
        {id:"budget",label:"Budget",before:"$4,500",after:"$5,000"},
        {id:"reminder",label:"Reminder",after:"1 day before"},
      ],
    });
    case "migration-history": {
      const sourceOffline = v.scenario === "Production unavailable";
      const inSync = v.scenario === "In sync";
      const migrations: Flood.MigrationHistoryEntry[] = [
        {version:"20261116091500",name:"Add invoice index",history:{git:"recorded",staging:"recorded",prod:sourceOffline?undefined:inSync?"recorded":"missing"}},
        {version:"20261114103000",name:"Add billing region",history:{git:"recorded",staging:"recorded",prod:sourceOffline?undefined:"recorded"}},
        ...(!inSync&&!sourceOffline?[{version:"20261113153000",history:{git:"missing",staging:"missing",prod:"recorded"}} as const]:[]),
      ];
      const sources = [{id:"git",label:"Repository"},...(v.staging?[{id:"staging",label:"Staging"}]:[]),{id:"prod",label:"Production"}];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"20rem":"38rem",maxInlineSize:"100%"}},
        element("MigrationHistory",{caption:"Migration history",sources,migrations:v.scenario==="Empty"?[]:migrations}));
    }
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
    case "milestone-progress": return element("Stack", {gap:"4", style:{width:v.narrow?"14rem":"30rem",maxWidth:"100%"}},
      element("MilestoneProgress", {name:"Private pilot", completed:8, total:8}),
      element("MilestoneProgress", {name:"Public beta and partner onboarding", completed:6, total:10,
        href:v.showLink?"/components/kanban-board":undefined,
        dueDate:v.showDate?{label:"Nov 24",dateTime:"2026-11-24"}:undefined}),
      element("MilestoneProgress", {name:"General availability", completed:0, total:0}));
    case "cycle-progress": {
      const categories = ["Mon","Tue","Wed","Thu","Fri"];
      const work = [2,5,8,13,v.scenario === "Complete" ? 24 : 18];
      const scope = v.scenario === "Scope reduced" ? [20,20,22,22,18] : [20,20,24,24,24];
      const observations = v.scenario === "Empty" ? [] : categories.map((label,index) =>
        ({label,completed:work[index],scope:scope[index]}));
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"34rem",maxInlineSize:"100%"}},
        element("CycleProgress",{name:"Cycle 42",initialScope:20,observations}));
    }
    case "cycle-capacity": {
      const planned = v.scenario==="Below estimate"?28:v.scenario==="Matches estimate"?36:42;
      const forecast = v.scenario==="Unavailable"?undefined:{capacity:v.scenario==="Zero capacity"?0:36,basis:"Based on the last three completed cycles."};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("Section",{title:"Cycle 24 capacity",headingSize:"group"},
          element("CycleCapacity",{planned,forecast,formatAmount:binding('(amount) => `${amount} pts`',(amount:number)=>`${amount} pts`)})));
    }
    case "capacity-meter": return element("CapacityMeter", {
      label:"Storage used", used:Number(v.used), capacity:100, warningAt:85, unit:"GB", layout:v.layout, size:v.size,
      style:{width:v.narrow ? "12rem" : "22rem",maxInlineSize:"100%"},
    });
    case "usage-limit": {
      const policy = {
        "hard-limit": {limitLabel:"hard limit",consequence:"At the hard limit, workloads pause until the next billing period."},
        "soft-budget": {limitLabel:"budget",consequence:"Workloads keep running when spending reaches the budget."},
        allowance: {limitLabel:"included",consequence:"Usage above the included amount is billed separately."},
      }[v.policy as Flood.UsageLimitProps["policy"]];
      return element("Surface", {padding:"4",style:{width:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("UsageLimit", {
          label:"Compute spend", used:Number(v.used), limit:100, policy:v.policy,
          ...policy, notification:v.showNotification?{at:75,label:"Email notification"}:undefined,
          formatAmount:binding('(amount: number) => `$${amount}`',(amount:number)=>`$${amount}`),
        }));
    }
    case "token-usage-breakdown": {
      const usage: Flood.TokenUsage | null = v.scenario === "Unavailable" ? null
        : v.scenario === "Zero" ? {input:0,output:0,cachedInput:0,reasoningOutput:0}
        : v.scenario === "Totals only" ? {input:5000,output:900}
        : {input:5000,output:900,cachedInput:1500,reasoningOutput:200};
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"15rem":"24rem",maxInlineSize:"100%"}},
        element("TokenUsageBreakdown",{usage}));
    }
    case "context-window-meter": {
      const examples: Record<string, {used:number; conversation:number; tools:number}> = {
        Working:{used:96500,conversation:58420,tools:37080},
        Compacting:{used:103400,conversation:62500,tools:39900},
        Compacted:{used:28310,conversation:16150,tools:11160},
        "Over limit":{used:130400,conversation:85500,tools:43900},
      };
      const example = examples[String(v.scenario)];
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"17rem":"27rem",maxInlineSize:"100%"}},
        element("ContextWindowMeter",{used:example.used,limit:128000,compactionAt:v.showThreshold?100000:undefined,
          compacting:v.scenario==="Compacting",parts:v.showBreakdown?[
            {id:"conversation",label:"Conversation",tokens:example.conversation},
            {id:"tools",label:"Tool results",tokens:example.tools},
          ]:undefined}));
    }
    case "usage-forecast": {
      const amounts = {"over budget":{used:72,amount:118},"within budget":{used:56,amount:84},
        "no forecast":{used:72,amount:undefined},"already over":{used:104,amount:126}}[v.scenario as string]!;
      return element("Surface",{padding:"4",elevation:v.surface,style:{inlineSize:v.narrow?"16rem":"27rem",maxInlineSize:"100%"}},
        element("Section",{title:"Compute spend",headingSize:"group"},
          element("UsageForecast",{label:"Recorded spend",used:amounts.used,limit:100,limitLabel:"Budget",scaleMax:135,
            projection:amounts.amount === undefined ? undefined : {amount:amounts.amount,label:"Estimate by Nov 30"},
            formatAmount:binding('(amount: number) => `$${amount}`',(amount:number)=>`$${amount}`),
          })));
    }
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
      const style = {width:v.narrow?"16rem":"26rem",maxInlineSize:"100%"};
      const longDescription = v.narrow ? "Release moved to 12 November for artwork review." : "The release moved to 12 November while the team checks the final artwork.";
      const description = v.longDescription ? longDescription : "Release on 12 November";
      if (!v.loaded) return element("CardSkeleton", {
        density:v.density, description:v.longDescription ? undefined : v.description, headerAction:v.headerAction,
        descriptionLines:v.description && v.longDescription ? 2 : undefined,
        reserveSelectionSpace:v.selectable || undefined,
        mediaRatio:v.showMedia?16/9:undefined,
        footerAction:v.footerAction, footerDivider:v.footerDivider, animate:v.animate, style,
      });
      return element("Card", {
        title:"Project details", density:v.density, footerDivider:v.footerDivider, style,
        selection:v.selectable?binding(
          `{label:"Select project", checked:Boolean(listSelection.project), onCheckedChange:(checked: boolean) => setListSelection(current => ({...current, project:checked}))}`,
          {label:"Select project",checked:Boolean(actions.listSelection.project),onCheckedChange:(checked:boolean)=>actions.setListSelection("project",checked)},
        ):undefined,
        media:v.showMedia?cardMedia():undefined,
        description:v.description?description:undefined,
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
    case "tabs": {
      const items = [
        {value:"overview",label:"Overview",content:"Keep the project context in one place."},
        {value:"activity",label:"Activity",count:v.showCounts?137:undefined,content:"Recent changes and project updates."},
        ...(v.overflowControls ? [
          {value:"files",label:"Files",content:"Browse project files."},
          {value:"access",label:"Access",content:"Manage project access."},
        ] : []),
        {value:"settings",label:"Settings",count:v.showCounts?0:undefined,content:"Choose the settings that fit this project.",disabled:Boolean(v.disableLast)},
      ];
      return element("Tabs",{label:"Project sections",items,overflowControls:v.overflowControls || undefined,
        variant:v.variant,activationMode:v.activationMode,orientation:v.orientation,controlSize:v.controlSize,
        disabled:v.disabled,style:{width:v.narrow?"12rem":v.overflowControls?"18rem":"26rem",maxWidth:"100%",minHeight:"12rem"}});
    }
    case "table-of-contents": {
      const outline = [
        {id:"outline-installation",label:"Installation"},
        {id:"outline-setup",label:"Project setup",children:[{id:"outline-tokens",label:"Import tokens"}]},
        {id:"outline-verification",label:"Verification"},
      ];
      const sections = [
        ["outline-installation","Installation","Install the Flood packages in your workspace."],
        ["outline-setup","Project setup","Add FloodRoot at the boundary of your interface."],
        ["outline-tokens","Import tokens","Import the shared CSS once in your app entry."],
        ["outline-verification","Verification","Check component states with the installed Flood version."],
      ];
      const article = element("ScrollArea",{ref:binding("article",actions.outlineScroll),role:"region","aria-label":"Setup guide",style:{blockSize:"16rem"}},
        ...sections.map(([id,title,body])=>element("section",{id,tabIndex:-1,style:{minBlockSize:"12rem",scrollMarginBlockStart:"8px"}},
          element("Stack",{gap:"2"},element("Heading",{level:2,size:"group"},title),element("Text",{as:"p",size:"compact",tone:"subtle"},body)))));
      const navigation = element("TableOfContents",{items:outline,scrollRootRef:binding("article",actions.outlineScroll)});
      const embed = (recipe:ElementRecipe)=>binding(printRecipe(recipe,new Set(),new Set()),renderRecipe(recipe));
      return element("Surface",{padding:"4",elevation:"raised",style:{width:"40rem",maxWidth:"100%"}},
        element("Split",{side:"start",collapseAt:"sm",gap:"4",main:embed(article),aside:embed(navigation)}));
    }
    case "breadcrumb": return element("Stack", {gap:"4",style:v.narrow?{width:"16rem",maxInlineSize:"100%"}:undefined}, element("Breadcrumb", {
      items:[{label:"Workspace",href:"#workspace"},{label:"Projects",href:"#projects"},
        ...(v.deepPath?[{label:"Design system",href:"#design-system"},{label:"Releases",href:"#releases"}]:[]),
        {label:v.longTitle?"November accessibility and interaction release notes":"Flood",...(v.currentLink?{href:"#flood"}:{})}],
      separator:v.separator,layout:v.layout,maxVisibleItems:Number(v.maxVisibleItems),
      onClick:binding('event => { if (event.target instanceof Element && event.target.closest("a")) event.preventDefault(); }',
        (event:{target:EventTarget;preventDefault:()=>void})=>{if(event.target instanceof Element && event.target.closest("a"))event.preventDefault();}),
    }));
    case "card-deck": {
      const cards = cardDeckExamples;
      const content = cards.map(card => element("Stack",{gap:"3"},
        element("Heading",{level:2,size:"group"},card.label),
        element("AspectRatio",{ratio:2},
          element("Image",{src:card.image,alt:"",fit:"cover",style:{borderRadius:"var(--flood-sys-radius-field)"}})),
        element("Link",{href:card.href},card.action)));
      const items = binding(`[${cards.map((card,index) =>
        `{id:${JSON.stringify(card.id)}, label:${JSON.stringify(card.label)}, content:(${printRecipe(content[index]!,new Set(),new Set())})}`).join(",\n")}]`,
        cards.map((card,index) => ({id:card.id,label:card.label,content:renderRecipe(content[index]!)})));
      const selectedId = cards.find(card => card.id === actions.viewValue)?.id ?? cards[0]!.id;
      return element("CardDeck",{label:"Chart examples",items,selectedId:binding("selectedId",selectedId),
        onSelectedChange:binding("setSelectedId",actions.setViewValue),loop:v.loop,dir:v.rtl?"rtl":undefined,
        style:{inlineSize:v.narrow?"17rem":"28rem",maxInlineSize:"100%"}});
    }
    case "record-navigator": {
      const target = (offset:-1|1) => {
        const index = actions.page + offset - 1;
        const record = adjacentRecordExamples[index];
        const step = offset === -1 ? "- 1" : "+ 1";
        const source = `records[page - 1 ${step}] && {title:records[page - 1 ${step}].title,onSelect:() => selectRecordPage(page ${step})}`;
        return binding(source,record?{title:record.title,onSelect:()=>actions.selectRecordPage(index+1)}:undefined);
      };
      const record = adjacentRecordExamples[actions.page-1];
      const navigator = element("RecordNavigator",{label:"Adjacent requests",previous:target(-1),next:target(1),
        presentation:v.presentation,dir:v.rtl?"rtl":undefined});
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"18rem":"36rem",maxInlineSize:"100%"}},
        element("Stack",{gap:"4"},
          element("Stack",{gap:"2"},
            element("Heading",{size:"group",tabIndex:-1,ref:binding("recordHeading",actions.focusRecordHeading)},
              binding("records[page - 1].title",record.title)),
            element("Text",{as:"p",tone:"subtle",size:"compact"},binding("records[page - 1].detail",record.detail))),navigator));
    }
    case "response-variants": {
      const variants = [
        {id:"1",content:"Keep customer exports for 30 days after creation."},
        {id:"2",content:"Delete exported copies after 30 days. The source records remain available."},
        {id:"3",content:"Export links expire after 30 days. Keep the original records under the workspace retention policy."},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:v.narrow?"17rem":"30rem",maxInlineSize:"100%"}},
        element("ResponseVariants",{label:"Response versions",dir:v.rtl?"rtl":undefined,
          variants:v.single?variants.slice(0,1):variants,
          value:v.single?"1":binding("String(page)",String(actions.page)),
          onValueChange:binding("id => setPage(Number(id))",(id:string)=>actions.setPage(Number(id))),
        }));
    }
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
      key: String(v.defaultOpen), title: "Advanced settings", variant: v.variant, triggerWidth: v.fitTrigger ? "fit" : undefined, defaultOpen: v.defaultOpen, controlSize: v.controlSize, disabled: v.disabled,
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
    case "save-to-collection": {
      const choices = v.empty ? [] : [
        {id:"analytics",label:"Analytics references"},
        {id:"dashboard",label:"Dashboard patterns"},
        {id:"team",label:"Team archive",disabled:true},
      ];
      return element("Surface",{padding:"4",elevation:"raised",style:{inlineSize:"27rem",maxInlineSize:"100%"}},
        element("Inline",{gap:"3",style:{justifyContent:"space-between"}},
          element("Stack",{gap:"0"},
            element("Text",{size:"label"},"Latency dashboard"),
            element("Text",{size:"helper",tone:"subtle"},"Observability"),
          ),
          element("SaveToCollection",{
            label:"Save latency dashboard",size:v.size,pending:v.pending,disabled:v.disabled,
            saved:binding("saved",actions.savedReference),
            collections:binding(`${JSON.stringify(choices)}.map(option => ({...option, selected: memberships[option.id] === true}))`,
              choices.map(option=>({...option,selected:actions.referenceCollections[option.id]===true}))),
            onSavedChange:binding("setSaved",actions.setSavedReference),
            onCollectionChange:binding("(id, selected) => setMemberships(current => ({...current, [id]: selected}))",actions.setReferenceCollection),
          })));
    }
    case "split-button": {
      const items: Flood.MenuItem[] = v.empty ? [] : [{id:"csv",label:"Export CSV"}, {id:"json",label:"Export JSON"}];
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
    case "button": return element("Stack", { gap: "4" }, element("Inline", {}, element("Button", { variant: v.variant, tone: v.tone, size: v.size, disabled: v.disabled, loading: v.loadingMode === "retain-focus" ? "retain-focus" : v.loadingMode === "loading", onClick: action }, "Save changes")), status);
    case "icon-button": return element("Stack", { gap: "4" }, element("Inline", {}, element("IconButton", { label: "Add idea", variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, element("Plus"))), status);
    case "input": case "textarea": return { tag: "Field", props: { label: slug === "input" ? "Project name" : "Project note", hideLabel: v.hideLabel, status: fieldStatus, message }, field: element(slug === "input" ? "Input" : "Textarea", { controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, readOnly: v.readOnly, defaultValue: slug === "input" ? "My project" : "Homepage and checkout", ...(slug === "textarea" && v.autoGrow ? {autoGrow:true,rows:2,maxRows:5} : {}) }) };
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
      title:"Workspace preferences",layout:v.layout,density:v.density,dividers:v.dividers,
      style:{width:v.constrainWidth?"16rem":"32rem",maxInlineSize:"100%"},
    },element("Switch",{layout:"row",label:"Weekly summary",description:"Receive one email with the week's activity.",defaultChecked:true}),
    {tag:"Field",props:{label:"Default view",layout:"adaptive",hint:"Opens when you enter the workspace."},field:element("Select",{name:"defaultView",controlSize:"sm",defaultValue:"overview"},
      element("option",{value:"overview"},"Overview"),element("option",{value:"activity"},"Activity"))},
    element("SettingRow",{label:"Time zone",description:"Used for dates in workspace activity.",value:"UTC",
      action:binding('<Link href="/playground/settings" variant="subtle" size="sm">Change time zone</Link>',<Flood.Link href="/playground/settings" variant="subtle" size="sm">Change time zone</Flood.Link>),
    }),element("SettingRow",{label:"Help center",action:binding('<Link href="/docs" variant="subtle" size="sm">Read docs</Link>',<Flood.Link href="/docs" variant="subtle" size="sm">Read docs</Flood.Link>)}));
    case "radio": return element("fieldset", { style: { margin: 0, padding: 0, border: 0 } }, element("legend", {}, "Project visibility"), element("Stack", { gap: "2" }, element("Radio", { label: "Private", name: "workbench-visibility", value: "private", disabled: v.disabled, checked: binding("checked", Boolean(v.checked)), onChange: binding("() => setChecked(true)", () => actions.checked(true)) }), element("Radio", { label: "Public", name: "workbench-visibility", value: "public", disabled: v.disabled, checked: binding("!checked", !v.checked), onChange: binding("() => setChecked(false)", () => actions.checked(false)) })));
    case "text": return element("Text", {as:"p",size:v.size,tone:v.tone,wrap:v.pretty?"pretty":undefined,
      style:v.multiline?{inlineSize:"15rem",maxInlineSize:"100%"}:undefined},
      v.multiline?"Invite your team to review the draft and add comments before Friday.":"Quarterly revenue");
    case "expandable-text": return element("div",{style:{width:v.constrainWidth?"15rem":"26rem",maxInlineSize:"100%"}},
      element("ExpandableText",{lines:Number(v.lines),size:v.size},
        v.shortText ? "The export is ready for review."
          : "The export covers the full billing period. The original file contains the individual entries and payment reference for each invoice. Keep it with the summary so reviewers can reconcile the totals with the source."));
    case "truncated-text": return element("div",{style:{width:v.constrainWidth?"14rem":"34rem",maxInlineSize:"100%"}},
      element("Text",{as:"div",size:"compact"},element("TruncatedText",{tooltipSide:v.tooltipSide,preserveEnd:v.preserveEnd?8:undefined},
        v.shortText?"Workspace activity export":v.preserveEnd?"Workspace activity export for October 2026 · ACT-0179":"Workspace activity export for October 2026.csv")));
    case "heading": return element("Heading", {size:v.size,level:Number(v.level),wrap:v.balance?"balance":undefined,
      style:v.multiline?{inlineSize:"18rem",maxInlineSize:"100%"}:undefined},
      v.multiline?"A quieter workspace for notes and ideas":"Room for ideas.");
    case "stack": return element("Stack", { gap: v.gap }, text("One shared foundation."), text("A clear rhythm between things."), element("Button", { variant: "subtle", onClick: action }, "Try an action"), status);
    case "inline": return element("Inline", { gap: v.gap, align: v.align }, element("Button", { onClick: action }, "Save changes"), element("Button", { variant: "subtle", onClick: binding('() => setStatus("Cancelled locally.")', () => actions.setStatus("Cancelled locally.")) }, "Cancel"), status);
    case "surface": return element("Surface", { elevation: v.elevation, padding: v.padding }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Your workspace"), text("A surface gives related content a shared place.")));
    case "icon-slot": return element("IconSlot", { size: v.size, label: v.label || undefined }, element("ArrowRight"));
    case "icon-swap": return element("Inline",{gap:"3","data-flood-motion":v.reduceMotion?"reduce":undefined},
      element("IconButton",{label:"Mute notifications",size:v.size,variant:"subtle","aria-pressed":binding("checked",Boolean(v.checked)),
        onClick:binding("() => setChecked(!checked)",()=>actions.checked(!v.checked))},
        element("IconSwap",{state:binding('checked ? "muted" : "on"',v.checked?"muted":"on"),
          icons:binding('{on:<Bell />, muted:<BellOff />}',{on:<Bell />,muted:<BellOff />})})),
      element("Text",{size:"compact"},binding('checked ? "Notifications muted" : "Notifications on"',v.checked?"Notifications muted":"Notifications on")));
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
    case "save-bar": {
      const nextState = v.holdSave ? "saving" : v.failSave ? "error" : "";
      const formId = "save-bar-project-settings";
      const onSubmit = (event:React.FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
        if (!actions.status || actions.status === "saving") return;
        if (!nextState) {
          const input = event.currentTarget.elements.namedItem("project") as HTMLInputElement;
          actions.setSavedProjectName(input.value);
          input.focus({preventScroll:true});
        }
        actions.setStatus(nextState);
      };
      return element("Stack",{gap:"4",style:{inlineSize:v.narrow?"15rem":"28rem",maxInlineSize:"100%"}},
        element("Surface",{padding:"4",elevation:"raised"},
          element("form",{id:formId,"aria-label":"Project settings",
            onSubmit:binding(`event => { event.preventDefault(); if (!status || status === "saving") return;
              const nextState = "${nextState}";
              if (!nextState) {
                const input = event.currentTarget.elements.namedItem("project") as HTMLInputElement;
                setSavedProjectName(input.value);
                input.focus({preventScroll:true});
              }
              setStatus(nextState); }`,onSubmit),
            onReset:binding('event => { (event.currentTarget.elements.namedItem("project") as HTMLInputElement).focus({preventScroll:true}); setStatus(""); }',
              (event:React.FormEvent<HTMLFormElement>)=>{
                (event.currentTarget.elements.namedItem("project") as HTMLInputElement).focus({preventScroll:true});
                actions.setStatus("");
              }),
          },{tag:"Field",props:{label:"Project name",required:true},field:element("Input",{name:"project",
            defaultValue:binding("savedProjectName",actions.savedProjectName),required:true,
            readOnly:binding('status === "saving"',actions.status === "saving"),
            onInput:binding('event => setStatus(event.currentTarget.value === event.currentTarget.defaultValue ? "" : "dirty")',
              (event:React.FormEvent<HTMLInputElement>)=>actions.setStatus(event.currentTarget.value === event.currentTarget.defaultValue ? "" : "dirty")),
          })})),
        element("SaveBar",{form:formId,placement:v.placement,
          state:binding('status === "dirty" || status === "error" || status === "saving" ? status : "clean"',
            actions.status === "dirty" || actions.status === "error" || actions.status === "saving" ? actions.status : "clean"),
          labels:{state:{error:"Could not save the project name. Try again."}}}));
    }
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
  const outlineScroll = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const recordHeading = useRef<HTMLElement | null>(null);
  const [subscriptionMode, setSubscriptionMode] = useState<Flood.NotificationSubscriptionMode>("participating");
  const [estimate, setEstimate] = useState<Flood.EstimateChoice|null>({id:"3",label:"3 points",shortLabel:"3"});
  const [replyAudience, setReplyAudience] = useState("anyone");
  const [savedProjectName, setSavedProjectName] = useState("Design system");
  const [savedReference, setSavedReference] = useState(false);
  const [referenceCollections, setReferenceCollections] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [inboxUnread, setInboxUnread] = useState<Record<string, boolean>>({});
  const [inboxFilter, setInboxFilter] = useState<Flood.NotificationInboxFilter>("all");
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
  const [pairs, setPairs] = useState<Flood.KeyValueEntry[]>(initialPairs);
  const [findState, setFindState] = useState(initialFindState);
  const [treeLayer, setTreeLayer] = useState(initialTreeLayer);
  const [typedCondition, setTypedCondition] = useState<Flood.TypedFilterConditionValue>(initialTypedCondition);
  const [typedFilterGroup, setTypedFilterGroup] = useState<Flood.TypedFilterGroupValue>(initialTypedGroup);
  const [transcriptTime,setTranscriptTime] = useState(12);
  const [traceZoomId,setTraceZoom] = useState<string | null>(null);
  const [gradient,setGradient] = useState<Flood.GradientValue>(initialGradient);
  const [relativeRange, setRelativeRange] = useState<Flood.RelativeTimeRangeValue>(initialRelativeRange);
  const [recurrence, setRecurrence] = useState<Flood.RecurrenceValue>(initialRecurrence);
  const [handleDraft, setHandleDraft] = useState({hosted:"maya",custom:"maya.example"});
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [quietHours, setQuietHours] = useState<Flood.QuietHoursValue>(initialQuietHours);
  const [muteDraft, setMuteDraft] = useState<Flood.MutedWordDraft>(initialMuteDraft);
  const [inviteDraft, setInviteDraft] = useState<Flood.AccessInviteDraft>({email:"",roleId:""});
  const [requestMessage, setRequestMessage] = useState("");
  const [spendLimits, setSpendLimits] = useState<Flood.SpendLimitDraft>({alert:"75.00",cap:"125.00"});
  const [reportDraft, setReportDraft] = useState<Flood.ContentReportDraft>(initialReportDraft);
  const [environmentDraft, setEnvironmentDraft] = useState<Flood.EnvironmentCreationDraft>({name:"Preview",mode:"duplicate",sourceId:"staging"});
  const [webhookDraft, setWebhookDraft] = useState(initialWebhookDraft);
  const [logExportDraft, setLogExportDraft] = useState<Flood.LogExportDraft>(initialLogExportDraft);
  const [restartPolicy, setRestartPolicy] = useState<Flood.RestartPolicyDraft>(initialRestartPolicy);
  const [sharing, setSharing] = useState(initialSharing);
  const [templateId, setTemplateId] = useState("incident");
  const [paymentMethod, setPaymentMethod] = useState("standard");
  const [relationDraft, setRelationDraft] = useState(initialRelationDraft);
  const [expenseLines, setExpenseLines] = useState(initialExpenseLines);
  const [replicaCounts, setReplicaCounts] = useState(initialReplicaCounts);
  const [quantity, setQuantity] = useState<Flood.UnitNumberValue>(initialQuantity);
  const [gridRows, setGridRows] = useState(initialGridRows);
  const [reorderItems, setReorderItems] = useState(initialReorderItems);
  const [boardExamples, setBoardExamples] = useState(initialBoardExamples);
  const [boardCardId, setBoardCardId] = useState<string | null>(null);
  const boardLayout = state.slug===component.slug && state.values.cardLayout==="project" ? "project" : "compact";
  const boardColumns = boardExamples[boardLayout];
  const moveBoardCard = (move: Flood.KanbanMove) => setBoardExamples(examples=>({
    ...examples,[boardLayout]:applyBoardMove(examples[boardLayout],move),
  }));
  const moveReorderItem = (move: Flood.ReorderMove) => setReorderItems(items=>applyPreviewMove(items,move));
  const setGridChanges = (changes: readonly Flood.EditableGridChange[]) =>
    setGridRows(rows=>applyGridPreviewChanges(rows,changes));
  useBrowserLayoutEffect(() => {
    setPairs(initialPairs);
    setFindState(initialFindState);
    setTreeLayer(initialTreeLayer);
    setTypedCondition(initialTypedCondition);
    setTypedFilterGroup(initialTypedGroup);
    setTranscriptTime(12);
    setTraceZoom(null);
    setGradient(initialGradient);
    setRelativeRange(initialRelativeRange);
    setRecurrence(initialRecurrence);
    setHandleDraft({hosted:"maya",custom:"maya.example"});
    setCronExpression("0 9 * * 1");
    setQuietHours(initialQuietHours);
    setMuteDraft(initialMuteDraft);
    setInviteDraft({email:"",roleId:""});
    setRequestMessage("");
    setSpendLimits({alert:"75.00",cap:"125.00"});
    setReportDraft(initialReportDraft);
    setEnvironmentDraft({name:"Preview",mode:"duplicate",sourceId:"staging"});
    setWebhookDraft(initialWebhookDraft);
    setLogExportDraft(initialLogExportDraft);
    setRestartPolicy(initialRestartPolicy);
    setSharing(initialSharing);
    setTemplateId("incident");
    setPaymentMethod("standard");
    setRelationDraft(initialRelationDraft);
    setExpenseLines(initialExpenseLines);
    setReplicaCounts(initialReplicaCounts);
    setQuantity(initialQuantity);
    setGridRows(initialGridRows);
    setReorderItems(initialReorderItems);
    setBoardExamples(initialBoardExamples);
    setBoardCardId(null);
  }, [component.slug]);
  const [navValue,setNavValue]=useState("overview");
  const [viewValue,setViewValue]=useState("all");
  const [approvalDraft,setApprovalDraft]=useState<Flood.ApprovalRequestDraft>({decisionId:null,note:""});
  const [approvalOutcome,setApprovalOutcome]=useState("");
  const [filterGroup, setFilterGroup] = useState<Flood.FilterGroupValue>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});
  const [toolbarSearch,setToolbarSearch]=useState("");
  const [toolbarOpen,setToolbarOpen]=useState(false);
  const [shellDrawerOpen,setShellDrawerOpen]=useState(false);
  const [draftFilters,setDraftFilters]=useState<Flood.FilterGroupValue>({match:"all",conditions:[]});
  const [menuChecked, setMenuChecked] = useState(true);
  const [menuDensity, setMenuDensity] = useState("Compact");
  const [resetKey, setResetKey] = useState(0);
  const initialPage = component.slug === "record-navigator" ? 2 : 1;
  const [pagination, setPagination] = useState({slug:component.slug,page:initialPage});
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
  const change = (name: string, value: string | boolean) => {
    setState({ slug: component.slug, values: { ...values, ...(name === "status" ? { invalid: false, ...(component.slug === "field" ? { error: false } : {}) } : {}), [name]: value } });
    if (component.slug === "save-bar") {
      if (name === "holdSave" && !value && status === "saving") setStatus("dirty");
    } else if (component.slug === "rollout-allocation") {
      if (name === "scenario") setStatus("");
    } else if (component.slug === "review-thread") {
      if (name === "scenario") setStatus(status.split(":")[0]);
    } else if (component.slug === "image-alt-text-editor") {
      if (name === "image") setStatus("");
    } else if (component.slug === "import-column-mapping") {
      if (name === "scenario") setStatus("");
    } else if (!["zoom-control","thumbnail-strip","backup-picker","image-annotations","image-focal-point","media-trim-range","deployment-region-picker","cidr-field","publication-preview"].includes(component.slug) &&
      (component.slug !== "dependency-graph" || name === "example") && component.slug !== "content-label-settings") setStatus("");
    if (name === "state") setFileStates({});
    if (component.slug === "number-range-field" && name === "example") setBudgetRange(budgetRangeExample(value));
    if (component.slug === "avatar-picker" && name === "source") resetPhoto();
    if (name === "demoUnread") setInboxUnread({});
  };
  const callback = useRef(onCodeChange);
  const importsCallback = useRef(onImportsChange);
  useEffect(() => { callback.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { importsCallback.current = onImportsChange; }, [onImportsChange]);
  useEffect(() => { setStatus("");setNavValue("overview");setViewValue("all");setEstimate({id:"3",label:"3 points",shortLabel:"3"});setApprovalDraft({decisionId:null,note:""});setApprovalOutcome("");setToolbarSearch("");setToolbarOpen(false);setShellDrawerOpen(false);setDraftFilters({match:"all",conditions:[]}); setFilterValue({property:"status",operator:"is",values:["active"]});setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]}); setFileStates({}); setRemovedTagIds([]); setSavedReference(false); setReferenceCollections({}); }, [component.slug]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(values.code)); setStatus("Copied command."); }
    catch { setStatus("Select the code and copy it manually."); }
  };
  const usesPagination = ["pagination", "cursor-pagination", "response-variants", "record-navigator"].includes(component.slug) || component.slug === "data-table" && Boolean(values.cursorPages);
  const previewPageCount = component.slug === "pagination" ? Number(values.pageCount)
    : component.slug === "data-table" ? Math.max(1,Math.ceil((values.emptyRows ? 0 : projectRowsForPreview(Boolean(values.stickyHeader)).length) / Number(values.pageSize)))
    : 3;
  const currentPage = usesPagination
    ? Math.min(pagination.slug === component.slug ? pagination.page : initialPage, previewPageCount)
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
  const recipe = recipeFor(component.slug, values, { spendLimits, setSpendLimits, requestMessage, setRequestMessage, inviteDraft, setInviteDraft, expenseLines, setExpenseAmount: (id, amount) => setExpenseLines(current => current.map(line => line.id === id ? {...line,amount} : line)), relationDraft, setRelationDraft, replicaCounts, setReplicaCount: (id,count) => setReplicaCounts(current=>({...current,[id]:count})), savedProjectName, setSavedProjectName, savedReference, setSavedReference, referenceCollections, setReferenceCollection:(id,selected)=>setReferenceCollections(current=>({...current,[id]:selected})), uploadQueue, retryToast, inbox:{filter:inboxFilter,setFilter:setInboxFilter,unread:inboxUnread,set:(id, unread)=>setInboxUnread(current=>({...current,[id]:unread})),markAll:()=>setInboxUnread({mention:false,export:false,settings:false}),retry:()=>change("state","ready")}, reactions:{selected:selectedReactions,set:setReaction}, thread:{replies,submit:submitReply,cancel:cancelReply,openFrom:openReply,focusEditor:focusReplyEditor}, composer: {draft, setDraft, streaming, setStreaming, attachments, addFiles, removeFile, send}, phone, projectEdits, setProjectEdit,listSelection,setListSelection:(id,checked)=>setListSelection(current=>({...current,[id]:checked})), shellDrawerOpen,setShellDrawerOpen,navValue,setNavValue,setCollapsed:(next)=>change("collapsed",next),restoreTable:()=>change("state","ready"),viewValue,setViewValue,approvalDraft,setApprovalDraft,approvalOutcome,setApprovalOutcome,toolbarSearch,setToolbarSearch,toolbarOpen,setToolbarOpen,draftFilters,setDraftFilters,filterGroup,setFilterGroup,filterValue,setFilterValue,typedCondition,setTypedCondition,typedFilterGroup,setTypedFilterGroup,transcriptTime,setTranscriptTime,traceZoomId,setTraceZoom,gradient,setGradient,relativeRange,setRelativeRange,recurrence,setRecurrence,handleDraft,setHandleDraft,cronExpression,setCronExpression,quietHours,setQuietHours,muteDraft,setMuteDraft,reportDraft,setReportDraft,environmentDraft,setEnvironmentDraft,webhookDraft,setWebhookDraft,logExportDraft,setLogExportDraft,restartPolicy,setRestartPolicy,sharing,setSharing,templateId,setTemplateId,paymentMethod,setPaymentMethod,quantity,setQuantity,gridRows,setGridChanges,reorderItems,moveReorderItem,boardColumns,moveBoardCard,boardCardId,setBoardCardId,pairs,setPairs,findState,setFindState,treeLayer,setTreeLayer,removedTagIds,removeTag:id=>setRemovedTagIds(ids=>[...ids,id]),fileStates,setFileState:(id,next)=>setFileStates(current=>({...current,[id]:next})), menuChecked, setMenuChecked, menuDensity, setMenuDensity, notifications, addToast:()=>setNotifications(current=>[...current,{id:crypto.randomUUID(),title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]), dismissToast:id=>setNotifications(current=>current.filter(item=>item.id!==id)), focusRecordHeading:heading=>{recordHeading.current=heading;},selectRecordPage:page=>{
    setPagination({slug:component.slug,page});
    requestAnimationFrame(()=>recordHeading.current?.focus({preventScroll:true}));
  }, subscriptionMode, setSubscriptionMode, estimate, setEstimate, replyAudience, setReplyAudience, status, setStatus:(next)=>{if(next==="Condition removed")resetAction.current?.focus({preventScroll:true});setStatus(next);}, checked: (checked) => change("checked", checked), visible: visible => {
    change("visible", visible);
    if (!visible) queueMicrotask(() => stage.current?.ownerDocument.getElementById(`${id}-visible`)?.focus());
  }, copy, page:currentPage,setPage:page=>setPagination({slug:component.slug,page}),
    outlineScroll,
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
  if (component.slug === "evaluation-result") imports.add("CodeSnippet");
  if (component.slug === "media-credit") imports.add("MediaCredit");
  if (component.slug === "project-health") imports.add("ProjectHealth");
  if (component.slug === "collaborator-presence") for (const name of ["Heading","CollaboratorPresence"]) imports.add(name);
  if (component.slug === "incomplete-response-notice" && ["Partial answer", "No output"].includes(String(values.scenario))) imports.add("Link");
  if (component.slug === "connected-account-list" && values.scenario === "Mixed connections") {
    imports.add("Button");
    imports.add("Dialog");
  }
  if (component.slug === "moderation-notice" && values.scenario === "Can appeal") imports.add("Link");
  if (component.slug === "database-session-list" && values.scenario === "Empty") imports.add("Text");
  if (component.slug === "reveal-value" && values.inDetails) imports.add("RevealValue");
  const jsx = printRecipe(element("FloodRoot", {}, recipe), imports, icons, 2);
  if (component.slug === "scheduled-task-list" && values.showAction) imports.add("Button");
  if (component.slug === "account-standing" && values.showHistory) {
    for (const name of ["Button","Drawer","ModerationNotice"]) imports.add(name);
  }
  if (["evidence-checklist", "scheduled-task-list"].includes(component.slug) && values.showAction) imports.add("Button");
  if (component.slug === "advisor-finding" && values.remediation) {
    imports.add("Link");
    imports.add("Text");
  }
  if (component.slug === "swipe-actions") {
    imports.add("IconButton");
    icons.add("Archive");
    icons.add("CircleCheck");
  }
  if (component.slug === "rating-breakdown") for (const name of ["DataListItem","RatingValue"]) imports.add(name);
  if (["endpoint-label","http-status"].includes(component.slug)) for (const name of ["EndpointLabel","HttpStatus"]) imports.add(name);
  if (component.slug === "git-ref") imports.add("Text");
  if (component.slug === "commit-list" && values.empty) imports.add("EmptyState");
  if (component.slug === "deployment-history") {
    if (values.scenario === "Empty") imports.add("EmptyState");
    if (values.showActions) imports.add("CopyButton");
  }
  if (component.slug === "image-mosaic") imports.add("ImageMosaic");
  if (component.slug === "comment-thread" || (values.metadata && ["author-meta", "comment"].includes(component.slug))) imports.add("Timestamp");
  if (component.slug === "profile-summary" && values.follow) imports.add("FollowButton");
  if (component.slug === "reply-reference") imports.add("ReplyReference");
  if (component.slug === "thread-trigger") imports.add("ThreadTrigger");
  if (component.slug === "help-tip" || (component.slug === "field" && values.showHelp) ||
    (component.slug === "fieldset" && values.showHelp && values.layout === "aligned")) imports.add("HelpTip");
  if (component.slug === "code-snippet" && values.copyAction) imports.add("Button");
  if (component.slug === "tool-call" && values.showDetails) imports.add("CodeSnippet");
  if (["tooltip", "popover", "dialog", "alert-dialog", "drawer", "hover-card", "image-preview", "image-gallery"].includes(component.slug)) imports.add("Button");
  if (component.slug === "image-meta" || (component.slug === "image-preview" && values.showMeta && values.image !== "missing")) imports.add("ImageMeta");
  if (component.slug === "document-preview") for (const name of ["Button","Surface","Stack","Heading","Text"]) imports.add(name);
  if (((component.slug === "file-card" || component.slug === "file-card-skeleton" && values.loaded) && values.showPreview) ||
      (component.slug === "file-card-grid" && values.loaded) ||
      (["upload-item","upload-list"].includes(component.slug) && values.showActions && values.showThumbnail)) imports.add("ImagePreview");
  if (component.slug === "menu") { imports.add(values.iconTrigger ? "IconButton" : "Button"); if (values.iconTrigger) icons.add("Ellipsis"); if (values.icons) for (const name of ["Pencil", "Copy", "Archive", "Trash2"]) icons.add(name); }
  if (component.slug === "profile-links") for (const name of ["Globe","BookOpen","Package"]) icons.add(name);
  if (component.slug === "input-group") {
    if (values.end === "action") imports.add("Button");
    if (values.start === "action") { imports.add("IconButton"); icons.add("Plus"); }
    if (values.start === "icon") { imports.add("IconSlot"); icons.add("Copy"); }
    if (values.end === "icon-action") { imports.add("IconButton"); icons.add("ArrowRight"); }
  }
  if (component.slug === "toggle-group" && values.content !== "text") { icons.add("Bold"); icons.add("Italic"); icons.add("Underline"); }
  if (component.slug === "segmented-control" && (values.content === "icons" || values.content === "mixed")) { icons.add("CalendarDays"); icons.add("CalendarRange"); icons.add("Calendar"); }
  let preamble = "";
  if (component.slug === "card-deck") {
    for (const name of ["AspectRatio","Heading","Image","Link","Stack"]) imports.add(name);
    const selectedId = cardDeckExamples.find(card => card.id === viewValue)?.id ?? cardDeckExamples[0]!.id;
    preamble += `  const [selectedId, setSelectedId] = useState(${JSON.stringify(selectedId)});\n`;
  }
  if (component.slug === "spend-limit-form") preamble += '  const [limits, setLimits] = useState<import("react").ComponentProps<typeof SpendLimitForm>["value"]>({alert:"75.00",cap:"125.00"});\n';
  if (component.slug === "access-request-form" && values.showMessage) preamble += '  const [requestMessage, setRequestMessage] = useState("");\n';
  if (component.slug === "access-invite-form") preamble += '  const [inviteDraft, setInviteDraft] = useState({email:"",roleId:""});\n';
  const typingIndicator = component.slug === "typing-indicator";
  if (typingIndicator) preamble += '  const [draft, setDraft] = useState("");\n';
  const notificationSubscription = component.slug === "notification-subscription";
  const snoozeMenu = component.slug === "snooze-menu";
  const reminderControl = component.slug === "reminder-control";
  if (reminderControl) {
    preamble += `  const [preset, setPreset] = useState(${JSON.stringify(viewValue)});\n`;
    preamble += `  const presets = ${JSON.stringify(reminderPresets)};\n`;
    preamble += "  const remindAt = presets.find(option => option.id === preset)?.dateTime;\n";
  }
  if (component.slug === "estimate-menu") {
    preamble += `  const options = ${JSON.stringify(estimateOptions(values.scale))};\n`;
    preamble += '  const [estimate, setEstimate] = useState<import("react").ComponentProps<typeof EstimateMenu>["value"]>({id:"3",label:"3 points",shortLabel:"3"});\n';
  }
  if (snoozeMenu) {
    preamble += `  const [preset, setPreset] = useState(${JSON.stringify(viewValue)});\n`;
    preamble += `  const presets = ${JSON.stringify(snoozePresets)};\n`;
    preamble += "  const until = presets.find(option => option.id === preset)?.until;\n";
  }
  if (component.slug === "reply-audience") {
    imports.add("ReplyAudience");
    preamble += `  const [draft, setDraft] = useState("");\n  const [audience, setAudience] = useState(${JSON.stringify(replyAudience)});\n`;
  }
  if (notificationSubscription) {
    preamble += `  const [mode, setMode] = useState<"all" | "participating" | "muted">(${JSON.stringify(subscriptionMode)});\n`;
  }
  if (component.slug === "approval-chain" && values.inDrawer) imports.add("Button");
  if (component.slug === "feed-attribution" && values.showIcon) icons.add("Repeat2");
  if (component.slug === "shortcut-recorder") {
    imports.add("ShortcutRecorder");
    imports.add("KeyboardShortcut");
  }
  if (component.slug === "table-of-contents") {
    for (const name of ["ScrollArea","Stack","Heading","Text","TableOfContents"]) imports.add(name);
    preamble += '  const article = useRef<HTMLDivElement>(null);\n';
  }
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
  const threadComposer = component.slug === "thread-trigger" || (component.slug === "comment-thread" && Boolean(values.showComposer));
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
  if (component.slug === "visual-search-form") preamble +=
    '  const images: Record<string, {id:string; label:string; thumbnailSrc:string}> = {area:{id:"area",label:"Weekly area chart",thumbnailSrc:"/comparison-area.png"},line:{id:"line",label:"Weekly line chart",thumbnailSrc:"/comparison-line.png"}};\n  const [text, setText] = useState("");\n  const [view, setView] = useState("area");\n';
  if (component.slug === "environment-switcher") preamble += '  const [environment, setEnvironment] = useState("all");\n';
  if (component.slug === "approval-request") {
    imports.add("DescriptionList");
    if (values.showRoute) for (const name of ["Stack","Section","ApprovalChain"]) imports.add(name);
    preamble += '  const [draft, setDraft] = useState<import("react").ComponentProps<typeof ApprovalRequest>["draft"]>({decisionId:null,note:""});\n  const [outcome, setOutcome] = useState("");\n';
  }
  if (component.slug === "collection-toolbar") { for(const name of ["Stack","Inline","FilterGroup","Button"])imports.add(name); preamble += "  const properties = " + JSON.stringify(collectionPreviewProperties) + ";\n"; preamble += '  const [search, setSearch] = useState("");\n  const [filterOpen, setFilterOpen] = useState(false);\n  const [filters, setFilters] = useState<{match:"all"|"any";conditions:{id:string;property:string;operator:"is"|"is-not";values:string[]}[]}>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});\n  const [draftFilters, setDraftFilters] = useState(filters);\n'; }
  const usesTypedGroup = component.slug === "filter-group" && values.mode === "typed";
  if (usesTypedGroup) preamble += `  const [typedFilters, setTypedFilters] = useState<Extract<import("react").ComponentProps<typeof FilterGroup>, {mode: "typed"}>["value"]>(${JSON.stringify(initialTypedGroup)});\n`;
  if (component.slug === "filter-group" && !usesTypedGroup) preamble += '  const [filters, setFilters] = useState<{match:"all"|"any";conditions:{id:string;property:string;operator:"is"|"is-not";values:string[]}[]}>({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});\n';
  const usesTypedCondition = component.slug === "filter-condition" && values.mode === "typed";
  if (usesTypedCondition) preamble += `  const [typedCondition, setTypedCondition] = useState<Extract<import("react").ComponentProps<typeof FilterCondition>, {mode: "typed"}>["value"]>(${JSON.stringify(initialTypedCondition)});\n`;
  const usesRelativeRange = component.slug === "relative-time-range-picker";
  const usesRecurrence = component.slug === "recurrence-editor";
  if (usesRecurrence) preamble += `  const [recurrence, setRecurrence] = useState<import("react").ComponentProps<typeof RecurrenceEditor>["value"]>(${JSON.stringify(initialRecurrence)});\n`;
  if (component.slug === "handle-field") preamble += '  const [handleDraft, setHandleDraft] = useState({hosted:"maya",custom:"maya.example"});\n';
  if (component.slug === "cron-schedule-field") preamble += '  const [cronExpression, setCronExpression] = useState("0 9 * * 1");\n';
  const usesQuietHours = component.slug === "quiet-hours-editor";
  if (usesQuietHours) preamble += `  const [quietHours, setQuietHours] = useState<import("react").ComponentProps<typeof QuietHoursEditor>["value"]>(${JSON.stringify(initialQuietHours)});\n`;
  if (component.slug === "muted-word-form") {
    preamble += `  const initialMuteDraft = ${JSON.stringify(initialMuteDraft)} as const;\n`;
    preamble += '  const [muteDraft, setMuteDraft] = useState<import("react").ComponentProps<typeof MutedWordForm>["value"]>(initialMuteDraft);\n';
  }
  if (component.slug === "content-report-form") {
    preamble += '  const [reportDraft, setReportDraft] = useState({reasonId:"",details:""});\n';
  }
  if (component.slug === "environment-creation-form") preamble += '  const [environmentDraft, setEnvironmentDraft] = useState<import("react").ComponentProps<typeof EnvironmentCreationForm>["draft"]>({name:"Preview",mode:"duplicate",sourceId:"staging"});\n';
  if (component.slug === "database-webhook-form") preamble += `  const [webhookDraft, setWebhookDraft] = useState<import("react").ComponentProps<typeof DatabaseWebhookForm>["draft"]>(${JSON.stringify(initialWebhookDraft)});\n`;
  if (component.slug === "log-export-form") {
    preamble += `  const [logExportDraft, setLogExportDraft] = useState<import("react").ComponentProps<typeof LogExportForm>["draft"]>(${JSON.stringify(initialLogExportDraft)});\n`;
  }
  if (component.slug === "restart-policy-editor") {
    preamble += `  const [restartPolicy, setRestartPolicy] = useState<import("react").ComponentProps<typeof RestartPolicyEditor>["value"]>(${JSON.stringify(initialRestartPolicy)});\n`;
  }
  if (component.slug === "sharing-panel") {
    preamble += '  const [sharing, setSharing] = useState<{effective:string;draft:string;error?:string}>({effective:"restricted",draft:"restricted"});\n';
  }
  if (component.slug === "template-picker") {
    preamble += '  const [templateId, setTemplateId] = useState("incident");\n';
  }
  if (component.slug === "payment-method-picker") {
    preamble += '  const [paymentMethod, setPaymentMethod] = useState("standard");\n';
  }
  if (component.slug === "replica-allocation") {
    preamble += `  const [replicaCounts, setReplicaCounts] = useState<Record<string, number>>(${JSON.stringify(initialReplicaCounts)});\n`;
  }
  if (component.slug === "moderation-appeal-form") {
    imports.add("ModerationAppealForm");
    imports.add("ModerationNotice");
    preamble += '  const [draft, setDraft] = useState("");\n  const [status, setStatus] = useState("");\n';
  }
  if (component.slug === "record-relation-form") {
    imports.add("RecordRelationForm");
    imports.add("RecordRelations");
    preamble += `  const [relationDraft, setRelationDraft] = useState(${JSON.stringify(initialRelationDraft)});\n  const [status, setStatus] = useState("");\n`;
  }
  if (component.slug === "expense-allocation-form") {
    preamble += `  const [lines, setLines] = useState<import("react").ComponentProps<typeof ExpenseAllocationForm>["lines"]>(${JSON.stringify(initialExpenseLines)});\n  const [status, setStatus] = useState("");\n`;
  }
  if (usesRelativeRange) preamble += `  const [range, setRange] = useState<import("react").ComponentProps<typeof RelativeTimeRangePicker>["value"]>(${JSON.stringify(initialRelativeRange)});\n`;
  const usesQuantity = component.slug === "unit-number-field";
  if (usesQuantity) preamble += `  const [quantity, setQuantity] = useState<import("react").ComponentProps<typeof UnitNumberField>["value"]>(${JSON.stringify(initialQuantity)});\n`;
  const usesEditableGrid = component.slug === "editable-grid";
  const usesReorderList = component.slug === "reorder-list";
  const usesKanbanBoard = component.slug === "kanban-board";
  if (usesKanbanBoard) {
    const columnsSource = values.cardLayout==="project" ? `[
${projectBoardRecords.map(({cards,...column})=>`    {...${JSON.stringify(column)}, cards: [
${cards.map(({icon,...card})=>{
  if (icon) icons.add(icon);
  return `      {...${JSON.stringify(card)}${icon ? `, icon: <${icon} />` : ""}},`;
}).join("\n")}
    ]},`).join("\n")}
  ]` : JSON.stringify(initialBoardColumns);
    preamble += `  type Props = import("react").ComponentProps<typeof KanbanBoard>;
  const [columns, setColumns] = useState<Props["columns"]>(${columnsSource});
  const [cardId, setCardId] = useState<string | null>(null);
  const activeLane = columns.find(column => column.cards.some(card => card.id === cardId));
  const activeCard = activeLane?.cards.find(card => card.id === cardId);
  const moveCard: Props["onMove"] = move => setColumns(previous => {
    const source = previous.find(column => column.id === move.fromColumnId);
    const destination = previous.find(column => column.id === move.toColumnId);
    const card = source?.cards.find(item => item.id === move.cardId);
    if (!card || !destination || (move.beforeCardId && !destination.cards.some(item => item.id === move.beforeCardId))) return previous;
    return previous.map(column => {
      if (column !== source && column !== destination) return column;
      const cards = column.cards.filter(item => item.id !== card.id);
      if (column === destination) {
        const index = cards.findIndex(item => item.id === move.beforeCardId);
        cards.splice(index < 0 ? cards.length : index, 0, card);
      }
      return { ...column, cards };
    });
  });
`;
  }
  if (usesReorderList) preamble += `  type Props = import("react").ComponentProps<typeof ReorderList>;
  const [items, setItems] = useState<Props["items"]>(${JSON.stringify(initialReorderItems)});
  const moveItem: Props["onMove"] = move => setItems(previous => {
    const byId = new Map(previous.map(item => [item.id, item]));
    const source = byId.get(move.sourceId), target = byId.get(move.targetId);
    if (!source || !target) return previous;
    const within = (id: string, ancestorId: string) => {
      for (let parent = byId.get(id)?.parentId; parent; parent = byId.get(parent)?.parentId) {
        if (parent === ancestorId) return true;
      }
      return false;
    };
    const isMoving = (item: Props["items"][number]) => item.id === source.id || within(item.id, source.id);
    const moved = previous.filter(isMoving);
    const remaining = previous.filter(item => !isMoving(item));
    const parentId = move.placement === "inside" ? target.id : target.parentId;
    let insertion = remaining.findIndex(item => item.id === target.id);
    if (move.placement !== "before") {
      insertion++;
      while (remaining[insertion] && within(remaining[insertion].id, target.id)) insertion++;
    }
    moved[0] = {...source, parentId};
    return [...remaining.slice(0, insertion), ...moved, ...remaining.slice(insertion)];
  });
`;
  if (usesEditableGrid) preamble += `  type GridProps = import("react").ComponentProps<typeof EditableGrid>;
  const validateQuantity = (value: string) => /^\\d+$/.test(value) ? undefined : "Enter a whole number of units.";
  const columns: GridProps["columns"] = [
    {id:"product",label:"Product",readOnly:true},
    {id:"stock",label:"In stock",align:"end",inputMode:"numeric",validate:validateQuantity},
    {id:"reserved",label:"Reserved",align:"end",inputMode:"numeric",validate:validateQuantity},
  ];
  const [rows, setRows] = useState<GridProps["rows"]>(${JSON.stringify(initialGridRows)});
  const applyChanges: GridProps["onChanges"] = changes => setRows(previous => previous.map(row => {
    const edits = changes.filter(change => change.rowId === row.id);
    return edits.length ? {...row, values:{...row.values, ...Object.fromEntries(edits.map(change => [change.columnId, change.value]))}} : row;
  }));
`;
  const usesGradient = component.slug === "gradient-editor";
  if (usesGradient) preamble += `  const [gradient, setGradient] = useState<import("react").ComponentProps<typeof GradientEditor>["value"]>(${JSON.stringify(initialGradient)});\n`;
  const usesTranscript = ["media-transcript", "media-seek-bar", "media-chapter-list"].includes(component.slug);
  if (usesTranscript) preamble += '  const [time, setTime] = useState(12);\n';
  const usesTraceZoom = component.slug === "trace-waterfall";
  if (usesTraceZoom) preamble += '  const [traceZoomId, setTraceZoom] = useState<string | null>(null);\n';
  const usesTreeRowActions = component.slug === "tree" && Boolean(values.showRowActions) && !values.empty;
  if (usesTreeRowActions) {
    for (const icon of ["Eye","EyeOff","Lock","LockOpen"]) icons.add(icon);
    preamble += `  const [treeLayer, setTreeLayer] = useState(${JSON.stringify({hidden:false,locked:false})});
  const rowActions = [
    {id:"visibility", kind:"toggle" as const, label:"Hide Button.tsx", pressed:treeLayer.hidden, icon:treeLayer.hidden ? <EyeOff /> : <Eye />, onPressedChange:(hidden: boolean)=>setTreeLayer({...treeLayer,hidden})},
    {id:"lock", kind:"toggle" as const, label:"Lock Button.tsx", pressed:treeLayer.locked, icon:treeLayer.locked ? <Lock /> : <LockOpen />, onPressedChange:(locked: boolean)=>setTreeLayer({...treeLayer,locked})},
  ];
`;
  }
  const usesFindBar = component.slug === "find-bar";
  if (usesFindBar) preamble += `  const [findState, setFindState] = useState(${JSON.stringify(initialFindState)});
  const {query, source, caseSensitive, regex} = findState;
  const specials = ${JSON.stringify(findRegexSpecials)};
  let matches: RegExpMatchArray[] = [];
  let queryError: string | undefined;
  try {
    const pattern = regex ? query : Array.from(query, char => specials.includes(char) ? "\\\\" + char : char).join("");
    if (query) matches = Array.from(source.matchAll(new RegExp(pattern, caseSensitive ? "g" : "gi"))).filter(match => match[0].length > 0);
  } catch { queryError = "Enter a valid regular expression."; }
  const activeMatch = Math.min(findState.active, matches.length) || null;
  const updateFind = (changes: Partial<typeof findState>) => setFindState({...findState, ...changes});
  const stepFind = (direction: number) => updateFind({active: ((activeMatch ?? 1) - 1 + direction + matches.length) % matches.length + 1});
  const replaceFind = (all: boolean) => {
    const chosen = all ? matches : activeMatch ? [matches[activeMatch - 1]] : [];
    const nextSource = chosen.reduceRight((text, hit) => {
      const index = hit.index!;
      return text.slice(0, index) + findState.replacement + text.slice(index + hit[0].length);
    }, source);
    updateFind({source: nextSource, active: 1});
  };
`;
  const usesTextSuggestions = component.slug === "suggestion-textarea";
  const usesQueryInput = component.slug === "query-input";
  if (usesQueryInput) preamble += `  const [draft, setDraft] = useState("");
  const [removedTagIds, setRemovedTagIds] = useState<string[]>([]);
  const suggestions = ${JSON.stringify(previewQuerySuggestions)};
  const resolveSuggestions = ({value, caret}: {value:string; caret:number}) => {
    const fragment = value.slice(0, caret).match(${previewQueryFragment})?.[1];
    if (!fragment) return;
    const end = caret + (value.slice(caret).match(/^[\\w:-]*/u)?.[0].length ?? 0);
    const items = suggestions.filter(item => item.insertText.startsWith(fragment));
    return {label:"Request status",start:caret-fragment.length,end,items};
  };
`;
  if (usesTextSuggestions) preamble += '  const [draft, setDraft] = useState("");\n';
  const usesPairs = ["key-value-editor", "key-value-row"].includes(component.slug);
  if (usesPairs) preamble += `  const [pairs, setPairs] = useState<Array<import("react").ComponentProps<typeof ${component.slug === "key-value-editor" ? "KeyValueEditor" : "KeyValueRow"}>["value"]${component.slug === "key-value-editor" ? "[number]" : ""}>>(${JSON.stringify(initialPairs)});\n`;
  if (component.slug === "filter-condition" && !usesTypedCondition) preamble += '  const [condition, setCondition] = useState<{property:string;operator:"is"|"is-not";values:string[]}>({property:"status",operator:"is",values:["active"]});\n';
  if (["file-item","file-list","upload-item","upload-list"].includes(component.slug)) preamble += '  const [fileStates, setFileStates] = useState<Record<string, "queued" | "uploading" | "paused" | "processing" | "success" | "error" | "cancelled" | "removed">>({});\n';
  const usesFileCardState = component.slug === "file-card" && values.showRemove;
  if (usesFileCardState) preamble += '  const [removedFiles, setRemovedFiles] = useState<Record<string, boolean>>({});\n';
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
  if (component.slug === "icon-swap") { icons.add("Bell"); icons.add("BellOff"); }
  const usesChecked = ["checkbox", "radio", "switch", "reaction-button", "notification-item", "notification-list", "icon-swap"].includes(component.slug) ||
    (timelineFeed && Boolean(values.descriptions));
  if (["section","page-header","app-top-bar"].includes(component.slug) && values.showActions) imports.add("Button");
  if (component.slug === "page-header" && values.showMetadata) imports.add("Badge");
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
      '  const [inboxFilter, setInboxFilter] = useState<"all" | "unread">("all");\n' +
      `  const items = ${JSON.stringify(values.longList ? [...notificationTriggerItems,...notificationHistory] : notificationTriggerItems)}.map((item, index) => ({ ...item, unread: inboxUnread[item.id] ?? (index < ${Number(values.demoUnread)}) }));\n`;
  }
  if (component.slug === "activity-timeline" && values.empty) imports.add("EmptyState");
  if (component.slug === "audit-timeline" && values.empty) imports.add("EmptyState");
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
  if (component.slug === "pipeline-run" && values.scenario==="Failed" && !values.empty) imports.add("CodeSnippet");
  if (component.slug === "session-list") {
    for (const name of ["AlertDialog","Button"]) imports.add(name);
    if (values.scenario !== "Empty") icons.add("Laptop");
    if (["Multiple sessions","Current unknown"].includes(String(values.scenario))) {
      icons.add("Smartphone");
      icons.add("Monitor");
    }
  }
  if (component.slug === "pending-invitation-list" && values.actions) {
    for (const name of ["AlertDialog","Button","Inline"]) imports.add(name);
  }
  if (component.slug === "api-key-list") for (const name of ["AlertDialog","Button"]) imports.add(name);
  if (component.slug === "passkey-list" && values.scenario === "Registered") {
    for (const name of ["AlertDialog","Button"]) imports.add(name);
  }
  if (component.slug === "staged-changes" && values.allowDiscard) imports.add("Button");
  if (component.slug === "version-history") {
    imports.add("Text");
    if (values.allowRestore) {
      imports.add("AlertDialog");
      imports.add("Button");
    }
  }
  if (component.slug === "form-actions") {
    imports.add("Button");
    if (values.showStatus) imports.add("SaveStatus");
  }
  if (component.slug === "collection-card" && values.showActions) imports.add("CopyButton");
  if (component.slug === "generation-preview") {
    imports.add("Button");
    if (values.partial || values.state === "ready") imports.add("Image");
  }
  const usesStatus = (component.slug === "publication-preview" && values.scenario !== "Link only") || ["access-request-form", "live-follow-control", "image-alt-text-editor", "import-column-mapping"].includes(component.slug) || hasFeedback || component.slug === "template-picker" || component.slug === "environment-creation-form" || component.slug === "database-webhook-form" || component.slug === "log-export-form" || component.slug === "content-report-form" || component.slug === "content-label-settings" || component.slug === "muted-word-form" || component.slug === "save-bar" || ["deployment-rollback-dialog","feed-update","generation-preview","thumbnail-strip","zoom-control","rollout-allocation","review-thread","backup-picker","image-annotations","image-focal-point","media-trim-range","deployment-region-picker","cidr-field"].includes(component.slug) || (component.slug === "profile-summary" && values.follow) ||
    ["follow-button","dependency-graph","file-trigger","form-actions","filter-condition","file-item", "file-list", "file-list-skeleton", "upload-item", "upload-list","data-table","data-list", "data-list-item","context-menu", "command-list", "command-palette", "steps", "section", "drawer", "alert-dialog", "empty-state", "card", "toolbar", "menu", "breadcrumb", "segmented-control", "toggle", "toggle-group", "button", "button-group", "split-button", "input-group", "icon-button", "stack", "inline", "radio-group", "checkbox-group"].includes(component.slug) || (component.slug === "code-snippet" && Boolean(values.copyAction));
  if (usesChecked) preamble += `  const [checked, setChecked] = useState(${JSON.stringify(Boolean(values.checked))});\n`;
  const usesRecordSelection = ["muted-word-list", "notification-channel-settings", "permission-editor", "staged-changes", "changed-file-list", "pending-invitation-list", "log-context"].includes(component.slug) ||
    (["data-list", "data-list-item", "card", "file-card"].includes(component.slug) ||
    ["card-skeleton", "file-card-skeleton"].includes(component.slug) && values.loaded) && values.selectable;
  if (usesRecordSelection) preamble +=
    '  const [listSelection, setListSelection] = useState<Record<string, boolean>>({});\n';
  if (component.slug === "menu" && ["preferences", "mixed"].includes(String(values.scenario))) preamble += '  const [notificationsEnabled, setNotificationsEnabled] = useState(true);\n  const [density, setDensity] = useState("Compact");\n';
  if (usesStatus || component.slug === "rating-breakdown") preamble += '  const [status, setStatus] = useState("");\n';
  if (component.slug === "zoom-control") preamble += '  const zoom = Number(status || 1);\n';
  if (component.slug === "thumbnail-strip") preamble += `  const assets = ${JSON.stringify(thumbnailPreviewItems)};\n  const selected = assets.find(item => item.id === status) ?? assets[0];\n`;
  if (component.slug === "save-to-collection") {
    preamble += '  const [saved, setSaved] = useState(false);\n  const [memberships, setMemberships] = useState<Record<string, boolean>>({});\n';
  }
  if (component.slug === "evidence-checklist") {
    preamble += values.showAction ? '  const [requested, setRequested] = useState(false);\n' : '  const requested = false;\n';
  }
  if (component.slug === "scheduled-task-list") {
    preamble += values.showAction ? '  const [paused, setPaused] = useState(false);\n' : '  const paused = false;\n';
  }
  if (component.slug === "save-bar") preamble += '  const [savedProjectName, setSavedProjectName] = useState("Design system");\n';
  if (usesPagination) preamble += `  const [page, setPage] = useState(${currentPage});\n`;
  if (component.slug === "record-navigator") preamble += `  const records = ${JSON.stringify(adjacentRecordExamples)};
  const recordHeading = useRef<HTMLElement | null>(null);
  function selectRecordPage(next: number) {
    setPage(next);
    requestAnimationFrame(() => recordHeading.current?.focus({preventScroll:true}));
  }
`;
  if (component.slug === "code-snippet" && values.copyAction) preamble += `  async function copy() {\n    try {\n      await navigator.clipboard.writeText(${JSON.stringify(String(values.code))});\n      setStatus("Copied command.");\n    } catch {\n      setStatus("Select the code and copy it manually.");\n    }\n  }\n`;
  const stylesheet = importMode === "project" ? "@/ui/styles.css" : "@flood-md/react/styles.css";
  const code = '"use client";\n\n' + (component.slug === "record-navigator" ? 'import { useRef, useState } from "react";\n' : component.slug === "table-of-contents" ? 'import { useRef } from "react";\n' : component.slug === "data-table" ? 'import { useState, type ReactNode } from "react";\n' : commentReply ? 'import { useRef, useState, type MouseEvent } from "react";\n' : usesTreeRowActions || usesFindBar || usesGradient || usesTranscript || usesTraceZoom || usesPairs || usesEditableGrid || usesReorderList || usesKanbanBoard || usesTextSuggestions || usesQueryInput || usesTypedCondition || usesRelativeRange || usesRecurrence || usesQuietHours || usesQuantity || usesFileCardState || usesPalette || usesAvatarPicker || usesBudgetRange || reactionSelection || commentComposer || errorState || threadComposer || navigationState || typingIndicator || notificationSubscription || snoozeMenu || reminderControl || component.slug === "reply-audience" || usesPresence || usesChecked || usesStatus || component.slug === "rating-breakdown" || usesRecordSelection || (component.slug === "app-shell" && values.navigationMode === "drawer") || component.slug === "toast-region" || component.slug === "filter-group" || component.slug === "collection-toolbar" || component.slug === "collection-view-switcher" || component.slug === "environment-switcher" || component.slug === "approval-request" || component.slug === "sidebar" || usesPagination || component.slug === "card-deck" || ["notification-inbox", "notification-trigger"].includes(component.slug) || component.slug === "message-composer" || (["evidence-checklist", "scheduled-task-list"].includes(component.slug) && values.showAction) || ["tag-group","upload-queue","save-to-collection"].includes(component.slug) ? 'import { useState } from "react";\n' : "") + importStatements([...imports].sort(), importMode) + "\n" + (icons.size ? `import { ${[...icons].sort().join(", ")} } from "lucide-react";\n` : "") + `import "${stylesheet}";\n\nexport function Example() {\n` + preamble + `  return (\n${jsx}\n  );\n}\n`;
  useEffect(() => { callback.current(code); importsCallback.current?.([...imports].sort()); }, [code]);

  const controls = componentKnobs(component).filter(knob => {
    if(component.slug==="calendar" && values.selectionMode==="multiple" && knob.name==="granularity") return false;
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
  const spacious = ["content-label-settings","notification-channel-settings","navigation-item","navigation-group","sidebar","collection-view-switcher","collection-toolbar","filter-group","environment-variable-list","feed-update","generation-preview","policy-evaluation","change-region","calendar","time-picker","file-item", "file-list-skeleton", "upload-item","data-list", "data-list-item", "check-card", "radio-card","color-picker", "date-time-picker", "tree-select", "tree", "navigation-tree", "list-box", "navigation-list", "steps", "section", "center", "container", "grid", "aspect-ratio", "empty-state", "card", "card-skeleton", "table", "description-list", "accordion", "input", "input-group", "textarea", "select", "field", "label", "fieldset", "radio-group", "checkbox-group", "scroll-area", "surface", "flood-root", "stack", "code-snippet"].includes(component.slug);
  const labelFor = (knob: Knob) => knob.label
    ?? ({ controlSize: "Size", contentInset: "Content clearance", copyAction: "Copy button", label: "Accessible name" } as Record<string, string>)[knob.name]
    ?? (knob.name[0].toUpperCase() + knob.name.slice(1).replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`));
  const resetPreview = () => {
      setDraft(""); setAttachments([]); setSelectedUploads([]); setStreaming(false); setReplies([]); setSelectedReactions([]); setInboxUnread({}); setInboxFilter("all"); setListSelection({});
      setState({ slug: component.slug, values: initialValues(component) });
      setStatus(""); setSubscriptionMode("participating"); setEstimate({id:"3",label:"3 points",shortLabel:"3"}); setReplyAudience("anyone"); setSavedProjectName("Design system"); setPagination({slug:component.slug,page:initialPage}); setResetKey(key => key + 1);
      setSavedReference(false); setReferenceCollections({});
      resetViewPosition();
      setPairs(initialPairs);
      setFindState(initialFindState);
      setTreeLayer(initialTreeLayer);
      setTypedCondition(initialTypedCondition);
      setTypedFilterGroup(initialTypedGroup);
      setTranscriptTime(12);
      setTraceZoom(null);
      setGradient(initialGradient);
      setRelativeRange(initialRelativeRange);
      setRecurrence(initialRecurrence);
      setHandleDraft({hosted:"maya",custom:"maya.example"});
      setCronExpression("0 9 * * 1");
      setQuietHours(initialQuietHours);
      setMuteDraft(initialMuteDraft);
      setInviteDraft({email:"",roleId:""});
      setRequestMessage("");
      setSpendLimits({alert:"75.00",cap:"125.00"});
      setReportDraft(initialReportDraft);
      setEnvironmentDraft({name:"Preview",mode:"duplicate",sourceId:"staging"});
      setWebhookDraft(initialWebhookDraft);
      setLogExportDraft(initialLogExportDraft);
      setRestartPolicy(initialRestartPolicy);
      setSharing(initialSharing);
      setTemplateId("incident");
      setPaymentMethod("standard");
      setRelationDraft(initialRelationDraft);
      setExpenseLines(initialExpenseLines);
      setReplicaCounts(initialReplicaCounts);
      setQuantity(initialQuantity);
      setGridRows(initialGridRows);
      setReorderItems(initialReorderItems);
      setBoardExamples(initialBoardExamples);
      setBoardCardId(null);
      setFilterValue({property:"status",operator:"is",values:["active"]});
      setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});
      setFileStates({}); setRemovedTagIds([]); setNavValue("overview"); setViewValue("all"); setApprovalDraft({decisionId:null,note:""}); setApprovalOutcome(""); setToolbarSearch(""); setToolbarOpen(false);
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
      <Flood.ScrollArea orientation="both" contentInset="none" className="workbench-stage preview-stage" data-component={component.slug} data-size={["passkey-list", "release-target-matrix", "cycle-progress"].includes(component.slug) || ["calendar","meeting-availability", "log-context", "http-exchange-details", "http-request-row", "spend-limit-form", "access-request-form", "pending-invitation-list", "access-invite-form", "scheduled-task-list", "evidence-checklist", "service-availability", "advisor-finding", "record-merge-review", "heading", "timeline", "activity-timeline", "connection-details", "comment-thread", "toast-region", "dropzone", "color-picker", "gradient-editor", "data-table", "collection-card", "file-card", "file-card-skeleton", "file-card-grid", "file-list", "file-list-skeleton", "upload-list", "upload-queue", "date-time-range-picker", "relative-time-range-picker", "recurrence-editor", "quiet-hours-editor", "muted-word-form", "content-report-form", "json-inspector", "trace-waterfall", "log-viewer", "code-diff", "line-chart", "bar-chart", "donut-chart", "heatmap", "scatter-chart", "range-chart", "bullet-chart", "waterfall-chart", "histogram", "box-plot", "dumbbell-chart", "bar-list"].includes(component.slug) ? "display" : spacious ? "regular" : "compact"}
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
