import {forwardRef, useRef, useState} from "react";
import type {AlertDialogProps} from "./index.js";
import {Button} from "./index.js";
import {ModalOverlay} from "./overlays.js";

export const ConfirmationDialog = forwardRef<HTMLDialogElement, AlertDialogProps>(function ConfirmationDialog({
  open: controlled, defaultOpen = false, onOpenChange, onConfirm, onCancel,
  confirmLabel = "Continue", cancelLabel = "Cancel", confirmDisabled = false,
  className, ...props
}, ref) {
  const [local, setLocal] = useState(defaultOpen);
  const cancel = useRef<HTMLButtonElement>(null);
  const request = (next: boolean) => {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  const dismiss = () => { onCancel?.(); request(false); };
  return <ModalOverlay {...props} ref={ref} role="alertdialog" open={controlled ?? local}
    onOpenChange={next => { if (next) request(true); else dismiss(); }}
    closeOnOutsideClick={false} showCloseButton={false} initialFocusRef={cancel}
    className={["flood-alert-dialog", className].filter(Boolean).join(" ")}>
    <div className="flood-alert-dialog__actions">
      <Button ref={cancel} type="button" variant="subtle" onClick={dismiss}>{cancelLabel}</Button>
      <Button type="button" disabled={confirmDisabled} onClick={() => {
        if (confirmDisabled) return;
        onConfirm();
        request(false);
      }}>{confirmLabel}</Button>
    </div>
  </ModalOverlay>;
});
