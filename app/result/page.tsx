"use client";

import { PreApprovedConfetti } from "@/components/funnel/PreApprovedConfetti";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { productDisplayName } from "@/lib/leadCardContent";
import { parseProductKey } from "@/lib/productMatch";

const channelLink = process.env.NEXT_PUBLIC_CHANNEL_LINK || "#";

function safeProductLabel(raw: string | null): string | null {
  if (!raw) return null;
  const key = parseProductKey(raw);
  if (!key) return null;
  try {
    return productDisplayName(key);
  } catch {
    return null;
  }
}

function ResultContent() {
  const params = useSearchParams();
  const segment = params.get("segment");
  const exit = params.get("exit");
  const handoff = params.get("handoff") === "1";
  const intent = params.get("intent") === "1";
  const declined = params.get("declined") === "1";
  const productKeyRaw = params.get("productKey");
  const productLabel = safeProductLabel(productKeyRaw);
  const bundleIncluded = params.get("bundle") === "1";

  if (exit === "age") {
    return (
      <SoftExit
        message="You must be 18 or over to continue."
        showChannel={false}
      />
    );
  }

  if (exit === "not_ready") {
    return (
      <SoftExit
        message="No problem — join the free channel to follow along and come back when you're ready to start."
        showChannel={true}
      />
    );
  }

  if (
    declined &&
    (segment === "HIGH" || segment === "MID")
  ) {
    const tier = productLabel ?? "this offer";
    return (
      <SoftExit
        message={`You passed on ${tier} for now — that path is offered to others in queue. Join the channel below; you can reopen the mini app when timing lines up, and we may follow up with a short reminder.`}
        showChannel={true}
      />
    );
  }

  if (segment === "HIGH")
    return (
      <HighResult
        inAppHandoff={handoff}
        productLabel={productLabel}
        bundleIncluded={bundleIncluded}
      />
    );
  if (segment === "MID")
    return (
      <MidResult
        intentConfirmed={intent}
        productLabel={productLabel}
        bundleIncluded={bundleIncluded}
      />
    );
  return <LowResult />;
}

function HighResult({
  inAppHandoff,
  productLabel,
  bundleIncluded,
}: {
  inAppHandoff: boolean;
  productLabel: string | null;
  bundleIncluded: boolean;
}) {
  const confirmedInApp = Boolean(inAppHandoff && productLabel);
  const programmeLine = confirmedInApp
    ? `${productLabel}${bundleIncluded ? " — mini app add-on included" : ""}`
    : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <PreApprovedConfetti />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-10 text-left sm:px-8 animate-result-pop-in opacity-0">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/35 motion-safe:animate-[bounce_1s_ease-in-out_1]">
            <svg
              className="h-7 w-7 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500/90">
          Application received
        </p>

        {confirmedInApp && programmeLine ? (
          <>
            <h1 className="mb-3 text-center font-serif text-xl font-normal leading-snug tracking-tight text-zinc-50 md:text-2xl">
              We&apos;ve saved your selection
            </h1>
            <p className="mb-2 text-center text-sm font-medium leading-relaxed text-emerald-200/90">
              {programmeLine}
            </p>
            <p className="mb-8 text-center text-sm leading-relaxed text-zinc-400">
              You&apos;re pre-approved for GTMO access. A specialist will pick
              up from here and message you in this Telegram chat with next
              steps.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-center font-serif text-xl font-normal leading-snug tracking-tight text-zinc-50 md:text-2xl">
              You&apos;re pre-approved
            </h1>
            <p className="mb-8 text-center text-sm leading-relaxed text-zinc-400">
              Based on your answers, we&apos;re assigning a specialist to your
              application. They&apos;ll reach out in this chat when it&apos;s
              your turn.
            </p>
          </>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 mb-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
            What happens next
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-zinc-600 text-xs mt-0.5 shrink-0">1.</span>
              <p className="text-sm text-zinc-300 leading-snug">
                Join the free signals channel using the button below.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-600 text-xs mt-0.5 shrink-0">2.</span>
              <p className="text-sm text-zinc-300 leading-snug">
                Watch for a message from our team in this Telegram chat.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-600 text-xs mt-0.5 shrink-0">3.</span>
              {inAppHandoff ? (
                <p className="text-sm text-zinc-300 leading-snug">
                  We&apos;ve sent a short summary here so your specialist has
                  your details in one place.
                </p>
              ) : (
                <p className="text-sm text-zinc-300 leading-snug">
                  If you haven&apos;t finished confirming in the app yet, reply{" "}
                  <strong className="text-zinc-100">READY</strong> in this chat.
                </p>
              )}
            </div>
          </div>
        </div>

        <a
          href={channelLink}
          className="mb-4 w-full rounded-xl bg-emerald-500 py-4 text-center text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          Join the signals channel
        </a>

        <p className="text-center text-[10px] leading-relaxed text-zinc-600">
          We review applications in order as team capacity allows.
        </p>
      </div>
    </div>
  );
}

function MidResult({
  intentConfirmed,
  productLabel,
  bundleIncluded,
}: {
  intentConfirmed: boolean;
  productLabel: string | null;
  bundleIncluded: boolean;
}) {
  const intentLine =
    intentConfirmed && productLabel
      ? `Recorded: ${productLabel}${
          bundleIncluded ? " with mini app add-on." : "."
        }`
      : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📈</div>
      <h1 className="text-2xl font-bold mb-3">Welcome to GTMO Trading</h1>
      {intentConfirmed ? (
        <>
          {intentLine ? (
            <p className="mb-3 text-sm font-medium text-amber-200/90">
              {intentLine}
            </p>
          ) : null}
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Thanks — we&apos;ve recorded that you want to go deeper when the time
            is right. Join the free channel below; our team may reach out when
            capacity allows.
          </p>
        </>
      ) : (
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Join the free channel, follow the live trades, and when you&apos;re
          ready to go deeper — our team will be here.
        </p>
      )}

      <a
        href={channelLink}
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
        Join the free channel, see how real trading works, and come back when
        you&apos;re ready to take the next step.
      </p>

      <a
        href={channelLink}
        className="w-full bg-white text-black font-bold py-4 rounded-xl text-center"
      >
        👀 Join Free Channel
      </a>
    </div>
  );
}

function SoftExit({
  message,
  showChannel,
}: {
  message: string;
  showChannel: boolean;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">👋</div>
      <p className="text-gray-300 mb-8 text-sm leading-relaxed">{message}</p>
      {showChannel && (
        <a
          href={channelLink}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
          Loading...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
