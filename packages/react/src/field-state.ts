import type { AriaAttributes, ReactNode } from "react";
import type { FieldStatus } from "./index.js";

/** Existing invalid semantics always take precedence over a positive status. */
export function resolveFieldStatus(status?: FieldStatus, invalid?: boolean, ariaInvalid?: AriaAttributes["aria-invalid"]): FieldStatus | undefined {
  return invalid || (ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false") ? "error" : status;
}

export const hasFieldContent = (value: ReactNode) => value !== null && value !== undefined && value !== false && value !== true && value !== "";

export function mergeDescriptions(...values: Array<string | false | undefined>): string | undefined {
  return [...new Set(values.filter(Boolean).join(" ").split(/\s+/).filter(Boolean))].join(" ") || undefined;
}
