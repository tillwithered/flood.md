import { useState } from "react";
import { Image } from "./index.js";

/** Keyed by src in Avatar so each source starts with its own load lifecycle. */
export function AvatarArtwork({ src, fallback }: { src?: string; fallback: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return <>
    <span className="flood-avatar__fallback" aria-hidden="true">{fallback}</span>
    {src && state !== "error" && <Image src={src} alt="" aria-hidden="true" decoding="async"
      className="flood-avatar__image" data-ready={state === "ready"}
      onLoad={() => setState("ready")} onError={() => setState("error")} />}
  </>;
}
