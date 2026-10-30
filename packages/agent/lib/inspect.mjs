/** Optional text observations for host-owned JSX/CSS; no parsing or execution. */
export function inspectSourceUI(source,options={}) {
  if(typeof source!=='string'||source.length>500000)throw new Error('Source must be a string of at most 500000 UTF-16 units');
  const limit=options.maxFindings??50,format=options.format??'jsx';
  if(!Number.isSafeInteger(limit)||limit<1||limit>500)throw new Error('maxFindings must be an integer from 1 to 500');
  if(!['jsx','css'].includes(format))throw new Error('format must be jsx or css');
  const issues=[];let truncated=false;
  const record=(match,id,owner,message)=>{
    if(issues.length>=limit){truncated=true;return;}
    const offset=match.index+match[0].length-match[0].trimStart().length;
    const prefix=source.slice(0,offset),line=prefix.split('\n').length,column=offset-prefix.lastIndexOf('\n');
    issues.push({id,line,column,excerpt:match[0].trimStart().slice(0,180),owner,message});
  };
  if(format==='jsx'){
    for(const match of source.matchAll(/\b(?:window|globalThis)\.(confirm|alert|prompt)\s*\(/g))record(match,'composition.native-dialog',match[1]==='confirm'?'AlertDialog':match[1]==='prompt'?'Dialog':'Alert','Native browser dialog candidate. Review the actual call and use the installed Flood owner unless native UI is explicitly required.');
    for(const match of source.matchAll(/<(select|button)\b|<input\b[^>]*\btype\s*=\s*["'](date|time|checkbox|radio|range)["']/g)){
      const role=match[1]||match[2],owner={select:'Select',button:'Button',date:'DatePicker',time:'TimeField',checkbox:'Checkbox',radio:'Radio',range:'Slider'}[role];
      record(match,'composition.native-control',owner,'Raw control candidate. Review whether an existing Flood component owns this role; native form/table structure and deliberate documented adapters are separate cases.');
    }
  } else {
    for(const match of source.matchAll(/([^{}]+)\{[^{}]*\bdisplay\s*:\s*(grid|flex)\b/g)){
      if(match[1].trim().startsWith('.flood-'))continue;
      record(match,'composition.layout-owner',match[2]==='grid'?'Grid':'Stack / Inline','Custom layout candidate. Shared form tracks and repeated layout roles should use Flood owners. A semantic host shell can legitimately own positioning; record the actual reason.');
    }
  }
  return {schemaVersion:1,issues,truncated,notChecked:['Text matching is not parsing: comments, strings and examples can match; aliases, dynamic types and indirect calls can be missed. Review source context.','This function reads only the supplied text. It does not execute it, open files or inspect imports, component capability, rendered layout or editorial necessity.']};
}

/** Read-only DOM observations. Pass this self-contained function to page.evaluate. */
export function inspectRenderedUI(options = {}) {
  if (typeof document === 'undefined') throw new Error('inspectRenderedUI must run in the rendered browser document');
  const root = options.rootSelector ? document.querySelector(options.rootSelector) : document;
  if (!root) throw new Error('Flood inspection root was not found');
  const limit = options.maxElements ?? 500;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 2000) throw new Error('maxElements must be an integer from 1 to 2000');
  const issues = [], copy = [], fields = [];
  const visible = element => {
    const style = getComputedStyle(element), box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
  };
  const label = element => (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  const target = element => ({tag:element.tagName.toLowerCase(), id:element.id || null, className:element.getAttribute('class') || '', label:label(element)});
  let truncated = false;
  const addIssue = finding => { if (issues.length < limit) issues.push(finding); else truncated = true; };
  const select = selector => {
    const matches = [...root.querySelectorAll(selector)].filter(visible);
    if(matches.length > limit) truncated = true;
    return matches.slice(0, limit);
  };
  for (const button of select('button.flood-button, button.flood-icon-button')) {
    // Text is inspected outside real icon slots, SVGs and visually hidden names.
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    const parts = []; let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement?.closest('.flood-icon,svg,.flood-visually-hidden,[aria-hidden="true"]')) parts.push(node.textContent);
    }
    const text = parts.join('').trim();
    if (/^[+＋×✕✖↗→←✓✔☰](?:\s|$)|(?:\s)[+＋×✕✖↗→←✓✔☰]$/u.test(text)) {
      addIssue({id:'icons.text-glyph', target:target(button), message:'Possible action icon encoded as font text; review whether IconSlot with explicit artwork is required.'});
    }
    for (const svg of button.querySelectorAll('svg')) {
      if (!svg.closest('.flood-icon,.flood-loading,.flood-spinner')) addIssue({id:'icons.unslotted-svg',target:target(button),message:'Action SVG has no Flood IconSlot owner; inspect sizing and accessible decoration.'});
    }
  }
  for (const row of select('.flood-table tbody tr')) {
    const controls = [...row.querySelectorAll('input:not([type="hidden"]),textarea,select')].filter(visible);
    const actions = [...row.querySelectorAll('button,a.flood-link--button')].filter(visible);
    if (!controls.length && !actions.length) continue;
    const centres = controls.map(control=>{const r=control.getBoundingClientRect();return r.y+r.height/2;});
    if (centres.length && Math.max(...centres)-Math.min(...centres)>3) continue;
    const rowBox=row.getBoundingClientRect();
    const expected = centres.length ? centres.reduce((a,b)=>a+b,0)/centres.length : rowBox.y+rowBox.height/2;
    for (const cell of row.children) {
      if(!cell.matches('td,th') || !visible(cell)) continue;
      // Editable rows compare their passive content to input centres. Record/action
      // rows compare every complete content block, including multiline identities.
      if(centres.length && cell.querySelector('input,textarea,select')) continue;
      const boxes=[];
      const walker=document.createTreeWalker(cell,NodeFilter.SHOW_TEXT);let textNode;
      while((textNode=walker.nextNode())) {
        if(!textNode.textContent?.trim() || !textNode.parentElement || !visible(textNode.parentElement)
          || textNode.parentElement.closest('.flood-visually-hidden,[aria-hidden="true"],script,style')) continue;
        const range=document.createRange();range.selectNodeContents(textNode);
        boxes.push(...[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0));
      }
      for(const control of [...cell.querySelectorAll('button,a.flood-link--button')].filter(visible)) boxes.push(control.getBoundingClientRect());
      if(!boxes.length) continue;
      const actual=(Math.min(...boxes.map(rect=>rect.top))+Math.max(...boxes.map(rect=>rect.bottom)))/2;
      if(Math.abs(actual-expected)>3) addIssue({id:'table.mixed-row-centre',target:target(cell),offset:Math.round((actual-expected)*100)/100,message:centres.length
        ? 'Cell content is offset from neighbouring input centres. Review resolved geometry.'
        : 'Cell content is offset from the centre of a record/action row. Compare multiline identity, values and actions; use deliberate top alignment only when justified.'});
    }
  }
  const actionNames=select('button.flood-button,a.flood-link--button').map(button=>(button.textContent||'').trim().replace(/\s+/g,' ').toLowerCase()).filter(name=>name.length>=4);
  let wordsChecked=0;
  const segmenters=new Map();
  const canInspectWords=typeof Intl.Segmenter==='function';
  if(canInspectWords)for(const cell of select('.flood-table th,.flood-table td')){
    if(cell.matches('[data-wrap="anywhere"]'))continue;
    const locale=cell.closest('[lang]')?.getAttribute('lang')||document.documentElement.lang||undefined;
    if(!segmenters.has(locale)){
      try{segmenters.set(locale,new Intl.Segmenter(locale,{granularity:'word'}));}
      catch{segmenters.set(locale,new Intl.Segmenter(undefined,{granularity:'word'}));}
    }
    const walker=document.createTreeWalker(cell,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!node.parentElement||!visible(node.parentElement)||node.parentElement.closest('code,pre,.flood-inline-code,.flood-visually-hidden,[aria-hidden="true"]'))continue;
      for(const word of segmenters.get(locale).segment(node.textContent||'')){
        if(!word.isWordLike||word.segment.length<4)continue;
        if(wordsChecked>=limit){truncated=true;break;}wordsChecked++;
        if(word.segment.length>200)continue;
        const range=document.createRange();range.setStart(node,word.index);range.setEnd(node,word.index+word.segment.length);
        const boxes=[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
        if(boxes.length>1&&Math.max(...boxes.map(rect=>rect.y))-Math.min(...boxes.map(rect=>rect.y))>2){
          addIssue({id:'table.word-fragment',target:target(cell),word:word.segment,message:'A word is split across rendered lines in a table cell. Review intrinsic column width and wrapping; deliberate technical or localized line breaking can be an exception.'});
        }
      }
      if(wordsChecked>=limit)break;
    }
    if(wordsChecked>=limit){truncated=true;break;}
  }
  const grids=select('form [class]').filter(element=>{
    if(element.closest('table') || getComputedStyle(element).display!=='grid')return false;
    return [...element.children].filter(visible).length>=2 && element.querySelectorAll('input,select,textarea,[role="combobox"]').length>=2;
  }).map(element=>{
    const style=getComputedStyle(element),columns=style.gridTemplateColumns.match(/[\d.]+px/g)?.map(parseFloat)??[];
    return {element,columns,gap:parseFloat(style.columnGap)||0,rect:element.getBoundingClientRect()};
  }).filter(grid=>grid.columns.length>=2);
  const contentTracks=grid=>{
    const owners='.flood-field,.flood-date-picker,.flood-date-field,.flood-time-field,.flood-date-range-field,.flood-date-time-picker';
    const nodes=[...grid.element.querySelectorAll(owners)].filter(element=>visible(element)&&!element.closest('table')&&!element.parentElement?.closest(owners));
    if(nodes.length>limit)truncated=true;
    const tracks=[];
    for(const element of nodes.slice(0,limit)){
      const rect=element.getBoundingClientRect();
      const track=tracks.find(item=>Math.abs(item.x-rect.x)<=1);
      if(track){if(Math.abs(track.width-rect.width)>1)return null;}
      else tracks.push({x:rect.x,width:rect.width});
    }
    if(tracks.length!==grid.columns.length)return null;
    tracks.sort((a,b)=>a.x-b.x);
    return {tracks,left:tracks[0].x,right:Math.max(...tracks.map(track=>track.x+track.width))};
  };
  for(const grid of grids)grid.content=contentTracks(grid);
  for(let i=0;i<grids.length;i++)for(let j=i+1;j<grids.length;j++){
    const a=grids[i],b=grids[j];
    if(a.element.closest('form')!==b.element.closest('form'))continue;
    if(a.element.contains(b.element)||b.element.contains(a.element))continue;
    if(!(a.rect.bottom<=b.rect.top+1||b.rect.bottom<=a.rect.top+1))continue;
    if(a.content&&b.content&&a.content.tracks.length===b.content.tracks.length&&Math.abs(a.content.left-b.content.left)<=1&&Math.abs(a.content.right-b.content.right)<=1){
      const offset=Math.max(...a.content.tracks.map((track,index)=>Math.max(Math.abs(track.x-b.content.tracks[index].x),Math.abs(track.width-b.content.tracks[index].width))));
      if(offset>1)addIssue({id:'forms.content-track-drift',target:target(b.element),related:target(a.element),offset:Math.round(offset*100)/100,message:'Stacked form groups share content edges but their actual field starts or widths differ. Review nested surface padding and shared track ownership; matching Grid props or outer boxes is insufficient.'});
    }
    if(Math.abs(a.rect.x-b.rect.x)>1||Math.abs(a.rect.width-b.rect.width)>1)continue;
    const starts=grid=>grid.columns.map((_,index)=>grid.columns.slice(0,index).reduce((sum,width)=>sum+width,0)+index*grid.gap);
    const left=starts(a),right=starts(b);
    const drift=a.columns.length===b.columns.length?Math.max(...left.map((x,index)=>Math.abs(x-right[index]))):null;
    if(drift===null||drift>1)addIssue({id:'forms.track-drift',target:target(b.element),related:target(a.element),...(drift===null?{}:{offset:Math.round(drift*100)/100}),message:'Stacked form grids share an outer frame but use different tracks. Review common gutters/group hierarchy or document why these contexts need different columns.'});
  }
  for(const element of select('h1,h2,h3,h4,h5,h6,.flood-type--helper,.flood-type--compact')) {
    if(label(element)) {
      copy.push(target(element));
      if(!element.closest('button,a,label') && !element.matches('h1,h2,h3,h4,h5,h6')) {
        if(!element.closest('.flood-field,.flood-fieldset,.flood-table,.flood-metric,.flood-status-indicator,.flood-file-meta,.flood-description-list,nav,article,dialog,[role="document"],[role="status"],[role="alert"],[role="alertdialog"],[role="dialog"]')) {
          addIssue({id:'copy.unowned-support',target:target(element),message:'Supporting text sits outside a field, operation state, navigation or structured document. Identify the exact current decision it serves; remove implementation narration. Do not change typography or add a semantic wrapper merely to silence this observation.'});
        }
        const text=(element.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();
        if(actionNames.some(name=>text.includes(name))) addIssue({id:'copy.action-echo',target:target(element),message:'Supporting copy repeats a currently visible action label. Review whether it adds a necessary constraint or only narrates the control.'});
      }
    }
  }
  for(const element of select('.flood-field,fieldset,.flood-section')) {
    const rect=element.getBoundingClientRect();
    fields.push({...target(element),x:rect.x,y:rect.y,width:rect.width,height:rect.height});
  }
  return {schemaVersion:1, issues, copy, fields, truncated, notChecked:[
    'Editorial necessity and accuracy require contextual review; copy inventory is not an editorial verdict.',
    'Form grouping and column hierarchy require review of task relationships and visible geometry.',
    'Only the currently rendered document state is inspected; portals outside a selected root, other pages, iframes and shadow roots are not traversed.',
    'These observations do not certify accessibility, functional correctness or overall visual quality.',
    ...(!canInspectWords?['Word fragmentation was not inspected because Intl.Segmenter is unavailable.']:[])
  ]};
}
