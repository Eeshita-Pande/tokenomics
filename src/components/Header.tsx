import Link from "next/link";
import { formatLastUpdated } from "@/lib/format";

export function Header() {
  return (
    <header className="border-b hairline">
      <div className="mx-auto max-w-[1440px] px-6 py-4 flex items-baseline justify-between">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-[20px] font-bold tracking-tight">
            Tokenomics
          </span>
          {/* <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            AI economics, footnoted
          </span> */}
        </Link>
        <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {formatLastUpdated()}
        </span>
      </div>
    </header>
  );
}
