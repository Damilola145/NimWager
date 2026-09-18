import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { GameStatus } from "@/types"

type Tone = "gold" | "blue" | "success" | "danger" | "muted"

const tones: Record<Tone, string> = {
  gold: "bg-primary/15 text-primary border-primary/30",
  blue: "bg-accent/15 text-accent border-accent/30",
  success: "bg-success/15 text-success border-success/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  muted: "bg-muted text-muted-foreground border-border",
}

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusMap: Record<GameStatus, { tone: Tone; label: string }> = {
  waiting_for_opponent: { tone: "gold", label: "Waiting" },
  settled: { tone: "success", label: "Settled" },
  expired: { tone: "danger", label: "Expired" },
  cancelled: { tone: "muted", label: "Cancelled" },
  error: { tone: "danger", label: "Error" },
}

export function StatusBadge({ status }: { status: GameStatus }) {
  const s = statusMap[status] ?? statusMap.error
  return <Badge tone={s.tone}>{s.label}</Badge>
}
