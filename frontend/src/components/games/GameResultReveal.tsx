import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Trophy, Frown, Minus, ExternalLink, Coins, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { CoinFlipReveal } from "./reveals/CoinFlipReveal"
import { DiceReveal } from "./reveals/DiceReveal"
import { RpsReveal } from "./reveals/RpsReveal"
import { gameName } from "@/lib/games"
import { formatNim, truncateAddress, explorerTxUrl } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { GameDetail } from "@/types"

const DURATIONS: Record<string, number> = { coinflip: 2100, dice: 1300, rps: 1500 }

export function GameResultReveal({
  detail,
  viewerAddress,
}: {
  detail: GameDetail
  viewerAddress?: string
}) {
  const [animating, setAnimating] = useState(true)
  const result = detail.result!

  useEffect(() => {
    setAnimating(true)
    const t = setTimeout(() => setAnimating(false), DURATIONS[detail.game] ?? 1500)
    return () => clearTimeout(t)
  }, [detail.gameId, detail.game])

  const isDraw = !result.winner
  const viewerWon = !!viewerAddress && result.winner === viewerAddress
  const viewerLost = !!viewerAddress && result.loser === viewerAddress
  const winningChoice =
    result.winner === detail.creatorAddress
      ? detail.creatorChoice ?? null
      : result.winner === detail.opponentAddress
        ? detail.opponentChoice ?? null
        : null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Animation stage */}
      <div className="border-b border-border bg-gradient-to-b from-muted/30 to-transparent px-6 pb-4 pt-8">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          {gameName(detail.game)}
        </p>
        {detail.game === "coinflip" && (
          <CoinFlipReveal key={detail.gameId} outcome={result.outcome} animating={animating} />
        )}
        {detail.game === "dice" && (
          <DiceReveal key={detail.gameId} outcome={result.outcome} animating={animating} />
        )}
        {detail.game === "rps" && (
          <RpsReveal
            key={detail.gameId}
            creatorChoice={detail.creatorChoice ?? ""}
            opponentChoice={detail.opponentChoice ?? ""}
            winningChoice={winningChoice}
            animating={animating}
          />
        )}
        <p
          className={cn(
            "mt-2 text-center text-sm font-medium text-muted-foreground transition-opacity",
            animating ? "opacity-40" : "opacity-100",
          )}
        >
          {animating ? "Resolving on-chain…" : `Outcome: ${result.outcome}`}
        </p>
      </div>

      {/* Summary */}
      <div className={cn("p-6 transition-opacity duration-500", animating ? "opacity-30" : "opacity-100")}>
        <div className="flex flex-col items-center text-center">
          {isDraw ? (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Minus className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">Draw — stakes refunded</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Both players get their {formatNim(detail.stakeAmount)} back.
              </p>
            </>
          ) : viewerWon ? (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success glow-primary">
                <Trophy className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-success">You won!</h2>
              <p className="mt-1 text-sm text-muted-foreground">The pool is yours.</p>
            </>
          ) : viewerLost ? (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
                <Frown className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-danger">You lost</h2>
              <p className="mt-1 text-sm text-muted-foreground">Better luck on the next round.</p>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Trophy className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">
                {truncateAddress(result.winner, "nimiq")} wins
              </h2>
            </>
          )}

          {!isDraw && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Payout</span>
              <span className="font-bold text-primary">{formatNim(result.payoutAmount)}</span>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <PlayerCell label="Creator" address={detail.creatorAddress} won={result.winner === detail.creatorAddress} />
          <PlayerCell
            label="Opponent"
            address={detail.opponentAddress ?? ""}
            won={result.winner === detail.opponentAddress}
          />
        </div>

        {/* Tx + actions */}
        {result.payoutTxHash && (
          <a
            href={explorerTxUrl(result.payoutTxHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-primary/40"
          >
            <span className="text-muted-foreground">Payout transaction</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-primary">
              {result.payoutTxHash.slice(0, 10)}… <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link to="/lobby" className="flex-1">
            <Button className="w-full gap-2">
              <RotateCcw className="h-4 w-4" /> Play again
            </Button>
          </Link>
          {viewerAddress && (
            <Link to={`/profile/${encodeURIComponent(viewerAddress)}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View my history
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerCell({ label, address, won }: { label: string; address: string; won: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        won ? "border-success/40 bg-success/10" : "border-border bg-muted/20",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs font-semibold">
        {address ? truncateAddress(address, "nimiq") : "—"}
      </p>
      {won && <p className="mt-1 text-xs font-semibold text-success">Winner</p>}
    </div>
  )
}
