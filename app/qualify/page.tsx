"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { ProcessingScreen } from "@/components/funnel/ProcessingScreen";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";

const QUESTIONNAIRE_STEPS = 5;

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
  const t = getThemeClasses(cfg.theme);
  const preSteps = getPreQuestionnaireSteps(variant);
  const totalFunnelSteps = preSteps + QUESTIONNAIRE_STEPS;

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
      {processing ? <ProcessingScreen theme={cfg.theme} /> : null}
      <div className="min-h-screen bg-black text-white flex flex-col">
        <FunnelProgress
          current={funnelStepNumber}
          total={totalFunnelSteps}
          label={`Step ${funnelStepNumber} of ${totalFunnelSteps}`}
          theme={cfg.theme}
        />

        <div className="px-6 pt-4 text-xs text-gray-500">
          Question {step.step} of {QUESTIONNAIRE_STEPS}
        </div>

        <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
          <h1 className="text-xl font-bold mb-2">{step.question}</h1>
          {step.subtitle && (
            <p className="text-sm text-gray-400 mb-8">{step.subtitle}</p>
          )}

          <div className="flex flex-col gap-3 flex-1">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                  selected === opt.value
                    ? `${t.accentBorder} ${t.selectedBg} text-white`
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
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
            className={`mt-6 w-full py-4 rounded-xl font-semibold text-sm transition-all ${
              selected && !processing
                ? `${t.accentBg} text-black ${t.accentBgHover}`
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
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
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <QualifyInner />
    </Suspense>
  );
}
