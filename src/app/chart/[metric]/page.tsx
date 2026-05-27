import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { MetricDetailView } from "@/components/MetricDetailView";
import { ChartLegend, type LegendItem } from "@/components/ChartLegend";
import { CombinedRevenueProfitChart } from "@/components/chart/CombinedRevenueProfitChart";
import { CumulativeNetChart } from "@/components/chart/CumulativeNetChart";
import { getAllAiFacts } from "@/lib/ai-economics-server";
import {
  DERIVED_VIEWS,
  METRIC_META,
  SHARED_NOTES,
  SLUG_TO_METRIC,
  type DerivedView,
  type MetricMeta,
} from "@/lib/ai-economics-meta";
import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  METRIC_LABELS,
  YEARS,
  buildAmortizedFromCapex,
  type EnrichedFact,
  type Metric,
} from "@/lib/ai-economics";
import {
  buildCombinedData,
  buildCumulativeData,
} from "@/lib/ai-economics-derived";
import { Logo } from "@/components/Logo";
import { formatLastUpdated } from "@/lib/format";

export async function generateStaticParams() {
  return [
    ...Object.values(METRIC_META).map((m) => ({ metric: m.slug })),
    ...Object.values(DERIVED_VIEWS).map((v) => ({ metric: v.slug })),
  ];
}

function SourcesTable({
  metric,
  facts,
  heading,
}: {
  metric: Metric;
  facts: EnrichedFact[];
  heading?: string;
}) {
  const cellFacts: EnrichedFact[] =
    metric === "ai_capex_amortized"
      ? buildAmortizedFromCapex(
          facts.filter((f) => f.metric === "ai_capex"),
          5,
          facts.filter((f) => f.metric === "ai_da_reported"),
        )
      : facts.filter((f) => f.metric === metric);
  const cellByKey = new Map<string, EnrichedFact>();
  for (const f of cellFacts) cellByKey.set(`${f.fy}|${f.ticker}`, f);

  return (
    <div className="mb-6">
      {heading && (
        <div className="text-[12px] uppercase tracking-[0.14em] text-[color:var(--foreground)] mb-2">
          {heading}
        </div>
      )}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="border-b hairline-strong">
              <th className="py-2 pr-3 align-bottom" aria-label="Company" />
              {YEARS.map((y) => (
                <th
                  key={y}
                  className="text-left font-medium text-[color:var(--foreground)] py-2 pr-3 align-bottom num"
                >
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPANY_ORDER.map((t) => (
              <tr key={t} className="border-b hairline align-top">
                <td className="py-2 pr-3 whitespace-nowrap">
                  <Logo ticker={t} size={22} title={COMPANY_LABEL[t]} />
                </td>
                {YEARS.map((y) => {
                  const f = cellByKey.get(`${y}|${t}`);
                  if (!f || f.sources.length === 0) {
                    return (
                      <td
                        key={y}
                        className="py-2 pr-3 text-[color:var(--muted)]"
                      >
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={y} className="py-2 pr-3">
                      <ul className="space-y-0.5">
                        {f.sources.map((s, i) => (
                          <li key={i} className="leading-[1.35]">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="source-link"
                            >
                              {s.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MethodologyBlock({
  meta,
  heading,
}: {
  meta: MetricMeta;
  heading?: string;
}) {
  return (
    <div className="mb-6">
      {heading && (
        <div className="text-[12px] uppercase tracking-[0.14em] text-[color:var(--foreground)] mb-2">
          {heading}
        </div>
      )}
      {meta.methodology.map((p, i) => (
        <p key={i} className="mb-3">
          {p}
        </p>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group pt-8 text-[13px] leading-[1.6] text-[color:var(--muted)]">
      <summary className="list-none cursor-pointer select-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
        <svg
          className="text-[color:var(--foreground)] transition-transform duration-150 group-open:rotate-90"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
        >
          <path
            d="M3.5 1.5L7 5L3.5 8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground)]">
          {title}
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function SharedFooter({ metrics }: { metrics: Metric[] }) {
  const showNvda = metrics.some((m) =>
    [
      "ai_revenue",
      "ai_operating_profit",
      "ai_capex",
      "ai_capex_amortized",
    ].includes(m),
  );
  return (
    <>
      {showNvda && (
        <p className="mb-3">
          <span className="text-[color:var(--foreground)]">
            NVIDIA carve-out.
          </span>{" "}
          {SHARED_NOTES.nvdaCarveout}
        </p>
      )}
      <p className="mb-3">
        <span className="text-[color:var(--foreground)]">
          2026 annualization.
        </span>{" "}
        {SHARED_NOTES.annualization}
      </p>
      <p>
        <span className="text-[color:var(--foreground)]">
          Fiscal-year notes.
        </span>{" "}
        {SHARED_NOTES.fiscal} See{" "}
        <a
          href="https://github.com/Eeshita-Pande/tokenomics/blob/main/VERIFICATION.md"
          target="_blank"
          rel="noreferrer"
          className="source-link"
        >
          VERIFICATION.md
        </a>{" "}
        for a row-by-row guide on where to find each number in the source
        filing.
      </p>
    </>
  );
}

function DerivedDetail({
  view,
  facts,
}: {
  view: DerivedView;
  facts: EnrichedFact[];
}) {
  const isCombined = view.slug === "ai-revenue-and-profit";
  const isCumulative = view.slug === "ai-cumulative-net";

  const legendItems: LegendItem[] = isCombined
    ? [
        { shape: "solid", label: "AI revenue" },
        { shape: "dashed", label: "AI operating cost (visible gap = operating profit)" },
      ]
    : isCumulative
      ? [
          {
            shape: "solid",
            label: "Cumulative AI operating profit − cumulative AI capex (2022–2026)",
          },
        ]
      : [];

  return (
    <>
      <div className="border hairline-strong bg-white p-4 md:p-6">
        {isCombined &&
          (() => {
            const { data, tickers } = buildCombinedData(facts);
            return (
              <CombinedRevenueProfitChart
                data={data}
                years={[...YEARS]}
                tickers={tickers}
                tickerLabels={COMPANY_LABEL}
                size="full"
                height={1100}
              />
            );
          })()}
        {isCumulative && (
          <CumulativeNetChart
            data={buildCumulativeData(facts)}
            size="full"
            height={480}
          />
        )}
        <ChartLegend items={legendItems} />
      </div>

      <div className="mt-12 border-t hairline" />

      <CollapsibleSection title="Sources">
        <p className="mb-4 text-[12px]">
          Each cell links to the exact filing, press release, or article the
          number is drawn from. This view combines{" "}
          {view.sourceMetrics
            .map((m) => METRIC_LABELS[m].toLowerCase())
            .join(" and ")}
          , so sources are listed per underlying metric.
        </p>
        {view.sourceMetrics.map((m) => (
          <SourcesTable
            key={m}
            metric={m}
            facts={facts}
            heading={`${METRIC_LABELS[m]} sources`}
          />
        ))}
      </CollapsibleSection>

      <div className="mt-12 border-t hairline" />

      <CollapsibleSection title="Methodology">
        {view.sourceMetrics.map((m) => {
          const meta = METRIC_META[m];
          if (!meta) return null;
          return (
            <MethodologyBlock
              key={m}
              meta={meta}
              heading={`${METRIC_LABELS[m]} methodology`}
            />
          );
        })}
        <SharedFooter metrics={view.sourceMetrics} />
      </CollapsibleSection>
    </>
  );
}

export default async function MetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric: slug } = await params;

  // Derived views (combined, cumulative) take priority over raw metric slugs.
  const derivedView = DERIVED_VIEWS[slug];
  const metric = derivedView ? null : SLUG_TO_METRIC[slug];
  const singleMeta = metric ? METRIC_META[metric] : null;

  if (!derivedView && !singleMeta) notFound();

  const kicker = derivedView?.kicker ?? singleMeta!.kicker;
  const title = derivedView?.title ?? singleMeta!.title;
  const description = derivedView?.description ?? singleMeta!.description;

  const facts = await getAllAiFacts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-6 py-10 flex-1">
        <div className="flex items-start justify-between gap-6 mb-6">
          <section className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)] mb-2">
              {kicker}
            </div>
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight">
              {title}
            </h1>
            <p className="mt-3 text-[14px] leading-[1.55] text-[color:var(--muted)]">
              {description}
            </p>
          </section>
          <Link
            href="/"
            className="shrink-0 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--accent)] mt-1"
          >
            <span aria-hidden>←</span> All charts
          </Link>
        </div>

        {derivedView ? (
          <DerivedDetail view={derivedView} facts={facts} />
        ) : (
          <SingleMetricDetail metric={metric!} facts={facts} />
        )}
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1440px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>Tokenomics — research, not investment advice.</span>
          <span>{formatLastUpdated()}</span>
        </div>
      </footer>
    </>
  );
}

function SingleMetricDetail({
  metric,
  facts,
}: {
  metric: Metric;
  facts: EnrichedFact[];
}) {
  const meta = METRIC_META[metric]!;

  return (
    <>
      <MetricDetailView metric={metric} facts={facts} />

      <div className="mt-12 border-t hairline" />

      <CollapsibleSection title="Sources">
        <p className="mb-3 text-[12px]">
          Each cell links to the exact filing, press release, or article the
          number is drawn from.
          {metric === "ai_capex_amortized" &&
            " Amortized values are derived from the underlying capex series; the links below point to those source filings."}
        </p>
        <SourcesTable metric={metric} facts={facts} />
      </CollapsibleSection>

      <div className="mt-12 border-t hairline" />

      <CollapsibleSection title="Methodology">
        {meta.methodology.map((p, i) => (
          <p key={i} className="mb-3">
            {p}
          </p>
        ))}

        <SharedFooter metrics={[metric]} />
      </CollapsibleSection>
    </>
  );
}
