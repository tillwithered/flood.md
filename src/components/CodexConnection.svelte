<script lang="ts">
  import { currentLocale, translateCopy } from "../i18n";
  const tx = $derived((text: string) => translateCopy($currentLocale, text));
  import { invoke } from '@tauri-apps/api/core';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import { open as openFile } from '@tauri-apps/plugin-dialog';
  import { onMount, onDestroy } from 'svelte';
  import { Bot, Check } from '@lucide/svelte';
  import UiButton from './ui/Button.svelte';
  import InlineNotice from './ui/InlineNotice.svelte';
  type Status = { installed: boolean; authenticated: boolean; connected: boolean; signing_in: boolean; message?: string; manual_path?: string };
  let status = $state<Status | null>(null);
  let busy = $state(false), loading = $state(true), error = $state('');
  let connectedNow = $state(false);
  let polling: ReturnType<typeof setTimeout> | undefined;
  let disposed = false, signingInHere = false;
  let loginAttempt = 0;
  const native = '__TAURI_INTERNALS__' in window;
  let ready = $derived(Boolean(status?.authenticated && status?.connected));
  async function chooseExecutable(reset = false) {
    if (!native || busy || loading) return;
    error = '';
    try {
      const selected = reset ? null : await openFile({ title: tx('Выбрать файл Codex'), multiple: false, directory: false, filters: [{ name: 'Codex', extensions: ['exe'] }] });
      if (!reset && typeof selected !== 'string') return;
      busy = true;
      const result = await invoke<Status>('set_codex_executable', { path: selected });
      if (!disposed) status = result;
    } catch (cause) { if (!disposed) error = typeof cause === 'string' ? cause : 'Не удалось изменить путь Codex.'; }
    finally { if (!disposed) busy = false; }
  }
  async function refresh() {
    if (!native) { loading = false; return; }
    loading = true; error = '';
    try { const result = await invoke<Status>('codex_connection_status'); if (!disposed) status = result; }
    catch { if (!disposed) error = 'Не удалось проверить Codex. Повторите попытку.'; }
    finally { if (!disposed) loading = false; }
  }
  async function finishConnection() {
    const result = await invoke<Status>('connect_codex_integration');
    if (!disposed) { status = result; connectedNow = result.connected; }
  }
  async function pollLogin(attempt: number) {
    if (disposed || attempt !== loginAttempt) return;
    try {
      const result = await invoke<Status>('codex_connection_status');
      if (disposed || attempt !== loginAttempt) return;
      status = result;
      if (result.authenticated) { await finishConnection(); signingInHere = false; busy = false; }
      else if (result.signing_in) polling = setTimeout(() => pollLogin(attempt), 2500);
      else { signingInHere = false; busy = false; error = 'Вход не завершён. Попробуйте ещё раз.'; }
    } catch { if (!disposed && attempt === loginAttempt) { busy = false; error = 'Не удалось завершить подключение. Повторите проверку.'; } }
  }
  async function connect() {
    if (busy || !native) return;
    busy = true; error = '';
    const attempt = ++loginAttempt;
    try {
      if (status?.authenticated) { await finishConnection(); busy = false; }
      else {
        await invoke('begin_codex_login');
        if (disposed || attempt !== loginAttempt) { await invoke('cancel_codex_login'); return; }
        signingInHere = true; polling = setTimeout(() => pollLogin(attempt), 1500);
      }
    } catch { busy = false; error = 'Не удалось подключить Codex. Проверьте вход и повторите попытку.'; }
  }
  async function cancel() {
    loginAttempt++;
    if (polling) clearTimeout(polling);
    try { await invoke('cancel_codex_login'); signingInHere = false; busy = false; await refresh(); }
    catch { error = 'Не удалось отменить вход. Повторите попытку.'; }
  }
  onMount(refresh);
  onDestroy(() => { disposed = true; loginAttempt++; if (polling) clearTimeout(polling); if (signingInHere) void invoke('cancel_codex_login').catch(() => {}); });
</script>
<section class="codex-connection" aria-label={tx("Подключение Codex")}>
  <div class="connection-row">
    <Bot size={24}/><div class="connection-copy"><strong>ChatGPT / Codex</strong><span>{loading ? tx("Проверяем подключение…") : !native ? tx("Подключение доступно в приложении") : ready ? tx("Подключён") : !status?.installed ? tx("Codex не установлен") : status.authenticated ? tx("Готов к подключению") : tx("Войдите через ChatGPT")}</span></div>
    {#if ready}<Check size={18} aria-label={tx("Подключён")}/>
    {:else if native && status && !status.installed}<UiButton size="sm" onclick={() => openUrl('https://chatgpt.com/codex')}>{tx("Установить Codex")}</UiButton>
    {:else}<UiButton size="sm" busy={busy} disabled={!native || loading || !status} onclick={connect}>{status?.authenticated ? tx("Подключить") : tx("Войти через ChatGPT")}</UiButton>{/if}
  </div>
  {#if !ready}<p>{tx("Подключение позволит Codex работать с проектами и задачами flood.md. Сообщения используют лимиты вашего аккаунта ChatGPT.")}</p>{/if}
  {#if connectedNow}<InlineNotice tone="success" announce>{tx("Подключено. Перезапустите Codex, чтобы он увидел подключение flood.md.")}</InlineNotice>{/if}
  {#if busy}<div class="connection-actions"><span role="status">{status?.authenticated ? tx("Подключаем flood.md…") : tx("Завершите вход в браузере")}</span><UiButton variant="quiet" size="sm" disabled={Boolean(status?.authenticated)} onclick={cancel}>{tx("Отмена")}</UiButton></div>{/if}
  {#if error || status?.message}<InlineNotice tone="danger" announce>{tx(error || status?.message || "")}</InlineNotice>{/if}
  <div class="connection-actions"><UiButton variant="quiet" size="sm" disabled={!native || busy || loading} onclick={() => chooseExecutable()}>{tx('Выбрать файл Codex')}</UiButton>{#if status?.manual_path}<UiButton variant="quiet" size="sm" disabled={busy || loading} onclick={() => chooseExecutable(true)}>{tx('Автоматический поиск')}</UiButton>{/if}<UiButton variant="quiet" size="sm" disabled={!native || busy} busy={loading} onclick={refresh}>{tx("Проверить подключение")}</UiButton></div>
  {#if status?.manual_path}<code class="executable-path" title={status.manual_path}>{status.manual_path}</code>{/if}
</section>
<style>
  .codex-connection { display:grid; gap:16px; }
  .connection-row { display:flex; align-items:center; gap:16px; }
  .connection-copy { display:grid; gap:5px; flex:1; }
  strong { font-size:15px; font-weight:500; }
  span,p { font-size:13px; color:var(--muted); line-height:1.5; }
  p { margin:0; }
  .connection-actions { display:flex; align-items:center; justify-content:flex-end; gap:12px; }
  .executable-path { color:var(--muted); font-size:12px; overflow-wrap:anywhere; }
</style>
