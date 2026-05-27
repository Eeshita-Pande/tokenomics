import { Header } from "@/components/Header";
import { MetricCard, MetricCardShell } from "@/components/MetricCard";
import { CombinedRevenueProfitChart } from "@/components/chart/CombinedRevenueProfitChart";
import { CumulativeNetChart } from "@/components/chart/CumulativeNetChart";
import { getAllAiFacts } from "@/lib/ai-economics-server";
import { DERIVED_VIEWS } from "@/lib/ai-economics-meta";
import {
  buildCombinedData,
  buildCumulativeData,
} from "@/lib/ai-economics-derived";
import { COMPANY_LABEL, YEARS } from "@/lib/ai-economics";
import { formatLastUpdated } from "@/lib/format";

export default async function HomePage() {
  const facts = await getAllAiFacts();
  const combined = buildCombinedData(facts);
  const cumulative = buildCumulativeData(facts);

  const combinedView = DERIVED_VIEWS["ai-revenue-and-profit"];
  const cumulativeView = DERIVED_VIEWS["ai-cumulative-net"];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-6 py-6 flex-1">
        <section className="mb-5 max-w-[820px]">
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight">
            AI economics are muddy for everyone except Nvidia
          </h1>
          <p className="mt-2 text-[13px] leading-[1.5] text-[color:var(--muted)]">
            Accounting for AI inference costs and capex, Nvidia is the only company that is in the green.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-auto items-stretch">
          <div className="md:row-span-2 h-full">
            <MetricCardShell
              slug={combinedView.slug}
              kicker={combinedView.kicker}
              title={combinedView.title}
              description={combinedView.description}
              fill
            >
              <CombinedRevenueProfitChart
                data={combined.data}
                years={[...YEARS]}
                tickers={combined.tickers}
                tickerLabels={COMPANY_LABEL}
                size="snapshot"
              />
            </MetricCardShell>
          </div>

          <MetricCard metric="ai_capex" facts={facts} />

          <MetricCardShell
            slug={cumulativeView.slug}
            kicker={cumulativeView.kicker}
            title={cumulativeView.title}
            description={cumulativeView.description}
          >
            <CumulativeNetChart data={cumulative} size="snapshot" />
          </MetricCardShell>

          <div className="md:col-span-2">
            <MetricCard metric="ai_capex_amortized" facts={facts} />
          </div>
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1440px] px-6 py-4 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>Tokenomics — research, not investment advice.</span>
          <span>{formatLastUpdated()}</span>
        </div>
      </footer>
    </>
  );
}
