"use client";

import { VideoOffer } from "@/components/funnel/VideoOffer";
import type { AdVariant } from "@/lib/funnel/normalize";
import type {
  CorpFaqSection,
  CorpFinalCtaSection,
  CorpHeaderSection,
  CorpHeroStartSection,
  CorpHowBandSection,
  CorpPathStepsSection,
  CorpReviewsSection,
  CorpSplitWorkSection,
  CorpThreeCardsSection,
  CorpTopicCardsSection,
  CorpValueTilesSection,
  CorpVideoRowSection,
} from "@/lib/funnel/framework";
import type { FunnelAccentPalette } from "@/lib/funnel/types";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { RefObject, MutableRefObject } from "react";

const MEDIA_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE || "").replace(/\/$/, "")
    : "";

function mediaUrl(file: string) {
  if (!MEDIA_BASE) return null;
  return `${MEDIA_BASE}/${file.replace(/^\//, "")}`;
}

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

function RichLineLight({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: "#111827" }}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function RichLineDark({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: "var(--funnel-corp-dark-text)" }}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function CorpHeaderSectionView({ section }: { section: CorpHeaderSection }) {
  return (
    <header
      className="border-b"
      style={{
        backgroundColor: "var(--funnel-surface-bg)",
        borderColor: "var(--funnel-surface-border)",
        color: "var(--funnel-page-text)",
      }}
    >
      <div
        className="border-b py-2 text-center text-xs"
        style={{
          borderColor: "var(--funnel-surface-border)",
          color: "var(--funnel-muted)",
        }}
      >
        {section.advertorialLine}
      </div>
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <div className="flex items-center gap-3">
          {section.logoSrc && resolveMediaSrc(section.logoSrc) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaSrc(section.logoSrc)!} alt="" className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: "var(--funnel-heading-font)" }}>
              GTMO
            </span>
          )}
        </div>
        <nav className="hidden flex-wrap gap-5 text-sm font-medium md:flex">
          {section.navLinks.map((l) => (
            <a
              key={l.label + l.href}
              href={l.href}
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--funnel-corp-nav-link, var(--funnel-heading))" }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function CorpVideoRowSectionView({
  section,
  variant,
  palette,
  progressBarColor,
}: {
  section: CorpVideoRowSection;
  variant: AdVariant;
  palette: FunnelAccentPalette;
  progressBarColor: string;
}) {
  return (
    <section
      className="border-b py-8 md:py-10"
      style={{
        backgroundColor: "var(--funnel-corp-dark-bg, #1a1a1a)",
        borderColor: "rgba(255,255,255,0.08)",
        color: "var(--funnel-corp-dark-text, #fafafa)",
      }}
    >
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <VideoOffer
          src={section.video.src}
          poster={section.video.poster}
          minWatchSeconds={section.video.minWatchSeconds}
          palette={palette}
          progressBarColor={progressBarColor}
          onThresholdMet={(seconds) =>
            trackFunnelEvent("offer_watched", { variant, seconds_watched: seconds })
          }
        />
        {section.caption ? (
          <p className="mt-3 text-center text-sm" style={{ color: "var(--funnel-corp-dark-muted, #a3a3a3)" }}>
            {section.caption}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function CorpHeroStartSectionView({
  section,
  projectName,
}: {
  section: CorpHeroStartSection;
  projectName: string;
}) {
  return (
    <section
      className="border-b py-12 md:py-16"
      style={{
        backgroundColor: "var(--funnel-corp-dark-bg, #1a1a1a)",
        color: "var(--funnel-corp-dark-text, #fafafa)",
      }}
    >
      <div
        className="mx-auto grid w-full gap-10 px-4 md:grid-cols-2 md:items-center"
        style={{ maxWidth: "var(--funnel-max-width)" }}
      >
        <div>
          <h1
            className="text-2xl font-normal leading-tight md:text-4xl"
            style={{ fontFamily: "var(--funnel-heading-font)" }}
          >
            {fillProject(section.headline, projectName)}
            {section.headlineItalic ? (
              <>
                {" "}
                <em className="not-italic opacity-95" style={{ color: "var(--funnel-corp-dark-muted, #d4d4d4)" }}>
                  {fillProject(section.headlineItalic, projectName)}
                </em>
              </>
            ) : null}
          </h1>
          <div className="mt-5 space-y-4 text-sm leading-relaxed md:text-base" style={{ color: "var(--funnel-corp-dark-muted, #d4d4d4)" }}>
            {section.paragraphs.map((p) => (
              <p key={p}>
                <RichLineDark text={fillProject(p, projectName)} />
              </p>
            ))}
          </div>
        </div>
        {section.heroImageFile && resolveMediaSrc(section.heroImageFile) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaSrc(section.heroImageFile)!}
            alt=""
            className="w-full rounded-lg object-cover shadow-lg"
            style={{ maxHeight: "22rem" }}
          />
        ) : (
          <div
            className="flex min-h-[14rem] items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--funnel-corp-dark-muted)" }}
          >
            Image placeholder
          </div>
        )}
      </div>
    </section>
  );
}

export function CorpTopicCardsSectionView({ section, projectName }: { section: CorpTopicCardsSection; projectName: string }) {
  return (
    <section id="about" className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-surface-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        {section.intro ? (
          <p className="mt-4 max-w-3xl text-base leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
            {fillProject(section.intro, projectName)}
          </p>
        ) : null}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {section.cards.map((c) => (
            <div
              key={c.eyebrow}
              className="flex flex-col rounded-lg border p-4 shadow-sm"
              style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-card-bg)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--funnel-accent-on-light)" }}>
                {c.eyebrow}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--funnel-page-text)" }}>
                {fillProject(c.body, projectName)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorpValueTilesSectionView({ section, projectName }: { section: CorpValueTilesSection; projectName: string }) {
  return (
    <section className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-page-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
          {section.introParagraphs.map((p) => (
            <p key={p}>{fillProject(p, projectName)}</p>
          ))}
        </div>
        {section.tilesLabel ? (
          <p className="mt-6 text-sm font-semibold" style={{ color: "var(--funnel-heading)" }}>
            {fillProject(section.tilesLabel, projectName)}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {section.tiles.map((t) => (
            <div
              key={t.title}
              className="overflow-hidden rounded-lg border shadow-sm"
              style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-surface-bg)" }}
            >
              {resolveMediaSrc(t.imageFile) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaSrc(t.imageFile)!} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-neutral-400">Image</div>
              )}
              <div className="p-3 text-center">
                <h3 className="text-sm font-semibold" style={{ color: "var(--funnel-heading)" }}>
                  {t.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
        {section.bottomLine ? (
          <p className="mt-8 text-center text-base" style={{ color: "var(--funnel-muted)" }}>
            {fillProject(section.bottomLine, projectName)}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function CorpPathStepsSectionView({ section, projectName }: { section: CorpPathStepsSection; projectName: string }) {
  return (
    <section id="path" className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-surface-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
          {section.introParagraphs.map((p) => (
            <p key={p}>{fillProject(p, projectName)}</p>
          ))}
        </div>
        {section.pathLeadIn ? (
          <p className="mt-6 font-semibold" style={{ color: "var(--funnel-heading)" }}>
            {fillProject(section.pathLeadIn, projectName)}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.steps.map((s) => (
            <div
              key={s.num}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-card-bg)" }}
            >
              <p className="text-sm font-bold text-neutral-400">{s.num}</p>
              <h3 className="mt-2 text-sm font-semibold leading-snug" style={{ color: "var(--funnel-heading)" }}>
                {fillProject(s.title, projectName)}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorpReviewsSectionView({
  section,
  projectName,
  scrollRef,
  pausedRef,
  touchResumeRef,
}: {
  section: CorpReviewsSection;
  projectName: string;
  scrollRef: RefObject<HTMLUListElement | null>;
  pausedRef: MutableRefObject<boolean>;
  touchResumeRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  return (
    <section id="review" className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-page-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
          {section.introParagraphs.map((p) => (
            <p key={p}>{fillProject(p, projectName)}</p>
          ))}
        </div>
        <div
          className="-mx-4 mt-8 px-4 md:mx-0 md:px-0"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          onTouchStart={() => {
            pausedRef.current = true;
            if (touchResumeRef.current) {
              clearTimeout(touchResumeRef.current);
              touchResumeRef.current = null;
            }
          }}
          onTouchEnd={() => {
            if (touchResumeRef.current) {
              clearTimeout(touchResumeRef.current);
            }
            touchResumeRef.current = setTimeout(() => {
              pausedRef.current = false;
              touchResumeRef.current = null;
            }, 2500);
          }}
        >
          <ul
            ref={scrollRef as RefObject<HTMLUListElement>}
            className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {section.items.map((item) => (
              <li
                key={item.name}
                className="min-w-[min(85vw,20rem)] max-w-[20rem] shrink-0 rounded-lg border p-4 shadow-sm"
                style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-surface-bg)" }}
              >
                <div className="flex gap-3">
                  {resolveMediaSrc(item.imageFile) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaSrc(item.imageFile)!} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--funnel-heading)" }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--funnel-accent-on-light)" }}>
                      {item.role}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
                      {fillProject(item.quote, projectName)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CorpHowBandSectionView({ section, projectName }: { section: CorpHowBandSection; projectName: string }) {
  return (
    <section
      className="border-b py-12 md:py-16"
      style={{
        backgroundColor: "var(--funnel-corp-yellow-bg, #f4d03f)",
        color: "var(--funnel-corp-yellow-text, #1a1a1a)",
      }}
    >
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic opacity-90">{fillProject(section.titleItalic, projectName)}</em>
            </>
          ) : null}
        </h2>
        {section.intro ? <p className="mt-4 max-w-3xl text-base leading-relaxed opacity-90">{fillProject(section.intro, projectName)}</p> : null}
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {section.steps.map((s) => (
            <div key={s.kicker}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.kicker}</p>
              <h3 className="mt-2 text-sm font-semibold leading-relaxed">
                <RichLineLight text={fillProject(s.body, projectName)} />
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorpSplitWorkSectionView({ section, projectName }: { section: CorpSplitWorkSection; projectName: string }) {
  return (
    <section className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-surface-bg)" }}>
      <div
        className="mx-auto grid w-full gap-10 px-4 md:grid-cols-2 md:items-center"
        style={{ maxWidth: "var(--funnel-max-width)" }}
      >
        <div>
          <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
            {fillProject(section.title, projectName)}
            {section.titleItalic ? (
              <>
                {" "}
                <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                  {fillProject(section.titleItalic, projectName)}
                </em>
              </>
            ) : null}
          </h2>
          <h3 className="mt-4 text-base font-semibold leading-snug" style={{ color: "var(--funnel-page-text)" }}>
            {fillProject(section.h3, projectName)}
          </h3>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
            {section.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span style={{ color: "var(--funnel-accent-on-light)" }}>•</span>
                <span>{fillProject(b, projectName)}</span>
              </li>
            ))}
          </ul>
        </div>
        {resolveMediaSrc(section.imageFile) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveMediaSrc(section.imageFile)!} alt="" className="w-full rounded-lg object-cover shadow-md" />
        ) : null}
      </div>
    </section>
  );
}

export function CorpThreeCardsSectionView({ section, projectName }: { section: CorpThreeCardsSection; projectName: string }) {
  return (
    <section className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-page-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {section.cards.map((c) => (
            <div
              key={c.title}
              className="overflow-hidden rounded-lg border shadow-sm"
              style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-surface-bg)" }}
            >
              {resolveMediaSrc(c.imageFile) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaSrc(c.imageFile)!} alt="" className="h-40 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--funnel-heading)" }}>
                  {fillProject(c.title, projectName)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
                  {fillProject(c.body, projectName)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorpFaqSectionView({ section, projectName }: { section: CorpFaqSection; projectName: string }) {
  return (
    <section id="faq" className="border-b py-12 md:py-16" style={{ backgroundColor: "var(--funnel-surface-bg)" }}>
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-heading)" }}>
          {fillProject(section.title, projectName)}
        </h2>
        <div className="mt-8 space-y-3">
          {section.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--funnel-card-border)", backgroundColor: "var(--funnel-card-bg)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--funnel-heading)" }}>
                {fillProject(item.question, projectName)}
              </summary>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--funnel-muted)" }}>
                {fillProject(item.answer, projectName)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CorpFinalCtaSectionView({ section, projectName }: { section: CorpFinalCtaSection; projectName: string }) {
  return (
    <section
      className="border-b py-14 md:py-20"
      style={{
        backgroundColor: "var(--funnel-corp-dark-bg, #1a1a1a)",
        color: "var(--funnel-corp-dark-text, #fafafa)",
      }}
    >
      <div className="mx-auto w-full px-4" style={{ maxWidth: "42rem" }}>
        <h2 className="text-2xl font-normal leading-tight md:text-3xl" style={{ fontFamily: "var(--funnel-heading-font)" }}>
          {fillProject(section.title, projectName)}
          {section.titleItalic ? (
            <>
              {" "}
              <em className="not-italic" style={{ color: "var(--funnel-corp-dark-muted, #d4d4d4)" }}>
                {fillProject(section.titleItalic, projectName)}
              </em>
            </>
          ) : null}
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed md:text-base" style={{ color: "var(--funnel-corp-dark-muted, #d4d4d4)" }}>
          {section.paragraphs.map((p) => (
            <p key={p}>
              <RichLineDark text={fillProject(p, projectName)} />
            </p>
          ))}
        </div>
        <p className="mt-6 text-sm" style={{ color: "var(--funnel-corp-dark-muted)" }}>
          Use the button fixed at the bottom of this screen to continue to the in-app questionnaire when you are ready.
        </p>
      </div>
    </section>
  );
}
