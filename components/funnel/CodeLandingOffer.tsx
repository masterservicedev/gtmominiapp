"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { VideoOffer } from "@/components/funnel/VideoOffer";
import type { AdVariant } from "@/lib/funnel/normalize";
import { LEAD_FORM_COUNTRIES } from "@/lib/funnel/lead-countries";
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
  const filled = text;
  const parts = filled.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-bold italic">
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

type LeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

function LeadForm({
  onValidSubmit,
  registerLabel,
}: {
  onValidSubmit: (data: LeadPayload) => Promise<void>;
  registerLabel: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [dial, setDial] = useState("+1");
  const [showError, setShowError] = useState(false);
  const [busy, setBusy] = useState(false);
  const selectId = useId();

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const iso = (data.country_code || "US").toUpperCase();
        const row = LEAD_FORM_COUNTRIES.find((c) => c.iso === iso);
        if (row) setDial(row.dial);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const raw = phoneRaw.trim();
    const phone = raw.startsWith("+") ? raw : `${dial}${raw}`;
    const phoneOk = phone.length > 7;
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !emailOk ||
      !phoneOk
    ) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setBusy(true);
    try {
      await onValidSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div>
        <input
          type="text"
          className="w-full border border-zinc-300 bg-white px-4 py-2.5 text-base italic text-zinc-900 placeholder:text-zinc-400"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
      </div>
      <div>
        <input
          type="text"
          className="w-full border border-zinc-300 bg-white px-4 py-2.5 text-base italic text-zinc-900 placeholder:text-zinc-400"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
      </div>
      <div>
        <input
          type="email"
          className="w-full border border-zinc-300 bg-white px-4 py-2.5 text-base italic text-zinc-900 placeholder:text-zinc-400"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="flex w-full">
        <select
          id={selectId}
          className="w-[110px] shrink-0 border border-r-0 border-zinc-300 bg-white px-1 py-2.5 text-sm italic text-zinc-900"
          value={dial}
          onChange={(e) => setDial(e.target.value)}
          aria-label="Country code"
        >
          {LEAD_FORM_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.dial}>
              {c.flag} {c.iso} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-2.5 text-base italic text-zinc-900 placeholder:text-zinc-400"
          placeholder="Phone Number"
          value={phoneRaw}
          onChange={(e) => setPhoneRaw(e.target.value)}
          autoComplete="tel-national"
        />
      </div>
      {showError ? (
        <p className="text-sm text-red-600">
          Please fill in all fields correctly.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 w-full cursor-pointer border border-[#ffcc51] bg-[#ffb400] py-3 text-lg font-bold uppercase text-black shadow-[1px_1px_0_#ffe6ab] hover:bg-[#e6a200] disabled:opacity-60"
      >
        {busy ? "…" : registerLabel}
      </button>
    </form>
  );
}

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

  const onRegistered = useCallback(
    async (data: LeadPayload) => {
      const sourcePage =
        typeof window !== "undefined" ? window.location.href : "";
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, variant, sourcePage }),
        });
      } catch {
        /* non-blocking */
      }
      try {
        localStorage.setItem(
          "gtmoLeadData",
          JSON.stringify({
            ...data,
            submittedAt: new Date().toISOString(),
            sourcePage,
          }),
        );
        localStorage.removeItem("gtmoLeadDataSent");
      } catch {
        /* ignore */
      }
      await trackFunnelEvent("offer_complete", {
        variant,
        surface: "code_landing_register",
      });
      router.push(`/qualify?variant=${encodeURIComponent(variant)}`);
    },
    [router, variant],
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-28">
      <header className="border-b border-zinc-800 bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded bg-amber-500/20 ring-1 ring-amber-500/40" />
          <div className="text-lg font-semibold tracking-tight">
            The {projectName}
          </div>
        </div>
        <FunnelProgress
          current={progressCurrent}
          total={progressTotal}
          label={`Step ${progressCurrent} — ${projectName}`}
          theme={theme}
        />
      </header>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-8 max-w-4xl text-3xl font-bold leading-tight text-black md:text-4xl">
            {offer.intro.line1}{" "}
            <span className="text-amber-600">{offer.intro.line2}</span>
            <br />
            <span className="text-2xl font-semibold md:text-3xl">
              {offer.intro.earnLine}{" "}
              <span className="text-amber-500">{offer.intro.highlight}</span>
            </span>
          </h1>

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
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
            <div className="md:col-span-5">
              <div className="border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                <div className="mb-4 text-center text-xl font-bold leading-snug text-black">
                  {offer.formTitleLines.map((line, i) => (
                    <div
                      key={i}
                      className={i === 1 ? "text-amber-600" : undefined}
                    >
                      {line}
                    </div>
                  ))}
                </div>
                <LeadForm
                  registerLabel={offer.registerButtonLabel}
                  onValidSubmit={onRegistered}
                />
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
            <div className="mt-2 text-xl font-semibold text-amber-600">
              {offer.moSection.subtitleLines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="mt-6 space-y-4 text-zinc-700">
              {offer.moSection.bodyParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
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
        <div className="mx-auto max-w-2xl px-4 py-10">
          <LeadForm
            registerLabel={offer.registerButtonLabel}
            onValidSubmit={onRegistered}
          />
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
        className={`fixed bottom-4 left-4 z-50 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity ${
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
        className={`fixed bottom-4 right-4 z-50 max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white shadow-lg transition-opacity ${
          showSpots ? "opacity-100" : "pointer-events-none opacity-0"
        } ${spots <= 5 ? "border-amber-600" : ""} ${spotsShake ? "translate-x-0.5" : ""}`}
      >
        <div className="mb-1 font-bold text-amber-400">
          <span className="mr-1">⚠️</span>
          <span>{spots}</span> SPOTS LEFT
        </div>
        <div className="text-zinc-400">Filling up fast!</div>
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
