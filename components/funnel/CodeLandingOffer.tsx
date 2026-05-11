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

/** `/public` paths, remote URLs, or legacy CDN keys via `NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE`. */
function resolveMediaSrc(path: string | undefined): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return mediaUrl(p);
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
            <strong key={i} className="font-semibold text-zinc-900">
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

  const [ctaBusy, setCtaBusy] = useState(false);
  const [fomoCountry, setFomoCountry] = useState("United States");
  const [fomoTime, setFomoTime] = useState("2 min");
  const [spots, setSpots] = useState(7);
  const [showActivity, setShowActivity] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const [activityPulse, setActivityPulse] = useState(false);
  const [spotsShake, setSpotsShake] = useState(false);

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
            <div
              className={`mx-auto flex max-w-full flex-row items-center gap-3 rounded-xl border border-amber-500/35 bg-zinc-950/60 px-4 py-3 shadow-[0_0_0_1px_rgba(251,191,36,0.12)] backdrop-blur-sm md:gap-4 md:px-5 md:py-3.5 ${accentRing} ring-1`}
            >
              <div className="gate-logo-shine relative aspect-[323/418] h-12 shrink-0 overflow-hidden rounded-lg sm:h-14 md:h-[3.75rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.headerLogoSrc}
                  alt=""
                  className="relative z-[1] h-full w-full object-contain object-center"
                  width={323}
                  height={418}
                />
                <span
                  className="gate-logo-shine-overlay pointer-events-none absolute inset-0 z-[2]"
                  aria-hidden
                />
              </div>
              <h2 className="min-w-0 text-left text-lg font-semibold tracking-wide text-white sm:text-xl md:text-2xl">
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
              <p className="mx-auto max-w-2xl text-lg font-semibold leading-snug text-zinc-900 md:text-xl">
                {offer.intro.h2}
              </p>
              {offer.intro.h2b ? (
                <p
                  className={`mx-auto max-w-2xl text-lg font-semibold leading-snug md:text-xl ${accentText}`}
                >
                  {offer.intro.h2b}
                </p>
              ) : null}
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
              <div className="flex h-full flex-col rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-6 shadow-sm ring-1 ring-zinc-900/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {offer.urgencyAside.eyebrow}
                </p>
                <h2 className="mt-3 font-serif text-xl font-normal leading-snug text-zinc-900 md:text-2xl">
                  {offer.urgencyAside.headline}
                </h2>
                <ul className="mt-5 flex-1 space-y-3 text-sm leading-relaxed text-zinc-600">
                  {offer.urgencyAside.bullets.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentBg}`}
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
                  Trading can result in loss of capital. Continue when ready using the bar at the bottom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200/80 bg-[#fafaf9] py-12 md:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight text-zinc-900 md:text-3xl">
            {fillProject(offer.joinSection.headline, projectName)}
          </h2>
          <div className="space-y-4 text-left text-base font-normal leading-relaxed text-zinc-600">
            {offer.joinSection.paragraphs.map((p) => (
              <p key={p}>
                <RichLine text={fillProject(p, projectName)} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {offer.midPageUrgency ? (
        <section className="border-b border-zinc-800/90 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-12 text-white shadow-inner md:py-14">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center font-serif text-2xl font-normal tracking-tight text-white md:text-3xl">
              {offer.midPageUrgency.title}
            </h2>
            {offer.midPageUrgency.subtitle ? (
              <p className="mt-4 text-center text-sm leading-relaxed text-amber-100/85">
                {offer.midPageUrgency.subtitle}
              </p>
            ) : null}
            <ul className="mt-8 space-y-3 text-left text-sm leading-relaxed text-zinc-200">
              {offer.midPageUrgency.bullets.map((b) => (
                <li
                  key={b}
                  className="flex gap-3 rounded-xl border border-amber-500/25 bg-black/30 px-4 py-3.5 backdrop-blur-sm"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentBg}`}
                    aria-hidden
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {offer.vacationsTitle?.trim() ? (
        <section className="border-b border-zinc-200/80 bg-white py-10 md:py-12">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-serif text-2xl font-normal tracking-tight text-zinc-900 md:text-3xl">
              {offer.vacationsTitle}
            </h2>
          </div>
        </section>
      ) : null}

      <section className="border-b border-zinc-200/80 bg-[#fafaf9] py-12 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center font-serif text-2xl font-normal tracking-tight text-zinc-900 md:text-3xl">
            {offer.testimonialsSectionTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <ul className="space-y-6">
              {leftT.map((item) => (
                <li
                  key={item.name}
                  className="flex gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
                >
                  <TestimonialAvatar
                    name={item.name}
                    imageFile={item.imageFile}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">
                      {item.name}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                      <RichLine
                        text={fillProject(item.quote, projectName)}
                      />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="space-y-6">
              {rightT.map((item) => (
                <li
                  key={item.name}
                  className="flex gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
                >
                  <TestimonialAvatar
                    name={item.name}
                    imageFile={item.imageFile}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">
                      {item.name}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
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

      <section className="border-b border-zinc-200/80 bg-white py-12 md:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-start">
          <div className="md:w-2/5">
            {resolveMediaSrc(offer.moSection.imageFile) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaSrc(offer.moSection.imageFile)!}
                alt="Gold Trader Mo"
                className="w-full rounded-xl border border-zinc-200/80 object-cover shadow-sm"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                Photo
              </div>
            )}
          </div>
          <div className="md:flex-1">
            <h2 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
              {offer.moSection.title}
            </h2>
            <div className={`mt-3 space-y-0.5 text-lg font-medium leading-snug md:text-xl ${accentText}`}>
              {offer.moSection.subtitleLines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="mt-6 space-y-4 text-base font-normal leading-relaxed text-zinc-600">
              {offer.moSection.bodyParagraphs.map((p) => (
                <p key={p}>
                  <RichLine text={p} />
                </p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-end gap-4 border-t border-zinc-200/80 pt-8">
              {resolveMediaSrc(offer.moSection.signImageFile) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaSrc(offer.moSection.signImageFile)!}
                  alt=""
                  className="max-h-16 object-contain"
                />
              ) : null}
              <div className="w-full text-right text-sm text-zinc-600">
                {offer.moSection.signOffLines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(offer.footerLinks && offer.footerLinks.length > 0) ||
      (offer.disclaimerParagraphs && offer.disclaimerParagraphs.length > 0) ? (
        <footer className="border-t border-zinc-200/80 bg-[#fafaf9] text-zinc-600">
          {offer.footerLinks && offer.footerLinks.length > 0 ? (
            <div className="border-t border-zinc-200/80 bg-white px-4 py-6">
              <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                {offer.footerLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className={`${accentText} hover:underline underline-offset-4`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {offer.disclaimerParagraphs && offer.disclaimerParagraphs.length > 0 ? (
            <div className="mx-auto max-w-4xl bg-white px-4 pb-10 text-left text-[11px] leading-relaxed text-zinc-500">
              {offer.disclaimerParagraphs.map((p, i) => (
                <p key={i} className="mb-2.5">
                  <RichLine text={p} />
                </p>
              ))}
            </div>
          ) : null}
        </footer>
      ) : null}

      <div
        className={`fixed bottom-[5.25rem] left-4 z-40 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity md:bottom-[5.5rem] ${
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
        className={`fixed bottom-[5.25rem] right-4 z-40 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity md:bottom-[5.5rem] ${
          showSpots ? "opacity-100" : "pointer-events-none opacity-0"
        } ${spots <= 5 ? "border-amber-600" : ""} ${spotsShake ? "translate-x-0.5" : ""}`}
      >
        <div className="mb-1 font-bold text-amber-400">
          <span className="mr-1">⚠️</span>
          <span>{spots}</span> SPOTS LEFT
        </div>
        <div className="text-zinc-400">Filling up fast!</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:py-4">
        <div className="mx-auto flex max-w-lg flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="hidden text-center text-xs text-zinc-500 sm:block sm:text-left">
            Next step: short questionnaire in this app.
          </p>
          <button
            type="button"
            onClick={continueToQualify}
            disabled={ctaBusy}
            className={`min-h-[48px] w-full rounded-lg py-3 text-sm font-semibold text-zinc-950 transition-colors sm:w-auto sm:min-w-[200px] sm:px-8 ${accentBg} ${accentHover} disabled:opacity-60`}
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
  const url = resolveMediaSrc(imageFile);
  const initial = name.charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full object-cover ring-2 ring-zinc-100"
      />
    );
  }
  return (
    <div
      className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full bg-zinc-200 text-base font-semibold text-zinc-600"
      aria-hidden
    >
      {initial}
    </div>
  );
}
