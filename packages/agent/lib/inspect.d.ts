export interface InspectionTarget {tag:string;id:string|null;className:string;label:string;}
export interface InspectionIssue {id:'icons.text-glyph'|'icons.unslotted-svg'|'table.mixed-row-centre'|'table.word-fragment'|'copy.action-echo'|'copy.unowned-support'|'forms.track-drift';target:InspectionTarget;related?:InspectionTarget;message:string;offset?:number;word?:string;}
export interface RenderedUIInspection {
  schemaVersion:1;issues:InspectionIssue[];copy:InspectionTarget[];
  fields:(InspectionTarget&{x:number;y:number;width:number;height:number})[];
  truncated:boolean;notChecked:string[];
}
/** Invoke inside a browser document, e.g. page.evaluate(inspectRenderedUI). No mutation or network calls. */
export declare function inspectRenderedUI(options?:{rootSelector?:string;maxElements?:number}):RenderedUIInspection;
