import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { GameIcon } from "./GameIcon"
import { GAMES } from "@/lib/games"
import { formatNim, truncateAddress, timeAgo } from "@/lib/format"
import type { OpenWager } from "@/types"

export function OpenWagerCard({
  wager,
  onJoin,
  isOwn,
}: {
  wager: OpenWager
  onJoin: (w: OpenWager) => void
  isOwn: boolean
}) {
  const meta = GAMES[wager.game]
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 sm:gap-4 sm:p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          meta.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
        }`}
      >
        <GameIcon kind={wager.game} className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{meta.name}</span>
          {isOwn && <Badge tone="gold">You</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {truncateAddress(wager.creatorAddress, "nimiq")} · {timeAgo(wager.createdAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">Stake</p>
        <p className="text-sm font-bold text-primary">{formatNim(wager.stakeAmount)}</p>
      </div>

      <Button
        size="sm"
        variant={isOwn ? "outline" : "primary"}
        disabled={isOwn}
        onClick={() => onJoin(wager)}
        className="shrink-0"
      >
        {isOwn ? "Open" : "Join"}
      </Button>
    </div>
  )
}
