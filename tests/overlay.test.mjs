import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Tooltip,Popover,Dialog} from "../packages/react/dist/index.js";
import {placeOverlay} from "../packages/react/dist/overlay-runtime.js";
const trigger=props=>h("button",props,"Open");

test("overlay SSR uses stable native relationships without opening browser layers on the server",()=>{
  const tip=render(h(Tooltip,{id:"tip",content:"Help",trigger}));assert.match(tip,/role="tooltip"/);assert.match(tip,/popover="manual"/);assert.match(tip,/aria-describedby="tip"/);
  const pop=render(h(Popover,{id:"pop",title:"Settings",trigger,defaultOpen:true},"Body"));assert.match(pop,/aria-controls="pop"/);assert.match(pop,/aria-labelledby="pop-title"/);assert.match(pop,/aria-expanded="true"/);assert.match(pop,/>Body</);
  const dialog=render(h(Dialog,{id:"modal",title:"Project",description:"Details",trigger},"Closed body"));assert.match(dialog,/<dialog/);assert.match(dialog,/aria-modal="true"/);assert.match(dialog,/aria-describedby="modal-description"/);assert.doesNotMatch(dialog,/Closed body|<dialog[^>]*\sopen=/);
  for(const html of [tip,pop,dialog])assert.doesNotMatch(html,/defaultOpen=|initialFocusRef=|onOpenChange=|closeOnOutsideClick=/);
});

test("overlay placement flips, clamps and mirrors alignment without crossing viewport edges",()=>{
  const viewport={left:0,top:0,width:400,height:300},anchor={left:350,right:390,top:270,bottom:290,width:40,height:20},size={width:180,height:100};
  const placed=placeOverlay(anchor,size,viewport,"bottom","start",8);assert.equal(placed.side,"top");assert.ok(placed.left+size.width<=392);assert.ok(placed.top>=8);
  const center={left:150,right:210,top:120,bottom:140,width:60,height:20};
  assert.equal(placeOverlay(center,{width:80,height:30},viewport,"bottom","start",8,true).left,130);
  const tiny=placeOverlay(anchor,{width:600,height:400},viewport,"right","center",8);assert.ok(Number.isFinite(tiny.left)&&Number.isFinite(tiny.top));assert.ok(tiny.left>=8&&tiny.top>=8);
});
