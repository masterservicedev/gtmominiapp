"use client";

import { useEffect, useRef } from "react";

export function AutoRefresh({
  intervalMs,
  onTick,
  label = "Auto-refresh",
}: {
  intervalMs: number;
  onTick: () => void;
  label?: string;
}) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    const id = window.setInterval(() => onTickRef.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <p className="text-xs text-zinc-500">
      {label} every {Math.round(intervalMs / 1000)}s
    </p>
  );
}
