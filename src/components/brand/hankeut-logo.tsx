import { cn } from "@/lib/utils";

// 한끗차이 공식 로고 (reference/hankeut-logo.png 기준)
// 흰 글자 + 짙은 갈색 테두리, '끗'만 연노랑, 뒤쪽 타원 궤도와 4각 별 장식.
export const BRAND = {
  brown: "#5C4433",
  yellow: "#F0D98C",
  orbit: "#E9DBA0",
  star: "#EAD79A",
} as const;

export function HankeutLogo({
  className,
  title = "한끗차이",
  compact = false,
}: {
  className?: string;
  title?: string;
  /** 헤더처럼 작은 곳: 아래 궤도를 빼고 테두리를 굵게 */
  compact?: boolean;
}) {
  const stroke = compact ? 11 : 6;
  return (
    <svg
      viewBox={compact ? "150 150 820 300" : "150 55 790 545"}
      role="img"
      aria-label={title}
      className={cn("select-none", className)}
    >
      <title>{title}</title>
      {/* 타원 궤도: 글자 뒤에서 위·아래 두 조각만 보여요 */}
      {!compact && (
      <g fill="none" stroke={BRAND.orbit} strokeWidth={3.5} strokeLinecap="round">
        <path d="M368 203 C 470 112, 705 85, 720 200 C 723 225, 721 245, 716 262" />
        <path d="M180 448 C 155 560, 290 625, 490 487" />
      </g>
      )}

      {/* 4각 반짝이 별 */}
      <path
        d="M802 66 Q 810 126 853 138 Q 810 150 802 210 Q 794 150 751 138 Q 794 126 802 66 Z"
        transform={compact ? "translate(95 120) scale(0.8)" : undefined}
        fill={BRAND.star}
        stroke={BRAND.brown}
        strokeWidth={compact ? 8 : 3.5}
        strokeLinejoin="round"
      />

      {/* 글자: 테두리를 먼저 그리고(paint-order) 위에 채움 */}
      <text
        x="160"
        y="430"
        textLength="755"
        lengthAdjust="spacingAndGlyphs"
        fontSize="196"
        fill="#FFFFFF"
        stroke={BRAND.brown}
        strokeWidth={stroke}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: "var(--font-logo), sans-serif" }}
      >
        한<tspan fill={BRAND.yellow}>끗</tspan>차이
      </text>
    </svg>
  );
}

/** 작은 곳(파비콘 느낌)용 별 마크 */
export function HankeutStar({ className }: { className?: string }) {
  return (
    <svg viewBox="745 60 115 156" aria-hidden className={className}>
      <path
        d="M802 66 Q 810 126 853 138 Q 810 150 802 210 Q 794 150 751 138 Q 794 126 802 66 Z"
        fill={BRAND.star}
        stroke={BRAND.brown}
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </svg>
  );
}
