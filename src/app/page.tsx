import { Header } from "@/components/Header";
import { AiEconomicsBoard } from "@/components/AiEconomicsBoard";
import { getAllAiFacts } from "@/lib/ai-economics-server";

export default async function HomePage() {
  const facts = await getAllAiFacts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10 flex-1">
        <section className="mb-6">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight">
            AI economics, footnoted.
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] text-[color:var(--muted)]">
            Hover a bar for the figure, methodology, and source.
          </p>
        </section>

        <AiEconomicsBoard facts={facts} />

        <section className="mt-14 border-t hairline pt-8 max-w-[820px] text-[13px] leading-[1.6] text-[color:var(--muted)]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground)] mb-3">
            Methodology
          </div>

          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">AI capex.</span>{" "}
            For hyperscalers (Amazon, Google, Microsoft), whole-company capex
            per the 10-K / 10-Q cash-flow statement (&ldquo;Purchases of
            property and equipment&rdquo; / &ldquo;Additions to PP&amp;E&rdquo;),
            treated as AI-attributable per the MD&amp;A &ldquo;primarily for
            technology infrastructure&rdquo; language. This is the bear-case
            upper bound. NVIDIA has minimal capex (chip designer, not
            infrastructure operator). OpenAI and Anthropic carry no GPU
            PP&amp;E; their compute is opex via multi-year cloud commitments
            (Stargate, Project Rainier, Google TPU deals).
          </p>

          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">
              AI capex — amortized.
            </span>{" "}
            Straight-line over the chosen useful life applied to the historical
            capex series. Shows the depreciation-flow story rather than the
            cash-out story. Slider toggles 3–8 years. Each year sums (current
            year + prior years within useful life) ÷ useful life.
          </p>

          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">AI revenue.</span>{" "}
            Hyperscalers: cloud segment as disclosed (AWS, Google Cloud,
            Intelligent Cloud). NVIDIA: Data Center segment. OpenAI and
            Anthropic: total recognized revenue from The Information
            internal-docs reporting, Bloomberg, and Fortune. Anthropic revenue
            is reported gross of cloud-reseller (AWS Bedrock, Google Vertex);
            net basis is roughly 20% lower.
          </p>

          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">
              AI operating profit.
            </span>{" "}
            Cloud segment operating income for hyperscalers; Compute &amp;
            Networking segment income (closest Data Center proxy) for NVIDIA;
            total operating loss / cash burn for OpenAI and Anthropic — these
            two are reported as cash burn rather than accrual operating loss
            because deferred GPU commitments distort accrual numbers.
          </p>

          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">
              2026 annualization.
            </span>{" "}
            Calendar-year filers (Amazon, Google) are annualized from Q1 2026
            × 4. Microsoft (fiscal year ending June 30) uses FY26 Q3 × 4.
            NVIDIA FY26 ended Jan 25, 2026 — those are full-year actuals, not
            annualized. OpenAI and Anthropic use the latest reported
            annualized revenue run-rate (Feb 2026 and Apr 2026, respectively).
          </p>

          <p>
            <span className="text-[color:var(--foreground)]">
              Fiscal-year notes.
            </span>{" "}
            NVIDIA&apos;s FY ends in late January, so &ldquo;FY26&rdquo;
            covers calendar 2025 plus three weeks of January 2026. Microsoft&apos;s
            FY ends June 30. In Aug 2024, Microsoft restructured its reporting
            segments — FY25 Intelligent Cloud revenue and operating income are
            not directly comparable to FY22-FY24, and the visible step-down in
            FY25 op income is the recast, not a real decline. See{" "}
            <a
              href="https://github.com/Eeshita-Pande/tokenomics/blob/main/VERIFICATION.md"
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--accent)] underline"
            >
              VERIFICATION.md
            </a>{" "}
            for a row-by-row guide on where to find each number in the
            source filing.
          </p>
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>tokenomics — research surface, not investment advice.</span>
          <span className="num">{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </footer>
    </>
  );
}
