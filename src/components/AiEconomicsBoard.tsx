"use client";

import { useMemo, useState } from "react";
import { BarChart, type BarDatum } from "@/components/chart/BarChart";
import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  METRIC_LABELS,
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

  const dataByCell = useMemo(() => {
    const map = new Map<string, EnrichedFact>();
    for (const f of visibleFacts) {
      map.set(`${f.fy}|${f.ticker}`, f);
    }
    return map;
  }, [visibleFacts]);

  const data: BarDatum[] = [];
  for (const year of YEARS) {
    for (const ticker of COMPANY_ORDER) {
      const f = dataByCell.get(`${year}|${ticker}`);
      data.push({
        group: String(year),
        series: ticker,
        label: `${COMPANY_LABEL[ticker]} · ${year}`,
        color: COMPANY_COLORS[ticker] ?? "#111",
        value: f?.value ?? null,
        low: f?.low ?? null,
        high: f?.high ?? null,
        methodology: f?.methodology ?? "Not publicly disclosed.",
        sources: f?.sources ?? [],
        note: f?.note ?? null,
      });
    }
  }

  const showAmortizedSlider = metric === "ai_capex_amortized";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
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
          height={480}
        />
      </div>
    </div>
  );
}
