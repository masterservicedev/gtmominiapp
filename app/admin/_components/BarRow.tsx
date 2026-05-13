export function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="truncate text-zinc-300 pr-2" title={label}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-zinc-400">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500/80 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
