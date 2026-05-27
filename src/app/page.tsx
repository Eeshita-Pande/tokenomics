import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { getAllAiFacts } from "@/lib/ai-economics-server";
import { METRIC_ORDER } from "@/lib/ai-economics-meta";
import { formatLastUpdated } from "@/lib/format";

export default async function HomePage() {
  const facts = await getAllAiFacts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-6 flex-1">
        <section className="mb-5 max-w-[820px]">
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight">
            The Economics of AI Spend
          </h1>
          <p className="mt-2 text-[13px] leading-[1.5] text-[color:var(--muted)]">
            Year-by-year capex, revenue, and operating profit for the six
            companies bankrolling the AI buildout. Click a chart for the full
            interactive view.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {METRIC_ORDER.map((m) => (
            <MetricCard key={m} metric={m} facts={facts} />
          ))}
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-4 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>Tokenomics — research, not investment advice.</span>
          <span>{formatLastUpdated()}</span>
        </div>
      </footer>
    </>
  );
}
