"use client";

import { useMemo, useState } from "react";
import { BarChart, type BarDatum, QUALITY_COLOR_MAP } from "@/components/chart/BarChart";
import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  METRIC_LABELS,
  METRIC_BLURBS,
  YEARS,
  buildAmortizedFromCapex,
  type EnrichedFact,
  type Metric,
} from "@/lib/ai-economics";
import { COMPANY_COLORS } from "@/components/chart/palette";

type Props = { facts: EnrichedFact[] };

function fmtMoney(v: number) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${v < 0 ? "-" : ""}$${(Math.abs(v) / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${v < 0 ? "-" : ""}$${(Math.abs(v) / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

const METRICS: Metric[] = [
  "ai_capex",
  "ai_capex_amortized",
  "ai_revenue",
  "ai_operating_profit",
];

export function AiEconomicsBoard({ facts }: Props) {
  const [metric, setMetric] = useState<Metric>("ai_revenue");
  const [usefulLife, setUsefulLife] = useState(5);

  const enrichedFacts = useMemo(() => {
    const capexFacts = facts.filter((f) => f.metric === "ai_capex");
    const amortized = buildAmortizedFromCapex(capexFacts, usefulLife);
    return [...facts, ...amortized];
  }, [facts, usefulLife]);

  const visibleFacts = useMemo(
    () => enrichedFacts.filter((f) => f.metric === metric),
    [enrichedFacts, metric],
  );

  const orderedSources = useMemo(() => {
    const list: { footnote: number; ticker: string; year: number; source: { name: string; url: string } }[] = [];
    let n = 1;
    for (const year of YEARS) {
      for (const ticker of COMPANY_ORDER) {
        const f = visibleFacts.find(
          (x) => x.ticker === ticker && x.fy === year,
        );
        if (!f) continue;
        for (const s of f.sources) {
          list.push({ footnote: n, ticker, year, source: s });
          n += 1;
        }
      }
    }
    return list;
  }, [visibleFacts]);

  const dataByCell = useMemo(() => {
    const map = new Map<string, EnrichedFact>();
    for (const f of visibleFacts) {
      map.set(`${f.fy}|${f.ticker}`, f);
    }
    return map;
  }, [visibleFacts]);

  const footnoteByCell = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of orderedSources) {
      const key = `${item.year}|${item.ticker}`;
      if (!map.has(key)) map.set(key, item.footnote);
    }
    return map;
  }, [orderedSources]);

  const data: BarDatum[] = [];
  for (const year of YEARS) {
    for (const ticker of COMPANY_ORDER) {
      const f = dataByCell.get(`${year}|${ticker}`);
      data.push({
        group: String(year),
        series: ticker,
        label: `${COMPANY_LABEL[ticker]} — ${year}`,
        color: COMPANY_COLORS[ticker] ?? "#111",
        value: f?.value ?? null,
        low: f?.low ?? null,
        high: f?.high ?? null,
        quality: f?.quality ?? null,
        methodology: f?.methodology ?? "Not publicly disclosed.",
        sources: f?.sources ?? [],
        note: f?.note ?? null,
        footnoteRef: footnoteByCell.get(`${year}|${ticker}`) ?? null,
      });
    }
  }

  const showAmortizedSlider = metric === "ai_capex_amortized";
  const missingCells = data.filter((d) => d.value === null);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {METRICS.map((m) => {
          const active = m === metric;
          return (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-4 py-2 text-[13px] border hairline-strong transition-colors"
              style={{
                background: active ? "var(--foreground)" : "white",
                color: active ? "white" : "var(--foreground)",
                fontWeight: active ? 500 : 400,
              }}
            >
              {METRIC_LABELS[m]}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-[color:var(--muted)] leading-[1.55] max-w-[820px] mb-4">
        {METRIC_BLURBS[metric]}
      </p>

      {showAmortizedSlider && (
        <div className="flex items-center gap-3 mb-4 text-[13px]">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Useful life
          </span>
          <input
            type="range"
            min={3}
            max={8}
            step={1}
            value={usefulLife}
            onChange={(e) => setUsefulLife(parseInt(e.target.value, 10))}
            className="w-[220px] accent-[color:var(--accent)]"
          />
          <span className="num w-[40px]">{usefulLife} yr</span>
          <span className="text-[12px] text-[color:var(--muted)] ml-3">
            Straight-line. Each year&apos;s amortization sums the most recent {usefulLife} years of capex ÷ {usefulLife}.
          </span>
        </div>
      )}

      <div className="border hairline-strong bg-white p-4 md:p-6">
        <BarChart
          data={data}
          groups={YEARS.map(String)}
          serieses={COMPANY_ORDER.map((t) => ({
            id: t,
            color: COMPANY_COLORS[t] ?? "#111",
            label: COMPANY_LABEL[t],
          }))}
          yFormat={fmtMoney}
          height={460}
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Companies
          </span>
          {COMPANY_ORDER.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5"
                style={{ background: COMPANY_COLORS[t] }}
              />
              <span>{COMPANY_LABEL[t]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Data quality
          </span>
          {(
            ["sourced", "calculated", "inconsistent", "estimated"] as const
          ).map((q) => (
            <div key={q} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: QUALITY_COLOR_MAP[q] }}
              />
              <span className="capitalize">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {missingCells.length > 0 && (
        <div className="mt-4 text-[12px] text-[color:var(--muted)] border-l-2 hairline-strong pl-3">
          Missing/N/A cells:{" "}
          {missingCells
            .map((d) => `${COMPANY_LABEL[d.series]} ${d.group}`)
            .join(" · ")}
          .{" "}
          {metric === "ai_capex" || metric === "ai_capex_amortized" ? (
            <>
              OpenAI and Anthropic have no GPU PP&amp;E on balance sheet — their compute is opex via multi-year cloud commitments (Stargate, Project Rainier, Google TPU deals). NVIDIA sells the chips and has minimal capex of its own. Use the &ldquo;AI operating profit&rdquo; view for those companies.
            </>
          ) : null}
        </div>
      )}

      <section className="mt-8">
        <h3 className="text-[14px] font-medium mb-3">
          References — {METRIC_LABELS[metric]}
        </h3>
        <ol className="text-[12px] space-y-1.5 leading-[1.5]">
          {orderedSources.map((item) => (
            <li
              key={`${item.footnote}-${item.source.url}`}
              className="text-[color:var(--muted)] grid grid-cols-[28px_1fr] gap-2"
            >
              <span className="num text-[11px]">[{item.footnote}]</span>
              <span>
                <span className="text-[color:var(--foreground)]">
                  {COMPANY_LABEL[item.ticker]} {item.year}:
                </span>{" "}
                <a
                  href={item.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[color:var(--accent)] underline"
                >
                  {item.source.name}
                </a>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
