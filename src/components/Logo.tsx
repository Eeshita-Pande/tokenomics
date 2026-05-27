type Props = { ticker: string; size?: number; title?: string };

const LOGOS: Record<string, string> = {
  AMZN: "/logos/Amazon2.png",
  GOOG: "/logos/Google2.png",
  MSFT: "/logos/Microsoft.png",
  NVDA: "/logos/Nvidia.png",
  OAI: "/logos/openai.svg",
  ANTH: "/logos/anthropic.svg",
};

export function Logo({ ticker, size = 22, title }: Props) {
  const label = title ?? ticker;
  const src = LOGOS[ticker];

  if (!src) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={label}
      >
        <rect x="1" y="1" width="22" height="22" fill="#111" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontFamily="var(--font-roboto), system-ui, sans-serif"
          fontWeight={600}
          fontSize="10"
          fill="#fff"
        >
          {ticker}
        </text>
      </svg>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
