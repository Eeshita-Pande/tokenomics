import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  YEARS,
  type EnrichedFact,
} from "@/lib/ai-economics";
import { COMPANY_COLORS } from "@/components/chart/palette";
import type { CombinedDatum } from "@/components/chart/CombinedRevenueProfitChart";
import type { CumulativeDatum } from "@/components/chart/CumulativeNetChart";

// Combined Revenue + Operating Profit view.
// Companies are sorted by descending 2026 AI revenue; that order is reused for
// every year row so a company's vertical position stays stable across years.
export function buildCombinedData(facts: EnrichedFact[]): {
  data: CombinedDatum[];
  tickers: string[];
} {
  const revByCell = new Map<string, EnrichedFact>();
  const profByCell = new Map<string, EnrichedFact>();
  for (const f of facts) {
    if (f.metric === "ai_revenue") revByCell.set(`${f.fy}|${f.ticker}`, f);
    else if (f.metric === "ai_operating_profit")
      profByCell.set(`${f.fy}|${f.ticker}`, f);
  }

  const latestYear = Math.max(...YEARS);
  const tickers = [...COMPANY_ORDER].sort((a, b) => {
    const ra = revByCell.get(`${latestYear}|${a}`)?.value ?? -Infinity;
    const rb = revByCell.get(`${latestYear}|${b}`)?.value ?? -Infinity;
    if (rb !== ra) return rb - ra;
    return COMPANY_ORDER.indexOf(a) - COMPANY_ORDER.indexOf(b);
  });

  const data: CombinedDatum[] = [];
  for (const year of YEARS) {
    for (const ticker of tickers) {
      const r = revByCell.get(`${year}|${ticker}`);
      const p = profByCell.get(`${year}|${ticker}`);
      data.push({
        year,
        ticker,
        label: `${COMPANY_LABEL[ticker]} · ${year}`,
        color: COMPANY_COLORS[ticker] ?? "#111",
        revenue: r?.value ?? null,
        profit: p?.value ?? null,
        revenueNote: r?.note ?? null,
        profitNote: p?.note ?? null,
        revenueSources: r?.sources ?? [],
        profitSources: p?.sources ?? [],
        revenueMethodology: r?.methodology ?? "",
        profitMethodology: p?.methodology ?? "",
      });
    }
  }
  return { data, tickers };
}

// Cumulative AI operating profit − cumulative AI capex (2022–2026), one bar
// per company, sorted descending.
export function buildCumulativeData(facts: EnrichedFact[]): CumulativeDatum[] {
  const sumByTicker: Record<
    string,
    {
      cumProfit: number;
      cumCapex: number;
      profitSources: EnrichedFact["sources"];
      capexSources: EnrichedFact["sources"];
    }
  > = {};
  for (const t of COMPANY_ORDER) {
    sumByTicker[t] = {
      cumProfit: 0,
      cumCapex: 0,
      profitSources: [],
      capexSources: [],
    };
  }
  for (const f of facts) {
    if (!(f.ticker in sumByTicker)) continue;
    if (f.metric === "ai_operating_profit") {
      sumByTicker[f.ticker].cumProfit += f.value;
      sumByTicker[f.ticker].profitSources.push(...f.sources);
    } else if (f.metric === "ai_capex") {
      sumByTicker[f.ticker].cumCapex += f.value;
      sumByTicker[f.ticker].capexSources.push(...f.sources);
    }
  }
  const rows: CumulativeDatum[] = COMPANY_ORDER.map((t) => {
    const s = sumByTicker[t];
    return {
      ticker: t,
      label: COMPANY_LABEL[t],
      color: COMPANY_COLORS[t] ?? "#111",
      value: s.cumProfit - s.cumCapex,
      cumProfit: s.cumProfit,
      cumCapex: s.cumCapex,
      profitSources: s.profitSources,
      capexSources: s.capexSources,
    };
  });
  rows.sort((a, b) => b.value - a.value);
  return rows;
}
