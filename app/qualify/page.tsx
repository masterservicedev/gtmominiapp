"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { ProcessingScreen } from "@/components/funnel/ProcessingScreen";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getAccentPalette } from "@/lib/funnel/palette";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";

const QUESTIONNAIRE_STEPS = 5;
/** Post-questionnaire: value bridge + activation confirm */
const POST_QUALIFY_STEPS = 2;

const steps = [
  {
    id: "age",
    step: 1,
    question: "Are you 18 or over?",
    subtitle: "This is a legal requirement to open a trading account.",
    options: [
      { value: "yes", label: "✅ Yes" },
      { value: "no", label: "❌ No" },
    ],
  },
  {
    id: "capital",
    step: 2,
    question: "Do you have funds available to start a trading account?",
    subtitle:
      "To participate, users must be able to fund their account when approved.",
    options: [
      { value: "1000_plus", label: "Yes — I have $1,000+" },
      { value: "300_1000", label: "Yes — I have $300–$1,000" },
      { value: "100_300", label: "Yes — I have $100–$300" },
      { value: "under_100", label: "I have under $100 right now" },
    ],
  },
  {
    id: "experience",
    step: 3,
    question: "What's your current level with trading?",
    subtitle: "Be honest — this helps us match you with the right support.",
    options: [
      { value: "beginner", label: "Complete beginner" },
      { value: "some_experience", label: "Some experience" },
      { value: "trades_already", label: "I trade already" },
    ],
  },
  {
    id: "goal",
    step: 4,
    question: "What would you most like to achieve?",
    subtitle: "This helps our team understand how to guide you.",
    options: [
      {
        value: "side_income",
        label: "💰 Generate a side income of $500–$2,000/month",
      },
      {
        value: "serious_income",
        label: "💰 Build a serious income of $2,000–$5,000/month",
      },
      {
        value: "full_time",
        label: "💰 Trade full time at $5,000+/month",
      },
      { value: "exploring", label: "📈 I'm still exploring what's possible" },
    ],
  },
  {
    id: "readiness",
    step: 5,
    question:
      "If our team gave you a clear structure and support, how soon could you move forward?",
    subtitle: "We only work with individuals who are ready to take action.",
    options: [
      { value: "ready_now", label: "⚡ I'm ready now" },
      { value: "seven_days", label: "📅 Within the next 7 days" },
      { value: "this_month", label: "🗓 Within this month" },
      { value: "not_ready", label: "⏳ I'm not ready yet" },
    ],
  },
];

function QualifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant")) as AdVariant;
  const cfg = getFunnelConfig(variant);
  const palette = getAccentPalette(cfg);
  const t = palette;
  const preSteps = getPreQuestionnaireSteps();
  const totalFunnelSteps = preSteps + QUESTIONNAIRE_STEPS + POST_QUALIFY_STEPS;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const step = steps[currentStep]!;
  const funnelStepNumber = preSteps + currentStep + 1;

  useEffect(() => {
    trackFunnelEvent("questionnaire_start", { variant });
  }, [variant]);

  function handleSelect(value: string) {
    setSelected(value);
  }

  async function handleNext() {
    if (!selected) return;

    if (step.id === "age" && selected === "no") {
      router.push("/result?exit=age");
      return;
    }

    const newAnswers = { ...answers, [step.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (currentStep === QUESTIONNAIRE_STEPS - 1) {
      setProcessing(true);
      await trackFunnelEvent("questionnaire_processing_shown", { variant });
      const start = Date.now();

      try {
        const WebApp = await loadWebApp();
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: WebApp.initData,
            answers: {
              ageVerified: newAnswers.age === "yes",
              capital: newAnswers.capital,
              experience: newAnswers.experience,
              goal: newAnswers.goal,
              readiness: newAnswers.readiness,
            },
          }),
        });

        const data = await res.json();
        const elapsed = Date.now() - start;
        await new Promise((r) => setTimeout(r, Math.max(0, 2500 - elapsed)));

        if (data.exit) {
          router.push(`/result?exit=${data.reason}`);
          return;
        }

        if (data.segment === "HIGH" || data.segment === "MID") {
          const vb = new URLSearchParams({
            variant: String(variant),
            capital: String(data.capital ?? ""),
            readiness: String(newAnswers.readiness ?? ""),
            segment: String(data.segment ?? ""),
            score: String(data.score ?? ""),
          });
          router.push(`/value-bridge?${vb.toString()}`);
          return;
        }

        if (data.segment === "LOW" && data.capital === "under_100") {
          const vb = new URLSearchParams({
            variant: String(variant),
            capital: String(data.capital ?? ""),
            readiness: String(newAnswers.readiness ?? ""),
            segment: String(data.segment ?? ""),
            score: String(data.score ?? ""),
          });
          router.push(`/value-bridge?${vb.toString()}`);
          return;
        }

        router.push(`/result?segment=${data.segment}`);
      } catch {
        setProcessing(false);
      }
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }

  return (
    <>
      {processing ? <ProcessingScreen palette={palette} /> : null}
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
        <div
          className={`pointer-events-none absolute inset-0 ${palette.pageRadialGlow}`}
          aria-hidden
        />
        <div className="relative border-b border-zinc-800/80 bg-black/40 backdrop-blur-sm">
          <FunnelProgress
            current={funnelStepNumber}
            total={totalFunnelSteps}
            label={`Step ${funnelStepNumber} of ${totalFunnelSteps}`}
            palette={palette}
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
          <p
            className={`mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] ${palette.questionnaireEyebrow}`}
          >
            Application · Question {step.step} of {QUESTIONNAIRE_STEPS}
          </p>

          <h1 className="mb-3 font-serif text-2xl font-normal leading-[1.2] tracking-tight text-zinc-50 md:text-[1.75rem] md:leading-snug">
            {step.question}
          </h1>
          {step.subtitle ? (
            <p className="mb-10 max-w-prose text-sm leading-relaxed text-zinc-400">
              {step.subtitle}
            </p>
          ) : null}

          <div className="flex flex-1 flex-col gap-3">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full rounded-xl border px-5 py-4 text-left text-[15px] leading-snug transition-all duration-200 ${
                  selected === opt.value
                    ? palette.qualifyOptionSelected
                    : "border-zinc-700/80 bg-zinc-900/40 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 active:scale-[0.99]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!selected || processing}
            className={`mt-8 w-full rounded-xl py-4 text-sm font-semibold tracking-wide shadow-lg transition-all ${
              selected && !processing
                ? `${t.accentBg} ${t.accentButtonText} ${t.primaryButtonShadow} ${t.accentBgHover}`
                : "cursor-not-allowed border border-zinc-800 bg-zinc-900/50 text-zinc-600"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

export default function QualifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 to-black text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <QualifyInner />
    </Suspense>
  );
}
