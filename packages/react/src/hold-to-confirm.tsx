import {useEffect, useId, useRef, useState} from "react";
import type {CSSProperties, PointerEvent, Ref} from "react";
import {AlertDialog, Button, Stack, Text} from "./index.js";
import type {HoldToConfirmProps} from "./index.js";

interface HoldPress {
  pointerId: number;
  start: number;
  duration: number;
}

function containsPointer(event: PointerEvent<HTMLButtonElement>) {
  const {left, right, top, bottom} = event.currentTarget.getBoundingClientRect();
  return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
}

export function HoldConfirmation({label, hint, holdMs, tone, size, dialogRef, ...dialog}: HoldToConfirmProps & {
  holdMs: number;
  dialogRef: Ref<HTMLDialogElement>;
}) {
  const hintId = useId();
  const press = useRef<HoldPress | null>(null);
  const suppressClick = useRef(false);
  const [holding, setHolding] = useState<number | null>(null);
  const duration = Number.isFinite(holdMs) ? Math.min(Math.max(holdMs, 500), 10000) : 900;

  function stopPress(suppress: boolean) {
    if (!press.current) return;
    press.current = null;
    suppressClick.current = suppress;
    setHolding(null);
  }

  useEffect(() => {
    if (holding === null) return;
    const cancel = () => stopPress(true);
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, [holding]);

  useEffect(() => {
    if (dialog.disabled) stopPress(true);
  }, [dialog.disabled]);

  return <AlertDialog {...dialog} ref={dialogRef} trigger={trigger => <Stack gap="2" className="flood-hold-to-confirm">
    <Button {...trigger} size={size} tone={tone} variant="outline"
      className="flood-hold-to-confirm__trigger" aria-describedby={hint ? hintId : undefined}
      data-holding={holding !== null ? "" : undefined}
      style={{"--flood-hold-duration": `${holding ?? duration}ms`} as CSSProperties}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || dialog.disabled) return;
        suppressClick.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        press.current = {pointerId:event.pointerId, start:performance.now(), duration};
        setHolding(duration);
      }}
      onPointerMove={event => {
        if (press.current?.pointerId === event.pointerId && !containsPointer(event)) stopPress(true);
      }}
      onPointerUp={event => {
        const current = press.current;
        if (current?.pointerId !== event.pointerId) return;
        const inside = containsPointer(event) && !dialog.disabled;
        const confirmed = inside && performance.now() - current.start >= current.duration;
        stopPress(confirmed || !inside);
        if (confirmed) dialog.onConfirm();
      }}
      onPointerCancel={event => {
        if (press.current?.pointerId === event.pointerId) stopPress(true);
      }}
      onLostPointerCapture={event => {
        if (press.current?.pointerId === event.pointerId) stopPress(true);
      }}
      onBlur={() => stopPress(true)}
      onContextMenu={event => {
        if (press.current) event.preventDefault();
      }}
      onKeyDown={event => {
        if (event.key !== "Escape" || !press.current) return;
        event.preventDefault();
        event.stopPropagation();
        stopPress(true);
      }}
      onClick={event => {
        const suppressed = (suppressClick.current || press.current !== null) && event.detail > 0;
        suppressClick.current = false;
        if (suppressed) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        stopPress(false);
        trigger.onClick?.(event);
      }}>
      <span aria-hidden="true" className="flood-hold-to-confirm__progress" />
      <span className="flood-hold-to-confirm__label">{label}</span>
    </Button>
    {hint && <Text id={hintId} size="helper">{hint}</Text>}
  </Stack>} />;
}
