<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import { LockKeyhole, Megaphone, Send, UserRound, UsersRound } from "@lucide/svelte";

  let {
    title,
    kind = "unknown",
    meta,
    avatarDataUrl,
    avatarFileId
  }: {
    title: string;
    kind?: string;
    meta: string;
    avatarDataUrl?: string;
    avatarFileId?: number;
  } = $props();

  let root: HTMLSpanElement;
  let avatarUrl = $state<string | undefined>();
  let imageFailed = $state(false);

  $effect(() => {
    if (!avatarUrl && avatarDataUrl) avatarUrl = avatarDataUrl;
  });

  onMount(() => {
    if (!avatarFileId || !("__TAURI_INTERNALS__" in window)) return;
    let disposed = false;
    const load = async () => {
      observer?.disconnect();
      try {
        const highResolutionUrl = await invoke<string | null>("telegram_chat_avatar", { fileId: avatarFileId });
        if (!disposed && highResolutionUrl) {
          avatarUrl = highResolutionUrl;
          imageFailed = false;
        }
      } catch {
        // The minithumbnail remains a usable fallback if the full avatar is unavailable.
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load();
    }, { rootMargin: "80px" });
    observer.observe(root);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  });
</script>

<span class="telegram-chat-identity" bind:this={root}>
  <span class="telegram-chat-avatar" aria-hidden="true">
    {#if avatarUrl && !imageFailed}
      <img src={avatarUrl} alt="" onerror={() => (imageFailed = true)} />
    {:else if kind === "private"}<UserRound size={17} />
    {:else if kind === "secret"}<LockKeyhole size={16} />
    {:else if kind === "channel"}<Megaphone size={16} />
    {:else if kind === "direct"}<Send size={16} />
    {:else if kind === "group"}<UsersRound size={17} />
    {:else}<Send size={16} />{/if}
  </span>
  <span class="telegram-chat-copy">
    <strong title={title}>{title}</strong>
    <small title={meta}>{meta}</small>
  </span>
</span>

<style>
  .telegram-chat-identity {
    display: grid;
    min-width: 0;
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }
  .telegram-chat-avatar {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    overflow: hidden;
    border-radius: 10px;
    background: var(--surface);
    color: var(--muted);
  }
  .telegram-chat-avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .telegram-chat-copy {
    display: grid;
    min-width: 0;
    gap: 2px;
  }
  .telegram-chat-copy strong,
  .telegram-chat-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .telegram-chat-copy strong {
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
  }
  .telegram-chat-copy small {
    color: var(--faint);
    font-size: var(--font-size-min);
  }
</style>
