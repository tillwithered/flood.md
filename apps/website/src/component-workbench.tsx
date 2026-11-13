import { Fragment, createElement, useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { House, Folder, Layers3, Bell, ChartNoAxesColumn, Settings, CircleHelp, ArrowRight, Copy, Plus, Undo2, Redo2, History, Bold, Italic, Underline, Share2, CalendarDays, CalendarRange, Calendar, Pencil, Archive, Trash2, Ellipsis, ChevronDown } from "lucide-react";
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
const sizes = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
const spaces = ["0", "1", "2", "3", "4", "6", "8", "12"];
const variants = ["solid", "subtle", "outline", "ghost"];
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
      sortValues: { budget, status, owner },
      cells: {
        ...row.cells,
        status: choice("status", status, Object.keys(projectStatusTones), <Flood.Badge size="sm" tone={projectStatusTones[status]}>{status}</Flood.Badge>),
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
  '    return { ...row, sortValues: { budget, status, owner }, cells: { ...row.cells,\n' +
  '      status: choice("status", status, Object.keys(statusTones), <Badge size="sm" tone={statusTones[status]}>{status}</Badge>),\n' +
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
const knobs: Record<string, Knob[]> = {
  "app-shell": [select("scroll", ["content", "page"], "content"), {...select("navigationSide", ["start", "end"], "start"), label:"Navigation side"}, {...select("navigationMode", ["auto", "docked", "drawer", "none"], "auto"), label:"Navigation mode"}, {...toggle("showTopBar", true), label:"Show top bar"}, {...toggle("showFooter"), label:"Show footer"}],
  "app-top-bar": [toggle("bordered"), toggle("showActions", true)],
  "navigation-item": [{...toggle("compareStates"),label:"Compare states"},select("mode",["link","branch","link-branch","action"],"link-branch"),select("size",["sm","md","lg"],"sm"),select("variant",["quiet","standard"],"quiet"),toggle("compact"),toggle("current",true),toggle("disabled"),toggle("icon",true),toggle("badge"),toggle("showTrailingAction"),toggle("longLabel")],
  "navigation-group": [select("size",["sm","md","lg"],"sm"),toggle("hideLabel"),toggle("separator"),toggle("collapsible"),toggle("compact"),toggle("showHeadingAction",true)],
  sidebar: [toggle("collapsed"),select("variant",["quiet","standard"],"quiet"),select("size",["sm","md","lg"],"sm"),select("side",["start","end"],"start"),select("width",["14rem","16rem","19rem"],"16rem"),toggle("longNavigation"),toggle("branchGuides",true),select("headerLayout",["inline","stacked"],"inline"),toggle("collapsible",true)],
  "collection-view-switcher": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["18rem","32rem","52rem"],"52rem"),toggle("editable",true),toggle("dirty"),toggle("disabled")],
  "collection-toolbar": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["24rem","40rem","52rem"],"52rem"),select("align",["stretch","end"],"stretch"),toggle("showFilters",true),toggle("showClear",true),toggle("disabled")],
  "filter-group": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),select("maxConditions",["none","1","2","3","5"],"none"),toggle("allowDuplicateProperties"),toggle("hideLabel",true),toggle("disabled")],
  "filter-condition": [select("controlSize",["sm","md","lg","xl"],"sm"),select("width",["26rem","40rem","52rem"],"52rem"),toggle("removable",true),toggle("hideLabel",true),toggle("disabled")],
  "bulk-action-bar": [select("counter",["label","number","none"],"label"),select("selectionCount",["1","2","9","10","99","100","999"],"2"),select("width",["16rem","24rem","32rem"],"32rem"),select("size",["sm","md","lg","xl"],"sm"),select("maxVisibleActions",["1","2","3"],"2"),toggle("pending"),toggle("disabled")],
  "autocomplete": [select("controlSize", ["sm","md","lg","xl"], "md"),select("loadState",["ready","loading","error"],"ready"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "overflow-actions": [select("containerVariant",["contained","plain"],"contained"),select("shape",["pill","rounded"],"pill"),select("width",["14rem","24rem","40rem"],"24rem"),select("size",["sm","md","lg","xl"],"md"),select("variant",variants,"subtle"),toggle("disabled")],
  "menubar": [select("controlSize",["sm","md","lg","xl"],"sm"),toggle("disabled")],
  "time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("interval", ["900", "1800", "3600"], "1800"),toggle("hideLabel"),toggle("required"),toggle("readOnly"),toggle("disabled")],
  "date-time-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"),select("precision", ["minute", "second"], "minute"),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"),toggle("required",true),toggle("hideLabel"),toggle("readOnly"),toggle("disabled")],
  "file-meta": [select("format", ["PDF", "PNG", "SVG", "ZIP", "none"], "PDF"),select("size", ["0", "18400", "850000", "2400000"], "2400000"),toggle("showSize",true)],
  "file-item": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("longName"),toggle("disabled")],
  "file-list": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showSize",true),toggle("showType",true),toggle("showActions",true),toggle("longName"),toggle("disabled")],
  "upload-item": [select("state", ["queued", "uploading", "success", "error", "cancelled"], "uploading"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),toggle("showActions",true),toggle("disabled")],
  "upload-list": [select("density", ["compact", "comfortable"], "comfortable"),select("progress", ["unknown", "0", "25", "45", "75", "100"], "45"),toggle("showActions",true),toggle("disabled")],
  "image-preview": [select("image", ["brand", "missing"], "brand"),toggle("showCaption",true),toggle("showDownload"),toggle("disabled")],
  "data-table": [select("density", ["compact", "comfortable"], "comfortable"),select("pageSize", ["3", "5", "10", "15"], "5"),toggle("stickyHeader"),toggle("selectable",true),toggle("showResults",true),toggle("showSelection",true),toggle("striped"),select("state", ["ready", "loading", "error"], "ready"),toggle("emptyRows"),toggle("customEmpty",true)],
  "data-list": [select("density", ["compact", "comfortable"], "comfortable"),toggle("dividers",true),toggle("showDescription",true),toggle("showMedia",true),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle")],
  "data-list-item": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showDescription",true),toggle("showMedia",true),toggle("showMetadata",true),toggle("showActions",true),toggle("longTitle")],
  "check-card": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showDescription",true),toggle("showMetadata",true),toggle("indeterminate"),toggle("readOnly"),toggle("disabled")],
  "radio-card": [select("density", ["compact", "comfortable"], "comfortable"),toggle("showDescription",true),toggle("showMetadata",true),toggle("readOnly"),toggle("disabled")],
  "color-swatch": [select("size", ["sm", "md", "lg"], "md"), select("value", ["#ff47a8", "#ffffff", "#78b8ff"], "#ff47a8")],
  "color-picker": [select("controlSize", ["sm", "md", "lg"], "md"), toggle("hideLabel"), toggle("readOnly"), toggle("disabled"), toggle("presets", true)],
  "hover-card": [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "center"), toggle("disabled")],
  "tree-select": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-time-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  tree: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("multiple"), toggle("hideLabel"), toggle("showDescriptions"), toggle("readOnly"), toggle("disabled"), toggle("loading"), toggle("empty")],
  "navigation-tree": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["introduction", "installation", "button"], "installation"), toggle("branchGuides", true), toggle("disableLast"), toggle("loading")],
  "context-menu": [select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("disabled")],
  "error-summary": [select("announcement", ["off", "polite", "assertive"], "off"), toggle("showErrors", true), toggle("showDescription", true), toggle("autoFocus")],
  "resizable-panels": [select("orientation", ["horizontal", "vertical"], "horizontal"), {...select("defaultValue", ["30", "50", "70"], "50"),label:"Initial split"}, toggle("disabled")],
  "range-calendar": [select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "date-range-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-range-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "date-picker": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "time-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("precision", ["minute", "second"], "minute"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  calendar: [select("granularity", ["day", "month", "year"], "day"),toggle("showViewControls",true),select("locale", ["en-US", "ru-RU", "de-DE"], "en-US"), select("weekStartsOn", ["0", "1", "6"], "1"), toggle("readOnly"), toggle("disabled")],
  "date-field": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("order", ["month-day-year", "day-month-year", "year-month-day"], "day-month-year"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "command-list": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("hideLabel"), toggle("loading"), toggle("disabled"), toggle("disableLast", true)],
  "command-palette": [select("density", ["comfortable", "compact"], "comfortable"), select("scenario", ["pages", "commands", "empty", "loading"], "pages"), toggle("grouped", true), toggle("disableLast", true)],
  editable: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), {...select("blurAction", ["commit", "cancel", "none"], "commit"),label:"On blur"}, {...toggle("showActions", true),label:"Save / cancel"}, toggle("hideLabel"), toggle("readOnly"), toggle("disabled")],
  "tag-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  "list-box": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("required"), toggle("empty"),toggle("showDescription",true),toggle("multiple"), toggle("hideLabel"), toggle("readOnly"), toggle("disabled")],
  "pin-input": [select("length", ["4", "6", "8"], "6"), select("mode", ["numeric", "alphanumeric"], "numeric"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("mask"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  rating: [select("max", ["3", "5", "10"], "5"), select("size", ["sm", "md", "lg"], "md"), toggle("hideLabel"), toggle("required"), toggle("readOnly"), toggle("disabled")],
  dropzone: [toggle("multiple", true), toggle("clearable", true), toggle("required"), toggle("disabled")],
  "character-count": [select("count", ["0", "24", "40", "48"], "24"), select("mode", ["count", "remaining"], "count")],

  "navigation-list": [select("size", ["sm", "md", "lg"], "md"), select("currentValue", ["overview", "activity", "settings"], "overview"), toggle("grouped", true), toggle("showDescriptions")],
  steps: [select("orientation", ["horizontal", "vertical"], "horizontal"), select("currentValue", ["details", "access", "review"], "access"), toggle("interactive"), toggle("error"), toggle("disableLast")],
  "page-header": [select("headingSize", ["page", "large", "display"], "large"), toggle("showDescription"), toggle("showActions", true)],
  section: [{...select("headingLevel", ["2", "3", "4", "5", "6"], "2"),label:"Heading level (HTML)"}, {...select("headingSize", ["group", "section", "page", "large", "display"], "section"),label:"Heading size"}, toggle("showDescription", true), toggle("showActions", true)],
  split: [select("side", ["start", "end"], "end"), select("ratio", ["balanced", "main", "aside"], "main"), select("collapseAt", ["sm", "md", "lg", "never"], "sm"), select("gap", spaces, "6")],
  center: [toggle("inline"), select("maxWidth", ["16rem", "24rem", "100%"], "16rem"), select("minHeight", ["8rem", "12rem", "16rem"], "12rem")],
  "skip-link": [],

  "avatar-group": [select("size", ["sm", "md", "lg"], "md"), select("max", ["2", "3", "4", "5"], "4"), toggle("longNames")],
  "status-indicator": [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "success"), select("size", ["sm", "md", "lg"], "md"), {...toggle("announce"), label:"Announce to screen readers"}],
  figure: [select("captionPosition", ["before", "after"], "after"), toggle("showCaption", true)],
  blockquote: [toggle("attribution", true)],
  "inline-code": [select("size", ["sm", "md", "lg"], "md"), toggle("wrap", true), toggle("longValue")],
  metric: [select("size", ["sm", "md", "lg"], "md"), select("direction", ["up", "down", "flat"], "up"), select("tone", ["neutral", "success", "warning", "error", "info"], "success"), toggle("trend", true), toggle("hint", true)],
  sparkline: [select("size", ["sm", "md"], "md"), select("tone", ["neutral", "accent", "success", "warning", "error"], "accent"), select("variant", ["line", "area"], "area"), select("series", ["rising", "falling", "gaps"], "rising"), toggle("showLabel")],
  "line-chart": [select("variant", ["line", "area"], "area"), select("curve", ["linear", "smooth"], "smooth"), select("data", ["complete", "month", "gap", "single", "empty"], "complete"), toggle("comparison", true), {...toggle("showYAxis"), label:"Y axis"}, {...toggle("showLegend"), label:"Legend"}],
  "bar-chart": [select("layout", ["grouped", "stacked", "percent"], "grouped"), select("data", ["complete", "missing", "signed", "zero", "empty"], "complete"), toggle("comparison", true), {...toggle("showLegend"), label:"Legend"}],
  "donut-chart": [select("data", ["complete", "single", "zero", "empty"], "complete"), {...toggle("showLegend"), label:"Legend"}],
  "heatmap": [select("data", ["complete", "gaps", "empty"], "complete")],
  "scatter-chart": [select("data", ["complete", "single", "empty"], "complete")],
  "range-chart": [select("data", ["complete", "gap", "empty"], "complete"), {...toggle("midpoint", true), label:"Median"}],
  "dumbbell-chart": [select("data", ["complete", "missing", "empty"], "complete")],
  "box-plot": [select("data", ["complete", "gap", "flat", "empty"], "complete"), {...toggle("outliers", true), label:"Outliers"}],
  "bullet-chart": [select("data", ["complete", "zero", "empty"], "complete")],
  "waterfall-chart": [select("data", ["complete", "signed", "empty"], "complete")],
  "histogram": [select("data", ["complete", "zero", "empty"], "complete")],
  "bar-list": [select("tone", ["accent", "neutral"], "accent"), select("data", ["ranked", "zero", "empty"], "ranked")],
  timeline: [toggle("descriptions", true), toggle("times", true)],

  "copy-button": [select("size", sizes, "md"), select("variant", variants, "subtle"), toggle("iconOnly"), toggle("disabled")],
  "toast-region": [select("status", ["success", "info", "warning", "error", "neutral"], "success"), select("limit", ["1", "2", "3"], "3"), select("placement", ["bottom-end", "bottom-start", "top-end", "top-start"], "bottom-end"), toggle("inline"), toggle("autoDismiss")],
  "file-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("multiple", true), toggle("clearable", true), statusKnob(), toggle("required"), toggle("disabled")],
  "search-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("clearable", true), statusKnob(), toggle("disabled"), toggle("readOnly")],
  "password-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  tag: [select("size", ["sm", "md", "lg"], "md"), toggle("removable", true), toggle("icon"), toggle("longLabel"), toggle("disabled"), toggle("visible", true)],
  "multi-select": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("clearable"), statusKnob(), toggle("required"), toggle("disabled"), toggle("readOnly"), toggle("disableLast"), toggle("longLabels")],
  combobox: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("clearable"), statusKnob(), toggle("required"), toggle("disabled"), toggle("readOnly"), toggle("disableLast")],
  "number-input": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("step", ["1", "0.1", "5"], "1"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  slider: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("range"), select("step", ["1", "5", "10"], "1"), {...toggle("showValue", true), label:"Show value"}, statusKnob(), toggle("disabled"), toggle("readOnly")],
  container: [select("size", ["sm", "md", "lg", "full"], "lg"), select("gutter", spaces, "6")],
  grid: [select("columns", ["auto", "1", "2", "3", "4", "6"], "auto"), select("minItemWidth", ["10rem", "16rem", "24rem"], "16rem"), select("gap", spaces, "4")],
  "visually-hidden": [toggle("focusable")],
  "aspect-ratio": [select("ratio", ["1", "1.3333333333333333", "1.7777777777777777", "2"], "1.7777777777777777")],
  image: [select("fit", ["cover", "contain"], "cover"), toggle("decorative")],
  list: [toggle("ordered"), toggle("marker", true), select("gap", spaces, "2")],
  "empty-state": [select("density", ["compact", "comfortable"], "comfortable"), toggle("showDescription", true), toggle("showIcon", true), toggle("showActions", true)],
  card: [select("density", ["compact", "comfortable"], "comfortable"), select("elevation", ["default", "raised"], "default"), toggle("showTitle", true), toggle("showDescription", true), toggle("showActions", true), toggle("showFooter", true)],
  toolbar: [select("variant",["contained","plain"],"contained"),select("shape",["rounded","pill"],"rounded"),select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("loop", true), toggle("disableUndo")],
  kbd: [select("size", ["sm", "md", "lg"], "sm")],
  menu: [{...select("scenario", ["actions", "preferences", "mixed", "submenus"], "actions"),label:"Example"}, select("controlSize", ["sm", "md", "lg", "xl"], "sm"), select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("icons", true), toggle("shortcuts"), toggle("iconTrigger"), toggle("disableArchive", true), toggle("disabled")],
  "description-list": [select("layout", ["inline", "stacked"], "inline"), select("density", ["compact", "comfortable"], "compact"), toggle("dividers"), toggle("longValue")],
  table: [select("density", ["compact", "comfortable"], "comfortable"), select("cellVerticalAlign", ["top", "middle", "bottom"], "middle"), toggle("striped"), toggle("hideCaption"), select("minWidth", ["auto", "32rem", "48rem"], "32rem"), toggle("empty"), toggle("footer", true)],
  progress: [select("value", ["0", "25", "50", "75", "100"], "50"), toggle("indeterminate"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "accent"), toggle("showValue", true)],
  meter: [select("value", ["0", "25", "50", "75", "100"], "50"), select("size", ["sm", "md", "lg"], "md"), select("tone", ["neutral", "accent", "info", "success", "warning", "error"], "neutral"), toggle("showValue", true)],
  alert: [select("tone", ["neutral", "info", "success", "warning", "error"], "info"), select("announcement", ["off", "polite", "assertive"], "off"), toggle("showTitle", true), toggle("showIcon", true), toggle("showAction", false)],
  badge: [select("tone", ["neutral", "accent", "success", "warning", "error", "info"], "neutral"), select("variant", ["subtle", "outline"], "subtle"), select("size", ["sm", "md", "lg"], "md")],
  spinner: [select("size", ["sm", "md", "lg"], "md"), toggle("decorative")],
  skeleton: [select("shape", ["text", "rounded", "circle"], "text"), toggle("animate", true)],
  avatar: [select("size", ["sm", "md", "lg"], "md"), select("shape", ["circle", "rounded"], "circle"), select("image", ["loaded", "missing", "broken"], "loaded"), toggle("decorative")],
  tabs: [select("variant", ["contained", "line"], "contained"), select("activationMode", ["automatic", "manual"], "automatic"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("disabled"), toggle("disableLast")],
  breadcrumb: [select("separator", ["/", "›"], "/"), toggle("currentLink")],
  pagination: [select("pageCount", ["1", "5", "20", "100"], "20"), select("siblingCount", ["0", "1", "2"], "1"), select("controlSize", ["sm", "md", "lg", "xl"], "sm"), toggle("links"), toggle("disabled")],
  tooltip: [select("side", ["top", "bottom", "left", "right"], "top"), select("align", ["start", "center", "end"], "center"), select("delay", ["0", "150", "300", "600"], "300"), toggle("disabled")],
  popover: [select("side", ["top", "bottom", "left", "right"], "bottom"), select("align", ["start", "center", "end"], "start"), toggle("defaultOpen"), toggle("disabled")],
  "alert-dialog": [toggle("defaultOpen"), toggle("confirmDisabled"), toggle("disabled")],
  drawer: [select("side", ["start", "end", "top", "bottom"], "end"), select("size", ["sm", "md", "lg"], "md"), toggle("showFooter", true), toggle("longContent"), toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  sheet: [select("size", ["sm", "md", "lg"], "md"), toggle("showFooter"), toggle("longContent"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  dialog: [toggle("defaultOpen"), toggle("closeOnOutsideClick", true), toggle("disabled")],
  collapsible: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("defaultOpen"), toggle("disabled")],
  accordion: [select("expansionMode", ["single", "multiple"], "single"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("headingLevel", ["2", "3", "4", "5", "6"], "3"), toggle("disabled"), toggle("disableLast")],
  "segmented-control": [select("controlSize", ["sm", "md", "lg", "xl"], "md"), select("content", ["text", "counts", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), toggle("fullWidth"), toggle("disabled"), toggle("disableLast")],
  toggle: [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("defaultPressed"), toggle("iconOnly"), toggle("disabled"), toggle("loading")],
  "toggle-group": [select("selectionMode", ["single", "multiple"], "multiple"), select("content", ["text", "icons", "mixed"], "mixed"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("disableLast")],
  "scroll-area": [select("orientation", ["vertical", "horizontal", "both"], "vertical"), select("contentInset", ["scrollbar", "none"], "scrollbar")],
  "button-group": [select("content", ["text", "icons", "mixed"], "text"), select("orientation", ["horizontal", "vertical"], "horizontal"), select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled")],
  "input-group": [select("start", ["https://", "+7", "@", "$", "icon", "action", "none"], "https://"), select("end", ["action", "icon-action", "kg", "USD", "%", "@company.com", "none"], "action"), select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("disabled"), toggle("readOnly")],
  button: [select("tone", ["default", "danger"], "default"), select("variant", variants, "solid"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  "icon-button": [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  input: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  select: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled")],
  textarea: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), statusKnob(), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  checkbox: [toggle("indeterminate"), toggle("checked", true), toggle("disabled")],
  radio: [toggle("checked", true), toggle("disabled")],
  switch: [toggle("checked", true), toggle("disabled")],
  text: [select("size", ["lead", "body", "compact", "label", "helper"], "body"), select("tone", ["default", "subtle", "error", "success", "warning", "info"], "default")],
  heading: [select("size", ["display", "large", "page", "section", "group"], "page"), select("level", ["1", "2", "3", "4", "5", "6"], "2")],
  stack: [select("gap", spaces, "4")],
  inline: [select("gap", spaces, "4"), select("align", ["start", "center", "end", "baseline"], "center")],
  surface: [select("elevation", ["default", "raised", "overlay"], "default"), select("padding", spaces, "6")],
  "icon-slot": [select("size", sizes, "md"), { name: "label", initial: "" }],
  "code-snippet": [select("codeDirection", ["ltr", "rtl", "auto"], "ltr"), { name: "code", initial: `npx @flood-md/cli@${release.version} init` }, toggle("showPrompt", true), toggle("copyAction", true)],
  label: [toggle("required")],
  "radio-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled"), toggle("required")],
  "checkbox-group": [select("orientation", ["vertical", "horizontal"], "vertical"), statusKnob(), toggle("disabled")],
  fieldset: [select("legendSize", ["label", "section"], "label"), statusKnob(), toggle("disabled"), toggle("hint", true)],
  field: [statusKnob(), toggle("required", true), toggle("error", true), toggle("hint", true)],
  link: [select("variant", ["text", ...variants], "text"), select("size", sizes, "md")], divider: [], "flood-root": [],
};
function componentKnobs(component: ComponentPage): Knob[] {
  const labelHosts = ["file-input", "search-input", "password-input", "multi-select", "combobox", "field", "fieldset", "radio-group", "checkbox-group", "segmented-control", "input", "input-group", "number-input", "slider", "textarea", "select", "progress", "meter"];
  const source = [...(knobs[component.slug] ?? []), ...(labelHosts.includes(component.slug) ? [{...toggle("hideLabel"), label: "Hide label"}] : [])];
  return source.map(knob => {
    const prop = component.contract?.props.find(item => item.name === knob.name);
    const options = knob.options && prop?.options?.length ? (knob.name === "status" ? ["none", ...prop.options.map(String)] : knob.name === "columns" ? ["auto", ...prop.options.map(String)] : prop.options.map(String)) : knob.options;
    const value = component.slug === "accordion" && knob.name === "headingLevel" ? 2 : prop?.defaultLiteral;
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

interface PreviewActions {
  phone?: boolean;
  projectEdits: ProjectEdits;
  setProjectEdit: (id: string, field: ProjectEditField, value: string) => void;
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
  setFileState: (id:string,state:string)=>void;
  menuChecked: boolean;
  setMenuChecked: (checked: boolean) => void;
  menuDensity: string;
  setMenuDensity: (density: string) => void;
  notifications: Flood.ToastItem[];
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
  switch (slug) {
    case "navigation-item": {
      const mode=String(v.mode),branch=mode==="branch"||mode==="link-branch",linked=mode==="link"||mode==="link-branch";
      const label=v.longLabel?"Projects and shared workspace resources":mode==="action"?"Project settings":"Projects";
      const icon=v.icon||v.compareStates?binding("<Folder />",createElement(Folder)):undefined;
      const trailing=v.badge||v.compareStates?binding('<Badge size="sm">4</Badge>',createElement(Flood.Badge,{size:"sm"},"4")):undefined;
      const trailingActionCode=`<Popover title="About this row" trigger={props => <IconButton {...props} label="About this row" size=${JSON.stringify(v.size)} variant="ghost"><Ellipsis /></IconButton>}>The action is separate from the destination.</Popover>`;
      const trailingAction=(v.compareStates||v.showTrailingAction&&!v.compact&&mode!=="action")?binding(trailingActionCode,
        createElement(Flood.Popover,{title:"About this row",trigger:props=>createElement(Flood.IconButton,{...props,label:"About this row",size:v.size as Flood.ContentSize,variant:"ghost"},createElement(Ellipsis))},"The action is separate from the destination.")):undefined;
      const base={label,size:v.size,variant:v.variant,compact:v.compact,current:v.current,disabled:v.disabled,icon,trailing,trailingAction};
      if(!v.compareStates&&v.compact&&branch){
        const item={value:"projects",label,icon:v.icon?createElement(Folder):undefined,disabled:Boolean(v.disabled),...(linked?{href:"#projects"}:{}),children:[{value:"design",label:"Design system",href:"#design"},{value:"website",label:"Website",href:"#website"}]};
        const itemCode=`[{value:"projects",label:${JSON.stringify(label)},${v.icon?'icon:<Folder/>,':''}disabled:${Boolean(v.disabled)},${linked?'href:"#projects",':''}children:[{value:"design",label:"Design system",href:"#design"},{value:"website",label:"Website",href:"#website"}]}]`;
        return element("div",{style:{width:"4.5rem",maxWidth:"100%"}},element("NavigationTree",{label:"Project navigation",compact:true,size:v.size,currentValue:v.current?"projects":undefined,items:binding(itemCode,[item])}));
      }
      if(!v.compareStates&&mode==="action"){
        const props={...base,icon:v.icon?createElement(Folder):undefined,trailing:v.badge?createElement(Flood.Badge,{size:"sm"},"4"):undefined};
        const propsCode=`label=${JSON.stringify(label)} size=${JSON.stringify(v.size)} variant=${JSON.stringify(v.variant)} compact={${Boolean(v.compact)}} current={${Boolean(v.current)}} disabled={${Boolean(v.disabled)}}${v.icon?' icon={<Folder/>}':''}${v.badge?' trailing={<Badge size="sm">4</Badge>}':''}`;
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
    case "bulk-action-bar": return element("Stack",{gap:"4",style:{width:v.width,maxWidth:"100%"}},element("BulkActionBar",{label:"Selected projects",selectionCount:actions.status==="Selection cleared"?0:Number(v.selectionCount),counter:v.counter,size:v.size,maxVisibleActions:Number(v.maxVisibleActions),pending:v.pending,disabled:v.disabled,items:[{id:"archive",label:"Archive",priority:10},{id:"pause",label:"Pause"},{id:"activate",label:"Set active"}],onAction:binding("(id) => setStatus(id)",(id:string)=>actions.setStatus(id)),onClear:binding('() => setStatus("Selection cleared")',()=>actions.setStatus("Selection cleared"))}),status);
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
          containerVariant: v.containerVariant, disabled: v.disabled, items,
          onAction: binding(
            `(id) => setStatus("Selected action: " + (new Map(${JSON.stringify(items.map(({ id, label }) => [id, label]))}).get(id) ?? id))`,
            (id: string) => actions.setStatus(`Selected action: ${items.find(item => item.id === id)?.label ?? id}`),
          ),
        }), status);
    }
    case "menubar": return element("Stack",{gap:"4"},element("Menubar",{label:"Editor commands",controlSize:v.controlSize,disabled:v.disabled,menus:[{id:"file",label:"File",items:[{id:"new",label:"New document"},{id:"export",type:"submenu",label:"Export",items:[{id:"pdf",label:"PDF"},{id:"text",label:"Plain text"}]}]},{id:"edit",label:"Edit",items:[{id:"undo",label:"Undo"},{id:"redo",label:"Redo",disabled:true}]},{id:"help",label:"Help",items:[{id:"shortcuts",label:"Keyboard shortcuts"}]}],onAction:binding('(menu, id) => setStatus(menu + ":" + id)',(menu:string,id:string)=>actions.setStatus(menu+":"+id))}),status);
    case "time-picker": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TimePicker",{label:"Start time",name:"time",defaultValue:"09:30",min:"08:00",max:"18:00",interval:Number(v.interval),controlSize:v.controlSize,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-time-range-picker": return element("div",{style:{width:"34rem",maxWidth:"100%"}},element("DateTimeRangePicker",{key:String(v.precision),label:"Booking",startDateName:"startDate",startTimeName:"startTime",endDateName:"endDate",endTimeName:"endTime",defaultValue:{start:{date:"2026-10-27",time:v.precision==="second"?"09:00:00":"09:00"},end:{date:"2026-10-27",time:v.precision==="second"?"18:00:00":"18:00"}},precision:v.precision,locale:v.locale,controlSize:v.controlSize,required:v.required,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled}));
    case "file-meta": return element("FileMeta",{lang:"en-US",format:v.format==="none"?undefined:v.format,size:v.showSize?Number(v.size):undefined});
    case "file-item":
    case "file-list": return element("div",{style:{width:"32rem",maxWidth:"100%"}},element("FileList",{label:"Attachments",density:v.density},...["brand",...(slug==="file-list"?["logo","cover"]:[])].map((id,index)=>{
      const name=v.longName?"Brand-guidelines-and-product-design-system-documentation-final-version.pdf":["Brand guidelines.pdf","Logo.svg","Cover.png"][index];
      return element("FileItem",{lang:"en-US",name,format:v.showType?undefined:null,size:v.showSize?[2400000,18400,850000][index]:undefined,mimeType:v.showType?["PDF","SVG","PNG"][index]:undefined,disabled:v.disabled,hidden:binding(`fileStates[${JSON.stringify(id)}] === "removed"`,actions.fileStates[id]==="removed"),onPreview:v.showActions?action:undefined,onRemove:v.showActions?binding(`() => setFileStates(current => ({...current, ${JSON.stringify(id)}: "removed"}))`,()=>actions.setFileState(id,"removed")):undefined});
    })),status);
    case "upload-item":
    case "upload-list": return element("div",{style:{width:"32rem",maxWidth:"100%"}},element("UploadList",{label:"Uploads",density:v.density??"comfortable"},...["brand",...(slug==="upload-list"?["logo","cover"]:[])].map((id,index)=>{
      const initial=slug==="upload-item"?String(v.state):["uploading","success","error"][index];
      const raw=actions.fileStates[id],state=raw==="removed"?initial:raw??initial;
      const set=(next:string)=>binding(`() => setFileStates(current => ({...current, ${JSON.stringify(id)}: ${JSON.stringify(next)}}))`,()=>actions.setFileState(id,next));
      return element("UploadItem",{lang:"en-US",name:["Brand guidelines.pdf","Logo.svg","Cover.png"][index],size:[2400000,18400,850000][index],state:binding(`(fileStates[${JSON.stringify(id)}] === "removed" ? undefined : fileStates[${JSON.stringify(id)}]) ?? ${JSON.stringify(initial)}`,state),hidden:binding(`fileStates[${JSON.stringify(id)}] === "removed"`,raw==="removed"),progress:v.progress==="unknown"?undefined:Number(v.progress),error:state==="error"?"Connection interrupted. Try again.":undefined,disabled:v.disabled,onCancel:v.showActions?set("cancelled"):undefined,onRetry:v.showActions?set("uploading"):undefined,onRemove:v.showActions?set("removed"):undefined});
    })),status);
    case "image-preview": return element("ImagePreview",{title:"Flood mark",src:v.image==="missing"?"/missing-preview.png":"/flood-mark.png",alt:"Pink Flood mark",caption:v.showCaption?"Original Flood brand asset.":undefined,downloadHref:v.showDownload?"/flood-mark.png":undefined,disabled:v.disabled,trigger:binding('(props) => <Button {...props} variant="subtle">Preview image</Button>',(props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Preview image</Flood.Button>)});

    case "data-table": return element("Surface", {padding:"0", style:{
      width:"100%", maxWidth:"100%", overflow:"clip",
      border:"var(--flood-sys-stroke-width) solid var(--flood-sys-color-border-decorative)",
    }},
      element("DataTable", {
        caption: "Projects",
        hideCaption: true,
        toolbar: binding('<Text size="compact">Projects</Text>', <Flood.Text size="compact">Projects</Flood.Text>),
        density: v.density,
        pageSize: Number(v.pageSize),
        selectable: v.selectable,
        showResults: v.showResults,
        showSelection: v.showSelection,
        striped: v.striped,
        showColumnVisibility: true,
        defaultExpandedIds: [],
        state: binding("tableState", v.state),
        stickyHeader: v.stickyHeader || undefined,
        maxViewportHeight: v.stickyHeader ? "16rem" : undefined,
        minWidth: "min-content",
        onRetry: binding('() => setTableState("ready")', actions.restoreTable),
        emptyContent: v.customEmpty
          ? binding('<EmptyState title="No projects yet" />', renderRecipe(element("EmptyState", {title:"No projects yet"})))
          : undefined,
        columns: actions.phone ? projectTableColumns.map(({ pinned, ...column }) => column) : projectTableColumns,
        rows: binding("emptyRows ? [] : " + projectPreviewRowsCode(Boolean(v.stickyHeader)),
          v.emptyRows ? [] : projectTablePreviewRows(Boolean(v.stickyHeader), actions.projectEdits, actions.setProjectEdit)),
      }), status);

    case "data-list":
    case "data-list-item": return element("div",{style:{width:"34rem",maxWidth:"100%"}},element("DataList",{density:v.density,dividers:slug==="data-list"?v.dividers:true},...["Design system",...(slug==="data-list"?["Website","Agent guides"]:[])].map((title,index)=>element("DataListItem",{title:binding(`<Link href="#project-${index}">${v.longTitle?title+" — foundations, components and documentation":title}</Link>`,<Flood.Link href={`#project-${index}`}>{v.longTitle?title+" — foundations, components and documentation":title}</Flood.Link>),description:v.showDescription?["Foundations and reusable components","Documentation and live examples","Design instructions for your agent"][index]:undefined,media:v.showMedia?binding(`<Avatar name=${JSON.stringify(title)} size="sm" />`,<Flood.Avatar name={title} size="sm"/>):undefined,metadata:v.showMetadata?"Updated today":undefined,actions:v.showActions?binding('<Button variant="subtle" size="sm" onClick={() => setStatus("Action completed locally.")}>Manage</Button>',<Flood.Button variant="subtle" size="sm" onClick={()=>actions.setStatus("Action completed locally.")}>Manage</Flood.Button>):undefined}))),status);
    case "check-card": return element("div",{style:{width:"28rem",maxWidth:"100%"}},element("CheckCard",{label:"Product updates",description:v.showDescription?"A monthly summary of new features and improvements.":undefined,metadata:v.showMetadata?"Monthly":undefined,name:"updates",value:"product",density:v.density,indeterminate:v.indeterminate,readOnly:v.readOnly,disabled:v.disabled}));
    case "radio-card": return element("div",{style:{width:"28rem",maxWidth:"100%"}},element("Fieldset",{legend:"Plan"},element("Stack",{gap:"2"},element("RadioCard",{name:"preview-plan",value:"starter",label:"Starter",description:v.showDescription?"1 project, up to 3 members":undefined,metadata:v.showMetadata?"Free":undefined,defaultChecked:true,density:v.density,readOnly:v.readOnly,disabled:v.disabled}),element("RadioCard",{name:"preview-plan",value:"team",label:"Team",description:v.showDescription?"Unlimited projects, up to 25 members":undefined,metadata:v.showMetadata?"$12 / month":undefined,density:v.density,readOnly:v.readOnly,disabled:v.disabled}))));
    case "color-swatch": return element("ColorSwatch", {label:"Accent color",value:v.value,size:v.size});
    case "color-picker": return element("div",{style:{width:"24rem",maxWidth:"100%"}},element("ColorPicker",{label:"Accent color",defaultValue:"#ff47a8",name:"accent",controlSize:v.controlSize,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,presets:v.presets?["#ff47a8","#ffffff","#78b8ff","#65c99c"]:undefined}));
    case "hover-card": return element("HoverCard",{title:"Alex Morgan",side:v.side,align:v.align,disabled:v.disabled,trigger:binding('(props) => <Button {...props} variant="subtle">Alex Morgan</Button>',(props:Flood.OverlayTriggerProps)=><Flood.Button {...props} variant="subtle">Alex Morgan</Flood.Button>)},element("Stack",{gap:"3"},text("Product designer · London"),element("Link",{href:"https://github.com/tillwithered"},"View profile")));
    case "tree-select": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TreeSelect",{label:"Destination",name:"destination",controlSize:v.controlSize,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled,items:[{value:"design",label:"Design",selectable:false,children:[{value:"foundations",label:"Foundations"},{value:"components",label:"Components"}]},{value:"engineering",label:"Engineering",selectable:false,children:[{value:"web",label:"Website"},{value:"api",label:"API"}]}]}));
    case "date-time-picker": return element("div",{style:{width:"32rem",maxWidth:"100%"}},element("DateTimePicker",{key:String(v.precision),label:"Schedule",dateName:"date",timeName:"time",controlSize:v.controlSize,precision:v.precision,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled,defaultValue:{date:"2026-10-26",time:v.precision==="second"?"09:30:00":"09:30"}}));
    case "tag": return element("Tag",{size:v.size,disabled:v.disabled,hidden:binding("!visible",!v.visible),icon:v.icon?binding("<Plus />",<Plus />):undefined,onRemove:v.removable?binding("() => setVisible(false)",()=>actions.visible(false)):undefined,removeLabel:"Remove Design"},v.longLabel?"Design systems and thoughtfully composed interfaces":"Design");
    case "avatar-group": return element("AvatarGroup",{label:"Project collaborators",size:v.size,max:Number(v.max),items:[{id:"alex",name:v.longNames?"Alexandra Konstantinova":"Alex Morgan"},{id:"sam",name:"Sam Lee"},{id:"june",name:"June Park"},{id:"robin",name:"Robin Smith"},{id:"mika",name:"Mika Chen"}]});
    case "status-indicator": return element("StatusIndicator",{label:({neutral:"Not started",accent:"In progress",success:"All systems operational",warning:"Needs attention",error:"Service interrupted",info:"Update available"} as Record<string,string>)[String(v.tone)],tone:v.tone,size:v.size,announce:v.announce});
    case "figure": return element("Figure",{caption:v.showCaption?"Homepage, desktop layout":undefined,captionPosition:v.captionPosition},element("Surface",{padding:"8",elevation:"raised"},element("Text",{as:"p",size:"compact"},"Project preview")));
    case "blockquote": return element("Blockquote",{attribution:v.attribution?"The Flood team":undefined},"Good interfaces make room for what matters.");
    case "inline-code": return element("Text",{as:"p",size:"compact"},"Import ",element("InlineCode",{size:v.size,wrap:v.wrap},v.longValue?"@/ui/project-settings/notifications/preferences":"@/ui/button")," in your project.");
    case "metric": return element("Metric",{label:"Monthly revenue",value:"$24,580",size:v.size,hint:v.hint?"Compared with the previous month.":undefined,trend:v.trend?{label:v.direction==="up"?"12.8% higher":v.direction==="down"?"4.2% lower":"No change",direction:v.direction,tone:v.tone}:undefined});
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
    case "timeline": return element("Timeline",{label:"Project activity",items:[{id:"created",title:"Project created",state:"complete",description:v.descriptions?"Your workspace is ready.":undefined,dateTime:"2026-10-26T09:00:00Z",timeLabel:v.times?"09:00":undefined},{id:"review",title:"Design review",state:"current",description:v.descriptions?"Reviewing the dark foundations.":undefined,dateTime:"2026-10-26T10:30:00Z",timeLabel:v.times?"10:30":undefined},{id:"release",title:"Release",state:"upcoming",description:v.descriptions?"Publish when the review is complete.":undefined}]});

    case "tree": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Tree", {label:"Project files",controlSize:v.controlSize,multiple:v.multiple,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,defaultExpandedValues:["source","ui","docs"],items:v.empty?[]:[{value:"source",label:"Source",selectable:false,children:[{value:"ui",label:"Components",selectable:false,children:[{value:"button",label:"Button.tsx",description:v.showDescriptions?"Reusable project action":undefined},{value:"input",label:"Input.tsx"}]},{value:"tokens",label:"tokens.json"}]},{value:"docs",label:"Documentation",hasChildren:true,loading:v.loading,children:v.loading?undefined:[{value:"intro",label:"Introduction.md"}]},{value:"readme",label:"README.md"},{value:"archived",label:"Archived",disabled:true}]}));
    case "navigation-tree": return element("div", {style:{width:"24rem",maxWidth:"100%"}}, element("NavigationTree",{label:"Documentation",size:v.size,branchGuides:v.branchGuides,currentValue:v.currentValue,defaultExpandedValues:["start","components"],items:[{value:"start",label:"Getting started",children:[{value:"introduction",label:"Introduction",href:"#introduction"},{value:"installation",label:"Installation",href:"#installation"}]},{value:"components",label:"Components",children:[{value:"button",label:"Button",href:"#button"},{value:"input",label:"Input",href:"#input",disabled:v.disableLast}]},...(v.loading?[{value:"more",label:"More guides",content:"Loading guides…"}]:[])]}));
    case "navigation-list": return element("div", {style:{width:"20rem",maxWidth:"100%"}}, element("NavigationList", {label:"Project navigation",currentValue:v.currentValue,size:v.size,items:[{value:"overview",label:"Overview",href:"#overview",group:v.grouped?"Workspace":undefined,description:v.showDescriptions?"Your project at a glance":undefined},{value:"activity",label:"Activity",href:"#activity",group:v.grouped?"Workspace":undefined,description:v.showDescriptions?"Recent changes and updates":undefined},{value:"settings",label:"Settings",href:"#settings",group:v.grouped?"Manage":undefined,description:v.showDescriptions?"Project preferences":undefined}]}));
    case "steps": return element("div",{style:{width:"40rem",maxWidth:"100%"}},element("Steps",{label:"Project setup",orientation:v.orientation,currentValue:v.currentValue,items:[{value:"details",title:"Details",description:"Name your project"},{value:"access",title:"Access",description:"Invite your team",status:v.error?"error":undefined},{value:"review",title:"Review",description:"Check and finish",disabled:v.disableLast}],onStepChange:v.interactive?binding('(value) => setStatus(`Step requested: ${value}`)',(value:string)=>actions.setStatus(`Step requested: ${value}`)):undefined}),status);
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

    case "list-box": return element("ListBox", {key:String(v.multiple)+String(v.empty),required:v.required,status:fieldStatus,message,description:v.showDescription?"Choose the tools for your project.":undefined,label:"Framework",name:"framework",multiple:v.multiple,defaultValue:v.empty?(v.multiple?[]:""):v.multiple?["react"]:"react",options:[{value:"react",label:"React",description:"Component-based interfaces"},{value:"vue",label:"Vue",description:"Progressive interfaces"},{value:"svelte",label:"Svelte"},{value:"locked",label:"Unavailable framework",disabled:true}],controlSize:v.controlSize,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled,style:{width:"26rem",maxWidth:"100%"}});
    case "pin-input": return element("PinInput", {key:String(v.length)+String(v.mode),label:"Verification code",name:"code",length:Number(v.length),mode:v.mode,controlSize:v.controlSize,mask:v.mask,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled});
    case "rating": return element("Rating", {key:String(v.max),label:"Your experience",name:"experience",defaultValue:3,max:Number(v.max),size:v.size,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled});
    case "dropzone": return element("Dropzone", {label:"Project attachments",name:"attachments",multiple:v.multiple,clearable:v.clearable,required:v.required,disabled:v.disabled,style:{width:"26rem",maxWidth:"100%"}});
    case "character-count": return element("CharacterCount", {count:Number(v.count),max:40,mode:v.mode});

    case "copy-button": return element("CopyButton",{value:"npm install @flood-md/react",size:v.size,variant:v.variant,iconOnly:v.iconOnly,disabled:v.disabled});
    case "toast-region": return element("Stack",{gap:"4"},element("Button",{size:"sm",variant:"subtle",onClick:binding('() => setNotifications(current => [...current, {id: crypto.randomUUID(), title: "Changes saved", description: "Your project preferences are up to date.", duration: 0}])',actions.addToast)},"Show notification"),element("ToastRegion",{inline:v.inline||undefined,placement:v.inline?undefined:v.placement,hotkey:false,limit:Number(v.limit),items:binding(`notifications.map(item => ({...item, status: ${JSON.stringify(v.status)} as const, duration: ${v.autoDismiss?5000:0}}))`,actions.notifications.map(item=>({...item,status:v.status as Flood.ToastItem["status"],duration:v.autoDismiss?5000:0}))),onDismiss:binding('(id) => setNotifications(current => current.filter(item => item.id !== id))',actions.dismissToast)}));
    case "file-input": return {tag:"Field",props:{label:"Attachments",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("FileInput",{name:"attachments",multiple:v.multiple,clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled})};
    case "search-input": case "password-input": return {tag:"Field",props:{label:slug === "search-input" ? "Search components" : "Password",hideLabel:v.hideLabel,status:fieldStatus,message},field:element(slug === "search-input" ? "SearchInput" : "PasswordInput",{name:slug,defaultValue:slug === "search-input" ? "Design systems" : "flood-demo-password",autoComplete:slug === "search-input" ? "off" : "new-password",controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly,...(slug === "search-input" ? {clearable:v.clearable} : {})})};
    case "multi-select": return {tag:"Field",props:{label:"Frameworks",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("MultiSelect",{name:"frameworks",placeholder:"Search frameworks",defaultValue:["react","vue"],options:[{value:"react",label:v.longLabels?"React for thoughtfully composed product interfaces":"React",description:"Component-based interfaces"},{value:"vue",label:v.longLabels?"Vue for progressive web applications":"Vue"},{value:"svelte",label:"Svelte",disabled:Boolean(v.disableLast)}],clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled,readOnly:v.readOnly})};
    case "combobox": return {tag:"Field",props:{label:"Framework",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("Combobox",{name:"framework",placeholder:"Choose a framework",options:[{value:"react",label:"React",description:"Component-based interfaces",keywords:["next","remix"]},{value:"vue",label:"Vue",description:"Progressive interfaces",keywords:["nuxt"]},{value:"svelte",label:"Svelte",description:"Compiled interfaces",disabled:Boolean(v.disableLast)}],clearable:v.clearable,controlSize:v.controlSize,required:v.required,disabled:v.disabled,readOnly:v.readOnly})};
    case "number-input": return {tag:"Field",props:{label:"Seats",hideLabel:v.hideLabel,status:fieldStatus,message},field:element("NumberInput",{name:"seats",defaultValue:5,min:0,max:20,step:Number(v.step),controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly})};
    case "slider": return element("Slider",{key:v.range?"range":"single",label:v.range?"Price range":"Volume",name:"level",defaultValue:v.range?[25,75]:[50],min:0,max:100,step:Number(v.step),showValue:v.showValue,controlSize:v.controlSize,disabled:v.disabled,readOnly:v.readOnly,hideLabel:v.hideLabel,status:fieldStatus,message});
    case "container": return element("div", {style:{width:"100%"}}, element("Container", {size:v.size,gutter:v.gutter},element("Text",{as:"p",size:"compact"},"Content stays within a readable width.")));
    case "grid": return element("Grid", {columns:v.columns === "auto"?undefined:Number(v.columns),minItemWidth:v.minItemWidth,gap:v.gap}, ...["First", "Second", "Third"].map(label=>element("Surface",{padding:"4"},element("Text",{size:"compact"},label))));
    case "visually-hidden": return element("Stack", {gap:"3"}, element("Text", {as:"p",size:"compact"},v.focusable?"Press Tab to reveal the link.":"Supporting text remains available to assistive technology."),element("VisuallyHidden",{focusable:v.focusable},v.focusable?element("Link",{href:"#usage"},"Skip to example code"):"Changes save automatically."));
    case "aspect-ratio": return element("div", {style:{width:"22rem",maxWidth:"100%"}},element("AspectRatio",{ratio:Number(v.ratio)},element("Image",{src:"/flood-mark.png",alt:"Flood logo",fit:"contain"})));
    case "image": return element("div", {style:{width:"12rem",maxWidth:"100%"}},element("AspectRatio",{ratio:1.5},element("Image",{src:"/flood-mark.png",alt:v.decorative?"":"Flood logo",fit:v.fit,width:160,height:160})));
    case "list": return element("List", {ordered:v.ordered,marker:v.marker,gap:v.gap},element("li",{},"Install the matching packages."),element("li",{},"Import the stylesheet."),element("li",{},"Compose with Flood."));
    case "empty-state": return element("Stack",{gap:"4"},element("EmptyState",{title:"No projects yet",description:v.showDescription?"Create a project to get started.":undefined,density:v.density,icon:v.showIcon?binding('<Plus />',<Plus />):undefined,actions:v.showActions?binding('<Button size="sm" onClick={() => setStatus("Creation requested locally.")}>Create project</Button>',<Flood.Button size="sm" onClick={()=>actions.setStatus("Creation requested locally.")}>Create project</Flood.Button>):undefined}),status);
    case "card": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Card", {density:v.density,elevation:v.elevation,title:v.showTitle?"Project details":undefined,description:v.showDescription?"Release on 12 November":undefined,actions:v.showActions?binding('<Badge tone="success">Active</Badge>', <Flood.Badge tone="success">Active</Flood.Badge>):undefined,footer:v.showFooter?binding('<Button variant="subtle" size="sm" onClick={() => setStatus("Opened locally.")}>Open project</Button>',<Flood.Button variant="subtle" size="sm" onClick={()=>actions.setStatus("Opened locally.")}>Open project</Flood.Button>):undefined},element("Text",{as:"p",size:"compact"},"Homepage and checkout")),status);
    case "kbd": return element("Inline", {gap:"2"}, element("Kbd", {size:v.size}, "Ctrl"), element("Text", {size:"compact",tone:"subtle"}, "+"), element("Kbd", {size:v.size}, "K"));
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
    case "error-summary": return element("div",{style:{width:"28rem",maxWidth:"100%"}},element("Stack",{gap:"4"},
      {...element("ErrorSummary",{title:"Review the form",errors:v.showErrors?[{id:"project",fieldId:"summary-project",message:"Enter a project name."},{id:"email",fieldId:"summary-email",message:"Enter an email address."}]:[],description:v.showDescription?"Check the highlighted fields.":undefined,announcement:v.announcement,autoFocus:v.autoFocus}),previewSlot:{minBlockSize:"8rem"}},
      {...element("Field",{id:"summary-project",label:"Project name",status:v.showErrors?"error":undefined}),field:element("Input",{name:"project"})},
      {...element("Field",{id:"summary-email",label:"Email",status:v.showErrors?"error":undefined}),field:element("Input",{name:"email",type:"email"})}));
    case "resizable-panels": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("ResizablePanels",{key:`${v.orientation}-${v.defaultValue}`,label:"Resize workspace",orientation:v.orientation,defaultValue:Number(v.defaultValue),disabled:v.disabled,style:{height:"16rem"},main:binding('<Surface padding="4" style={{height:"100%"}}><Text size="compact">Navigation</Text></Surface>',<Flood.Surface padding="4" style={{height:"100%"}}><Flood.Text size="compact">Navigation</Flood.Text></Flood.Surface>),secondary:binding('<Surface padding="4" style={{height:"100%"}}><Text size="compact">Workspace</Text></Surface>',<Flood.Surface padding="4" style={{height:"100%"}}><Flood.Text size="compact">Workspace</Flood.Text></Flood.Surface>)}));
    case "range-calendar": return element("div",{style:{width:"22rem",maxWidth:"100%"}},element("RangeCalendar",{label:"Choose travel dates",defaultValue:{start:"2026-10-12",end:"2026-10-18"},today:"2026-10-26",locale:v.locale,weekStartsOn:Number(v.weekStartsOn),readOnly:v.readOnly,disabled:v.disabled}));
    case "date-range-field": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("DateRangeField",{label:"Travel dates",startName:"start",endName:"end",defaultValue:{start:"2026-10-12",end:"2026-10-18"},controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-range-picker": return element("div",{style:{width:"38rem",maxWidth:"100%"}},element("DateRangePicker",{label:"Travel dates",startName:"start",endName:"end",defaultValue:{start:"2026-10-12",end:"2026-10-18"},today:"2026-10-26",locale:v.locale,controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "time-field": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("TimeField",{key:String(v.precision),label:"Start time",name:"startTime",defaultValue:v.precision === "second"?"09:30:00":"09:30",precision:v.precision,controlSize:v.controlSize,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "calendar": return element("div",{style:{width:"22rem",maxWidth:"100%"}},element("Calendar",{key:v.granularity,granularity:v.granularity,showViewControls:v.showViewControls,label:"Choose a date",defaultValue:v.granularity==="year"?"2026":v.granularity==="month"?"2026-10":"2026-10-26",today:"2026-10-26",locale:v.locale,weekStartsOn:Number(v.weekStartsOn),readOnly:v.readOnly,disabled:v.disabled}));
    case "date-picker": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("DatePicker",{label:"Start date",name:"start",defaultValue:"2026-10-26",today:"2026-10-26",locale:v.locale,controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "date-field": return element("div",{style:{width:"26rem",maxWidth:"100%"}},element("DateField",{label:"Start date",name:"start",defaultValue:"2026-10-26",controlSize:v.controlSize,order:v.order,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
    case "command-list": return element("div", {style:{width:"28rem",maxWidth:"100%"}}, element("CommandList", {label:"Search commands",controlSize:v.controlSize,hideLabel:v.hideLabel,loading:v.loading,disabled:v.disabled,items:[{id:"create",label:"New project",keywords:["add","create"],group:"Projects"},{id:"recent",label:"Recent projects",group:"Projects"},{id:"settings",label:"Open settings",group:"Workspace"},{id:"invite",label:"Invite team",disabled:v.disableLast,group:"Workspace"}],onAction:binding('(id) => setStatus(`Command: ${id}`)',(id:string)=>actions.setStatus(`Command: ${id}`))}),status);
    case "editable": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Editable", {label:"Project name",defaultValue:"Flood workspace",name:"project",placeholder:"Name your project",controlSize:v.controlSize,blurAction:v.blurAction,showActions:v.showActions,hideLabel:v.hideLabel,readOnly:v.readOnly,disabled:v.disabled}));
    case "tag-input": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("TagInput", {label:"Topics",defaultValue:["Design","React"],name:"topics",placeholder:"Add a topic…",controlSize:v.controlSize,status:fieldStatus,hideLabel:v.hideLabel,required:v.required,readOnly:v.readOnly,disabled:v.disabled}));
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
    case "description-list": return element("div", {style:{width:"28rem",maxWidth:"100%"}}, element("DescriptionList", {"aria-label":"Project details",layout:v.layout,density:v.density,dividers:v.dividers,items:[{id:"project",term:"Project",description:"Flood design system"},{id:"version",term:"Version",description:release.version},{id:"owner",term:"Owner",description:v.longValue?"design-system-maintainers@a-very-long-example-company.example":"Design team"}]}));
    case "table": return element("Table", {caption:"Workspace projects",density:v.density,cellVerticalAlign:v.cellVerticalAlign,striped:v.striped,hideCaption:v.hideCaption,style:{minWidth:v.minWidth}},
      element("thead", {}, element("tr", {}, ...["Project", "Status", "Members", "Storage"].map((name,index)=>element("th",{scope:"col",...(index>1?{"data-numeric":true}:{})},name)))),
      element("tbody", {}, ...(v.empty?[element("tr",{},element("td",{colSpan:4},"No projects yet."))]:[["Flood","Active","12","24 GB"],["Portal","Draft","8","16 GB"],["Studio","Active","20","10 GB"]].map(([name,status,members,storage])=>element("tr",{},element("th",{scope:"row"},name),element("td",{},element("Badge",{tone:status==="Active"?"success":"neutral",size:"sm"},status)),element("td",{"data-numeric":true},members),element("td",{"data-numeric":true},storage))))),
      ...(v.footer&&!v.empty?[element("tfoot",{},element("tr",{},element("th",{scope:"row",colSpan:2},"Total"),element("td",{"data-numeric":true},"40"),element("td",{"data-numeric":true},"50 GB")))]:[]));
    case "progress": return element("div", {style:{width:"22rem",maxWidth:"100%"}}, element("Progress", {label:"Uploading files",value:v.indeterminate?undefined:Number(v.value),size:v.size,tone:v.tone,hideLabel:v.hideLabel,valueText:v.showValue?(v.indeterminate?"Estimating…":`${v.value}%`):undefined}));
    case "meter": return element("div", {style:{width:"22rem",maxWidth:"100%"}}, element("Meter", {label:"Storage used",value:Number(v.value),size:v.size,tone:v.tone,hideLabel:v.hideLabel,valueText:v.showValue?`${v.value} of 100 GB`:undefined}));
    case "alert": return element("div", {style:{width:"26rem",maxWidth:"100%"}}, element("Alert", {title:v.showTitle?({neutral:"Project note",info:"A new version is available",success:"Changes saved",warning:"Storage is almost full",error:"Changes could not be saved"} as Record<string,string>)[String(v.tone)]:undefined,tone:v.tone,announcement:v.announcement,icon:v.showIcon?undefined:null}, v.showAction
      ? element("Inline", {gap:"2"}, element("Text", {size:"compact",tone:"subtle"}, "Storage usage is 92%."), element("Button", {size:"sm",variant:"ghost",onClick:binding('() => setStatus("Storage opened.")',()=>actions.setStatus("Storage opened."))}, "View usage"))
      : "Your work stays here. Choose the next step when you are ready."),status);
    case "badge": return element("Badge", {tone:v.tone, variant:v.variant, size:v.size}, ({neutral:"Draft",accent:"Beta",success:"Active",warning:"Pending",error:"Failed",info:"Updated"} as Record<string,string>)[String(v.tone)]);
    case "spinner": return element("Spinner", {size:v.size,decorative:v.decorative,label:"Loading workspace"});
    case "skeleton": return element("div", {style:{width:"16rem",maxWidth:"100%"}}, element("Skeleton", {shape:v.shape,animate:v.animate}));
    case "avatar": return element("Avatar", {name:"Alex Morgan",size:v.size,shape:v.shape,decorative:v.decorative,src:v.image === "loaded" ? "/avatar-demo.svg" : v.image === "broken" ? "/missing-avatar.png" : undefined});
    case "tabs": return element("Tabs", {label:"Project sections", items:[{value:"overview",label:"Overview",content:"Keep the project context in one place."},{value:"activity",label:"Activity",content:"Recent changes and project updates."},{value:"settings",label:"Settings",content:"Choose the settings that fit this project.",disabled:Boolean(v.disableLast)}], variant:v.variant,activationMode:v.activationMode,orientation:v.orientation,controlSize:v.controlSize,disabled:v.disabled,style:{width:"26rem",maxWidth:"100%",minHeight:"12rem"}});
    case "breadcrumb": return element("Stack", {gap:"4"}, element("Breadcrumb", {items:[{label:"Workspace",href:"#workspace"},{label:"Projects",href:"#projects"},{label:"Flood",...(v.currentLink?{href:"#flood"}:{})}],separator:v.separator,
      onClick:binding('event => { event.preventDefault(); setStatus("Navigation stays in this preview."); }', (event:{preventDefault:()=>void})=>{event.preventDefault();actions.setStatus("Navigation stays in this preview.")})}),status);
    case "pagination": {
      const page=Math.min(actions.page,Number(v.pageCount));
      return element("Stack",{gap:"4"},element("Pagination",{page:binding("page",page),pageCount:Number(v.pageCount),siblingCount:Number(v.siblingCount),controlSize:v.controlSize,disabled:v.disabled,
        onPageChange:binding("setPage",actions.setPage),...(v.links?{getHref:binding('page => `#page-${page}`',(page:number)=>`#page-${page}`),onClick:binding('event => event.preventDefault()', (event:{preventDefault:()=>void})=>event.preventDefault())}:{})}),element("Text",{as:"p",size:"compact"},binding('`Page ${page} of '+v.pageCount+'`',`Page ${page} of ${v.pageCount}`)));
    }
    case "tooltip": return element("Tooltip", {content:"Keep related actions within reach.", side:v.side, align:v.align, delay:Number(v.delay), disabled:v.disabled,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Hover or focus</Button>', (trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Hover or focus"))});
    case "popover": return element("Popover", {key:String(v.defaultOpen),title:"Project settings", side:v.side, align:v.align, defaultOpen:v.defaultOpen, disabled:v.disabled,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Project settings</Button>', (trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Project settings"))},
      element("Stack",{gap:"3"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"Flood"})}));
    case "alert-dialog": return element("Stack", {gap:"4"}, element("AlertDialog",{key:String(v.defaultOpen),title:"Archive this project?",description:"It will leave your active projects. You can restore it from the archive.",confirmLabel:"Archive project",defaultOpen:v.defaultOpen,disabled:v.disabled,confirmDisabled:v.confirmDisabled,onConfirm:binding('() => setStatus("Project archived locally.")',()=>actions.setStatus("Project archived locally.")),onCancel:binding('() => setStatus("Cancelled.")',()=>actions.setStatus("Cancelled.")),trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Archive project</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Archive project"))}), status);
    case "sheet":
    case "drawer": return element("Stack",{gap:"4"},element(slug === "sheet" ? "Sheet" : "Drawer",{key:String(v.defaultOpen),title:"Project settings",side:v.side,size:v.size,defaultOpen:v.defaultOpen,closeOnOutsideClick:v.closeOnOutsideClick,disabled:v.disabled,trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Open settings</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Open settings")),footer:v.showFooter?binding('<Button onClick={(event) => { setStatus("Preferences saved locally."); event.currentTarget.closest("dialog")?.close(); }}>Save changes</Button>',<Flood.Button onClick={event=>{actions.setStatus("Preferences saved locally.");event.currentTarget.closest("dialog")?.close();}}>Save changes</Flood.Button>):undefined},element("Stack",{gap:"4"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"Flood"})},{tag:"Field",props:{label:"Visibility"},field:element("Select",{defaultValue:"private"},element("option",{value:"private"},"Private"),element("option",{value:"team"},"Team"))},...(v.longContent?Array.from({length:12},(_,index)=>text(`Project note ${index+1}: Access review due on 12 November.`)):[]))),status);
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
        trigger:binding(`(props) => <Button {...props} variant="subtle">${title}</Button>`, (props:Flood.OverlayTriggerProps) => createElement(Flood.Button, {...props,variant:"subtle"},title)),
        onAction:binding("(id) => setStatus(id)", (id:string) => actions.setStatus(id)),
      }), status);
    }
    case "dialog": return element("Dialog", {key:String(v.defaultOpen),title:"Create a project",defaultOpen:v.defaultOpen,disabled:v.disabled,closeOnOutsideClick:v.closeOnOutsideClick,
      trigger:binding('(trigger) => <Button {...trigger} variant="subtle">Open dialog</Button>',(trigger:Flood.OverlayTriggerProps)=>createElement(Flood.Button,{...trigger,variant:"subtle"},"Open dialog"))},
      element("Stack",{gap:"4"},{tag:"Field",props:{label:"Project name"},field:element("Input",{defaultValue:"My project"})},{tag:"Field",props:{label:"Visibility"},field:element("Select",{defaultValue:"private"},element("option",{value:"private"},"Private"),element("option",{value:"team"},"Team"))}));
    case "collapsible": return element("Collapsible", {
      key: String(v.defaultOpen), title: "Advanced settings", defaultOpen: v.defaultOpen, controlSize: v.controlSize, disabled: v.disabled,
    }, {tag:"Field",props:{label:"Project prefix"},field:element("Input",{defaultValue:"flood"})});
    case "accordion": {
      const items = [
        {value:"install", title:"How do I install Flood?", content:"Install the matching packages, import the stylesheet and add FloodRoot."},
        {value:"agents", title:"Can my agent use Flood?", content:"Yes. The versioned agent guide describes components, tokens and composition rules."},
        {value:"customize", title:"Can I customize the theme?", content:"Override semantic tokens within your project scope.", disabled:Boolean(v.disableLast)},
      ];
      return element("Accordion", {key:String(v.expansionMode), label:"Flood questions", items, expansionMode:v.expansionMode, controlSize:v.controlSize, headingLevel:Number(v.headingLevel), disabled:v.disabled});
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
    case "button": return element("Stack", { gap: "4" }, element("Inline", {}, element("Button", { variant: v.variant, tone: v.tone, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, "Save changes")), status);
    case "icon-button": return element("Stack", { gap: "4" }, element("Inline", {}, element("IconButton", { label: "Add idea", variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, element("Plus"))), status);
    case "input": case "textarea": return { tag: "Field", props: { label: slug === "input" ? "Project name" : "Project note", hideLabel: v.hideLabel, status: fieldStatus, message }, field: element(slug === "input" ? "Input" : "Textarea", { controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, readOnly: v.readOnly, defaultValue: slug === "input" ? "My project" : "Homepage and checkout" }) };
    case "select": return { tag: "Field", props: { label: "Project visibility", hideLabel: v.hideLabel, status: fieldStatus, message }, field: element("Select", { name: "visibility", controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, defaultValue: "private" }, element("option", { value: "private" }, "Private"), element("option", { value: "team" }, "Team"), element("option", { value: "public" }, "Public")) };
    case "checkbox": return element("Checkbox", { ...choice, indeterminate:v.indeterminate, label: "Receive project updates", name: "updates" });
    case "switch": return element("Switch", { ...choice, label: "Email notifications", name: "notifications" });
    case "radio": return element("fieldset", { style: { margin: 0, padding: 0, border: 0 } }, element("legend", {}, "Project visibility"), element("Stack", { gap: "2" }, element("Radio", { label: "Private", name: "workbench-visibility", value: "private", disabled: v.disabled, checked: binding("checked", Boolean(v.checked)), onChange: binding("() => setChecked(true)", () => actions.checked(true)) }), element("Radio", { label: "Public", name: "workbench-visibility", value: "public", disabled: v.disabled, checked: binding("!checked", !v.checked), onChange: binding("() => setChecked(false)", () => actions.checked(false)) })));
    case "text": return element("Text", { as: "p", size: v.size, tone: v.tone }, "Quarterly revenue");
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
    case "fieldset": return element("Fieldset", { legendSize: v.legendSize, legend: "Notifications", hideLabel: v.hideLabel, disabled: v.disabled, hint: v.hint ? "Choose the updates you want." : undefined, status: fieldStatus, message }, element("Checkbox", { label: "Product updates", name: "updates", defaultChecked: true }), element("Checkbox", { label: "Release notes", name: "releases" }));
    case "field": return { tag: "Field", props: { label: "Project name", hideLabel: v.hideLabel, status: fieldStatus, message: v.error ? undefined : message, required: v.required, hint: v.hint ? "Visible to your team." : undefined, error: v.error ? "Enter a project name." : undefined }, field: element("Input", { name: "project", defaultValue: "" }) };
    case "divider": return element("Stack", { gap: "4" }, text("Workspace"), element("Divider"), text("Account"));
    case "flood-root": return element("Surface", { padding: "6" }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Neutral. Dark. Local."), text("This composition uses FloodRoot without changing the document theme.")));
    case "link": return element("Link", { href: "/docs/installation", variant: v.variant, size: v.size }, "Read the installation guide");
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
  const [projectEdits, setProjectEdits] = useState<ProjectEdits>({});
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
  const change = (name: string, value: string | boolean) => { setState({ slug: component.slug, values: { ...values, ...(name === "status" ? { invalid: false, ...(component.slug === "field" ? { error: false } : {}) } : {}), [name]: value } }); setStatus(""); if(name==="state")setFileStates({}); };
  const callback = useRef(onCodeChange);
  const importsCallback = useRef(onImportsChange);
  useEffect(() => { callback.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { importsCallback.current = onImportsChange; }, [onImportsChange]);
  useEffect(() => { setStatus("");setNavValue("overview");setViewValue("all");setToolbarSearch("");setToolbarOpen(false);setShellDrawerOpen(false);setDraftFilters({match:"all",conditions:[]}); setFilterValue({property:"status",operator:"is",values:["active"]});setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]}); setFileStates({}); }, [component.slug]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(values.code)); setStatus("Copied command."); }
    catch { setStatus("Select the code and copy it manually."); }
  };
  const currentPage=component.slug==="pagination"?Math.min(pagination.slug===component.slug?pagination.page:1,Number(values.pageCount)):1;
  const recipe = recipeFor(component.slug, values, { phone, projectEdits, setProjectEdit, shellDrawerOpen,setShellDrawerOpen,navValue,setNavValue,setCollapsed:(next)=>change("collapsed",next),restoreTable:()=>change("state","ready"),viewValue,setViewValue,toolbarSearch,setToolbarSearch,toolbarOpen,setToolbarOpen,draftFilters,setDraftFilters,filterGroup,setFilterGroup,filterValue,setFilterValue,fileStates,setFileState:(id,next)=>setFileStates(current=>({...current,[id]:next})), menuChecked, setMenuChecked, menuDensity, setMenuDensity, notifications, addToast:()=>setNotifications(current=>[...current,{id:crypto.randomUUID(),title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]), dismissToast:id=>setNotifications(current=>current.filter(item=>item.id!==id)), status, setStatus:(next)=>{if(next==="Condition removed")resetAction.current?.focus({preventScroll:true});setStatus(next);}, checked: (checked) => change("checked", checked), visible: visible => {
    change("visible", visible);
    if (!visible) queueMicrotask(() => stage.current?.ownerDocument.getElementById(`${id}-visible`)?.focus());
  }, copy, page:currentPage,setPage:page=>setPagination({slug:component.slug,page}) });
  const hasFeedback = recipe.children?.some(child => typeof child !== "string" && !isBinding(child) && child.previewFeedback);
  const showFeedbackSlot = hasFeedback || component.slug === "code-snippet";
  const previewRecipe = hasFeedback ? {
    ...recipe,
    children: recipe.children?.filter(child => typeof child === "string" || isBinding(child) || !child.previewFeedback),
  } : recipe;
  const imports = new Set<string>(["FloodRoot"]), icons = new Set<string>();
  const jsx = printRecipe(element("FloodRoot", {}, recipe), imports, icons, 2);
  if (component.slug === "code-snippet" && values.copyAction) imports.add("Button");
  if (["tooltip", "popover", "dialog", "alert-dialog", "drawer", "hover-card", "image-preview"].includes(component.slug)) imports.add("Button");
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
  if (["file-item","file-list","upload-item","upload-list"].includes(component.slug)) preamble += '  const [fileStates, setFileStates] = useState<Record<string, "queued" | "uploading" | "success" | "error" | "cancelled" | "removed">>({});\n';
  if (component.slug === "toast-region") preamble += '  const [notifications, setNotifications] = useState([{id:"welcome",title:"Changes saved",description:"Your project preferences are up to date.",duration:0}]);\n';
  const usesPresence = component.slug === "tag";
  if (usesPresence) { preamble += `  const [visible, setVisible] = useState(${JSON.stringify(Boolean(values.visible))});\n`; if (values.icon) icons.add("Plus"); }
  if (["data-list", "data-list-item"].includes(component.slug)) { imports.add("Link"); if(values.showMedia)imports.add("Avatar"); if(values.showActions)imports.add("Button"); }
  const usesChecked = ["checkbox", "radio", "switch"].includes(component.slug);
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
  if (component.slug === "card") { if (values.showActions) imports.add("Badge"); if (values.showFooter) imports.add("Button"); }
  if (component.slug === "empty-state") { if (values.showIcon) icons.add("Plus"); if (values.showActions) imports.add("Button"); }
  const usesStatus = hasFeedback || ["filter-condition","file-item", "file-list", "upload-item", "upload-list","data-table","data-list", "data-list-item","context-menu", "command-list", "command-palette", "steps", "section", "drawer", "alert-dialog", "empty-state", "card", "toolbar", "menu", "breadcrumb", "segmented-control", "toggle", "toggle-group", "button", "button-group", "input-group", "icon-button", "stack", "inline", "radio-group", "checkbox-group"].includes(component.slug) || (component.slug === "code-snippet" && Boolean(values.copyAction));
  if (usesChecked) preamble += `  const [checked, setChecked] = useState(${JSON.stringify(Boolean(values.checked))});\n`;
  if (component.slug === "menu" && ["preferences", "mixed"].includes(String(values.scenario))) preamble += '  const [notificationsEnabled, setNotificationsEnabled] = useState(true);\n  const [density, setDensity] = useState("Compact");\n';
  if (usesStatus) preamble += '  const [status, setStatus] = useState("");\n';
  if (component.slug==="pagination") preamble += `  const [page, setPage] = useState(${currentPage});\n`;
  if (component.slug === "code-snippet" && values.copyAction) preamble += `  async function copy() {\n    try {\n      await navigator.clipboard.writeText(${JSON.stringify(String(values.code))});\n      setStatus("Copied command.");\n    } catch {\n      setStatus("Select the code and copy it manually.");\n    }\n  }\n`;
  const stylesheet = importMode === "project" ? "@/ui/styles.css" : "@flood-md/react/styles.css";
  const code = '"use client";\n\n' + (component.slug === "data-table" ? 'import { useState, type ReactNode } from "react";\n' : navigationState || usesPresence || usesChecked || usesStatus || (component.slug === "app-shell" && values.navigationMode === "drawer") || component.slug === "toast-region" || component.slug === "filter-group" || component.slug === "collection-toolbar" || component.slug === "collection-view-switcher" || component.slug === "sidebar" || component.slug==="pagination" ? 'import { useState } from "react";\n' : "") + importStatements([...imports].sort(), importMode) + "\n" + (icons.size ? `import { ${[...icons].sort().join(", ")} } from "lucide-react";\n` : "") + `import "${stylesheet}";\n\nexport function Example() {\n` + preamble + `  return (\n${jsx}\n  );\n}\n`;
  useEffect(() => { callback.current(code); importsCallback.current?.([...imports].sort()); }, [code]);

  const controls = componentKnobs(component).filter(knob => {
    if(component.slug==="navigation-item"&&values.compareStates)return ["compareStates","size","variant"].includes(knob.name);
    if(component.slug==="toast-region"&&values.inline&&knob.name==="placement")return false;
    return !(component.slug === "menu" && values.scenario === "preferences" && ["icons", "shortcuts", "disableArchive"].includes(knob.name));
  });
  const hasFocusAction = ["input", "input-group", "textarea", "select"].includes(component.slug);
  const spacious = ["navigation-item","navigation-group","sidebar","collection-view-switcher","collection-toolbar","filter-group","calendar","time-picker","file-item", "upload-item","data-list", "data-list-item", "check-card", "radio-card","color-picker", "date-time-picker", "tree-select", "tree", "navigation-tree", "list-box", "navigation-list", "steps", "section", "center", "container", "grid", "aspect-ratio", "empty-state", "card", "table", "description-list", "accordion", "input", "input-group", "textarea", "select", "field", "label", "fieldset", "radio-group", "checkbox-group", "scroll-area", "surface", "flood-root", "stack", "code-snippet"].includes(component.slug);
  const labelFor = (knob: Knob) => knob.label
    ?? ({ controlSize: "Size", contentInset: "Content clearance", copyAction: "Copy button", label: "Accessible name" } as Record<string, string>)[knob.name]
    ?? (knob.name[0].toUpperCase() + knob.name.slice(1).replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`));
  const resetPreview = () => {
      setState({ slug: component.slug, values: initialValues(component) });
      setStatus(""); setPagination({slug:component.slug,page:1}); setResetKey(key => key + 1);
      resetViewPosition();
      setFilterValue({property:"status",operator:"is",values:["active"]});
      setFilterGroup({match:"all",conditions:[{id:"status",property:"status",operator:"is",values:["active"]},{id:"owner",property:"owner",operator:"is",values:["maya"]}]});
      setFileStates({}); setNavValue("overview"); setViewValue("all"); setToolbarSearch(""); setToolbarOpen(false);
      setProjectEdits({});
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
      <Flood.ScrollArea orientation="both" contentInset="none" className="workbench-stage preview-stage" data-component={component.slug} data-size={["heading", "timeline", "toast-region", "dropzone", "color-picker", "data-table", "file-list", "upload-list", "date-time-range-picker", "line-chart", "bar-chart", "donut-chart", "heatmap", "scatter-chart", "range-chart", "bullet-chart", "waterfall-chart", "histogram", "box-plot", "dumbbell-chart", "bar-list"].includes(component.slug) ? "display" : spacious ? "regular" : "compact"}
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
