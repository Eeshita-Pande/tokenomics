import type { Metric } from "@/lib/ai-economics";

export type MetricMeta = {
  metric: Metric;
  slug: string;
  kicker: string;
  title: string;
  description: string;
  methodology: string[];
};

export const METRIC_META: Record<Metric, MetricMeta> = {
  ai_capex: {
    metric: "ai_capex",
    slug: "ai-capex",
    kicker: "Capital expenditure",
    title: "AI capex",
    description:
      "Whole-company capex for hyperscalers (Amazon, Google, Microsoft) as a bear-case upper bound, plus NVIDIA's minimal PP&E. OpenAI and Anthropic show ~$0 — they don't own GPUs; their compute is rented from hyperscalers and shows up as opex, not capex.",
    methodology: [
      "For hyperscalers (Amazon, Google, Microsoft), whole-company capex per the 10-K / 10-Q cash-flow statement (“Purchases of property and equipment” / “Additions to PP&E”), treated as AI-attributable per the MD&A “primarily for technology infrastructure” language. This is the bear-case upper bound.",
      "NVIDIA has minimal capex (chip designer, not infrastructure operator).",
      "OpenAI and Anthropic carry ~$0 GPU PP&E. Their compute is rented from hyperscalers (Microsoft Azure / Oracle / Stargate for OpenAI; AWS Trainium, Google TPU including the Broadcom-shipped order, plus SpaceX for Anthropic) via multi-year commitments. That rental hits their operating expenses, not capex — so the same training and inference dollars that would be capex inside a hyperscaler become opex inside a frontier lab. Adding the two together double-counts: hyperscaler capex (buying GPUs) is what funds hyperscaler cloud revenue (renting those GPUs out), which is in turn what funds frontier-lab compute opex. One dollar flowing through three layers of the AI supply chain.",
    ],
  },
  ai_capex_amortized: {
    metric: "ai_capex_amortized",
    slug: "ai-capex-amortized",
    kicker: "Depreciation flow",
    title: "AI capex — amortized",
    description:
      "Straight-line amortization over a chosen useful life applied to the capex series. Shows the depreciation-flow story rather than the cash-out story. Slider toggles useful life from 3 to 8 years on the detail page.",
    methodology: [
      "Straight-line over the chosen useful life applied to the historical capex series. Shows the depreciation-flow story rather than the cash-out story.",
      "The slider toggles useful life 3–8 years. Each year sums (current year + prior years within useful life) ÷ useful life.",
    ],
  },
  ai_revenue: {
    metric: "ai_revenue",
    slug: "ai-revenue",
    kicker: "Segment revenue",
    title: "AI revenue",
    description:
      "Cloud segment for the hyperscalers (AWS, Google Cloud, Intelligent Cloud), Data Center for NVIDIA, total recognized revenue for OpenAI and Anthropic. Anthropic revenue is reported gross of cloud-reseller; net is roughly 20% lower.",
    methodology: [
      "Hyperscalers: cloud segment as disclosed (AWS, Google Cloud, Intelligent Cloud). NVIDIA: Data Center segment.",
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
      "Cloud segment operating income for hyperscalers, Compute & Networking for NVIDIA, and adjusted operating income (incl. training costs, excl. SBC) for OpenAI and Anthropic — the same metric the companies themselves report to investors. Training costs are the dominant driver of frontier-lab losses from 2026 onward.",
    methodology: [
      "Cloud segment operating income for hyperscalers; Compute & Networking segment income (closest Data Center proxy) for NVIDIA.",
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

export const SHARED_NOTES = {
  annualization:
    "Calendar-year filers (Amazon, Google) are annualized from Q1 2026 × 4. Microsoft (fiscal year ending June 30) uses FY26 Q3 × 4. NVIDIA FY26 ended Jan 25, 2026 — those are full-year actuals, not annualized. OpenAI 2026 uses the company's own internal full-year projection ($30B), cross-checked against Q1 2026 actual of $5.7B. Anthropic 2026 uses Q1 actual ($4.8B) + Q2 projected ($10.9B) + Q2 × 2 estimate for H2 = $37.5B.",
  fiscal:
    "NVIDIA's FY ends in late January, so “FY26” covers calendar 2025 plus three weeks of January 2026. Microsoft's FY ends June 30. In Aug 2024, Microsoft restructured its reporting segments — FY25 Intelligent Cloud revenue and operating income are not directly comparable to FY22–FY24, and the visible step-down in FY25 op income is the recast, not a real decline.",
};
