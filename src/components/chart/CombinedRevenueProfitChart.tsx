"use client";

import { useEffect, useRef, useState } from "react";
import type { AiSource } from "@/lib/ai-economics";
import { Logo } from "@/components/Logo";

export type CombinedDatum = {
  year: number;
  ticker: string;
  label: string;
  color: string;
  revenue: number | null;
  profit: number | null;
  revenueNote: string | null;
  profitNote: string | null;
  revenueSources: AiSource[];
  profitSources: AiSource[];
  revenueMethodology: string;
  profitMethodology: string;
};

type Props = {
  data: CombinedDatum[];
  years: number[]; // any order — chart renders newest year on top
  tickers: string[]; // already sorted (descending 2026 revenue); same order used for every year row
  tickerLabels: Record<string, string>;
  size: "snapshot" | "full";
  height?: number; // fixed height; if omitted, chart fills its parent vertically
};

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exp = Math.floor(Math.log10(Math.abs(rough)));
  const base = Math.pow(10, exp);
  const m = rough / base;
  if (m < 1.5) return 1 * base;
  if (m < 3) return 2 * base;
  if (m < 7) return 5 * base;
  return 10 * base;
}

function niceDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  let lo = Math.min(...values, 0);
  let hi = Math.max(...values, 0);
  if (lo === hi) hi = lo + 1;
  const span = hi - lo;
  const pad = span * 0.05;
  hi += pad;
  if (lo < 0) lo -= pad;
  const step = niceStep((hi - lo) / 5);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  return [lo, hi];
}

function defaultFmt(v: number) {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e10) return `${sign}$${Math.round(abs / 1e9)}B`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(0)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  if (abs === 0) return "$0";
  return `${sign}$${abs.toFixed(0)}`;
}

function barLabel(v: number): string {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  const wrap = (s: string) => (v < 0 ? `(${s})` : s);
  if (abs >= 1e10) return wrap(`$${Math.round(abs / 1e9)}B`);
  if (abs >= 1e9) return wrap(`$${(abs / 1e9).toFixed(1)}B`);
  if (abs >= 1e8) return wrap(`$${Math.round(abs / 1e6)}M`);
  if (abs >= 1e6) return wrap(`$${(abs / 1e6).toFixed(0)}M`);
  if (abs === 0) return "$0";
  return "";
}

function fmtMoneyParen(v: number) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const wrap = (s: string) => (v < 0 ? `(${s})` : s);
  if (abs >= 1e9) return wrap(`$${(abs / 1e9).toFixed(1)}B`);
  if (abs >= 1e6) return wrap(`$${(abs / 1e6).toFixed(0)}M`);
  return wrap(`$${abs.toFixed(0)}`);
}

export function CombinedRevenueProfitChart({
  data,
  years,
  tickers,
  tickerLabels,
  size,
  height,
}: Props) {
  const isFull = size === "full";
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dims, setDims] = useState({
    w: isFull ? 1100 : 560,
    h: height ?? (isFull ? 540 : 400),
  });
  const [hover, setHover] = useState<CombinedDatum | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() =>
      setDims({
        w: el.clientWidth || (isFull ? 1100 : 560),
        h: el.clientHeight || height || (isFull ? 540 : 400),
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFull, height]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const cancelDismiss = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };
  const scheduleDismiss = () => {
    cancelDismiss();
    dismissTimer.current = setTimeout(() => {
      setHover(null);
      setHoverPos(null);
      dismissTimer.current = null;
    }, 160);
  };

  const W = dims.w;
  const H = dims.h;

  const PAD = isFull
    ? { top: 22, right: 100, bottom: 38, left: 60 }
    : { top: 8, right: 40, bottom: 22, left: 40 };

  const innerW = Math.max(W - PAD.left - PAD.right, 100);
  const innerH = Math.max(H - PAD.top - PAD.bottom, 80);

  const xValues: number[] = [];
  for (const d of data) {
    if (d.revenue !== null && Number.isFinite(d.revenue)) xValues.push(d.revenue);
    if (d.profit !== null && Number.isFinite(d.profit)) xValues.push(d.profit);
  }
  const [xMin, xMax] = niceDomain(xValues);

  // Render rows newest-first (2026 on top, 2022 on bottom).
  const sortedYears = [...years].sort((a, b) => b - a);
  const latestYear = sortedYears[0];

  const rowH = innerH / sortedYears.length;
  const rowPad = isFull ? 10 : 6;
  const barAreaH = rowH - rowPad;
  const barH = Math.max(
    barAreaH / tickers.length - (isFull ? 2 : 1),
    isFull ? 8 : 4,
  );
  const barPitch = barH + (isFull ? 2 : 1);

  const xAt = (v: number) =>
    PAD.left + ((v - xMin) / (xMax - xMin || 1)) * innerW;
  const yRowStart = (yi: number) => PAD.top + yi * rowH + rowPad / 2;
  const zeroX = xAt(0);

  const xTicks: number[] = [];
  const step = niceStep((xMax - xMin) / (isFull ? 5 : 3));
  for (let v = Math.ceil(xMin / step) * step; v <= xMax + step * 0.001; v += step) {
    xTicks.push(v);
  }

  const logoSize = isFull
    ? Math.min(Math.max(barH, 13), 18)
    : Math.min(Math.max(barH, 8), 11);

  const hatchId = `hatch-${size}`;

  const handleEnter = (
    e: React.MouseEvent<SVGGElement>,
    d: CombinedDatum,
  ) => {
    if (!isFull) return;
    cancelDismiss();
    setHover(d);
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (!wrap) return;
    setHoverPos({ x: e.clientX - wrap.left, y: e.clientY - wrap.top });
  };
  const handleMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!isFull) return;
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (wrap)
      setHoverPos({ x: e.clientX - wrap.left, y: e.clientY - wrap.top });
  };
  const handleLeave = () => {
    if (!isFull) return;
    scheduleDismiss();
  };

  return (
    <div
      ref={wrapRef}
      className={`relative w-full ${isFull ? "select-none" : ""}`}
      style={{ height: height ?? (isFull ? H : "100%") }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ display: "block" }}
      >
        <defs>
          <pattern
            id={hatchId}
            patternUnits="userSpaceOnUse"
            width={isFull ? 5 : 4}
            height={isFull ? 5 : 4}
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={isFull ? 5 : 4}
              stroke="#ffffff"
              strokeWidth={isFull ? 1.8 : 1.4}
              opacity={0.9}
            />
          </pattern>
        </defs>

        {xTicks.map((t) => (
          <g key={`tick-${t}`}>
            <line
              x1={xAt(t)}
              x2={xAt(t)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--hairline)"
              strokeDasharray={t === 0 ? "0" : "2,3"}
            />
            <text
              x={xAt(t)}
              y={PAD.top + innerH + (isFull ? 18 : 14)}
              textAnchor="middle"
              fontSize={isFull ? 11 : 9}
              fontFamily="var(--font-roboto-mono), monospace"
              fill={t < 0 ? "var(--negative)" : "var(--muted)"}
            >
              {defaultFmt(t)}
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="var(--hairline-strong)"
        />

        {xMin < 0 && xMax > 0 && (
          <line
            x1={zeroX}
            x2={zeroX}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--foreground)"
            strokeWidth={isFull ? 1 : 0.75}
          />
        )}

        {sortedYears.map((year, yi) => {
          const rowTop = yRowStart(yi);
          return (
            <g key={`row-${year}`}>
              <text
                x={PAD.left - (isFull ? 10 : 6)}
                y={rowTop + barAreaH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={isFull ? 13 : 10}
                fontFamily="var(--font-roboto-mono), monospace"
                fontWeight={500}
                fill="var(--foreground)"
              >
                {year}
              </text>
              {yi > 0 && (
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={rowTop - rowPad / 2}
                  y2={rowTop - rowPad / 2}
                  stroke="var(--hairline)"
                  strokeDasharray="1,3"
                />
              )}
              {tickers.map((ticker, ti) => {
                const d = data.find(
                  (dx) => dx.year === year && dx.ticker === ticker,
                );
                if (!d) return null;
                const rev = d.revenue;
                if (rev === null || !Number.isFinite(rev)) return null;
                const prof = d.profit;
                const by = rowTop + ti * barPitch;
                const x0 = xAt(0);
                const xRev = xAt(rev);
                const xProf =
                  prof !== null && Number.isFinite(prof) ? xAt(prof) : null;

                const revLeft = Math.min(x0, xRev);
                const revWidth = Math.abs(xRev - x0);

                let costLeft: number | null = null;
                let costWidth = 0;
                if (xProf !== null) {
                  costLeft = Math.min(xProf, xRev);
                  costWidth = Math.abs(xRev - xProf);
                }

                const isLatest = year === latestYear;
                const isHover =
                  hover?.year === year && hover?.ticker === ticker;
                const fadeOther = hover && !isHover;

                // Label placement (full mode only): show revenue value at the
                // right edge of the bar. Profit value (small, italic) below
                // the revenue label.
                const labelX = isLatest
                  ? xRev + logoSize + 8
                  : xRev + 6;
                const showLabels = isFull;
                const revText = barLabel(rev);
                const profText =
                  prof !== null && Number.isFinite(prof)
                    ? barLabel(prof)
                    : "";

                return (
                  <g
                    key={`${year}-${ticker}`}
                    onMouseEnter={(e) => handleEnter(e, d)}
                    onMouseMove={handleMove}
                    onMouseLeave={handleLeave}
                    style={isFull ? { cursor: "help" } : undefined}
                  >
                    {rev > 0 && (
                      <rect
                        x={revLeft}
                        y={by}
                        width={Math.max(revWidth, 0.5)}
                        height={barH}
                        fill={d.color}
                        opacity={isHover ? 1 : fadeOther ? 0.32 : 0.95}
                      />
                    )}
                    {costLeft !== null && costWidth >= 0.5 && (
                      <>
                        <rect
                          x={costLeft}
                          y={by}
                          width={costWidth}
                          height={barH}
                          fill={d.color}
                          opacity={isHover ? 1 : fadeOther ? 0.32 : 0.95}
                        />
                        <rect
                          x={costLeft}
                          y={by}
                          width={costWidth}
                          height={barH}
                          fill={`url(#${hatchId})`}
                          pointerEvents="none"
                          opacity={isHover ? 1 : fadeOther ? 0.5 : 0.85}
                        />
                      </>
                    )}
                    {isLatest && rev > 0 && (
                      <foreignObject
                        x={xRev + 4}
                        y={by + (barH - logoSize) / 2}
                        width={logoSize}
                        height={logoSize}
                        pointerEvents="none"
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: fadeOther ? 0.35 : 1,
                          }}
                        >
                          <Logo
                            ticker={ticker}
                            size={logoSize}
                            title={tickerLabels[ticker]}
                          />
                        </div>
                      </foreignObject>
                    )}
                    {showLabels && (
                      <g pointerEvents="none">
                        <text
                          x={labelX}
                          y={by + barH / 2 - (profText ? 1 : 0)}
                          dominantBaseline={profText ? "auto" : "middle"}
                          fontSize={10}
                          fontFamily="var(--font-roboto-mono), monospace"
                          fontWeight={500}
                          fill="var(--foreground)"
                          opacity={fadeOther ? 0.4 : 1}
                        >
                          {revText}
                        </text>
                        {profText && (
                          <text
                            x={labelX}
                            y={by + barH / 2 + 1}
                            dominantBaseline="hanging"
                            fontSize={9}
                            fontFamily="var(--font-roboto-mono), monospace"
                            fill={
                              prof !== null && prof < 0
                                ? "var(--negative)"
                                : "var(--muted)"
                            }
                            opacity={fadeOther ? 0.4 : 1}
                          >
                            {profText}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {isFull && hover && hoverPos && (
        <div
          className="absolute bg-white border hairline-strong shadow-md p-3 text-[12px] leading-[1.5]"
          onMouseEnter={cancelDismiss}
          onMouseLeave={scheduleDismiss}
          style={{
            left: Math.min(hoverPos.x + 14, W - 340),
            top: Math.min(hoverPos.y + 8, H - 80),
            maxWidth: 340,
            minWidth: 280,
            zIndex: 10,
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {hover.label}
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Revenue
              </span>
              <span className="num text-[14px] font-medium">
                {hover.revenue !== null ? fmtMoneyParen(hover.revenue) : "—"}
              </span>
            </div>
            {hover.revenueMethodology && (
              <div className="mt-1 text-[11px] text-[color:var(--foreground)]">
                {hover.revenueMethodology}
              </div>
            )}
            {hover.revenueNote && (
              <div className="mt-1 text-[11px] text-[color:var(--muted)] italic">
                Revenue: {hover.revenueNote}
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t hairline">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Operating profit
              </span>
              <span
                className="num text-[14px] font-medium"
                style={
                  hover.profit !== null && hover.profit < 0
                    ? { color: "var(--negative)" }
                    : undefined
                }
              >
                {hover.profit !== null ? fmtMoneyParen(hover.profit) : "—"}
              </span>
            </div>
            {hover.profitMethodology && (
              <div className="mt-1 text-[11px] text-[color:var(--foreground)]">
                {hover.profitMethodology}
              </div>
            )}
            {hover.profitNote && (
              <div className="mt-1 text-[11px] text-[color:var(--muted)] italic">
                Operating Profit: {hover.profitNote}
              </div>
            )}
          </div>
          {(hover.revenueSources.length > 0 ||
            hover.profitSources.length > 0) && (
            <div className="mt-2 pt-2 border-t hairline">
              {hover.revenueSources.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] mb-1">
                    Revenue sources
                  </div>
                  <ul className="space-y-0.5">
                    {hover.revenueSources.map((s, i) => (
                      <li key={i} className="text-[11px]">
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
                </div>
              )}
              {hover.profitSources.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] mb-1">
                    Operating profit sources
                  </div>
                  <ul className="space-y-0.5">
                    {hover.profitSources.map((s, i) => (
                      <li key={i} className="text-[11px]">
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
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
