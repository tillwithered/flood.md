/* Heroicons check: optimized/20/solid/check.svg @ 616b7a4dbbf3d011760af8066262cd5c6b3868f3.
MIT License
Copyright (c) Tailwind Labs, Inc.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const checkSVG = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"/></svg>';
  all('[data-check]').forEach(el => { el.innerHTML = checkSVG; });
  const tabs = ['checkbox','radio','switch','geometry'];
  let activeTab = 'checkbox';
  const reviews = Object.fromEntries(tabs.map(id => [id,{decision:'undecided',note:''}]));
  function activate(id, focus=false) {
    activeTab=id;
    tabs.forEach(t => {
      const active=t===id;
      $('tab-'+t).setAttribute('aria-selected',String(active));
      $('tab-'+t).tabIndex=active?0:-1;
      $('panel-'+t).hidden=!active;
    });
    if(focus) $('tab-'+id).focus();
    $('review-note').value=reviews[id].note;
    all('[data-review]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.review===reviews[id].decision)));
    growReview();
  }
  tabs.forEach((id,index) => {
    $('tab-'+id).addEventListener('click',()=>activate(id));
    $('tab-'+id).addEventListener('keydown',e=>{
      let next;
      if(e.key==='ArrowRight') next=(index+1)%tabs.length;
      if(e.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
      if(e.key==='Home') next=0;
      if(e.key==='End') next=tabs.length-1;
      if(next!==undefined){e.preventDefault();activate(tabs[next],true);}
    });
  });
  $('theme').addEventListener('click',()=>{
    const root=document.documentElement;
    root.classList.add('theme-changing');
    root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
    $('theme').textContent=root.dataset.theme==='dark'?'Светлая тема':'Тёмная тема';
    requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-changing')));
  });
  $('targets').addEventListener('click',()=>{
    const active=document.body.classList.toggle('b-targets');
    $('targets').setAttribute('aria-pressed',String(active));
  });
  function growReview(){const el=$('review-note');el.style.height='auto';el.style.height=Math.min(200,Math.max(76,el.scrollHeight+2))+'px';}
  $('review-note').addEventListener('input',()=>{reviews[activeTab].note=$('review-note').value;growReview();});
  all('[data-review]').forEach(b=>b.addEventListener('click',()=>{reviews[activeTab].decision=b.dataset.review;activate(activeTab);}));
  $('export').addEventListener('click',()=>{
    const payload={lab:'0.6.4',theme:document.documentElement.dataset.theme,reviews};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='flood-boolean-064-review.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  // Static tables are descriptions of states, never extra interactive widgets.
  const baseStates=[['rest','Покой'],['hover','Наведение'],['pressed','Нажатие'],['focus','Фокус'],['hover focus','Наведение + фокус'],['disabled','Недоступен'],['invalid','Ошибка'],['invalid focus','Ошибка + фокус']];
  function visual(kind,value,state){
    const classes=['b-control','b-'+kind,...state.split(' ').map(x=>'is-'+x)];
    if(value==='on')classes.push('is-checked');
    if(value==='mixed')classes.push('is-mixed');
    const mark=kind==='switch'?'<span class="b-thumb"></span>':kind==='radio'?'<span class="b-dot"></span>':`<span class="b-check">${checkSVG}</span><span class="b-mixed"></span>`;
    const note=state.includes('pending')?'Сохраняем':state.includes('unknown')?'Не подтверждено':state.includes('invalid')?'Ошибка':state.includes('disabled')?'Недоступно':'';
    const tone=state.includes('invalid')?'error':state.includes('unknown')?'unknown':'';
    return `<span class="b-static" aria-hidden="true"><span class="${classes.join(' ')}"><span class="b-mark">${mark}</span></span>${state.includes('pending')?'<span class="b-sample-spinner"></span>':''}${note?`<span class="b-status ${tone}">${note}</span>`:''}</span>`;
  }
  function matrix(kind,states,values){
    const head=values.map(v=>`<th scope="col">${esc(v[1])}</th>`).join('');
    const rows=states.map(([state,label])=>`<tr data-state="${state}"><th scope="row">${esc(label)}</th>${values.map(([v,name])=>`<td data-value="${v}">${visual(kind,v,state)}<span class="sr">${esc(name+' — '+label)}</span></td>`).join('')}</tr>`).join('');
    $(kind+'-matrix').innerHTML=`<table class="b-state-table"><caption class="sr">Статичные сочетания ${kind}: состояния и значения</caption><thead><tr><th scope="col">Состояние</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  matrix('checkbox',baseStates,[['off','Не выбран'],['on','Выбран'],['mixed','Частично']]);
  matrix('radio',baseStates,[['off','Не выбран'],['on','Выбран']]);
  matrix('switch',[...baseStates,['pending','Сохранение'],['pending focus','Сохранение + фокус'],['unknown','Итог неизвестен']],[['off','Выключено'],['on','Включено']]);

  // Master checkbox scopes only to the three enabled children.
  const childIDs=['cb-source','cb-date','cb-person'];
  const children=()=>childIDs.map($).filter(el=>!el.disabled);
  let cbTouched=false;
  function updateChecks(validate=false){
    const enabled=children(),count=enabled.filter(el=>el.checked).length;
    $('cb-master').checked=count===enabled.length&&count>0;
    $('cb-master').indeterminate=count>0&&count<enabled.length;
    const invalid=(validate||cbTouched)&&count===0;
    [$('cb-master'),...enabled].forEach(el=>{if(invalid)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');});
    $('cb-group').setAttribute('aria-invalid',String(invalid));
    $('cb-error').textContent=invalid?'Выберите хотя бы одно доступное поле.':'';
    $('cb-result').textContent=`Выбрано ${count} из ${enabled.length} доступных полей.`;
    return !invalid;
  }
  $('cb-master').addEventListener('change',()=>{const checked=$('cb-master').checked;children().forEach(el=>el.checked=checked);updateChecks();});
  children().forEach(el=>el.addEventListener('change',()=>updateChecks()));
  $('cb-form').addEventListener('submit',e=>{e.preventDefault();cbTouched=true;if(!updateChecks(true))$('cb-master').focus();else $('cb-result').textContent+=' Выбор допустим; реальные задачи не изменены.';});
  $('cb-reset').addEventListener('click',()=>{cbTouched=false;children().forEach((el,i)=>el.checked=i!==1);updateChecks();});
  updateChecks();

  // Real radios retain native group keyboard behavior; no competing custom arrows.
  const radios=all('input[name="start"]');
  function clearRadioError(){ $('radio-group').removeAttribute('aria-invalid');$('radio-error').textContent='';radios.forEach(el=>el.removeAttribute('aria-invalid')); }
  radios.forEach(el=>el.addEventListener('change',()=>{clearRadioError();$('radio-result').textContent='Выбрано: '+$(el.id+'-label').textContent+'. Ещё не применено.';}));
  $('radio-form').addEventListener('submit',e=>{
    e.preventDefault();const selected=radios.find(el=>el.checked);
    if(!selected){$('radio-group').setAttribute('aria-invalid','true');$('radio-error').textContent='Выберите начальный раздел.';radios.filter(el=>!el.disabled).forEach(el=>el.setAttribute('aria-invalid','true'));radios.find(el=>!el.disabled).focus();return;}
    clearRadioError();$('radio-result').textContent='В демо применено: '+$(selected.id+'-label').textContent+'.';
  });
  $('radio-reset').addEventListener('click',()=>{radios.forEach(el=>el.checked=false);clearRadioError();$('radio-result').textContent='Ничего не выбрано.';radios.find(el=>!el.disabled).focus();});

  // Captured requested value is separate from confirmed value during I/O simulation.
  const toggle=$('save-position');
  let confirmed=false,requested=null,serverValue=false,phase='idle',writes=0,reads=0,ticket=0;
  const locked=()=>['pending','checking','unknown'].includes(phase);
  const onOff=value=>value?'включено':'выключено';
  function paintSwitch(text,tone=''){
    toggle.checked=confirmed;
    toggle.setAttribute('aria-disabled',String(locked()));
    toggle.setAttribute('aria-invalid',String(phase==='error'));
    $('switch-operation').setAttribute('aria-busy',String(['pending','checking'].includes(phase)));
    $('switch-state').textContent='Подтверждено: '+onOff(confirmed)+'.';
    $('switch-spinner').innerHTML=['pending','checking'].includes(phase)?'<span class="spin"></span>':'';
    $('switch-feedback').textContent=text;$('switch-feedback').dataset.tone=tone;
    $('switch-retry').hidden=phase!=='error';$('switch-reconcile').hidden=phase!=='unknown';
    $('switch-reset').disabled=locked();
    all('input[name="outcome"]').forEach(el=>el.disabled=locked());
    $('request-count').textContent=`Записей: ${writes} · сверок: ${reads}`;
  }
  function save(next){
    if(locked())return;
    const outcome=all('input[name="outcome"]').find(el=>el.checked).value;
    const current=++ticket;requested=next;phase='pending';writes++;
    paintSwitch(next?'Включаем. Подтверждённое значение пока не изменилось.':'Выключаем. Подтверждённое значение пока не изменилось.');
    setTimeout(()=>{
      if(current!==ticket)return;
      if(outcome==='error'){phase='error';paintSwitch('Не удалось '+(next?'включить':'выключить')+'. Осталось '+onOff(confirmed)+'.','error');return;}
      serverValue=next;
      if(outcome==='unknown'){phase='unknown';paintSwitch('Ответ потерян. Запись могла завершиться. Перед повтором нужно сверить состояние.','unknown');return;}
      confirmed=next;phase='idle';paintSwitch('Сохранено в демо: '+onOff(confirmed)+'.','success');
    },700);
  }
  toggle.addEventListener('click',e=>{if(locked())e.preventDefault();},true);
  toggle.addEventListener('change',()=>{const next=toggle.checked;toggle.checked=confirmed;if(!locked())save(next);});
  $('switch-retry').addEventListener('click',()=>{if(phase==='error'&&requested!==null){toggle.focus();save(requested);}});
  $('switch-reconcile').addEventListener('click',()=>{
    if(phase!=='unknown')return;
    const current=++ticket;phase='checking';reads++;
    // The button hides, so retain keyboard position on the available switch.
    toggle.focus();paintSwitch('Сверяем подтверждённое значение. Повторной записи нет.');
    setTimeout(()=>{if(current!==ticket)return;confirmed=serverValue;phase='idle';paintSwitch('Проверено в демо: '+onOff(confirmed)+'. Повторной записи не было.','success');},700);
  });
  $('switch-reset').addEventListener('click',()=>{
    if(locked())return;
    ticket++;confirmed=false;requested=null;serverValue=false;phase='idle';writes=0;reads=0;
    $('outcome-success').checked=true;paintSwitch('Переключите настройку, чтобы проверить сохранение.');
  });
  paintSwitch('Переключите настройку, чтобы проверить сохранение.');

  // Diagnostics use real rectangles. No fake guide dimensions in the labels.
  $('measure').addEventListener('click',()=>{
    const mark=$('geometry-check').nextElementSibling;
    const choice=$('geometry-check').closest('.b-choice');
    const mb=mark.getBoundingClientRect(), cb=choice.getBoundingClientRect();
    const title=$('geometry-check-label').getBoundingClientRect();
    const track=$('geometry-switch').nextElementSibling;
    const tr=track.getBoundingClientRect(), thumb=track.firstElementChild.getBoundingClientRect();
    const edge=$('geometry-switch').checked?tr.right-thumb.right:thumb.left-tr.left;
    $('measurements').textContent=`Checkbox ${mb.width} × ${mb.height}, R${getComputedStyle(mark).borderRadius}\nДо подписи ${(title.left-mb.right).toFixed(1)} px · область нажатия ${cb.width.toFixed(1)} × ${cb.height.toFixed(1)}\nSwitch ${tr.width} × ${tr.height}, бегунок ${thumb.width} × ${thumb.height}\nInset: край ${edge.toFixed(1)} / сверху ${(thumb.top-tr.top).toFixed(1)} / снизу ${(tr.bottom-thumb.bottom).toFixed(1)} px`;
  });
  const longLabel=$('geometry-check-label').textContent;
  $('long-text').addEventListener('click',()=>{
    const active=$('long-text').getAttribute('aria-pressed')!=='true';
    $('long-text').setAttribute('aria-pressed',String(active));
    $('geometry-check-label').textContent=longLabel+(active?' — в том числе название рабочего проекта, контекст исходного сообщения и сведения о последнем подтверждённом изменении.':'');
  });
  // Read-only diagnostics for repeatable local tests; exposes no external actions.
  window.booleanLab=Object.freeze({snapshot:()=>({activeTab,master:{checked:$('cb-master').checked,mixed:$('cb-master').indeterminate},children:children().map(el=>({id:el.id,checked:el.checked})),radio:radios.find(el=>el.checked)?.value||null,switch:{confirmed,requested,phase,writes,reads},reviews:JSON.parse(JSON.stringify(reviews))})});
})();
