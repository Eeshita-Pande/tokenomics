"use client";

import type { BarDatum } from "@/components/chart/BarChart";
import { Logo } from "@/components/Logo";

type Props = {
  data: BarDatum[];
  groups: string[];
  serieses: { id: string; color: string }[];
  height?: number;
  width?: number;
  yFormat?: (v: number) => string;
};

const PAD = { top: 16, right: 8, bottom: 22, left: 38 };
const LOGO_SIZE = 11;

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
  const step = niceStep((hi - lo) / 3);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  return [lo, hi];
}

function defaultFmt(v: number) {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(0)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  if (abs === 0) return "$0";
  return `${sign}$${abs.toFixed(0)}`;
}

export function SnapshotChart({
  data,
  groups,
  serieses,
  height = 150,
  width = 520,
  yFormat = defaultFmt,
}: Props) {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const values = data
    .filter((d) => d.value !== null && Number.isFinite(d.value))
    .map((d) => d.value as number);
  const markerDomainValues = data
    .filter((d) => {
      const hint = d.markerDomainMax ?? d.marker;
      return hint !== null && hint !== undefined && Number.isFinite(hint);
    })
    .map((d) => (d.markerDomainMax ?? d.marker) as number);
  const [yMin, yMax] = niceDomain([...values, ...markerDomainValues]);

  const groupW = innerW / groups.length;
  const groupPadding = 8;
  const barAreaW = groupW - groupPadding;
  const barW = Math.max(barAreaW / serieses.length - 1, 3);

  const xGroupStart = (gi: number) => PAD.left + gi * groupW + groupPadding / 2;
  const yAt = (v: number) =>
    PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const zeroY = yAt(0);

  const yTicks: number[] = [];
  const step = niceStep((yMax - yMin) / 3);
  for (let v = Math.ceil(yMin / step) * step; v <= yMax + step * 0.001; v += step) {
    yTicks.push(v);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="var(--hairline)"
            strokeDasharray={t === 0 ? "0" : "2,3"}
          />
          <text
            x={PAD.left - 4}
            y={yAt(t)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="var(--font-roboto-mono), monospace"
            fill="var(--muted)"
          >
            {yFormat(t)}
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

      {yMin < 0 && yMax > 0 && (
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--foreground)"
          strokeWidth={0.75}
        />
      )}

      {groups.map((g, gi) => (
        <text
          key={g}
          x={xGroupStart(gi) + (groupW - groupPadding) / 2}
          y={PAD.top + innerH + 14}
          textAnchor="middle"
          fontSize={10}
          fontFamily="var(--font-roboto-mono), monospace"
          fill="var(--muted)"
        >
          {g}
        </text>
      ))}

      {groups.map((g, gi) =>
        serieses.map((s, si) => {
          const d = data.find((dx) => dx.group === g && dx.series === s.id);
          const x = xGroupStart(gi) + si * (barW + 1);
          const value = d?.value ?? null;
          const marker =
            d?.marker !== null &&
            d?.marker !== undefined &&
            Number.isFinite(d?.marker)
              ? (d.marker as number)
              : null;
          if (
            (value === null || !Number.isFinite(value)) &&
            marker === null
          ) {
            return null;
          }
          const drawnValue = value !== null && Number.isFinite(value) ? value : 0;
          const y = drawnValue >= 0 ? yAt(drawnValue) : zeroY;
          const h = Math.abs(yAt(drawnValue) - zeroY);
          const cx = x + barW / 2;
          const half = Math.max(Math.min(barW * 0.85, 4), 2.5);
          return (
            <g key={`${g}-${s.id}`}>
              {value !== null && Number.isFinite(value) && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 0.5)}
                  fill={s.color}
                  opacity={0.92}
                />
              )}
              {marker !== null && marker > 0 && (
                <polygon
                  points={`${cx},${yAt(marker) - half} ${cx + half},${yAt(marker)} ${cx},${yAt(marker) + half} ${cx - half},${yAt(marker)}`}
                  fill="var(--accent)"
                  stroke="#ffffff"
                  strokeWidth={0.6}
                />
              )}
            </g>
          );
        }),
      )}

      {(() => {
        const lastGi = groups.length - 1;
        if (lastGi < 0) return null;
        const g = groups[lastGi];
        return serieses.map((s, si) => {
          const d = data.find((dx) => dx.group === g && dx.series === s.id);
          const x = xGroupStart(lastGi) + si * (barW + 1);
          const value = d?.value ?? null;
          const barCenterX = x + barW / 2;
          const topY =
            value !== null && Number.isFinite(value) && value > 0
              ? yAt(value)
              : zeroY;
          const logoY = Math.max(topY - LOGO_SIZE - 1, 0);
          return (
            <foreignObject
              key={`logo-${s.id}`}
              x={barCenterX - LOGO_SIZE / 2}
              y={logoY}
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              pointerEvents="none"
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Logo ticker={s.id} size={LOGO_SIZE} />
              </div>
            </foreignObject>
          );
        });
      })()}
    </svg>
  );
}
