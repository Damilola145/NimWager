import type { GameMeta } from "@/lib/games"
import { cn } from "@/lib/utils"

interface ChoicePickerProps {
  meta: GameMeta
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function ChoicePicker({ meta, value, onChange, disabled }: ChoicePickerProps) {
  const isDice = meta.kind === "dice"
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">{meta.choicePrompt}</p>
      <div className={cn("grid gap-2", isDice ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2", meta.kind === "rps" && "grid-cols-3")}>
        {meta.choices.map((c) => {
          const active = value === c.value
          return (
            <button
              key={c.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(c.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted",
              )}
              aria-pressed={active}
            >
              <span className={cn("leading-none", isDice ? "text-2xl" : "text-xl")}>{c.glyph}</span>
              <span className="text-xs font-semibold">{c.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
