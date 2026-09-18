import { cn } from "@/lib/utils"

const FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]

export function DiceReveal({ outcome, animating }: { outcome: string; animating: boolean }) {
  const n = parseInt(outcome, 10)
  const face = FACES[n] ?? "⚀"
  return (
    <div className="flex h-40 items-center justify-center">
      <div
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-primary/40 bg-card text-7xl leading-none text-primary shadow-lg",
          animating && "animate-dice-shake",
        )}
      >
        {animating ? "⚄" : face}
      </div>
    </div>
  )
}
