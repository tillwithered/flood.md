import type { ReactNode } from "react";
import { VisuallyHidden } from "./index.js";

interface SourceLineProps {
  text: string;
  label?: string;
  marker?: string;
  action?: ReactNode;
  wrap?: boolean;
}

/** Selectable source text used by the diff and stack context renderers. */
export function SourceLine({ text, label, marker, action, wrap }: SourceLineProps) {
  return <div className="flood-source-line" data-marker={marker !== undefined || undefined} data-wrap={wrap || undefined}>
    {marker !== undefined && <span className="flood-source-line__marker" aria-hidden="true">{marker}</span>}
    {label && <VisuallyHidden>{label}</VisuallyHidden>}
    <code dir="ltr" className="flood-source-line__text">{text}</code>
    {action != null && <div className="flood-source-line__action">{action}</div>}
  </div>;
}
