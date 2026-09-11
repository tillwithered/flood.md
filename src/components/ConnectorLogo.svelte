<script lang="ts">
  import githubLogo from "../assets/connector-logos/github.svg";
  import mcpLogo from "../assets/connector-logos/mcp.svg";
  import telegramLogo from "../assets/connector-logos/telegram.svg";

  let {
    provider,
    size = 22
  }: {
    provider: "telegram" | "github" | "mcp";
    size?: number;
  } = $props();

  const sources = { telegram: telegramLogo, github: githubLogo, mcp: mcpLogo } as const;
</script>

<img class="connector-logo {provider}" src={sources[provider]} width={size} height={size} alt="" />
