<script lang="ts">
  import brand from "../assets/flood-material/glyphs/brand.png";
  import completed from "../assets/flood-material/glyphs/completed.png";
  import connected from "../assets/flood-material/glyphs/connected.png";
  import important from "../assets/flood-material/glyphs/important.png";
  import info from "../assets/flood-material/glyphs/info.png";
  import normal from "../assets/flood-material/glyphs/normal.png";
  import urgent from "../assets/flood-material/glyphs/urgent.png";

  export type FloodGlyphKind = "brand" | "normal" | "important" | "urgent" | "completed" | "connected" | "info";
  export type FloodGlyphMotion = "none" | "breathe" | "pulse" | "pop";

  type Props = {
    kind: FloodGlyphKind;
    size?: number;
    motion?: FloodGlyphMotion;
    label?: string;
  };

  let { kind, size = 14, motion = "none", label }: Props = $props();

  const sources: Record<FloodGlyphKind, string> = {
    brand,
    normal,
    important,
    urgent,
    completed,
    connected,
    info
  };
</script>

<span
  class="flood-glyph"
  class:motion-breathe={motion === "breathe"}
  class:motion-pulse={motion === "pulse"}
  class:motion-pop={motion === "pop"}
  style:width={`${size}px`}
  style:height={`${size}px`}
>
  <img src={sources[kind]} alt={label ?? ""} aria-hidden={label ? undefined : "true"} draggable="false" />
</span>

<style>
  .flood-glyph {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    line-height: 0;
    transform-origin: center;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  .motion-breathe { animation: flood-breathe 2.4s ease-in-out infinite; }
  .motion-pulse { animation: flood-pulse 700ms ease-out 1; }
  .motion-pop { animation: flood-pop 420ms cubic-bezier(.2, .85, .25, 1.25) 1; }

  @keyframes flood-breathe {
    0%, 100% { opacity: .82; transform: scale(.94); }
    50% { opacity: 1; transform: scale(1.04); }
  }

  @keyframes flood-pulse {
    0% { opacity: .62; transform: scale(.72); }
    45% { opacity: 1; transform: scale(1.16); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes flood-pop {
    0% { opacity: 0; transform: scale(.55) rotate(-8deg); }
    100% { opacity: 1; transform: scale(1) rotate(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .motion-breathe,
    .motion-pulse,
    .motion-pop { animation: none; }
  }
</style>
