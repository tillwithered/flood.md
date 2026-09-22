<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "@lucide/svelte";
  import ConnectorLogo from "./ConnectorLogo.svelte";
  import { UiIconButton } from "./ui";
  import type { ConnectorLogoProvider } from "../integrations/registry";

  let {
    provider,
    title,
    subtitle,
    closeLabel,
    onclose,
    onkeydown,
    children
  }: {
    provider: ConnectorLogoProvider;
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
      <UiIconButton label={closeLabel} onclick={onclose}><X size={16} /></UiIconButton>
    </header>
    <div class="integration-modal-body">{@render children()}</div>
  </div>
</div>
