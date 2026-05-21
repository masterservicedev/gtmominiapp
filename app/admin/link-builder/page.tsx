"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../_components/adminApi";

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_BOT_USERNAME?.trim() || "YourMiniAppBot";

const TRAFFIC_SOURCES = [
  {
    id: "push_voluum",
    label: "Push Ads",
    description: "Push notification ads routed through Voluum for tracking",
    icon: "📡",
    cidMacro: "{click_id}",
    sourceValue: "push",
    hint: "Your push network fills in the click ID. Paste this link as the Voluum campaign destination (offer URL).",
  },
  {
    id: "voluum_direct",
    label: "Voluum direct",
    description: "Any paid source tracked directly through Voluum",
    icon: "🎯",
    cidMacro: "{clickid}",
    sourceValue: "voluum",
    hint: "Paste this URL as the destination in your Voluum campaign. Voluum will insert the click ID automatically.",
  },
  {
    id: "sms",
    label: "SMS",
    description:
      "Text campaigns where each send gets its own tracking key (Voluum / Edge Pixel style)",
    icon: "💬",
    cidMacro: "{{{dynamic}}}",
    sourceValue: "sms",
    hint: "Put this link in your offer URL where the platform expects the dynamic key — it is replaced per text send. Match lead/sale postbacks to the same key.",
  },
  {
    id: "email",
    label: "Email",
    description: "Newsletters, cold outreach, or partner mailings",
    icon: "✉️",
    cidMacro: null as string | null,
    sourceValue: "email",
    hint: "Use in email buttons or links. Add UTM tags in your ESP if you need more detail than campaign name alone.",
  },
  {
    id: "referral",
    label: "Referral link",
    description: "Shared by an existing user or affiliate",
    icon: "🔗",
    cidMacro: null as string | null,
    sourceValue: "referral",
    hint: "Use this link when sharing with affiliates or people who will refer others to the app.",
  },
  {
    id: "organic",
    label: "Organic / channel post",
    description: "Posted in your Telegram channel or other organic placement",
    icon: "📢",
    cidMacro: null as string | null,
    sourceValue: "organic",
    hint: "Use this link for posts in your free channel or any non-paid placement.",
  },
] as const;

const CAMPAIGN_SUGGESTIONS = [
  "gold_signals",
  "vip_launch",
  "school_launch",
  "fx_basics",
  "ebook_promo",
];

type SavedLink = {
  id: string;
  source: string;
  campaign: string;
  startParam: string;
  telegramLink: string;
  createdAt: string;
};

function sourceLabelFor(sourceValue: string): string {
  return (
    TRAFFIC_SOURCES.find((s) => s.sourceValue === sourceValue)?.label ??
    sourceValue
  );
}

function sanitiseCampaign(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
}

/** Matches greedy `cid_*_src_*_cmp_*` (optional `_var_*`) in `lib/startParam.ts`. */
function buildStartParam(
  cidMacro: string | null,
  source: string,
  campaign: string,
): string {
  if (cidMacro) {
    return `cid_${cidMacro}_src_${source}_cmp_${campaign}`;
  }
  return `src_${source}_cmp_${campaign}`;
}

function buildTelegramLink(startParam: string): string {
  const user = BOT_USERNAME.replace(/^@/, "");
  return `https://t.me/${user}/app?startapp=${encodeURIComponent(startParam)}`;
}

function StepLabel({
  n,
  label,
  done,
}: {
  n: number;
  label: string;
  done: boolean;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <div
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done
            ? "border border-emerald-500 bg-emerald-500 text-black"
            : "border border-zinc-800 bg-zinc-900 text-zinc-500"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <div
        className={`text-sm font-semibold ${done ? "text-white" : "text-zinc-500"}`}
      >
        {label}
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        copied
          ? "border border-emerald-500 bg-emerald-500 text-black"
          : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
      }`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function LinkCard({
  title,
  description,
  link,
  hint,
}: {
  title: string;
  description: string;
  link: string;
  hint?: string;
}) {
  return (
    <div className="mb-2.5 rounded-lg border border-emerald-500/20 bg-zinc-950 px-4 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-0.5 text-xs text-zinc-500">{description}</div>
        </div>
        <CopyButton text={link} />
      </div>
      <div className="mb-2 break-all rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-400">
        {link}
      </div>
      {hint ? (
        <p className="flex gap-2 text-xs leading-relaxed text-zinc-500">
          <span aria-hidden>💡</span>
          <span>{hint}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function LinkBuilderPage() {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNaming, setShowNaming] = useState(false);

  const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
  const sanitised = sanitiseCampaign(campaign);
  const canGenerate = Boolean(sourceId && sanitised.length > 0);

  const startParam =
    canGenerate && source
      ? buildStartParam(source.cidMacro, source.sourceValue, sanitised)
      : null;
  const telegramLink = startParam ? buildTelegramLink(startParam) : null;

  const loadSavedLinks = useCallback(async () => {
    try {
      const res = await adminApi("/api/admin/campaign-links");
      if (!res.ok) return;
      const data = (await res.json()) as { links?: SavedLink[] };
      const rows = (data.links ?? []).map((row) => ({
        ...row,
        createdAt:
          typeof row.createdAt === "string"
            ? row.createdAt
            : new Date(row.createdAt as string).toISOString(),
      }));
      setSavedLinks(rows);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadSavedLinks();
  }, [loadSavedLinks]);

  const saveLink = useCallback(async () => {
    if (!telegramLink || !source || !startParam) return;
    const res = await adminApi("/api/admin/campaign-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: source.sourceValue,
        campaign: sanitised,
        startParam,
        telegramLink,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { link: SavedLink };
    const link = {
      ...data.link,
      createdAt:
        typeof data.link.createdAt === "string"
          ? data.link.createdAt
          : new Date(data.link.createdAt as string).toISOString(),
    };
    setSavedLinks((prev) => [link, ...prev]);
    setLinkLabel("");
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 2000);
  }, [telegramLink, source, startParam, sanitised]);

  const deleteLink = useCallback(async (id: string) => {
    await adminApi(`/api/admin/campaign-links/${id}`, { method: "DELETE" });
    setSavedLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const trimmedCampaign = campaign.trim();
  const campaignNeedsSanitiseHint =
    trimmedCampaign.length > 0 &&
    sanitised !== trimmedCampaign.toLowerCase();

  const clickIdSummary =
    source?.cidMacro == null
      ? "Not tracked"
      : source.id === "push_voluum"
        ? "Auto-filled by your push ad network"
        : source.id === "sms"
          ? "Replaced per send by your SMS / tracker (dynamic key)"
          : "Auto-filled by Voluum";

  return (
    <div className="space-y-8 pb-10">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-500/90">
          Link builder
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white">
          Build your tracking link
        </h1>
        <p className="mx-auto mt-1 max-w-xl text-sm text-zinc-500">
          Pick a source and campaign — the mini app assigns the experience when
          they open (from your offers rotation). No variant in the link.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:items-start">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
            <StepLabel
              n={1}
              label="Where is this traffic coming from?"
              done={Boolean(sourceId)}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {TRAFFIC_SOURCES.map((s) => {
                const selected = sourceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSourceId(s.id)}
                    className={`rounded-lg border px-4 py-3.5 text-left transition-colors ${
                      selected
                        ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="mb-1.5 text-lg" aria-hidden>
                      {s.icon}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        selected ? "text-emerald-400" : "text-zinc-200"
                      }`}
                    >
                      {s.label}
                    </div>
                    <p className="mt-1 text-xs leading-snug text-zinc-500">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
            <StepLabel
              n={2}
              label="What is this campaign called?"
              done={sanitised.length > 0}
            />
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. gold_signals or vip_launch_uae"
              className="mb-2.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-sm text-white outline-none ring-emerald-500/25 focus:ring-2"
            />
            {campaignNeedsSanitiseHint ? (
              <div className="mb-2.5 flex gap-2 text-xs text-amber-400/90">
                <span aria-hidden>⚠</span>
                <span>
                  Spaces and special characters are removed. Saved value:{" "}
                  <strong className="font-mono text-amber-300">{sanitised}</strong>
                </span>
              </div>
            ) : null}
            <div className="mb-2.5 flex flex-wrap gap-2">
              {CAMPAIGN_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setCampaign(sug)}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                >
                  {sug}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNaming((v) => !v)}
              className="text-xs font-medium text-emerald-400 underline-offset-2 hover:underline"
            >
              {showNaming ? "Hide" : "Show"} naming guide
            </button>
            {showNaming ? (
              <div className="mt-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3.5">
                <p className="text-xs font-semibold text-zinc-300">Naming rules</p>
                <ul className="mt-2 space-y-2 text-xs text-zinc-500">
                  <li>
                    <span className="font-semibold text-zinc-400">Lowercase only</span>
                    <span className="mt-0.5 block font-mono text-[11px]">
                      gold_signals ✓ · Gold_Signals becomes gold_signals
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-400">
                      Underscores, no spaces
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px]">
                      vip_launch ✓ · &quot;vip launch&quot; becomes vip_launch
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-400">
                      Same name everywhere you run the same idea
                    </span>
                    <span className="mt-0.5 block">
                      Keeps reporting in one place in the admin traffic view.
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-400">Patterns</span>
                    <span className="mt-0.5 block font-mono text-[11px]">
                      product_market · product_descriptor (e.g. school_uae,
                      fx_basics_may)
                    </span>
                  </li>
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <div className="lg:sticky lg:top-24">
          <div
            className={`rounded-xl border px-5 py-5 transition-colors ${
              canGenerate ? "border-emerald-500/30" : "border-zinc-800"
            } bg-zinc-950/50`}
          >
            <h2 className="text-[15px] font-semibold text-white">Your link</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {canGenerate
                ? "Ready to use — copy and paste into your campaign."
                : "Complete both steps to generate your link."}
            </p>

            {!canGenerate || !source || !telegramLink ? (
              <div className="mt-4 rounded-lg bg-zinc-950 py-8 text-center">
                <div className="mb-2 text-2xl opacity-40" aria-hidden>
                  🔗
                </div>
                <p className="text-sm text-zinc-600">
                  {!sourceId
                    ? "Choose where the traffic comes from."
                    : "Enter a campaign name."}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <LinkCard
                    title={
                      source.cidMacro
                        ? "Voluum destination URL"
                        : "Campaign link"
                    }
                    description={
                      source.cidMacro
                        ? "Paste this as the destination in your Voluum campaign."
                        : "Share or paste this link in your post or message."
                    }
                    link={telegramLink}
                    hint={source.hint}
                  />
                </div>

                {source.id === "push_voluum" ? (
                  <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3.5">
                    <p className="text-xs font-semibold text-amber-400/95">
                      Push ads + Voluum
                    </p>
                    <ol className="mt-2 list-none space-y-1.5 text-xs leading-relaxed text-zinc-400">
                      {[
                        "In your push ad network, create the campaign.",
                        "Set the ad destination to your Voluum campaign tracking link.",
                        "In Voluum, set the offer URL to the link shown above.",
                        "Voluum replaces the placeholder with the real click ID automatically.",
                        "When someone finishes the questionnaire, conversions can report back to Voluum.",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="w-4 shrink-0 font-medium text-amber-500/90">
                            {i + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {source.id === "sms" ? (
                  <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3.5">
                    <p className="text-xs font-semibold text-amber-400/95">
                      SMS + dynamic key (Voluum / Edge Pixel)
                    </p>
                    <ol className="mt-2 list-none space-y-1.5 text-xs leading-relaxed text-zinc-400">
                      {[
                        "In your tracker, create an offer whose destination URL includes the dynamic placeholder where the per-send key should go (same pattern as your “Create Offers” URL field).",
                        "Paste this Mini App link into that URL, keeping the placeholder where your platform expects it — each text send gets its own key.",
                        "Use your tracker’s lead and sale postbacks so questionnaire completes and deposits match that key.",
                        "If you use “get number from dynamic”, wire your tracker’s number postback so inbound SMS can still match the same key.",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="w-4 shrink-0 font-medium text-amber-500/90">
                            {i + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div className="mb-3.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-xs">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                    <dt className="text-zinc-500">Source</dt>
                    <dd className="text-zinc-200">{source.label}</dd>
                    <dt className="text-zinc-500">Campaign</dt>
                    <dd className="font-mono text-zinc-200">{sanitised}</dd>
                    <dt className="text-zinc-500">Click ID</dt>
                    <dd className="text-zinc-200">{clickIdSummary}</dd>
                  </dl>
                  <p className="mt-3 border-t border-zinc-800/90 pt-3 text-[11px] leading-relaxed text-zinc-500">
                    First-screen experience is chosen on open from your active
                    offers rotation (database). Change rotation there — links stay
                    the same.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none ring-emerald-500/25 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => void saveLink()}
                    className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                      saveSuccess
                        ? "border border-emerald-500 bg-emerald-500 text-black"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {saveSuccess ? "Saved" : "Save link"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-4">
            <h2 className="text-sm font-semibold text-white">How tracking works</h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed">
              <li className="flex gap-2.5">
                <span className="shrink-0" aria-hidden>
                  📡
                </span>
                <span>
                  <span className="font-semibold text-zinc-300">Source</span>
                  <span className="mt-0.5 block text-zinc-500">
                    Tells you which channel or partner sent the person (paid
                    network, referral, organic post, and so on).
                  </span>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0" aria-hidden>
                  🏷
                </span>
                <span>
                  <span className="font-semibold text-zinc-300">Campaign</span>
                  <span className="mt-0.5 block text-zinc-500">
                    Your internal name for this push so you can compare results
                    side by side in analytics.
                  </span>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0" aria-hidden>
                  🎨
                </span>
                <span>
                  <span className="font-semibold text-zinc-300">Experience</span>
                  <span className="mt-0.5 block text-zinc-500">
                    Which funnel / first screen someone gets is decided when they
                    open the mini app (from your offers setup), not from this link.
                    Traffic still shows variant breakdown per user after first open.
                  </span>
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0" aria-hidden>
                  🔑
                </span>
                <span>
                  <span className="font-semibold text-zinc-300">Click ID</span>
                  <span className="mt-0.5 block text-zinc-500">
                    A unique ID per click or per SMS send. Push networks, Voluum,
                    or SMS trackers replace the placeholder so later steps can
                    match back to the original send.
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {savedLinks.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
          <h2 className="text-[15px] font-semibold text-white">Saved links</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Saved in the database — persists across sessions and devices.
          </p>
          <ul className="mt-4 space-y-2">
            {savedLinks.map((saved) => (
              <li
                key={saved.id}
                className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-200">
                    {sourceLabelFor(saved.source)} · {saved.campaign}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-500">
                      {sourceLabelFor(saved.source)}
                    </span>
                    <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                      {saved.campaign}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-zinc-600">
                    {saved.telegramLink}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <CopyButton text={saved.telegramLink} />
                  <button
                    type="button"
                    aria-label="Remove saved link"
                    onClick={() => void deleteLink(saved.id)}
                    className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
