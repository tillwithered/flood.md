/** Keep the same literal matching semantics for search and its visible emphasis. */
export function literalMatchPattern(query: string, flags: string): RegExp {
  return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
}
