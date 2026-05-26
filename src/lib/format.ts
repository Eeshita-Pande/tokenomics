export function fmtMoney(v: number, opts?: { compact?: boolean }) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (opts?.compact !== false) {
    if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  }
  return `$${v.toFixed(0)}`;
}

export function fmtPct(v: number | null, digits = 1) {
  if (v === null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(digits)}%`;
}

export function fmtPeriod(fy: number, fp: string) {
  if (fp === "FY") return `FY${String(fy).slice(2)}`;
  return `${fp} ${String(fy).slice(2)}`;
}
