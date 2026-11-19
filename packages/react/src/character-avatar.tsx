import { forwardRef } from "react";
import { Avatar, type AvatarProps } from "./index.js";

export interface CharacterAvatarProps extends Omit<AvatarProps, "src" | "fallback" | "fallbackArtwork"> {
  /** An opaque, persistent seed. Equal seeds render the same original character. */
  seed: string;
}

// These are the pigments of the illustration, independent of interface roles.
const palettes = [
  { background: "#f9cfdf", body: "#eb7197", detail: "#852c55" },
  { background: "#ded6fb", body: "#ac90eb", detail: "#583a7c" },
  { background: "#c8ecdc", body: "#72c6a9", detail: "#245d52" },
  { background: "#ffe6b8", body: "#f4ae60", detail: "#894924" },
  { background: "#cee4f8", body: "#76b4ec", detail: "#2b517c" },
  { background: "#ffdad2", body: "#ef907e", detail: "#84382d" },
] as const;

// The same opaque input produces the same traits in a browser and in SSR.
function characterTraits(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return {
    palette: palettes[hash % palettes.length],
    head: (hash >>> 5) % 4,
    eyes: (hash >>> 10) % 3,
    mouth: (hash >>> 15) % 3,
    cheeks: Boolean(hash & (1 << 18)),
    turn: ((hash >>> 20) % 3 - 1) * 6,
  };
}

const silhouettes = [
  "M8 25C8 15 14 10 24 10s16 5 16 15-6 16-16 16S8 35 8 25Z",
  "M8 25C6 20 7 11 13 9c5-2 9 4 11 4s6-6 11-4c6 2 7 11 5 16 0 10-6 16-16 16S8 35 8 25Z",
  "M8 25c0-5 2-8 4-10 1-2 0-5 3-7 4-2 7 4 9 4s5-6 9-4c3 2 2 5 3 7 2 2 4 5 4 10 0 10-6 16-16 16S8 35 8 25Z",
  "M7 27c0-6 5-11 10-12 3-1 1-6 7-6s4 5 8 6c5 2 9 6 9 12 0 9-7 14-17 14S7 36 7 27Z",
] as const;

function CharacterDrawing({ seed }: { seed: string }) {
  const { palette, head, eyes, mouth, cheeks, turn } = characterTraits(seed);
  return <svg className="flood-character-avatar__drawing" width="48" height="48" viewBox="0 0 48 48" focusable="false">
    <path fill={palette.background} d="M0 0h48v48H0z" />
    <ellipse cx="24" cy="42" rx="13" ry="2.5" fill={palette.detail} opacity=".15" />
    <g transform={`rotate(${turn} 24 27)`}>
      <path d={silhouettes[head]} fill={palette.body} stroke={palette.detail} strokeWidth=".9" strokeLinejoin="round" />
      <path d="M13 21c1-3 4-5 6-5" fill="none" stroke={palette.background} strokeWidth="1.5" strokeLinecap="round" opacity=".78" />
      {eyes === 1
        ? <path d="M16 26c1.5-2 3.5-2 5 0m6 0c1.5-2 3.5-2 5 0" stroke={palette.detail} fill="none" strokeWidth="1.7" strokeLinecap="round" />
        : <g fill={palette.detail}>
          <ellipse cx="18.5" cy="25" rx={eyes === 2 ? 2 : 1.55} ry={eyes === 2 ? 2.4 : 1.55} />
          <ellipse cx="29.5" cy="25" rx="1.55" ry="1.65" />
        </g>}
      {cheeks && <path d="M14 30h3m14 0h3" fill="none" stroke={palette.detail} strokeOpacity=".44" strokeWidth="1.45" strokeLinecap="round" />}
      {mouth === 2
        ? <circle cx="24" cy="30.5" r="1.65" fill={palette.detail} />
        : <path d={mouth === 1 ? "M22.5 30.5h3" : "M21.5 30q2.5 3.4 5 0"} fill="none" stroke={palette.detail} strokeWidth="1.5" strokeLinecap="round" />}
    </g>
  </svg>;
}

/** An original avatar illustration generated from a host-owned seed. */
export const CharacterAvatar = /* @__PURE__ */ forwardRef<HTMLSpanElement, CharacterAvatarProps>(function CharacterAvatar(
  { seed, ...props }, ref,
) {
  return <Avatar {...props} ref={ref} fallbackArtwork={<CharacterDrawing seed={seed} />} />;
});
