import type { Metric } from "@/lib/ai-economics";

export type MetricMeta = {
  metric: Metric;
  slug: string;
  kicker: string;
  title: string;
  description: string;
  methodology: string[];
};

export const METRIC_META: Partial<Record<Metric, MetricMeta>> = {
  ai_capex: {
    metric: "ai_capex",
    slug: "ai-capex",
    kicker: "Capital expenditure",
    title: "AI capex",
    description:
      "AI-specific carve-out of whole-company capex for Amazon and Microsoft (per-year AI share rising from ~25% in 2022 to ~90% in 2026). Whole-company capex for Google as a bear-case upper bound. NVIDIA shows PP&E additions ($1–6B/yr) — small because NVDA is fabless; the real NVDA capital commitment is the $50B+ supply-commitments line, not capex. OpenAI and Anthropic show ~$0 — they don't own GPUs; their compute is rented from hyperscalers and shows up as opex, not capex.",
    methodology: [
      "Amazon: AI-specific carve-out of whole-company capex (NOT bear-case whole-company). Per-year AI share applied: ~20% (2022) → 30% (2023) → 65% (2024) → 85% (2025) → 90% (2026). The share is anchored to: (a) Andy Jassy Q4 2025 call — \"vast majority of [2025] capex on AI for AWS\"; (b) Amazon Q4 2025 8-K — the $50.7B y/y capex increase was \"primarily to fund AI infrastructure\"; (c) Amazon Q1 2026 10-Q — $59.3B TTM y/y increase \"mainly reflecting investments in artificial intelligence\"; (d) Jassy Q1 2026 — FY26 ~$200B capex \"predominantly for AWS and AI infrastructure.\" Pre-AI-boom shares (2022-2023) are backward-extrapolated estimates.",
      "Microsoft: AI-specific carve-out of \"Purchases of property and equipment\" from the SEC cash-flow statement (EXCLUDES finance leases — Microsoft uses leases heavily for data center equipment, so its own lease-inclusive FY26 guidance is ~$190B vs ~$123.5B PP&E-only). Per-year AI share applied: ~25% (FY22) → 40% (FY23) → 65% (FY24) → 85% (FY25) → 90% (FY26). Anchored to FY25 10-K management commentary attributing majority to AI infrastructure, Q2 FY26 disclosure of $37.5B quarter on \"AI-related infrastructure,\" and Q3 FY26 guidance raised to $190B (including leases) on $25B HBM/memory cost impact — a direct AI dependency.",
      "Google: whole-company capex per the 10-K / 10-Q cash-flow statement (\"Additions to PP&E\"), treated as AI-attributable per the MD&A \"primarily for technology infrastructure\" language. This is the bear-case upper bound (overstates AI capex because cloud capex also funds non-AI workloads).",
      "NVIDIA: whole-company purchases of PP&E + intangibles from the cash-flow statement. Shown for comparability but not the right way to measure NVDA's capital intensity. NVDA is fabless — TSMC owns the fabs and bears the foundry capex. Most NVDA PP&E is corporate (offices, internal R&D supercomputers like Eos, test/validation lab equipment), not data-center build-out. NVDA's economically meaningful forward capital commitment is its supply-commitments line ($50.3B at Q3 FY26 for wafers, HBM, and advanced packaging), but that is purchase-obligation-accounted and does not flow through capex.",
      "OpenAI and Anthropic carry ~$0 GPU PP&E. Their compute is rented from hyperscalers (Microsoft Azure / Oracle / Stargate for OpenAI; AWS Trainium, Google TPU including the Broadcom-shipped order, plus SpaceX for Anthropic) via multi-year commitments. That rental hits their operating expenses, not capex — so the same training and inference dollars that would be capex inside a hyperscaler become opex inside a frontier lab. Adding the two together double-counts: hyperscaler capex (buying GPUs) is what funds hyperscaler cloud revenue (renting those GPUs out), which is in turn what funds frontier-lab compute opex. One dollar flowing through three layers of the AI supply chain.",
    ],
  },
  ai_capex_amortized: {
    metric: "ai_capex_amortized",
    slug: "ai-capex-amortized",
    kicker: "Depreciation flow",
    title: "AI capex — amortized",
    description:
      "Bars = reported whole-company D&A from each 10-K's cash-flow statement (fixed, sourced — the most credible reference point). Red diamonds = modeled AI capex amortized straight-line at the slider's useful life. The y-axis is pinned to the worst-case modeled value so it stays put as you drag the slider. When a diamond rises above its bar, that's the gap between what the P&L is recognizing and what depreciation would be at that effective life.",
    methodology: [
      "Bar (reported D&A): each company's whole-company \"Depreciation and amortization\" line from the cash-flow statement of the relevant 10-K (or annualized from the latest 10-Q for FY26). Sourced, fixed — doesn't change with the slider. Whole-company because no hyperscaler discloses an AI-only D&A line; we use this as the most credible reference.",
      "Diamond (modeled): straight-line amortization of the dashboard's AI-attributable capex carve-out at the slider's useful life. Formula: Σ (AI capex from prior N years) ÷ N, where N is the slider value (3–8 yr range, default 4 yr). Only the diamond moves when you drag the slider — bars and y-axis stay fixed. Diamonds only render for FY25 onward because the AI capex series in this dashboard starts at FY22; earlier-year diamonds would undercount by construction (missing prior-year capex zeros out in the formula). The bars (reported D&A) remain visible for all years.",
      "Why the bar is the right reference: reported D&A is a sourced GAAP number. Putting it on the bar (not the marker) keeps the y-axis stable across slider positions, so the only thing changing visually is the diamond. That makes the gap-to-reported the actual story rather than a side-effect of axis rescaling.",
      "Scope nuance: the diamond uses AI-attributable capex (e.g., ~90% of Amazon's whole-company FY26 capex), while the bar is whole-company reported D&A (includes warehouses, offices, non-AI PP&E). The bar therefore *over-counts* AI-attributable depreciation — true AI-only D&A is some fraction of the bar. So when the diamond lifts above the bar, the gap to AI-attributable reported D&A is even larger than what's drawn. The visible gap is a conservative lower bound.",
      "How to read it: set the slider to 6yr (current hyperscaler server policy) — the diamond should sit at or below the bar. Drop to 3–4yr (closer to the real GPU replacement cycle) — diamonds lift above bars for the hyperscalers in 2025–2026. That's the implicit subsidy that current accounting policies provide to reported earnings.",
      "Hyperscaler useful-life history: AWS went 4yr → 5yr (Jan 2022) → 6yr (Jan 2024) on servers; Google went 4yr → 6yr (Jan 2023); Microsoft went 4yr → 6yr (FY23). Each extension cut annual D&A by 20–33% on the affected asset base; Bernstein estimated $20B+/yr cumulative EPS uplift across the three hyperscalers from these changes.",
      "NVIDIA, OpenAI, Anthropic: shown for completeness but the story is different — NVIDIA is fabless with tiny PP&E ($1–6B/yr AI capex); OpenAI and Anthropic carry ~$0 GPU PP&E because their compute is rented opex, so both bars and diamonds are ~$0.",
    ],
  },
  ai_revenue: {
    metric: "ai_revenue",
    slug: "ai-revenue",
    kicker: "Segment revenue",
    title: "AI revenue",
    description:
      "AI-only carve-outs for AWS, Microsoft, and Alphabet (anchored to stated AI run-rate disclosures from each CEO + AI share of cloud segment + consumer subscriptions where applicable). Data Center market-platform for NVIDIA — Gaming, Pro Viz, Automotive, and OEM are excluded (they use NVDA silicon but aren't AI-demand-driven). Total recognized revenue for OpenAI and Anthropic. Anthropic revenue is reported gross of cloud-reseller; net is roughly 20% lower.",
    methodology: [
      "AWS: AI-only carve-out, NOT whole AWS segment. Per-year AI share of AWS segment revenue (~0.5% in 2022 → 1.1% (2023) → 4.2% (2024) → 7.8% (2025) → ~13% (2026)) calibrated to Andy Jassy's CEO-letter / earnings-call disclosures: Q1 2024 \"multi-billion-dollar run rate,\" Q3 2024 \"AWS gen-AI growing >100% YoY,\" Q4 2025 Bedrock at multi-billion run rate + chips (Trainium + Inferentia + Graviton) at $10B+ combined, and the primary anchor — Jassy Q1 2026: \"AWS AI revenue run rate over $15 billion.\" Q1 2026 implied quarterly AI revenue of ~$3.75B was ~10% of $37.6B AWS total. The full AWS segment ($150B annualized 2026) is NOT shown here — it would be a bear-case ceiling.",
      "Microsoft: AI-only carve-out, NOT whole Intelligent Cloud segment. Anchored to Nadella's quarterly AI run-rate disclosures — the cleanest of the hyperscalers because Microsoft has explicitly stated the run rate every quarter since Q1 FY25. Primary anchors: Q2 FY25 (Dec 2024) **$13B AI run rate, +175% YoY** and Q3 FY26 (Mar 2026) **$37B AI run rate, +123% YoY**. Back-derivation gives Q2 FY24 ~$4.7B and Q3 FY25 ~$16.6B. FY26 central estimate $30B reflects year-average run rate; high case $37B treats Q3 run rate as full-year average. Includes Azure AI services (incl. Azure OpenAI Service — OpenAI is 45% of Azure RPO), M365 Copilot (~20M paid seats per Q3 FY26), GitHub Copilot (~4.7M+ paid subscribers per Q2 FY26), and other Copilot-branded products. The full IC segment ($138.7B annualized FY26) is NOT shown here.",
      "Alphabet: AI-only carve-out, NOT the full Cloud segment. Three-step build: (1) take Google Cloud segment revenue from the 10-K; (2) apply a per-year AI-share point estimate (5% in 2022 → 10% in 2023 → 20% in 2024 → 35% in 2025 → 50% in 2026), with low/high range, calibrated to Google's own disclosures — gen-AI product revenue grew ~400% YoY in Q4 2025 and ~800% YoY in Q1 2026, and 70%+ of Cloud customers use Google AI products; (3) add consumer Gemini subscription revenue (Google One AI Pro/Ultra + AI Premium): $0 (2022-2023), ~$0.3B (2024), $1.2B (2025), ~$3.0B (2026 run rate). Ad revenue is excluded entirely — Google does not disclose AI-driven ad uplift (AI Overviews / AI Mode monetization), so we make no estimate of it. Note on the AI-share calibration: Epoch AI publishes \"single-digit billions/year\" for Google DeepMind direct external revenue and \"substantial but unquantified\" for Google Cloud AI infrastructure; no published source supplies the AI-share of Cloud, so the per-year point estimates above are our own calibration to Google's qualitative + quantitative growth disclosures, with the low/high range reflecting that uncertainty.",
      "NVIDIA: Data Center market-platform revenue only. Excluded: Gaming (consumer GeForce — $11.4B FY25, $16B FY26), Professional Visualization (workstation cards/Omniverse — ~$1.9B/yr), Automotive (Drive Orin/Thor for AVs and cockpit infotainment — $1.7B FY25, $2.3B FY26), and OEM/Other (~$0.4B/yr). Auto is the borderline case (Drive is AI for autonomy) but is held out for consistency with how analysts and NVDA's own earnings calls define the AI franchise. Total NVDA revenue FY25 was $130.5B; the Data Center cut here is $115.2B (~88% of the company). For FY26, Data Center is ~90% of the $215.9B total.",
      "OpenAI 2022–2025: full-year recognized revenue per The Information's reporting on internal financial documents (charted in the Mar 4, 2026 piece). 2026 uses OpenAI's own internal full-year projection of $30B, consistent with Q1 2026 actual of $5.7B.",
      "Anthropic 2022–2025: full-year recognized revenue per The Information / Bloomberg reporting on internal documents. 2026 uses Q1 2026 actual ($4.8B) + Q2 2026 projected ($10.9B, per WSJ) + Q2 × 2 as the H2 estimate = $37.5B full year. Anthropic revenue is reported gross of cloud-reseller (AWS Bedrock, Google Vertex); net basis is roughly 20% lower. OpenAI excludes cloud-reseller sales from its top line, so the two aren't strictly comparable.",
    ],
  },
  ai_operating_profit: {
    metric: "ai_operating_profit",
    slug: "ai-operating-profit",
    kicker: "Operating income",
    title: "AI operating profit",
    description:
      "AI-only op profit for AWS (AI revenue × ~20% margin), Microsoft (AI revenue × ~30% margin — higher than AWS due to Copilot SaaS mix), and Alphabet (pro-rata Cloud margin × AI revenue). Compute & Networking reportable-segment income for NVIDIA — Data Center + Mellanox networking + Auto Drive + DGX + Jetson, with the Graphics segment excluded. Adjusted operating income (incl. training costs, excl. SBC) for OpenAI and Anthropic — the same metric the companies themselves report to investors.",
    methodology: [
      "AWS: AI-only op profit, calculated as AI carve-out revenue × ~20% adjusted margin (range 10-30%). Margin assumption sits below AWS segment overall (~35-37%) reflecting investment-phase drag: Trainium2/3 ramp depreciation, Anthropic compute rev share, Bedrock investment-phase pricing. Cited to Seeking Alpha's analysis of AWS margin compression of ~160bps from AI infrastructure depreciation, and Investing.com's bear-case stress scenario where AWS margins compress to 10-11% if AI demand decelerates and stranded capex hits. Amazon does NOT disclose AI-segment op profit anywhere — this is a calculated estimate with a wide range.",
      "Microsoft: AI-only op profit, calculated as AI carve-out revenue × ~30% adjusted margin (range 20-40%). Higher than AWS's 20% because of higher SaaS mix (M365 Copilot + GitHub Copilot are higher-margin than infrastructure AI). Below IC segment overall (~40-47% FY24 peak, compressing to ~40% FY26) reflecting Azure AI depreciation drag, OpenAI compute supplied at partnership-rate (likely below commercial Azure margins), and Maia in-house silicon ramp investment. Microsoft does NOT disclose AI-segment op profit anywhere — this is a calculated estimate with a wide range.",
      "Alphabet: AI-only carve-out op profit. Cloud segment margin (FY22: -11.3%, FY23: 5.2%, FY24: 14.1%, FY25: 23.7%, Q1 2026: 33.0%) applied pro-rata to the AI carve-out revenue line. Important upper-bound caveat: the AI portion of Cloud likely runs LOWER margin than the segment overall because (a) AI Infrastructure carries heavier TPU/GPU depreciation than core GCP — capex stepped up from $52.5B (FY24) to $91.4B (FY25) to a $180-190B FY26 guide, and that depreciation flows through Cloud COGS; and (b) consumer Gemini subscriptions are likely loss-making per user given inference cost. Holding margin at the full-Cloud level is therefore generous — these numbers are best read as upper bounds. Low/high range propagates revenue uncertainty at constant margin only (we do not vary the margin assumption).",
      "NVIDIA: Compute & Networking reportable-segment operating income. NVDA discloses op income at the segment level only (Compute & Networking vs. Graphics), not at the market-platform level — so we can't isolate Data Center-only op income from the filings. C&N includes Data Center compute + Mellanox networking + Auto Drive (AI for autonomous vehicles) + DGX systems + Jetson edge AI, all of which are AI-attributable. The Graphics segment (Gaming GeForce, Pro Viz consumer cards, Auto infotainment) is excluded — Graphics had ~$13.9B op income in FY25, sitting outside this line. C&N is slightly broader than pure Data Center (it includes some networking and Auto AI), but it's the cleanest available proxy because almost everything in C&N is AI-driven.",
      "OpenAI and Anthropic: adjusted operating income, including model training costs and excluding stock-based compensation. The companies report two profit measures — one INCLUDING training costs (the GAAP-like P&L view) and one EXCLUDING training costs (showing inference-only economics). The first is shown here. Strip out training and OpenAI is on track for a small pretax operating profit in 2026; add it back and OpenAI doesn't break even until the 2030s (WSJ, Apr 5, 2026).",
      "2022–2025: accrual operating loss as publicly reported (The Information, CNBC citing NYT-obtained docs, Fortune). These approximate adjusted EBIT in years when training costs were a smaller share of opex.",
      "2026: calculated by applying the latest quarterly adjusted operating margin to projected full-year revenue. OpenAI: Q1 2026 margin of −122% × $30B revenue = −$36.6B. Anthropic: Q1 2026 estimated op loss ~−$1.5B + Q2 2026 projected op profit +$0.56B (per WSJ) + Q2 × 2 as H2 estimate (+$1.12B) ≈ +$0.2B — Q2 marks Anthropic's first projected profitable quarter, though the company has signaled full-year may revert to red if server spend ramps in H2.",
      "Why training vs inference matters: training compute is R&D-like (lumpy, doesn't generate immediate revenue — OpenAI projects $32B on training-related server rental in 2026, growing to $121B by 2028). Inference compute is COGS-like (scales with usage — Anthropic spent 71¢ per dollar of revenue in Q1 2026, falling to 56¢ in Q2). For a frontier lab, training cost is the analog of a hyperscaler's GPU capex: both are big up-front compute investments funding future revenue. The economic stack: hyperscaler capex → cloud segment revenue → frontier-lab compute opex → frontier-lab revenue from end users.",
    ],
  },
};

export const METRIC_ORDER: Metric[] = [
  "ai_revenue",
  "ai_operating_profit",
  "ai_capex",
  "ai_capex_amortized",
];

export const SLUG_TO_METRIC: Record<string, Metric> = Object.fromEntries(
  Object.values(METRIC_META).map((m) => [m.slug, m.metric]),
);

// Derived views are charts on the home page that don't correspond to a single
// raw metric — they combine or compute from multiple Metric facts. Sources and
// methodology on their detail pages are stacked from `sourceMetrics`.
export type DerivedView = {
  slug: string;
  kicker: string;
  title: string;
  description: string;
  sourceMetrics: Metric[];
};

export const DERIVED_VIEWS: Record<string, DerivedView> = {
  "ai-revenue-and-profit": {
    slug: "ai-revenue-and-profit",
    // USER TO WRITE — placeholder copy below; safe to overwrite.
    kicker: "Revenue & operating profit",
    title: "AI revenue and operating profit",
    description:
      "AI-only revenue per year, with operating profit shown as a dashed cost overlay. When the dashed bar fits inside the solid revenue bar, the gap to the right is profit. When the dashed bar crosses zero into the negative axis, the company is spending more on AI than it's earning — by the amount it crosses.",
    sourceMetrics: ["ai_revenue", "ai_operating_profit"],
  },
  "ai-cumulative-net": {
    slug: "ai-cumulative-net",
    // USER TO WRITE — placeholder copy below; safe to overwrite.
    kicker: "Cumulative net",
    title: "AI operating profit minus AI capex (2022–2026)",
    description:
      "For each company: cumulative AI operating profit across 2022–2026, minus cumulative AI capex across the same window. A single number per company showing where the AI buildout sits relative to the AI revenue it has booked so far. Hyperscalers run deeply negative because capex has outpaced AI-segment profit; the frontier labs run negative because of operating losses.",
    sourceMetrics: ["ai_operating_profit", "ai_capex"],
  },
};

export const DERIVED_SLUGS = Object.keys(DERIVED_VIEWS);

export const SHARED_NOTES = {
  annualization:
    "Calendar-year filers (Amazon, Google) are annualized from Q1 2026 × 4. Microsoft (fiscal year ending June 30) uses FY26 Q3 × 4. NVIDIA FY26 ended Jan 25, 2026 — those are full-year actuals, not annualized. OpenAI 2026 uses the company's own internal full-year projection ($30B), cross-checked against Q1 2026 actual of $5.7B. Anthropic 2026 uses Q1 actual ($4.8B) + Q2 projected ($10.9B) + Q2 × 2 estimate for H2 = $37.5B.",
  fiscal:
    "NVIDIA's FY ends in late January, so “FY26” covers calendar 2025 plus three weeks of January 2026. Microsoft's FY ends June 30. In Aug 2024, Microsoft restructured its reporting segments — FY25 Intelligent Cloud revenue and operating income are not directly comparable to FY22–FY24, and the visible step-down in FY25 op income is the recast, not a real decline.",
  nvdaCarveout:
    "What's in / what's out for NVIDIA. Revenue = Data Center market-platform only; Gaming, Pro Viz, Automotive, and OEM are excluded — these use NVDA silicon but aren't AI-demand-driven. Operating profit = Compute & Networking reportable segment (Data Center + Mellanox networking + Auto Drive + DGX + Jetson); the Graphics segment is excluded. Capex = whole-company PP&E + intangibles from the cash-flow statement; shown for comparability but small because NVDA is fabless. NVDA's economically binding capital commitment is its supply-commitments line ($50.3B at Q3 FY26 for wafers + HBM + advanced packaging from TSMC), which is purchase-obligation-accounted and does not appear in capex.",
  awsCarveout:
    "What's in / what's out for AWS. Revenue = AI-only carve-out (~10% of AWS segment in Q1 2026, anchored to Jassy's $15B+ AI run rate disclosure); the rest of AWS segment ($150B annualized 2026 — core compute, storage, networking, databases) is excluded. Operating profit = AI revenue × ~20% estimated margin (range 10-30%) — not disclosed by Amazon; calculation cites Seeking Alpha + Investing.com on AWS margin compression from AI depreciation. Capex = ~85-90% AI share of whole-company capex (anchored to Jassy's \"vast majority on AI for AWS\" + Q4 2025 8-K's \"$50.7B y/y increase primarily AI\" + Q1 2026 10-Q's \"mainly reflecting AI investments\"); fulfillment / non-AI capex is excluded.",
  msftCarveout:
    "What's in / what's out for Microsoft. Revenue = AI-only carve-out anchored to Nadella's stated AI run rate (Q2 FY25 $13B, Q3 FY26 $37B) — includes Azure AI services, M365 Copilot (~20M seats), GitHub Copilot (~4.7M paid subs), Azure OpenAI Service (OpenAI is 45% of Azure RPO). The rest of Intelligent Cloud segment ($138.7B annualized FY26 — core Azure compute, Windows Server, SQL, etc.) is excluded. Operating profit = AI revenue × ~30% estimated margin (range 20-40%) — higher than AWS due to Copilot SaaS mix, lower than IC overall (~40-47%) due to Azure AI depreciation + OpenAI compute pricing + Maia ramp; Microsoft doesn't disclose AI op profit. Capex = ~85-90% AI share of \"Purchases of property and equipment\" on the SEC cash-flow statement — EXCLUDES finance leases. Microsoft's own FY26 capex guidance is ~$190B including leases (up from $150B due to memory cost inflation), but that figure is not comparable to AMZN/GOOG/NVDA cash-flow capex.",
};
