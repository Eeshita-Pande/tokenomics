import "server-only";
import { db, schema } from "@/db";
import type { AiEconomicsFact, AiSource } from "@/db/schema";
import type { EnrichedFact, Metric, Quality } from "@/lib/ai-economics";

function parseSources(raw: string): AiSource[] {
  try {
    return JSON.parse(raw) as AiSource[];
  } catch {
    return [];
  }
}

function enrich(f: AiEconomicsFact): EnrichedFact {
  return {
    ticker: f.companyTicker,
    metric: f.metric as Metric,
    fy: f.fiscalYear,
    value: f.valueUsd,
    low: f.valueLowUsd,
    high: f.valueHighUsd,
    quality: f.dataQuality as Quality,
    methodology: f.methodology,
    sources: parseSources(f.sources),
    note: f.note,
  };
}

export async function getAllAiFacts(): Promise<EnrichedFact[]> {
  const rows = db.select().from(schema.aiEconomicsFacts).all();
  return rows.map(enrich);
}
