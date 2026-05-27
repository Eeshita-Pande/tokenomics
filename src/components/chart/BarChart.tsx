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
  marker?: number | null;
  markerLabel?: string;
  markerMethodology?: string;
  markerSources?: AiSource[];
  // Stable y-domain hint: the largest the marker can be across the slider's
  // full range. Used for axis sizing only, not drawn. Lets the y-axis stay
  // pinned as the user moves the slider.
  markerDomainMax?: number | null;
};

type Props = {
  data: BarDatum[];
  groups: string[];
  serieses: { id: string; color: string; label: string }[];
  yFormat: (v: number) => string;
  height?: number;
};

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
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const innerW = Math.max(width - PAD.left - PAD.right, 100);
  const innerH = height - PAD.top - PAD.bottom;

  const values = data
    .filter((d) => d.value !== null && Number.isFinite(d.value))
    .map((d) => d.value as number);
  // For y-domain, prefer the stable hint (markerDomainMax = marker at slider
  // minimum) so axis doesn't rescale as the slider moves. Fall back to the
  // live marker if no hint is provided.
  const markerDomainValues = data
    .filter((d) => {
      const hint = d.markerDomainMax ?? d.marker;
      return hint !== null && hint !== undefined && Number.isFinite(hint);
    })
    .map((d) => (d.markerDomainMax ?? d.marker) as number);
  const [yMin, yMax] = niceDomain([...values, ...markerDomainValues]);

  const groupW = innerW / groups.length;
  const groupPadding = 14;
  const barAreaW = groupW - groupPadding;
  const barW = Math.max(barAreaW / serieses.length - 2, 6);
  const barPitch = barW + 2;
  const logoSize = Math.min(Math.max(barPitch - 1, 10), 22);
  const outsideFontSize = barPitch >= 22 ? 9 : barPitch >= 14 ? 8 : 7;

  const xGroupStart = (gi: number) => PAD.left + gi * groupW + groupPadding / 2;
  const yAt = (v: number) =>
    PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const yTicks: number[] = [];
  const step = niceStep((yMax - yMin) / 5);
  for (let v = Math.ceil(yMin / step) * step; v <= yMax + step * 0.001; v += step) {
    yTicks.push(v);
  }

  const zeroY = yAt(0);

  const staggerStep = logoSize + outsideFontSize + 4;
  const staggerByCell = new Map<string, number>();
  for (const g of groups) {
    let prevSign: "pos" | "neg" | null = null;
    let prevRow = 0;
    for (const s of serieses) {
      const d = data.find((dx) => dx.group === g && dx.series === s.id);
      const v = d?.value ?? null;
      if (v === null || !Number.isFinite(v) || !d) {
        prevSign = null;
        continue;
      }
      const h = Math.abs(yAt(v) - zeroY);
      const fitsInside = h >= 18 && barW >= 18;
      if (fitsInside) {
        prevSign = null;
        continue;
      }
      const sign: "pos" | "neg" = v < 0 ? "neg" : "pos";
      let row = 0;
      if (prevSign === sign) row = 1 - prevRow;
      staggerByCell.set(`${g}|${s.id}`, row);
      prevSign = sign;
      prevRow = row;
    }
  }

  const handleEnter = (
    e: React.MouseEvent<SVGRectElement | SVGGElement>,
    d: BarDatum,
  ) => {
    cancelDismiss();
    setHover(d);
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (!wrap) return;
    setHoverPos({ x: e.clientX - wrap.left, y: e.clientY - wrap.top });
  };

  const handleLeave = () => {
    scheduleDismiss();
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
              fill={t < 0 ? "var(--negative)" : "var(--muted)"}
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
                    y={zeroY - logoSize - 4}
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
            const staggerRow = staggerByCell.get(`${g}|${s.id}`) ?? 0;
            const staggerOffset = staggerRow * staggerStep;
            const logoY =
              value >= 0
                ? Math.max(
                    y - logoSize - 4 - staggerOffset,
                    PAD.top - logoSize - 2,
                  )
                : y + h + 4 + staggerOffset;
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
                {d.marker !== null &&
                  d.marker !== undefined &&
                  Number.isFinite(d.marker) &&
                  (d.marker as number) > 0 &&
                  (() => {
                    const mY = yAt(d.marker as number);
                    const cx = x + barW / 2;
                    const half = Math.max(Math.min(barW * 0.55, 7), 4);
                    return (
                      <g
                        pointerEvents="none"
                        opacity={isHover ? 1 : hover ? 0.5 : 1}
                      >
                        <polygon
                          points={`${cx},${mY - half} ${cx + half},${mY} ${cx},${mY + half} ${cx - half},${mY}`}
                          fill="var(--accent)"
                          stroke="#ffffff"
                          strokeWidth={1.25}
                          strokeLinejoin="round"
                        />
                        <text
                          x={cx + half + 3}
                          y={mY}
                          textAnchor="start"
                          dominantBaseline="middle"
                          fontSize={9}
                          fontFamily="var(--font-roboto-mono), monospace"
                          fontWeight={500}
                          fill="var(--accent)"
                        >
                          {barLabel(d.marker as number)}
                        </text>
                      </g>
                    );
                  })()}
                {(() => {
                  const fitsInside = h >= 18 && barW >= 18;
                  if (fitsInside) {
                    return (
                      <text
                        x={barCenterX}
                        y={y + 10}
                        textAnchor="middle"
                        fontSize={8}
                        fontFamily="var(--font-roboto-mono), monospace"
                        fontWeight={500}
                        fill="#ffffff"
                        pointerEvents="none"
                        opacity={hover && !isHover ? 0.4 : 1}
                      >
                        {barLabel(value)}
                      </text>
                    );
                  }
                  const outsideY =
                    value >= 0 ? logoY - 3 : logoY + logoSize + 3;
                  const outsideBaseline =
                    value >= 0 ? "auto" : "hanging";
                  return (
                    <text
                      x={barCenterX}
                      y={outsideY}
                      textAnchor="middle"
                      dominantBaseline={outsideBaseline}
                      fontSize={outsideFontSize}
                      fontFamily="var(--font-roboto-mono), monospace"
                      fontWeight={500}
                      fill={
                        value < 0 ? "var(--negative)" : "var(--foreground)"
                      }
                      pointerEvents="none"
                      opacity={hover && !isHover ? 0.4 : 1}
                    >
                      {barLabel(value)}
                    </text>
                  );
                })()}
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
          className="absolute bg-white border hairline-strong shadow-md p-3 text-[12px] leading-[1.5]"
          onMouseEnter={cancelDismiss}
          onMouseLeave={scheduleDismiss}
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
            <span
              style={
                hover.value !== null && hover.value < 0
                  ? { color: "var(--negative)" }
                  : undefined
              }
            >
              {hover.value !== null ? yFormat(hover.value) : "—"}
            </span>
            {hover.low !== null && hover.high !== null && (
              <span className="text-[12px] text-[color:var(--muted)] ml-2">
                (
                <span
                  style={
                    hover.low < 0 ? { color: "var(--negative)" } : undefined
                  }
                >
                  {yFormat(hover.low)}
                </span>
                {" – "}
                <span
                  style={
                    hover.high < 0 ? { color: "var(--negative)" } : undefined
                  }
                >
                  {yFormat(hover.high)}
                </span>
                )
              </span>
            )}
          </div>
          {hover.marker !== null &&
            hover.marker !== undefined &&
            Number.isFinite(hover.marker) && (
              <div className="mt-2 pt-2 border-t hairline">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)] inline-flex items-center gap-1.5">
                    <svg
                      aria-hidden
                      width={10}
                      height={10}
                      viewBox="0 0 10 10"
                      style={{ flexShrink: 0 }}
                    >
                      <polygon
                        points="5,0.5 9.5,5 5,9.5 0.5,5"
                        fill="var(--accent)"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    </svg>
                    {hover.markerLabel ?? "Marker"}
                  </span>
                  <span className="num text-[13px] font-medium">
                    {yFormat(hover.marker)}
                  </span>
                </div>
                {hover.markerMethodology && (
                  <div className="mt-1.5 text-[11px] text-[color:var(--muted)] leading-[1.45]">
                    {hover.markerMethodology}
                  </div>
                )}
                {hover.markerSources && hover.markerSources.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {hover.markerSources.map((s, i) => (
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
                )}
              </div>
            )}
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
  );
}
