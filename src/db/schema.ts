import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  cik: text("cik").primaryKey(),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  segment: text("segment"),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  fiscalYearEnd: text("fiscal_year_end"),
  ppeUsefulLifeYears: real("ppe_useful_life_years"),
  notes: text("notes"),
});

export const aiEconomicsFacts = sqliteTable(
  "ai_economics_facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyTicker: text("company_ticker")
      .notNull()
      .references(() => companies.ticker),
    metric: text("metric").notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    valueUsd: real("value_usd").notNull(),
    valueLowUsd: real("value_low_usd"),
    valueHighUsd: real("value_high_usd"),
    dataQuality: text("data_quality").notNull(),
    methodology: text("methodology").notNull(),
    sources: text("sources").notNull(),
    note: text("note"),
    lastVerifiedAt: text("last_verified_at").notNull(),
  },
  (t) => ({
    uniqAi: uniqueIndex("uniq_ai_fact").on(
      t.companyTicker,
      t.metric,
      t.fiscalYear,
    ),
    byMetric: index("by_ai_metric").on(t.metric, t.fiscalYear),
  }),
);

export type DataQuality = "sourced" | "calculated" | "inconsistent" | "estimated";
export type AiMetric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit";
export type AiSource = { name: string; url: string; date?: string; snippet?: string };

export type AiEconomicsFact = typeof aiEconomicsFacts.$inferSelect;

export const financialFacts = sqliteTable(
  "financial_facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cik: text("cik")
      .notNull()
      .references(() => companies.cik),
    segment: text("segment"),
    concept: text("concept").notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    fiscalPeriod: text("fiscal_period").notNull(),
    periodStart: text("period_start"),
    periodEnd: text("period_end").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    form: text("form").notNull(),
    accn: text("accn"),
    filedAt: text("filed_at"),
    sourceUrl: text("source_url"),
  },
  (t) => ({
    uniqFact: uniqueIndex("uniq_fact").on(
      t.cik,
      t.segment,
      t.concept,
      t.fiscalYear,
      t.fiscalPeriod,
      t.accn,
    ),
    byCikConcept: index("by_cik_concept").on(t.cik, t.segment, t.concept),
  }),
);

export const dataPoints = sqliteTable("data_points", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cik: text("cik").references(() => companies.cik),
  ticker: text("ticker"),
  claimType: text("claim_type").notNull(),
  claim: text("claim").notNull(),
  value: real("value"),
  unit: text("unit"),
  period: text("period"),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name"),
  confidence: real("confidence"),
  retrievedAt: text("retrieved_at").notNull(),
});

export const sourceFeeds = sqliteTable("source_feeds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  kind: text("kind").notNull(),
  lastSeenGuid: text("last_seen_guid"),
  lastEtag: text("last_etag"),
  lastModified: text("last_modified"),
  lastCheckedAt: text("last_checked_at"),
});

export const ingestEvents = sqliteTable("ingest_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  occurredAt: text("occurred_at").notNull(),
  source: text("source").notNull(),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  detailUrl: text("detail_url"),
  cik: text("cik"),
});

export type Company = typeof companies.$inferSelect;
export type FinancialFact = typeof financialFacts.$inferSelect;
export type DataPoint = typeof dataPoints.$inferSelect;
