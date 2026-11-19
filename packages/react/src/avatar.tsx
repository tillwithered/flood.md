import { useState, type ReactNode } from "react";
import { Image } from "./index.js";

/** Keyed by src in Avatar so each source starts with its own load lifecycle. */
export function AvatarArtwork({ src, fallback, fallbackArtwork }: { src?: string; fallback: string; fallbackArtwork?: ReactNode }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return <>
    {fallbackArtwork == null
      ? <span className="flood-avatar__fallback" aria-hidden="true">{fallback}</span>
      : <span className="flood-avatar__artwork" aria-hidden="true">{fallbackArtwork}</span>}
    {src && state !== "error" && <Image src={src} alt="" aria-hidden="true" decoding="async"
      className="flood-avatar__image" data-ready={state === "ready"}
      onLoad={() => setState("ready")} onError={() => setState("error")} />}
  </>;
}
