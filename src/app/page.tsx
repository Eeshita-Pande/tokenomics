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
