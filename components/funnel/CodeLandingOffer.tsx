"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { VideoOffer } from "@/components/funnel/VideoOffer";
import type { AdVariant } from "@/lib/funnel/normalize";
import type { CodeLandingOfferBlock } from "@/lib/funnel/types";
import type { FunnelTheme } from "@/lib/funnel/types";
import { trackFunnelEvent } from "@/lib/funnel/track";

const MEDIA_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE || "").replace(/\/$/, "")
    : "";

function mediaUrl(file: string) {
  if (!MEDIA_BASE) return null;
  return `${MEDIA_BASE}/${file.replace(/^\//, "")}`;
}

function fillProject(s: string, projectName: string) {
  return s.replace(/\{projectName\}/g, projectName);
}

function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-bold">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const FOMO_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Canada",
  "Australia",
];
const FOMO_TIMES = ["2 min", "5 min", "8 min", "12 min", "15 min"];

type Props = {
  offer: CodeLandingOfferBlock;
  variant: AdVariant;
  theme: FunnelTheme;
  progressCurrent: number;
  progressTotal: number;
};

export function CodeLandingOffer({
  offer,
  variant,
  theme,
  progressCurrent,
  progressTotal,
}: Props) {
  const router = useRouter();
  const { projectName } = offer;
  const accentRing = theme === "amber" ? "ring-amber-500/40" : "ring-emerald-500/40";
  const accentBg = theme === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const accentHover =
    theme === "amber" ? "hover:bg-amber-400" : "hover:bg-emerald-400";
  const accentText = theme === "amber" ? "text-amber-600" : "text-emerald-600";

  const [fomoCountry, setFomoCountry] = useState("United States");
  const [fomoTime, setFomoTime] = useState("2 min");
  const [spots, setSpots] = useState(7);
  const [showActivity, setShowActivity] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const [activityPulse, setActivityPulse] = useState(false);
  const [spotsShake, setSpotsShake] = useState(false);
  const [ctaBusy, setCtaBusy] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowActivity(true), 2000);
    const t2 = setTimeout(() => setShowSpots(true), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const tickActivity = () => {
      setFomoCountry(FOMO_COUNTRIES[Math.floor(Math.random() * FOMO_COUNTRIES.length)]!);
      setFomoTime(FOMO_TIMES[Math.floor(Math.random() * FOMO_TIMES.length)]!);
      setActivityPulse(true);
      setTimeout(() => setActivityPulse(false), 600);
    };
    const tickSpots = () => {
      setSpots((s) => {
        let n = s;
        if (n > 3) n -= Math.floor(Math.random() * 2) + 1;
        if (n < 3) n = 3;
        return n;
      });
      setSpotsShake(true);
      setTimeout(() => setSpotsShake(false), 500);
    };
    const i1 = setInterval(tickActivity, 45_000);
    const i2 = setInterval(tickSpots, 60_000);
    const o1 = setTimeout(tickActivity, 10_000);
    const o2 = setTimeout(tickSpots, 15_000);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
      clearTimeout(o1);
      clearTimeout(o2);
    };
  }, []);

  const leftT = offer.testimonials.slice(0, 5);
  const rightT = offer.testimonials.slice(5);

  const continueToQualify = useCallback(async () => {
    setCtaBusy(true);
    try {
      await trackFunnelEvent("offer_complete", {
        variant,
        surface: "code_landing_cta",
      });
      router.push(`/qualify?variant=${encodeURIComponent(variant)}`);
    } finally {
      setCtaBusy(false);
    }
  }, [router, variant]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 pb-28">
      <header className="border-b border-zinc-800/90 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-6 md:py-7">
          {offer.headerLogoSrc ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`rounded-xl border border-amber-500/35 bg-zinc-950/60 p-3 shadow-[0_0_0_1px_rgba(251,191,36,0.12)] backdrop-blur-sm ${accentRing} ring-1`}
              >
                <div className="gate-logo-shine relative mx-auto w-[min(200px,72vw)] overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.headerLogoSrc}
                    alt=""
                    className="relative z-[1] mx-auto block h-auto max-h-[72px] w-full object-contain object-center"
                    width={200}
                    height={72}
                  />
                  <span
                    className="gate-logo-shine-overlay pointer-events-none absolute inset-0 z-[2]"
                    aria-hidden
                  />
                </div>
              </div>
              <h2 className="text-center text-xl font-semibold tracking-wide text-white md:text-2xl">
                The {projectName}
              </h2>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded ${accentBg}/20 ring-1 ${accentRing}`} />
              <div className="text-lg font-semibold tracking-tight">
                The {projectName}
              </div>
            </div>
          )}
        </div>
        <FunnelProgress
          current={progressCurrent}
          total={progressTotal}
          label={
            variant === "ad4"
              ? undefined
              : `Step ${progressCurrent} — ${projectName}`
          }
          theme={theme}
        />
      </header>

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-6 inline-flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <span className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Private intake
              </span>
              <span className="text-sm text-zinc-500">
                Availability can change — complete the next step at your earliest convenience.
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="font-serif text-[1.65rem] font-normal leading-[1.2] tracking-tight text-zinc-900 md:text-4xl md:leading-[1.15]">
                {offer.intro.h1}
              </h1>
              <p
                className={`mx-auto max-w-2xl text-lg font-medium leading-snug md:text-xl ${accentText}`}
              >
                {offer.intro.h2}
              </p>
              <p className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-zinc-600 md:text-lg">
                {offer.intro.h3}
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <VideoOffer
                src={offer.video.src}
                poster={offer.video.poster}
                minWatchSeconds={offer.video.minWatchSeconds}
                theme={theme}
                onThresholdMet={(seconds) =>
                  trackFunnelEvent("offer_watched", {
                    variant,
                    seconds_watched: seconds,
                  })
                }
              />
            </div>
            <div className="lg:col-span-5">
              <div
                className={`flex h-full flex-col border-2 border-amber-500/40 bg-gradient-to-b from-amber-50 to-white p-5 shadow-lg ring-2 ${accentRing}`}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  {offer.urgencyAside.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-black">
                  {offer.urgencyAside.headline}
                </h2>
                <ul className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-zinc-800">
                  {offer.urgencyAside.bullets.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className={`mt-0.5 shrink-0 font-bold ${accentText}`}>
                        ▸
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={continueToQualify}
                  disabled={ctaBusy}
                  className={`mt-6 w-full rounded-lg py-4 text-base font-bold text-black shadow-lg transition-colors ${accentBg} ${accentHover} disabled:opacity-60`}
                >
                  {ctaBusy ? "…" : offer.primaryCtaLabel}
                </button>
                <p className="mt-3 text-center text-[11px] text-zinc-500">
                  Risk disclosure below — trading can result in loss of capital.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-100 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-2xl font-bold text-black md:text-3xl">
            {fillProject(offer.joinSection.headline, projectName)}
          </h2>
          <div className="space-y-4 text-left text-base leading-relaxed text-zinc-700">
            {offer.joinSection.paragraphs.map((p) => (
              <p key={p}>
                <RichLine text={fillProject(p, projectName)} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {offer.midPageUrgency ? (
        <section className="border-b border-amber-900/20 bg-gradient-to-br from-amber-950 via-zinc-900 to-zinc-950 py-12 text-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-2xl font-bold md:text-3xl">
              {offer.midPageUrgency.title}
            </h2>
            {offer.midPageUrgency.subtitle ? (
              <p className="mt-3 text-center text-sm text-amber-100/90">
                {offer.midPageUrgency.subtitle}
              </p>
            ) : null}
            <ul className="mt-8 space-y-4 text-left text-sm leading-relaxed text-zinc-200">
              {offer.midPageUrgency.bullets.map((b) => (
                <li
                  key={b}
                  className="flex gap-3 rounded-lg border border-amber-500/20 bg-black/20 px-4 py-3"
                >
                  <span className="text-amber-400">⚡</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={continueToQualify}
                disabled={ctaBusy}
                className={`rounded-lg px-8 py-3 text-sm font-bold text-black ${accentBg} ${accentHover} disabled:opacity-60`}
              >
                {offer.primaryCtaLabel}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-zinc-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-black md:text-3xl">
            {offer.vacationsTitle}
          </h2>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-100 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-xl font-bold text-black md:text-2xl">
            {offer.testimonialsSectionTitle}
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <ul className="space-y-8">
              {leftT.map((item) => (
                <li key={item.name} className="flex gap-4">
                  <TestimonialAvatar
                    name={item.name}
                    imageFile={item.imageFile}
                  />
                  <div>
                    <div className="font-bold text-black">{item.name}</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                      <RichLine
                        text={fillProject(item.quote, projectName)}
                      />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="space-y-8">
              {rightT.map((item) => (
                <li key={item.name} className="flex gap-4">
                  <TestimonialAvatar
                    name={item.name}
                    imageFile={item.imageFile}
                  />
                  <div>
                    <div className="font-bold text-black">{item.name}</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                      <RichLine
                        text={fillProject(item.quote, projectName)}
                      />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-start">
          <div className="md:w-2/5">
            {mediaUrl(offer.moSection.imageFile) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(offer.moSection.imageFile)!}
                alt="Gold Trader Mo"
                className="w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
                Photo
              </div>
            )}
          </div>
          <div className="md:flex-1">
            <h2 className="text-3xl font-bold text-black">
              {offer.moSection.title}
            </h2>
            <div className={`mt-2 text-xl font-semibold ${accentText}`}>
              {offer.moSection.subtitleLines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="mt-6 space-y-4 text-zinc-700">
              {offer.moSection.bodyParagraphs.map((p) => (
                <p key={p}>
                  <RichLine text={p} />
                </p>
              ))}
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={continueToQualify}
                disabled={ctaBusy}
                className={`rounded-lg px-6 py-3 text-sm font-bold text-black ${accentBg} ${accentHover} disabled:opacity-60`}
              >
                {offer.primaryCtaLabel}
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-end justify-end gap-4">
              {mediaUrl(offer.moSection.signImageFile) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(offer.moSection.signImageFile)!}
                  alt=""
                  className="max-h-16 object-contain"
                />
              ) : null}
              <div className="w-full text-right text-zinc-700">
                {offer.moSection.signOffLines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 text-zinc-300">
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">
            Ready for the short questionnaire? One tap — same secure Mini App
            flow.
          </p>
          <button
            type="button"
            onClick={continueToQualify}
            disabled={ctaBusy}
            className={`mt-4 w-full max-w-md rounded-lg py-4 text-base font-bold text-black ${accentBg} ${accentHover} disabled:opacity-60`}
          >
            {offer.primaryCtaLabel}
          </button>
        </div>
        <div className="border-t border-zinc-800 px-4 py-6">
          <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {offer.footerLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-amber-500 hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-10 text-left text-[11px] leading-relaxed text-zinc-500">
          {offer.disclaimerParagraphs.map((p, i) => (
            <p key={i} className="mb-2.5">
              <RichLine text={p} />
            </p>
          ))}
        </div>
      </footer>

      <div
        className={`fixed bottom-16 left-4 z-40 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity md:bottom-20 ${
          showActivity ? "opacity-100" : "pointer-events-none opacity-0"
        } ${activityPulse ? "ring-2 ring-amber-500/50" : ""}`}
      >
        <div className="mb-1 font-bold text-amber-400">
          <span className="mr-1">🔥</span> LIVE ACTIVITY
        </div>
        <div>
          Someone from {fomoCountry}
          <br />
          just joined {fomoTime} ago
        </div>
      </div>
      <div
        className={`fixed bottom-16 right-4 z-40 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity md:bottom-20 ${
          showSpots ? "opacity-100" : "pointer-events-none opacity-0"
        } ${spots <= 5 ? "border-amber-600" : ""} ${spotsShake ? "translate-x-0.5" : ""}`}
      >
        <div className="mb-1 font-bold text-amber-400">
          <span className="mr-1">⚠️</span>
          <span>{spots}</span> SPOTS LEFT
        </div>
        <div className="text-zinc-400">Filling up fast!</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-500/30 bg-zinc-950/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md md:py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <p className="hidden text-xs text-zinc-400 sm:block">
            <span className="font-semibold text-amber-400">Next:</span> secure
            questionnaire in-app
          </p>
          <button
            type="button"
            onClick={continueToQualify}
            disabled={ctaBusy}
            className={`min-h-[48px] flex-1 rounded-lg py-3 text-sm font-bold text-black sm:flex-none sm:px-10 ${accentBg} ${accentHover} disabled:opacity-60`}
          >
            {ctaBusy ? "…" : offer.primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function TestimonialAvatar({
  name,
  imageFile,
}: {
  name: string;
  imageFile: string;
}) {
  const url = mediaUrl(imageFile);
  const initial = name.charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-20 w-20 shrink-0 rounded object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-gradient-to-br from-amber-200 to-amber-600 text-xl font-bold text-white"
      aria-hidden
    >
      {initial}
    </div>
  );
}
