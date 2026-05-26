"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/chart/LineChart";
import { COMPANY_COLORS } from "@/components/chart/palette";
import { buildCompanySeries, METRICS, type Metric } from "@/lib/series";
import type { PeriodRow } from "@/lib/views";
import { fmtMoney, fmtPct } from "@/lib/format";

type CompanyData = {
  ticker: string;
  name: string;
  aiSegment: string | null;
  wholePeriods: PeriodRow[];
  segmentPeriods: PeriodRow[];
};

type Scope = "segment" | "whole";

export function HomepageChart({ companies }: { companies: CompanyData[] }) {
  const [scope, setScope] = useState<Scope>("segment");
  const [metric, setMetric] = useState<Metric>("adjustedMargin");

  const metricMeta = METRICS.find((m) => m.id === metric)!;
  const yFormat = metricMeta.isPercent ? (v: number) => fmtPct(v) : fmtMoney;

  const seriesInput = useMemo(
    () =>
      companies.map((c) => ({
        ticker: c.ticker,
        name: c.name,
        periods:
          scope === "segment" && c.segmentPeriods.length > 0
            ? c.segmentPeriods
            : c.wholePeriods,
      })),
    [companies, scope],
  );

  const { series, xLabels } = useMemo(
    () => buildCompanySeries(seriesInput, metric, "gaap", 5),
    [seriesInput, metric],
  );

  return (
    <div className="border hairline-strong bg-white p-4 md:p-6">
      <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h3 className="text-[18px] font-medium">
            {metricMeta.label} —{" "}
            <span className="text-[color:var(--accent)]">
              {scope === "segment"
                ? "AI-adjacent segments"
                : "whole companies"}
            </span>
          </h3>
          <p className="text-[12px] text-[color:var(--muted)] mt-0.5">
            GAAP basis. Quarterly. Hover to inspect.
            {scope === "segment" && (
              <>
                {" "}AWS · Google Cloud · NVDA Data Center · DUOL whole-company
                (no segment break-out)
              </>
            )}
          </p>
        </div>
        <div className="flex items-baseline gap-3">
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
      </div>
      <LineChart
        series={series}
        xLabels={xLabels}
        yFormat={yFormat}
        yIsPercent={metricMeta.isPercent}
        zeroLine
        height={400}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {companies.map((c) => (
          <div
            key={c.ticker}
            className="flex items-center gap-2 text-[12px]"
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
          </div>
        ))}
      </div>
    </div>
  );
}
