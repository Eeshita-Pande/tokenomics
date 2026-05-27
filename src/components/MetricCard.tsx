import Link from "next/link";
import { SnapshotChart } from "@/components/chart/SnapshotChart";
import type { BarDatum } from "@/components/chart/BarChart";
import { COMPANY_COLORS } from "@/components/chart/palette";
import {
  COMPANY_ORDER,
  COMPANY_LABEL,
  YEARS,
  buildAmortizedFromCapex,
  type EnrichedFact,
  type Metric,
} from "@/lib/ai-economics";
import { METRIC_META } from "@/lib/ai-economics-meta";

type Props = {
  metric: Metric;
  facts: EnrichedFact[];
  usefulLife?: number;
};

export function MetricCard({ metric, facts, usefulLife = 5 }: Props) {
  const meta = METRIC_META[metric];
  if (!meta) return null;

  const source =
    metric === "ai_capex_amortized"
      ? buildAmortizedFromCapex(
          facts.filter((f) => f.metric === "ai_capex"),
          usefulLife,
          facts.filter((f) => f.metric === "ai_da_reported"),
        )
      : facts.filter((f) => f.metric === metric);

  const byCell = new Map<string, EnrichedFact>();
  for (const f of source) byCell.set(`${f.fy}|${f.ticker}`, f);

  const data: BarDatum[] = [];
  for (const year of YEARS) {
    for (const ticker of COMPANY_ORDER) {
      const f = byCell.get(`${year}|${ticker}`);
      data.push({
        group: String(year),
        series: ticker,
        label: `${COMPANY_LABEL[ticker]} · ${year}`,
        color: COMPANY_COLORS[ticker] ?? "#111",
        value: f?.value ?? null,
        low: null,
        high: null,
        methodology: "",
        sources: [],
        note: null,
        marker: f?.marker ?? null,
        markerDomainMax: f?.markerDomainMax ?? null,
      });
    }
  }

  return (
    <Link
      href={`/chart/${meta.slug}`}
      className="card-link group block border hairline-strong bg-white transition-shadow hover:border-[color:var(--foreground)] hover:shadow-[0_0_0_1px_var(--foreground)]"
    >
      <div className="bg-[color:var(--surface-alt)] border-b hairline px-4 pt-3 pb-2">
        <div className="h-[150px]">
          <SnapshotChart
            data={data}
            groups={YEARS.map(String)}
            serieses={COMPANY_ORDER.map((t) => ({
              id: t,
              color: COMPANY_COLORS[t] ?? "#111",
            }))}
            height={150}
            width={520}
          />
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--accent)] mb-1">
          {meta.kicker}
        </div>
        <h2 className="text-[18px] leading-[1.2] font-bold tracking-tight text-[color:var(--foreground)]">
          {meta.title}
        </h2>
        <p className="mt-1 text-[12px] leading-[1.45] text-[color:var(--muted)]">
          {meta.description}
        </p>
      </div>
    </Link>
  );
}
