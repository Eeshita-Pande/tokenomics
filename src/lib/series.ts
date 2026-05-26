import {
  computeSeries,
  VIEW_MODES,
  type PeriodRow,
  type ViewMode,
} from "@/lib/views";
import type { Series } from "@/components/chart/LineChart";
import { COMPANY_COLORS, LENS_COLORS } from "@/components/chart/palette";

export type Metric =
  | "adjustedMargin"
  | "adjustedProfit"
  | "revenue"
  | "capex"
  | "capexPctRevenue";

export const METRICS: { id: Metric; label: string; isPercent: boolean }[] = [
  { id: "adjustedMargin", label: "Operating margin", isPercent: true },
  { id: "adjustedProfit", label: "Operating profit", isPercent: false },
  { id: "revenue", label: "Revenue", isPercent: false },
  { id: "capex", label: "Capex", isPercent: false },
  { id: "capexPctRevenue", label: "Capex / revenue", isPercent: true },
];

export function periodKey(fy: number, fp: string) {
  return `${fp} ${String(fy).slice(2)}`;
}

function pickMetric(
  row: {
    revenue: number;
    capex: number;
    adjustedProfit: number;
    adjustedMargin: number;
  },
  metric: Metric,
): number | null {
  switch (metric) {
    case "adjustedMargin":
      return row.adjustedMargin;
    case "adjustedProfit":
      return row.adjustedProfit;
    case "revenue":
      return row.revenue;
    case "capex":
      return row.capex;
    case "capexPctRevenue":
      return row.revenue > 0 ? row.capex / row.revenue : null;
  }
}

function unionXLabels(allLabels: string[][]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const arr of allLabels) {
    for (const l of arr) {
      if (!seen.has(l)) {
        seen.add(l);
        order.push(l);
      }
    }
  }
  return order;
}

function alignSeries(
  xLabels: string[],
  data: { x: string; y: number | null }[],
): { x: string; y: number | null }[] {
  const lookup = new Map(data.map((d) => [d.x, d.y]));
  return xLabels.map((x) => ({ x, y: lookup.get(x) ?? null }));
}

export function buildLensSeries(
  periods: PeriodRow[],
  metric: Metric,
  enabledLenses: ViewMode[],
  usefulLife: number,
): { series: Series[]; xLabels: string[] } {
  const xLabels = periods.map((p) => periodKey(p.fiscalYear, p.fiscalPeriod));
  const series: Series[] = enabledLenses.map((lens) => {
    const computed = computeSeries(periods, lens, usefulLife);
    const data = computed.map((r) => ({
      x: periodKey(r.fiscalYear, r.fiscalPeriod),
      y: pickMetric(r, metric),
    }));
    const meta = VIEW_MODES.find((v) => v.id === lens);
    return {
      id: lens,
      name: meta?.label ?? lens,
      color: LENS_COLORS[lens] ?? "#000",
      dashed:
        lens === "capex_amortized_sl" || lens === "capex_amortized_ddb",
      data: alignSeries(xLabels, data),
    };
  });
  return { series, xLabels };
}

export function buildCompanySeries(
  byTicker: { ticker: string; name: string; periods: PeriodRow[] }[],
  metric: Metric,
  lens: ViewMode,
  usefulLife: number,
): { series: Series[]; xLabels: string[] } {
  const allLabels = byTicker.map((c) =>
    c.periods.map((p) => periodKey(p.fiscalYear, p.fiscalPeriod)),
  );
  const xLabels = unionXLabels(allLabels);
  const series: Series[] = byTicker.map((c, i) => {
    const computed = computeSeries(c.periods, lens, usefulLife);
    const data = computed.map((r) => ({
      x: periodKey(r.fiscalYear, r.fiscalPeriod),
      y: pickMetric(r, metric),
    }));
    void i;
    return {
      id: c.ticker,
      name: c.ticker,
      color: COMPANY_COLORS[c.ticker] ?? "#000",
      data: alignSeries(xLabels, data),
    };
  });
  return { series, xLabels };
}
