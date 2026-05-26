import type { AiSource } from "@/db/schema";

export type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
export type Metric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit";

export const METRIC_LABELS: Record<Metric, string> = {
  ai_capex: "AI capex (annual)",
  ai_capex_amortized: "AI capex — amortized",
  ai_revenue: "AI revenue",
  ai_operating_profit: "AI operating profit",
};

export const METRIC_BLURBS: Record<Metric, string> = {
  ai_capex:
    "Annual capex outlay. For hyperscalers, whole-company capex per 10-K cash-flow statement. Off balance sheet for OpenAI/Anthropic (compute is opex). N/A for NVIDIA (chip maker, not capex-driven).",
  ai_capex_amortized:
    "Capex amortized straight-line over a chosen useful life. Tells the depreciation-flow story rather than the cash-out story. Slider toggles 3/4/5/6 years.",
  ai_revenue:
    "AI-adjacent revenue. Hyperscalers: cloud segment (AWS / Google Cloud / Intelligent Cloud). NVIDIA: Data Center segment. OpenAI/Anthropic: total recognized revenue.",
  ai_operating_profit:
    "AI-adjacent segment operating income for public companies. Total operating loss for OpenAI/Anthropic.",
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
  GOOG: "Alphabet",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  OAI: "OpenAI",
  ANTH: "Anthropic",
};

export const YEARS = [2022, 2023, 2024, 2025] as const;

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
};

export function buildAmortizedFromCapex(
  capexFacts: EnrichedFact[],
  usefulLifeYears: number,
): EnrichedFact[] {
  const byTicker = new Map<string, EnrichedFact[]>();
  for (const f of capexFacts) {
    if (f.metric !== "ai_capex") continue;
    const arr = byTicker.get(f.ticker) ?? [];
    arr.push(f);
    byTicker.set(f.ticker, arr);
  }

  const out: EnrichedFact[] = [];
  for (const [ticker, facts] of byTicker) {
    facts.sort((a, b) => a.fy - b.fy);
    for (const f of facts) {
      let amortized = 0;
      for (const prior of facts) {
        const age = f.fy - prior.fy;
        if (age < 0 || age >= usefulLifeYears) continue;
        amortized += prior.value / usefulLifeYears;
      }
      out.push({
        ticker,
        metric: "ai_capex_amortized",
        fy: f.fy,
        value: amortized,
        low: null,
        high: null,
        quality: "calculated",
        methodology: `Straight-line amortization over ${usefulLifeYears} years. Each year's amortization = sum over (year - usefulLife, year] of capex/${usefulLifeYears}. Calculated from sourced annual capex values for ${ticker}.`,
        sources: [],
        note: `Derived from ai_capex rows for ${ticker} ${usefulLifeYears}yr SL.`,
      });
    }
  }
  return out;
}
