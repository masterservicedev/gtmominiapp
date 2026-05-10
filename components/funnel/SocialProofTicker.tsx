"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 4000;

type Props = {
  lines: string[];
};

export function SocialProofTicker({ lines }: Props) {
  const [i, setI] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (lines.length <= 1 || reduceMotion) return;
    const id = setInterval(() => {
      setI((n) => (n + 1) % lines.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [lines.length, reduceMotion]);

  if (!lines.length) return null;

  return (
    <div className="w-full border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-2">
      <p className="text-center text-[11px] text-zinc-400 leading-snug transition-opacity duration-300">
        {lines[i]}
      </p>
    </div>
  );
}
