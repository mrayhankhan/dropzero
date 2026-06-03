"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 → value with an ease-out curve whenever `value`
 * changes. Purposeful motion: it makes the Consistency Console's metrics feel
 * alive when a stampede runs, without any decorative noise.
 */
export function CountUp({
  value,
  durationMs = 650,
  format,
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const to = value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(to * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  const n = Math.round(display);
  return <>{format ? format(n) : n.toLocaleString()}</>;
}
