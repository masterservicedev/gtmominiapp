"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FunnelTheme } from "@/lib/funnel/types";
import { getThemeClasses } from "@/lib/funnel/theme";

type Props = {
  src: string;
  poster?: string;
  minWatchSeconds: number;
  theme?: FunnelTheme;
  onThresholdMet?: (seconds: number) => void;
  onUnlockReady?: (ready: boolean) => void;
};

export function VideoOffer({
  src,
  poster,
  minWatchSeconds,
  theme = "emerald",
  onThresholdMet,
  onUnlockReady,
}: Props) {
  const t = getThemeClasses(theme);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [played, setPlayed] = useState(0);
  const [unlocked, setUnlocked] = useState(
    !src || minWatchSeconds <= 0,
  );
  const firedRef = useRef(false);

  const checkUnlock = useCallback(
    (sec: number) => {
      if (!src || minWatchSeconds <= 0) return;
      if (unlocked || sec < minWatchSeconds) return;
      setUnlocked(true);
      if (!firedRef.current && onThresholdMet) {
        firedRef.current = true;
        onThresholdMet(sec);
      }
    },
    [minWatchSeconds, onThresholdMet, unlocked, src],
  );

  useEffect(() => {
    if (!src) return;
    const el = videoRef.current;
    if (!el) return;
    let cancelled = false;
    const isHls = /\.m3u8($|\?)/i.test(src);

    const onTime = () => {
      const c = el.currentTime;
      setPlayed(c);
      checkUnlock(c);
    };

    el.addEventListener("timeupdate", onTime);
    el.pause();
    el.removeAttribute("src");
    el.load();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      const canPlayNativeHls = el.canPlayType("application/vnd.apple.mpegurl") !== "";

      if (canPlayNativeHls) {
        el.src = src;
      } else {
        void import("hls.js").then(({ default: Hls }) => {
          if (cancelled || !videoRef.current) return;
          const media = videoRef.current;
          if (Hls.isSupported()) {
            const hls = new Hls({
              // Workers often break in in-app browsers (Telegram, etc.) and can tab-crash.
              enableWorker: false,
              lowLatencyMode: false,
              maxBufferLength: 45,
              backBufferLength: 30,
            });
            hls.loadSource(src);
            hls.attachMedia(media);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) void media.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (!data.fatal || cancelled) return;
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            });
            hlsRef.current = hls;
          } else {
            // Fallback: some browsers can still play m3u8 without MSE.
            media.src = src;
          }
        });
      }
    }

    el.muted = true;
    el.playsInline = true;
    void el.play().catch(() => {});

    return () => {
      cancelled = true;
      el.removeEventListener("timeupdate", onTime);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, checkUnlock]);

  useEffect(() => {
    onUnlockReady?.(unlocked);
  }, [unlocked, onUnlockReady]);

  const progress =
    src && minWatchSeconds > 0
      ? Math.min(100, (played / minWatchSeconds) * 100)
      : 100;

  if (!src) {
    return (
      <div className="aspect-video w-full rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-4">
        <p className="text-xs text-zinc-500 text-center">
          Set <code className="text-zinc-400">NEXT_PUBLIC_GTMO_CODE_VIDEO_URL</code>{" "}
          (or <code className="text-zinc-400">NEXT_PUBLIC_FUNNEL_VIDEO_URL</code>)
          {" "}to your MP4 or HLS URL.
        </p>
      </div>
    );
  }

  const isHls = /\.m3u8($|\?)/i.test(src);

  return (
    <div className="w-full space-y-2">
      <div className="relative rounded-lg overflow-hidden bg-black border border-zinc-800">
        <video
          ref={videoRef}
          className="w-full aspect-video object-contain bg-black"
          poster={poster}
          controls
          playsInline
          muted
          preload="metadata"
        >
          {!isHls ? <source src={src} type="video/mp4" /> : null}
        </video>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${t.accentBg} transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {!unlocked && minWatchSeconds > 0 ? (
        <p className="text-[11px] text-zinc-500">
          {`Watch at least ${minWatchSeconds}s to continue (${Math.floor(played)}s)`}
        </p>
      ) : null}
    </div>
  );
}
