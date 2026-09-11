<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "@lucide/svelte";
  import ConnectorLogo from "./ConnectorLogo.svelte";

  let {
    provider,
    title,
    subtitle,
    closeLabel,
    onclose,
    onkeydown,
    children
  }: {
    provider: "telegram" | "github" | "mcp";
    title: string;
    subtitle: string;
    closeLabel: string;
    onclose: () => void;
    onkeydown?: (event: KeyboardEvent) => void;
    children: Snippet;
  } = $props();
</script>

<div class="integration-modal-backdrop" role="presentation">
  <div class="integration-modal" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" onkeydown={onkeydown}>
    <header>
      <span class="integration-modal-icon" aria-hidden="true"><ConnectorLogo {provider} size={22} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <button class="icon-button" type="button" aria-label={closeLabel} title={closeLabel} onclick={onclose}><X size={16} /></button>
    </header>
    <div class="integration-modal-body">{@render children()}</div>
  </div>
</div>
