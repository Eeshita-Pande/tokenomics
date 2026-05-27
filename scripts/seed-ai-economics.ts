import "dotenv/config";
import { db, schema } from "../src/db";

type Source = { name: string; url: string; date?: string };
type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
type Metric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit"
  | "ai_da_reported";

type Fact = {
  ticker: string;
  metric: Metric;
  fy: number;
  value: number;
  low?: number;
  high?: number;
  quality: Quality;
  methodology: string;
  sources: Source[];
  note?: string;
};

const PRIVATE_COMPANIES = [
  {
    cik: "OAI",
    ticker: "OAI",
    name: "OpenAI",
    segment: "ai_lab",
    isPublic: false,
    fiscalYearEnd: "12-31",
  },
  {
    cik: "ANTH",
    ticker: "ANTH",
    name: "Anthropic, PBC",
    segment: "ai_lab",
    isPublic: false,
    fiscalYearEnd: "12-31",
  },
];

// Reusable primary-source URLs.
const NVDA_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/1045810/000104581022000036/nvda-20220130.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/1045810/000104581023000017/nvda-20230129.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/1045810/000104581024000029/nvda-20240128.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm",
  2026: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm",
};

const AMZN_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/1018724/000101872423000004/amzn-20221231.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/1018724/000101872424000008/amzn-20231231.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/1018724/000101872425000004/amzn-20241231.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm",
};
const AMZN_Q1_2026_10Q =
  "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000014/amzn-20260331.htm";
const AMZN_Q4_2025_8K =
  "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000002/amzn-20251231xex991.htm";
const JASSY_Q1_2026_AWS_AI =
  "https://www.aboutamazon.com/news/company-news/amazon-ceo-andy-jassy-aws-ai-q1-2026-earnings";
const JASSY_Q1_2026_CHIPS =
  "https://www.aboutamazon.com/news/company-news/amazon-ceo-andy-jassy-amazon-chips-business-q1-2026-earnings";
const JASSY_Q1_2024_AI_RUN_RATE =
  "https://www.fierce-network.com/cloud/amazon-ceo-genai-already-multi-billion-dollar-business";
const FORTUNE_AMZN_GENAI_2024 =
  "https://fortune.com/2024/04/30/amazon-aws-100-billion-revenue-gen-ai-earnings/";
const SA_AMZN_MARGIN =
  "https://seekingalpha.com/article/4865373-amazon-why-falling-margins-are-the-signal";
const INVESTING_AMZN_AI_DRAG =
  "https://www.investing.com/analysis/amazon-slides-as-investors-weigh-aws-growth-against-ai-capex-drag-200674417";
const FUTURUM_AMZN_Q4_2025 =
  "https://futurumgroup.com/insights/amazon-q4-fy-2025-revenue-beat-aws-24-amid-200b-capex-plan/";
const FUTURUM_AMZN_Q1_2026 =
  "https://futurumgroup.com/insights/amazon-q1-fy-2026-aws-momentum-builds-as-ai-infrastructure-spend-surges/";

const GOOG_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/1652044/000165204423000016/goog-20221231.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/1652044/000165204424000022/goog-20231231.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/1652044/000165204425000014/goog-20241231.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm",
};
const GOOG_Q1_2026_8K =
  "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000043/googexhibit991q12026.htm";
const GOOG_Q4_2025_8K =
  "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000012/googexhibit991q42025.htm";
const EPOCH_AI_REVENUE =
  "https://epoch.ai/data-insights/ai-companies-revenue";
const TECHCRUNCH_GOOG_SUBS =
  "https://techcrunch.com/2026/04/29/google-gains-25m-subscriptions-in-q1-driven-by-youtube-and-google-one/";

const MSFT_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/789019/000156459022026876/msft-10k_20220630.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/789019/000095017023035122/msft-20230630.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/789019/000095017024087843/msft-20240630.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/msft-20250630.htm",
};
const MSFT_Q3_FY26_10Q =
  "https://www.sec.gov/Archives/edgar/data/0000789019/000119312526191507/msft-20260331.htm";
const MSFT_Q1_FY25_8K =
  "https://www.sec.gov/Archives/edgar/data/0000789019/000095017024118955/msft-ex99_1.htm";
const MSFT_Q2_FY25_8K =
  "https://www.sec.gov/Archives/edgar/data/0000789019/000095017025010484/msft-ex99_1.htm";
const MSFT_Q3_FY26_8K =
  "https://www.sec.gov/Archives/edgar/data/0000789019/000119312526191457/msft-ex99_1.htm";
const MSFT_Q3_FY26_PR =
  "https://news.microsoft.com/source/2026/04/29/microsoft-cloud-and-ai-strength-fuels-third-quarter-results/";
const MSFT_AI_BILL =
  "https://markets.financialcontent.com/wral/article/marketminute-2026-2-17-the-375-billion-ai-bill-microsoft-faces-investor-reckoning-over-sky-high-spending";
const MSFT_CNBC_190B =
  "https://www.cnbc.com/2026/04/29/microsoft-msft-q3-earnings-report-2026.html";

const FACTS: Fact[] = [
  // ============ NVIDIA (FY ends late January) ============
  // AI carve-out: Data Center market-platform revenue for the top line;
  // Compute & Networking reportable-segment operating income for the bottom
  // line. Excludes the Graphics segment (Gaming GPUs, Pro Viz consumer cards,
  // Auto infotainment) and the OEM/Other market platform — these use NVDA
  // silicon but the revenue is not driven by AI demand. Auto Drive (Orin/Thor
  // for autonomous vehicles) is AI-adjacent but rolls into Compute & Networking
  // for op income and into the Automotive market platform for revenue; we keep
  // Automotive out of the AI revenue line for consistency. See VERIFICATION.md
  // for the year-by-year reconciliation of total NVDA revenue to the AI cut.
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2022,
    value: 10.61e9,
    quality: "sourced",
    methodology:
      "Data Center market-platform revenue, NVIDIA FY22 10-K (year ended Jan 30, 2022). Excludes Gaming ($12.46B), Pro Viz ($2.11B), Automotive ($566M), and OEM/Other ($1.16B) — total NVDA revenue was $26.91B.",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2023,
    value: 15.01e9,
    quality: "sourced",
    methodology:
      "Data Center market-platform revenue, FY23 10-K (year ended Jan 29, 2023). Excludes Gaming ($9.07B), Pro Viz ($1.54B), Automotive ($903M), and OEM/Other ($455M) — total NVDA revenue was $26.97B.",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2024,
    value: 47.525e9,
    quality: "sourced",
    methodology:
      "Data Center market-platform revenue, FY24 10-K (year ended Jan 28, 2024). Excludes Gaming ($10.45B), Pro Viz ($1.55B), Automotive ($1.09B), and OEM/Other ($306M) — total NVDA revenue was $60.92B.",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2025,
    value: 115.191e9,
    quality: "sourced",
    methodology:
      "Data Center market-platform revenue, FY25 10-K (year ended Jan 26, 2025). Excludes Gaming ($11.35B), Pro Viz ($1.88B), Automotive ($1.69B), and OEM/Other ($389M) — total NVDA revenue was $130.50B.",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2026,
    value: 193.7e9,
    quality: "sourced",
    methodology:
      "Data Center market-platform revenue, FY26 10-K (year ended Jan 25, 2026). Full-year actual. Excludes Gaming (~$16B), Automotive (~$2.3B), and Pro Viz/OEM (~$3B) — total NVDA revenue was ~$215.9B; Data Center is ~90% of the company.",
    sources: [{ name: "NVIDIA 10-K FY26 (SEC)", url: NVDA_10K[2026] }],
    note: "NVIDIA's fiscal year ends in late January, so FY26 covers calendar 2025 plus three weeks of January 2026.",
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 4.598e9,
    quality: "sourced",
    methodology:
      "Compute & Networking reportable-segment operating income, FY22 10-K segment footnote. C&N bundles Data Center + Mellanox networking + Auto Drive + DGX systems + Jetson edge AI — essentially the AI-attributable stack. The Graphics segment (Gaming + Pro Viz consumer + Auto infotainment) is excluded. NVDA does not separately disclose Data Center-only operating income, so C&N is the closest available proxy and slightly overstates pure Data Center op income.",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 5.083e9,
    quality: "sourced",
    methodology:
      "Compute & Networking segment operating income, FY23 10-K. Includes Data Center + networking + Auto AI + DGX; excludes the Graphics segment.",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 32.016e9,
    quality: "sourced",
    methodology:
      "Compute & Networking segment operating income, FY24 10-K. Includes Data Center + networking + Auto AI + DGX; excludes the Graphics segment.",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 82.875e9,
    quality: "sourced",
    methodology:
      "Compute & Networking segment operating income, FY25 10-K. Includes Data Center + networking + Auto AI + DGX; excludes the Graphics segment (~$13.9B op income on $14.3B revenue — mostly Gaming and Pro Viz consumer cards).",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 130.1e9,
    quality: "sourced",
    methodology:
      "Compute & Networking segment operating income, FY26 10-K. Includes Data Center + networking + Auto AI + DGX; excludes the Graphics segment. Already net of the $4.5B H20 inventory/PO charge taken in Q1 FY26 following U.S. export restrictions on the China market.",
    sources: [{ name: "NVIDIA 10-K FY26 (SEC)", url: NVDA_10K[2026] }],
  },
  // NVDA capex: tiny vs. hyperscalers because NVDA is fabless — TSMC owns the
  // fabs. The economically meaningful capital commitment is NVDA's supply-
  // commitments line ($50.3B at Q3 FY26 for wafers + HBM + advanced packaging),
  // but that's a purchase obligation, not capex. We show PP&E additions for
  // apples-to-apples cash-flow comparability and flag the gap in the card copy.
  {
    ticker: "NVDA",
    metric: "ai_capex",
    fy: 2022,
    value: 0.976e9,
    quality: "sourced",
    methodology:
      "Purchases related to property and equipment and intangible assets, FY22 10-K cash-flow statement. Whole-company — NVDA does not allocate capex by segment. Most NVDA PP&E is corporate (offices, internal R&D supercomputers like Selene/Eos, lab/test equipment) rather than data-center build-out, because NVDA is fabless and does not operate hyperscale data centers.",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_capex",
    fy: 2023,
    value: 1.833e9,
    quality: "sourced",
    methodology:
      "Purchases of PP&E + intangibles, FY23 10-K cash-flow statement.",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_capex",
    fy: 2024,
    value: 1.069e9,
    quality: "sourced",
    methodology:
      "Purchases of PP&E + intangibles, FY24 10-K cash-flow statement.",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_capex",
    fy: 2025,
    value: 3.236e9,
    quality: "sourced",
    methodology:
      "Purchases of PP&E + intangibles, FY25 10-K cash-flow statement. Step-up driven by internal AI infrastructure for R&D (Eos supercomputer) and expanded test/validation capacity for Blackwell.",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_capex",
    fy: 2026,
    value: 6.042e9,
    quality: "sourced",
    methodology:
      "Purchases of PP&E + intangibles, FY26 10-K cash-flow statement. Full-year actual. Still ~30× smaller than any single hyperscaler's annualized FY26 capex — NVDA's real forward capital commitment is its $50.3B supply-commitments line (TSMC wafers, HBM, advanced packaging) reported in the Q3 FY26 CFO commentary, which is purchase-obligation-accounted and does not flow through capex.",
    sources: [{ name: "NVIDIA 10-K FY26 (SEC)", url: NVDA_10K[2026] }],
    note: "NVDA capex is shown for comparability but is not the right way to measure NVDA's capital intensity vs. hyperscalers — supply commitments are.",
  },

  // ============ AMAZON / AWS (CY ends Dec 31) ============
  // AI carve-out methodology (NOT whole AWS segment, NOT whole-company capex):
  //   - Revenue: per-year AI share of AWS segment, calibrated to Jassy's
  //     CEO-letter / earnings-call disclosures (Q1 2024 "multi-billion run rate",
  //     Q3 2024 100%+ YoY, Q4 2025 Bedrock multi-billion + chips $10B, Q1 2026
  //     $15B+ AI run rate).
  //   - Op profit: AI revenue × ~20% adjusted margin (range 10-30%). Below AWS
  //     segment overall margin (~35-37%) reflecting investment-phase drag:
  //     Trainium ramp depreciation, Anthropic rev share, Bedrock pricing.
  //     Margin assumption cited to Seeking Alpha + Investing.com analyses of
  //     AWS margin compression (~160bps drag from AI infra) and bear-case
  //     stress scenarios (10-11% if AI demand decelerates).
  //   - Capex: per-year AI share of whole-Amazon capex, anchored to Jassy's
  //     "vast majority on AI for AWS" (Q4 2025 call), Amazon's Q4 2025 8-K
  //     stating the $50.7B y/y capex increase was "primarily to fund AI
  //     infrastructure," and Q1 2026 10-Q stating the $59.3B TTM increase
  //     was "mainly reflecting investments in artificial intelligence."
  //   - Headlines aren't 10-K-sourced (those are the underlying totals); the
  //     AI carve-out is an estimate. The 10-K + 10-Q + Jassy letters are
  //     the underlying primary sources for the AWS-total and capex baselines.
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2022,
    value: 0.4e9,
    low: 0.1e9,
    high: 0.8e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out of AWS segment. 2022 AI share estimated at ~0.5% (range 0.1-1.0%) of AWS segment ($80.1B per 10-K). Pre-Bedrock (launched April 2023), pre-Anthropic partnership (Sep 2023); Trainium1 launched late 2022 with minimal revenue. AI revenue was effectively SageMaker + small EC2 GPU instance share.",
    sources: [
      {
        name: "Amazon 10-K FY22 (SEC) — AWS segment revenue baseline",
        url: AMZN_10K[2022],
      },
    ],
    note: "AI carve-out, not whole AWS segment ($80.1B). Wide range reflects pre-disclosure-era estimation uncertainty.",
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2023,
    value: 1.0e9,
    low: 0.5e9,
    high: 1.5e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out of AWS segment. 2023 AI share estimated at ~1.1% (range 0.5-1.7%) of AWS segment ($90.8B per 10-K). Bedrock launched April 2023; Anthropic-AWS partnership announced Sep 2023; Trainium2 announced Nov 2023. Jassy stated in Q1 2024 call that AI was already at a \"multi-billion-dollar revenue run rate\" entering 2024 — implies 2023 exit run rate ~$2-3B annualized, full-year recognized revenue ~$1B.",
    sources: [
      {
        name: "Amazon 10-K FY23 (SEC) — AWS segment baseline",
        url: AMZN_10K[2023],
      },
      {
        name: "Andy Jassy Q1 2024 earnings call — AI 'multi-billion-dollar run rate'",
        url: JASSY_Q1_2024_AI_RUN_RATE,
        date: "2024-04-30",
      },
    ],
    note: "AI carve-out, not whole AWS segment ($90.8B).",
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2024,
    value: 4.5e9,
    low: 3.0e9,
    high: 6.0e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out of AWS segment. 2024 AI share estimated at ~4.2% (range 2.8-5.6%) of AWS segment ($107.6B per 10-K). Anchored to: (1) Jassy Q1 2024 call — AI at \"multi-billion-dollar run rate\"; (2) Jassy Q3 2024 call — AWS gen-AI growing >100% YoY. Implied trajectory: ~$3B run rate at Q1 → ~$6-8B run rate by Q4 → full-year recognized ~$4.5B.",
    sources: [
      {
        name: "Amazon 10-K FY24 (SEC) — AWS segment baseline",
        url: AMZN_10K[2024],
      },
      {
        name: "Andy Jassy Q1 2024 earnings call — AI multi-billion run rate",
        url: JASSY_Q1_2024_AI_RUN_RATE,
        date: "2024-04-30",
      },
      {
        name: "Fortune (Apr 2024) — Amazon GenAI 'multibillion-dollar run rate'",
        url: FORTUNE_AMZN_GENAI_2024,
        date: "2024-04-30",
      },
    ],
    note: "AI carve-out, not whole AWS segment ($107.6B).",
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2025,
    value: 10.0e9,
    low: 8.0e9,
    high: 12.0e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out of AWS segment. 2025 AI share estimated at ~7.8% (range 6.2-9.3%) of AWS segment ($128.7B per 10-K). Anchored to: (1) Q4 2025 disclosures — Bedrock at \"multi-billion-dollar\" annualized run rate, chips (Trainium + Inferentia + Graviton) at $10B+ combined run rate; (2) Q1 2026 entry run rate of $15B+ AI specifically; (3) growth from ~$3B run rate entering 2025 to ~$13B run rate exiting 2025 implies average ~$8-12B, taken at central ~$10B.",
    sources: [
      {
        name: "Amazon 10-K FY25 (SEC) — AWS segment baseline",
        url: AMZN_10K[2025],
      },
      {
        name: "Amazon Q4 2025 8-K — Bedrock multi-billion + chips $10B",
        url: AMZN_Q4_2025_8K,
        date: "2026-02-05",
      },
      {
        name: "Futurum — Amazon Q4 FY2025 / Bedrock customer spend +60% QoQ",
        url: FUTURUM_AMZN_Q4_2025,
        date: "2026-02-06",
      },
    ],
    note: "AI carve-out, not whole AWS segment ($128.7B). Bedrock alone reached multi-billion run rate in 2025; Trainium + Graviton chips combined at $10B+ run rate.",
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2026,
    value: 20.0e9,
    low: 15.0e9,
    high: 25.0e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out of AWS segment. Q1 2026 AI revenue run rate of $15B+ per Andy Jassy (Apr 2026 earnings call). Implied Q1 quarterly AI revenue ~$3.75B (~10% of $37.6B AWS Q1 total). Central estimate $20B reflects expected H2 run-rate growth; low $15B holds Q1 run rate flat; high $25B reflects continued triple-digit YoY growth in chips business observed at Q1.",
    sources: [
      {
        name: "Andy Jassy Q1 2026 earnings — AWS AI revenue $15B+ run rate",
        url: JASSY_Q1_2026_AWS_AI,
        date: "2026-04-29",
      },
      {
        name: "Andy Jassy Q1 2026 earnings — chips business $20B run rate",
        url: JASSY_Q1_2026_CHIPS,
        date: "2026-04-29",
      },
      {
        name: "Amazon Q1 2026 10-Q (SEC) — AWS segment baseline",
        url: AMZN_Q1_2026_10Q,
        date: "2026-04-29",
      },
    ],
    note: "AI carve-out, not whole AWS segment ($150.4B annualized). The $15B+ AI run rate disclosed by Jassy Q1 2026 is the primary anchor.",
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 0.08e9,
    low: 0.01e9,
    high: 0.24e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($0.4B central) × ~20% margin = $0.08B. Margin assumption: AI workloads at ~20% adjusted op margin (range 10-30%), below 2022 AWS overall segment margin of 28.5% ($22.8B / $80.1B per 10-K). Amazon does not disclose AI-segment op profit.",
    sources: [
      {
        name: "Amazon 10-K FY22 (SEC) — AWS segment op income baseline ($22.84B / 28.5% margin)",
        url: AMZN_10K[2022],
      },
    ],
    note: "AI carve-out is calculated (revenue × margin), not disclosed. Wide range reflects margin assumption uncertainty.",
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 0.2e9,
    low: 0.05e9,
    high: 0.45e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($1.0B central) × ~20% margin = $0.2B. 2023 AWS overall segment margin was 27.1% ($24.6B / $90.8B per 10-K). AI margin assumed lower (~20%) due to Bedrock launch costs and early Trainium deployment.",
    sources: [
      {
        name: "Amazon 10-K FY23 (SEC) — AWS segment op income baseline ($24.6B / 27.1% margin)",
        url: AMZN_10K[2023],
      },
    ],
    note: "AI carve-out is calculated, not disclosed.",
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 0.9e9,
    low: 0.3e9,
    high: 1.8e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($4.5B central) × ~20% margin = $0.9B. 2024 AWS overall segment margin was 37.0% ($39.8B / $107.6B per 10-K). AI margin assumed at ~20% (range 10-30%) — below overall AWS due to Trainium2 ramp depreciation, Anthropic rev share, and Bedrock investment-phase pricing.",
    sources: [
      {
        name: "Amazon 10-K FY24 (SEC) — AWS segment op income baseline ($39.8B / 37.0% margin)",
        url: AMZN_10K[2024],
      },
      {
        name: "Seeking Alpha — Amazon: Why Falling Margins Are The Signal",
        url: SA_AMZN_MARGIN,
        date: "2026-05-01",
      },
    ],
    note: "AI carve-out is calculated, not disclosed. AWS overall margin began compressing 2024 with AI depreciation drag.",
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 2.0e9,
    low: 0.8e9,
    high: 3.6e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($10B central) × ~20% margin = $2.0B. 2025 AWS overall segment margin was 35.4% ($45.6B / $128.7B per 10-K) — down ~160 bps from 2024 peak per Seeking Alpha analysis attributing the drag to AI infrastructure depreciation and Trainium deployment. AI-only margin assumed at ~20% (range 10-30%, with bear case 10-11% citing analyst stress scenarios).",
    sources: [
      {
        name: "Amazon 10-K FY25 (SEC) — AWS segment op income baseline ($45.6B / 35.4% margin)",
        url: AMZN_10K[2025],
      },
      {
        name: "Seeking Alpha — AWS margin compression from AI infra",
        url: SA_AMZN_MARGIN,
        date: "2026-05-01",
      },
      {
        name: "Investing.com — AWS Growth Against AI Capex Drag",
        url: INVESTING_AMZN_AI_DRAG,
        date: "2026-04-30",
      },
    ],
    note: "AI carve-out is calculated, not disclosed. AWS overall margin compression of ~160 bps in 2025 attributed by analysts to AI depreciation.",
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 4.0e9,
    low: 1.5e9,
    high: 7.5e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($20B central) × ~20% margin = $4.0B. Q1 2026 AWS overall segment margin was 37.7% ($14.2B / $37.6B per 10-Q). AI-only margin estimated at ~20% (range 10-30%) reflecting heavy Trainium ramp + Anthropic compute cluster buildout + Bedrock competitive pricing. Investing.com bear case: AWS margins compress to 10-11% if AI demand decelerates and stranded capex hits.",
    sources: [
      {
        name: "Amazon Q1 2026 10-Q (SEC) — AWS segment op income baseline ($14.2B / 37.7% margin)",
        url: AMZN_Q1_2026_10Q,
        date: "2026-04-29",
      },
      {
        name: "Seeking Alpha — AWS margin compression from AI infra (160bps drag)",
        url: SA_AMZN_MARGIN,
        date: "2026-05-01",
      },
      {
        name: "Investing.com — AWS Growth Against AI Capex Drag",
        url: INVESTING_AMZN_AI_DRAG,
        date: "2026-04-30",
      },
      {
        name: "Futurum — Amazon Q1 FY2026 / AI infrastructure spend surges",
        url: FUTURUM_AMZN_Q1_2026,
        date: "2026-04-30",
      },
    ],
    note: "AI carve-out is calculated, not disclosed. Range is wide (10-30% margin) — Amazon does not break out AI-segment op profit anywhere.",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2022,
    value: 12.7e9,
    low: 6.4e9,
    high: 19.1e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~20% (range 10-30%) of whole-company capex ($63.65B per 2022 10-K cash-flow statement). Pre-AI-boom; capex was primarily AWS general-cloud infrastructure (storage, compute, networking) plus fulfillment. Trainium1 just launched late 2022. The 20% share is a backward-extrapolation; Amazon did not disclose AI capex share in 2022.",
    sources: [
      {
        name: "Amazon 10-K FY22 (SEC) — whole-company capex baseline",
        url: AMZN_10K[2022],
      },
    ],
    note: "AI carve-out, not whole capex ($63.65B). Wide range reflects pre-disclosure estimation.",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2023,
    value: 15.8e9,
    low: 7.9e9,
    high: 23.7e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~30% (range 15-45%) of whole-company capex ($52.73B per 2023 10-K cash-flow statement). Bedrock launched April 2023; Anthropic partnership Sep 2023; Trainium2 announced Nov 2023 — initial AI infrastructure ramp. Total capex declined YoY in 2023 (fulfillment overbuild correction) before re-accelerating in 2024 on AI.",
    sources: [
      {
        name: "Amazon 10-K FY23 (SEC) — whole-company capex baseline",
        url: AMZN_10K[2023],
      },
    ],
    note: "AI carve-out, not whole capex ($52.73B).",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2024,
    value: 54.0e9,
    low: 41.5e9,
    high: 66.4e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~65% (range 50-80%) of whole-company capex ($83.0B per 2024 10-K cash-flow statement). Amazon 10-K MD&A explicitly attributes the capex increase to \"AWS infrastructure including AI/ML.\" Anthropic Project Rainier compute cluster build-out ramped through 2024; Trainium2 production began.",
    sources: [
      {
        name: "Amazon 10-K FY24 (SEC) — capex baseline + MD&A AI/ML language",
        url: AMZN_10K[2024],
      },
    ],
    note: "AI carve-out, not whole capex ($83.0B). 10-K MD&A attributes capex increase to AI/ML infrastructure.",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2025,
    value: 112.0e9,
    low: 98.9e9,
    high: 118.6e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out: ~85% (range 75-90%) of whole-company capex ($131.82B per 2025 10-K cash-flow statement). Anchor: Andy Jassy Q4 2025 call stated \"vast majority of [2025] capex on AI for AWS.\" Amazon Q4 2025 8-K disclosed the $50.7B y/y capex increase was \"primarily to fund artificial intelligence infrastructure\" — the AI-attributable increment alone is roughly the entire YoY delta.",
    sources: [
      {
        name: "Amazon 10-K FY25 (SEC) — capex baseline",
        url: AMZN_10K[2025],
      },
      {
        name: "Amazon Q4 2025 8-K — '$50.7B y/y increase primarily to fund AI infrastructure'",
        url: AMZN_Q4_2025_8K,
        date: "2026-02-05",
      },
      {
        name: "Andy Jassy Q4 2025 call — 'vast majority of capex on AI for AWS'",
        url: FUTURUM_AMZN_Q4_2025,
        date: "2026-02-06",
      },
    ],
    note: "AI carve-out, not whole capex ($131.82B). Jassy explicitly stated \"vast majority\" was AI-related; 8-K confirms YoY capex increase was primarily AI.",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2026,
    value: 159.0e9,
    low: 141.4e9,
    high: 180.0e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out: ~90% (range 80-100%) of whole-company capex (Q1 2026 annualized: $176.8B from $44.2B × 4 per 10-Q; CEO FY26 guidance: ~$200B). Anchors: (1) Jassy Q4 2025 / Q1 2026 calls — capex \"predominantly for AWS and AI infrastructure\"; (2) Q1 2026 10-Q — $59.3B TTM y/y increase in PP&E purchases \"mainly reflecting investments in artificial intelligence.\" High of $180B = 90% × $200B FY26 guidance.",
    sources: [
      {
        name: "Amazon Q1 2026 10-Q (SEC) — capex baseline + 'mainly AI' language",
        url: AMZN_Q1_2026_10Q,
        date: "2026-04-29",
      },
      {
        name: "Andy Jassy Q1 2026 / FY26 capex ~$200B predominantly AI",
        url: JASSY_Q1_2026_CHIPS,
        date: "2026-04-29",
      },
      {
        name: "Investing.com — Jassy outlines AI investment, $200B FY26 capex",
        url: "https://www.investing.com/news/stock-market-news/amazon-ceo-jassy-outlines-ai-investment-strategy-expects-200b-capex-in-2026-93CH-4604883",
        date: "2026-04-30",
      },
    ],
    note: "AI carve-out, not whole capex ($176.8B annualized; ~$200B FY26 CEO guidance). 10-Q states the y/y capex increase is mainly AI. Anthropic Project Rainier + Trainium fab and data-center buildout are the three named priorities.",
  },

  // ============ ALPHABET / GOOG (CY ends Dec 31) ============
  // Alphabet uses an AI-only carve-out rather than the full Cloud segment
  // (unlike AWS / Microsoft Intelligent Cloud below). Reason: Cloud bundles
  // core GCP (storage, compute, networking) with AI Infrastructure (TPU/GPU
  // rental for AI training/inference) and AI Solutions (Vertex, Gemini-on-
  // Vertex, Agentspace). Google does not disclose the dollar split, so the AI
  // portion is estimated per-year from Google's own gen-AI growth disclosures.
  // Consumer Gemini subscriptions (Google One AI Pro/Ultra + AI Premium) are
  // added on top. Ad revenue is excluded entirely.
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2022,
    value: 1.31e9,
    low: 0.79e9,
    high: 2.63e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out. Step 1: Google Cloud segment revenue $26.28B (FY22 10-K). Step 2: Apply 5% AI share point estimate (range 3-10%) — pre-ChatGPT era; AI revenue limited to ML-infrastructure workloads and TPU rental for third-party training. Step 3: No consumer Gemini subscriptions (Bard launched Mar 2023, free). Total: $1.31B (range $0.79-2.63B).",
    sources: [
      { name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] },
      { name: "Epoch AI — AI company revenue estimates", url: EPOCH_AI_REVENUE },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2023,
    value: 3.31e9,
    low: 2.32e9,
    high: 4.96e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out. Step 1: Google Cloud segment revenue $33.09B (FY23 10-K). Step 2: Apply 10% AI share point estimate (range 7-15%) — post-ChatGPT enterprise demand; Vertex AI Gen launches mid-year; Gemini 1.0 released Dec 2023 with no paid consumer tier yet. Total: $3.31B (range $2.32-4.96B).",
    sources: [
      { name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] },
      { name: "Epoch AI — AI company revenue estimates", url: EPOCH_AI_REVENUE },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2024,
    value: 8.95e9,
    low: 6.78e9,
    high: 12.40e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out. Step 1: Google Cloud segment revenue $43.23B (FY24 10-K). Step 2: Apply 20% AI share point estimate (range 15-28%) — Gemini 1.x in production across Vertex; Workspace Gemini selling to enterprise. Step 3: Add ~$0.3B consumer Gemini subscriptions (Google One AI Premium launched Feb 2024 at $19.99/mo, ramping through year). Total: $8.95B (range $6.78-12.40B).",
    sources: [
      { name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] },
      { name: "Epoch AI — AI company revenue estimates", url: EPOCH_AI_REVENUE },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2025,
    value: 21.78e9,
    low: 15.90e9,
    high: 27.66e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out. Step 1: Google Cloud segment revenue $58.79B (FY25 10-K). Step 2: Apply 35% AI share point estimate (range 25-45%) — anchored to Google's Q4 2025 disclosure that revenue from products built on its gen-AI models grew ~400% YoY, and that 70%+ of Cloud customers use Google AI products. Step 3: Add $1.2B consumer Gemini subscription revenue (Google One AI Pro/Ultra + AI Premium, disclosed on Q4 2025 call). Total: $21.78B (range $15.90-27.66B).",
    sources: [
      { name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] },
      { name: "Alphabet Q4 2025 earnings (SEC 8-K)", url: GOOG_Q4_2025_8K },
      { name: "TechCrunch — Google subscription growth (Q1 2026)", url: TECHCRUNCH_GOOG_SUBS },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2026,
    value: 43.0e9,
    low: 35.0e9,
    high: 51.0e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out. Step 1: Google Cloud revenue annualized from Q1 2026 ($20.0B × 4 = $80B; Cloud disclosed as capacity-constrained on AI). Step 2: Apply 50% AI share point estimate (range 40-60%) — anchored to Q1 2026 disclosure that gen-AI product revenue grew ~800% YoY and that enterprise AI Infrastructure + Generative AI Solutions led Cloud growth. Step 3: Add ~$3.0B consumer Gemini subscription run rate (extrapolated from $1.2B 2025 + reported Q1 2026 acceleration in subscription adds across Google One AI Pro/Ultra). Total: $43.0B (range $35.0-51.0B).",
    sources: [
      { name: "Alphabet Q1 2026 earnings (SEC 8-K)", url: GOOG_Q1_2026_8K },
      { name: "TechCrunch — Google subscription growth (Q1 2026)", url: TECHCRUNCH_GOOG_SUBS },
    ],
  },
  // Op profit: AI revenue × Cloud segment margin (pro-rata margin assumption).
  // Important caveat in every footnote: the AI portion of Cloud is widely
  // understood to run a LOWER margin than core GCP (heavier TPU/GPU
  // depreciation in the buildout phase, consumer Gemini subs are likely
  // loss-making). So these numbers are best read as an UPPER BOUND on
  // AI-only operating profit. We expose the revenue-range sensitivity in
  // low/high but hold margin constant.
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2022,
    value: -0.148e9,
    low: -0.297e9,
    high: -0.089e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out op profit. Cloud segment FY22 margin -11.29% (-$2.968B op loss / $26.28B revenue, 10-K) applied to AI carve-out revenue $1.31B → -$0.148B. Pro-rata margin assumption: assumes the AI portion of Cloud runs at the same margin as the segment overall. In 2022 the segment was unprofitable so the AI portion also reads as a loss. Range reflects AI-share uncertainty ($0.79-2.63B) at constant margin.",
    sources: [
      { name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 0.172e9,
    low: 0.120e9,
    high: 0.257e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out op profit. Cloud segment FY23 margin 5.19% ($1.716B op income / $33.088B revenue, 10-K) applied to AI carve-out revenue $3.31B → $0.172B. Pro-rata margin assumption. Range reflects AI-share uncertainty ($2.32-4.96B) at constant margin.",
    sources: [
      { name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 1.266e9,
    low: 0.959e9,
    high: 1.753e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out op profit. Cloud segment FY24 margin 14.14% ($6.112B op income / $43.229B revenue, 10-K) applied to AI carve-out revenue $8.95B → $1.266B. Pro-rata margin assumption — likely overstates true AI op profit because (a) AI Infrastructure carries heavier TPU/GPU depreciation than core GCP, and (b) consumer Gemini subs are probably loss-making at this stage. Range reflects AI-share uncertainty ($6.78-12.40B) at constant margin.",
    sources: [
      { name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 5.153e9,
    low: 3.762e9,
    high: 6.544e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out op profit. Cloud segment FY25 margin 23.66% ($13.91B op income / $58.79B revenue, 10-K) applied to AI carve-out revenue $21.78B → $5.153B. Pro-rata margin assumption — treat as an UPPER BOUND on AI op profit. Reasons: (a) AI Infrastructure (TPU/GPU rental) is widely understood to run lower margin than core GCP because of the heavy depreciation step-up from the 2024-2025 TPU buildout, (b) consumer Gemini subs are likely loss-making (Google One AI Pro/Ultra carries large per-user inference cost), so the implicit assumption that AI runs at full Cloud margin is generous. Range reflects AI-share uncertainty ($15.90-27.66B) at constant margin.",
    sources: [
      { name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 14.19e9,
    low: 11.55e9,
    high: 16.83e9,
    quality: "estimated",
    methodology:
      "AI-only carve-out op profit. Cloud segment Q1 2026 margin 33.0% ($6.6B op income / $20.0B revenue, 8-K) applied to AI carve-out revenue $43.0B → $14.19B. Same upper-bound caveat as prior years: AI portion of Cloud likely runs lower margin than the segment average given the magnitude of the 2026 capex step-up ($91.4B FY25 → $142.8B-$190B FY26 guide), which flows through as depreciation drag. Range reflects AI-share uncertainty ($35.0-51.0B) at constant margin.",
    sources: [
      { name: "Alphabet Q1 2026 earnings (SEC 8-K)", url: GOOG_Q1_2026_8K },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2022,
    value: 31.485e9,
    quality: "sourced",
    methodology: "Whole-company capex (Purchases of property and equipment), 2022 10-K cash flow statement.",
    sources: [{ name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2023,
    value: 32.251e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2023 10-K.",
    sources: [{ name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2024,
    value: 52.535e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2024 10-K.",
    sources: [{ name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2025,
    value: 91.4e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2025 10-K.",
    sources: [{ name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2026,
    value: 142.8e9,
    low: 142.8e9,
    high: 190e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 capex of $35.7B (×4). Range upper bound is Alphabet's FY26 capex guidance of $180-$190B (raised on Q1 2026 call, including Intersect acquisition).",
    sources: [{ name: "Alphabet Q1 2026 earnings (SEC 8-K)", url: GOOG_Q1_2026_8K }],
  },

  // ============ MICROSOFT (FY ends June 30) ============
  // AI carve-out methodology (NOT whole IC segment, NOT whole-company PP&E):
  //   - Revenue: AI-specific, anchored to Nadella's quarterly run-rate
  //     disclosures. Stated anchors: Q2 FY25 ($13B run rate, +175% YoY) and
  //     Q3 FY26 ($37B run rate, +123% YoY). Earlier years back-derived from
  //     YoY growth rates or estimated for pre-disclosure era (FY22-23).
  //   - Op profit: AI revenue × ~30% adjusted margin (range 20-40%). Above
  //     AWS (20%) due to higher SaaS mix (M365 Copilot, GitHub Copilot).
  //     Below IC overall (~40-47%) reflecting Azure AI depreciation drag,
  //     OpenAI compute supplied at partnership-rate, and Maia silicon ramp.
  //     Microsoft does NOT disclose AI-segment op profit anywhere.
  //   - Capex: per-year AI share of "Purchases of property and equipment"
  //     from SEC cash-flow statement. EXCLUDES finance leases (Microsoft
  //     uses leases heavily for data center equipment; lease-inclusive FY26
  //     guidance is ~$190B vs ~$123.5B PP&E-only). Sticking with PP&E line
  //     for cross-company consistency with AMZN/GOOG/NVDA.
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2022,
    value: 0.3e9,
    low: 0.1e9,
    high: 0.5e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out (FY22 = Jul 2021–Jun 2022). Pre-ChatGPT (launched Nov 2022). AI revenue was primarily Azure Cognitive Services + early Azure ML + Bing. Microsoft made no AI run-rate disclosures in this era. Estimated at ~0.4% of IC segment ($75.25B per FY22 10-K). Backward-extrapolation.",
    sources: [
      {
        name: "Microsoft 10-K FY22 (SEC) — IC segment baseline",
        url: MSFT_10K[2022],
      },
    ],
    note: "AI carve-out, not whole IC segment ($75.25B). Pre-disclosure era; wide range reflects estimation.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2023,
    value: 1.5e9,
    low: 1.0e9,
    high: 2.0e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out (FY23 = Jul 2022–Jun 2023). ChatGPT launched Nov 2022 (mid-FY23); Azure OpenAI Service general availability Jan 2023. Microsoft did not yet disclose an AI run-rate. Estimated at ~1.7% of IC segment ($87.91B per FY23 10-K). Backward-extrapolation from Q2 FY25 stated $13B at +175% YoY (implies Dec 2023 run rate ~$4.7B; full-year FY23 recognized revenue lower since H1 FY23 was pre-launch).",
    sources: [
      {
        name: "Microsoft 10-K FY23 (SEC) — IC segment baseline",
        url: MSFT_10K[2023],
      },
    ],
    note: "AI carve-out, not whole IC segment ($87.91B). Pre-disclosure era; back-derived from later YoY growth rates.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2024,
    value: 5.0e9,
    low: 4.0e9,
    high: 6.5e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out (FY24 = Jul 2023–Jun 2024). First year Microsoft started disclosing AI growth (though not a run-rate yet). M365 Copilot launched commercially Nov 2023. Estimated at ~4.7% of IC segment ($105.36B per FY24 10-K). Anchored to: (a) Q2 FY24 (Dec 2023) AI run rate back-derived from Q2 FY25 +175% YoY → ~$4.7B; (b) Q1 FY25 (Sep 2024) Nadella stated AI 'on track to surpass $10B run rate next quarter' → exit-FY24 run rate ~$8B. Average $5-6B run rate × 12 months ≈ full-year recognized ~$5B.",
    sources: [
      {
        name: "Microsoft 10-K FY24 (SEC) — IC segment baseline",
        url: MSFT_10K[2024],
      },
      {
        name: "Microsoft Q1 FY25 8-K (Oct 2024) — Nadella 'on track to $10B AI run rate'",
        url: MSFT_Q1_FY25_8K,
        date: "2024-10-30",
      },
    ],
    note: "AI carve-out, not whole IC segment ($105.36B). FY24 AI run-rate anchored to back-derivation from later disclosures.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2025,
    value: 13.0e9,
    low: 11.0e9,
    high: 15.0e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out (FY25 = Jul 2024–Jun 2025). Q2 FY25 (Dec 31, 2024) Microsoft stated AI annual run rate of $13B, up 175% YoY — primary disclosure. Q3 FY25 (Mar 31, 2025) back-derived from Q3 FY26 +123% YoY = $37B → ~$16.6B run rate. Year-average run rate ~$13B; full-year recognized revenue tracks the average. Microsoft did not provide a full-year FY25 AI revenue figure — only quarterly run rates.",
    sources: [
      {
        name: "Microsoft Q2 FY25 8-K (Jan 2025) — $13B AI run rate, +175% YoY",
        url: MSFT_Q2_FY25_8K,
        date: "2025-01-29",
      },
      {
        name: "Microsoft 10-K FY25 (SEC) — IC segment baseline",
        url: MSFT_10K[2025],
      },
    ],
    note: "AI carve-out, not whole IC segment ($106.27B). Primary disclosure: $13B AI run rate stated Q2 FY25. FY25 also includes Aug 2024 segment recast.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2026,
    value: 30.0e9,
    low: 25.0e9,
    high: 37.0e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out (FY26 = Jul 2025–Jun 2026). Q3 FY26 (Mar 31, 2026) Microsoft stated AI annual run rate of $37B, up 123% YoY — primary disclosure. Implies Q3 FY26 quarterly AI revenue of ~$9.25B (~11% of $82.9B total revenue). Full-year FY26 central estimate $30B reflects year-average run rate (entering FY26 at ~$20B, exiting near $45B+). Low $25B holds run rate growth flat from Q3 onward; high $37B treats the Q3 run rate as the full-year average.",
    sources: [
      {
        name: "Microsoft Q3 FY26 8-K (Apr 2026) — $37B AI run rate +123% YoY",
        url: MSFT_Q3_FY26_8K,
        date: "2026-04-29",
      },
      {
        name: "Microsoft Source.Microsoft.com (Apr 29, 2026) — Q3 FY26 release",
        url: MSFT_Q3_FY26_PR,
        date: "2026-04-29",
      },
      {
        name: "Microsoft Q3 FY26 10-Q (SEC) — IC segment baseline",
        url: MSFT_Q3_FY26_10Q,
      },
    ],
    note: "AI carve-out, not whole IC segment ($138.7B annualized). Primary disclosure: $37B AI run rate stated Q3 FY26. Includes Azure AI services, M365 Copilot (~20M paid seats per Q3 FY26 release), GitHub Copilot (~4.7M+ paid subscribers per Q2 FY26 8-K), and Azure OpenAI Service (OpenAI is 45% of Azure RPO).",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 0.09e9,
    low: 0.02e9,
    high: 0.20e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($0.3B central) × ~30% margin = $0.09B. FY22 IC segment overall margin was 43.5% ($32.7B / $75.25B per 10-K). AI margin assumed at ~30% (range 20-40%) — Microsoft does not disclose AI-segment op profit.",
    sources: [
      {
        name: "Microsoft 10-K FY22 (SEC) — IC segment op income baseline ($32.72B / 43.5%)",
        url: MSFT_10K[2022],
      },
    ],
    note: "AI carve-out is calculated (revenue × margin), not disclosed.",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 0.45e9,
    low: 0.20e9,
    high: 0.80e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($1.5B central) × ~30% margin = $0.45B. FY23 IC segment overall margin was 43.1% ($37.9B / $87.9B per 10-K). AI margin held at ~30% (range 20-40%).",
    sources: [
      {
        name: "Microsoft 10-K FY23 (SEC) — IC segment op income baseline ($37.88B / 43.1%)",
        url: MSFT_10K[2023],
      },
    ],
    note: "AI carve-out is calculated, not disclosed.",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 1.5e9,
    low: 0.8e9,
    high: 2.6e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($5.0B central) × ~30% margin = $1.5B. FY24 IC segment overall margin was 47.1% ($49.6B / $105.4B per 10-K) — the peak. AI margin assumed at ~30% (range 20-40%) — well below IC overall reflecting Azure AI depreciation ramp and Copilot launch-year investment.",
    sources: [
      {
        name: "Microsoft 10-K FY24 (SEC) — IC segment op income baseline ($49.58B / 47.1%)",
        url: MSFT_10K[2024],
      },
    ],
    note: "AI carve-out is calculated, not disclosed. IC overall margin peaked FY24 before AI capex depreciation began compressing it.",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 3.9e9,
    low: 2.2e9,
    high: 6.0e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($13B central) × ~30% margin = $3.9B. FY25 IC segment overall margin was 42.0% ($44.6B / $106.3B per 10-K) — down ~510 bps from FY24 peak, partly the Aug 2024 segment recast and partly AI infrastructure depreciation. AI-only margin assumed at ~30% (range 20-40%).",
    sources: [
      {
        name: "Microsoft 10-K FY25 (SEC) — IC segment op income baseline ($44.59B / 42.0%)",
        url: MSFT_10K[2025],
      },
      {
        name: "Microsoft Q2 FY25 8-K — $13B AI run rate",
        url: MSFT_Q2_FY25_8K,
        date: "2025-01-29",
      },
    ],
    note: "AI carve-out is calculated, not disclosed. FY25 also includes Aug 2024 segment recast complicating YoY margin comparison.",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 9.0e9,
    low: 5.0e9,
    high: 14.8e9,
    quality: "estimated",
    methodology:
      "AI-specific op profit: AI revenue ($30B central) × ~30% margin = $9.0B. Q3 FY26 IC segment overall margin was 39.6% ($13.75B / $34.7B per 10-Q). AI-only margin assumed at ~30% (range 20-40%) reflecting heavy Azure AI infrastructure depreciation, OpenAI compute supplied at partnership-rate (below commercial Azure margins), and Maia in-house silicon ramp. M365 Copilot SaaS mix supports the upper end of the range vs AWS.",
    sources: [
      {
        name: "Microsoft Q3 FY26 10-Q (SEC) — IC segment op income baseline ($55B annualized / 39.6%)",
        url: MSFT_Q3_FY26_10Q,
        date: "2026-04-29",
      },
      {
        name: "Microsoft Q3 FY26 8-K — $37B AI run rate disclosure",
        url: MSFT_Q3_FY26_8K,
        date: "2026-04-29",
      },
      {
        name: "FinancialContent — $37.5B AI Bill / Microsoft margin pressure analysis",
        url: MSFT_AI_BILL,
        date: "2026-02-17",
      },
    ],
    note: "AI carve-out is calculated, not disclosed. Range is wide (20-40% margin) — Microsoft does not break out AI-segment op profit anywhere.",
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2022,
    value: 6.0e9,
    low: 3.6e9,
    high: 9.6e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~25% (range 15-40%) of FY22 PP&E purchases ($23.89B per cash-flow statement). Pre-ChatGPT; capex was primarily general Azure cloud + datacenter expansion + corporate. Some early AI infrastructure (Azure ML, Cognitive Services) included.",
    sources: [
      {
        name: "Microsoft 10-K FY22 (SEC) — PP&E purchases baseline",
        url: MSFT_10K[2022],
      },
    ],
    note: "AI carve-out of PP&E cash-flow line ($23.89B); EXCLUDES finance leases. Pre-disclosure era backward-extrapolation.",
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2023,
    value: 11.2e9,
    low: 7.0e9,
    high: 15.5e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~40% (range 25-55%) of FY23 PP&E purchases ($28.11B per cash-flow statement). Mid-FY23 ChatGPT launch + Azure OpenAI Service GA + Copilot announcements drove initial AI capex ramp.",
    sources: [
      {
        name: "Microsoft 10-K FY23 (SEC) — PP&E purchases baseline",
        url: MSFT_10K[2023],
      },
    ],
    note: "AI carve-out of PP&E cash-flow line ($28.11B); EXCLUDES finance leases.",
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2024,
    value: 28.9e9,
    low: 22.2e9,
    high: 35.6e9,
    quality: "estimated",
    methodology:
      "AI-specific carve-out: ~65% (range 50-80%) of FY24 PP&E purchases ($44.48B per cash-flow statement). M365 Copilot commercial launch Nov 2023; Azure AI capacity ramp for OpenAI workloads. Management commentary in FY24 earnings calls increasingly attributed capex to AI infrastructure.",
    sources: [
      {
        name: "Microsoft 10-K FY24 (SEC) — PP&E purchases baseline",
        url: MSFT_10K[2024],
      },
    ],
    note: "AI carve-out of PP&E cash-flow line ($44.48B); EXCLUDES finance leases.",
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2025,
    value: 54.9e9,
    low: 48.4e9,
    high: 58.1e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out: ~85% (range 75-90%) of FY25 PP&E purchases ($64.55B per cash-flow statement). Management explicitly attributed the majority of FY25 capex to AI infrastructure (per FY25 10-K and earnings calls).",
    sources: [
      {
        name: "Microsoft 10-K FY25 (SEC) — PP&E purchases baseline + management AI commentary",
        url: MSFT_10K[2025],
      },
    ],
    note: "AI carve-out of PP&E cash-flow line ($64.55B); EXCLUDES finance leases. Microsoft FY25 capex including leases was ~$88B per management guidance — the lease-inclusive figure better reflects total AI infrastructure commitment but is not directly comparable to AMZN/GOOG/NVDA who don't lease data center equipment at similar scale.",
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2026,
    value: 111.2e9,
    low: 98.8e9,
    high: 123.5e9,
    quality: "sourced",
    methodology:
      "AI-specific carve-out: ~90% (range 80-100%) of FY26 PP&E purchases ($123.5B annualized from Q3 FY26 $30.9B × 4 per 10-Q). High case ($123.5B) treats all of cash-flow PP&E as AI, supported by management Q2 FY26 commentary that the quarter's ~$37.5B spend was 'AI-related infrastructure.' CFO Amy Hood Q3 FY26 guidance: FY26 capex INCLUDING finance leases will reach ~$190B, up from prior $150B guide due to $25B impact from soaring memory (HBM) prices — a direct AI dependency.",
    sources: [
      {
        name: "Microsoft Q3 FY26 10-Q (SEC) — PP&E purchases baseline",
        url: MSFT_Q3_FY26_10Q,
        date: "2026-04-29",
      },
      {
        name: "FinancialContent — $37.5B Q2 FY26 AI infrastructure spend, $150B annualized",
        url: MSFT_AI_BILL,
        date: "2026-02-17",
      },
      {
        name: "CNBC — Microsoft FY26 capex raised to $190B on memory prices (incl. leases)",
        url: MSFT_CNBC_190B,
        date: "2026-04-29",
      },
    ],
    note: "AI carve-out of PP&E cash-flow line ($123.5B); EXCLUDES finance leases. Microsoft's own FY26 capex guidance is ~$190B including leases — not directly comparable to other companies' cash-flow capex.",
  },

  // ============ OPENAI (private; CY) ============
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2022,
    value: 28e6,
    quality: "sourced",
    methodology:
      "Total CY2022 recognized revenue per The Information's reporting on OpenAI's internal financials.",
    sources: [
      {
        name: "The Information (May 2023)",
        url: "https://www.theinformation.com/articles/openais-losses-doubled-to-540-million-as-it-developed-chatgpt",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2023,
    value: 1.0e9,
    quality: "sourced",
    methodology:
      "Full-year 2023 revenue per The Information's \"OpenAI's Revenue Ambitions\" chart (Mar 26, 2026).",
    sources: [
      {
        name: "The Information (Mar 4, 2026) — OpenAI Tops $25B Annualized",
        url: "https://www.theinformation.com/articles/openai-tops-25-billion-annualized-revenue-anthropic-narrows-gap",
        date: "2026-03-04",
      },
    ],
    note: "Full-year actual. The earlier $1.6B figure was the end-2023 annualized run-rate (Dec 2023), not full-year revenue.",
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2024,
    value: 4.0e9,
    quality: "sourced",
    methodology:
      "Full-year 2024 revenue per The Information's \"OpenAI's Revenue Ambitions\" chart (Mar 26, 2026).",
    sources: [
      {
        name: "The Information (Mar 4, 2026)",
        url: "https://www.theinformation.com/articles/openai-tops-25-billion-annualized-revenue-anthropic-narrows-gap",
        date: "2026-03-04",
      },
    ],
    note: "Full-year actual. Supersedes Sep 2024 projection of $3.7B (CNBC citing NYT-obtained docs).",
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2025,
    value: 13.0e9,
    quality: "sourced",
    methodology:
      "Recognized CY2025 revenue per The Information / Fortune (citing OpenAI internal financial documents). H1 2025 was $4.3B; exit ARR ~$20B.",
    sources: [
      {
        name: "Fortune (Nov 2025)",
        url: "https://fortune.com/2025/11/12/openai-cash-burn-rate-annual-losses-2028-profitable-2030-financial-documents/",
      },
      {
        name: "The Information (H1 2025 results)",
        url: "https://www.theinformation.com/articles/openais-first-half-results-4-3-billion-sales-2-5-billion-cash-burn",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2026,
    value: 30.0e9,
    quality: "sourced",
    methodology:
      "OpenAI's internal full-year 2026 revenue projection of $30B, per The Information. Q1 2026 actual was $5.7B, consistent with the projection.",
    sources: [
      {
        name: "The Information (Mar 4, 2026) — OpenAI's Revenue Ambitions",
        url: "https://www.theinformation.com/articles/openai-tops-25-billion-annualized-revenue-anthropic-narrows-gap",
        date: "2026-03-04",
      },
      {
        name: "The Information (May 26, 2026) — Anthropic Likely 35% More Revenue",
        url: "https://www.theinformation.com/articles/anthropic-is-likely-generating-at-least-35-more-revenue-than-openai",
        date: "2026-05-26",
      },
      {
        name: "The Information (May 21, 2026) — Q1 $5.7B",
        url: "https://www.theinformation.com/articles/openai-generated-nearly-6-billion-in-revenue-in-first-quarter-boosted-by-codex",
        date: "2026-05-21",
      },
    ],
    note: "Company internal projection. Q1 actual: $5.7B. Annualized run-rate: $25B (Feb), $30B (Mar), ~$33B (May 2026).",
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2022,
    value: -0.54e9,
    quality: "sourced",
    methodology: "Operating loss per The Information's May 2023 reporting on OpenAI internal financials.",
    sources: [
      {
        name: "The Information (May 2023)",
        url: "https://www.theinformation.com/articles/openais-losses-doubled-to-540-million-as-it-developed-chatgpt",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2023,
    value: -1e9,
    low: -1.5e9,
    high: -0.5e9,
    quality: "estimated",
    methodology:
      "No clean public disclosure for 2023 operating loss. Range bracketed by 2022 (-$540M) and 2024 (~-$5B).",
    sources: [
      {
        name: "CNBC (Sep 2024) — context",
        url: "https://www.cnbc.com/2024/09/27/openai-sees-5-billion-loss-this-year-on-3point7-billion-in-revenue.html",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2024,
    value: -5e9,
    quality: "sourced",
    methodology:
      "2024 loss ~$5B per OpenAI financial documents obtained by The New York Times and reported by CNBC.",
    sources: [
      {
        name: "CNBC (Sep 2024)",
        url: "https://www.cnbc.com/2024/09/27/openai-sees-5-billion-loss-this-year-on-3point7-billion-in-revenue.html",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2025,
    value: -8.5e9,
    low: -9e9,
    high: -8e9,
    quality: "sourced",
    methodology:
      "Cash burn $8-9B for 2025 per The Information / Fortune reporting on internal OpenAI financial documents.",
    sources: [
      {
        name: "Fortune (Nov 2025)",
        url: "https://fortune.com/2025/11/12/openai-cash-burn-rate-annual-losses-2028-profitable-2030-financial-documents/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2026,
    value: -36.6e9,
    quality: "calculated",
    methodology:
      "Q1 2026 adjusted operating margin of -122% (per The Information) applied to full-year 2026 revenue of $30B = -$36.6B adjusted operating loss (excludes SBC, includes training costs).",
    sources: [
      {
        name: "The Information (May 21, 2026) — OpenAI Q1 $5.7B / -122% margin",
        url: "https://www.theinformation.com/articles/openai-generated-nearly-6-billion-in-revenue-in-first-quarter-boosted-by-codex",
        date: "2026-05-21",
      },
      {
        name: "The Information (May 26, 2026) — Q1 lost at least $7B",
        url: "https://www.theinformation.com/articles/anthropic-is-likely-generating-at-least-35-more-revenue-than-openai",
        date: "2026-05-26",
      },
    ],
    note: "Adjusted operating loss (excl. SBC, incl. training costs). Q1 2026 actual: ~-$7B on $5.7B revenue. Methodology: hold Q1 margin constant. Cash burn projection separately reported at $25B.",
  },

  // ============ ANTHROPIC (private; CY) ============
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2022,
    value: 5e6,
    quality: "estimated",
    methodology:
      "Pre-API-launch. Year-end 2022 ARR was ~$10M; recognized CY2022 revenue est. <$5M.",
    sources: [
      {
        name: "VentureBeat on Anthropic trajectory",
        url: "https://venturebeat.com/technology/anthropic-says-it-hit-a-30-billion-revenue-run-rate-after-crazy-80x-growth",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2023,
    value: 60e6,
    quality: "estimated",
    methodology:
      "Reached ~$100M ARR by end of 2023 from near-zero in Jan. Recognized full-year revenue estimated ~$60M.",
    sources: [
      {
        name: "VentureBeat on Anthropic growth",
        url: "https://venturebeat.com/technology/anthropic-says-it-hit-a-30-billion-revenue-run-rate-after-crazy-80x-growth",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2024,
    value: 1.0e9,
    low: 0.85e9,
    high: 1.0e9,
    quality: "sourced",
    methodology:
      "Recognized CY2024 revenue in the $850M-$1B range per The Information; Anthropic exited 2024 at ~$1B ARR.",
    sources: [
      {
        name: "The Information (Feb 2025)",
        url: "https://www.theinformation.com/briefings/anthropic-projected-to-burn-more-than-2-7-billion-in-cash-this-year",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2025,
    value: 4.5e9,
    quality: "sourced",
    methodology:
      "Recognized CY2025 revenue per The Information. Exit ARR was ~$9B at end of 2025.",
    sources: [
      {
        name: "The Information",
        url: "https://www.theinformation.com/articles/anthropic-lowers-profit-margin-projection-revenue-skyrockets",
      },
    ],
    note: "Reported gross of cloud-reseller (AWS Bedrock, Google Vertex). Net basis ~20% lower.",
  },
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2026,
    value: 37.5e9,
    quality: "calculated",
    methodology:
      "Q1 actual $4.8B + Q2 projected $10.9B + Q2 × 2 estimate for H2 ($21.8B) = $37.5B full-year 2026.",
    sources: [
      {
        name: "WSJ (May 20, 2026) — Anthropic First Profitable Quarter",
        url: "https://www.wsj.com/tech/ai/mind-blowing-growth-is-about-to-propel-anthropic-into-its-first-profitable-quarter-7edbf2f4",
        date: "2026-05-20",
      },
      {
        name: "The Information (May 21, 2026)",
        url: "https://www.theinformation.com/articles/openai-generated-nearly-6-billion-in-revenue-in-first-quarter-boosted-by-codex",
        date: "2026-05-21",
      },
      {
        name: "The Information (May 26, 2026)",
        url: "https://www.theinformation.com/articles/anthropic-is-likely-generating-at-least-35-more-revenue-than-openai",
        date: "2026-05-26",
      },
    ],
    note: "Reported gross of cloud-reseller (AWS Bedrock, Google Vertex). Annualized run-rate reached ~$45B in mid-May 2026.",
  },
  {
    ticker: "ANTH",
    metric: "ai_operating_profit",
    fy: 2024,
    value: -5.6e9,
    quality: "sourced",
    methodology:
      "2024 cash burn ~$5.6B per The Information reporting on Anthropic internal documents.",
    sources: [
      {
        name: "The Information (Feb 2025)",
        url: "https://www.theinformation.com/briefings/anthropic-projected-to-burn-more-than-2-7-billion-in-cash-this-year",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_operating_profit",
    fy: 2025,
    value: -3e9,
    quality: "estimated",
    methodology:
      "Cash burn ~$3B for 2025 per The Information reporting; lower than 2024 as efficiency gains offset growth investment.",
    sources: [
      {
        name: "The Information",
        url: "https://www.theinformation.com/articles/anthropic-lowers-profit-margin-projection-revenue-skyrockets",
      },
    ],
    note: "Cash burn vs. accrual operating loss may differ due to deferred GPU commitments.",
  },
  {
    ticker: "ANTH",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 0.9e9,
    low: -2.0e9,
    high: 1.9e9,
    quality: "calculated",
    methodology:
      "Derivation from H1 2026 numbers only: Q1 actual op loss ~-$0.75B (read off WSJ May 20, 2026 chart \"Anthropic's operating income, by segment\") + Q2 projected op profit +$0.559B (stated, WSJ May 20) + H2 estimate at Q2 × 2 = +$1.118B → full-year ≈ +$0.9B adjusted operating income (excludes SBC, includes training costs).",
    sources: [
      {
        name: "WSJ (May 20, 2026) — Anthropic First Profitable Quarter",
        url: "https://www.wsj.com/tech/ai/mind-blowing-growth-is-about-to-propel-anthropic-into-its-first-profitable-quarter-7edbf2f4",
        date: "2026-05-20",
      },
      {
        name: "The Information (May 21, 2026)",
        url: "https://www.theinformation.com/articles/openai-generated-nearly-6-billion-in-revenue-in-first-quarter-boosted-by-codex",
        date: "2026-05-21",
      },
      {
        name: "The Information (May 26, 2026)",
        url: "https://www.theinformation.com/articles/anthropic-is-likely-generating-at-least-35-more-revenue-than-openai",
        date: "2026-05-26",
      },
    ],
    note: "Derivation from H1 numbers only — not a company-disclosed full-year figure. Q2 marks Anthropic's first projected profitable quarter (+$559M / ~5% margin). Anthropic has signaled it may ramp server spend in H2 to keep up with revenue growth, which could push the full year back into negative territory. Range reflects this: low -$2B (H2 server spend ramps, margin reverts) to high +$1.9B (Q2 margin holds across full year).",
  },

  // ============ Reported D&A (whole-company, from each company's cash-flow
  // statement). Used as a reference marker on the AI capex — amortized chart.
  // Whole-company scope matches the whole-company capex numerator on the same
  // chart, so the comparison stays self-consistent. ============

  // ---------- Amazon D&A ----------
  {
    ticker: "AMZN",
    metric: "ai_da_reported",
    fy: 2022,
    value: 41.921e9,
    quality: "sourced",
    methodology:
      "Whole-company depreciation and amortization of property and equipment, capitalized content costs, operating lease assets, and other — from the 2022 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY22 (SEC)", url: AMZN_10K[2022] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_da_reported",
    fy: 2023,
    value: 48.663e9,
    quality: "sourced",
    methodology: "Whole-company D&A, 2023 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY23 (SEC)", url: AMZN_10K[2023] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_da_reported",
    fy: 2024,
    value: 52.795e9,
    quality: "sourced",
    methodology: "Whole-company D&A, 2024 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY24 (SEC)", url: AMZN_10K[2024] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_da_reported",
    fy: 2025,
    value: 65.756e9,
    quality: "sourced",
    methodology: "Whole-company D&A, 2025 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY25 (SEC)", url: AMZN_10K[2025] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_da_reported",
    fy: 2026,
    value: 75.78e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 D&A of $18.945B (×4). Q1 actual from Amazon Q1 2026 10-Q cash-flow statement.",
    sources: [{ name: "Amazon Q1 2026 10-Q (SEC)", url: AMZN_Q1_2026_10Q }],
  },

  // ---------- Google D&A ----------
  {
    ticker: "GOOG",
    metric: "ai_da_reported",
    fy: 2022,
    value: 15.287e9,
    quality: "sourced",
    methodology:
      "Whole-company depreciation and impairment of property and equipment + amortization of intangible assets, from the 2022 10-K cash-flow statement.",
    sources: [{ name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_da_reported",
    fy: 2023,
    value: 11.946e9,
    quality: "sourced",
    methodology:
      "Whole-company D&A, 2023 10-K cash-flow statement. The year-on-year decline reflects the Jan 2023 useful-life extension for servers and certain network equipment from 4 years to 6 years, which Alphabet disclosed reduced 2023 depreciation by ~$3.4B.",
    sources: [{ name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] }],
    note: "Jan 2023 4→6yr server useful-life extension cut FY23 D&A by ~$3.4B per Alphabet's disclosure.",
  },
  {
    ticker: "GOOG",
    metric: "ai_da_reported",
    fy: 2024,
    value: 15.311e9,
    quality: "sourced",
    methodology: "Whole-company D&A, 2024 10-K cash-flow statement.",
    sources: [{ name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_da_reported",
    fy: 2025,
    value: 55e9,
    low: 50e9,
    high: 60e9,
    quality: "estimated",
    methodology:
      "Estimated full-year FY25 D&A. TTM ending Sept 30 2025 was $44.4B and Q3 2025 D&A alone was $15.1B (Alphabet 10-Q), so full-year FY25 is in the $50-60B range. Awaiting full FY25 10-K for sourcing.",
    sources: [{ name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] }],
    note: "FY25 D&A roughly 3.5× FY24, reflecting the AI server capex ramp finally flowing through depreciation.",
  },
  {
    ticker: "GOOG",
    metric: "ai_da_reported",
    fy: 2026,
    value: 70e9,
    low: 60e9,
    high: 80e9,
    quality: "estimated",
    methodology:
      "Estimated FY26 D&A based on Q3 2025 quarterly run-rate ($15.1B) trending higher into 2026. Range reflects uncertainty in the depreciation step-up curve from the 2025 capex acceleration.",
    sources: [{ name: "Alphabet Q1 2026 8-K (SEC)", url: GOOG_Q1_2026_8K }],
  },

  // ---------- Microsoft D&A (fiscal year ending June 30) ----------
  {
    ticker: "MSFT",
    metric: "ai_da_reported",
    fy: 2022,
    value: 14.46e9,
    quality: "sourced",
    methodology:
      "Whole-company depreciation, amortization, and other, FY22 10-K cash-flow statement.",
    sources: [{ name: "Microsoft 10-K FY22 (SEC)", url: MSFT_10K[2022] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_da_reported",
    fy: 2023,
    value: 13.861e9,
    quality: "sourced",
    methodology:
      "Whole-company D&A, FY23 10-K cash-flow statement. The FY23 dip reflects the FY23 server useful-life extension from 4 years to 6 years, applied prospectively.",
    sources: [{ name: "Microsoft 10-K FY23 (SEC)", url: MSFT_10K[2023] }],
    note: "FY23 4→6yr server useful-life extension. Microsoft disclosed the change in the FY23 10-K Property & Equipment footnote.",
  },
  {
    ticker: "MSFT",
    metric: "ai_da_reported",
    fy: 2024,
    value: 22.287e9,
    quality: "sourced",
    methodology: "Whole-company D&A, FY24 10-K cash-flow statement.",
    sources: [{ name: "Microsoft 10-K FY24 (SEC)", url: MSFT_10K[2024] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_da_reported",
    fy: 2025,
    value: 34.153e9,
    quality: "sourced",
    methodology: "Whole-company D&A, FY25 10-K cash-flow statement.",
    sources: [{ name: "Microsoft 10-K FY25 (SEC)", url: MSFT_10K[2025] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_da_reported",
    fy: 2026,
    value: 52e9,
    low: 48e9,
    high: 58e9,
    quality: "estimated",
    methodology:
      "Estimated FY26 D&A annualized from Q3 FY26 trajectory. FY25 Q3 D&A was $9.2B; FY26 Q3 likely ~$13B given the capex doubling, implying ~$52B full year. Range reflects uncertainty in the within-fiscal-year ramp.",
    sources: [
      { name: "Microsoft Q3 FY26 10-Q (SEC)", url: MSFT_Q3_FY26_10Q },
    ],
  },

  // ---------- NVIDIA D&A (fiscal year ending late January) ----------
  {
    ticker: "NVDA",
    metric: "ai_da_reported",
    fy: 2022,
    value: 1.174e9,
    quality: "sourced",
    methodology:
      "Whole-company D&A, FY22 10-K cash-flow statement. Tiny vs hyperscalers — NVDA is fabless, owns no fabs and no hyperscale data centers; most D&A is on offices, internal R&D infrastructure, and operating-lease right-of-use assets.",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_da_reported",
    fy: 2023,
    value: 1.544e9,
    quality: "sourced",
    methodology: "Whole-company D&A, FY23 10-K cash-flow statement.",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_da_reported",
    fy: 2024,
    value: 1.508e9,
    quality: "sourced",
    methodology: "Whole-company D&A, FY24 10-K cash-flow statement.",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_da_reported",
    fy: 2025,
    value: 4.082e9,
    quality: "sourced",
    methodology:
      "Whole-company D&A, FY25 10-K cash-flow statement. Step-up driven by internal AI infrastructure for R&D (Eos supercomputer) plus operating-lease right-of-use amortization as NVDA expanded leased data-center footprint.",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_da_reported",
    fy: 2026,
    value: 5.786e9,
    quality: "sourced",
    methodology: "Whole-company D&A, FY26 10-K cash-flow statement.",
    sources: [{ name: "NVIDIA 10-K FY26 (SEC)", url: NVDA_10K[2026] }],
  },

  // ---------- OpenAI D&A (no GPU PP&E — compute is rented opex) ----------
  ...([2022, 2023, 2024, 2025, 2026] as const).map((fy) => ({
    ticker: "OAI",
    metric: "ai_da_reported" as const,
    fy,
    value: 0,
    quality: "estimated" as const,
    methodology:
      "OpenAI does not own GPU infrastructure — all compute is rented from Microsoft Azure / Oracle / Stargate under multi-year cloud commitments and recognized as operating expense, not capex. There is no meaningful AI-infrastructure D&A on the OpenAI balance sheet.",
    sources: [],
  })),

  // ---------- Anthropic D&A (no GPU PP&E — compute is rented opex) ----------
  ...([2022, 2023, 2024, 2025, 2026] as const).map((fy) => ({
    ticker: "ANTH",
    metric: "ai_da_reported" as const,
    fy,
    value: 0,
    quality: "estimated" as const,
    methodology:
      "Anthropic does not own GPU infrastructure — all compute is rented from AWS Trainium, Google TPU, and SpaceX under multi-year cloud commitments and recognized as operating expense, not capex. There is no meaningful AI-infrastructure D&A on the Anthropic balance sheet.",
    sources: [],
  })),
];

async function main() {
  for (const c of PRIVATE_COMPANIES) {
    await db
      .insert(schema.companies)
      .values({
        cik: c.cik,
        ticker: c.ticker,
        name: c.name,
        segment: c.segment,
        isPublic: c.isPublic,
        fiscalYearEnd: c.fiscalYearEnd,
      })
      .onConflictDoNothing();
  }

  // Wipe existing AI economics facts so re-seeding is idempotent.
  db.delete(schema.aiEconomicsFacts).run();

  const now = new Date().toISOString();
  let inserted = 0;
  for (const f of FACTS) {
    try {
      await db
        .insert(schema.aiEconomicsFacts)
        .values({
          companyTicker: f.ticker,
          metric: f.metric,
          fiscalYear: f.fy,
          valueUsd: f.value,
          valueLowUsd: f.low ?? null,
          valueHighUsd: f.high ?? null,
          dataQuality: f.quality,
          methodology: f.methodology,
          sources: JSON.stringify(f.sources),
          note: f.note ?? null,
          lastVerifiedAt: now,
        })
        .onConflictDoNothing();
      inserted += 1;
    } catch (err) {
      console.warn(
        `  skip ${f.ticker} ${f.metric} ${f.fy}: ${(err as Error).message}`,
      );
    }
  }
  console.log(`Inserted ${inserted} AI economics facts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
