type Props = { ticker: string; size?: number; title?: string };

export function Logo({ ticker, size = 22, title }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    role: "img",
    "aria-label": title ?? ticker,
  } as const;

  switch (ticker) {
    case "AMZN":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10.5" fill="#111" />
          <path
            d="M5 14 Q12 21 19 14"
            stroke="#FF9900"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M17.5 12.3 L19 14 L17.5 15.7"
            stroke="#FF9900"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "GOOG":
      return (
        <svg {...common}>
          <path
            d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
            fill="#4285F4"
          />
          <path
            d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.597-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
            fill="#34A853"
          />
          <path
            d="M6.403 13.9A6.013 6.013 0 0 1 6.086 12c0-.66.114-1.3.317-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 3.022 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.34 2.59C7.19 7.737 9.395 5.977 12 5.977z"
            fill="#EA4335"
          />
        </svg>
      );

    case "MSFT":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="9" height="9" fill="#F25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      );

    case "NVDA":
      return (
        <svg {...common}>
          <rect x="1" y="1" width="22" height="22" fill="#76B900" />
          <path
            d="M7.5 7 L7.5 17 M7.5 7 L13.5 17 M13.5 7 L13.5 17"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="square"
            fill="none"
          />
          <path
            d="M16 9 Q19 12 16 15"
            stroke="#ffffff"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case "OAI":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="#ffffff" stroke="#111" strokeWidth="0.5" />
          <path
            fill="#111"
            d="M20.282 9.821a5.985 5.985 0 0 0-.516-4.911 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.182a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .511 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.989 5.989 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.748-7.073zm-9.022 12.608a4.476 4.476 0 0 1-2.876-1.041l.142-.08 4.778-2.758a.795.795 0 0 0 .393-.682v-6.737l2.02 1.169a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.494zm-9.66-4.125a4.471 4.471 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .781 0l5.843-3.368v2.332a.08.08 0 0 1-.034.062L9.74 19.95a4.499 4.499 0 0 1-6.141-1.646zM2.341 7.896a4.485 4.485 0 0 1 2.365-1.973V11.6a.766.766 0 0 0 .388.677l5.814 3.354-2.02 1.169a.076.076 0 0 1-.071 0L3.987 13.83A4.504 4.504 0 0 1 2.341 7.872zm16.596 3.856L13.104 8.364l2.015-1.164a.076.076 0 0 1 .071 0l4.83 2.792a4.494 4.494 0 0 1-.676 8.104v-5.677a.79.79 0 0 0-.407-.667zm2.011-3.024l-.142-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.062l4.83-2.786a4.499 4.499 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.074a4.499 4.499 0 0 1 7.376-3.454l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.098-2.365l2.602-1.5 2.607 1.5v2.999l-2.598 1.5-2.607-1.5Z"
          />
        </svg>
      );

    case "ANTH":
      return (
        <svg {...common}>
          <rect x="1" y="1" width="22" height="22" fill="#D97757" />
          <path
            fill="#ffffff"
            d="M8.7 5 L4.5 19 L7.2 19 L8.0 16 L13.0 16 L13.8 19 L16.5 19 L12.3 5 L8.7 5 Z M8.7 13.6 L10.5 8 L12.3 13.6 L8.7 13.6 Z"
          />
        </svg>
      );

    default:
      return (
        <svg {...common}>
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
}
