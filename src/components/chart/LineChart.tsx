"use client";

import { useMemo, useRef, useState } from "react";

export type Series = {
  id: string;
  name: string;
  color: string;
  dashed?: boolean;
  data: { x: string; y: number | null }[];
};

type Props = {
  series: Series[];
  xLabels: string[];
  yFormat: (v: number) => string;
  yLabel?: string;
  height?: number;
  yIsPercent?: boolean;
  zeroLine?: boolean;
};

const PAD = { top: 28, right: 24, bottom: 36, left: 56 };

function niceDomain(values: number[], yIsPercent?: boolean): [number, number] {
  if (values.length === 0) return [0, 1];
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
  }
  if (yIsPercent) {
    const pad = (hi - lo) * 0.1;
    lo -= pad;
    hi += pad;
    return [lo, hi];
  }
  const span = hi - lo;
  const pad = span * 0.1;
  lo -= pad;
  hi += pad;
  const tickStep = niceStep((hi - lo) / 4);
  lo = Math.floor(lo / tickStep) * tickStep;
  hi = Math.ceil(hi / tickStep) * tickStep;
  return [lo, hi];
}

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

function tickValues(lo: number, hi: number, target = 5): number[] {
  const step = niceStep((hi - lo) / target);
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 0.001; v += step) out.push(v);
  return out;
}

export function LineChart({
  series,
  xLabels,
  yFormat,
  yLabel,
  height = 380,
  yIsPercent,
  zeroLine,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(900);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useMemo(() => {
    if (typeof ResizeObserver === "undefined") return;
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth || 900);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(width - PAD.left - PAD.right, 100);
  const innerH = height - PAD.top - PAD.bottom;

  const allY = series.flatMap((s) =>
    s.data
      .map((d) => d.y)
      .filter((y): y is number => y !== null && Number.isFinite(y)),
  );
  const [yMin, yMax] = niceDomain(allY, yIsPercent);
  const yTicks = tickValues(yMin, yMax);

  const n = xLabels.length;
  const xStep = n > 1 ? innerW / (n - 1) : innerW;
  const xAt = (i: number) => PAD.left + i * xStep;
  const yAt = (v: number) =>
    PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const linePath = (s: Series) => {
    let d = "";
    let pen = false;
    s.data.forEach((pt, i) => {
      if (pt.y === null || !Number.isFinite(pt.y)) {
        pen = false;
        return;
      }
      const cmd = pen ? "L" : "M";
      d += `${cmd}${xAt(i).toFixed(2)},${yAt(pt.y).toFixed(2)} `;
      pen = true;
    });
    return d.trim();
  };

  const showXTickEvery = Math.max(1, Math.ceil(n / 8));

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < PAD.left || x > PAD.left + innerW || n === 0) {
      setHoverIdx(null);
      return;
    }
    const i = Math.round((x - PAD.left) / xStep);
    setHoverIdx(Math.max(0, Math.min(n - 1, i)));
  };

  const hoverX = hoverIdx !== null ? xAt(hoverIdx) : null;
  const tooltip =
    hoverIdx !== null
      ? series
          .map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            value: s.data[hoverIdx]?.y ?? null,
          }))
          .filter((r) => r.value !== null && Number.isFinite(r.value))
          .sort((a, b) => (b.value as number) - (a.value as number))
      : [];

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={yLabel ?? "chart"}
      >
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="var(--hairline-strong)"
          strokeWidth={1}
        />
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + innerH}
          stroke="var(--hairline-strong)"
          strokeWidth={1}
        />

        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--hairline)"
              strokeWidth={1}
              strokeDasharray={t === 0 && zeroLine ? "0" : "2,4"}
            />
            <text
              x={PAD.left - 8}
              y={yAt(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fontFamily="var(--font-roboto-mono), monospace"
              fill="var(--muted)"
            >
              {yFormat(t)}
            </text>
          </g>
        ))}

        {zeroLine && yMin < 0 && yMax > 0 && (
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={yAt(0)}
            y2={yAt(0)}
            stroke="var(--foreground)"
            strokeWidth={1}
          />
        )}

        {xLabels.map((label, i) =>
          i % showXTickEvery === 0 || i === n - 1 ? (
            <text
              key={`${label}-${i}`}
              x={xAt(i)}
              y={PAD.top + innerH + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="var(--font-roboto-mono), monospace"
              fill="var(--muted)"
            >
              {label}
            </text>
          ) : null,
        )}

        {series.map((s) => (
          <path
            key={s.id}
            d={linePath(s)}
            stroke={s.color}
            strokeWidth={1.75}
            fill="none"
            strokeDasharray={s.dashed ? "4,3" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {hoverIdx !== null && hoverX !== null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--foreground)"
            strokeWidth={1}
            strokeDasharray="2,3"
            opacity={0.5}
          />
        )}

        {hoverIdx !== null &&
          series.map((s) => {
            const pt = s.data[hoverIdx];
            if (!pt || pt.y === null || !Number.isFinite(pt.y)) return null;
            return (
              <circle
                key={`dot-${s.id}`}
                cx={xAt(hoverIdx)}
                cy={yAt(pt.y)}
                r={3.5}
                fill="var(--background)"
                stroke={s.color}
                strokeWidth={1.5}
              />
            );
          })}
      </svg>

      {hoverIdx !== null && tooltip.length > 0 && (
        <div
          className="pointer-events-none absolute bg-white border hairline-strong px-3 py-2 text-[12px] shadow-sm"
          style={{
            left: Math.min(
              Math.max((hoverX ?? 0) + 12, 0),
              width - 220,
            ),
            top: PAD.top,
            minWidth: 180,
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] mb-1.5 num">
            {xLabels[hoverIdx]}
          </div>
          {tooltip.map((r) => (
            <div
              key={r.id}
              className="flex items-baseline justify-between gap-4 py-0.5"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2"
                  style={{ background: r.color }}
                />
                <span className="text-[12px]">{r.name}</span>
              </span>
              <span className="num text-[12px]">
                {yFormat(r.value as number)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
