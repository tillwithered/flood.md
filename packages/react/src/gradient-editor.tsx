import {forwardRef, useEffect, useId, useRef, useState, type CSSProperties} from "react";
import {
  Button, ColorPicker, ColorSwatch, Field, Fieldset, Grid, Inline, NumberInput, Select, Stack, Toggle,
  type GradientEditorProps, type GradientStop,
} from "./index.js";
import {normalizeHexColor} from "./color-controls.js";

function insertionPoint(stops: readonly GradientStop[]) {
  const positions = [0,...stops.map(stop=>stop.position),100].sort((a,b)=>a-b);
  let point = 50, width = -1;
  for(let i=1;i<positions.length;i++){
    const gap=positions[i]-positions[i-1];
    if(gap>width){width=gap;point=Math.round((positions[i-1]+positions[i])/2);}
  }
  return point;
}

export const GradientControl = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, GradientEditorProps>(function GradientControl({
  label, value, onValueChange, maxStops=8, labels, controlSize="sm", disabled=false, readOnly=false, className, ...props
},ref){
  const id=useId(), serial=useRef(0);
  const buttons=useRef(new Map<string,HTMLButtonElement>());
  const pending=useRef<{target:string; removed?:string; trigger?:HTMLButtonElement} | undefined>(undefined);
  const [selection,setSelection]=useState(value.stops[0]?.id);
  const validColor=(color:string)=>normalizeHexColor(color,true);
  if(!label.trim() || !Number.isSafeInteger(maxStops) || maxStops<2 || value.stops.length<2 ||
    !["linear","radial"].includes(value.kind) || !Number.isFinite(value.angle) || value.angle<0 || value.angle>360 ||
    new Set(value.stops.map(stop=>stop.id)).size!==value.stops.length ||
    value.stops.some(stop=>!stop.id.trim()||!Number.isFinite(stop.position)||stop.position<0||stop.position>100||!validColor(stop.color))){
    throw new Error("Flood GradientEditor requires a named gradient, unique valid stops and a valid angle");
  }
  const stops=[...value.stops].sort((a,b)=>a.position-b.position);
  const active=value.stops.find(stop=>stop.id===selection)??stops[0];
  const selectedIndex=stops.indexOf(active);
  const cssStops=stops.map(stop=>`${validColor(stop.color)} ${stop.position}%`).join(", ");
  const paint=value.kind==="linear" ? `linear-gradient(${value.angle}deg, ${cssStops})` : `radial-gradient(circle, ${cssStops})`;
  const names={
    mode:"Shape",linear:"Linear",radial:"Radial",angle:"Angle (°)",stops:"Color stops",position:"Position (%)",
    color:"Stop color",colorChannels:"Color channels",add:"Add stop",remove:"Remove stop",...labels,
  };
  const update=(next:GradientStop)=>onValueChange({...value,stops:value.stops.map(stop=>stop.id===next.id?next:stop)});
  useEffect(()=>{
    const move=pending.current;
    if(!move || !value.stops.some(stop=>stop.id===move.target) || value.stops.some(stop=>stop.id===move.removed))return;
    pending.current=undefined;
    setSelection(move.target);
    const doc=move.trigger?.ownerDocument;
    if(move.trigger && (doc?.activeElement===move.trigger || (move.trigger.disabled && doc?.activeElement===doc?.body))) {
      buttons.current.get(move.target)?.focus({preventScroll:true});
    }
  },[value.stops]);
  function addStop(trigger:HTMLButtonElement){
    let stopId:string;
    do { stopId=`${id}-stop-${++serial.current}`; } while(value.stops.some(stop=>stop.id===stopId));
    const next={id:stopId,color:active.color,position:insertionPoint(stops)};
    pending.current={target:stopId,trigger};
    onValueChange({...value,stops:[...value.stops,next]});
  }
  function removeStop(trigger:HTMLButtonElement){
    const next=stops[selectedIndex+1]??stops[selectedIndex-1];
    pending.current={target:next.id,removed:active.id,trigger};
    onValueChange({...value,stops:value.stops.filter(stop=>stop.id!==active.id)});
  }
  return <Fieldset {...props} ref={ref} legend={label} disabled={disabled} className={["flood-gradient-editor",className].filter(Boolean).join(" ")}>
    <Stack gap="3">
      <div aria-hidden="true" className="flood-gradient-editor__sample" style={{"--flood-color-preview":paint} as CSSProperties}/>
      {!readOnly && <Grid columns={value.kind==="linear"?2:1} gap="2">
        <Field label={names.mode}>{field=><Select {...field} controlSize={controlSize} value={value.kind}
          onChange={event=>onValueChange({...value,kind:event.currentTarget.value as "linear"|"radial"})}>
          <option value="linear">{names.linear}</option><option value="radial">{names.radial}</option>
        </Select>}</Field>
        {value.kind==="linear" && <Field label={names.angle}>{field=><NumberInput {...field} controlSize={controlSize}
          appearance="plain" min={0} max={360} value={value.angle}
          onValueChange={angle=>{if(angle!==null&&angle>=0&&angle<=360)onValueChange({...value,angle});}}/>}</Field>}
      </Grid>}
      <Inline role="group" aria-label={names.stops} gap="2">
        {stops.map((stop,index)=><Toggle key={stop.id} pressed={active.id===stop.id} disabled={disabled}
          className="flood-gradient-editor__stop"
          ref={button=>{if(button)buttons.current.set(stop.id,button);else buttons.current.delete(stop.id);}}
          aria-label={labels?.stop?.(index+1,stop.position)??`Stop ${index+1}: ${stop.position}%`} size={controlSize}
          onPressedChange={()=>{pending.current=undefined;setSelection(stop.id);}}>
          <ColorSwatch value={stop.color} size="sm" label={stop.color} aria-hidden="true" />
          {`${stop.position}%`}
        </Toggle>)}
      </Inline>
      <Inline gap="2" align="end">
        <Field label={names.position}>{field=><NumberInput {...field} min={0} max={100} controlSize={controlSize}
          readOnly={readOnly} appearance="plain" value={active.position}
          onValueChange={position=>{if(position!==null&&position>=0&&position<=100)update({...active,position});}}/>}</Field>
        {!readOnly && <>
          <Button type="button" size={controlSize} variant="subtle" disabled={value.stops.length>=maxStops} onClick={event=>addStop(event.currentTarget)}>{names.add}</Button>
          <Button type="button" size={controlSize} variant="ghost" disabled={value.stops.length<=2} onClick={event=>removeStop(event.currentTarget)}>{names.remove}</Button>
        </>}
      </Inline>
      {readOnly ? <ColorSwatch value={active.color} label={`${names.color}: ${active.color}`}/>
        : <ColorPicker key={active.id} label={names.color} allowAlpha channelDisclosureLabel={names.colorChannels}
          value={active.color} controlSize={controlSize} style={{inlineSize:"100%"}}
          onValueChange={color=>{if(color)update({...active,color});}}/>}
    </Stack>
  </Fieldset>;
});
