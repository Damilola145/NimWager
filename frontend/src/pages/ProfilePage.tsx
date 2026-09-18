import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { Wallet, TrendingUp, TrendingDown, Swords, Trophy, Loader2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { GameIcon } from "@/components/games/GameIcon"
import { usePlayerHistory } from "@/hooks/useApi"
import { useWallet } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { gameName } from "@/lib/games"
import { formatNim, truncateAddress, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { HistoryEntry } from "@/types"

export function ProfilePage() {
  const params = useParams()
  const { session } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)

  const address = params.address ? decodeURIComponent(params.address) : session?.address
  const isSelf = address === session?.address
  const { data, isLoading } = usePlayerHistory(address)

  const stats = useMemo(() => summarize(data?.games ?? []), [data])

  if (!address) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Wallet className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Connect to view your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your win/loss record and game history live here once you connect a wallet.
        </p>
        <Button className="mt-5" onClick={openConnectModal}>
          Connect wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Identity header */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(32_94%_50%)] text-xl font-bold text-primary-foreground">
            {address.replace(/\s/g, "").slice(2, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-bold">{truncateAddress(address, "nimiq")}</h1>
              {isSelf && <Badge tone="gold">You</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{stats.total} games played</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Win rate</p>
            <p className="text-lg font-bold text-primary">{stats.winRate}%</p>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Wins" value={String(stats.wins)} tone="success" />
        <StatCard icon={<Swords className="h-4 w-4" />} label="Losses" value={String(stats.losses)} tone="danger" />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="NIM won"
          value={formatNim(stats.totalWon)}
          tone="success"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="NIM lost"
          value={formatNim(stats.totalLost)}
          tone="danger"
        />
      </div>

      {/* Net */}
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">Net profit / loss</p>
          <p className={cn("text-2xl font-bold", stats.net >= 0 ? "text-success" : "text-danger")}>
            {stats.net >= 0 ? "+" : "−"}
            {formatNim(Math.abs(stats.net))}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{stats.wins}W · {stats.losses}L · {stats.draws}D</p>
        </div>
      </div>

      {/* History */}
      <h2 className="mb-4 text-lg font-bold">Game history</h2>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (data?.games.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
          <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">No games yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Played wagers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data!.games.map((g) => (
            <HistoryRow key={g.gameId} entry={g} />
          ))}
        </div>
      )}
    </div>
  )
}

function summarize(games: HistoryEntry[]) {
  const wins = games.filter((g) => g.result === "win").length
  const losses = games.filter((g) => g.result === "loss").length
  const draws = games.filter((g) => g.result === "draw").length
  const total = games.length
  const totalWon = games.filter((g) => g.payoutAmount > 0).reduce((s, g) => s + g.payoutAmount, 0)
  const totalLost = games.filter((g) => g.payoutAmount < 0).reduce((s, g) => s + Math.abs(g.payoutAmount), 0)
  const net = totalWon - totalLost
  const decided = wins + losses
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : 0
  return { wins, losses, draws, total, totalWon, totalLost, net, winRate }
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "success" | "danger"
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn("mb-2 inline-flex items-center gap-1.5 text-xs", tone === "success" ? "text-success" : "text-danger")}>
        {icon} {label}
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const won = entry.result === "win"
  const draw = entry.result === "draw"
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        <GameIcon kind={entry.game} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{gameName(entry.game)}</p>
        <p className="truncate text-xs text-muted-foreground">
          vs {truncateAddress(entry.opponent, "nimiq")} · {timeAgo(entry.settledAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <Badge tone={draw ? "muted" : won ? "success" : "danger"}>
          {draw ? "Draw" : won ? "Win" : "Loss"}
        </Badge>
        <p
          className={cn(
            "mt-1 text-sm font-bold",
            entry.payoutAmount > 0 ? "text-success" : entry.payoutAmount < 0 ? "text-danger" : "text-muted-foreground",
          )}
        >
          {entry.payoutAmount > 0 ? "+" : entry.payoutAmount < 0 ? "−" : ""}
          {formatNim(Math.abs(entry.payoutAmount))}
        </p>
      </div>
    </div>
  )
}
