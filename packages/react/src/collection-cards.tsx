import {forwardRef,useId,type ReactNode} from "react";
import {Checkbox,Radio,IconSlot,type CheckCardProps,type RadioCardProps} from "./index.js";
import {hasFieldContent,mergeDescriptions} from "./field-state.js";

type ChoiceCardContentProps = Pick<CheckCardProps, "label" | "description" | "icon" | "metadata"> & { id: string };

function isolateCopy(content: ReactNode) {
  return typeof content === "string" ? <bdi>{content}</bdi> : content;
}

function ChoiceCardContent({id, label, description, metadata, icon}: ChoiceCardContentProps) {
  return <span className="flood-choice-card__content">
    {hasFieldContent(icon) && <span className="flood-choice-card__icon" aria-hidden="true"><IconSlot size="sm">{icon}</IconSlot></span>}
    <span className="flood-choice-card__copy">
      <span id={`${id}-title`} className="flood-choice-card__title"><bdi>{label}</bdi></span>
      {hasFieldContent(description) && <span id={`${id}-description`} className="flood-choice-card__description">{isolateCopy(description)}</span>}
    </span>
    {hasFieldContent(metadata) && <span id={`${id}-metadata`} className="flood-choice-card__metadata">{isolateCopy(metadata)}</span>}
  </span>;
}

/** Cards retain native choice semantics; their content must be noninteractive. */
export const CheckableCard = /* @__PURE__ */ forwardRef<HTMLInputElement,CheckCardProps>(function CheckableCard({
  label,description,icon,metadata,density="comfortable",indicatorPlacement="start",className,readOnly,onClick,onChange,
  "aria-describedby":describedBy,"aria-labelledby":labelledBy,"aria-label":ariaLabel,...props
},ref){
  const id=useId();
  if(!label.trim())throw new Error("Flood CheckCard requires a nonempty label");
  return <Checkbox {...props} ref={ref} readOnly={readOnly} required={props.required&&!readOnly} aria-disabled={readOnly||props["aria-disabled"]||undefined}
    aria-label={ariaLabel} aria-labelledby={labelledBy??(ariaLabel?undefined:`${id}-title`)}
    aria-describedby={mergeDescriptions(describedBy,hasFieldContent(description)&&`${id}-description`,hasFieldContent(metadata)&&`${id}-metadata`)}
    className={["flood-choice-card",`flood-choice-card--${density}`,indicatorPlacement==="end"&&"flood-choice-card--end",className].filter(Boolean).join(" ")}
    onClick={event=>{onClick?.(event);if(readOnly)event.preventDefault();}}
    onChange={event=>{if(!readOnly)onChange?.(event);}}
    label={<ChoiceCardContent id={id} label={label} description={description} icon={icon} metadata={metadata} />}/>;
});

export const ExclusiveCard = /* @__PURE__ */ forwardRef<HTMLInputElement,RadioCardProps>(function ExclusiveCard({
  label,description,icon,metadata,density="comfortable",indicatorPlacement="start",className,readOnly,onClick,onChange,
  "aria-describedby":describedBy,"aria-labelledby":labelledBy,"aria-label":ariaLabel,...props
},ref){
  const id=useId();
  if(!label.trim())throw new Error("Flood RadioCard requires a nonempty label");
  return <Radio {...props} ref={ref} readOnly={readOnly} required={props.required&&!readOnly} aria-disabled={readOnly||props["aria-disabled"]||undefined}
    aria-label={ariaLabel} aria-labelledby={labelledBy??(ariaLabel?undefined:`${id}-title`)}
    aria-describedby={mergeDescriptions(describedBy,hasFieldContent(description)&&`${id}-description`,hasFieldContent(metadata)&&`${id}-metadata`)}
    className={["flood-choice-card",`flood-choice-card--${density}`,indicatorPlacement==="end"&&"flood-choice-card--end",className].filter(Boolean).join(" ")}
    onClick={event=>{onClick?.(event);if(readOnly)event.preventDefault();}}
    onChange={event=>{if(!readOnly)onChange?.(event);}}
    label={<ChoiceCardContent id={id} label={label} description={description} icon={icon} metadata={metadata} />}/>;
});
