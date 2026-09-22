<script lang="ts">
  import { Check, FileText, FolderOpen, MoreHorizontal, Plus, RotateCcw, Settings, ShieldCheck, X } from "@lucide/svelte";
  import FloodGlyph from "./FloodGlyph.svelte";
  import { ButtonGroup, EmptyState, InlineNotice, MaterialRow, NoticeAction, PageHeader, SectionNav, SegmentedControl, SelectField, TaskRow, TextArea, TextField, ToggleButton, UiButton, UiIconButton, UiSwitch } from "./ui";

  type GallerySection = "foundations" | "controls" | "patterns" | "states";
  let activeSection = $state<GallerySection>("foundations");
  let feedback = $state("");
  let projectName = $state("flood.md");
  let projectNote = $state("Локальный human–agent workspace для задач и контекста проекта.");
  let notificationsEnabled = $state(true);
  let compactMode = $state(false);
  let editorMode = $state("edit");
  let taskProject = $state("flood");
  let selectedTask = $state("context");
  let completed = $state(false);
  let conflictCompleted = $state(false);
  let waiting = $state(false);
  let showError = $state(true);

  const navigation = [
    { id: "foundations", label: "Основы" },
    { id: "controls", label: "Контролы" },
    { id: "patterns", label: "Паттерны" },
    { id: "states", label: "Состояния" }
  ] as const;
  const typeRoles = [
    ["Project", "Название проекта", "type-project", "28 / 34 · 600"],
    ["Page", "Заголовок страницы", "type-page", "24 / 32 · 600"],
    ["Section", "Самостоятельный раздел", "type-section", "20 / 26 · 600"],
    ["Lead", "Название задачи в рабочем списке", "type-lead", "16 / 24 · 500"],
    ["Body", "Основной текст интерфейса и документов", "type-body", "14 / 20 · 400"],
    ["Compact", "Вторичная подпись", "type-compact", "13 / 18 · 400"],
    ["Caption", "Метаданные и подсказки", "type-caption", "12 / 16 · 400"]
  ];
  function demonstrate(message: string) { feedback = message; }
</script>

<main class="kit" aria-label="UI kit flood.md">
  <div class="kit-frame">
    <PageHeader title="UI kit" description="Quiet Workbench · runtime components · tokens 1.2">
      {#snippet mark()}<FloodGlyph kind="brand" size={32} />{/snippet}
      {#snippet actions()}<a class="kit-back" href="./">Открыть приложение</a>{/snippet}
    </PageHeader>
    <SectionNav label="Разделы UI kit" items={navigation} activeId={activeSection} onselect={(id) => { activeSection = id as GallerySection; feedback = ""; }} />

    {#if feedback}
      <InlineNotice announce>{feedback}{#snippet actions()}<NoticeAction tone="info" onclick={() => { feedback = ""; }}>Закрыть</NoticeAction>{/snippet}</InlineNotice>
    {/if}

    {#if activeSection === "foundations"}
      <div class="kit-stack">
        <section class="kit-section" aria-labelledby="type-heading">
          <header class="kit-section-head"><p>Foundation 01</p><h2 id="type-heading">Типографика</h2></header>
          <div class="type-specimen">
            {#each typeRoles as item}
              <div class="type-row"><span>{item[0]}</span><span class={item[2]}>{item[1]}</span><code>{item[3]}</code></div>
            {/each}
          </div>
        </section>

        <section class="kit-section" aria-labelledby="material-heading">
          <header class="kit-section-head"><p>Foundation 02</p><h2 id="material-heading">Материал и цвет</h2></header>
          <div class="two-columns">
            <div class="neutral-scale" aria-label="Нейтральные поверхности"><span class="neutral-background">Background</span><span class="neutral-surface">Surface</span><span class="neutral-selected">Selected</span><span class="neutral-ink">Ink</span></div>
            <div class="status-scale" aria-label="Семантические статусы"><span class="status-success"><Check size={14} />Готово</span><span class="status-attention">Важно</span><span class="status-danger">Ошибка</span><span class="status-brand"><FloodGlyph kind="brand" size={22} />Идентичность</span></div>
          </div>
        </section>

        <section class="kit-section" aria-labelledby="geometry-heading">
          <header class="kit-section-head"><p>Foundation 03</p><h2 id="geometry-heading">Пространство и геометрия</h2></header>
          <div class="two-columns">
            <div class="space-map"><span><i class="w8"></i><strong>Control</strong><small>4–8</small></span><span><i class="w16"></i><strong>Construct</strong><small>12–16</small></span><span><i class="w24"></i><strong>Cluster</strong><small>24</small></span><span><i class="w32"></i><strong>Section</strong><small>32</small></span><span><i class="w48"></i><strong>Region</strong><small>48</small></span></div>
            <div class="radius-recipe"><div><span>Внешний радиус 16</span><div><span>Inset 6</span><strong>Внутренний радиус 10</strong></div></div><code>C = max(0, A − B)</code></div>
          </div>
        </section>
      </div>
    {:else if activeSection === "controls"}
      <div class="kit-stack">
        <section class="kit-section" aria-labelledby="buttons-heading">
          <header class="kit-section-head"><p>C03</p><h2 id="buttons-heading">Действия</h2></header>
          <div class="control-stack">
            <div class="control-line"><UiButton variant="primary" onclick={() => demonstrate("Основное действие выполнено только в примере.")}><Plus size={16} />Добавить задачу</UiButton><UiButton onclick={() => demonstrate("Открыт контекст проекта.")}>Контекст проекта</UiButton><UiButton variant="quiet">Отмена</UiButton><UiIconButton label="Настройки примера"><Settings size={18} /></UiIconButton></div>
            <div class="control-line"><UiButton size="sm">Компактная</UiButton><UiButton disabled>Недоступно</UiButton><UiButton busy>Сохранить</UiButton><UiButton variant="danger">Удалить</UiButton></div>
            <div class="two-columns compound"><div><span>Связанные действия</span><ButtonGroup attached label="Режим списка"><ToggleButton bind:pressed={compactMode}>Компактно</ToggleButton><UiIconButton label="Другие действия"><MoreHorizontal size={18} /></UiIconButton></ButtonGroup></div><div><span>Режим редактора</span><SegmentedControl label="Режим редактора" bind:value={editorMode} options={[{ value: "edit", label: "Редактор" }, { value: "preview", label: "Предпросмотр" }]} /></div></div>
          </div>
        </section>

        <section class="kit-section" aria-labelledby="fields-heading">
          <header class="kit-section-head"><p>C05 · C07</p><h2 id="fields-heading">Ввод и настройки</h2></header>
          <div class="form-grid"><TextField label="Название проекта" bind:value={projectName} /><SelectField label="Проект задачи" bind:value={taskProject} options={[{ value: "flood", label: "flood.md" }, { value: "tenebra", label: "tenebra app" }, { value: "zakup", label: "zakup.io" }]} /><TextField label="Папка проекта" value="C:\\Projects\\flood.md" error="Папка недоступна. Выберите другую." /></div>
          <TextArea label="Описание" bind:value={projectNote} optional />
          <div class="setting-group"><UiSwitch label="Уведомления" description="Только когда требуется ваше действие." bind:checked={notificationsEnabled} /><UiSwitch label="Фоновая автоматизация" description="Экспериментально. Может расходовать токены." disabled /></div>
        </section>
      </div>
    {:else if activeSection === "patterns"}
      <div class="kit-stack">
        <section class="kit-section" aria-labelledby="project-heading">
          <header class="kit-section-head"><p>R03 · Project overview</p><h2 id="project-heading">Рабочий список</h2></header>
          <div class="pattern-surface">
            <PageHeader title="flood.md" count={11} countLabel="11 открытых задач" level={3}>{#snippet actions()}<UiButton variant="quiet">Контекст проекта</UiButton><UiButton variant="primary"><Plus size={16} />Новая задача</UiButton>{/snippet}</PageHeader>
            <div class="task-list" aria-label="Открытые задачи">
              <TaskRow title="Подключить проектные правила к Codex и Claude" urgency="important" selected={selectedTask === "context"} completed={completed} oncomplete={(value) => { completed = value; }} onopen={() => { selectedTask = "context"; }} />
              <TaskRow title="Проверить сохранность черновика при внешнем изменении Markdown" urgency="urgent" selected={selectedTask === "conflict"} completed={conflictCompleted} oncomplete={(value) => { conflictCompleted = value; }} onopen={() => { selectedTask = "conflict"; }} />
              <TaskRow title="Согласовать тексты пустых состояний" onopen={() => { selectedTask = "copy"; }} oncomplete={() => demonstrate("Завершение будет применено после подтверждения хранилища.")} />
              <TaskRow title="Подготовить локальную Windows-сборку" showMeta meta="Источник: решение проекта" urgency="important" onopen={() => { selectedTask = "build"; }} oncomplete={() => demonstrate("Запрошено завершение задачи.")} />
            </div>
          </div>
        </section>

        <section class="kit-section" aria-labelledby="context-heading">
          <header class="kit-section-head"><p>R06 · Project context</p><h2 id="context-heading">Материалы проекта</h2></header>
          <div class="material-list"><MaterialRow title="Направление продукта" description="Цель, границы и устройство flood.md." meta="Версия 4 · Доступно агенту" onclick={() => demonstrate("Открыт документ проекта.")}>{#snippet icon()}<FileText size={18} />{/snippet}</MaterialRow><MaterialRow title="Правила интерфейса" description="Quiet Workbench, типографика, геометрия и состояния." meta="Версия 2 · Доступно агенту" onclick={() => demonstrate("Открыто правило проекта.")}>{#snippet icon()}<ShieldCheck size={18} />{/snippet}</MaterialRow><MaterialRow title="Skills" description="Повторяемые процедуры для агента." count={6} countLabel="6 skills" onclick={() => demonstrate("Открыт список skills.")}>{#snippet icon()}<FolderOpen size={18} />{/snippet}</MaterialRow></div>
        </section>
      </div>
    {:else}
      <div class="kit-stack">
        <section class="kit-section" aria-labelledby="feedback-heading">
          <header class="kit-section-head"><p>C21 · C22</p><h2 id="feedback-heading">Обратная связь и восстановление</h2></header>
          <div class="notice-stack"><InlineNotice title="Сохранено" tone="success">Изменения записаны в локальный файл.{#snippet actions()}<NoticeAction tone="success">Открыть файл</NoticeAction>{/snippet}</InlineNotice><InlineNotice title="Файл изменён вне приложения" tone="attention">Ваш текст остался в редакторе.{#snippet actions()}<NoticeAction tone="attention">Сравнить</NoticeAction><NoticeAction tone="attention">Продолжить</NoticeAction>{/snippet}</InlineNotice>{#if showError}<InlineNotice title="Не удалось сохранить" tone="danger">Проверьте доступ к папке и повторите.{#snippet actions()}<NoticeAction tone="danger" onclick={() => { showError = false; demonstrate("Повторная попытка выполнена в примере."); }}><RotateCcw size={16} />Повторить</NoticeAction>{/snippet}</InlineNotice>{:else}<UiButton onclick={() => { showError = true; }}>Показать ошибку</UiButton>{/if}</div>
        </section>

        <section class="kit-section" aria-labelledby="state-heading">
          <header class="kit-section-head"><p>Empty · Pending · Disabled</p><h2 id="state-heading">Границы состояния</h2></header>
          <div class="two-columns"><EmptyState title="Задач пока нет" description="Добавьте первую задачу.">{#snippet icon()}<FolderOpen size={28} />{/snippet}{#snippet actions()}<UiButton variant="primary">Добавить задачу</UiButton>{/snippet}</EmptyState><div class="state-actions"><UiButton busy={waiting} onclick={() => { waiting = true; }}>Сохранить</UiButton><UiButton variant="quiet" disabled={!waiting} onclick={() => { waiting = false; }}>Сбросить ожидание</UiButton><TaskRow title="Задача временно недоступна" disabled onopen={() => undefined} /></div></div>
        </section>

        <section class="kit-section" aria-labelledby="long-heading">
          <header class="kit-section-head"><p>Long content · 200%</p><h2 id="long-heading">Рост содержимого</h2></header>
          <div class="long-content"><PageHeader title="Подготовка локального приложения к самостоятельному запуску и восстановлению после ошибки" count={128} countLabel="128 задач" level={3}>{#snippet actions()}<UiButton>Материалы</UiButton>{/snippet}</PageHeader><TaskRow title="Проверить, что длинное название задачи остаётся читаемым после изменения ширины окна и увеличения текста" showMeta meta="Источник: обсуждение первого запуска и восстановления локальных данных" urgency="important" onopen={() => demonstrate("Длинная задача открыта.")} /><div class="control-line"><UiButton variant="primary">Сохранить</UiButton><UiIconButton label="Закрыть пример"><X size={18} /></UiIconButton></div></div>
        </section>
      </div>
    {/if}

    <footer class="kit-footer"><span>flood.md design contract 1.3</span><span>Development only · no persistence</span></footer>
  </div>
</main>

<style>
  .kit { block-size: 100dvh; min-inline-size: 0; overflow-y: auto; scrollbar-gutter: stable; background: var(--background); color: var(--ink); }
  .kit-frame { display: grid; gap: var(--space-section); inline-size: min(100%, calc(var(--content-project) + 2 * var(--page-gutter))); min-inline-size: 0; margin-inline: auto; padding: var(--space-section) var(--page-gutter) var(--space-region); }
  .kit-stack { display: grid; gap: var(--space-region); }
  .kit-section { display: grid; gap: var(--space-cluster); min-inline-size: 0; }
  .kit-section + .kit-section { padding-block-start: var(--space-section); border-block-start: var(--border-width) solid var(--soft-line); }
  .kit-section-head { display: grid; gap: var(--space-1); }
  .kit-section-head p { margin: 0; color: var(--muted); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .kit-section-head h2 { margin: 0; font-size: var(--type-section-size); line-height: var(--type-section-line); font-weight: var(--weight-strong); }
  .kit-back { display: inline-flex; min-block-size: var(--control-default); align-items: center; color: var(--ink); font-size: var(--type-body-size); line-height: var(--type-body-line); text-underline-offset: .2em; }
  .kit-back:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .type-specimen { display: grid; }
  .type-row { display: grid; min-width: 0; grid-template-columns: 88px minmax(0, 1fr) auto; align-items: baseline; gap: var(--space-construct); padding-block: var(--space-3); border-block-start: var(--border-width) solid var(--soft-line); }
  .type-row:first-child { border-block-start: 0; }
  .type-row > span:first-child, .compound > div > span { color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .type-row code { color: var(--faint); font: var(--type-caption-size)/var(--type-caption-line) var(--font-family-code); white-space: nowrap; }
  .type-project { font-size: var(--type-project-size); line-height: var(--type-project-line); font-weight: var(--weight-strong); }
  .type-page { font-size: var(--type-page-size); line-height: var(--type-page-line); font-weight: var(--weight-strong); }
  .type-section { font-size: var(--type-section-size); line-height: var(--type-section-line); font-weight: var(--weight-strong); }
  .type-lead { font-size: var(--type-lead-size); line-height: var(--type-lead-line); font-weight: var(--weight-medium); }
  .type-body { font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .type-compact { font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .type-caption { font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .two-columns, .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-cluster); }
  .neutral-scale { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); min-block-size: 132px; overflow: hidden; border: var(--border-width) solid var(--line); border-radius: var(--radius-panel); }
  .neutral-scale > span { display: flex; align-items: flex-end; padding: var(--space-3); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  .neutral-background { background: var(--background); }.neutral-surface { background: var(--surface); }.neutral-selected { background: var(--selected); }.neutral-ink { background: var(--ink); color: var(--on-ink); }
  .status-scale { display: grid; align-content: start; gap: var(--space-2); }
  .status-scale > span { display: flex; min-block-size: var(--control-default); align-items: center; gap: var(--space-2); padding-inline: var(--space-3); border-radius: var(--radius-control); font-size: var(--type-body-size); }
  .status-success { background: var(--success-surface); color: var(--success-ink); }.status-attention { background: var(--attention-surface); color: var(--attention-ink); }.status-danger { background: var(--danger-surface); color: var(--danger-ink); }.status-brand { background: var(--surface); }
  .space-map { display: grid; gap: var(--space-2); }
  .space-map > span { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); min-block-size: var(--control-default); }
  .space-map i { display: block; block-size: var(--space-2); border-radius: var(--radius-pill); background: var(--ink); }.space-map strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); }.space-map small { color: var(--muted); font-size: var(--type-compact-size); }.w8 { inline-size: var(--space-2); }.w16 { inline-size: var(--space-4); }.w24 { inline-size: var(--space-6); }.w32 { inline-size: var(--space-8); }.w48 { inline-size: var(--space-12); }
  .radius-recipe { display: grid; align-content: start; gap: var(--space-3); }.radius-recipe > div { padding: var(--panel-inset); border-radius: var(--radius-panel); background: var(--selected); }.radius-recipe > div > span { display: block; padding: var(--space-2); color: var(--muted); font-size: var(--type-caption-size); }.radius-recipe > div > div { display: grid; gap: var(--space-1); padding: var(--space-construct); border-radius: var(--panel-inner-radius); background: var(--background); }.radius-recipe > div > div span { color: var(--muted); font-size: var(--type-caption-size); }.radius-recipe > div > div strong { font-size: var(--type-body-size); font-weight: var(--weight-medium); }.radius-recipe code { color: var(--muted); font: var(--type-compact-size)/var(--type-compact-line) var(--font-family-code); }
  .control-stack, .notice-stack, .long-content { display: grid; gap: var(--space-construct); }.control-line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }.compound > div { display: grid; align-content: start; justify-items: start; gap: var(--space-2); }.setting-group { display: grid; gap: var(--space-1); padding: var(--space-2); border-radius: var(--radius-panel); background: var(--surface); }
  .pattern-surface { display: grid; gap: var(--space-section); }.task-list { display: grid; gap: var(--space-1); }.material-list { display: grid; gap: var(--space-2); max-inline-size: var(--content-reading); }.state-actions { display: grid; align-content: start; justify-items: start; gap: var(--space-3); min-inline-size: 0; }.state-actions :global(.ui-task-row) { inline-size: 100%; }
  .kit-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); padding-block-start: var(--space-construct); border-block-start: var(--border-width) solid var(--soft-line); color: var(--muted); font-size: var(--type-caption-size); line-height: var(--type-caption-line); }
  @media (max-width: 720px) { .two-columns, .form-grid { grid-template-columns: 1fr; }.type-row { grid-template-columns: 72px minmax(0, 1fr); }.type-row code { grid-column: 2; } }
  @media (max-width: 480px) { .type-row { grid-template-columns: 1fr; gap: var(--space-1); }.type-row code { grid-column: 1; }.neutral-scale { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
