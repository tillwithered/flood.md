<script lang="ts">
  import { ChevronRight } from "@lucide/svelte";
  import ConnectorLogo from "./ConnectorLogo.svelte";
  import FloodGlyph from "./FloodGlyph.svelte";
  import type { ConnectorLogoProvider, ConnectorTone } from "../integrations/registry";

  let {
    provider,
    title,
    description,
    status,
    detail,
    tone = "idle",
    actionLabel,
    onclick
  }: {
    provider: ConnectorLogoProvider;
    title: string;
    description: string;
    status: string;
    detail: string;
    tone?: ConnectorTone;
    actionLabel: string;
    onclick: () => void;
  } = $props();
</script>

<article class="connector-card" class:connected={tone === "connected"} class:attention={tone === "attention"} class:error={tone === "error"}>
  <div class="connector-icon" aria-hidden="true">
    <ConnectorLogo {provider} size={23} />
  </div>
  <div class="connector-copy">
    <span class="connector-title"><strong>{title}</strong><span class="connector-status"><FloodGlyph kind={tone === "error" ? "urgent" : tone === "attention" ? "important" : tone === "connected" ? "connected" : "info"} size={13} />{status}</span></span>
    <p>{description}</p>
    <small>{detail}</small>
  </div>
  <button type="button" onclick={onclick}>{actionLabel}<ChevronRight size={15} /></button>
</article>
