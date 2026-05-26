import { Header } from "@/components/Header";
import { CompareExplorer } from "@/components/CompareExplorer";
import { getAllCompanyData } from "@/lib/data";

export default async function ComparePage() {
  const data = await getAllCompanyData();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10 flex-1">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Compare
        </div>
        <h1 className="mt-2 text-[36px] font-bold tracking-tight">
          Cross-company view
        </h1>
        <p className="mt-2 text-[13px] text-[color:var(--muted)] max-w-[680px]">
          Pick a metric, pick a lens, pick the companies. AI-adjacent segments
          by default. The same accounting treatment applied across the cost
          cascade.
        </p>

        <section className="mt-8">
          <CompareExplorer companies={data} />
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>tokenomics — research surface, not investment advice.</span>
          <span className="num">data: SEC EDGAR XBRL · segments where disclosed</span>
        </div>
      </footer>
    </>
  );
}
