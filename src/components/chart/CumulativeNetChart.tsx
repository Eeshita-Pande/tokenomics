"use client";

import { useEffect, useRef, useState } from "react";
import type { AiSource } from "@/lib/ai-economics";
import { Logo } from "@/components/Logo";

export type CumulativeDatum = {
  ticker: string;
  label: string;
  color: string;
  value: number; // cumulative op profit − cumulative capex
  cumProfit: number;
  cumCapex: number;
  profitSources: AiSource[];
  capexSources: AiSource[];
};

type Props = {
  data: CumulativeDatum[]; // expected pre-sorted (descending by value)
  size: "snapshot" | "full";
  height?: number;
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

export function CumulativeNetChart({ data, size, height }: Props) {
  const isFull = size === "full";
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [width, setWidth] = useState(isFull ? 1100 : 520);
  const [hover, setHover] = useState<CumulativeDatum | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() =>
      setWidth(el.clientWidth || (isFull ? 1100 : 520)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFull]);

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

  const H = height ?? (isFull ? 480 : 150);
  const logoColW = isFull ? 36 : 22;
  const labelGutter = isFull ? 90 : 50;
  const PAD = isFull
    ? { top: 18, right: labelGutter, bottom: 36, left: 16 + logoColW + 8 }
    : { top: 6, right: labelGutter, bottom: 20, left: 8 + logoColW + 4 };

  const innerW = Math.max(width - PAD.left - PAD.right, 80);
  const innerH = H - PAD.top - PAD.bottom;

  const [xMin, xMax] = niceDomain(data.map((d) => d.value));

  const rowH = innerH / Math.max(data.length, 1);
  const barH = Math.max(rowH * (isFull ? 0.62 : 0.7), isFull ? 14 : 8);

  const xAt = (v: number) =>
    PAD.left + ((v - xMin) / (xMax - xMin || 1)) * innerW;
  const zeroX = xAt(0);

  const xTicks: number[] = [];
  const step = niceStep((xMax - xMin) / (isFull ? 5 : 3));
  for (let v = Math.ceil(xMin / step) * step; v <= xMax + step * 0.001; v += step) {
    xTicks.push(v);
  }

  const logoSize = isFull ? 22 : 14;

  const handleEnter = (
    e: React.MouseEvent<SVGGElement>,
    d: CumulativeDatum,
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
      style={{ height: H }}
    >
      <svg
        viewBox={`0 0 ${width} ${H}`}
        width="100%"
        height={H}
        style={{ display: "block" }}
      >
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

        {data.map((d, i) => {
          const rowTop = PAD.top + i * rowH;
          const barY = rowTop + (rowH - barH) / 2;
          const x0 = xAt(0);
          const xV = xAt(d.value);
          const barLeft = Math.min(x0, xV);
          const barWidth = Math.abs(xV - x0);
          const isHover = hover?.ticker === d.ticker;
          const fadeOther = hover && !isHover;
          // Label sits just past the far edge of the bar (right end for
          // positive, left end for negative).
          const labelX = d.value >= 0 ? xV + 6 : xV - 6;
          const labelAnchor = d.value >= 0 ? "start" : "end";
          return (
            <g
              key={d.ticker}
              onMouseEnter={(e) => handleEnter(e, d)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              style={isFull ? { cursor: "help" } : undefined}
            >
              <foreignObject
                x={PAD.left - logoColW + (logoColW - logoSize) / 2}
                y={rowTop + (rowH - logoSize) / 2}
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
                    ticker={d.ticker}
                    size={logoSize}
                    title={d.label}
                  />
                </div>
              </foreignObject>
              <rect
                x={barLeft}
                y={barY}
                width={Math.max(barWidth, 0.5)}
                height={barH}
                fill={d.color}
                opacity={isHover ? 1 : fadeOther ? 0.32 : 0.95}
              />
              {isFull && (
                <text
                  x={labelX}
                  y={barY + barH / 2}
                  textAnchor={labelAnchor}
                  dominantBaseline="middle"
                  fontSize={11}
                  fontFamily="var(--font-roboto-mono), monospace"
                  fontWeight={500}
                  fill={
                    d.value < 0 ? "var(--negative)" : "var(--foreground)"
                  }
                  pointerEvents="none"
                  opacity={fadeOther ? 0.4 : 1}
                >
                  {barLabel(d.value)}
                </text>
              )}
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
            left: Math.min(hoverPos.x + 14, width - 340),
            top: Math.min(hoverPos.y + 8, H - 80),
            maxWidth: 340,
            minWidth: 280,
            zIndex: 10,
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {hover.label}
          </div>
          <div className="num text-[18px] mt-0.5 font-medium">
            <span
              style={hover.value < 0 ? { color: "var(--negative)" } : undefined}
            >
              {fmtMoneyParen(hover.value)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t hairline space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Cumulative operating profit
              </span>
              <span
                className="num text-[13px]"
                style={
                  hover.cumProfit < 0 ? { color: "var(--negative)" } : undefined
                }
              >
                {fmtMoneyParen(hover.cumProfit)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Cumulative AI capex
              </span>
              <span className="num text-[13px]">
                {fmtMoneyParen(hover.cumCapex)}
              </span>
            </div>
            <div className="text-[11px] text-[color:var(--muted)]">
              Net = cumulative op profit − cumulative capex (2022–2026).
            </div>
          </div>
          {(hover.profitSources.length > 0 ||
            hover.capexSources.length > 0) && (
            <div className="mt-2 pt-2 border-t hairline">
              {hover.profitSources.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] mb-1">
                    Operating profit sources
                  </div>
                  <ul className="space-y-0.5">
                    {hover.profitSources.slice(0, 6).map((s, i) => (
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
              {hover.capexSources.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] mb-1">
                    AI capex sources
                  </div>
                  <ul className="space-y-0.5">
                    {hover.capexSources.slice(0, 6).map((s, i) => (
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
