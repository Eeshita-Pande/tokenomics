import "dotenv/config";
import { db, schema } from "../src/db";

const COMPANIES = [
  { cik: "0001018724", ticker: "AMZN", name: "Amazon.com, Inc.", segment: "hyperscaler" },
  { cik: "0001652044", ticker: "GOOG", name: "Alphabet Inc.", segment: "hyperscaler" },
  { cik: "0000789019", ticker: "MSFT", name: "Microsoft Corporation", segment: "hyperscaler" },
  { cik: "0001045810", ticker: "NVDA", name: "NVIDIA Corporation", segment: "chip_supplier" },
  { cik: "0001562088", ticker: "DUOL", name: "Duolingo, Inc.", segment: "ai_consumer_saas" },
] as const;

const TARGET_CONCEPTS = [
  "Revenues",
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "CostOfRevenue",
  "CostOfGoodsAndServicesSold",
  "OperatingExpenses",
  "PaymentsToAcquirePropertyPlantAndEquipment",
  "PaymentsToAcquireProductiveAssets",
  "DepreciationDepletionAndAmortization",
  "DepreciationAndAmortization",
  "Depreciation",
];

type ConceptUnitFact = {
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  start?: string;
};

type CompanyFactsResponse = {
  facts?: {
    "us-gaap"?: Record<
      string,
      { units?: Record<string, ConceptUnitFact[]> } | undefined
    >;
  };
};

async function fetchCompanyFacts(cik: string): Promise<CompanyFactsResponse> {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "tokenomics-research eeshitapande@gmail.com",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`EDGAR ${cik}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function seedCompany(c: (typeof COMPANIES)[number]) {
  console.log(`→ ${c.ticker} (CIK ${c.cik})`);
  await db
    .insert(schema.companies)
    .values({
      cik: c.cik,
      ticker: c.ticker,
      name: c.name,
      segment: c.segment,
    })
    .onConflictDoNothing();

  const data = await fetchCompanyFacts(c.cik);
  const usgaap = data.facts?.["us-gaap"] ?? {};

  let inserted = 0;
  for (const concept of TARGET_CONCEPTS) {
    const conceptData = usgaap[concept];
    if (!conceptData?.units) continue;
    const usdFacts = conceptData.units["USD"];
    if (!usdFacts) continue;

    for (const f of usdFacts) {
      if (!f.fy || !f.fp || !f.end) continue;
      if (f.fy < 2022) continue;
      try {
        await db
          .insert(schema.financialFacts)
          .values({
            cik: c.cik,
            concept,
            fiscalYear: f.fy,
            fiscalPeriod: f.fp,
            periodStart: f.start ?? null,
            periodEnd: f.end,
            value: f.val,
            unit: "USD",
            form: f.form,
            accn: f.accn,
            filedAt: f.filed,
            sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${c.cik}&type=${f.form}`,
          })
          .onConflictDoNothing();
        inserted += 1;
      } catch (err) {
        console.warn(`  skip ${concept} ${f.fy}${f.fp}: ${(err as Error).message}`);
      }
    }
  }
  console.log(`  inserted ${inserted} facts`);
}

async function main() {
  for (const c of COMPANIES) {
    await seedCompany(c);
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
