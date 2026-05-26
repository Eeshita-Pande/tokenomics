"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/chart/LineChart";
import { COMPANY_COLORS } from "@/components/chart/palette";
import { VIEW_MODES, type PeriodRow, type ViewMode } from "@/lib/views";
import { buildCompanySeries, METRICS, type Metric } from "@/lib/series";
import { fmtMoney, fmtPct } from "@/lib/format";

type CompanyData = {
  ticker: string;
  name: string;
  aiSegment: string | null;
  wholePeriods: PeriodRow[];
  segmentPeriods: PeriodRow[];
};

type Scope = "segment" | "whole";

export function CompareExplorer({
  companies,
}: {
  companies: CompanyData[];
}) {
  const [scope, setScope] = useState<Scope>("segment");
  const [metric, setMetric] = useState<Metric>("adjustedMargin");
  const [lens, setLens] = useState<ViewMode>("gaap");
  const [usefulLife, setUsefulLife] = useState(5);
  const [enabledTickers, setEnabledTickers] = useState<string[]>(
    companies.map((c) => c.ticker),
  );

  const metricMeta = METRICS.find((m) => m.id === metric)!;
  const yFormat = metricMeta.isPercent ? (v: number) => fmtPct(v) : fmtMoney;

  const active = useMemo(
    () =>
      companies
        .filter((c) => enabledTickers.includes(c.ticker))
        .map((c) => ({
          ticker: c.ticker,
          name: c.name,
          periods:
            scope === "segment" && c.segmentPeriods.length > 0
              ? c.segmentPeriods
              : c.wholePeriods,
        })),
    [companies, enabledTickers, scope],
  );

  const { series, xLabels } = useMemo(
    () => buildCompanySeries(active, metric, lens, usefulLife),
    [active, metric, lens, usefulLife],
  );

  const amortized =
    lens === "capex_amortized_sl" || lens === "capex_amortized_ddb";

  const toggleTicker = (t: string) =>
    setEnabledTickers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 pb-4">
        <div className="flex border hairline-strong">
          {[
            { id: "segment" as const, label: "AI segment" },
            { id: "whole" as const, label: "whole co." },
          ].map((s) => {
            const active = scope === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                className="px-3 py-1.5 text-[12px] transition-colors"
                style={{
                  background: active
                    ? "var(--foreground)"
                    : "var(--background)",
                  color: active ? "var(--background)" : "var(--foreground)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-baseline gap-2 text-[13px]">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Metric
          </span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="border hairline-strong px-2 py-1 text-[13px] bg-white"
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-baseline gap-2 text-[13px]">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Lens
          </span>
          <select
            value={lens}
            onChange={(e) => setLens(e.target.value as ViewMode)}
            className="border hairline-strong px-2 py-1 text-[13px] bg-white"
          >
            {VIEW_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {amortized && (
          <label className="flex items-center gap-3 text-[13px]">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Useful life
            </span>
            <input
              type="range"
              min={3}
              max={8}
              step={0.5}
              value={usefulLife}
              onChange={(e) => setUsefulLife(parseFloat(e.target.value))}
              className="w-[200px] accent-[color:var(--accent)]"
            />
            <span className="num w-[60px]">{usefulLife.toFixed(1)} yrs</span>
          </label>
        )}
      </div>

      <div className="border hairline-strong p-4 md:p-6 bg-white">
        <div className="mb-4">
          <h3 className="text-[16px] font-medium">
            {metricMeta.label} —{" "}
            {VIEW_MODES.find((v) => v.id === lens)?.label} ·{" "}
            <span className="text-[color:var(--accent)]">
              {scope === "segment" ? "AI segments" : "whole companies"}
            </span>
          </h3>
        </div>
        <LineChart
          series={series}
          xLabels={xLabels}
          yFormat={yFormat}
          yIsPercent={metricMeta.isPercent}
          zeroLine
          height={420}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {companies.map((c) => {
          const active = enabledTickers.includes(c.ticker);
          return (
            <button
              key={c.ticker}
              onClick={() => toggleTicker(c.ticker)}
              className="border hairline-strong px-3 py-2 text-[12px] flex items-center gap-2 transition-colors"
              style={{
                background: active ? "var(--surface-alt)" : "white",
                opacity: active ? 1 : 0.45,
              }}
            >
              <span
                className="inline-block w-2.5 h-2.5"
                style={{ background: COMPANY_COLORS[c.ticker] }}
              />
              <span>
                {c.ticker}
                {scope === "segment" && c.aiSegment && (
                  <span className="text-[color:var(--muted)]">
                    {" "}
                    ({c.aiSegment})
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
