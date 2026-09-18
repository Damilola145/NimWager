import { cn } from "@/lib/utils"

/** Landed-face coin. The flip animation runs via the parent's key remount. */
export function CoinFlipReveal({ outcome, animating }: { outcome: string; animating: boolean }) {
  const isHeads = outcome === "heads"
  return (
    <div className="perspective flex h-40 items-center justify-center">
      <div
        className={cn(
          "relative h-32 w-32 rounded-full preserve-3d",
          animating ? "animate-coin-flip" : isHeads ? "" : "rotate-y-180",
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Heads */}
        <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(32_94%_48%)] text-3xl font-bold text-primary-foreground shadow-lg">
          H
        </div>
        {/* Tails */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-[hsl(205_100%_42%)] text-3xl font-bold text-accent-foreground shadow-lg">
          T
        </div>
      </div>
    </div>
  )
}
