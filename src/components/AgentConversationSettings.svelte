<script lang="ts">
  import TextField from './ui/TextField.svelte';
  import SelectField from './ui/SelectField.svelte';
  import UiButton from './ui/Button.svelte';
  import { untrack } from 'svelte';

  let { projects, initialProjectId = '', showTitle = true, active = true, fixedProject = false, onsaved }: { projects: { id: string; title: string }[]; initialProjectId?: string; showTitle?: boolean; active?: boolean; fixedProject?: boolean; onsaved?: () => void } = $props();
  let projectId = $state(untrack(() => initialProjectId || projects[0]?.id || ''));
  let link = $state('');
  let error = $state('');
  let saved = $state(false);
  let locked = $state(false);
  let dirty = false;
  let loadedProjectId = '';
  const key = (id: string) => `flood.codex.dock.${id}`;
  $effect(() => { if (active && initialProjectId) projectId = initialProjectId; });
  $effect(() => {
    if (!projectId && projects.length) projectId = initialProjectId || projects[0].id;
  });
  $effect(() => {
    const id = projectId;
    if (!active || !id) return;
    try {
      const value = JSON.parse(localStorage.getItem(key(id)) || '{}');
      if (id !== loadedProjectId || !dirty) {
        link = value.threadId || '';
        dirty = false;
        error = ''; saved = false;
      }
      loadedProjectId = id;
      locked = ['submitting', 'unknown'].includes(value.delivery);
    } catch { error = 'Не удалось прочитать настройки разговора.'; }
  });
  function save(event: SubmitEvent) {
    event.preventDefault();
    const id = link.trim().match(/^(?:[a-z][a-z0-9+.-]*:\/\/[^\s]*\/)?([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})(?:[?#][^\s]*)?$/i)?.[1];
    if (!id) { error = 'Укажите ссылку на разговор или его ID.'; return; }
    try {
      const value = JSON.parse(localStorage.getItem(key(projectId)) || '{}');
      if (['submitting', 'unknown'].includes(value.delivery)) { error = 'Сначала проверьте доставку последнего сообщения в Dock.'; return; }
      localStorage.setItem(key(projectId), JSON.stringify({ ...value, threadId: id, threadTitle: projects.find(p => p.id === projectId)?.title || 'Разговор', delivery: '', receipt: '' }));
      error = ''; saved = true; dirty = false;
      onsaved?.();
    } catch { error = 'Не удалось сохранить настройки. Повторите попытку.'; }
  }
</script>

<form class="agent-conversation-settings" class:without-title={!showTitle} onsubmit={save}>
  {#if showTitle}<h4>Разговоры проектов</h4>{/if}
  {#if projects.length}
    {#if !fixedProject}<SelectField label="Проект" bind:value={projectId} options={projects.map(p => ({ value: p.id, label: p.title }))}/>{/if}
    <TextField label="Разговор Codex" bind:value={link} oninput={() => { dirty = true; saved = false; error = ''; }} placeholder="Ссылка или ID разговора" disabled={locked} error={error}/>
    {#if locked}<p role="status">Сначала проверьте доставку сообщения в Dock.</p>{/if}
    <div class="actions">{#if saved}<span role="status">Сохранено</span>{/if}<UiButton type="submit" size="sm" disabled={locked || !link.trim()}>Сохранить</UiButton></div>
  {:else}<p>Сначала создайте проект.</p>{/if}
</form>

<style>
  .agent-conversation-settings { display:grid; gap:16px; padding:20px 0; border-top:1px solid var(--soft-line); }
  .agent-conversation-settings.without-title { padding:0; border:0; }
  h4 { margin:0; font-size:14px; font-weight:500; }
  p,.actions span { margin:0; font-size:13px; color:var(--muted); }
  .actions { display:flex; justify-content:flex-end; align-items:center; gap:12px; }
</style>
