import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Field, Input, Fieldset, RadioGroup, CheckboxGroup, SegmentedControl} from "../packages/react/dist/index.js";

test("hidden Field labels retain association, required and descriptions",()=>{
  const html=render(h(Field,{id:"name",label:"Project name",hideLabel:true,required:true,hint:"Team name",error:"Review value"},props=>h(Input,props)));
  assert.match(html,/<label[^>]*for="name"[^>]*flood-visually-hidden/);
  assert.match(html,/>Project name/);assert.match(html,/required=""/);
  assert.match(html,/aria-describedby="name-hint name-error"/);
  assert.doesNotMatch(html,/\shideLabel=|aria-hidden="true">Project name|display:none|<input[^>]*hide-label/);
});

test("hidden legends propagate through native selection compositions without hiding their group",()=>{
  for(const Component of [Fieldset,RadioGroup,CheckboxGroup,SegmentedControl]){
    const isSegment=Component===SegmentedControl;
    const props={hideLabel:true,...(isSegment?{label:"Choice"}:{legend:"Choice"}),...(Component!==Fieldset?{name:"choice",options:[{value:"a",label:"Alpha"}]}:{})};
    const html=render(h(Component,props));
    assert.match(html,/data-hide-label="true"/);assert.match(html,/<legend[^>]*flood-visually-hidden[^>]*>Choice/);
    assert.doesNotMatch(html,/\shideLabel=|<fieldset[^>]*aria-hidden/);
    assert.doesNotMatch(render(h(Component,{...props,hideLabel:false})),/flood-visually-hidden/);
  }
});
