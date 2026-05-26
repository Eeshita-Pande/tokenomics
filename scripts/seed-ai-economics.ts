import "dotenv/config";
import { db, schema } from "../src/db";

type Source = { name: string; url: string };
type Quality = "sourced" | "calculated" | "inconsistent" | "estimated";
type Metric =
  | "ai_capex"
  | "ai_capex_amortized"
  | "ai_revenue"
  | "ai_operating_profit";

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

const GOOG_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/1652044/000165204423000016/goog-20221231.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/1652044/000165204424000022/goog-20231231.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/1652044/000165204425000014/goog-20241231.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm",
};
const GOOG_Q1_2026_8K =
  "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000043/googexhibit991q12026.htm";

const MSFT_10K = {
  2022: "https://www.sec.gov/Archives/edgar/data/789019/000156459022026876/msft-10k_20220630.htm",
  2023: "https://www.sec.gov/Archives/edgar/data/789019/000095017023035122/msft-20230630.htm",
  2024: "https://www.sec.gov/Archives/edgar/data/789019/000095017024087843/msft-20240630.htm",
  2025: "https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/msft-20250630.htm",
};
const MSFT_Q3_FY26_10Q =
  "https://www.sec.gov/Archives/edgar/data/0000789019/000119312526191507/msft-20260331.htm";

const FACTS: Fact[] = [
  // ============ NVIDIA (FY ends late January) ============
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2022,
    value: 10.61e9,
    quality: "sourced",
    methodology:
      "Data Center segment revenue, NVIDIA FY22 10-K (year ended Jan 30, 2022).",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2023,
    value: 15.01e9,
    quality: "sourced",
    methodology: "Data Center segment revenue, FY23 10-K (year ended Jan 29, 2023).",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2024,
    value: 47.525e9,
    quality: "sourced",
    methodology: "Data Center segment revenue, FY24 10-K (year ended Jan 28, 2024).",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2025,
    value: 115.191e9,
    quality: "sourced",
    methodology: "Data Center segment revenue, FY25 10-K (year ended Jan 26, 2025).",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_revenue",
    fy: 2026,
    value: 193.7e9,
    quality: "sourced",
    methodology: "Data Center segment revenue, FY26 10-K (year ended Jan 25, 2026). Full-year actual.",
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
      "Compute & Networking reportable-segment operating income from the FY22 10-K segment footnote. Closest disclosed proxy for AI segment op income; Data Center is the dominant share of this segment.",
    sources: [{ name: "NVIDIA 10-K FY22 (SEC)", url: NVDA_10K[2022] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 5.083e9,
    quality: "sourced",
    methodology: "Compute & Networking segment operating income, FY23 10-K.",
    sources: [{ name: "NVIDIA 10-K FY23 (SEC)", url: NVDA_10K[2023] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 32.016e9,
    quality: "sourced",
    methodology: "Compute & Networking segment operating income, FY24 10-K.",
    sources: [{ name: "NVIDIA 10-K FY24 (SEC)", url: NVDA_10K[2024] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 82.875e9,
    quality: "sourced",
    methodology: "Compute & Networking segment operating income, FY25 10-K.",
    sources: [{ name: "NVIDIA 10-K FY25 (SEC)", url: NVDA_10K[2025] }],
  },
  {
    ticker: "NVDA",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 130.1e9,
    quality: "sourced",
    methodology:
      "Compute & Networking segment operating income, FY26 10-K. Includes the $4.5B H20 inventory charge taken in Q1 FY26.",
    sources: [{ name: "NVIDIA 10-K FY26 (SEC)", url: NVDA_10K[2026] }],
  },

  // ============ AMAZON (CY ends Dec 31) ============
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2022,
    value: 80.096e9,
    quality: "sourced",
    methodology: "AWS segment net sales, Amazon 2022 10-K.",
    sources: [{ name: "Amazon 10-K FY22 (SEC)", url: AMZN_10K[2022] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2023,
    value: 90.757e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2023 10-K.",
    sources: [{ name: "Amazon 10-K FY23 (SEC)", url: AMZN_10K[2023] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2024,
    value: 107.556e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2024 10-K.",
    sources: [{ name: "Amazon 10-K FY24 (SEC)", url: AMZN_10K[2024] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2025,
    value: 128.725e9,
    quality: "sourced",
    methodology: "AWS segment net sales, 2025 10-K.",
    sources: [{ name: "Amazon 10-K FY25 (SEC)", url: AMZN_10K[2025] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_revenue",
    fy: 2026,
    value: 150.4e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 AWS net sales of $37.6B (×4). Q1 actual from Amazon Q1 2026 10-Q.",
    sources: [{ name: "Amazon Q1 2026 10-Q (SEC)", url: AMZN_Q1_2026_10Q }],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 22.841e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2022 10-K.",
    sources: [{ name: "Amazon 10-K FY22 (SEC)", url: AMZN_10K[2022] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 24.631e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2023 10-K.",
    sources: [{ name: "Amazon 10-K FY23 (SEC)", url: AMZN_10K[2023] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 39.834e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2024 10-K.",
    sources: [{ name: "Amazon 10-K FY24 (SEC)", url: AMZN_10K[2024] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 45.606e9,
    quality: "sourced",
    methodology: "AWS segment operating income, 2025 10-K.",
    sources: [{ name: "Amazon 10-K FY25 (SEC)", url: AMZN_10K[2025] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 56.8e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 AWS operating income of $14.2B (×4). Q1 actual from Amazon Q1 2026 10-Q.",
    sources: [{ name: "Amazon Q1 2026 10-Q (SEC)", url: AMZN_Q1_2026_10Q }],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2022,
    value: 63.645e9,
    quality: "sourced",
    methodology:
      "Whole-company \"Purchases of property and equipment\" from the 2022 10-K cash-flow statement. Amazon's MD&A attributes the bulk to AWS technology infrastructure.",
    sources: [{ name: "Amazon 10-K FY22 (SEC)", url: AMZN_10K[2022] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2023,
    value: 52.729e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2023 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY23 (SEC)", url: AMZN_10K[2023] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2024,
    value: 82.999e9,
    quality: "sourced",
    methodology:
      "Whole-company capex, 2024 10-K. MD&A explicitly attributes the increase to AWS infrastructure including AI/ML.",
    sources: [{ name: "Amazon 10-K FY24 (SEC)", url: AMZN_10K[2024] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2025,
    value: 131.819e9,
    quality: "sourced",
    methodology: "Whole-company capex, 2025 10-K cash-flow statement.",
    sources: [{ name: "Amazon 10-K FY25 (SEC)", url: AMZN_10K[2025] }],
  },
  {
    ticker: "AMZN",
    metric: "ai_capex",
    fy: 2026,
    value: 176.8e9,
    low: 176.8e9,
    high: 200e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 \"Purchases of property and equipment\" of $44.2B (×4). Range upper bound is CEO Andy Jassy's ~$200B FY26 guidance from the Q4 2025 call (Feb 2026).",
    sources: [{ name: "Amazon Q1 2026 10-Q (SEC)", url: AMZN_Q1_2026_10Q }],
  },

  // ============ ALPHABET / GOOG (CY ends Dec 31) ============
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2022,
    value: 26.28e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, Alphabet 2022 10-K.",
    sources: [{ name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2023,
    value: 33.088e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2023 10-K.",
    sources: [{ name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2024,
    value: 43.229e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2024 10-K.",
    sources: [{ name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2025,
    value: 58.789e9,
    quality: "sourced",
    methodology: "Google Cloud segment revenue, 2025 10-K.",
    sources: [{ name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_revenue",
    fy: 2026,
    value: 80.0e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 Google Cloud revenue of $20.0B (×4). Q1 actual from Alphabet Q1 2026 8-K Exhibit 99.1.",
    sources: [{ name: "Alphabet Q1 2026 earnings (SEC 8-K)", url: GOOG_Q1_2026_8K }],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2022,
    value: -2.968e9,
    quality: "sourced",
    methodology: "Google Cloud segment operating loss, 2022 10-K.",
    sources: [{ name: "Alphabet 10-K FY22 (SEC)", url: GOOG_10K[2022] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 1.716e9,
    quality: "sourced",
    methodology: "Google Cloud segment operating income, 2023 10-K — first profitable year.",
    sources: [{ name: "Alphabet 10-K FY23 (SEC)", url: GOOG_10K[2023] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 6.112e9,
    quality: "sourced",
    methodology: "Google Cloud segment operating income, 2024 10-K.",
    sources: [{ name: "Alphabet 10-K FY24 (SEC)", url: GOOG_10K[2024] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 13.91e9,
    quality: "sourced",
    methodology: "Google Cloud segment operating income, 2025 10-K.",
    sources: [{ name: "Alphabet 10-K FY25 (SEC)", url: GOOG_10K[2025] }],
  },
  {
    ticker: "GOOG",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 26.4e9,
    quality: "calculated",
    methodology:
      "Annualized from Q1 2026 Google Cloud operating income of $6.6B (×4).",
    sources: [{ name: "Alphabet Q1 2026 earnings (SEC 8-K)", url: GOOG_Q1_2026_8K }],
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
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2022,
    value: 75.251e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment revenue, FY22 10-K (year ended June 30, 2022).",
    sources: [{ name: "Microsoft 10-K FY22 (SEC)", url: MSFT_10K[2022] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2023,
    value: 87.907e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment revenue, FY23 10-K.",
    sources: [{ name: "Microsoft 10-K FY23 (SEC)", url: MSFT_10K[2023] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2024,
    value: 105.362e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment revenue, FY24 10-K.",
    sources: [{ name: "Microsoft 10-K FY24 (SEC)", url: MSFT_10K[2024] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2025,
    value: 106.265e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment revenue, FY25 10-K. Microsoft restructured segments in Aug 2024; FY25 is not directly comparable to prior years.",
    sources: [{ name: "Microsoft 10-K FY25 (SEC)", url: MSFT_10K[2025] }],
    note: "FY25 segment recast: some Azure consumption was redistributed to Productivity & Business Processes.",
  },
  {
    ticker: "MSFT",
    metric: "ai_revenue",
    fy: 2026,
    value: 138.7e9,
    quality: "calculated",
    methodology:
      "Annualized from FY26 Q3 (quarter ended Mar 31, 2026) Intelligent Cloud revenue of $34.7B (×4).",
    sources: [{ name: "Microsoft Q3 FY26 10-Q (SEC)", url: MSFT_Q3_FY26_10Q }],
    note: "Microsoft's fiscal year ends June 30 — FY26 covers Jul 2025 to Jun 2026.",
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2022,
    value: 32.721e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment operating income, FY22 10-K.",
    sources: [{ name: "Microsoft 10-K FY22 (SEC)", url: MSFT_10K[2022] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2023,
    value: 37.884e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment operating income, FY23 10-K.",
    sources: [{ name: "Microsoft 10-K FY23 (SEC)", url: MSFT_10K[2023] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2024,
    value: 49.584e9,
    quality: "sourced",
    methodology: "Intelligent Cloud segment operating income, FY24 10-K.",
    sources: [{ name: "Microsoft 10-K FY24 (SEC)", url: MSFT_10K[2024] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2025,
    value: 44.589e9,
    quality: "sourced",
    methodology:
      "Intelligent Cloud segment operating income, FY25 10-K. The YoY decline reflects the Aug 2024 segment recast, not deteriorating economics.",
    sources: [{ name: "Microsoft 10-K FY25 (SEC)", url: MSFT_10K[2025] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_operating_profit",
    fy: 2026,
    value: 55.0e9,
    quality: "calculated",
    methodology:
      "Annualized from FY26 Q3 Intelligent Cloud operating income of $13.75B (×4).",
    sources: [{ name: "Microsoft Q3 FY26 10-Q (SEC)", url: MSFT_Q3_FY26_10Q }],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2022,
    value: 23.886e9,
    quality: "sourced",
    methodology: "Additions to PP&E from FY22 10-K cash flow statement.",
    sources: [{ name: "Microsoft 10-K FY22 (SEC)", url: MSFT_10K[2022] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2023,
    value: 28.107e9,
    quality: "sourced",
    methodology: "Additions to PP&E, FY23 10-K.",
    sources: [{ name: "Microsoft 10-K FY23 (SEC)", url: MSFT_10K[2023] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2024,
    value: 44.477e9,
    quality: "sourced",
    methodology: "Additions to PP&E, FY24 10-K.",
    sources: [{ name: "Microsoft 10-K FY24 (SEC)", url: MSFT_10K[2024] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2025,
    value: 64.551e9,
    quality: "sourced",
    methodology:
      "Additions to PP&E, FY25 10-K. Management explicitly attributes majority to AI infrastructure.",
    sources: [{ name: "Microsoft 10-K FY25 (SEC)", url: MSFT_10K[2025] }],
  },
  {
    ticker: "MSFT",
    metric: "ai_capex",
    fy: 2026,
    value: 123.5e9,
    quality: "calculated",
    methodology:
      "Annualized from FY26 Q3 additions to PP&E of $30.9B (×4). Sourced from Q3 FY26 10-Q cash flow statement.",
    sources: [{ name: "Microsoft Q3 FY26 10-Q (SEC)", url: MSFT_Q3_FY26_10Q }],
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
    value: 1.6e9,
    low: 1.3e9,
    high: 2.0e9,
    quality: "inconsistent",
    methodology:
      "Annualized run-rate at year-end 2023 was ~$1.6B per The Information; full-year recognized revenue tracked lower (~$1.3B). CFO references to ~$2B reflect run-rate exit.",
    sources: [
      {
        name: "The Information / Reuters (Dec 2023)",
        url: "https://www.marketscreener.com/quote/stock/MICROSOFT-CORPORATION-4835/news/OpenAI-annualized-revenue-tops-1-6-billion-The-Information-45653315/",
      },
    ],
  },
  {
    ticker: "OAI",
    metric: "ai_revenue",
    fy: 2024,
    value: 3.7e9,
    quality: "sourced",
    methodology:
      "Recognized CY2024 revenue per The New York Times (citing OpenAI financial documents), corroborated by CNBC.",
    sources: [
      {
        name: "CNBC (citing NYT-obtained docs)",
        url: "https://www.cnbc.com/2024/09/27/openai-sees-5-billion-loss-this-year-on-3point7-billion-in-revenue.html",
      },
    ],
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
    value: 25.0e9,
    quality: "sourced",
    methodology:
      "Annualized revenue run-rate of ~$25B as of Feb 2026, reported by The Information and confirmed by Reuters. Up from ~$20B exit ARR at end of 2025.",
    sources: [
      {
        name: "The Information (Mar 2026)",
        url: "https://www.theinformation.com/articles/openai-tops-25-billion-annualized-revenue-anthropic-narrows-gap",
      },
      {
        name: "Reuters / TradingView mirror",
        url: "https://www.tradingview.com/news/reuters.com,2026:newsml_L4N3ZT0E1:0-openai-tops-25-billion-in-annualized-revenue-the-information-reports/",
      },
    ],
    note: "OpenAI is private; figure is an annualized run-rate disclosed via press leaks.",
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
    value: -25e9,
    low: -27e9,
    high: -25e9,
    quality: "sourced",
    methodology:
      "FY2026 cash burn revised to ~$25-27B per OpenAI financial documents reported by Fortune (Nov 2025). Original FY26 burn projection was ~$14B.",
    sources: [
      {
        name: "Fortune (Nov 2025)",
        url: "https://fortune.com/2025/11/12/openai-cash-burn-rate-annual-losses-2028-profitable-2030-financial-documents/",
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
    value: 30e9,
    quality: "sourced",
    methodology:
      "Annualized revenue run-rate of ~$30B reached in April 2026, reported by Bloomberg. Up from $9B exit ARR at end of 2025.",
    sources: [
      {
        name: "Bloomberg (Apr 2026)",
        url: "https://www.bloomberg.com/news/articles/2026-04-06/broadcom-confirms-deal-to-ship-google-tpu-chips-to-anthropic",
      },
      {
        name: "VentureBeat",
        url: "https://venturebeat.com/technology/anthropic-says-it-hit-a-30-billion-revenue-run-rate-after-crazy-80x-growth",
      },
    ],
    note: "Annualized run-rate; private company. Reported gross of cloud-reseller; OpenAI internally alleges ~$8B overstatement on gross-vs-net.",
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
    value: -5e9,
    low: -7e9,
    high: -3e9,
    quality: "estimated",
    methodology:
      "FY2026 operating loss projected at $3-7B per Anthropic internal financial documents reported by TechCrunch.",
    sources: [
      {
        name: "TechCrunch on Anthropic projections",
        url: "https://techcrunch.com/2025/11/04/anthropic-expects-b2b-demand-to-boost-revenue-to-70b-in-2028-report/",
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
