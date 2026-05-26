import { Header } from "@/components/Header";
import { AiEconomicsBoard } from "@/components/AiEconomicsBoard";
import { getAllAiFacts } from "@/lib/ai-economics-server";

export default async function HomePage() {
  const facts = await getAllAiFacts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10 flex-1">
        <section className="border-b hairline pb-8 mb-8">
          <h1 className="text-[40px] leading-[1.05] font-bold tracking-tight max-w-[820px]">
            Year-by-year AI economics, with every number footnoted.
          </h1>
          <p className="mt-4 max-w-[720px] text-[15px] leading-[1.55] text-[color:var(--muted)]">
            Six companies — Amazon, Alphabet, Microsoft, NVIDIA, OpenAI,
            Anthropic — across four years. Toggle metrics, hover any bar to
            read the methodology and source for that exact figure. Every
            displayed value traces back to a public filing, press release,
            or named leak. No estimate is unlabeled.
          </p>
        </section>

        <AiEconomicsBoard facts={facts} />

        <section className="mt-16 border-t hairline pt-8 max-w-[820px] text-[13px] leading-[1.55] text-[color:var(--muted)]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground)] mb-2">
            Methodology
          </div>
          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">AI capex.</span>{" "}
            For hyperscalers (Amazon, Alphabet, Microsoft), whole-company
            capex per the 10-K cash-flow statement, treated as AI-attributable
            per the MD&amp;A &ldquo;primarily for technology infrastructure&rdquo;
            language. This is the same convention isaiprofitable.com uses and
            represents the bear-case upper bound. NVIDIA has minimal capex —
            their AI economics are revenue-side. OpenAI and Anthropic carry
            no GPU PP&amp;E; their compute is opex.
          </p>
          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">
              AI capex — amortized.
            </span>{" "}
            Straight-line over the chosen useful life applied to the same
            historical capex series. Shows the depreciation-flow story rather
            than the cash-out story. Slider toggles 3–8 years.
          </p>
          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">AI revenue.</span>{" "}
            Hyperscalers: cloud segment as disclosed (AWS, Google Cloud,
            Intelligent Cloud). NVIDIA: Data Center segment. OpenAI/Anthropic:
            total recognized revenue from The Information internal-docs
            reporting and Sacra/Epoch AI estimates.
          </p>
          <p className="mb-3">
            <span className="text-[color:var(--foreground)]">
              AI operating profit.
            </span>{" "}
            Cloud segment operating income for hyperscalers; Compute &amp;
            Networking segment income (closest Data Center proxy) for NVIDIA;
            total operating loss for OpenAI and Anthropic.
          </p>
          <p>
            <span className="text-[color:var(--foreground)]">
              Data quality classifications.
            </span>{" "}
            <span style={{ color: "#0a6d3a" }}>Sourced</span> — single
            authoritative source (SEC filing, press release, direct CFO
            statement).{" "}
            <span style={{ color: "#0f4c81" }}>Calculated</span> — derived
            from sourced inputs (e.g. amortization).{" "}
            <span style={{ color: "#b8002e" }}>Inconsistent</span> — sources
            disagree materially, range shown.{" "}
            <span style={{ color: "#6b6b6b" }}>Estimated</span> — no primary
            disclosure; credible third-party estimate or interpolation.
          </p>
        </section>
      </main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-5 text-[12px] text-[color:var(--muted)] flex justify-between">
          <span>tokenomics — research surface, not investment advice.</span>
          <span className="num">last verified: {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </footer>
    </>
  );
}
