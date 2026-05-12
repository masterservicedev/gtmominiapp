"use client";

import { PreApprovedConfetti } from "@/components/funnel/PreApprovedConfetti";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const channelLink = process.env.NEXT_PUBLIC_CHANNEL_LINK || "#";

function ResultContent() {
  const params = useSearchParams();
  const segment = params.get("segment");
  const exit = params.get("exit");
  const handoff = params.get("handoff") === "1";
  const intent = params.get("intent") === "1";
  const declined = params.get("declined") === "1";

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
    return (
      <SoftExit
        message="No problem. Join the free channel — we'll send a few light follow-ups over the next couple of days if you want to revisit your offer."
        showChannel={true}
      />
    );
  }

  if (segment === "HIGH") return <HighResult inAppHandoff={handoff} />;
  if (segment === "MID") return <MidResult intentConfirmed={intent} />;
  return <LowResult />;
}

function HighResult({ inAppHandoff }: { inAppHandoff: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <PreApprovedConfetti />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[120%] max-w-2xl h-48 bg-emerald-500/15 blur-3xl rounded-full motion-safe:animate-pulse" />
      </div>

      <div className="relative w-full max-w-md animate-result-pop-in opacity-0">
        <div className="text-5xl mb-4 motion-safe:animate-[bounce_1s_ease-in-out_1]">
          ✅
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-br from-white to-emerald-100/90 bg-clip-text text-transparent">
          You&apos;ve been pre-approved
        </h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Based on your answers, a specialist from our team is being assigned to
          your application now.
        </p>

        <div className="w-full rounded-xl p-[1px] bg-gradient-to-br from-emerald-400/50 via-emerald-600/20 to-transparent mb-8 animate-result-glow">
          <div className="bg-gray-950/90 backdrop-blur-sm rounded-[11px] p-4 text-left text-sm border border-emerald-500/10">
            <p className="text-emerald-400 font-semibold mb-2">
              ⚡ What happens next
            </p>
            <ul className="text-gray-400 space-y-1">
              <li>• Join the free signals channel below</li>
              <li>• You&apos;ll receive a message from our team shortly</li>
              {inAppHandoff ? (
                <li>
                  • Check this <strong className="text-white">Telegram</strong>{" "}
                  chat — we sent your confirmed offer details for the team
                </li>
              ) : (
                <li>
                  • Reply <strong className="text-white">READY</strong> in this
                  chat if you haven&apos;t confirmed in the app yet
                </li>
              )}
            </ul>
          </div>
        </div>

        <a
          href={channelLink}
          className="block w-full bg-emerald-500 text-black font-bold py-4 rounded-xl text-center mb-4 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400 transition-colors"
        >
          🚀 Join the Channel
        </a>

        <p className="text-xs text-gray-600">
          Spots are limited — applications are reviewed in real time
        </p>
      </div>
    </div>
  );
}

function MidResult({ intentConfirmed }: { intentConfirmed: boolean }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📈</div>
      <h1 className="text-2xl font-bold mb-3">Welcome to GTMO Trading</h1>
      {intentConfirmed ? (
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Thanks — we&apos;ve recorded that you want to go deeper when the time
          is right. Join the free channel below; our team may reach out when
          capacity allows.
        </p>
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
