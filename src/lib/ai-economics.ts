import { aiShareOfDaBase, REPORTED_DA_POLICY_LIFE } from "@/lib/ai-da-share";

export type AiSource = { name: string; url: string; date?: string; snippet?: string };

// Compact USD for inline use inside methodology prose.
function fmtUsd(v: number): string {
  return `$${(v / 1e9).toFixed(1)}B`;
}

export type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
export type Metric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit"
  | "ai_da_reported";

export const METRIC_LABELS: Record<Metric, string> = {
  ai_capex: "AI capex",
  ai_capex_amortized: "AI capex — amortized",
  ai_revenue: "AI revenue",
  ai_operating_profit: "AI operating profit",
  ai_da_reported: "Reported D&A",
};

export const COMPANY_ORDER = [
  "AMZN",
  "GOOG",
  "MSFT",
  "NVDA",
  "OAI",
  "ANTH",
] as const;

export const COMPANY_LABEL: Record<string, string> = {
  AMZN: "Amazon",
  GOOG: "Google",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  OAI: "OpenAI",
  ANTH: "Anthropic",
};

export const YEARS = [2022, 2023, 2024, 2025, 2026] as const;

export type EnrichedFact = {
  ticker: string;
  metric: Metric;
  fy: number;
  value: number;
  low: number | null;
  high: number | null;
  quality: Quality;
  methodology: string;
  sources: AiSource[];
  note: string | null;
  marker?: number | null;
  markerLabel?: string;
  markerMethodology?: string;
  markerSources?: AiSource[];
  // Largest the marker can possibly be (e.g., modeled at the slider's minimum
  // useful life). Used by BarChart to pin the y-axis so it doesn't rescale
  // as the user moves the slider.
  markerDomainMax?: number | null;
};

export const AMORT_SLIDER_MIN = 3;
export const AMORT_SLIDER_MAX = 8;

// Builds the data series for the AI capex — amortized chart.
// Bars = reported D&A (fixed sourced number from each company's cash-flow
// statement). Markers = modeled amortization of AI-attributable capex at the
// slider's useful life (straight-line, trailing N years ÷ N). Y-domain is
// pinned to the maximum-possible marker (modeled at slider min) so the axis
// doesn't rescale as the user drags the slider.
// Which basis the BAR is drawn on.
//   "reported" — whole-company D&A straight off the cash-flow statement.
//                Sourced, but a different scope from the diamond.
//   "ai-only"  — that same D&A scaled to the AI share of the depreciating
//                asset base. Estimated, but scope-matched to the diamond.
export type DaBasis = "reported" | "ai-only";

export function buildAmortizedFromCapex(
  capexFacts: EnrichedFact[],
  usefulLifeYears: number,
  reportedDaFacts: EnrichedFact[] = [],
  daBasis: DaBasis = "ai-only",
): EnrichedFact[] {
  const byTicker = new Map<string, EnrichedFact[]>();
  for (const f of capexFacts) {
    if (f.metric !== "ai_capex") continue;
    const arr = byTicker.get(f.ticker) ?? [];
    arr.push(f);
    byTicker.set(f.ticker, arr);
  }
  for (const arr of byTicker.values()) arr.sort((a, b) => a.fy - b.fy);

  const daByCell = new Map<string, EnrichedFact>();
  for (const f of reportedDaFacts) {
    if (f.metric !== "ai_da_reported") continue;
    daByCell.set(`${f.ticker}|${f.fy}`, f);
  }

  function modeled(
    ticker: string,
    fy: number,
    N: number,
  ): { value: number; sources: AiSource[] } {
    const facts = byTicker.get(ticker) ?? [];
    let total = 0;
    const sources: AiSource[] = [];
    const seen = new Set<string>();
    for (const prior of facts) {
      const age = fy - prior.fy;
      if (age < 0 || age >= N) continue;
      total += prior.value / N;
      for (const s of prior.sources) {
        if (!seen.has(s.url)) {
          seen.add(s.url);
          sources.push(s);
        }
      }
    }
    return { value: total, sources };
  }

  // Union of (ticker, fy) keys across both metrics so we don't drop cells.
  const keys = new Set<string>();
  for (const [ticker, facts] of byTicker) {
    for (const f of facts) keys.add(`${ticker}|${f.fy}`);
  }
  for (const f of reportedDaFacts) {
    if (f.metric === "ai_da_reported") keys.add(`${f.ticker}|${f.fy}`);
  }

  // Diamonds (the modeled-D&A marker) are only meaningful once the trailing-N
  // data window has filled in with real AI-era capex. Our seed starts at FY22,
  // so early-year diamonds undercount by construction (e.g., 2022 at 5yr has 4
  // missing prior-year capex values, all treated as $0). We suppress the
  // diamond for fy < AMORT_DIAMOND_MIN_FY but keep the bar (reported D&A),
  // which is sourced and real for every year.
  const AMORT_DIAMOND_MIN_FY = 2025;

  const out: EnrichedFact[] = [];
  for (const key of keys) {
    const [ticker, fyStr] = key.split("|");
    const fy = parseInt(fyStr, 10);
    const da = daByCell.get(key);
    const showDiamond = fy >= AMORT_DIAMOND_MIN_FY;
    const modeledNow = showDiamond
      ? modeled(ticker, fy, usefulLifeYears)
      : null;
    const modeledAtMin = showDiamond
      ? modeled(ticker, fy, AMORT_SLIDER_MIN)
      : null;

    // Skip (ticker, fy) cells with no bar AND no diamond — they'd just render
    // a "$0" label for tickers with no PP&E (OAI / ANTH). Leaving the row out
    // routes the chart through its empty-bar code path: logo at the baseline,
    // no label.
    const reportedDa = da?.value && Number.isFinite(da.value) ? da.value : 0;

    // Scale the bar to the AI share of the depreciating asset base, so it is
    // measured on the same scope as the diamond. GOOG/NVDA scale by 1.0 (their
    // capex carve-out IS whole-company), so their bars are unchanged.
    let barValue = reportedDa;
    let barQuality = da?.quality ?? "calculated";
    let barMethodology =
      da?.methodology ??
      "No reported D&A — this company does not own GPU infrastructure (compute is rented and shows up as opex, not D&A).";

    if (daBasis === "ai-only" && reportedDa > 0) {
      const aiCapexByFy = new Map(
        (byTicker.get(ticker) ?? []).map((f) => [f.fy, f.value]),
      );
      const aiShare = aiShareOfDaBase(ticker, fy, aiCapexByFy);
      if (aiShare) {
        barValue = reportedDa * aiShare.share;
        barQuality = "estimated";
        barMethodology =
          `AI-only D&A estimate: reported whole-company D&A (${fmtUsd(reportedDa)}) × ` +
          `${(aiShare.share * 100).toFixed(0)}% AI share of the depreciating asset base. ` +
          `The share is capex-weighted across the trailing ${REPORTED_DA_POLICY_LIFE}-year ` +
          `policy window (FY${aiShare.windowYears[0]}–FY${aiShare.windowYears[aiShare.windowYears.length - 1]}), ` +
          `not the single-year capex share — D&A in any year covers vintages bought when the AI ` +
          `share was lower. Window is the hyperscalers' actual 6-year server life, so it does not ` +
          `move with the slider.` +
          (aiShare.truncated
            ? ` Window is truncated at FY2022 (start of the capex series); the missing pre-AI-boom ` +
              `vintages would lower the share, so this estimate is biased high — a conservative ` +
              `bar, harder for the diamond to clear.`
            : ``) +
          (aiShare.share >= 0.999
            ? ` Unchanged from the reported basis: this company's AI capex carve-out is whole-company capex.`
            : ``);
      }
    }

    const hasDiamond = (modeledNow?.value ?? 0) > 0;
    if (barValue === 0 && !hasDiamond) continue;

    out.push({
      ticker,
      metric: "ai_capex_amortized",
      fy,
      value: barValue,
      low: da?.low ?? null,
      high: da?.high ?? null,
      quality: barQuality,
      methodology: barMethodology,
      sources: da?.sources ?? [],
      note: da?.note ?? null,
      marker: modeledNow?.value ?? null,
      markerLabel: modeledNow ? `Modeled @ ${usefulLifeYears}yr` : undefined,
      markerMethodology: modeledNow
        ? `AI capex amortized straight-line over ${usefulLifeYears} years: Σ (AI capex from prior ${usefulLifeYears} years) ÷ ${usefulLifeYears}. AI capex is the dashboard's AI-attributable carve-out (e.g., ~90% of Amazon whole-company capex for FY26), not whole-company capex. Diamonds only render for FY${AMORT_DIAMOND_MIN_FY}+ because the underlying capex series starts at FY22 — earlier years' diamonds would undercount by construction.`
        : undefined,
      markerSources: modeledNow?.sources,
      markerDomainMax: modeledAtMin?.value ?? null,
    });
  }
  out.sort(
    (a, b) => a.ticker.localeCompare(b.ticker) || a.fy - b.fy,
  );
  return out;
}
