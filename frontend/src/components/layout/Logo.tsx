import { cn } from "@/lib/utils"

/** NimWager mark — two overlapping coins forming a wager/vs motif. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn(className)} aria-hidden fill="none">
      <defs>
        <linearGradient id="nw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(42 96% 62%)" />
          <stop offset="100%" stopColor="hsl(32 94% 52%)" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="20" r="12" fill="url(#nw-gold)" />
      <circle cx="25" cy="20" r="12" fill="hsl(205 100% 56%)" fillOpacity="0.85" />
      <path
        d="M20 12.5a12 12 0 0 1 0 15 12 12 0 0 1 0-15Z"
        fill="hsl(222 44% 5%)"
        fillOpacity="0.35"
      />
      <text
        x="15"
        y="24"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="hsl(222 44% 7%)"
      >
        N
      </text>
    </svg>
  )
}
