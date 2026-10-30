export interface InspectionTarget {tag:string;id:string|null;className:string;label:string;}
export interface InspectionIssue {id:'icons.text-glyph'|'icons.unslotted-svg'|'table.mixed-row-centre'|'table.word-fragment'|'copy.action-echo'|'copy.unowned-support'|'forms.track-drift'|'forms.content-track-drift';target:InspectionTarget;related?:InspectionTarget;message:string;offset?:number;word?:string;}
export interface RenderedUIInspection {
  schemaVersion:1;issues:InspectionIssue[];copy:InspectionTarget[];
  fields:(InspectionTarget&{x:number;y:number;width:number;height:number})[];
  truncated:boolean;notChecked:string[];
}
/** Invoke inside a browser document, e.g. page.evaluate(inspectRenderedUI). No mutation or network calls. */
export declare function inspectRenderedUI(options?:{rootSelector?:string;maxElements?:number}):RenderedUIInspection;
export interface SourceUIIssue {id:'composition.native-dialog'|'composition.native-control'|'composition.layout-owner';line:number;column:number;excerpt:string;owner:string;message:string;}
/** Text observations, not an AST or conformance check. No file access, execution or network. */
export declare function inspectSourceUI(source:string,options?:{format?:'jsx'|'css';maxFindings?:number}):{schemaVersion:1;issues:SourceUIIssue[];truncated:boolean;notChecked:string[]};
