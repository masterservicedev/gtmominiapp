"use client";

import { useEffect } from "react";

/**
 * One-shot confetti for HIGH segment (pre-approved) result. Respects reduced motion.
 */
export function PreApprovedConfetti() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const clearAll = () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.length = 0;
    };

    timeouts.push(
      setTimeout(() => {
        void import("canvas-confetti").then(({ default: confetti }) => {
          if (cancelled) return;

          const emerald = ["#34d399", "#10b981", "#6ee7b7"];
          const gold = ["#fbbf24", "#f59e0b", "#fcd34d"];
          const mix = [...emerald, ...gold, "#f8fafc"];

          confetti({
            particleCount: 110,
            spread: 72,
            origin: { y: 0.42 },
            ticks: 240,
            gravity: 0.92,
            scalar: 1.05,
            colors: mix,
          });

          timeouts.push(
            setTimeout(() => {
              if (cancelled) return;
              confetti({
                particleCount: 55,
                spread: 95,
                origin: { x: 0.12, y: 0.62 },
                angle: 55,
                colors: emerald,
              });
              confetti({
                particleCount: 55,
                spread: 95,
                origin: { x: 0.88, y: 0.62 },
                angle: 125,
                colors: gold,
              });
            }, 180),
          );
        });
      }, 280),
    );

    return clearAll;
  }, []);

  return null;
}
