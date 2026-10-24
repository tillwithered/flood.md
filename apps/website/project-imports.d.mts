export type ImportMode = "package" | "project";
/** Returns deterministic imports for known component names; rejects unknown names. */
export function importStatements(names: string[], mode?: ImportMode): string;
/** Exact project adapter files plus stylesheet and alias setup, formatted as Markdown. */
export function projectAdapters(names: string[]): string;
