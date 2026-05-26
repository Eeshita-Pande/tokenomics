import { db, schema } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { groupFactsToPeriods, type PeriodRow } from "@/lib/views";

export const AI_SEGMENT_BY_TICKER: Record<string, string | null> = {
  AMZN: "AWS",
  GOOG: "Google Cloud",
  NVDA: "Data Center",
  DUOL: null,
};

export type ViewScope = "segment" | "whole_company";

export async function getCompanies() {
  return db.select().from(schema.companies).all();
}

export function getFactsForScope(cik: string, scope: ViewScope, ticker: string) {
  const segment = scope === "segment" ? AI_SEGMENT_BY_TICKER[ticker] : null;
  if (scope === "segment" && segment) {
    return db
      .select()
      .from(schema.financialFacts)
      .where(
        and(
          eq(schema.financialFacts.cik, cik),
          eq(schema.financialFacts.segment, segment),
        ),
      )
      .all();
  }
  return db
    .select()
    .from(schema.financialFacts)
    .where(
      and(
        eq(schema.financialFacts.cik, cik),
        isNull(schema.financialFacts.segment),
      ),
    )
    .all();
}

export async function getCompanyByTicker(ticker: string) {
  const upper = ticker.toUpperCase();
  const company = db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.ticker, upper))
    .get();
  if (!company) return null;

  const wholeFacts = getFactsForScope(company.cik, "whole_company", upper);
  const segmentFacts = getFactsForScope(company.cik, "segment", upper);

  const wholePeriods = groupFactsToPeriods(wholeFacts);
  const segmentPeriods = groupFactsToPeriods(segmentFacts);

  return {
    company,
    aiSegment: AI_SEGMENT_BY_TICKER[upper] ?? null,
    wholePeriods,
    segmentPeriods,
  };
}

export async function getAllCompanyData(): Promise<
  {
    ticker: string;
    name: string;
    segment: string | null;
    cik: string;
    aiSegment: string | null;
    wholePeriods: PeriodRow[];
    segmentPeriods: PeriodRow[];
  }[]
> {
  const companies = db.select().from(schema.companies).all();
  return companies.map((c) => ({
    ticker: c.ticker,
    name: c.name,
    segment: c.segment,
    cik: c.cik,
    aiSegment: AI_SEGMENT_BY_TICKER[c.ticker] ?? null,
    wholePeriods: groupFactsToPeriods(
      getFactsForScope(c.cik, "whole_company", c.ticker),
    ),
    segmentPeriods: groupFactsToPeriods(
      getFactsForScope(c.cik, "segment", c.ticker),
    ),
  }));
}
