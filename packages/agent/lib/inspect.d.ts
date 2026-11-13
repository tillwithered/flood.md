export interface InspectionTarget {tag:string;id:string|null;className:string;label:string;}
export interface InspectionIssue {id:'icons.text-glyph'|'icons.unslotted-svg'|'table.mixed-row-centre'|'table.word-fragment'|'copy.action-echo'|'copy.unowned-support'|'forms.track-drift'|'forms.content-track-drift'|'layout.page-overflow'|'layout.record-scroll-owner';target:InspectionTarget;related?:InspectionTarget;message:string;offset?:number;word?:string;}
export interface RenderedUIInspection {
  schemaVersion:1;issues:InspectionIssue[];copy:InspectionTarget[];
  fields:(InspectionTarget&{x:number;y:number;width:number;height:number})[];
  truncated:boolean;notChecked:string[];
}
/** Invoke inside a browser document, e.g. page.evaluate(inspectRenderedUI). No mutation or network calls. */
export declare function inspectRenderedUI(options?:{rootSelector?:string;maxElements?:number}):RenderedUIInspection;
export interface WorkspaceScrollOptions {
  /** Selector for one full-window AppShell. Defaults to .flood-app-shell. */
  rootSelector?: string;
  /** Set true for overflowing fixtures or false for fixtures whose content must fit. */
  expectOverflow?: boolean;
}
/** Run with page.evaluate after the workspace settles. Throws on a broken scroll contract. */
export declare function assertWorkspaceScroll(options?: WorkspaceScrollOptions): {
  documentGutter: number;
  documentOverflow: number;
  workspaceOverflow: number;
};
export interface SourceUIIssue {id:'composition.native-dialog'|'composition.native-control'|'composition.page-scroll'|'composition.layout-owner'|'composition.scaled-minimum';line:number;column:number;excerpt:string;owner:string;message:string;}
/** Text observations, not an AST or conformance check. No file access, execution or network. */
export declare function inspectSourceUI(source:string,options?:{format?:'jsx'|'css';maxFindings?:number}):{schemaVersion:1;issues:SourceUIIssue[];truncated:boolean;notChecked:string[]};
