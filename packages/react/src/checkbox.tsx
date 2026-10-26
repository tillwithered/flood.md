import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type InputHTMLAttributes } from "react";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export const MixedCheckbox = /* @__PURE__ */ forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {indeterminate: boolean}>(function MixedCheckbox(
  {indeterminate, onChange, ...props}, ref,
) {
  const node = useRef<HTMLInputElement>(null), mixed = useRef(indeterminate);
  useImperativeHandle(ref, () => node.current!, []);
  useBrowserLayoutEffect(() => { mixed.current = indeterminate; if (node.current) node.current.indeterminate = indeterminate; });
  return <input {...props} ref={node} type="checkbox" className="flood-check" aria-checked={indeterminate ? "mixed" : props["aria-checked"]}
    onChange={event => { const control = event.currentTarget; try { onChange?.(event); } finally { control.indeterminate = mixed.current; } }} />;
});
