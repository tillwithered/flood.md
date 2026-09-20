/* Local-only primitive experiment; no network or production settings. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const groups = ['icons','choice','fields','geometry'];
  const reviews = Object.fromEntries(groups.map(id => [id,{decision:'undecided',note:''}]));
  let active = 'icons', family = 'phosphor', switchSaved = false, switchPending = false, saves = 0;
  const names = {folder:'Проекты',document:'Документ',settings:'Настройки',search:'Поиск',trash:'Удаление',done:'Готово'};
  function icon(name, pack = family) {
    const sample = window.FloodIconSamples[pack];
    if (!sample?.paths[name]) throw new Error('Unknown demo icon: ' + pack + '/' + name);
    return `<svg class="glyph" viewBox="${sample.viewBox}" fill="currentColor" aria-hidden="true" focusable="false" data-family="${pack}"><path ${pack==='hero'&&name!=='folder'?'fill-rule="evenodd" clip-rule="evenodd"':''} d="${sample.paths[name]}"></path></svg>`;
  }
  function renderIcons() {
    $('icon-comparison').innerHTML = ['phosphor','hero'].map((pack,index) => `<div><p class="caption">${index?'B':'A'} · ${window.FloodIconSamples[pack].label}<span>Кандидат</span></p><div class="panel pad"><div class="icon-catalog">${Object.entries(names).map(([key,label])=>`<div class="icon-cell"><span class="glyph-slot">${icon(key,pack)}</span><span>${label}</span></div>`).join('')}</div><div class="icon-context"><div class="actions"><button class="ui-btn" data-icon-demo="${pack}" aria-label="Настройки в примере ${pack}">${icon('settings',pack)}</button><button class="ui-btn primary" data-icon-demo="${pack}">${icon('folder',pack)} Открыть проект</button></div><p class="icon-caption">Та же иконка без фона и внутри control. Размер target не равен размеру SVG.</p></div></div></div>`).join('');
    all('[data-demo-icon]').forEach(node => { node.innerHTML = icon(node.dataset.demoIcon); });
  }
  function activate(id, focus = false) {
    if (!groups.includes(id)) return;
    active = id;
    groups.forEach(key=>{const tab=$('tab-'+key),selected=key===id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$('page-'+key).hidden=!selected;});
    $('review-note').value=reviews[id].note;
    all('[data-review]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.review===reviews[id].decision)));
    if(focus)$('tab-'+id).focus();
    if(id==='geometry')requestAnimationFrame(measure);
  }
  groups.forEach((id,index)=>{
    $('tab-'+id).addEventListener('click',()=>activate(id));
    $('tab-'+id).addEventListener('keydown',event=>{
      const next={ArrowRight:(index+1)%4,ArrowLeft:(index+3)%4,Home:0,End:3}[event.key];
      if(next!==undefined){event.preventDefault();activate(groups[next],true);}
    });
  });
  $('theme').addEventListener('click',()=>{
    document.body.classList.add('theme-changing');
    document.body.dataset.theme=document.body.dataset.theme==='dark'?'light':'dark';
    $('theme').textContent=document.body.dataset.theme==='dark'?'Светлая тема':'Тёмная тема';
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('theme-changing')));
  });
  $('glyph-size').addEventListener('change',()=>document.body.style.setProperty('--glyph-size',$('glyph-size').value+'px'));
  $('guides').addEventListener('change',()=>document.body.dataset.guides=String($('guides').checked));
  $('icon-family').addEventListener('change',()=>{family=$('icon-family').value;renderIcons();});
  renderIcons();
  const states=[['rest','Покой'],['hover','Наведение'],['checked','Выбрано'],['mixed','Часть выбрана'],['focus','Фокус'],['checked-focus','Выбор + фокус'],['disabled','Недоступно'],['invalid','Ошибка']];
  $('choice-states').innerHTML=states.map(([state,label])=>`<div class="state-cell"><div class="sample-choice" data-state="${state}" aria-hidden="true"><span class="choice-mark"></span></div><small>${label}</small></div>`).join('');
  const checkboxes=all('#check-children input');
  function checkSummary(){
    const count=checkboxes.filter(box=>box.checked).length;
    $('check-all').checked=count===checkboxes.length;
    $('check-all').indeterminate=count>0&&count<checkboxes.length;
    $('check-summary').textContent=`Выбрано ${count} из ${checkboxes.length}. Это фильтр демо, не разрешения агента.`;
  }
  checkboxes.forEach(box=>box.addEventListener('change',checkSummary));
  $('check-all').addEventListener('change',()=>{checkboxes.forEach(box=>box.checked=$('check-all').checked);checkSummary();});checkSummary();
  $('invalid-check').addEventListener('change',()=>{const invalid=!$('invalid-check').checked;$('invalid-check').setAttribute('aria-invalid',String(invalid));$('check-error').hidden=!invalid;});
  $('switch-live').addEventListener('change',()=>{
    if(switchPending)return;
    const desired=$('switch-live').checked, fail=$('switch-fail').checked;
    switchPending=true;$('switch-live').checked=switchSaved;$('switch-live').disabled=true;$('switch-live').setAttribute('aria-busy','true');
    $('switch-feedback').classList.remove('error');$('switch-feedback').textContent='Сохраняем изменение… Локальная симуляция 600 мс.';
    setTimeout(()=>{
      if(!fail)switchSaved=desired;
      $('switch-live').checked=switchSaved;$('switch-live').disabled=false;$('switch-live').removeAttribute('aria-busy');switchPending=false;
      $('switch-feedback').classList.toggle('error',fail);
      $('switch-feedback').textContent=fail?'Не сохранено. Прежнее значение оставлено; повторите действие.':switchSaved?'Включено. Сохранено только в памяти страницы.':'Выключено. Сохранено только в памяти страницы.';
      if(fail)$('switch-fail').checked=false;
    },600);
  });
  $('format-select').addEventListener('change',()=>{const invalid=!$('format-select').value;$('format-select').setAttribute('aria-invalid',String(invalid));$('format-error').hidden=!invalid;});
  $('save-demo').addEventListener('click',()=>{
    if($('save-demo').disabled)return;saves++;
    $('save-demo').disabled=true;$('save-demo').setAttribute('aria-busy','true');$('save-demo').querySelector('.loading-slot').innerHTML='<span class="spinner-mini"></span>';
    $('button-feedback').textContent='Сохраняем… Локальная симуляция 600 мс.';
    setTimeout(()=>{$('save-demo').disabled=false;$('save-demo').removeAttribute('aria-busy');$('save-demo').querySelector('.loading-slot').replaceChildren();$('button-feedback').textContent='Сохранено в демо. Настоящие данные не менялись.';},600);
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-echo]');
    if(button)$(active==='geometry'?'geometry-feedback':'button-feedback').textContent=button.dataset.echo+'. Только демо.';
  });
  function measure(){
    const outer=$('nested-correct'),inner=outer.firstElementChild;
    if(!outer.getClientRects().length)return;
    const a=outer.getBoundingClientRect(),b=inner.getBoundingClientRect();
    const r=parseFloat(getComputedStyle(inner).borderTopLeftRadius);
    $('measured').textContent=`Измерено: inset ${(b.x-a.x).toFixed(0)} px, r ${r.toFixed(0)} px.`;
  }
  $('inset').addEventListener('change',()=>{
    const inset=Number($('inset').value);all('.nested-shell').forEach(el=>el.style.setProperty('--inset',inset+'px'));
    $('inset-value').textContent=inset;$('inner-value').textContent=Math.max(0,16-inset);requestAnimationFrame(measure);
  });
  $('measure').addEventListener('click',measure);
  $('clear-joined').addEventListener('click',()=>{$('joined-input').value='';$('joined-input').focus();});
  all('[data-review]').forEach(button=>button.addEventListener('click',()=>{reviews[active].decision=button.dataset.review;activate(active);}));
  $('review-note').addEventListener('input',()=>reviews[active].note=$('review-note').value);
  $('export').addEventListener('click',()=>{
    const payload={lab:'primitives-0.6',family,glyphSize:$('glyph-size').value,reviews,createdAt:new Date().toISOString()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='flood-primitives-feedback.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  window.primitiveLab={activate,measure,snapshot:()=>({active,family,switchSaved,switchPending,saves,reviews})};
})();
