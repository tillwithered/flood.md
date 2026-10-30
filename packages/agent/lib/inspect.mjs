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
      issues.push({id:'icons.text-glyph', target:target(button), message:'Possible action icon encoded as font text; review whether IconSlot with explicit artwork is required.'});
    }
    for (const svg of button.querySelectorAll('svg')) {
      if (!svg.closest('.flood-icon,.flood-loading,.flood-spinner')) issues.push({id:'icons.unslotted-svg',target:target(button),message:'Action SVG has no Flood IconSlot owner; inspect sizing and accessible decoration.'});
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
      if(Math.abs(actual-expected)>3) issues.push({id:'table.mixed-row-centre',target:target(cell),offset:Math.round((actual-expected)*100)/100,message:centres.length
        ? 'Cell content is offset from neighbouring input centres. Review resolved geometry.'
        : 'Cell content is offset from the centre of a record/action row. Compare multiline identity, values and actions; use deliberate top alignment only when justified.'});
    }
  }
  const actionNames=select('button.flood-button,a.flood-link--button').map(button=>(button.textContent||'').trim().replace(/\s+/g,' ').toLowerCase()).filter(name=>name.length>=4);
  for(const element of select('h1,h2,h3,h4,h5,h6,.flood-type--helper,.flood-type--compact')) {
    if(label(element)) {
      copy.push(target(element));
      if(!element.closest('button,a,label') && !element.matches('h1,h2,h3,h4,h5,h6')) {
        const text=(element.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();
        if(actionNames.some(name=>text.includes(name))) issues.push({id:'copy.action-echo',target:target(element),message:'Supporting copy repeats a currently visible action label. Review whether it adds a necessary constraint or only narrates the control.'});
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
    'These observations do not certify accessibility, functional correctness or overall visual quality.'
  ]};
}
