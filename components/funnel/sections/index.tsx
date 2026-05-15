"use client";

/**
 * Marketing funnel sections — styles use CSS variables from funnelThemeToCssVars only.
 * Used by ad6 (and future configs); legacy ad4/ad5 keep inline views in FunnelRenderer.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import type {
  MarketingAuthorityCardSection,
  MarketingCtaSection,
  MarketingFaqSection,
  MarketingHeroSection,
  MarketingHowItWorksSection,
  MarketingStatsSection,
  MarketingTestimonialsSliderSection,
  MarketingWhySection,
} from "@/lib/funnel/framework";

function fillProject(s: string, projectName: string) {
  return s.replace(/\{projectName\}/g, projectName);
}

function RichBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: "var(--funnel-heading)" }}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function CtaButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--funnel-accent)",
        color: "var(--funnel-accent-contrast)",
        fontFamily: "var(--funnel-body-font)",
        fontSize: "var(--funnel-btn-font-size)",
        fontWeight: "var(--funnel-btn-font-weight)" as CSSProperties["fontWeight"],
        textTransform: "var(--funnel-btn-transform)" as CSSProperties["textTransform"],
        padding: "var(--funnel-btn-padding)",
        borderRadius: "var(--funnel-btn-radius)",
        border: "none",
        cursor: "pointer",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </button>
  );
}

function SectionWrap({
  children,
  style,
  surface,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  surface?: "page" | "surface";
}) {
  return (
    <section
      style={{
        padding: "var(--funnel-section-py) 20px",
        borderBottom: "0.5px solid var(--funnel-surface-border)",
        backgroundColor: surface === "surface" ? "var(--funnel-surface-bg)" : "var(--funnel-page-bg)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function MarketingHeroSectionView({
  section,
  projectName,
  onCta,
}: {
  section: MarketingHeroSection;
  projectName: string;
  onCta: () => void;
}) {
  const min = section.video.minWatchSeconds ?? 0;
  const [unlocked, setUnlocked] = useState(min <= 0);

  return (
    <section
      style={{
        padding: "var(--funnel-hero-pad-y) 20px var(--funnel-section-py)",
        background: "var(--funnel-page-bg)",
        maxWidth: "var(--funnel-max-width)",
        margin: "0 auto",
      }}
    >
      {section.video.src ? (
        <div
          style={{
            borderRadius: "var(--funnel-card-radius)",
            overflow: "hidden",
            marginBottom: 20,
            background: "#000",
            aspectRatio: "16/9",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={section.video.src}
            poster={section.video.poster}
            controls
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onTimeUpdate={(e) => {
              if (!unlocked && e.currentTarget.currentTime >= min) {
                setUnlocked(true);
              }
            }}
          />
        </div>
      ) : null}

      <h1
        style={{
          fontFamily: "var(--funnel-heading-font)",
          fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
          fontSize: "clamp(22px, 5vw, 30px)",
          color: "var(--funnel-heading)",
          letterSpacing: "var(--funnel-heading-ls)",
          textTransform: "var(--funnel-heading-transform)" as React.CSSProperties["textTransform"],
          lineHeight: 1.25,
          marginBottom: 12,
        }}
      >
        {fillProject(section.headline, projectName)}
      </h1>

      {section.subheadline ? (
        <p
          style={{
            fontFamily: "var(--funnel-body-font)",
            fontSize: 14,
            color: "var(--funnel-muted)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {fillProject(section.subheadline, projectName)}
        </p>
      ) : null}

      <CtaButton
        label={unlocked ? section.ctaLabel : `Watch ${min}s to continue`}
        onClick={unlocked ? onCta : () => {}}
      />
    </section>
  );
}

export function MarketingStatsSectionView({ section }: { section: MarketingStatsSection }) {
  const cols = Math.min(section.items.length, 3);
  return (
    <SectionWrap surface="surface">
      <div
        style={{
          maxWidth: "var(--funnel-max-width)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
        }}
      >
        {section.items.map((item, i) => (
          <div
            key={i}
            style={{
              background: "var(--funnel-page-bg)",
              border: "0.5px solid var(--funnel-surface-border)",
              borderRadius: "var(--funnel-card-radius)",
              padding: "var(--funnel-card-padding)",
              textAlign: "center",
              boxShadow: "var(--funnel-card-shadow)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--funnel-heading-font)",
                fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
                fontSize: "clamp(18px, 4vw, 24px)",
                color: "var(--funnel-accent)",
                lineHeight: 1.1,
                marginBottom: 6,
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontFamily: "var(--funnel-body-font)",
                fontSize: 11,
                color: "var(--funnel-muted)",
                lineHeight: 1.4,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

export function MarketingWhySectionView({
  section,
  projectName,
  onCta,
}: {
  section: MarketingWhySection;
  projectName: string;
  onCta: () => void;
}) {
  return (
    <SectionWrap>
      <div style={{ maxWidth: "var(--funnel-max-width)", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--funnel-heading-font)",
            fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
            fontSize: "clamp(18px, 4vw, 24px)",
            color: "var(--funnel-heading)",
            letterSpacing: "var(--funnel-heading-ls)",
            textTransform: "var(--funnel-heading-transform)" as React.CSSProperties["textTransform"],
            lineHeight: 1.3,
            marginBottom: section.subheadline ? 10 : 16,
          }}
        >
          {fillProject(section.headline, projectName)}
        </h2>

        {section.subheadline ? (
          <p
            style={{
              fontFamily: "var(--funnel-body-font)",
              fontSize: 14,
              color: "var(--funnel-accent)",
              fontWeight: 600,
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: 16,
              paddingLeft: 12,
              borderLeft: "3px solid var(--funnel-accent)",
            }}
          >
            {fillProject(section.subheadline, projectName)}
          </p>
        ) : null}

        {section.image?.src ? (
          <div
            style={{
              borderRadius: "var(--funnel-card-radius)",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={section.image.src}
              alt={section.image.alt || ""}
              style={{ width: "100%", display: "block" }}
            />
          </div>
        ) : null}

        {section.body.map((para, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--funnel-body-font)",
              fontSize: 14,
              color: "var(--funnel-body)",
              lineHeight: 1.7,
              marginBottom: 14,
            }}
          >
            <RichBold text={fillProject(para, projectName)} />
          </p>
        ))}

        {section.ctaLabel ? (
          <div style={{ marginTop: 20 }}>
            <CtaButton label={section.ctaLabel} onClick={onCta} />
          </div>
        ) : null}
      </div>
    </SectionWrap>
  );
}

export function MarketingHowItWorksSectionView({
  section,
  projectName,
  onCta,
}: {
  section: MarketingHowItWorksSection;
  projectName: string;
  onCta: () => void;
}) {
  return (
    <SectionWrap surface="surface">
      <div style={{ maxWidth: "var(--funnel-max-width)", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--funnel-heading-font)",
            fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
            fontSize: "clamp(18px, 4vw, 22px)",
            color: "var(--funnel-heading)",
            letterSpacing: "var(--funnel-heading-ls)",
            marginBottom: 20,
          }}
        >
          {fillProject(section.headline, projectName)}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {section.steps.map((step) => (
            <div
              key={step.number}
              style={{
                background: "var(--funnel-page-bg)",
                border: "0.5px solid var(--funnel-surface-border)",
                borderRadius: "var(--funnel-card-radius)",
                padding: "var(--funnel-card-padding)",
                boxShadow: "var(--funnel-card-shadow)",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--funnel-accent)",
                  color: "var(--funnel-accent-contrast)",
                  fontFamily: "var(--funnel-heading-font)",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {step.number}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--funnel-body-font)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--funnel-heading)",
                    marginBottom: 4,
                  }}
                >
                  {fillProject(step.title, projectName)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--funnel-body-font)",
                    fontSize: 13,
                    color: "var(--funnel-body)",
                    lineHeight: 1.6,
                  }}
                >
                  {fillProject(step.body, projectName)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {section.ctaLabel ? (
          <div style={{ marginTop: 20 }}>
            <CtaButton label={section.ctaLabel} onClick={onCta} />
          </div>
        ) : null}
      </div>
    </SectionWrap>
  );
}

export function MarketingTestimonialsSliderSectionView({
  section,
  projectName,
}: {
  section: MarketingTestimonialsSliderSection;
  projectName: string;
}) {
  const [active, setActive] = useState(0);
  const item = section.items[active];
  if (!item) return null;

  return (
    <SectionWrap surface="surface">
      <div style={{ maxWidth: "var(--funnel-max-width)", margin: "0 auto" }}>
        {section.headline ? (
          <h2
            style={{
              fontFamily: "var(--funnel-heading-font)",
              fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
              fontSize: "clamp(16px, 4vw, 20px)",
              color: "var(--funnel-heading)",
              letterSpacing: "var(--funnel-heading-ls)",
              marginBottom: 20,
            }}
          >
            {fillProject(section.headline, projectName)}
          </h2>
        ) : null}

        <div
          style={{
            background: "var(--funnel-page-bg)",
            border: "0.5px solid var(--funnel-surface-border)",
            borderRadius: "var(--funnel-card-radius)",
            padding: "var(--funnel-card-padding)",
            boxShadow: "var(--funnel-card-shadow)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageSrc}
                alt=""
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--funnel-surface-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "var(--funnel-muted)",
                  flexShrink: 0,
                }}
              >
                {item.name.charAt(0)}
              </div>
            )}
            <div>
              <div
                style={{
                  fontFamily: "var(--funnel-body-font)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--funnel-heading)",
                }}
              >
                {item.name}
              </div>
            </div>
          </div>
          <p
            style={{
              fontFamily: "var(--funnel-body-font)",
              fontSize: 13,
              color: "var(--funnel-body)",
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            &ldquo;{fillProject(item.quote, projectName)}&rdquo;
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 14,
          }}
        >
          {section.items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Testimonial ${i + 1}`}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === active ? "var(--funnel-accent)" : "var(--funnel-surface-border)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s",
              }}
            />
          ))}
        </div>
      </div>
    </SectionWrap>
  );
}

export function MarketingAuthorityCardSectionView({
  section,
  projectName,
}: {
  section: MarketingAuthorityCardSection;
  projectName: string;
}) {
  return (
    <SectionWrap>
      <div style={{ maxWidth: "var(--funnel-max-width)", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--funnel-heading-font)",
            fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
            fontSize: "clamp(18px, 4vw, 22px)",
            color: "var(--funnel-heading)",
            letterSpacing: "var(--funnel-heading-ls)",
            marginBottom: 4,
          }}
        >
          {fillProject(section.headline, projectName)}
        </h2>

        <p
          style={{
            fontFamily: "var(--funnel-body-font)",
            fontSize: 13,
            color: "var(--funnel-muted)",
            marginBottom: 16,
          }}
        >
          {fillProject(section.name, projectName)}
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={section.imageSrc}
          alt=""
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
            display: "block",
          }}
        />

        {section.body.map((para, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--funnel-body-font)",
              fontSize: 14,
              color: "var(--funnel-body)",
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            <RichBold text={fillProject(para, projectName)} />
          </p>
        ))}

        <div style={{ marginTop: 16 }}>
          {section.signOff.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "var(--funnel-body-font)",
                fontSize: 14,
                color: "var(--funnel-heading)",
                fontStyle: i === 1 ? "italic" : "normal",
                fontWeight: i === 1 ? 600 : 400,
              }}
            >
              {fillProject(line, projectName)}
            </div>
          ))}
        </div>
      </div>
    </SectionWrap>
  );
}

export function MarketingFaqSectionView({
  section,
  projectName,
}: {
  section: MarketingFaqSection;
  projectName: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SectionWrap surface="surface">
      <div style={{ maxWidth: "var(--funnel-max-width)", margin: "0 auto" }}>
        {section.headline ? (
          <h2
            style={{
              fontFamily: "var(--funnel-heading-font)",
              fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
              fontSize: "clamp(18px, 4vw, 22px)",
              color: "var(--funnel-heading)",
              letterSpacing: "var(--funnel-heading-ls)",
              marginBottom: 16,
            }}
          >
            {fillProject(section.headline, projectName)}
          </h2>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {section.items.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--funnel-page-bg)",
                border: "0.5px solid var(--funnel-surface-border)",
                borderRadius: "var(--funnel-card-radius)",
                overflow: "hidden",
                boxShadow: "var(--funnel-card-shadow)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: 12,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--funnel-body-font)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--funnel-heading)",
                    lineHeight: 1.4,
                  }}
                >
                  {fillProject(item.question, projectName)}
                </span>
                <span
                  style={{
                    color: "var(--funnel-muted)",
                    fontSize: 18,
                    flexShrink: 0,
                    fontWeight: 300,
                  }}
                >
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i ? (
                <div
                  style={{
                    padding: "0 16px 14px",
                    borderTop: "0.5px solid var(--funnel-surface-border)",
                    paddingTop: 12,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--funnel-body-font)",
                      fontSize: 13,
                      color: "var(--funnel-body)",
                      lineHeight: 1.6,
                    }}
                  >
                    {fillProject(item.answer, projectName)}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </SectionWrap>
  );
}

export function MarketingCtaSectionView({
  section,
  projectName,
  onCta,
}: {
  section: MarketingCtaSection;
  projectName: string;
  onCta: () => void;
}) {
  return (
    <section
      style={{
        padding: "var(--funnel-section-py) 20px 48px",
        background: "var(--funnel-surface-bg)",
        textAlign: "center",
        maxWidth: "var(--funnel-max-width)",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--funnel-heading-font)",
          fontWeight: "var(--funnel-heading-weight)" as React.CSSProperties["fontWeight"],
          fontSize: "clamp(20px, 5vw, 26px)",
          color: "var(--funnel-heading)",
          letterSpacing: "var(--funnel-heading-ls)",
          textTransform: "var(--funnel-heading-transform)" as React.CSSProperties["textTransform"],
          lineHeight: 1.25,
          marginBottom: section.subheadline ? 10 : 20,
        }}
      >
        {fillProject(section.headline, projectName)}
      </h2>

      {section.subheadline ? (
        <p
          style={{
            fontFamily: "var(--funnel-body-font)",
            fontSize: 14,
            color: "var(--funnel-muted)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {fillProject(section.subheadline, projectName)}
        </p>
      ) : null}

      <CtaButton label={section.ctaLabel} onClick={onCta} />

      {section.disclaimer ? (
        <p
          style={{
            fontFamily: "var(--funnel-body-font)",
            fontSize: 11,
            color: "var(--funnel-muted)",
            lineHeight: 1.5,
            marginTop: 12,
          }}
        >
          {fillProject(section.disclaimer, projectName)}
        </p>
      ) : null}
    </section>
  );
}
