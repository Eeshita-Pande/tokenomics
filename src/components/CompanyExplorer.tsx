"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/chart/LineChart";
import { LENS_COLORS } from "@/components/chart/palette";
import { VIEW_MODES, type PeriodRow, type ViewMode } from "@/lib/views";
import { buildLensSeries, METRICS, type Metric } from "@/lib/series";
import { fmtMoney, fmtPct } from "@/lib/format";

const DEFAULT_LENSES: ViewMode[] = [
  "gaap",
  "capex_fully_expensed",
  "capex_amortized_sl",
];

type Scope = "segment" | "whole";

export function CompanyExplorer({
  ticker,
  aiSegment,
  segmentPeriods,
  wholePeriods,
}: {
  ticker: string;
  aiSegment: string | null;
  segmentPeriods: PeriodRow[];
  wholePeriods: PeriodRow[];
}) {
  const hasSegment = aiSegment !== null && segmentPeriods.length > 0;
  const [scope, setScope] = useState<Scope>(hasSegment ? "segment" : "whole");
  const [metric, setMetric] = useState<Metric>("adjustedMargin");
  const [usefulLife, setUsefulLife] = useState(5);
  const [enabledLenses, setEnabledLenses] =
    useState<ViewMode[]>(DEFAULT_LENSES);

  const periods = scope === "segment" ? segmentPeriods : wholePeriods;
  const metricMeta = METRICS.find((m) => m.id === metric)!;
  const yFormat = metricMeta.isPercent ? (v: number) => fmtPct(v) : fmtMoney;

  const { series, xLabels } = useMemo(
    () => buildLensSeries(periods, metric, enabledLenses, usefulLife),
    [periods, metric, enabledLenses, usefulLife],
  );

  const anyAmortized = enabledLenses.some(
    (l) => l === "capex_amortized_sl" || l === "capex_amortized_ddb",
  );

  const toggleLens = (lens: ViewMode) =>
    setEnabledLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens],
    );

  const scopeLabel =
    scope === "segment" && aiSegment
      ? aiSegment
      : `${ticker} (whole company)`;

  const segmentCaveatByMetric: Record<string, string | null> = {
    adjustedMargin:
      ticker === "AMZN"
        ? null
        : "Capex and D&A are not disclosed by segment for this company — amortized lenses use whole-company numbers, which overstates the AI-adjusted cost basis.",
  };
  const caveat = scope === "segment" ? segmentCaveatByMetric[metric] : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 pb-4">
        {hasSegment && (
          <div className="flex border hairline-strong">
            {[
              { id: "segment" as const, label: aiSegment },
              { id: "whole" as const, label: "whole company" },
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
        )}

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

        {anyAmortized && (
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
        <div className="mb-4 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-[16px] font-medium">
              {metricMeta.label} —{" "}
              <span className="text-[color:var(--accent)]">{scopeLabel}</span>
            </h3>
            <p className="text-[12px] text-[color:var(--muted)] mt-0.5">
              Quarterly periods as reported. Hover to read values per lens.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            source: SEC EDGAR ·{" "}
            {scope === "segment" ? "segment footnote" : "company financials"}
          </div>
        </div>
        {periods.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[color:var(--muted)]">
            No data available for this scope. Try switching to whole-company.
          </div>
        ) : (
          <LineChart
            series={series}
            xLabels={xLabels}
            yFormat={yFormat}
            yIsPercent={metricMeta.isPercent}
            zeroLine
            height={420}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {VIEW_MODES.map((m) => {
          const active = enabledLenses.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggleLens(m.id)}
              className="border hairline-strong px-3 py-2 text-[12px] flex items-center gap-2 transition-colors"
              style={{
                background: active ? "var(--surface-alt)" : "white",
                opacity: active ? 1 : 0.55,
              }}
            >
              <span
                className="inline-block w-2.5 h-2.5"
                style={{ background: LENS_COLORS[m.id] }}
              />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {caveat && (
        <p className="mt-6 text-[12px] text-[color:var(--negative)] leading-[1.55] max-w-[820px] border-l-2 border-[color:var(--negative)] pl-3">
          {caveat}
        </p>
      )}
      <p className="mt-6 text-[12px] text-[color:var(--muted)] leading-[1.55] max-w-[820px]">
        Each line is the same scope through a different accounting lens.
        Amortized lines reconstruct depreciation from a{" "}
        {usefulLife.toFixed(1)}-year schedule applied to historical capex.
        AI-adjacent segment for {ticker}:{" "}
        <span className="text-[color:var(--foreground)]">
          {aiSegment ?? "no segment-level AI disclosure"}
        </span>
        .
      </p>
    </div>
  );
}
