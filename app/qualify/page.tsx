"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadWebApp } from "@/lib/twa";

const TOTAL_STEPS = 5;

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

export default function QualifyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const step = steps[currentStep]!;
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

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

    if (currentStep === TOTAL_STEPS - 1) {
      setProcessing(true);
      await new Promise((r) => setTimeout(r, 800));

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-6 pt-4 text-xs text-gray-500">
        Step {step.step} of {TOTAL_STEPS}
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
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
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
              ? "bg-emerald-500 text-black hover:bg-emerald-400"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          {processing ? "⏳ Processing your answers..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}
