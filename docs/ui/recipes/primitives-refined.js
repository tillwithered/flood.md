/* Heroicons 20/solid, pinned 616b7a4dbbf3d011760af8066262cd5c6b3868f3.
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
SOFTWARE.
*/
'use strict';
(() => {
  const $ = id => document.getElementById(id), all = q => [...document.querySelectorAll(q)];
  const root = document.documentElement;
  const paths = {
    chevron:'M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z',
    check:'M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z',
    close:'M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z',
    search:'M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z'
  };
  const icon = name => `<svg class="glyph" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path ${name==='close'?'':'fill-rule="evenodd" clip-rule="evenodd"'} d="${paths[name]}"></path></svg>`;
  all('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=['fields','selects','details']; let tab='fields';
  const reviews=Object.fromEntries(tabs.map(id=>[id,{decision:'undecided',note:''}]));
  function activate(id, focus=false){
    closeSort();closeProject();tab=id;
    tabs.forEach(t=>{const active=t===id;$('tab-'+t).setAttribute('aria-selected',String(active));$('tab-'+t).tabIndex=active?0:-1;$('panel-'+t).hidden=!active;});
    if(focus)$('tab-'+id).focus();
    $('review-note').value=reviews[id].note;resizeText($('review-note'));
    all('[data-review]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.review===reviews[id].decision)));
  }
  tabs.forEach((id,i)=>{$('tab-'+id).onclick=()=>activate(id);$('tab-'+id).onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();activate(tabs[n],true);}};});
  $('theme').onclick=()=>{root.classList.add('theme-changing');root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';$('theme').textContent=root.dataset.theme==='dark'?'Светлая тема':'Тёмная тема';requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-changing')));};
  $('guides').onclick=()=>{$('guides').setAttribute('aria-pressed',String(root.classList.toggle('guide')));};
  $('contrast').onclick=()=>{const strong=root.dataset.contrast!=='strong';root.dataset.contrast=strong?'strong':'soft';$('contrast').setAttribute('aria-pressed',String(strong));};
  all('[data-review]').forEach(el=>el.onclick=()=>{reviews[tab].decision=el.dataset.review;activate(tab);});
  $('review-note').oninput=()=>reviews[tab].note=$('review-note').value;
  $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({lab:'0.6.3',reviews},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='flood-primitives-063-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('clear-search').onclick=()=>{$('search').value='';$('search').focus();};
  function resizeText(el){
    if(!el.getClientRects().length)return;
    const style=getComputedStyle(el),min=parseFloat(style.minHeight)||70,max=parseFloat(style.maxHeight)||240;
    el.style.height='0px';el.style.height=Math.max(min,Math.min(max,el.scrollHeight+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth)))+'px';
  }
  all('textarea').forEach(el=>el.addEventListener('input',()=>resizeText(el)));
  $('notes').oninput=()=>{$('notes-count').textContent=Array.from($('notes').value).length+' символов · поле растёт вместе с текстом';};
  $('reminder').addEventListener('blur',()=>{
    const value=$('reminder').value.trim();const valid=/^\d+$/.test(value)&&Number(value)<=120;
    $('reminder').setAttribute('aria-invalid',String(!valid));$('reminder-hint').classList.toggle('error',!valid);
    $('reminder-hint').textContent=valid?'Целое число от 0 до 120. Без степперов.':'Введите целое число от 0 до 120. Значение не изменено.';
  });
  all('.choice input').forEach(input=>{const mark=document.createElement('span');mark.className='choice-mark';mark.setAttribute('aria-hidden','true');if(input.type==='checkbox')mark.innerHTML=icon('check');input.after(mark);});
  $('show-secret').onclick=()=>{const input=$('demo-secret'),start=input.selectionStart,end=input.selectionEnd;const show=input.type==='password';input.type=show?'text':'password';$('show-secret').textContent=show?'Скрыть':'Показать';$('show-secret').setAttribute('aria-pressed',String(show));input.focus();if(start!==null)input.setSelectionRange(start,end);};
  let saving=false, saveCount=0, touched=false, saveToken=0;
  function validate(){const value=$('rule-name').value.trim();const message=!value?'Введите название правила.':value.toLocaleLowerCase()==='дизайн'?'Название «Дизайн» уже используется.':'';$('rule-name').setAttribute('aria-invalid',String(Boolean(message)));$('name-hint').textContent=message||'Название подходит для демонстрации.';$('name-hint').classList.toggle('error',Boolean(message));return !message;}
  $('rule-name').onblur=()=>{if($('rule-name').value||touched){touched=true;validate();}};
  $('rule-name').oninput=()=>{if(touched)validate();};
  $('demo-form').onsubmit=e=>{e.preventDefault();if(saving)return;touched=true;if(!validate()){$('rule-name').focus();return;}saving=true;saveCount++;const token=++saveToken;const shouldFail=$('fail-save').checked;const value=$('rule-name').value.trim();$('save').disabled=true;$('reset-form').disabled=true;$('save').setAttribute('aria-busy','true');$('save-spin').innerHTML='<span class="spin"></span>';$('save-label').textContent='Сохраняем';$('save-feedback').className='live';$('save-feedback').textContent='Локальная симуляция · 600 мс';setTimeout(()=>{if(token!==saveToken)return;saving=false;$('save').disabled=false;$('reset-form').disabled=false;$('save').setAttribute('aria-busy','false');$('save-spin').textContent='';$('save-label').textContent='Сохранить правило';$('save-feedback').className='live '+(shouldFail?'error':'ok');$('save-feedback').textContent=shouldFail?'Не сохранено. Ввод остался в поле; повторите после отключения симуляции.':'В демо сохранено: '+value+'. Реальные данные не изменены.';},600);};
  $('reset-form').onclick=()=>{if(saving)return;$('demo-form').reset();touched=false;$('rule-name').removeAttribute('aria-invalid');$('name-hint').className='hint';$('name-hint').textContent='Имя «Дизайн» занято в демонстрационных данных.';$('save-feedback').textContent='';$('rule-name').focus();};
  // Rounded shell clips only the inset scroller; focus stays at the external trigger.
  function place(popup,anchor){
    const r=anchor.getBoundingClientRect(),gap=parseFloat(getComputedStyle(root).getPropertyValue('--popup-gap')),gutter=12;
    const scroller=popup.querySelector('.popup-scroll');
    popup.style.width=Math.min(r.width,innerWidth-gutter*2)+'px';
    const style=getComputedStyle(popup),chrome=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    const wanted=Math.min(scroller.scrollHeight+chrome,320),below=innerHeight-r.bottom-gap-gutter,above=r.top-gap-gutter;
    const flip=below<wanted&&above>below,available=Math.max(0,flip?above:below);
    popup.style.maxHeight=Math.min(320,available)+'px';
    const p=popup.getBoundingClientRect();
    popup.style.left=Math.max(gutter,Math.min(r.left,innerWidth-p.width-gutter))+'px';
    popup.style.top=Math.max(gutter,flip?r.top-gap-p.height:r.bottom+gap)+'px';
    popup.dataset.placement=flip?'top':'bottom';
  }
  const selectControls=[];
  function createSelect(id,items,onCommit){
    const trigger=$(id),popup=$(id+'-popup'),list=$(id+'-options');
    let saved=0,activeIndex=0,typed='',timer;
    const allowed=()=>items.map((x,i)=>x.disabled?-1:i).filter(i=>i>=0);
    function render(){
      list.innerHTML=items.map((item,i)=>`<li id="${id}-option-${i}" class="option" role="option" aria-selected="${i===saved}" aria-disabled="${Boolean(item.disabled)}" data-active="${i===activeIndex}" data-index="${i}"><span>${esc(item.name)}${item.disabled?'<span class="meta">Недоступно в этом примере</span>':''}</span><span class="option-check" aria-hidden="true">${i===saved?icon('check'):''}</span></li>`).join('');
      trigger.setAttribute('aria-activedescendant',id+'-option-'+activeIndex);place(popup,trigger);
    }
    function close(){popup.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');typed='';clearTimeout(timer);}
    function open(){selectControls.forEach(s=>s.close());closeProject();popup.hidden=false;trigger.setAttribute('aria-expanded','true');activeIndex=saved;render();}
    function commit(i){if(!items[i]||items[i].disabled)return;saved=i;trigger.value=items[i].id;$(id+'-value').textContent=items[i].name;close();onCommit?.(items[i]);trigger.focus();}
    function showActive(){render();$(id+'-option-'+activeIndex).scrollIntoView({block:'nearest'});}
    trigger.onclick=()=>popup.hidden?open():close();
    trigger.onkeydown=e=>{
      if(e.isComposing)return;
      if(['Enter',' '].includes(e.key)){e.preventDefault();popup.hidden?open():commit(activeIndex);return;}
      if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){close();return;}
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
        e.preventDefault();const closed=popup.hidden;if(closed)open();const indices=allowed();
        if(e.key==='Home')activeIndex=indices[0];else if(e.key==='End')activeIndex=indices.at(-1);
        else if(!closed)activeIndex=indices[Math.max(0,Math.min(indices.length-1,indices.indexOf(activeIndex)+(e.key==='ArrowDown'?1:-1)))];
        showActive();return;
      }
      if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(popup.hidden)open();typed+=e.key.toLocaleLowerCase();clearTimeout(timer);timer=setTimeout(()=>typed='',600);const i=items.findIndex(x=>!x.disabled&&x.name.toLocaleLowerCase().startsWith(typed));if(i>=0){activeIndex=i;showActive();}}
    };
    popup.onpointerdown=e=>{if(e.target.closest('[data-index]'))e.preventDefault();};
    popup.onclick=e=>{const el=e.target.closest('[data-index]');if(el)commit(Number(el.dataset.index));};
    // The native scroll engine must not blur the combobox when dragging its scrollbar.
    popup.addEventListener('mousedown',e=>{if(e.target.classList.contains('popup-scroll'))e.preventDefault();});
    trigger.addEventListener('blur',()=>setTimeout(()=>{if(!popup.contains(document.activeElement)&&document.activeElement!==trigger)close();},0));
    const api={trigger,popup,close,open,get value(){return items[saved].id;}};selectControls.push(api);trigger.value=items[0].id;return api;
  }
  const sortControl=createSelect('sort',[{id:'updated',name:'Сначала обновлённые'},{id:'created',name:'По времени создания'},{id:'title',name:'По названию'},{id:'manual',name:'Вручную',disabled:true}],item=>{$('sort-result').textContent='Выбрано: '+item.name;});
  const scenarioControl=createSelect('scenario',[{id:'normal',name:'Обычный ответ · 300 мс'},{id:'slow',name:'Медленный ответ · 1000 мс'},{id:'error',name:'Ошибка запроса'},{id:'race',name:'Старый запрос отвечает позже нового'}],()=>{$('request-state').textContent='Выбран режим симуляции. Откройте поиск.';});
  function closeSort(){selectControls.forEach(s=>s.close());}
  function openSort(){sortControl.open();}
  $('measure').onclick=()=>{openSort();const a=$('sort').getBoundingClientRect(),p=$('sort-popup').getBoundingClientRect(),item=$('sort-options').firstElementChild.getBoundingClientRect(),scroll=$('sort-popup').querySelector('.popup-scroll').getBoundingClientRect();const gap=$('sort-popup').dataset.placement==='top'?a.top-p.bottom:p.top-a.bottom;$('metrics').textContent=`Зазор ${gap.toFixed(1)} px · inset ${(item.left-p.left).toFixed(1)} px · radius ${getComputedStyle($('sort-options').firstElementChild).borderRadius} · скролл внутри ${(p.right-scroll.right).toFixed(1)} px`;$('sort').focus();};
  const projects=[{id:'flood',name:'Flood'},{id:'design',name:'Дизайн-система Flood'},{id:'docs',name:'Документация'},{id:'personal',name:'Личный проект'},{id:'research',name:'Исследование рабочего пространства'},{id:'sources',name:'Источники и интеграции'},{id:'archive',name:'Архивный проект',disabled:true}];
  let committed=null,matches=[],active=-1,request=0,debounce,composing=false,queryState='idle',lastQuery='';
  function renderProjects(){
    $('project-options').innerHTML=matches.map((p,i)=>`<li class="option" id="project-option-${p.id}" role="option" aria-selected="${committed?.id===p.id}" aria-disabled="${Boolean(p.disabled)}" data-active="${i===active}" data-project="${p.id}"><span>${esc(p.name)}${p.disabled?'<span class="meta">Архив · выбор недоступен</span>':''}</span><span class="option-check">${committed?.id===p.id?icon('check'):''}</span></li>`).join('');
    if(active>=0&&matches[active])$('project').setAttribute('aria-activedescendant','project-option-'+matches[active].id);else $('project').removeAttribute('aria-activedescendant');
    $('project-options').setAttribute('aria-busy',String(queryState==='loading'));place($('project-popup'),$('project-frame'));
  }
  function closeProject(restore=true){++request;clearTimeout(debounce);if($('project-popup').hidden)return;$('project-popup').hidden=true;$('project').setAttribute('aria-expanded','false');$('project').removeAttribute('aria-activedescendant');active=-1;queryState='idle';if(restore)$('project').value=committed?.name||'';}
  function scheduleSearch(immediate=false,allValues=false){
    if(composing)return;closeSort();clearTimeout(debounce);const ticket=++request;const q=allValues?'':$('project').value.trim().toLocaleLowerCase();lastQuery=q;const scenario=$('scenario').value;const delay=scenario==='slow'?1000:scenario==='race'?(q.length<3?1000:100):300;
    $('project-popup').hidden=false;$('project').setAttribute('aria-expanded','true');queryState='loading';active=-1;matches=[];$('project-status').className='popup-status';$('project-status').textContent='Ищем проекты…';$('request-state').textContent='Ожидание ответа · значение пока не изменено.';renderProjects();
    debounce=setTimeout(()=>{setTimeout(()=>{if(ticket!==request||$('project-popup').hidden)return;if(scenario==='error'){queryState='error';$('project-status').className='popup-status error';$('project-status').textContent='Не удалось загрузить. Повторите поиск кнопкой под полем.';$('request-state').textContent='Ошибка запроса. Выбранное значение сохранено.';}else{queryState='ready';matches=projects.filter(p=>p.name.toLocaleLowerCase().includes(q));$('project-status').textContent=matches.length?`${matches.length} вариантов · Enter выбирает, Escape отменяет`:'Ничего не найдено. Измените запрос.';$('request-state').textContent='Показан ответ на запрос: '+(q||'все проекты');}renderProjects();},delay);},immediate?0:180);
  }
  $('project').oninput=()=>scheduleSearch();
  $('project').oncompositionstart=()=>{composing=true;++request;clearTimeout(debounce);};
  $('project').oncompositionend=()=>{composing=false;scheduleSearch();};
  $('project').onclick=()=>{if($('project-popup').hidden)scheduleSearch(true,true);};
  $('open-project').onmousedown=e=>e.preventDefault();
  $('open-project').onclick=()=>{$('project').focus();$('project-popup').hidden?scheduleSearch(true,true):closeProject();};
  function commitProject(id){const value=matches.find(p=>p.id===id);if(!value||value.disabled)return;committed=value;$('project-result').textContent='Выбран проект: '+value.name;closeProject();$('project').value=value.name;$('project').focus();}
  $('project').onkeydown=e=>{if(e.isComposing||composing)return;if(e.key==='Escape'){if(!$('project-popup').hidden){e.preventDefault();closeProject();}return;}if(e.key==='Tab'){closeProject();return;}if(e.key==='Enter'&&!$('project-popup').hidden){e.preventDefault();if(active>=0)commitProject(matches[active].id);return;}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if($('project-popup').hidden){scheduleSearch(true,true);return;}const indices=matches.map((p,i)=>p.disabled?-1:i).filter(i=>i>=0);if(!indices.length)return;let i=indices.indexOf(active);i=e.key==='ArrowDown'?Math.min(i+1,indices.length-1):(i<=0?0:i-1);active=indices[i];renderProjects();$('project-option-'+matches[active].id).scrollIntoView({block:'nearest'});}};
  $('project-popup').onpointerdown=e=>{if(e.target.closest('[data-project]'))e.preventDefault();};
  $('project-popup').onclick=e=>{const option=e.target.closest('[data-project]');if(option)commitProject(option.dataset.project);};
  $('project-popup').addEventListener('mousedown',e=>{if(e.target.classList.contains('popup-scroll'))e.preventDefault();});
  $('project').onblur=()=>{setTimeout(()=>{if(document.activeElement!==$('project')&&!$('project-popup').contains(document.activeElement)&&document.activeElement!==$('open-project'))closeProject();},0);};
  $('retry').onclick=()=>{$('project').value=lastQuery;$('project').focus();scheduleSearch(true);};
  $('clear-project').onclick=()=>{closeProject();committed=null;$('project').value='';$('project-result').textContent='Значение ещё не выбрано.';$('project').focus();};
  $('scenario').onchange=()=>{closeProject(false);$('request-state').textContent='Выбран режим симуляции. Откройте поиск.';};
  document.addEventListener('pointerdown',e=>{selectControls.forEach(s=>{if(!s.popup.contains(e.target)&&!s.trigger.contains(e.target))s.close();});if(!$('project-popup').contains(e.target)&&!$('project-frame').contains(e.target))closeProject();});
  let raf;function reposition(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{for(const [p,a,close] of [...selectControls.map(s=>[s.popup,s.trigger,s.close]),[$('project-popup'),$('project-frame'),closeProject]]){if(p.hidden)continue;const r=a.getBoundingClientRect();if(!a.getClientRects().length||r.bottom<12||r.top>innerHeight-12)close();else place(p,a);}});}
  window.addEventListener('resize',()=>{all('textarea').forEach(resizeText);reposition();});document.addEventListener('scroll',e=>{if(!e.target.closest?.('.popup'))reposition();},true);
  const children=all('.child-check');function syncMaster(){const n=children.filter(el=>el.checked).length;$('master-check').checked=n===children.length;$('master-check').indeterminate=n>0&&n<children.length;}
  children.forEach(el=>el.onchange=syncMaster);$('master-check').onchange=()=>{children.forEach(el=>el.checked=$('master-check').checked);syncMaster();};syncMaster();
  all('textarea').forEach(resizeText);
  window.refinedLab={activate,snapshot:()=>({tab,sort:sortControl.value,scenario:scenarioControl.value,committed:committed?.id||null,queryState,request,saving,saveCount,reviews})};
})();
