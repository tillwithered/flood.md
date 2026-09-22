<script lang="ts">
  import { Check, ChevronRight, Ellipsis, FileText, Folder, Home, ListPlus, Plus, Search, Settings } from "@lucide/svelte";
  import { tick } from "svelte";
  import { AppShell, SelectField, TaskRow, TextArea, TextField, UiButton, UiIconButton, UiModal } from "./ui";

  type CreateKind = "task" | "project";
  type CreateStep = "choose" | "details" | "location";

  let collapsed = $state(false);
  let createOpen = $state(false);
  let createKind = $state<CreateKind | null>(null);
  let createStep = $state<CreateStep>("choose");
  let taskProject = $state("flood.md");
  let taskTitle = $state("");
  let taskDescription = $state("");
  let projectTitle = $state("");
  let projectDescription = $state("");
  let projectFolder = $state("");
  let createContent: HTMLDivElement;
  let selectedTask = $state<string | null>(null);
  let selectedProject = $state<string | null>(null);
  let openProjectMenu = $state<string | null>(null);

  const projects = [
    { id: "flood", title: "flood.md" },
    { id: "tenebra", title: "tenebra app" },
    { id: "zakup", title: "zakup.io" }
  ];
  const projectOptions = projects.map((project) => ({ value: project.title, label: project.title }));

  let tasks = $state([
    { id: "f1", project: "flood", title: "Собрать Главную страницу", urgency: "urgent" as const, meta: "Сегодня", completed: false },
    { id: "f2", project: "flood", title: "Унифицировать состояния навигации", urgency: "important" as const, meta: "Сегодня", completed: false },
    { id: "f3", project: "flood", title: "Проверить восстановление Markdown", urgency: "important" as const, meta: "18 сент.", completed: false },
    { id: "f4", project: "flood", title: "Собрать общий Artifact Modal", urgency: "normal" as const, meta: "17 сент.", completed: false },
    { id: "t1", project: "tenebra", title: "Подготовить первый запуск", urgency: "important" as const, meta: "Из Telegram · 18 сент.", completed: false },
    { id: "t2", project: "tenebra", title: "Согласовать страницу проекта", urgency: "normal" as const, meta: "16 сент.", completed: false },
    { id: "t3", project: "tenebra", title: "Проверить светлую тему", urgency: "normal" as const, meta: "15 сент.", completed: false },
    { id: "z1", project: "zakup", title: "Обновить описание интеграции", urgency: "normal" as const, meta: "18 сент.", completed: false },
    { id: "z2", project: "zakup", title: "Проверить пустое состояние", urgency: "normal" as const, meta: "17 сент.", completed: false },
    { id: "done-1", project: "flood", title: "Собрать токены AppShell", urgency: "normal" as const, meta: "", completed: true },
    { id: "done-2", project: "tenebra", title: "Подключить локальный проект", urgency: "normal" as const, meta: "", completed: true }
  ]);

  let openCount = $derived(tasks.filter((task) => !task.completed).length);
  let completedCount = $derived(tasks.filter((task) => task.completed).length);

  let modalTitle = $derived(createStep === "choose" ? "Что создать?" : createKind === "task" ? "Новая задача" : "Новый проект");
  let modalSubtitle = $derived(createStep === "choose" ? "Начните с рабочего объекта." : createStep === "details" ? "Шаг 1 из 2" : "Шаг 2 из 2");

  function openCreate() {
    createKind = null;
    createStep = "choose";
    createOpen = true;
  }

  async function focusFirstField() {
    await tick();
    createContent?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
  }

  function selectKind(kind: CreateKind) {
    createKind = kind;
    createStep = "details";
    void focusFirstField();
  }

  function goBack() {
    if (createStep === "location") createStep = "details";
    else { createKind = null; createStep = "choose"; }
    void focusFirstField();
  }

  function goNext() { createStep = "location"; void focusFirstField(); }
  function finishPreview() { createOpen = false; }

  function setCompleted(id: string, completed: boolean) {
    tasks = tasks.map((task) => task.id === id ? { ...task, completed } : task);
  }

  const urgencyOrder = { urgent: 0, important: 1, normal: 2 } as const;
  const urgencyLabels = { urgent: "Срочная", important: "Важная", normal: "Обычная" } as const;
  function projectTasks(projectId: string) {
    return tasks
      .filter((task) => task.project === projectId && !task.completed)
      .sort((left, right) => urgencyOrder[left.urgency] - urgencyOrder[right.urgency]);
  }

  function chooseProjectAction(projectId: string) {
    selectedProject = projectId;
    openProjectMenu = null;
  }

  type TrackScrollState = { target: number; frame: number | null };
  const taskTrackScrollStates = new WeakMap<HTMLElement, TrackScrollState>();

  function animateTaskTrack(track: HTMLElement, state: TrackScrollState) {
    const distance = state.target - track.scrollLeft;
    if (Math.abs(distance) < 0.5) {
      track.scrollLeft = state.target;
      state.frame = null;
      return;
    }

    track.scrollLeft += distance * 0.38;
    state.frame = requestAnimationFrame(() => animateTaskTrack(track, state));
  }

  function scrollTaskTrack(event: WheelEvent) {
    const track = event.currentTarget;
    if (!(track instanceof HTMLElement)) return;

    let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 32;
    else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= track.clientWidth;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const state = taskTrackScrollStates.get(track) ?? { target: track.scrollLeft, frame: null };
    if (state.frame === null) state.target = track.scrollLeft;
    const canScroll = delta < 0 ? state.target > 0 : state.target < maxScroll - 1;
    if (!delta || !canScroll) return;

    event.preventDefault();
    state.target = Math.min(maxScroll, Math.max(0, state.target + delta));
    taskTrackScrollStates.set(track, state);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      track.scrollLeft = state.target;
      state.frame = null;
    } else if (state.frame === null) {
      state.frame = requestAnimationFrame(() => animateTaskTrack(track, state));
    }
  }
</script>

<AppShell bind:collapsed title="flood.md">
  {#snippet sidebar()}
    <div class="shell-nav-head">
      <button class="shell-search" type="button" aria-label="Поиск"><Search size={16} /><span>Поиск</span><kbd>Ctrl K</kbd></button>
    </div>

    <nav class="shell-nav" aria-label="Основная навигация">
      <div class="shell-home">
        <button class="shell-row is-current" type="button" aria-label="Главная" aria-current="page"><Home size={17} /><span>Главная</span></button>
        <UiIconButton class="shell-add" label="Создать" variant="secondary" onclick={openCreate}><Plus size={16} /></UiIconButton>
      </div>

      <section class="shell-projects" aria-labelledby="shell-projects-title">
        {#if !collapsed}<h2 id="shell-projects-title">Проекты</h2>{/if}
        <div class="shell-project-list">
          <button class="shell-row" type="button" aria-label="Проект flood.md"><Folder size={17} /><span>flood.md</span></button>
          <button class="shell-row" type="button" aria-label="Проект tenebra app"><Folder size={17} /><span>tenebra app</span></button>
          <button class="shell-row" type="button" aria-label="Проект zakup.io"><Folder size={17} /><span>zakup.io</span></button>
        </div>
      </section>
    </nav>

    <div class="shell-nav-footer"><button class="shell-row" type="button" aria-label="Настройки"><Settings size={17} /><span>Настройки</span></button></div>
  {/snippet}
  <main class="home-page" aria-labelledby="home-title">
    <header class="home-header">
      <div>
        <h1 id="home-title">Главная</h1>
        <p>{openCount} открытых задач · {projects.length} проекта</p>
      </div>
    </header>

    <section class="project-shelves" aria-label="Проекты и открытые задачи">
      {#each projects as project}
        {@const openTasks = projectTasks(project.id)}
        <article class="project-shelf">
          <header class="project-shelf-header">
            <button class="project-title" type="button" onclick={() => selectedProject = project.id}>
              <span>{project.title}</span><small>{openTasks.length}</small><ChevronRight size={16} aria-hidden="true" />
            </button>
            <div class="project-actions">
              <UiIconButton label={`Действия проекта ${project.title}`} aria-expanded={openProjectMenu === project.id} aria-controls={`project-menu-${project.id}`} onclick={() => openProjectMenu = openProjectMenu === project.id ? null : project.id}><Ellipsis size={18} /></UiIconButton>
              {#if openProjectMenu === project.id}
                <div class="project-menu" id={`project-menu-${project.id}`}>
                  <button type="button" onclick={() => chooseProjectAction(project.id)}>Открыть</button>
                  <button type="button" onclick={() => chooseProjectAction(project.id)}>Контекст</button>
                </div>
              {/if}
            </div>
          </header>

          <div class="task-track" role="list" aria-label={`Открытые задачи проекта ${project.title}`} onwheel={scrollTaskTrack}>
            {#each openTasks as task (task.id)}
              <article class="task-card" role="listitem">
                <button class="task-card-open" type="button" onclick={() => selectedTask = task.id}>
                  {#if task.urgency !== "normal"}<span class="task-urgency" data-urgency={task.urgency}>{urgencyLabels[task.urgency]}</span>{/if}
                  <strong>{task.title}</strong>
                </button>
                <footer class="task-card-footer">
                  {#if task.meta}<span>{task.meta}</span>{:else}<span aria-hidden="true"></span>{/if}
                  <label class="task-card-complete">
                    <input type="checkbox" aria-label={`Завершить задачу: ${task.title}`} onchange={() => setCompleted(task.id, true)} />
                    <span aria-hidden="true" data-shape="circle"><Check size={13} /></span>
                  </label>
                </footer>
              </article>
            {:else}
              <p class="project-empty">Открытых задач нет</p>
            {/each}
          </div>
        </article>
      {/each}
    </section>

    <details class="completed-tasks">
      <summary><ChevronRight size={16} aria-hidden="true" /><span>Выполненные</span><span>{completedCount}</span></summary>
      <div class="task-list completed-list">
        {#each tasks.filter((task) => task.completed) as task (task.id)}
          <TaskRow title={task.title} completed selected={selectedTask === task.id} onopen={() => selectedTask = task.id} oncomplete={(completed) => setCompleted(task.id, completed)} />
        {/each}
      </div>
    </details>
  </main>
</AppShell>

<UiModal bind:open={createOpen} title={modalTitle} subtitle={modalSubtitle}>
  <div class="create-content" bind:this={createContent}>
  {#if createStep === "choose"}
    <div class="create-options">
      <article class="create-option">
        <span class="create-option-icon" aria-hidden="true"><ListPlus size={20} /></span>
        <div><h3>Новая задача</h3><p>Добавить работу в существующий проект.</p></div>
        <UiButton size="sm" onclick={() => selectKind("task")}>Выбрать</UiButton>
      </article>
      <article class="create-option">
        <span class="create-option-icon" aria-hidden="true"><Folder size={20} /></span>
        <div><h3>Новый проект</h3><p>Создать отдельное рабочее пространство.</p></div>
        <UiButton size="sm" onclick={() => selectKind("project")}>Выбрать</UiButton>
      </article>
    </div>
  {:else if createKind === "task" && createStep === "details"}
    <div class="create-form">
      <SelectField label="Проект" options={projectOptions} bind:value={taskProject} />
      <TextField label="Название" bind:value={taskTitle} placeholder="Что нужно сделать?" />
    </div>
  {:else if createKind === "task"}
    <div class="create-form"><TextArea label="Описание" bind:value={taskDescription} optional placeholder="Контекст, результат или ограничения" /></div>
  {:else if createKind === "project" && createStep === "details"}
    <div class="create-form">
      <TextField label="Название" bind:value={projectTitle} placeholder="Название проекта" />
      <TextArea label="Описание" bind:value={projectDescription} optional placeholder="Зачем нужен проект" />
    </div>
  {:else}
    <div class="create-form">
      <TextField label="Папка проекта" bind:value={projectFolder} placeholder="C:\\Projects\\project" />
      <p class="create-hint"><FileText size={16} /> Markdown останется источником правды.</p>
    </div>
  {/if}
  </div>

  {#snippet footer()}
    {#if createStep !== "choose"}
      <UiButton variant="quiet" onclick={goBack}>Назад</UiButton>
      {#if createStep === "details"}<UiButton variant="primary" onclick={goNext}>Далее</UiButton>{:else}<UiButton variant="primary" onclick={finishPreview}>Создать</UiButton>{/if}
    {/if}
  {/snippet}
</UiModal>

<style>
  .shell-nav-head { display: grid; padding: var(--space-3) var(--space-2) var(--space-6); }
  .shell-search, .shell-row { display: grid; inline-size: 100%; min-block-size: var(--control-default); align-items: center; gap: var(--space-2); padding-inline: 10px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); text-align: start; cursor: pointer; }
  .shell-search { grid-template-columns: 18px minmax(0, 1fr) auto; }
  .shell-search kbd { color: var(--faint); font: var(--type-caption-size)/var(--type-caption-line) var(--font-family-ui); }
  .shell-row { grid-template-columns: 20px minmax(0, 1fr); }
  .shell-search:hover, .shell-row:hover { background: var(--hover); color: var(--ink); }
  .shell-search:focus-visible, .shell-row:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(var(--focus-width) * -1); }
  .shell-row.is-current { background: var(--selected); color: var(--ink); font-weight: var(--weight-medium); }
  .shell-nav { display: grid; min-block-size: 0; align-content: start; gap: var(--space-6); padding-inline: var(--space-2); overflow-y: auto; }
  .shell-home { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-1); align-items: center; }
  .shell-projects { display: grid; gap: var(--space-2); min-inline-size: 0; }
  .shell-projects h2 { margin: 0; padding-inline: 10px; color: var(--faint); font-size: var(--type-caption-size); font-weight: var(--weight-regular); line-height: var(--type-caption-line); }
  .shell-project-list { display: grid; gap: var(--space-1); }
  .shell-nav-footer { margin-block-start: auto; padding: var(--space-2); }
  .home-page { inline-size: min(100%, 1040px); margin-inline: auto; padding: var(--space-region) clamp(var(--space-6), 5vw, var(--space-region)) var(--space-16); }
  .home-header { display: flex; min-inline-size: 0; align-items: flex-start; justify-content: space-between; gap: var(--space-cluster); margin-block-end: var(--space-section); }
  .home-header h1 { margin: 0; color: var(--ink); font-size: var(--type-page-size); font-weight: var(--weight-strong); line-height: var(--type-page-line); }
  .home-header p { margin: var(--space-1) 0 0; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .project-shelves { display: grid; gap: var(--space-cluster); }
  .project-shelf { position: relative; min-inline-size: 0; padding: var(--space-2); border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-panel); background: var(--surface); }
  .project-shelf-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-1) var(--space-1) var(--space-3) var(--space-2); }
  .project-title { display: inline-flex; min-inline-size: 0; align-items: center; justify-self: start; gap: var(--space-2); min-block-size: var(--control-default); padding-inline: var(--space-2); border: 0; border-radius: var(--radius-control); background: transparent; color: var(--ink); font: inherit; font-size: var(--type-lead-size); font-weight: var(--weight-medium); line-height: var(--type-lead-line); text-align: start; cursor: pointer; }
  .project-title > span { min-inline-size: 0; overflow-wrap: anywhere; }
  .project-title small { color: var(--faint); font-size: var(--type-compact-size); font-weight: var(--weight-regular); line-height: var(--type-compact-line); font-variant-numeric: tabular-nums; }
  .project-title:hover { background: var(--hover); }
  .project-title:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .project-actions { position: relative; }
  .project-menu { position: absolute; z-index: var(--layer-popover); top: calc(100% + var(--space-1)); right: 0; display: grid; inline-size: 148px; padding: var(--space-1); border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-action-row); background: var(--elevated); box-shadow: var(--elevation-overlay); }
  .project-menu button { min-block-size: var(--control-compact); padding-inline: var(--space-2); border: 0; border-radius: calc(var(--radius-action-row) - var(--space-1)); background: transparent; color: var(--ink); font: inherit; font-size: var(--type-body-size); text-align: start; cursor: pointer; }
  .project-menu button:hover { background: var(--hover); }
  .project-menu button:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(var(--focus-width) * -1); }
  .task-track { display: grid; grid-auto-columns: minmax(276px, 308px); grid-auto-flow: column; gap: var(--space-3); min-inline-size: 0; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: none; -ms-overflow-style: none; }
  .task-track::-webkit-scrollbar { display: none; inline-size: 0; block-size: 0; }
  .task-card { display: grid; min-inline-size: 0; min-block-size: 136px; grid-template-rows: minmax(0, 1fr) auto; overflow: hidden; border-radius: calc(var(--radius-panel) - var(--space-2)); background: var(--background); }
  .task-card-open { display: grid; align-content: start; gap: var(--space-3); min-inline-size: 0; padding: var(--space-4) var(--space-4) var(--space-3); border: 0; border-radius: inherit; background: transparent; color: var(--ink); font: inherit; text-align: start; cursor: pointer; }
  .task-card-open:hover { background: var(--hover); }
  .task-card-open:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: calc(var(--focus-width) * -1); }
  .task-card-open strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); overflow-wrap: anywhere; }
  .task-urgency { inline-size: fit-content; color: var(--muted); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .task-urgency[data-urgency="important"] { color: var(--attention-ink); }
  .task-urgency[data-urgency="urgent"] { color: var(--danger-ink); }
  .task-card-footer { display: flex; min-inline-size: 0; align-items: center; justify-content: space-between; gap: var(--space-3); padding: 0 var(--space-3) var(--space-3) var(--space-4); color: var(--faint); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .task-card-complete { position: relative; display: grid; inline-size: var(--control-compact); block-size: var(--control-compact); flex: 0 0 auto; place-items: center; border-radius: var(--radius-control); cursor: pointer; }
  .task-card-complete input { position: absolute; inline-size: 100%; block-size: 100%; margin: 0; opacity: 0; cursor: inherit; }
  .task-card-complete > span { display: grid; inline-size: 18px; block-size: 18px; place-items: center; border: var(--border-width) solid var(--line-strong); border-radius: var(--radius-pill); color: transparent; }
  .task-card-complete:hover { background: var(--hover); }
  .task-card-complete input:focus-visible + span { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .project-empty { grid-column: 1; margin: 0; padding: var(--space-4); color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .task-list { display: grid; gap: var(--space-1); }
  .completed-tasks { margin-block-start: var(--space-section); }
  .completed-tasks summary { display: flex; align-items: center; gap: var(--space-2); min-block-size: var(--control-default); padding-inline: var(--space-2); border-radius: var(--radius-control); color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); cursor: pointer; list-style: none; }
  .completed-tasks summary::-webkit-details-marker { display: none; }
  .completed-tasks summary:hover { background: var(--hover); color: var(--ink); }
  .completed-tasks summary:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .completed-tasks summary > span:last-child { color: var(--faint); font-size: var(--type-compact-size); font-variant-numeric: tabular-nums; }
  .completed-tasks[open] summary :global(svg) { transform: rotate(90deg); }
  .completed-list { margin-block-start: var(--space-1); }

  .create-content, .create-options { display: grid; gap: var(--space-3); }
  .create-option { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-4); border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-action-row); background: var(--surface); }
  .create-option-icon { display: grid; inline-size: 36px; block-size: 36px; place-items: center; border-radius: var(--radius-control); background: var(--background); color: var(--muted); }
  .create-option h3 { margin: 0; font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); }
  .create-option p { margin: var(--space-1) 0 0; color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .create-form { display: grid; gap: var(--space-4); }
  .create-hint { display: flex; align-items: center; gap: var(--space-2); margin: 0; color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }

  :global(.is-collapsed) .shell-nav-head { padding-inline: var(--space-2); }
  :global(.is-collapsed) .shell-search, :global(.is-collapsed) .shell-row { grid-template-columns: 1fr; justify-items: center; padding-inline: 0; }
  :global(.is-collapsed) .shell-search span, :global(.is-collapsed) .shell-search kbd, :global(.is-collapsed) .shell-row span { display: none; }
  :global(.is-collapsed) .shell-home { grid-template-columns: 1fr; }
  @media (max-width: 980px) {
    .home-page { padding-inline: var(--space-6); }
  }
  @media (max-width: 640px) {
    .home-page { padding: var(--space-section) var(--space-4) var(--space-region); }
  }
  @media (max-width: 640px) { .create-option { grid-template-columns: auto minmax(0, 1fr); } .create-option :global(.ui-button) { grid-column: 1 / -1; } }
</style>
