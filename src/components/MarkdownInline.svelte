<script lang="ts">
  type InlineToken = { kind: "text" | "strong" | "code" | "link"; text: string; href?: string };

  let { text = "" }: { text?: string } = $props();

  function tokenize(value: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
    let cursor = 0;
    for (const match of value.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > cursor) tokens.push({ kind: "text", text: value.slice(cursor, index) });
      const raw = match[0];
      if (raw.startsWith("`")) tokens.push({ kind: "code", text: raw.slice(1, -1) });
      else if (raw.startsWith("**")) tokens.push({ kind: "strong", text: raw.slice(2, -2) });
      else {
        const link = raw.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (link) tokens.push({ kind: "link", text: link[1], href: link[2] });
      }
      cursor = index + raw.length;
    }
    if (cursor < value.length) tokens.push({ kind: "text", text: value.slice(cursor) });
    return tokens.length ? tokens : [{ kind: "text", text: value }];
  }
</script>

{#each tokenize(text) as token}
  {#if token.kind === "strong"}<strong>{token.text}</strong>
  {:else if token.kind === "code"}<code>{token.text}</code>
  {:else if token.kind === "link"}<a href={token.href} target="_blank" rel="noreferrer">{token.text}</a>
  {:else}{token.text}{/if}
{/each}
