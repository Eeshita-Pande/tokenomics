// AI-attributable share of reported D&A.
//
// The amortized chart's bar was originally whole-company reported D&A, which
// is sourced but over-counts: it carries warehouses, offices, and every other
// non-AI asset. The diamond it is compared against is AI-only. That scope
// mismatch made the *crossover* point (slider value where diamond = bar)
// meaningless, even though the direction and the widening were real.
//
// This module supplies the missing piece — an AI-only basis for the bar — by
// scaling reported D&A down to the AI share of the asset base being
// depreciated.

// Per-year AI share of whole-company capex: the carve-out that
// scripts/seed-ai-economics.ts already documents in prose. Each figure is the
// share that file states verbatim, and each equals the seeded ai_capex value
// over the whole-company capex the same methodology cites:
//
//   AMZN  2022 12.7/63.65   2023 15.8/52.73   2024 54.0/83.0
//         2025 112.0/131.82 2026 159.0/176.8
//   MSFT  2022 6.0/23.89    2023 11.2/28.11   2024 28.9/44.48
//         2025 54.9/64.55   2026 111.2/123.5
//
// GOOG and NVDA carry 1.0 because their seeded ai_capex *is* whole-company
// capex — Google by the bear-case "primarily for technology infrastructure"
// MD&A read, NVIDIA because it is fabless and its PP&E is corporate (offices,
// Eos, test/validation) rather than data-center build-out. For those two the
// AI-only basis is therefore identical to the reported basis, by construction.
//
// OAI and ANTH are absent: they hold no GPU PP&E, so reported D&A is $0 and
// there is nothing to scale.
export const CAPEX_AI_SHARE: Record<string, Partial<Record<number, number>>> = {
  AMZN: { 2022: 0.2, 2023: 0.3, 2024: 0.65, 2025: 0.85, 2026: 0.9 },
  MSFT: { 2022: 0.25, 2023: 0.4, 2024: 0.65, 2025: 0.85, 2026: 0.9 },
  GOOG: { 2022: 1, 2023: 1, 2024: 1, 2025: 1, 2026: 1 },
  NVDA: { 2022: 1, 2023: 1, 2024: 1, 2025: 1, 2026: 1 },
};

// The window of capex vintages still sitting in the depreciating asset base.
//
// Deliberately NOT the slider. Reported D&A is booked under each company's
// *actual* useful-life policy — 6 years on servers for all three hyperscalers
// (AWS moved 5yr → 6yr Jan 2024, Google 4yr → 6yr Jan 2023, Microsoft 4yr →
// 6yr FY23). The slider is a hypothetical applied to the diamond. Holding this
// window fixed keeps the bar a stable reference, so dragging the slider still
// moves only the diamond.
export const REPORTED_DA_POLICY_LIFE = 6;

export type AiDaShare = {
  share: number;
  windowYears: number[];
  // True when the window runs off the front of the capex series (which starts
  // FY22). Missing vintages are pre-AI-boom and low-share, so truncation
  // biases the share UP — a larger bar, which is the conservative direction:
  // it makes the diamond harder to clear, not easier.
  truncated: boolean;
};

// AI share of the asset base being depreciated in `fy`, capex-weighted across
// the trailing policy-life window.
//
// Not the single-year share: in FY26 Amazon's D&A covers assets bought from
// FY21 onward, when the AI share was far lower. Scaling FY26 D&A by the FY26
// share (90%) would assert that nearly the whole installed base is AI, which
// is false. Weighting by each vintage's capex fixes that.
export function aiShareOfDaBase(
  ticker: string,
  fy: number,
  aiCapexByFy: Map<number, number>,
  windowYears: number = REPORTED_DA_POLICY_LIFE,
): AiDaShare | null {
  const shares = CAPEX_AI_SHARE[ticker];
  if (!shares) return null;

  let aiCapex = 0;
  let wholeCapex = 0;
  const covered: number[] = [];

  for (let age = 0; age < windowYears; age++) {
    const y = fy - age;
    const ai = aiCapexByFy.get(y);
    const share = shares[y];
    if (ai === undefined || share === undefined || share <= 0) continue;
    aiCapex += ai;
    // Back out whole-company capex from the carve-out rather than storing it
    // twice — if a seeded ai_capex value is revised, this follows it.
    wholeCapex += ai / share;
    covered.push(y);
  }

  if (wholeCapex <= 0 || covered.length === 0) return null;

  return {
    share: aiCapex / wholeCapex,
    windowYears: covered.sort((a, b) => a - b),
    truncated: covered.length < windowYears,
  };
}
