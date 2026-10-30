export interface InspectionTarget {tag:string;id:string|null;className:string;label:string;}
export interface InspectionIssue {id:'icons.text-glyph'|'icons.unslotted-svg'|'table.mixed-row-centre'|'copy.action-echo';target:InspectionTarget;message:string;offset?:number;}
export interface RenderedUIInspection {
  schemaVersion:1;issues:InspectionIssue[];copy:InspectionTarget[];
  fields:(InspectionTarget&{x:number;y:number;width:number;height:number})[];
  truncated:boolean;notChecked:string[];
}
/** Invoke inside a browser document, e.g. page.evaluate(inspectRenderedUI). No mutation or network calls. */
export declare function inspectRenderedUI(options?:{rootSelector?:string;maxElements?:number}):RenderedUIInspection;
