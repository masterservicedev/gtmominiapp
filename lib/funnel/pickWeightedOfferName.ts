/**
 * Pick one offer `name` using integer weights (higher = more likely).
 * Missing, non-finite, or non-positive weights are treated as 1.
 */
export function pickWeightedOfferName(
  rows: ReadonlyArray<{ name: string; weight: number | null }>,
): string {
  if (rows.length === 0) {
    throw new Error("pickWeightedOfferName: empty rows");
  }
  if (rows.length === 1) return rows[0]!.name;

  const weights = rows.map((r) => {
    const w = r.weight;
    if (w == null || !Number.isFinite(w) || w <= 0) return 1;
    return Math.max(1, Math.floor(w));
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return rows[Math.floor(Math.random() * rows.length)]!.name;
  }
  let roll = Math.random() * sum;
  for (let i = 0; i < rows.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return rows[i]!.name;
  }
  return rows[rows.length - 1]!.name;
}
