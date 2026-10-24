import type { AriaAttributes } from "react";
import type { FieldStatus } from "./index.js";

/** Existing invalid semantics always take precedence over a positive status. */
export function resolveFieldStatus(status?: FieldStatus, invalid?: boolean, ariaInvalid?: AriaAttributes["aria-invalid"]): FieldStatus | undefined {
  return invalid || (ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false") ? "error" : status;
}
