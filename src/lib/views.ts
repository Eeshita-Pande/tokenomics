import type { FinancialFact } from "@/db/schema";

export type ViewMode =
  | "gaap"
  | "capex_excluded"
  | "capex_fully_expensed"
  | "capex_amortized_sl"
  | "capex_amortized_ddb";

export const VIEW_MODES: { id: ViewMode; label: string; blurb: string }[] = [
  {
    id: "gaap",
    label: "GAAP as-reported",
    blurb: "Income statement as filed. The baseline.",
  },
  {
    id: "capex_excluded",
    label: "Capex excluded",
    blurb: "Strip D&A and capex from costs. What bulls quote.",
  },
  {
    id: "capex_fully_expensed",
    label: "Capex fully expensed",
    blurb: "Treat 100% of capex as current-period cost. What bears quote.",
  },
  {
    id: "capex_amortized_sl",
    label: "Capex amortized — straight-line",
    blurb: "Reconstruct D&A from a configurable useful life.",
  },
  {
    id: "capex_amortized_ddb",
    label: "Capex amortized — accelerated (DDB)",
    blurb: "Double-declining balance — the AWS scenario.",
  },
];

export type PeriodRow = {
  fiscalYear: number;
  fiscalPeriod: string;
  periodEnd: string;
  revenue: number;
  costOfRevenue: number;
  opex: number;
  operatingIncome: number | null;
  capex: number;
  depreciation: number;
};

export type ComputedRow = PeriodRow & {
  view: ViewMode;
  adjustedCosts: number;
  adjustedProfit: number;
  adjustedMargin: number;
  yoyRevenueDelta: number | null;
  yoyMarginDelta: number | null;
};

const CONCEPTS = {
  revenue: [
    "SegmentRevenue",
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
  ],
  costOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold"],
  opex: ["SegmentOperatingExpenses", "OperatingExpenses"],
  operatingIncome: ["SegmentOperatingIncome"],
  capex: [
    "SegmentCapex",
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PaymentsToAcquireProductiveAssets",
  ],
  depreciation: [
    "SegmentDepreciation",
    "DepreciationDepletionAndAmortization",
    "DepreciationAndAmortization",
    "Depreciation",
  ],
} as const;

export function pickConceptValue(
  facts: FinancialFact[],
  preferredConcepts: readonly string[],
  fiscalYear: number,
  fiscalPeriod: string,
): number {
  for (const concept of preferredConcepts) {
    const hits = facts.filter(
      (f) =>
        f.concept === concept &&
        f.fiscalYear === fiscalYear &&
        f.fiscalPeriod === fiscalPeriod,
    );
    if (hits.length) {
      hits.sort((a, b) => (b.filedAt ?? "").localeCompare(a.filedAt ?? ""));
      return hits[0].value;
    }
  }
  return 0;
}

export function groupFactsToPeriods(facts: FinancialFact[]): PeriodRow[] {
  const keys = new Set<string>();
  for (const f of facts) keys.add(`${f.fiscalYear}|${f.fiscalPeriod}`);

  const rows: PeriodRow[] = [];
  for (const key of keys) {
    const [yearStr, period] = key.split("|");
    const fiscalYear = Number(yearStr);
    const sample = facts.find(
      (f) => f.fiscalYear === fiscalYear && f.fiscalPeriod === period,
    );
    if (!sample) continue;
    const opIncomeHit = pickConceptValue(
      facts,
      CONCEPTS.operatingIncome,
      fiscalYear,
      period,
    );
    rows.push({
      fiscalYear,
      fiscalPeriod: period,
      periodEnd: sample.periodEnd,
      revenue: pickConceptValue(facts, CONCEPTS.revenue, fiscalYear, period),
      costOfRevenue: pickConceptValue(
        facts,
        CONCEPTS.costOfRevenue,
        fiscalYear,
        period,
      ),
      opex: pickConceptValue(facts, CONCEPTS.opex, fiscalYear, period),
      operatingIncome: opIncomeHit !== 0 ? opIncomeHit : null,
      capex: pickConceptValue(facts, CONCEPTS.capex, fiscalYear, period),
      depreciation: pickConceptValue(
        facts,
        CONCEPTS.depreciation,
        fiscalYear,
        period,
      ),
    });
  }
  return rows
    .filter((r) => r.revenue > 0)
    .sort((a, b) => (a.periodEnd < b.periodEnd ? -1 : 1));
}

export function amortizeStraightLine(
  capexHistory: { periodEnd: string; capex: number }[],
  asOf: string,
  usefulLifeYears: number,
): number {
  const lifeQuarters = usefulLifeYears * 4;
  let total = 0;
  const asOfDate = new Date(asOf);
  for (const { periodEnd, capex } of capexHistory) {
    const d = new Date(periodEnd);
    const qDiff =
      (asOfDate.getFullYear() - d.getFullYear()) * 4 +
      Math.floor((asOfDate.getMonth() - d.getMonth()) / 3);
    if (qDiff < 0) continue;
    if (qDiff >= lifeQuarters) continue;
    total += capex / lifeQuarters;
  }
  return total;
}

export function amortizeDDB(
  capexHistory: { periodEnd: string; capex: number }[],
  asOf: string,
  usefulLifeYears: number,
): number {
  const lifeQuarters = usefulLifeYears * 4;
  const ratePerQuarter = 2 / lifeQuarters;
  let total = 0;
  const asOfDate = new Date(asOf);
  for (const { periodEnd, capex } of capexHistory) {
    const d = new Date(periodEnd);
    const qDiff =
      (asOfDate.getFullYear() - d.getFullYear()) * 4 +
      Math.floor((asOfDate.getMonth() - d.getMonth()) / 3);
    if (qDiff < 0) continue;
    if (qDiff >= lifeQuarters) continue;
    const remaining = capex * Math.pow(1 - ratePerQuarter, qDiff);
    total += remaining * ratePerQuarter;
  }
  return total;
}

export function computeRow(
  row: PeriodRow,
  view: ViewMode,
  history: PeriodRow[],
  usefulLifeYears: number,
): Omit<ComputedRow, "yoyRevenueDelta" | "yoyMarginDelta"> {
  const baseOperating =
    row.operatingIncome !== null
      ? row.revenue - row.operatingIncome
      : row.costOfRevenue + row.opex;
  let adjustedCosts: number;
  switch (view) {
    case "gaap":
      adjustedCosts = baseOperating;
      break;
    case "capex_excluded":
      adjustedCosts = baseOperating - row.depreciation;
      break;
    case "capex_fully_expensed":
      adjustedCosts = baseOperating - row.depreciation + row.capex;
      break;
    case "capex_amortized_sl": {
      const reconstructed = amortizeStraightLine(
        history.map((h) => ({ periodEnd: h.periodEnd, capex: h.capex })),
        row.periodEnd,
        usefulLifeYears,
      );
      adjustedCosts = baseOperating - row.depreciation + reconstructed;
      break;
    }
    case "capex_amortized_ddb": {
      const reconstructed = amortizeDDB(
        history.map((h) => ({ periodEnd: h.periodEnd, capex: h.capex })),
        row.periodEnd,
        usefulLifeYears,
      );
      adjustedCosts = baseOperating - row.depreciation + reconstructed;
      break;
    }
  }
  const adjustedProfit = row.revenue - adjustedCosts;
  const adjustedMargin = row.revenue > 0 ? adjustedProfit / row.revenue : 0;
  return { ...row, view, adjustedCosts, adjustedProfit, adjustedMargin };
}

export function computeSeries(
  rows: PeriodRow[],
  view: ViewMode,
  usefulLifeYears: number,
): ComputedRow[] {
  const base = rows.map((r) => computeRow(r, view, rows, usefulLifeYears));
  return base.map((row, i) => {
    const prior = base.find(
      (p) =>
        p.fiscalYear === row.fiscalYear - 1 &&
        p.fiscalPeriod === row.fiscalPeriod,
    );
    void i;
    return {
      ...row,
      yoyRevenueDelta:
        prior && prior.revenue > 0
          ? (row.revenue - prior.revenue) / prior.revenue
          : null,
      yoyMarginDelta:
        prior !== undefined ? row.adjustedMargin - prior.adjustedMargin : null,
    };
  });
}
