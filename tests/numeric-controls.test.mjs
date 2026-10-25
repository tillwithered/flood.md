import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { Field, NumberInput, Slider } from "../packages/react/dist/index.js";

test("numeric SSR retains native inputs, labels, limits and ordered form entries", () => {
 const number=render(h(Field,{label:"Seats"},p=>h(NumberInput,{...p,name:"seats",defaultValue:2.5,step:.1,min:0,max:10})));
 assert.match(number,/type="number"/);assert.match(number,/value="2.5"/);assert.match(number,/step="0.1"/);assert.match(number,/aria-label="Decrease value"/);assert.match(number,/aria-label="Increase value"/);
 const slider=render(h(Slider,{label:"Budget",name:"budget",defaultValue:[20,80],hint:"Choose limits",status:"warning",message:"Review range"}));
 assert.equal((slider.match(/type="range"/g)||[]).length,2);assert.equal((slider.match(/name="budget"/g)||[]).length,3);
 assert.match(slider,/Budget: minimum/);assert.match(slider,/Budget: maximum/);assert.match(slider,/aria-valuemax="80"/);assert.match(slider,/aria-valuemin="20"/);assert.match(slider,/aria-describedby="[^"]+-hint [^"]+-message"/);
});
test("numeric contracts reject ambiguous models and preserve empty input",()=>{
 assert.match(render(h(NumberInput,{"aria-label":"Optional count",defaultValue:null})),/value=""/);
 for(const props of [{step:0},{step:NaN},{min:20,max:10},{value:Infinity},{decreaseLabel:""}])assert.throws(()=>render(h(NumberInput,props)),/Flood NumberInput/);
 for(const props of [{defaultValue:[]},{defaultValue:[80,20]},{defaultValue:[1,2,3]},{min:1,max:1},{step:0},{value:[NaN]},{label:""},{thumbLabels:["",""]}])assert.throws(()=>render(h(Slider,{label:"Budget",...props})),/Flood Slider/);
 const readonly=render(h(Slider,{label:"Read only",readOnly:true,defaultValue:[40]}));assert.match(readonly,/aria-readonly="true"/);assert.doesNotMatch(readonly,/disabled=""/);
});
