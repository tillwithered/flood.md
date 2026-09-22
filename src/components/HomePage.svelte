<script lang="ts">
  import { Check, ChevronRight, Ellipsis, FolderPlus } from "@lucide/svelte";
  import { EmptyState, UiButton, UiIconButton } from "./ui";

  type Urgency = "normal" | "important" | "urgent";
  type HomeProject = { id: string; title: string };
  type HomeTask = {
    id: string;
    chatId: string;
    title: string;
    urgency: Urgency;
    meta: string;
    busy?: boolean;
  };

  type Props = {
    projects: HomeProject[];
    tasks: HomeTask[];
    completedCount?: number;
    onopenproject: (projectId: string) => void;
    onopencontext: (projectId: string) => void;
    onopentask: (taskId: string) => void;
    oncomplete: (taskId: string) => void;
    oncreateproject: () => void;
  };

  let {
    projects,
    tasks,
    completedCount = 0,
    onopenproject,
    onopencontext,
    onopentask,
    oncomplete,
    oncreateproject
  }: Props = $props();

  let openProjectMenu = $state<string | null>(null);
  const urgencyOrder: Record<Urgency, number> = { urgent: 0, important: 1, normal: 2 };
  const urgencyLabels: Record<Urgency, string> = { urgent: "Срочная", important: "Важная", normal: "Обычная" };

  function projectTasks(projectId: string) {
    return tasks
      .filter((task) => task.chatId === projectId)
      .sort((left, right) => urgencyOrder[left.urgency] - urgencyOrder[right.urgency]);
  }

  type TrackScrollState = { target: number; frame: number | null };
  const scrollStates = new WeakMap<HTMLElement, TrackScrollState>();

  function animateTrack(track: HTMLElement, state: TrackScrollState) {
    const distance = state.target - track.scrollLeft;
    if (Math.abs(distance) < 0.5) {
      track.scrollLeft = state.target;
      state.frame = null;
      return;
    }
    track.scrollLeft += distance * 0.24;
    state.frame = requestAnimationFrame(() => animateTrack(track, state));
  }

  function scrollTrack(event: WheelEvent) {
    const track = event.currentTarget;
    if (!(track instanceof HTMLElement)) return;
    let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 28;
    else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= track.clientWidth;

    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    const state = scrollStates.get(track) ?? { target: track.scrollLeft, frame: null };
    if (state.frame === null) state.target = track.scrollLeft;
    const canScroll = delta < 0 ? state.target > 0 : state.target < maximum - 1;
    if (!delta || !canScroll) return;

    event.preventDefault();
    state.target = Math.min(maximum, Math.max(0, state.target + delta));
    scrollStates.set(track, state);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      track.scrollLeft = state.target;
      state.frame = null;
    } else if (state.frame === null) {
      state.frame = requestAnimationFrame(() => animateTrack(track, state));
    }
  }
</script>

<div class="home-page">
  <header class="home-header">
    <div>
      <h1>Главная</h1>
      <p>{tasks.length} открытых задач · {projects.length} {projects.length === 1 ? "проект" : "проекта"}</p>
    </div>
  </header>

  {#if projects.length}
  <section class="project-shelves" aria-label="Проекты и открытые задачи">
    {#each projects as project (project.id)}
      {@const openTasks = projectTasks(project.id)}
      <article class="project-shelf">
        <header class="project-shelf-header">
          <button class="project-title" type="button" onclick={() => onopenproject(project.id)}>
            <span>{project.title}</span><small>{openTasks.length}</small><ChevronRight size={16} aria-hidden="true" />
          </button>
          <div class="project-actions">
            <UiIconButton label={`Действия проекта ${project.title}`} aria-expanded={openProjectMenu === project.id} aria-controls={`home-project-menu-${project.id}`} onclick={() => (openProjectMenu = openProjectMenu === project.id ? null : project.id)}><Ellipsis size={18} /></UiIconButton>
            {#if openProjectMenu === project.id}
              <div class="project-menu" id={`home-project-menu-${project.id}`}>
                <button type="button" onclick={() => { openProjectMenu = null; onopenproject(project.id); }}>Открыть</button>
                <button type="button" onclick={() => { openProjectMenu = null; onopencontext(project.id); }}>Контекст</button>
              </div>
            {/if}
          </div>
        </header>

        <div class="task-track" role="list" aria-label={`Открытые задачи проекта ${project.title}`} onwheel={scrollTrack}>
          {#each openTasks as task (task.id)}
            <article class="task-card" role="listitem">
              <button class="task-card-open" type="button" onclick={() => onopentask(task.id)}>
                {#if task.urgency !== "normal"}<span class="task-urgency" data-urgency={task.urgency}>{urgencyLabels[task.urgency]}</span>{/if}
                <strong>{task.title}</strong>
              </button>
              <footer class="task-card-footer">
                <span>{task.meta}</span>
                <label class="task-card-complete">
                  <input type="checkbox" disabled={task.busy} aria-label={`Завершить задачу: ${task.title}`} onchange={() => oncomplete(task.id)} />
                  <span aria-hidden="true"><Check size={13} /></span>
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
  {:else}
    <div class="home-empty">
      <EmptyState title="Создайте первый проект" description="Проект объединяет задачи, контекст и правила работы.">
        {#snippet icon()}<FolderPlus size={28} />{/snippet}
        {#snippet actions()}<UiButton onclick={oncreateproject}><FolderPlus size={16} />Создать проект</UiButton>{/snippet}
      </EmptyState>
    </div>
  {/if}

  {#if completedCount}
    <p class="completed-summary">Выполненные · {completedCount}</p>
  {/if}
</div>

<style>
  .home-page { width: min(1040px, calc(100% - (var(--page-gutter) * 2))); margin: 0 auto; padding: var(--space-region) 0 var(--space-16); }
  .home-header { display: flex; align-items: end; justify-content: space-between; gap: var(--space-6); }
  .home-header h1 { margin: 0; font-size: var(--type-page-size); font-weight: var(--weight-strong); line-height: var(--type-page-line); letter-spacing: -0.03em; }
  .home-header p { margin: var(--space-1) 0 0; color: var(--muted); font-size: var(--type-body-size); line-height: var(--type-body-line); }
  .project-shelves { display: grid; gap: var(--space-cluster); margin-block-start: var(--space-section); }
  .home-empty { margin-block-start: var(--space-section); }
  .project-shelf { min-inline-size: 0; padding: var(--space-2); border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-panel); background: color-mix(in srgb, var(--surface) 64%, transparent); }
  .project-shelf-header { display: flex; min-block-size: 42px; align-items: center; justify-content: space-between; gap: var(--space-3); padding-inline: var(--space-2) var(--space-1); }
  .project-title { display: inline-flex; min-inline-size: 0; align-items: center; gap: var(--space-2); padding: 0; border: 0; background: transparent; color: var(--ink); cursor: pointer; }
  .project-title span { overflow: hidden; font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); text-overflow: ellipsis; white-space: nowrap; }
  .project-title small { color: var(--faint); font-size: var(--type-compact-size); font-variant-numeric: tabular-nums; }
  .project-title :global(svg) { color: var(--faint); transition: transform var(--duration-fast) var(--ease-standard); }
  .project-title:hover :global(svg) { transform: translateX(2px); }
  .project-title:focus-visible { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); border-radius: var(--radius-control); }
  .project-actions { position: relative; }
  .project-menu { position: absolute; z-index: var(--layer-popover); top: calc(100% + var(--space-1)); right: 0; display: grid; inline-size: 150px; padding: var(--space-1); border: var(--border-width) solid var(--soft-line); border-radius: var(--radius-control); background: var(--elevated); box-shadow: var(--elevation-overlay); transform-origin: top right; animation: home-menu-in var(--duration-normal) var(--ease-standard); }
  .project-menu button { min-block-size: 34px; padding-inline: var(--space-2); border: 0; border-radius: calc(var(--radius-control) - var(--space-1)); background: transparent; color: var(--ink); text-align: left; cursor: pointer; }
  .project-menu button:hover { background: var(--hover); }
  .task-track { display: grid; grid-auto-columns: minmax(268px, 31%); grid-auto-flow: column; gap: var(--space-2); min-inline-size: 0; padding: var(--space-1); overflow-x: auto; overflow-y: hidden; overscroll-behavior-inline: contain; scrollbar-width: none; }
  .task-track::-webkit-scrollbar { display: none; }
  .task-card { display: grid; min-block-size: 128px; grid-template-rows: minmax(0, 1fr) auto; overflow: hidden; border-radius: var(--radius-action-row); background: var(--background); transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
  .task-card-open { display: grid; align-content: start; gap: var(--space-2); min-inline-size: 0; padding: var(--space-4) var(--space-4) var(--space-2); border: 0; background: transparent; color: var(--ink); text-align: left; cursor: pointer; }
  .task-card:hover { background: var(--hover); transform: translateY(-1px); }
  .task-card:active { transform: scale(.995); }
  .task-card-open:focus-visible { outline: 0; }
  .task-card-open strong { display: -webkit-box; overflow: hidden; font-size: var(--type-body-size); font-weight: var(--weight-medium); line-height: var(--type-body-line); -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; }
  .task-urgency { font-size: var(--type-compact-size); font-weight: var(--weight-medium); line-height: var(--type-compact-line); }
  .task-urgency[data-urgency="urgent"] { color: var(--danger-ink); }
  .task-urgency[data-urgency="important"] { color: var(--attention-ink); }
  .task-card-footer { display: flex; min-block-size: 42px; align-items: center; justify-content: space-between; gap: var(--space-2); padding: 0 var(--space-3) var(--space-2) var(--space-4); color: var(--muted); font-size: var(--type-compact-size); line-height: var(--type-compact-line); }
  .task-card-complete { display: grid; inline-size: 32px; block-size: 32px; flex: 0 0 auto; place-items: center; border-radius: var(--radius-control); cursor: pointer; }
  .task-card-complete input { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; }
  .task-card-complete > span { display: grid; inline-size: 18px; block-size: 18px; place-items: center; border: var(--border-width) solid var(--line-strong); border-radius: var(--radius-pill); color: transparent; }
  .task-card-complete:hover { background: var(--hover); }
  .task-card-complete input:focus-visible + span { outline: var(--focus-width) solid var(--focus-ring); outline-offset: var(--focus-offset); }
  .project-empty { margin: 0; padding: var(--space-4); color: var(--muted); font-size: var(--type-body-size); }
  .completed-summary { margin: var(--space-section) var(--space-2) 0; color: var(--faint); font-size: var(--type-compact-size); }
  @media (max-width: 900px) { .task-track { grid-auto-columns: minmax(260px, 46%); } }
  @media (max-width: 640px) { .home-page { width: calc(100% - 32px); } .task-track { grid-auto-columns: minmax(248px, 82%); } }
  @keyframes home-menu-in { from { opacity: 0; transform: translateY(calc(var(--space-1) * -1)) scale(.985); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .project-title :global(svg), .task-card { transition: none; } .project-menu { animation: none; } .task-card:hover, .task-card:active { transform: none; } }
  :global(:root[data-motion="reduced"]) .project-title :global(svg),
  :global(:root[data-motion="reduced"]) .task-card { transition: none; }
  :global(:root[data-motion="reduced"]) .project-menu { animation: none; }
  :global(:root[data-motion="reduced"]) .task-card:hover,
  :global(:root[data-motion="reduced"]) .task-card:active { transform: none; }
</style>
