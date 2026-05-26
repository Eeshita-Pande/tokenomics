import "dotenv/config";
import { db, schema } from "../src/db";

type Source = { name: string; url: string; date?: string; snippet?: string };
type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
type Metric = "ai_capex" | "ai_capex_amortized" | "ai_revenue" | "ai_operating_profit";

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

const NVDA_PR = (fy: number) =>
  `https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-${fy}`;

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

const FACTS: Fact[] = [
  // ============ NVIDIA (FY ends late January) ============
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2022,
    value: 10.61e9,
    quality: "sourced",
    methodology:
      "Data Center segment revenue, reported in NVIDIA's Q4 FY22 press release and 10-K segment table.",
    sources: [
      { name: "NVIDIA Q4 FY22 press release", url: NVDA_PR(2022) },
      {
        name: "NVIDIA 10-K FY22",
        url: "https://www.sec.gov/Archives/edgar/data/0001045810/000104581022000036/nvda-20220130.htm",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2023,
    value: 15.01e9,
    quality: "sourced",
    methodology: "Data Center segment revenue (FY ended Jan 2023).",
    sources: [
      { name: "NVIDIA Q4 FY23 press release", url: NVDA_PR(2023) },
      {
        name: "NVIDIA 10-K FY23",
        url: "https://www.sec.gov/Archives/edgar/data/0001045810/000104581023000017/nvda-20230129.htm",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2024,
    value: 47.5e9,
    quality: "sourced",
    methodology: "Data Center segment revenue (FY ended Jan 2024).",
    sources: [
      { name: "NVIDIA Q4 FY24 press release", url: NVDA_PR(2024) },
      {
        name: "NVIDIA 10-K FY24",
        url: "https://www.sec.gov/Archives/edgar/data/0001045810/000104581024000029/nvda-20240128.htm",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2025,
    value: 115.2e9,
    quality: "sourced",
    methodology: "Data Center segment revenue (FY ended Jan 2025).",
    sources: [
      { name: "NVIDIA Q4 FY25 press release", url: NVDA_PR(2025) },
      {
        name: "NVIDIA 10-K FY25",
        url: "https://www.sec.gov/Archives/edgar/data/0001045810/000104581025000023/nvda-20250126.htm",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 4.598e9,
    quality: "sourced",
    methodology:
      "Compute & Networking reportable segment operating income — closest proxy for AI segment operating profit since NVIDIA does not separately disclose Data Center op income.",
    sources: [
      {
        name: "NVIDIA 10-K FY22 reportable segments (Stock Analysis On Net)",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/NVIDIA-Corp/Ratios/Reportable-Segments",
      },
    ],
    note: "Compute & Networking ≈ Data Center + networking; Data Center is the dominant share.",
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 5.083e9,
    quality: "sourced",
    methodology: "Compute & Networking segment op income (FY23).",
    sources: [
      {
        name: "NVIDIA reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/NVIDIA-Corp/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 32.016e9,
    quality: "sourced",
    methodology: "Compute & Networking segment op income (FY24).",
    sources: [
      {
        name: "NVIDIA reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/NVIDIA-Corp/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 82.875e9,
    quality: "sourced",
    methodology: "Compute & Networking segment op income (FY25).",
    sources: [
      {
        name: "NVIDIA reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/NVIDIA-Corp/Ratios/Reportable-Segments",
      },
    ],
  },

  // ============ AMAZON (CY ends Dec 31) ============
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2022,
    value: 80.096e9,
    quality: "sourced",
    methodology: "AWS segment net sales as reported in Amazon 2022 10-K.",
    sources: [
      {
        name: "Amazon 10-K FY22 reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
    note: "AWS revenue treated as AI-segment proxy; AWS includes non-AI workloads. Apply AI-share slider for AI-only attribution.",
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2023,
    value: 90.757e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2023 10-K.",
    sources: [
      {
        name: "Amazon reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2024,
    value: 107.556e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2024 10-K.",
    sources: [
      {
        name: "Amazon Q4 2024 8-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001018724/000101872425000002/amzn-20241231xex991.htm",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2025,
    value: 128.725e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2025 10-K.",
    sources: [
      {
        name: "Amazon Q4 2025 8-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001018724/000110465925033450/tm254123d3_ex99-1.htm",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 22.841e9,
    quality: "sourced",
    methodology: "AWS segment operating income from 2022 10-K.",
    sources: [
      {
        name: "Amazon reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 24.631e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2023 10-K.",
    sources: [
      {
        name: "Amazon reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 39.834e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2024 10-K.",
    sources: [
      {
        name: "Amazon reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 45.606e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2025 10-K.",
    sources: [
      {
        name: "Amazon reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2022,
    value: 63.645e9,
    quality: "sourced",
    methodology:
      "Whole-company capex (PaymentsToAcquireProductiveAssets, 10-K cash-flow statement). Amazon's MD&A attributes the bulk to AWS technology infrastructure. Treated here as the AI-attributable upper bound per the same convention isaiprofitable.com uses.",
    sources: [
      {
        name: "Amazon PP&E summary",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Analysis/Property-Plant-and-Equipment",
      },
    ],
    note: "AI attribution = 100% per MD&A is the bear-case framing. AI-share slider applied separately.",
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2023,
    value: 52.729e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2023 10-K. Same attribution caveat.",
    sources: [
      {
        name: "Amazon PP&E summary",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Analysis/Property-Plant-and-Equipment",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2024,
    value: 82.999e9,
    quality: "sourced",
    methodology:
      "Whole-company capex, 2024 10-K. MD&A explicitly attributes increase to AWS infrastructure including AI/ML.",
    sources: [
      {
        name: "Amazon PP&E summary",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Analysis/Property-Plant-and-Equipment",
      },
    ],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2025,
    value: 131.819e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2025 10-K. MD&A AI attribution.",
    sources: [
      {
        name: "Amazon PP&E summary",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Amazoncom-Inc/Analysis/Property-Plant-and-Equipment",
      },
    ],
  },

  // ============ ALPHABET / GOOG (CY ends Dec 31) ============
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2022,
    value: 26.28e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2022 10-K.",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
      {
        name: "Alphabet 2022 10-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001652044/000165204423000016/goog-20221231.htm",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2023,
    value: 33.088e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2023 10-K.",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2024,
    value: 43.229e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2024 10-K.",
    sources: [
      {
        name: "Alphabet Q4 2024 8-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001652044/000165204425000010/googexhibit991q42024.htm",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2025,
    value: 58.705e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2025 10-K / Q4 2025 release.",
    sources: [
      {
        name: "Alphabet Q4 2025 earnings release",
        url: "https://s206.q4cdn.com/479360582/files/doc_financials/2025/q4/2025q4-alphabet-earnings-release.pdf",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2022,
    value: -2.968e9,
    quality: "sourced",
    methodology: "Google Cloud segment operating loss, 2022 10-K.",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 1.716e9,
    quality: "sourced",
    methodology: "Google Cloud segment op income, 2023 10-K (first profitable year).",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 6.112e9,
    quality: "sourced",
    methodology: "Google Cloud segment op income, 2024 10-K.",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 13.91e9,
    quality: "sourced",
    methodology: "Google Cloud segment op income, 2025 10-K.",
    sources: [
      {
        name: "Alphabet reportable segments",
        url: "https://www.stock-analysis-on.net/NASDAQ/Company/Alphabet-Inc/Ratios/Reportable-Segments",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2022,
    value: 31.485e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2022 10-K cash flow statement.",
    sources: [
      {
        name: "Alphabet 2022 10-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001652044/000165204423000016/goog-20221231.htm",
      },
    ],
    note: "Capex is whole-company; AI attribution per Alphabet MD&A states 60% of technical infrastructure assets are servers + networking equipment.",
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2023,
    value: 32.251e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2023 10-K.",
    sources: [
      {
        name: "Alphabet 2023 10-K",
        url: "https://www.sec.gov/Archives/edgar/data/0001652044/000165204424000022/goog-20231231.htm",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2024,
    value: 52.535e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2024 10-K.",
    sources: [
      {
        name: "CNBC reporting Alphabet $75B 2025 capex plan",
        url: "https://www.cnbc.com/2025/02/04/alphabet-expects-to-invest-about-75-billion-in-capex-in-2025.html",
      },
    ],
  },
  {
    ticker: "GOOG",
    metric: "ai_capex",
    fy: 2025,
    value: 91.4e9,
    low: 91e9,
    high: 93e9,
    quality: "sourced",
    methodology:
      "Whole-company capex 2025 actual. Guidance raised to $91-93B in Q3 2025; final FY actual within that range.",
    sources: [
      {
        name: "Alphabet Q4 2025 earnings release",
        url: "https://s206.q4cdn.com/479360582/files/doc_financials/2025/q4/2025q4-alphabet-earnings-release.pdf",
      },
    ],
  },

  // ============ MICROSOFT (FY ends June 30) ============
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2022,
    value: 75.251e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment revenue, MSFT FY22 (ended June 2022). Closest segment proxy for AI/cloud revenue.",
    sources: [
      {
        name: "MSFT FY22 Q4 press release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2022-Q4/press-release-webcast",
      },
      {
        name: "MSFT 10-K FY22",
        url: "https://www.sec.gov/Archives/edgar/data/0000789019/000156459022026876/msft-10k_20220630.htm",
      },
    ],
    note: "MSFT segment shift in FY25 redistributed some Azure consumption to Productivity & MPC — FY25 numbers are not directly comparable to prior years.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2023,
    value: 87.907e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment revenue, FY23 (ended June 2023).",
    sources: [
      {
        name: "MSFT FY23 Q4 press release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2023-Q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2024,
    value: 105.362e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment revenue, FY24 (ended June 2024).",
    sources: [
      {
        name: "MSFT 10-K FY24",
        url: "https://www.sec.gov/Archives/edgar/data/0000789019/000095017024087843/msft-20240630.htm",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2025,
    value: 106.265e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment revenue, FY25 (ended June 2025). FY25 segment reorg redistributed some Azure consumption.",
    sources: [
      {
        name: "MSFT FY25 Q4 release",
        url: "https://www.microsoft.com/en-us/investor/earnings/fy-2025-q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 32.721e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment operating income, FY22.",
    sources: [
      {
        name: "MSFT FY22 Q4 release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2022-Q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 37.884e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment op income, FY23.",
    sources: [
      {
        name: "MSFT FY23 Q4 release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2023-Q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 49.584e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment op income, FY24.",
    sources: [
      {
        name: "MSFT 10-K FY24",
        url: "https://www.sec.gov/Archives/edgar/data/0000789019/000095017024087843/msft-20240630.htm",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 44.589e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment op income, FY25. Decline reflects segment reorganization redistribution.",
    sources: [
      {
        name: "MSFT FY25 Q4 release",
        url: "https://www.microsoft.com/en-us/investor/earnings/fy-2025-q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2022,
    value: 23.886e9,
    quality: "sourced",
    methodology: "Additions to PP&E from cash flow statement, FY22.",
    sources: [
      {
        name: "MSFT FY22 Q4 release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2022-Q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2023,
    value: 28.107e9,
    quality: "sourced",
    methodology: "Additions to PP&E, FY23.",
    sources: [
      {
        name: "MSFT FY23 Q4 release",
        url: "https://www.microsoft.com/en-us/Investor/earnings/FY-2023-Q4/press-release-webcast",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2024,
    value: 44.477e9,
    quality: "sourced",
    methodology: "Additions to PP&E, FY24.",
    sources: [
      {
        name: "MSFT 10-K FY24",
        url: "https://www.sec.gov/Archives/edgar/data/0000789019/000095017024087843/msft-20240630.htm",
      },
    ],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2025,
    value: 64.551e9,
    quality: "sourced",
    methodology:
      "Additions to PP&E, FY25. MSFT management explicitly attributes majority to AI infrastructure.",
    sources: [
      {
        name: "MSFT FY25 Q4 release",
        url: "https://www.microsoft.com/en-us/investor/earnings/fy-2025-q4/press-release-webcast",
      },
    ],
  },

  // ============ OPENAI (private; CY) ============
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2022,
    value: 28e6,
    quality: "sourced",
    methodology:
      "Total CY2022 recognized revenue, widely cited. Includes only pre-ChatGPT revenue plus December 2022 ARR.",
    sources: [
      {
        name: "The Information: OpenAI 2022 losses doubled to $540M",
        url: "https://www.theinformation.com/articles/openais-losses-doubled-to-540-million-as-it-developed-chatgpt",
      },
      {
        name: "SaaStr: OpenAI 3-year sprint",
        url: "https://www.saastr.com/openai-crosses-12-billion-arr-the-3-year-sprint-that-redefined-whats-possible-in-scaling-software/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2023,
    value: 1.6e9,
    low: 1.6e9,
    high: 2.0e9,
    quality: "inconsistent",
    methodology:
      "Reuters reported ARR at end of 2023 ~$1.6B; CFO later referenced ~$2B for 2023. Range reflects ARR-vs-recognized-revenue ambiguity.",
    sources: [
      {
        name: "SiliconANGLE (citing Reuters)",
        url: "https://siliconangle.com/2024/01/01/openais-annualized-revenue-reportedly-tops-1-6b/",
      },
      {
        name: "SaaStr CFO trajectory",
        url: "https://www.saastr.com/openai-crosses-12-billion-arr-the-3-year-sprint-that-redefined-whats-possible-in-scaling-software/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2024,
    value: 3.7e9,
    quality: "sourced",
    methodology: "Recognized CY2024 revenue per The Information internal-docs reporting.",
    sources: [
      {
        name: "Epoch AI: OpenAI revenue",
        url: "https://epoch.ai/data-insights/openai-revenue",
      },
      {
        name: "DCD on The Information leak",
        url: "https://www.datacenterdynamics.com/en/news/openai-training-and-inference-costs-could-reach-7bn-for-2024-ai-startup-set-to-lose-5bn-report/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2025,
    value: 13.1e9,
    quality: "sourced",
    methodology:
      "Recognized CY2025 revenue per The Information. Annualized exit run-rate at year-end was ~$20B per CFO Sarah Friar.",
    sources: [
      {
        name: "Epoch AI: OpenAI revenue",
        url: "https://epoch.ai/data-insights/openai-revenue",
      },
      {
        name: "the-decoder",
        url: "https://the-decoder.com/openai-adds-111-billion-to-its-cash-burn-forecast-as-ai-costs-spiral-beyond-projections/",
      },
      {
        name: "SaaStr ($20B CFO quote)",
        url: "https://www.saastr.com/openai-crosses-12-billion-arr-the-3-year-sprint-that-redefined-whats-possible-in-scaling-software/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2022,
    value: -0.54e9,
    quality: "sourced",
    methodology: "Operating loss per The Information reporting on internal financials.",
    sources: [
      {
        name: "The Information",
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
      "No clean disclosure for 2023 operating loss. Range bracketed by 2022 (-$540M) and 2024 (-$5B); midpoint approximation.",
    sources: [],
    note: "Pending direct citation. Mark as estimated.",
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2024,
    value: -5e9,
    quality: "sourced",
    methodology:
      "Operating loss / cash burn ~$5B per The Information internal-docs reporting; confirmed by multiple secondary sources.",
    sources: [
      {
        name: "LessWrong summary of The Information",
        url: "https://www.lesswrong.com/posts/CCQsQnCMWhJcCFY9x/openai-lost-usd5-billion-in-2024-and-its-losses-are",
      },
      {
        name: "DCD on The Information",
        url: "https://www.datacenterdynamics.com/en/news/openai-training-and-inference-costs-could-reach-7bn-for-2024-ai-startup-set-to-lose-5bn-report/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_operating_profit",
    fy: 2025,
    value: -9e9,
    low: -9e9,
    high: -8e9,
    quality: "sourced",
    methodology:
      "Cash burn $8-9B per The Information internal docs and WSJ confirmations.",
    sources: [
      {
        name: "the-decoder",
        url: "https://the-decoder.com/openai-adds-111-billion-to-its-cash-burn-forecast-as-ai-costs-spiral-beyond-projections/",
      },
      {
        name: "Ed Zitron (wheresyoured.at)",
        url: "https://www.wheresyoured.at/oai_docs/",
      },
    ],
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
        name: "electroiq stats",
        url: "https://electroiq.com/stats/anthropic-statistics/",
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
      "Reached ~$100M ARR by end of 2023 starting from near-zero in January. Recognized CY ~$60M estimated.",
    sources: [
      {
        name: "SaaStr Anthropic trajectory",
        url: "https://www.saastr.com/anthropic-just-hit-14-billion-in-arr-up-from-1-billion-just-14-months-ago/",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_revenue",
    fy: 2024,
    value: 381e6,
    quality: "sourced",
    methodology:
      "Recognized CY2024 revenue per The Information; $1B ARR by Dec 2024.",
    sources: [
      {
        name: "SaaStr (citing The Information)",
        url: "https://www.saastr.com/anthropics-4b-arr-the-enterprise-ai-growth-playbook-thats-rewriting-saas-economics/",
      },
      {
        name: "Ed Zitron",
        url: "https://www.wheresyoured.at/howmuchmoney/",
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
      "Company forecast for CY2025 per The Information ($4.5B revenue, gross of cloud-reseller). $9B ARR by Dec 2025.",
    sources: [
      {
        name: "The Information",
        url: "https://www.theinformation.com/articles/anthropic-lowers-profit-margin-projection-revenue-skyrockets",
      },
      {
        name: "Tiger Brokers summary",
        url: "https://www.itiger.com/news/1113108294",
      },
      {
        name: "Sacra: Anthropic",
        url: "https://sacra.com/c/anthropic/",
      },
    ],
    note: "Revenue is gross of cloud-reseller (AWS Bedrock, Google Vertex). Net basis ~$3.6B.",
  },
  {
    ticker: "ANTH",
    metric: "ai_operating_profit",
    fy: 2024,
    value: -5.6e9,
    quality: "sourced",
    methodology: "Operating loss per The Information internal-docs reporting.",
    sources: [
      {
        name: "Ed Zitron howmuchmoney",
        url: "https://www.wheresyoured.at/howmuchmoney/",
      },
    ],
  },
  {
    ticker: "ANTH",
    metric: "ai_operating_profit",
    fy: 2025,
    value: -3e9,
    quality: "sourced",
    methodology:
      "Cash burn ~$3B per company internal docs; EBITDA loss forecast was $5.2B but cash burn differs because of deferred GPU commitments not yet recognized as cash out.",
    sources: [
      {
        name: "The Information / Tiger Brokers",
        url: "https://www.itiger.com/news/1113108294",
      },
      {
        name: "Sacra",
        url: "https://sacra.com/c/anthropic/",
      },
    ],
  },
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
