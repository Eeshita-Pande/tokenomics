import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { MetricDetailView } from "@/components/MetricDetailView";
import { getAllAiFacts } from "@/lib/ai-economics-server";
import {
  METRIC_META,
  SHARED_NOTES,
  SLUG_TO_METRIC,
} from "@/lib/ai-economics-meta";
import {
  COMPANY_LABEL,
  COMPANY_ORDER,
  YEARS,
  buildAmortizedFromCapex,
  type EnrichedFact,
} from "@/lib/ai-economics";
import { Logo } from "@/components/Logo";
import { formatLastUpdated } from "@/lib/format";

export async function generateStaticParams() {
  return Object.values(METRIC_META).map((m) => ({ metric: m.slug }));
}

export default async function MetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric: slug } = await params;
  const metric = SLUG_TO_METRIC[slug];
  if (!metric) notFound();

  const meta = METRIC_META[metric];
  if (!meta) notFound();
  const facts = await getAllAiFacts();

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
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10 flex-1">
        <div className="flex items-start justify-between gap-6 mb-6">
          <section className="max-w-[820px]">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)] mb-2">
              {meta.kicker}
            </div>
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-3 text-[14px] leading-[1.55] text-[color:var(--muted)]">
              {meta.description}
            </p>
          </section>
          <Link
            href="/"
            className="shrink-0 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--accent)] mt-1"
          >
            <span aria-hidden>←</span> All charts
          </Link>
        </div>

        <MetricDetailView metric={metric} facts={facts} />

        <div className="mt-12 border-t hairline" />

        <section className="pt-8 max-w-[820px] text-[13px] leading-[1.6] text-[color:var(--muted)]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground)] mb-3">
            Sources
          </div>
          <p className="mb-3 text-[12px]">
            Each cell links to the exact filing, press release, or article the
            number is drawn from.
            {metric === "ai_capex_amortized" &&
              " Amortized values are derived from the underlying capex series; the links below point to those source filings."}
          </p>
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
        </section>

        <div className="mt-12 border-t hairline" />

        <section className="pt-8 max-w-[820px] text-[13px] leading-[1.6] text-[color:var(--muted)]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground)] mb-3">
            Methodology
          </div>

          {meta.methodology.map((p, i) => (
            <p key={i} className="mb-3">
              {p}
            </p>
          ))}

          {(metric === "ai_revenue" ||
            metric === "ai_operating_profit" ||
            metric === "ai_capex" ||
            metric === "ai_capex_amortized") && (
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
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>Tokenomics — research, not investment advice.</span>
          <span>{formatLastUpdated()}</span>
        </div>
      </footer>
    </>
  );
}
