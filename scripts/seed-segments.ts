import "dotenv/config";
import { db, schema } from "../src/db";

const UA = "tokenomics-research eeshitapande@gmail.com";

type ExtractJob = {
  /** Pattern to find the R-report in FilingSummary.xml */
  reportPattern: RegExp;
  /** Segment name to track */
  segmentName: string;
  /** Metric label substrings (case-insensitive prefix) → our internal concept */
  metricMap: Record<string, string>;
  /** Optional: a phrase that must appear *between* segment name and metric */
  requiresContext?: string;
};

type CompanySpec = {
  cik: string;
  ticker: string;
  jobs: ExtractJob[];
};

const COMPANIES: CompanySpec[] = [
  {
    cik: "1018724",
    ticker: "AMZN",
    jobs: [
      {
        reportPattern:
          /Segment Information.*Reportable Segments.*Reconciliation/i,
        segmentName: "AWS",
        metricMap: {
          "net sales": "SegmentRevenue",
          "operating income": "SegmentOperatingIncome",
          "operating expenses": "SegmentOperatingExpenses",
        },
      },
      {
        reportPattern:
          /Segment Information.*Property and Equipment Additions/i,
        segmentName: "AWS",
        metricMap: {
          "property and equipment, additions": "SegmentCapex",
          "property and equipment additions": "SegmentCapex",
        },
      },
      {
        reportPattern:
          /Segment Information.*Depreciation and Amortization/i,
        segmentName: "AWS",
        metricMap: {
          "depreciation and amortization": "SegmentDepreciation",
        },
      },
    ],
  },
  {
    cik: "1652044",
    ticker: "GOOG",
    jobs: [
      {
        reportPattern:
          /Segments.*Geographic Areas.*(Revenue and Operating|Revenue by Segment)/i,
        segmentName: "Google Cloud",
        metricMap: {
          "revenue from contract with customers": "SegmentRevenue",
          "total revenues": "SegmentRevenue",
          "revenues": "SegmentRevenue",
        },
      },
      {
        reportPattern:
          /Segments.*Geographic Areas.*Revenue and Operating Income/i,
        segmentName: "Google Cloud",
        metricMap: {
          "total income from operations": "SegmentOperatingIncome",
          "operating income": "SegmentOperatingIncome",
          "operating loss": "SegmentOperatingIncome",
        },
        requiresContext: "Operating Segments",
      },
      {
        reportPattern:
          /Segments.*Geographic Areas.*Operating Income.*Loss.*by Segment/i,
        segmentName: "Google Cloud",
        metricMap: {
          "operating income": "SegmentOperatingIncome",
          "operating loss": "SegmentOperatingIncome",
        },
      },
    ],
  },
  {
    cik: "1045810",
    ticker: "NVDA",
    jobs: [
      {
        reportPattern: /Segment Information.*Revenue by Market Platform/i,
        segmentName: "Data Center",
        metricMap: { revenue: "SegmentRevenue" },
      },
      {
        reportPattern:
          /Segment Information.*Schedule of Reportable Segments/i,
        segmentName: "Compute & Networking",
        metricMap: { "operating income": "SegmentOperatingIncome" },
        requiresContext: "Operating Segments",
      },
    ],
  },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string): Promise<string> {
  await sleep(200);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function listFilings(cik: string) {
  const padded = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const json = (await res.json()) as {
    filings?: {
      recent?: {
        form?: string[];
        accessionNumber?: string[];
        filingDate?: string[];
      };
    };
  };
  const r = json.filings?.recent;
  if (!r) return [];
  const out: {
    form: string;
    accn: string;
    accnNoDash: string;
    filingDate: string;
  }[] = [];
  const forms = r.form ?? [];
  for (let i = 0; i < forms.length; i++) {
    const f = forms[i];
    if (f !== "10-Q" && f !== "10-K") continue;
    const accn = r.accessionNumber?.[i] ?? "";
    out.push({
      form: f,
      accn,
      accnNoDash: accn.replace(/-/g, ""),
      filingDate: r.filingDate?.[i] ?? "",
    });
  }
  return out;
}

type RReport = { shortName: string; htmlFile: string };

async function getRReports(
  cik: string,
  accnNoDash: string,
): Promise<RReport[]> {
  const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik, 10)}/${accnNoDash}/FilingSummary.xml`;
  const xml = await fetchText(url);
  const reports: RReport[] = [];
  const blocks = xml.match(/<Report instance="[^"]*">[\s\S]*?<\/Report>/g) ?? [];
  for (const block of blocks) {
    const shortM = block.match(/<ShortName>([^<]+)<\/ShortName>/);
    const htmlM = block.match(/<HtmlFileName>([^<]+)<\/HtmlFileName>/);
    if (shortM && htmlM) {
      reports.push({ shortName: shortM[1], htmlFile: htmlM[1] });
    }
  }
  return reports;
}

function stripHtmlToCells(html: string): string[][] {
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
  const rows: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(html))) {
    const row: string[] = [];
    let cm: RegExpExecArray | null;
    const inner = m[1];
    while ((cm = cellRegex.exec(inner))) {
      const text = cm[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;|&#160;| /g, " ")
        .replace(/\s+/g, " ")
        .trim();
      row.push(text);
    }
    if (row.length) rows.push(row);
  }
  return rows;
}

function isNumericCell(s: string): boolean {
  if (!s) return false;
  const stripped = s.replace(/[$,\s()]/g, "");
  if (!stripped) return false;
  return /^-?\d+(\.\d+)?$/.test(stripped);
}

function parseMoney(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[$,\s]/g, "");
  const neg = /^\(.*\)$/.test(cleaned);
  const num = parseFloat(cleaned.replace(/[()]/g, ""));
  if (!Number.isFinite(num)) return null;
  return neg ? -num : num;
}

type ParsedPeriod = { periodEnd: string; monthsCovered: number };

function parseHeaderPeriods(headerRows: string[][]): ParsedPeriod[] {
  const dateRow = headerRows[headerRows.length - 1] ?? [];
  const groupRow =
    headerRows.length >= 2 ? headerRows[headerRows.length - 2] : [];

  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const monthsByCol: number[] = [];
  let currentGroup = "";
  for (let c = 0; c < dateRow.length; c++) {
    const groupCell = (groupRow[c] ?? "").trim();
    if (groupCell) currentGroup = groupCell;
    const m = currentGroup.match(/(\d+)\s+Months/i);
    monthsByCol[c] = m ? parseInt(m[1], 10) : 3;
  }

  const periods: ParsedPeriod[] = [];
  for (let c = 0; c < dateRow.length; c++) {
    const cell = dateRow[c];
    const m = cell.match(/([A-Z][a-z]{2})\.?\s+(\d+),\s+(\d{4})/);
    if (!m) {
      periods.push({ periodEnd: "", monthsCovered: 0 });
      continue;
    }
    const monthNum = months[m[1]] ?? "01";
    const day = m[2].padStart(2, "0");
    periods.push({
      periodEnd: `${m[3]}-${monthNum}-${day}`,
      monthsCovered: monthsByCol[c] || 3,
    });
  }
  return periods;
}

type ExtractedFact = {
  segmentName: string;
  metric: string;
  periodEnd: string;
  monthsCovered: number;
  value: number;
};

function extractFromReport(
  rows: string[][],
  segmentName: string,
  metricMap: Record<string, string>,
  requiresContext: string | undefined,
): ExtractedFact[] {
  if (rows.length < 2) return [];
  let firstDataIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const hasDate = rows[i].some((c) => /[A-Z][a-z]{2}\.?\s+\d+,\s+\d{4}/.test(c));
    if (hasDate) {
      firstDataIdx = i;
      break;
    }
  }
  if (firstDataIdx === -1) return [];
  const headerRows = rows.slice(0, firstDataIdx + 1);
  const periods = parseHeaderPeriods(headerRows);
  const dataRows = rows.slice(firstDataIdx + 1);

  const out: ExtractedFact[] = [];
  let currentSegment: string | null = null;
  let currentContext: string | null = null;

  for (const row of dataRows) {
    const firstNumIdx = row.findIndex((c) => isNumericCell(c));
    const labelCellsAll = (firstNumIdx === -1 ? row : row.slice(0, firstNumIdx))
      .map((c) => c.trim())
      .filter((c) => c && c !== " ");

    if (firstNumIdx === -1) {
      const expandedParts = labelCellsAll.flatMap((c) =>
        c.split("|").map((p) => p.trim()).filter((p) => p),
      );
      const segCell = expandedParts.find((c) => c === segmentName);
      if (segCell) {
        currentSegment = segmentName;
        const segIdx = expandedParts.indexOf(segmentName);
        currentContext =
          expandedParts.slice(segIdx + 1).find((c) => c.length > 0) ?? null;
      } else if (labelCellsAll.length === 1 && currentSegment) {
        const only = labelCellsAll[0];
        if (only !== currentSegment && !Object.keys(metricMap).some((k) =>
          only.toLowerCase().startsWith(k))) {
          currentContext = only;
        }
      }
      continue;
    }

    if (!currentSegment) continue;

    if (labelCellsAll.length === 0) continue;
    const metricLabel = labelCellsAll[labelCellsAll.length - 1];

    const matchedKey = Object.keys(metricMap).find((k) =>
      metricLabel.toLowerCase().startsWith(k),
    );
    if (!matchedKey) continue;

    if (requiresContext && currentContext !== requiresContext) continue;

    const concept = metricMap[matchedKey];
    for (let c = firstNumIdx; c < row.length; c++) {
      const periodIdx = c - firstNumIdx;
      const p = periods[periodIdx];
      if (!p?.periodEnd) continue;
      const v = parseMoney(row[c]);
      if (v === null) continue;
      out.push({
        segmentName: currentSegment,
        metric: concept,
        periodEnd: p.periodEnd,
        monthsCovered: p.monthsCovered,
        value: v,
      });
    }
  }
  return out;
}

function fiscalPeriodFromPeriodEnd(
  periodEnd: string,
  ticker: string,
  monthsCovered: number,
): string | null {
  if (monthsCovered >= 11) return "FY";
  if (monthsCovered !== 3) return null;
  const m = parseInt(periodEnd.slice(5, 7), 10);
  if (ticker === "NVDA") {
    if (m === 4 || m === 5) return "Q1";
    if (m === 7 || m === 8) return "Q2";
    if (m === 10 || m === 11) return "Q3";
    return null;
  }
  if (m === 3) return "Q1";
  if (m === 6) return "Q2";
  if (m === 9) return "Q3";
  if (m === 12) return "FY";
  return null;
}

function fiscalYearFromPeriodEnd(periodEnd: string, ticker: string): number {
  const y = parseInt(periodEnd.slice(0, 4), 10);
  if (ticker === "NVDA") {
    const m = parseInt(periodEnd.slice(5, 7), 10);
    if (m >= 2) return y + 1;
    return y;
  }
  return y;
}

async function processFiling(
  spec: CompanySpec,
  filing: { form: string; accn: string; accnNoDash: string; filingDate: string },
): Promise<number> {
  let reports: RReport[];
  try {
    reports = await getRReports(spec.cik, filing.accnNoDash);
  } catch (err) {
    console.warn(`  ! ${filing.accn}: ${(err as Error).message}`);
    return 0;
  }

  let inserted = 0;
  for (const job of spec.jobs) {
    const match = reports.find((r) => job.reportPattern.test(r.shortName));
    if (!match) continue;
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(spec.cik, 10)}/${filing.accnNoDash}/${match.htmlFile}`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (err) {
      console.warn(`  ! ${match.htmlFile}: ${(err as Error).message}`);
      continue;
    }
    const rows = stripHtmlToCells(html);
    const facts = extractFromReport(
      rows,
      job.segmentName,
      job.metricMap,
      job.requiresContext,
    );
    for (const f of facts) {
      const fy = fiscalYearFromPeriodEnd(f.periodEnd, spec.ticker);
      const fp = fiscalPeriodFromPeriodEnd(f.periodEnd, spec.ticker, f.monthsCovered);
      if (!fp) continue;
      const valueUsd = f.value * 1_000_000;
      try {
        await db
          .insert(schema.financialFacts)
          .values({
            cik: spec.cik.padStart(10, "0"),
            segment: f.segmentName,
            concept: f.metric,
            fiscalYear: fy,
            fiscalPeriod: fp,
            periodEnd: f.periodEnd,
            value: valueUsd,
            unit: "USD",
            form: filing.form,
            accn: filing.accn,
            filedAt: filing.filingDate,
            sourceUrl: url,
          })
          .onConflictDoNothing();
        inserted += 1;
      } catch {
        // unique conflict
      }
    }
  }
  return inserted;
}

async function main() {
  for (const spec of COMPANIES) {
    console.log(`\n=== ${spec.ticker} ===`);
    const filings = await listFilings(spec.cik);
    const recent = filings.filter((f) => f.filingDate >= "2022-01-01");
    let total = 0;
    for (const f of recent) {
      const n = await processFiling(spec, f);
      total += n;
      console.log(`  ${f.form} ${f.filingDate}: +${n}`);
    }
    console.log(`  total: ${total}`);
  }
  console.log("\ndone");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
