"use client";

import { useEffect, useRef, useState } from "react";
import type { AiSource } from "@/lib/ai-economics";
import { Logo } from "@/components/Logo";

export type BarDatum = {
  group: string;
  series: string;
  label: string;
  color: string;
  value: number | null;
  low: number | null;
  high: number | null;
  methodology: string;
  sources: AiSource[];
  note: string | null;
};

type Props = {
  data: BarDatum[];
  groups: string[];
  serieses: { id: string; color: string; label: string }[];
  yFormat: (v: number) => string;
  height?: number;
};

const PAD = { top: 44, right: 24, bottom: 56, left: 70 };

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

export function BarChart({
  data,
  groups,
  serieses,
  yFormat,
  height = 460,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1000);
  const [hover, setHover] = useState<BarDatum | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 1000));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(width - PAD.left - PAD.right, 100);
  const innerH = height - PAD.top - PAD.bottom;

  const values = data
    .filter((d) => d.value !== null && Number.isFinite(d.value))
    .map((d) => d.value as number);
  const [yMin, yMax] = niceDomain(values);

  const groupW = innerW / groups.length;
  const groupPadding = 14;
  const barAreaW = groupW - groupPadding;
  const barW = Math.max(barAreaW / serieses.length - 2, 6);
  const logoSize = Math.min(Math.max(barW + 4, 14), 22);

  const xGroupStart = (gi: number) => PAD.left + gi * groupW + groupPadding / 2;
  const yAt = (v: number) =>
    PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const yTicks: number[] = [];
  const step = niceStep((yMax - yMin) / 5);
  for (let v = Math.ceil(yMin / step) * step; v <= yMax + step * 0.001; v += step) {
    yTicks.push(v);
  }

  const zeroY = yAt(0);

  const handleEnter = (
    e: React.MouseEvent<SVGRectElement | SVGGElement>,
    d: BarDatum,
  ) => {
    setHover(d);
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (!wrap) return;
    setHoverPos({ x: e.clientX - wrap.left, y: e.clientY - wrap.top });
  };

  const handleLeave = () => {
    setHover(null);
    setHoverPos(null);
  };

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="var(--hairline-strong)"
        />
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + innerH}
          stroke="var(--hairline-strong)"
        />

        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--hairline)"
              strokeDasharray={t === 0 ? "0" : "2,4"}
            />
            <text
              x={PAD.left - 10}
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

        {yMin < 0 && yMax > 0 && (
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--foreground)"
            strokeWidth={1}
          />
        )}

        {groups.map((g, gi) => (
          <g key={g}>
            <text
              x={xGroupStart(gi) + (groupW - groupPadding) / 2}
              y={PAD.top + innerH + 22}
              textAnchor="middle"
              fontSize={12}
              fontFamily="var(--font-roboto-mono), monospace"
              fill="var(--foreground)"
              fontWeight={500}
            >
              {g}
            </text>
            {gi < groups.length - 1 && (
              <line
                x1={PAD.left + (gi + 1) * groupW}
                x2={PAD.left + (gi + 1) * groupW}
                y1={PAD.top + innerH}
                y2={PAD.top + innerH + 6}
                stroke="var(--hairline-strong)"
              />
            )}
          </g>
        ))}

        {groups.map((g, gi) =>
          serieses.map((s, si) => {
            const d = data.find((dx) => dx.group === g && dx.series === s.id);
            const x = xGroupStart(gi) + si * (barW + 2);
            const value = d?.value ?? null;
            const barCenterX = x + barW / 2;
            if (value === null || !Number.isFinite(value) || !d) {
              return (
                <g key={`${g}-${s.id}-empty`}>
                  <foreignObject
                    x={barCenterX - logoSize / 2}
                    y={PAD.top - logoSize + 2}
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
                        opacity: hover ? 0.18 : 0.35,
                      }}
                    >
                      <Logo ticker={s.id} size={logoSize} title={s.label} />
                    </div>
                  </foreignObject>
                  <line
                    x1={x + 1}
                    x2={x + barW - 1}
                    y1={zeroY + 4}
                    y2={zeroY + 4}
                    stroke="var(--hairline-strong)"
                    strokeDasharray="2,2"
                  />
                </g>
              );
            }
            const y = value >= 0 ? yAt(value) : zeroY;
            const h = Math.abs(yAt(value) - zeroY);
            const isHover = hover?.group === g && hover?.series === s.id;
            const logoY =
              value >= 0
                ? Math.max(y - logoSize - 4, PAD.top - logoSize - 2)
                : y + h + 4;
            return (
              <g
                key={`${g}-${s.id}`}
                onMouseEnter={(e) => handleEnter(e, d)}
                onMouseMove={(e) => {
                  const wrap = wrapRef.current?.getBoundingClientRect();
                  if (wrap)
                    setHoverPos({
                      x: e.clientX - wrap.left,
                      y: e.clientY - wrap.top,
                    });
                }}
                onMouseLeave={handleLeave}
                style={{ cursor: "help" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 1)}
                  fill={s.color}
                  opacity={isHover ? 1 : hover ? 0.32 : 0.92}
                />
                <foreignObject
                  x={barCenterX - logoSize / 2}
                  y={logoY}
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
                      opacity: hover && !isHover ? 0.35 : 1,
                    }}
                  >
                    <Logo ticker={s.id} size={logoSize} title={s.label} />
                  </div>
                </foreignObject>
              </g>
            );
          }),
        )}
      </svg>

      {hover && hoverPos && (
        <div
          className="pointer-events-none absolute bg-white border hairline-strong shadow-md p-3 text-[12px] leading-[1.5]"
          style={{
            left: Math.min(hoverPos.x + 14, width - 320),
            top: Math.min(hoverPos.y + 8, height - 60),
            maxWidth: 320,
            minWidth: 260,
            zIndex: 10,
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {hover.label}
          </div>
          <div className="num text-[18px] mt-0.5 font-medium">
            {hover.value !== null ? yFormat(hover.value) : "—"}
            {hover.low !== null && hover.high !== null && (
              <span className="text-[12px] text-[color:var(--muted)] ml-2">
                ({yFormat(hover.low)} – {yFormat(hover.high)})
              </span>
            )}
          </div>
          <div className="mt-2 text-[color:var(--foreground)]">
            {hover.methodology}
          </div>
          {hover.note && (
            <div className="mt-2 text-[11px] text-[color:var(--muted)] italic">
              {hover.note}
            </div>
          )}
          {hover.sources.length > 0 && (
            <div className="mt-2 pt-2 border-t hairline">
              <ul className="space-y-0.5">
                {hover.sources.map((s, i) => (
                  <li key={i} className="text-[11px]">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[color:var(--accent)] underline pointer-events-auto"
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
  );
}
