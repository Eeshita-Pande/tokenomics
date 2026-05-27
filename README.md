# tokenomics

Year-by-year AI economics for Amazon, Google, Microsoft, NVIDIA, OpenAI, and Anthropic — every figure linked to a primary source.

A grouped bar chart with four metric views (AI capex, amortized capex, AI revenue, AI operating profit). Hover any bar for the value, methodology, and a clickable link to the SEC filing or primary article behind it. 2026 values are annualized from the latest filed quarter.

## Stack

- Next.js 16 (App Router, Turbopack) on Roboto + Roboto Mono.
- Drizzle ORM over SQLite locally; Postgres for production.
- Hand-rolled SVG bar chart with inline company-logo glyphs (no chart library).
- TypeScript end-to-end.

## Data model

- `ai_economics_facts` — curated, source-attributed AI-specific facts per company × year × metric. Each row carries `methodology` text and a JSON array of `sources` (name + URL).
- `financial_facts` — raw SEC EDGAR XBRL whole-company and segment facts (unused by the chart but kept for future drill-downs).

## Getting started

```bash
npm install
npx drizzle-kit push                  # create the SQLite schema locally
npx tsx scripts/seed-edgar.ts         # ~1,000 SEC XBRL facts (whole-co)
npx tsx scripts/seed-segments.ts      # ~250 segment facts (AWS, GCP, NVDA DC)
npx tsx scripts/seed-ai-economics.ts  # 73 sourced AI economics facts
npm run dev
```

`tokenomics.db` is gitignored — it's regenerable from the seed scripts above.

## Methodology

- **AI capex.** Hyperscalers (Amazon, Google, Microsoft): whole-company capex per the 10-K / 10-Q cash-flow statement, treated as AI-attributable per the MD&A "primarily for technology infrastructure" language. NVIDIA has minimal capex; OpenAI and Anthropic have no GPU PP&E (their compute is opex via multi-year cloud commitments).
- **AI capex — amortized.** Straight-line over a chosen useful life (3–8 yr slider) applied to the historical capex series.
- **AI revenue.** Cloud segment for hyperscalers (AWS, Google Cloud, Intelligent Cloud); Data Center segment for NVIDIA; total recognized revenue for OpenAI/Anthropic.
- **AI operating profit.** Cloud segment op income for hyperscalers; Compute & Networking segment income (closest Data Center proxy) for NVIDIA; total operating loss / cash burn for OpenAI/Anthropic.
- **2026 figures.** Annualized from the latest filed quarter (Q1 2026 × 4 for Amazon/Google; FY26 Q3 × 4 for Microsoft). NVIDIA FY26 ended Jan 25, 2026 — those are full-year actuals. OpenAI and Anthropic figures are annualized run-rates from the latest leak.

Anthropic revenue is reported gross of cloud-reseller (AWS Bedrock, Google Vertex). Net basis is ~20% lower.

## Status

Research, not investment advice.
