/* Local interaction specimen. No network, credentials or real GitHub mutations. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const body = document.body;
  const tabs = $$('[role="tab"]');
  let activeTab = 'menu';
  const reviews = Object.fromEntries(['menu','choice','connect'].map(id => [id,{decision:'undecided',note:''}]));
  function activateTab(id, focus = false) {
    closeMenu(false); closeCombo();
    activeTab = id;
    tabs.forEach(tab => { const active = tab.id === 'tab-' + id; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; $(tab.getAttribute('aria-controls')).hidden = !active; });
    if (focus) $('tab-' + id).focus();
    $('review-note').value = reviews[id].note;
    $$('[data-review]').forEach(btn => btn.setAttribute('aria-pressed',String(btn.dataset.review === reviews[id].decision)));
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener('click', () => activateTab(tab.id.slice(4)));
    tab.addEventListener('keydown', event => { let next;
      if(event.key === 'ArrowRight') next=(i+1)%tabs.length;
      if(event.key === 'ArrowLeft') next=(i-1+tabs.length)%tabs.length;
      if(event.key === 'Home') next=0;
      if(event.key === 'End') next=tabs.length-1;
      if(next!==undefined) {event.preventDefault();activateTab(tabs[next].id.slice(4),true);}
    });
  });
  $('theme').addEventListener('click', () => {
    body.classList.add('theme-changing');
    body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    $('theme').textContent = body.dataset.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('theme-changing')));
  });
  $$('[data-review]').forEach(btn => btn.addEventListener('click', () => {reviews[activeTab].decision=btn.dataset.review;activateTab(activeTab);}));
  $('review-note').addEventListener('input', () => {reviews[activeTab].note=$('review-note').value;});
  $('export').addEventListener('click', () => {
    const blob=new Blob([JSON.stringify({lab:'0.5',theme:body.dataset.theme,createdAt:new Date().toISOString(),reviews},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');link.href=url;link.download='flood-lab-05-feedback.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  // All floating layers are anchored in viewport coordinates and clamped to it.
  function placePopup(popup, anchor, matchWidth=false) {
    const r=anchor.getBoundingClientRect(), gutter=12;
    const w=Math.min(matchWidth ? Math.max(r.width,240) : 260,innerWidth-gutter*2);
    popup.style.width=w+'px';popup.style.maxHeight='min(360px, 65dvh)';
    const below=Math.max(0,innerHeight-r.bottom-gutter-6), above=Math.max(0,r.top-gutter-6);
    const preferred=popup.scrollHeight;
    const useAbove=below<Math.min(preferred,180)&&above>below;
    const available=useAbove?above:below;
    popup.style.maxHeight=Math.max(40,Math.min(360,available))+'px';
    const h=popup.getBoundingClientRect().height;
    popup.style.left=Math.max(gutter,Math.min(r.left,innerWidth-w-gutter))+'px';
    popup.style.top=Math.max(gutter,useAbove?r.top-h-6:r.bottom+6)+'px';
  }
  let pinned=false, taskRemoved=false;
  const menu=$('task-menu'), trigger=$('menu-trigger');
  const menuItems=[...menu.querySelectorAll('[role="menuitem"]')];
  function closeMenu(restore=true) {if(menu.hidden)return;menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore)trigger.focus();}
  function openMenu(last=false) {closeCombo();menu.hidden=false;trigger.setAttribute('aria-expanded','true');placePopup(menu,trigger);menuItems[last?menuItems.length-1:0].focus();}
  trigger.addEventListener('click',()=> menu.hidden?openMenu():closeMenu());
  trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openMenu(event.key==='ArrowUp');}});
  let typed='', typeTimer;
  menu.addEventListener('keydown',event=>{
    const at=menuItems.indexOf(document.activeElement);let next;
    if(event.key==='ArrowDown')next=(at+1)%menuItems.length;
    if(event.key==='ArrowUp')next=(at-1+menuItems.length)%menuItems.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=menuItems.length-1;
    if(next!==undefined){event.preventDefault();menuItems[next].focus();}
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu();}
    if(event.key==='Tab'){
      event.preventDefault();closeMenu();
      const focusables=$$('#workspace button, #workspace input, #workspace select, #workspace textarea').filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
      const position=focusables.indexOf(trigger)+(event.shiftKey?-1:1);(focusables[position]||trigger).focus();
    }
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&event.key!==' '){typed+=event.key.toLocaleLowerCase();clearTimeout(typeTimer);typeTimer=setTimeout(()=>typed='',600);const found=menuItems.find(item=>item.textContent.toLocaleLowerCase().startsWith(typed));found?.focus();}
  });
  menuItems.forEach(item=>item.addEventListener('click',()=>{
    closeMenu();
    if(item.dataset.command==='details')$('menu-result').textContent='Задача проекта Flood. 3 источника. Это сведения, а не редактор.';
    if(item.dataset.command==='pin'){pinned=!pinned;$('pin-label').textContent=pinned?'Закреплена':'Не закреплена';item.textContent=pinned?'Открепить задачу':'Закрепить задачу';$('menu-result').textContent=pinned?'Демо-задача закреплена.':'Закрепление снято.';}
    if(item.dataset.command==='delete'){body.classList.add('modal-open');$('delete-dialog').showModal();$('cancel-delete').focus();}
  }));
  function closeDelete(){ $('delete-dialog').close();body.classList.remove('modal-open');trigger.focus();}
  $('cancel-delete').addEventListener('click',closeDelete);
  $('delete-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDelete();});
  $('confirm-delete').addEventListener('click',()=>{taskRemoved=true;closeDelete();trigger.disabled=true;$('task-name').textContent='Демо-задача удалена';$('menu-result').textContent='Реальные данные не изменились.';$('restore-task').hidden=false;$('restore-task').focus();});
  $('restore-task').addEventListener('click',()=>{taskRemoved=false;trigger.disabled=false;$('task-name').textContent='Подключить репозиторий к проекту';$('restore-task').hidden=true;$('menu-result').textContent='Демо-задача восстановлена.';trigger.focus();});

  // An editable, select-only-value combobox; query is not a committed selection.
  const projects=['Flood','Дизайн-система Flood','Источники и интеграции','Личный проект','Исследование рабочего пространства'];
  const combo=$('project-choice'), comboPopup=$('projects-popup');
  let chosenProject='', comboIndex=-1, projectMatches=[];
  function renderProjects(){
    projectMatches=projects.filter(name=>name.toLocaleLowerCase().includes(combo.value.trim().toLocaleLowerCase()));
    comboIndex=Math.min(comboIndex,projectMatches.length-1);
    $('project-options').innerHTML=projectMatches.map((name,i)=>`<li id="project-option-${i}" role="option" aria-selected="${name===chosenProject}" data-index="${i}" data-active="${i===comboIndex}"><span>${escapeHTML(name)}</span><span class="option-mark" aria-hidden="true">${name===chosenProject?'✓':''}</span></li>`).join('');
    $('combo-empty').hidden=projectMatches.length>0;
    if(comboIndex>=0)combo.setAttribute('aria-activedescendant','project-option-'+comboIndex);else combo.removeAttribute('aria-activedescendant');
    placePopup(comboPopup,combo,true);
  }
  function openCombo(){closeMenu(false);comboPopup.hidden=false;combo.setAttribute('aria-expanded','true');renderProjects();}
  function closeCombo(restoreValue=true){if(comboPopup.hidden)return;comboPopup.hidden=true;combo.setAttribute('aria-expanded','false');combo.removeAttribute('aria-activedescendant');comboIndex=-1;if(restoreValue)combo.value=chosenProject;}
  combo.addEventListener('input',()=>{comboIndex=-1;openCombo();});
  combo.addEventListener('click',openCombo);
  $('combo-toggle').addEventListener('click',()=>{combo.focus();comboPopup.hidden?openCombo():closeCombo();});
  function selectProject(index){if(!projectMatches[index])return;chosenProject=projectMatches[index];combo.value=chosenProject;$('project-result').textContent='Выбран проект: '+chosenProject;closeCombo();combo.focus();}
  combo.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(comboPopup.hidden)openCombo();if(projectMatches.length){comboIndex=event.key==='ArrowDown'?(comboIndex+1)%projectMatches.length:(comboIndex<=0?projectMatches.length-1:comboIndex-1);renderProjects();$('project-option-'+comboIndex)?.scrollIntoView({block:'nearest'});}}
    if(event.key==='Enter'&&!comboPopup.hidden){event.preventDefault();if(comboIndex>=0)selectProject(comboIndex);}
    if(event.key==='Escape'&&!comboPopup.hidden){event.preventDefault();event.stopPropagation();closeCombo();}
    if(event.key==='Tab')closeCombo();
  });
  combo.addEventListener('blur',()=>{setTimeout(()=>{if(!comboPopup.contains(document.activeElement)&&document.activeElement!==$('combo-toggle'))closeCombo();},0);});
  comboPopup.addEventListener('pointerdown',event=>event.preventDefault());
  comboPopup.addEventListener('click',event=>{const option=event.target.closest('[data-index]');if(option)selectProject(Number(option.dataset.index));});
  $('sort').addEventListener('change',()=>{$('sort-result').textContent='Порядок в демо: '+$('sort').value;});
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!trigger.contains(event.target))closeMenu(false);if(!comboPopup.hidden&&!comboPopup.contains(event.target)&&!event.target.closest('.combo-wrap'))closeCombo();});
  let positionFrame;
  function syncOpenPopups(){
    cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(()=>{
      for(const [popup,anchor,matchWidth] of [[menu,trigger,false],[comboPopup,combo,true]]){
        if(popup.hidden)continue;const r=anchor.getBoundingClientRect();
        if(r.bottom<0||r.top>innerHeight){if(popup===menu)closeMenu(false);else closeCombo();}
        else placePopup(popup,anchor,matchWidth);
      }
    });
  }
  window.addEventListener('resize',syncOpenPopups);
  document.addEventListener('scroll',event=>{if(!menu.contains(event.target)&&!comboPopup.contains(event.target))syncOpenPopups();},true);

  const repositories=[
    {id:101,installation:1,owner:'tillwithered',name:'flood-dev',private:true,archived:false,description:'Рабочий репозиторий Flood. Интерфейс и интеграции.'},
    {id:102,installation:1,owner:'tillwithered',name:'flood',private:false,archived:false,description:'Публичная версия приложения.'},
    {id:201,installation:2,owner:'flood-team',name:'flood-dev',private:true,archived:false,description:'Другой владелец, то же имя. Проверяем различимость.'},
    {id:202,installation:2,owner:'flood-team',name:'design-system',private:true,archived:false,description:'Правила, компоненты и сценарии.'},
    {id:103,installation:1,owner:'tillwithered',name:'telegram-connector',private:true,archived:false,description:'Источники сообщений и управление доступом.'},
    {id:203,installation:2,owner:'flood-team',name:'documentation',private:false,archived:false,description:'Документация проекта.'},
    {id:204,installation:2,owner:'flood-team',name:'workspace-experiments-with-a-very-long-repository-name',private:true,archived:false,description:'Длинное название переносится, а не скрывает владельца.'},
    {id:104,installation:1,owner:'tillwithered',name:'flood-prototype',private:false,archived:true,description:'Архивный прототип. Доступен для чтения.'},
    {id:205,installation:2,owner:'flood-team',name:'integration-tests',private:true,archived:false,description:'Проверки интеграций.'},
    {id:206,installation:2,owner:'flood-team',name:'legacy-sources',private:true,archived:true,description:'Архив источников.'}
  ];
  const key=r=>r.installation+':'+r.id;
  const identity=r=>r.owner+'/'+r.name;
  const dialog=$('repos-dialog');
  let selected=null, bound=null, serverBinding=null, phase='idle', operation=0, opener=null, catalogFailed=false, revokedKey=null;
  function filteredRepos(){const q=$('repo-query').value.trim().toLocaleLowerCase(),owner=$('repo-owner').value,visibility=$('repo-visibility').value;
    return repositories.filter(r=>(owner==='all'||r.owner===owner)&&(visibility==='all'||(r.private?'private':'public')===visibility)&&($('repo-archived').checked||!r.archived)&&`${identity(r)} ${r.description}`.toLocaleLowerCase().includes(q));}
  function message(text,tone='neutral'){const el=$('operation-message');el.textContent=text;el.dataset.tone=tone;el.hidden=!text;}
  function updateFooter(){
    const current=selected&&repositories.find(r=>key(r)===selected);
    $('selected-repo').textContent=current?identity(current):'Выберите репозиторий';
    $('hidden-selection').hidden=!current||filteredRepos().some(r=>key(r)===selected);
    $('commit-repo').disabled=!current||phase==='pending'||phase==='checking'||selected===revokedKey||catalogFailed||(bound&&key(bound)===selected&&phase!=='unknown');
    const text=phase==='unknown'?'Проверить подключение':phase==='checking'?'Проверяем':phase==='pending'?'Подключаем':phase==='failed'?'Повторить':'Подключить';
    $('commit-label').textContent=text;
    $('commit-repo').querySelector('.commit-slot').innerHTML=['pending','checking'].includes(phase)?'<span class="spinner"></span>':'';
    $('cancel-repos').textContent=phase==='pending'?'Закрыть окно':'Отмена';
  }
  // Visibility, binding and availability are independent facts, never substitutes.
  // Markers belong to the heading; the description remains a separate prose block.
  function repositoryMetadata(repo) {
    const markers = [
      `<span class="repo-meta-tag" data-kind="visibility">${repo.private ? 'Приватный' : 'Публичный'}</span>`
    ];
    if (bound && key(bound) === key(repo)) {
      markers.push('<span class="repo-meta-tag" data-kind="binding"><span aria-hidden="true">✓</span>Подключён</span>');
    }
    if (repo.archived) markers.push('<span class="repo-meta-tag" data-kind="archive">Архивный</span>');
    if (key(repo) === revokedKey) markers.push('<span class="repo-meta-tag" data-kind="access">Нет доступа</span>');
    return markers.join('');
  }
  function renderRepos(){
    const rows=filteredRepos();
    $('repo-count').textContent=catalogFailed?'Каталог временно недоступен':`${rows.length} из ${repositories.length} демо-репозиториев`;
    $('catalog-error').hidden=!catalogFailed;$('repo-options').hidden=catalogFailed;$('repo-empty').hidden=catalogFailed||rows.length>0;
    $('repo-options').innerHTML='<legend class="sr">Один репозиторий для проекта Flood</legend>'+rows.map(r=>`<label class="repo-option"><input type="radio" name="repository" value="${key(r)}" ${selected===key(r)?'checked':''} ${key(r)===revokedKey?'disabled':''}><span class="repo-heading"><span class="repo-name">${escapeHTML(identity(r))}</span><span class="repo-flags">${repositoryMetadata(r)}</span></span><span class="meta repo-description">${escapeHTML(r.description)}</span></label>`).join('');
    setLocked(['pending','checking','unknown'].includes(phase));updateFooter();
  }
  function setLocked(locked){$$('#repos-dialog .repo-tools input, #repos-dialog .repo-tools select, #repo-options input').forEach(el=>{el.disabled=locked||(el.name==='repository'&&el.value===revokedKey);});$('repo-scroll').setAttribute('aria-busy',String(locked));}
  function openRepos(event){
    closeMenu(false);closeCombo();opener=event.currentTarget;catalogFailed=$('scenario').value==='catalog-error';
    if(!['pending','unknown','checking'].includes(phase)){phase='idle';message('');}
    renderRepos();body.classList.add('modal-open');dialog.showModal();(phase==='unknown'?$('commit-repo'):phase==='pending'||phase==='checking'?$('close-repos'):$('repo-query')).focus();
  }
  function closeRepos(){dialog.close();body.classList.remove('modal-open');opener?.focus();}
  $$('[data-open-repos]').forEach(btn=>btn.addEventListener('click',openRepos));
  $('close-repos').addEventListener('click',closeRepos);$('cancel-repos').addEventListener('click',closeRepos);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeRepos();});
  // Native dialog provides modality; explicitly wrap focus for deterministic keyboard tests.
  $$('dialog').forEach(layer=>layer.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const elements=[...layer.querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled&&el.getClientRects().length&&(el.type!=='radio'||el.checked||!layer.querySelector('input[name="'+el.name+'"]:checked')));const first=elements[0],last=elements.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}));
  ['repo-query','repo-owner','repo-visibility','repo-archived'].forEach(id=>$(id).addEventListener(id==='repo-query'?'input':'change',renderRepos));
  $('repo-options').addEventListener('change',event=>{if(event.target.name!=='repository')return;selected=event.target.value;if(!['pending','unknown','checking'].includes(phase)){phase='idle';message('');}updateFooter();});
  function resetFilters(){ $('repo-query').value='';$('repo-owner').value='all';$('repo-visibility').value='all';$('repo-archived').checked=false;renderRepos();$('repo-query').focus();}
  $('reset-repo-filters').addEventListener('click',resetFilters);
  $('retry-catalog').addEventListener('click',()=>{catalogFailed=false;$('scenario').value='success';renderRepos();$('repo-query').focus();});
  $('repo-scroll').addEventListener('scroll',()=>{$('repo-scroll').dataset.scrolled=String($('repo-scroll').scrollTop>3);});
  function paintBinding(text,tone){$('binding-label').textContent=bound?identity(bound):'Пока не подключён';$('binding-feedback').textContent=text;$('binding-feedback').dataset.tone=tone;$('open-repos').textContent=bound?'Изменить источник':'Подключить репозиторий';}
  function finishBinding(target){bound={...target};serverBinding={...target};phase='idle';message('');paintBinding('Источник подключён в демо. Права агента не изменились.','success');setLocked(false);updateFooter();if(dialog.open)closeRepos();}
  $('commit-repo').addEventListener('click',()=>{
    if($('commit-repo').disabled)return;
    if(phase==='unknown'){
      phase='checking';setLocked(true);updateFooter();message('Сверяем фактическую привязку. Повторная запись не отправляется.');
      setTimeout(()=>{if(serverBinding)finishBinding(serverBinding);else{phase='failed';setLocked(false);message('Привязки нет. Теперь можно повторить действие.','warning');updateFooter();}},650);return;
    }
    const target=repositories.find(r=>key(r)===selected);if(!target)return;
    const mode=phase==='failed'?'success':$('scenario').value;
    if(mode==='revoked'){
      revokedKey=selected;phase='idle';message('Доступ к выбранному источнику отозван. Выберите другой репозиторий; поиск сохранён.','danger');$('scenario').value='success';renderRepos();$('repo-query').focus();return;
    }
    const current=++operation;phase='pending';setLocked(true);updateFooter();message('Подключаем источник. Можно закрыть окно: операция продолжится в демо.');
    setTimeout(()=>{if(current!==operation)return;
      setLocked(false);
      if(mode==='write-error'){phase='failed';message('Не удалось сохранить привязку. Выбор сохранён. В демо повторная попытка завершится успешно.','danger');paintBinding('Не удалось подключить источник. Выбор сохранён в диалоге.','danger');updateFooter();return;}
      if(mode==='unknown'){serverBinding={...target};phase='unknown';setLocked(true);message('Ответ потерян. Подключение могло завершиться — сначала проверим состояние.','warning');paintBinding('Итог подключения неизвестен. Откройте диалог для проверки.','warning');updateFooter();return;}
      finishBinding(target);
    },650);
  });
  window.flowLab={snapshot:()=>({activeTab,selected,bound:bound?identity(bound):null,phase,operation,taskRemoved,chosenProject,reviews:JSON.parse(JSON.stringify(reviews))})};
})();
