<script lang="ts">
  import { currentLocale, translateCopy } from "../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import { invoke } from '@tauri-apps/api/core';
  import { untrack } from 'svelte';
  import { Check, RefreshCw } from '@lucide/svelte';
  import TextField from './ui/TextField.svelte';
  import UiButton from './ui/Button.svelte';
  import InlineNotice from './ui/InlineNotice.svelte';
  type Conversation = { id: string; title: string; updated_at: number };
  type Page = { conversations: Conversation[]; next_cursor?: string };
  let { projects, initialProjectId = '', showTitle = true, active = true, onsaved }: { projects: { id: string; title: string }[]; initialProjectId?: string; showTitle?: boolean; active?: boolean; onsaved?: () => void } = $props();
  let conversations = $state<Conversation[]>([]);
  let nextCursor = $state<string>();
  let selected = $state(''), search = $state(''), error = $state(''), loading = $state(false), locked = $state(false);
  let generation = 0;
  const key = (id: string) => `flood.codex.dock.${id}`;
  let projectId = $derived(initialProjectId || projects[0]?.id || '');
  async function load(append = false) {
    const current = ++generation;
    loading = true; error = '';
    if (!('__TAURI_INTERNALS__' in window)) { loading = false; error = 'Список разговоров доступен в установленном приложении.'; return; }
    try {
      const page = await invoke<Page>('list_codex_conversations', { cursor: append ? nextCursor : null });
      if (current !== generation) return;
      conversations = append ? [...conversations, ...page.conversations.filter(c => !conversations.some(existing => existing.id === c.id))] : page.conversations;
      nextCursor = page.next_cursor;
    } catch { if (current === generation) error = 'Не удалось загрузить разговоры. Проверьте подключение Codex.'; }
    finally { if (current === generation) loading = false; }
  }
  $effect(() => {
    const id = projectId;
    if (!active || !id) { generation++; return; }
    untrack(() => {
      search = ''; conversations = []; nextCursor = undefined;
      try { const state = JSON.parse(localStorage.getItem(key(id)) || '{}'); selected = state.threadId || ''; locked = ['submitting','unknown'].includes(state.delivery); }
      catch { selected = ''; locked = true; error = 'Не удалось прочитать связь проекта.'; return; }
      void load();
    });
    return () => { generation++; };
  });
  function choose(chat: Conversation) {
    if (locked || !projectId) return;
    try {
      const state = JSON.parse(localStorage.getItem(key(projectId)) || '{}');
      if (['submitting','unknown'].includes(state.delivery)) { locked = true; error = 'Сначала проверьте доставку последнего сообщения.'; return; }
      localStorage.setItem(key(projectId), JSON.stringify({ ...state, threadId:chat.id, threadTitle:chat.title, delivery:'', receipt:'' }));
      selected = chat.id; onsaved?.();
    } catch { error = 'Не удалось сохранить выбор. Повторите попытку.'; }
  }
</script>
<section class="conversation-picker" aria-label={tx("Разговор Codex")}>
  {#if showTitle}<h4>{tx("Разговор проекта")}</h4>{/if}
  <p>{tx("Выберите разговор один раз — следующие сообщения проекта попадут туда же.")}</p>
  <TextField label={tx("Найти разговор")} bind:value={search} placeholder={tx("Название разговора")}/>
  {#if locked}<InlineNotice tone="attention">{tx("Сначала проверьте доставку последнего сообщения в доке.")}</InlineNotice>{/if}
  {#if error}<InlineNotice tone="danger" announce>{tx(error)}</InlineNotice>{/if}
  <div class="conversation-list" aria-busy={loading}>
    {#each conversations.filter(chat => chat.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())) as chat (chat.id)}
      <button type="button" disabled={locked} onclick={() => choose(chat)}><span>{chat.title}<small>{new Date(chat.updated_at * 1000).toLocaleDateString($currentLocale)}</small></span>{#if selected === chat.id}<Check size={16}/>{/if}</button>
    {:else}{#if !loading && !error}<p>{search ? tx("В загруженных разговорах ничего не найдено.") : tx("Создайте разговор в Codex и отправьте первое сообщение, затем обновите список.")}</p>{/if}{/each}
    {#if loading}<p role="status">{tx("Загружаем разговоры…")}</p>{/if}
  </div>
  <div class="actions">{#if nextCursor}<UiButton size="sm" disabled={loading} onclick={() => load(true)}>{tx("Показать ещё")}</UiButton>{/if}<UiButton variant="quiet" size="sm" busy={loading} onclick={() => load()}><RefreshCw size={14}/>{tx("Обновить")}</UiButton></div>
</section>
<style>
  .conversation-picker { display:grid; gap:16px; }
  h4,p { margin:0; }
  p { font-size:13px; line-height:1.5; color:var(--muted); }
  .conversation-list { max-height:320px; overflow-y:auto; display:grid; gap:4px; }
  .conversation-list button { display:flex; align-items:center; gap:12px; min-height:56px; padding:10px 12px; border:0; border-radius:8px; text-align:left; background:transparent; color:var(--ink); cursor:pointer; }
  .conversation-list button:hover:not(:disabled) { background:var(--hover); }
  .conversation-list button > span { display:grid; flex:1; gap:4px; font-size:14px; overflow-wrap:anywhere; }
  small { color:var(--muted); font-size:12px; }
  .actions { display:flex; justify-content:flex-end; gap:8px; }
</style>
