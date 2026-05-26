export type AiSource = { name: string; url: string; date?: string; snippet?: string };

export type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
export type Metric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit";

export const METRIC_LABELS: Record<Metric, string> = {
  ai_capex: "AI capex",
  ai_capex_amortized: "AI capex — amortized",
  ai_revenue: "AI revenue",
  ai_operating_profit: "AI operating profit",
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
      const contributingSources: AiSource[] = [];
      const seenUrls = new Set<string>();
      for (const prior of facts) {
        const age = f.fy - prior.fy;
        if (age < 0 || age >= usefulLifeYears) continue;
        amortized += prior.value / usefulLifeYears;
        for (const s of prior.sources) {
          if (!seenUrls.has(s.url)) {
            seenUrls.add(s.url);
            contributingSources.push(s);
          }
        }
      }
      out.push({
        ticker,
        metric: "ai_capex_amortized",
        fy: f.fy,
        value: amortized,
        low: null,
        high: null,
        quality: "calculated",
        methodology: `Straight-line over ${usefulLifeYears} years. Sum of capex / ${usefulLifeYears} across the prior ${usefulLifeYears} years.`,
        sources: contributingSources,
        note: null,
      });
    }
  }
  return out;
}
