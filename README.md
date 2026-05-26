# tokenomics

Year-by-year AI economics for Amazon, Alphabet, Microsoft, NVIDIA, OpenAI, and Anthropic — with every figure traceable to a public source.

A grouped bar chart with four metric views (AI capex, amortized capex, AI revenue, AI operating profit). Hover any bar for the value, data-quality classification, calculation methodology, and clickable source links. A numbered bibliography below the chart enumerates every source for the currently visible view.

## Stack

- Next.js 16 (App Router, Turbopack) on Roboto + Roboto Mono.
- Drizzle ORM over SQLite locally; Postgres for production.
- Hand-rolled SVG bar + line charts (no chart library).
- TypeScript end-to-end.

## Data model

Two parallel datasets:

- `financial_facts` — raw SEC EDGAR XBRL facts, scraped from each filer's 10-K/10-Q. Whole-company and segment-level.
- `ai_economics_facts` — curated, source-attributed AI-specific facts per company × year × metric, each with `data_quality` ∈ {sourced, calculated, inconsistent, estimated}, a `methodology` field, and a JSON array of `sources` (name + URL).

## Getting started

```bash
npm install
npx drizzle-kit push                  # create the SQLite schema locally
npx tsx scripts/seed-edgar.ts         # ~1,000 SEC XBRL facts (whole-co)
npx tsx scripts/seed-segments.ts      # ~250 segment facts (AWS, GCP, NVDA DC)
npx tsx scripts/seed-ai-economics.ts  # 58 sourced AI economics facts
npm run dev
```

`tokenomics.db` is gitignored — it's regenerable from the seed scripts above.

## Data quality classifications

- **Sourced** — single authoritative source (SEC filing, press release, CFO statement).
- **Calculated** — derived from sourced inputs (e.g. straight-line amortization).
- **Inconsistent** — sources disagree materially. Range shown low–high.
- **Estimated** — no primary disclosure; credible third-party estimate.

## Methodology notes

**AI capex.** Hyperscalers (Amazon, Alphabet, Microsoft): whole-company capex per 10-K cash-flow statement, treated as AI-attributable per MD&A "primarily for technology infrastructure" language. NVIDIA has minimal capex (chip designer, not infrastructure operator). OpenAI/Anthropic carry no GPU PP&E; their compute is opex via multi-year cloud commitments (Stargate, Project Rainier, Google TPU deals).

**AI revenue.** Cloud segment for hyperscalers (AWS, Google Cloud, Intelligent Cloud); Data Center segment for NVIDIA; total recognized revenue for OpenAI/Anthropic (The Information internal-docs reporting + Sacra/Epoch AI).

**AI operating profit.** Cloud segment operating income for hyperscalers; Compute & Networking segment income for NVIDIA (closest Data Center proxy); total operating loss for OpenAI/Anthropic.

Anthropic revenue is reported gross of cloud-reseller (AWS Bedrock, Google Vertex). Net basis is ~20% lower.

## Status

Research surface, not investment advice.
