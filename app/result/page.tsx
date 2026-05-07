"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const channelLink = process.env.NEXT_PUBLIC_CHANNEL_LINK || "#";

function ResultContent() {
  const params = useSearchParams();
  const segment = params.get("segment");
  const exit = params.get("exit");

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

  if (segment === "HIGH") return <HighResult />;
  if (segment === "MID") return <MidResult />;
  return <LowResult />;
}

function HighResult() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-3">You&apos;ve been pre-approved</h1>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
        Based on your answers, a specialist from our team is being assigned to
        your application now.
      </p>

      <div className="w-full bg-gray-900 rounded-xl p-4 mb-8 text-left text-sm">
        <p className="text-emerald-400 font-semibold mb-2">
          ⚡ What happens next
        </p>
        <ul className="text-gray-400 space-y-1">
          <li>• Join the free signals channel below</li>
          <li>• You&apos;ll receive a message from our team shortly</li>
          <li>
            • Reply <strong className="text-white">READY</strong> to confirm
            your availability
          </li>
        </ul>
      </div>

      <a
        href={channelLink}
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
        Join the free channel, follow the live trades, and when you&apos;re
        ready to go deeper — our team will be here.
      </p>

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
