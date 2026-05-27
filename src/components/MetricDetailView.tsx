"use client";

import { useMemo, useState } from "react";
import { BarChart, type BarDatum } from "@/components/chart/BarChart";
import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  YEARS,
  buildAmortizedFromCapex,
  type EnrichedFact,
  type Metric,
} from "@/lib/ai-economics";
import { COMPANY_COLORS } from "@/components/chart/palette";

type Props = { metric: Metric; facts: EnrichedFact[] };

function fmtMoney(v: number) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const wrap = (s: string) => (v < 0 ? `(${s})` : s);
  if (abs >= 1e9) return wrap(`$${(abs / 1e9).toFixed(1)}B`);
  if (abs >= 1e6) return wrap(`$${(abs / 1e6).toFixed(0)}M`);
  return wrap(`$${abs.toFixed(0)}`);
}

export function MetricDetailView({ metric, facts }: Props) {
  const [usefulLife, setUsefulLife] = useState(5);

  const visibleFacts = useMemo(() => {
    if (metric === "ai_capex_amortized") {
      return buildAmortizedFromCapex(
        facts.filter((f) => f.metric === "ai_capex"),
        usefulLife,
      );
    }
    return facts.filter((f) => f.metric === metric);
  }, [facts, metric, usefulLife]);

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
