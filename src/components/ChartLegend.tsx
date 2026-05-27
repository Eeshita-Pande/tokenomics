export type LegendItem = {
  shape: "solid" | "dashed" | "diamond";
  label: string;
};

export function ChartLegend({ items }: { items: LegendItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[color:var(--muted)]">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <LegendSwatch shape={item.shape} index={i} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function LegendSwatch({
  shape,
  index,
}: {
  shape: LegendItem["shape"];
  index: number;
}) {
  if (shape === "diamond") {
    return (
      <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
        <polygon
          points="5,0.5 9.5,5 5,9.5 0.5,5"
          fill="var(--accent)"
          stroke="#ffffff"
          strokeWidth="0.6"
        />
      </svg>
    );
  }
  if (shape === "dashed") {
    const patternId = `legend-hatch-${index}`;
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden>
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="16" height="11" fill="var(--foreground)" />
        <rect x="0" y="0" width="16" height="11" fill={`url(#${patternId})`} />
      </svg>
    );
  }
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden>
      <rect x="0" y="0" width="16" height="11" fill="var(--foreground)" />
    </svg>
  );
}
