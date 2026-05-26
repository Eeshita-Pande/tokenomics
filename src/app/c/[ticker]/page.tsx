import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CompanyExplorer } from "@/components/CompanyExplorer";
import { getCompanyByTicker } from "@/lib/data";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getCompanyByTicker(ticker);
  if (!data) notFound();

  const { company, aiSegment, wholePeriods, segmentPeriods } = data;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10 flex-1">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          <Link href="/">Companies</Link> /{" "}
          {company.segment?.replace(/_/g, " ")}
        </div>
        <h1 className="mt-2 text-[36px] font-bold tracking-tight">
          {company.ticker}{" "}
          <span className="text-[color:var(--muted)] font-normal text-[20px]">
            — {company.name}
          </span>
        </h1>
        <p className="mt-2 text-[13px] text-[color:var(--muted)] num">
          CIK {company.cik}{" "}
          {aiSegment && (
            <span className="ml-3 text-[color:var(--foreground)]">
              · AI-adjacent segment:{" "}
              <span className="text-[color:var(--accent)]">{aiSegment}</span>
            </span>
          )}
        </p>

        <section className="mt-8">
          <CompanyExplorer
            ticker={company.ticker}
            aiSegment={aiSegment}
            segmentPeriods={segmentPeriods}
            wholePeriods={wholePeriods}
          />
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>tokenomics — research surface, not investment advice.</span>
          <span className="num">data: SEC EDGAR XBRL</span>
        </div>
      </footer>
    </>
  );
}
