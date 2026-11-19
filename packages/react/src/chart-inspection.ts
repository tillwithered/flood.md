import { useEffect, useRef } from "react";

export interface ChartInspection {
  id: string;
  label: string;
  values: readonly { label: string; value: number | null; formattedValue: string }[];
}

export function useChartInspection(entry: ChartInspection | null, onInspect?: (entry: ChartInspection | null) => void) {
  const last = useRef("");
  const signature = onInspect && entry ? JSON.stringify(entry) : "";
  useEffect(() => {
    if (signature === last.current) return;
    last.current = signature;
    onInspect?.(entry);
  }, [signature, entry, onInspect]);
}
