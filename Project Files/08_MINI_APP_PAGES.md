# GTMO Mini App — Pages & UI Flow

## Page Flow

```
/           → Entry experience (video or LP based on variant)
/qualify    → 5-step questionnaire with progress bar
/product-match → After score (HIGH/MID): shows product tier + bundle from questionnaire
/confirm-intent → Yes / Not now — HIGH triggers Telegram lead + Chatwoot labels; MID records intent only
/result     → Post-score result screen (HIGH / MID / LOW path)
/analytics  → Internal dashboard (protected)
```

---

## File: app/page.tsx — Entry Page

```typescript
'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';

function parseStartParam(startParam: string) {
  const parts = startParam.split('_');
  // Format: cid_VOLUUMID_VARIANT
  return {
    cid: parts[1] || null,
    variant: parts[2] || null,
  };
}

export default function EntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand(); // Full screen

    const startParam = WebApp.initDataUnsafe?.start_param || '';
    const { cid, variant: v } = parseStartParam(startParam);

    // Register user immediately — before anything else
    fetch('/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: WebApp.initData,
        voluumCid: cid,
        entryVariant: v,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setVariant(data.variant);
        setLoading(false);

        // Track offer view
        fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: WebApp.initData,
            eventType: 'offer_view',
            metadata: { variant: data.variant },
          }),
        });
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-sm">Loading...</div>
      </div>
    );
  }

  // Render variant — video or LP
  return variant?.startsWith('vid')
    ? <VideoEntry variant={variant} onContinue={() => router.push('/qualify')} />
    : <LPEntry variant={variant} onContinue={() => router.push('/qualify')} />;
}
```

---

## File: app/qualify/page.tsx — Questionnaire

```typescript
'use client';

import { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';

const TOTAL_STEPS = 5;

const steps = [
  {
    id: 'age',
    step: 1,
    question: 'Are you 18 or over?',
    subtitle: 'This is a legal requirement to open a trading account.',
    options: [
      { value: 'yes', label: '✅ Yes' },
      { value: 'no', label: '❌ No' },
    ],
  },
  {
    id: 'capital',
    step: 2,
    question: 'Do you have funds available to start a trading account?',
    subtitle: 'To participate, users must be able to fund their account when approved.',
    options: [
      { value: '1000_plus', label: 'Yes — I have $1,000+' },
      { value: '300_1000', label: 'Yes — I have $300–$1,000' },
      { value: '100_300', label: 'Yes — I have $100–$300' },
      { value: 'under_100', label: 'I have under $100 right now' },
    ],
  },
  {
    id: 'experience',
    step: 3,
    question: "What's your current level with trading?",
    subtitle: 'Be honest — this helps us match you with the right support.',
    options: [
      { value: 'beginner', label: 'Complete beginner' },
      { value: 'some_experience', label: 'Some experience' },
      { value: 'trades_already', label: 'I trade already' },
    ],
  },
  {
    id: 'goal',
    step: 4,
    question: 'What would you most like to achieve?',
    subtitle: 'This helps our team understand how to guide you.',
    options: [
      { value: 'side_income', label: '💰 Generate a side income of $500–$2,000/month' },
      { value: 'serious_income', label: '💰 Build a serious income of $2,000–$5,000/month' },
      { value: 'full_time', label: '💰 Trade full time at $5,000+/month' },
      { value: 'exploring', label: "📈 I'm still exploring what's possible" },
    ],
  },
  {
    id: 'readiness',
    step: 5,
    question: 'If our team gave you a clear structure and support, how soon could you move forward?',
    subtitle: 'We only work with individuals who are ready to take action.',
    options: [
      { value: 'ready_now', label: "⚡ I'm ready now" },
      { value: 'seven_days', label: '📅 Within the next 7 days' },
      { value: 'this_month', label: '🗓 Within this month' },
      { value: 'not_ready', label: "⏳ I'm not ready yet" },
    ],
  },
];

export default function QualifyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  function handleSelect(value: string) {
    setSelected(value);
  }

  async function handleNext() {
    if (!selected) return;

    // Age gate — immediate soft exit
    if (step.id === 'age' && selected === 'no') {
      router.push('/result?exit=age');
      return;
    }

    const newAnswers = { ...answers, [step.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    // Add 800ms processing delay on final step (psychological)
    if (currentStep === TOTAL_STEPS - 1) {
      setProcessing(true);
      await new Promise(r => setTimeout(r, 800));

      // Submit answers
      try {
        const res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: WebApp.initData,
            answers: {
              ageVerified: newAnswers.age === 'yes',
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

    setCurrentStep(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="px-6 pt-4 text-xs text-gray-500">
        Step {step.step} of {TOTAL_STEPS}
      </div>

      {/* Question */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        <h1 className="text-xl font-bold mb-2">{step.question}</h1>
        {step.subtitle && (
          <p className="text-sm text-gray-400 mb-8">{step.subtitle}</p>
        )}

        {/* Options */}
        <div className="flex flex-col gap-3 flex-1">
          {step.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`
                w-full text-left px-4 py-4 rounded-xl border transition-all
                ${selected === opt.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleNext}
          disabled={!selected || processing}
          className={`
            mt-6 w-full py-4 rounded-xl font-semibold text-sm transition-all
            ${selected && !processing
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {processing ? '⏳ Processing your answers...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
```

---

## File: app/result/page.tsx — Result Screen

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResultContent() {
  const params = useSearchParams();
  const segment = params.get('segment');
  const exit = params.get('exit');

  if (exit === 'age') {
    return <SoftExit message="You must be 18 or over to continue." showChannel={false} />;
  }

  if (exit === 'not_ready') {
    return (
      <SoftExit
        message="No problem — join the free channel to follow along and come back when you're ready to start."
        showChannel={true}
      />
    );
  }

  if (segment === 'HIGH') return <HighResult />;
  if (segment === 'MID') return <MidResult />;
  return <LowResult />;
}

function HighResult() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-3">You've been pre-approved</h1>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
        Based on your answers, a specialist from our team is being assigned to your application now.
      </p>

      <div className="w-full bg-gray-900 rounded-xl p-4 mb-8 text-left text-sm">
        <p className="text-emerald-400 font-semibold mb-2">⚡ What happens next</p>
        <ul className="text-gray-400 space-y-1">
          <li>• Join the free signals channel below</li>
          <li>• You'll receive a message from our team shortly</li>
          <li>• Reply <strong className="text-white">READY</strong> to confirm your availability</li>
        </ul>
      </div>

      <a
        href={process.env.NEXT_PUBLIC_CHANNEL_LINK}
        className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl text-center mb-4"
      >
        🚀 Join the Channel
      </a>

      <p className="text-xs text-gray-600">
        Spots are limited — applications are reviewed in real time
      </p>
    </div>
  );
}

function MidResult() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📈</div>
      <h1 className="text-2xl font-bold mb-3">Welcome to GTMO Trading</h1>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
        Join the free channel, follow the live trades, and when you're ready to go deeper — our team will be here.
      </p>

      <a
        href={process.env.NEXT_PUBLIC_CHANNEL_LINK}
        className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl text-center"
      >
        📊 Join the Signals Channel
      </a>
    </div>
  );
}

function LowResult() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📚</div>
      <h1 className="text-2xl font-bold mb-3">Start Here</h1>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
        Join the free channel, see how real trading works, and come back when you're ready to take the next step.
      </p>

      <a
        href={process.env.NEXT_PUBLIC_CHANNEL_LINK}
        className="w-full bg-white text-black font-bold py-4 rounded-xl text-center"
      >
        👀 Join Free Channel
      </a>
    </div>
  );
}

function SoftExit({ message, showChannel }: { message: string; showChannel: boolean }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">👋</div>
      <p className="text-gray-300 mb-8 text-sm leading-relaxed">{message}</p>
      {showChannel && (
        <a
          href={process.env.NEXT_PUBLIC_CHANNEL_LINK}
          className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl text-center"
        >
          Join Free Channel
        </a>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
```
