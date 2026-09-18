import { cn } from "@/lib/utils"
import { choiceGlyph } from "@/lib/games"

/**
 * Reveals both hands. Choices are hidden (commit-reveal) until both players
 * lock in; here we show the settled picks and highlight the winning hand.
 */
export function RpsReveal({
  creatorChoice,
  opponentChoice,
  winningChoice,
  animating,
}: {
  creatorChoice: string
  opponentChoice: string
  winningChoice: string | null
  animating: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Hand
        glyph={animating ? "✊" : choiceGlyph("rps", creatorChoice)}
        label="Creator"
        won={!animating && winningChoice === creatorChoice && creatorChoice !== opponentChoice}
        animating={animating}
        side="left"
      />
      <span className="text-lg font-bold text-muted-foreground">VS</span>
      <Hand
        glyph={animating ? "✊" : choiceGlyph("rps", opponentChoice)}
        label="Opponent"
        won={!animating && winningChoice === opponentChoice && creatorChoice !== opponentChoice}
        animating={animating}
        side="right"
      />
    </div>
  )
}

function Hand({
  glyph,
  label,
  won,
  animating,
  side,
}: {
  glyph: string
  label: string
  won: boolean
  animating: boolean
  side: "left" | "right"
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-5xl transition",
          won ? "border-success bg-success/15" : "border-border bg-card",
          animating && (side === "left" ? "animate-dice-shake" : "animate-dice-shake"),
        )}
        style={side === "right" ? { transform: "scaleX(-1)" } : undefined}
      >
        <span style={side === "right" ? { transform: "scaleX(-1)" } : undefined}>{glyph}</span>
      </div>
      <span className={cn("text-xs font-semibold", won ? "text-success" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  )
}
