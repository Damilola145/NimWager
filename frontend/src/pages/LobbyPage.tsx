import { useMemo, useState } from "react"
import { RefreshCw, Radio, Inbox, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { GameIcon } from "@/components/games/GameIcon"
import { OpenWagerCard } from "@/components/games/OpenWagerCard"
import { CreateWagerModal } from "@/components/games/CreateWagerModal"
import { JoinWagerModal } from "@/components/games/JoinWagerModal"
import { GAME_LIST } from "@/lib/games"
import { useOpenWagers } from "@/hooks/useApi"
import { useWallet } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { cn } from "@/lib/utils"
import type { GameKind, OpenWager } from "@/types"

type Filter = "all" | GameKind

export function LobbyPage() {
  const { session } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)
  const { data, isLoading, isFetching, refetch } = useOpenWagers()

  const [createKind, setCreateKind] = useState<GameKind | null>(null)
  const [joinWager, setJoinWager] = useState<OpenWager | null>(null)
  const [filter, setFilter] = useState<Filter>("all")

  const wagers = data?.games ?? []
  const filtered = useMemo(
    () => (filter === "all" ? wagers : wagers.filter((w) => w.game === filter)),
    [wagers, filter],
  )

  function handleCreate(kind: GameKind) {
    if (!session) return openConnectModal()
    setCreateKind(kind)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Game Lobby</h1>
        <p className="mt-1 text-muted-foreground">
          Create a wager or join an open one. Equal stakes, winner takes the pool.
        </p>
      </div>

      {/* Game cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {GAME_LIST.map((g) => (
          <div key={g.kind} className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  g.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
                )}
              >
                <GameIcon kind={g.kind} className="h-6 w-6" />
              </div>
              <span className="text-xs text-muted-foreground">
                {wagers.filter((w) => w.game === g.kind).length} open
              </span>
            </div>
            <h3 className="text-lg font-semibold">{g.name}</h3>
            <p className="mb-4 mt-1 flex-1 text-sm text-muted-foreground">{g.rules}</p>
            <Button onClick={() => handleCreate(g.kind)} className="w-full">
              Create Wager
            </Button>
          </div>
        ))}
      </div>

      {/* Open wagers feed */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-success" />
            <h2 className="text-xl font-bold">Open Wagers</h2>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "coinflip", "rps", "dice"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                filter === f
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All games" : f === "rps" ? "Rock Paper Scissors" : f === "coinflip" ? "Coin Flip" : "Dice"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-xl border border-border bg-card/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
            <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">No open wagers here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first — create a wager above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => (
              <OpenWagerCard
                key={w.gameId}
                wager={w}
                isOwn={session?.address === w.creatorAddress}
                onJoin={setJoinWager}
              />
            ))}
          </div>
        )}
      </div>

      {createKind && (
        <CreateWagerModal kind={createKind} open={!!createKind} onClose={() => setCreateKind(null)} />
      )}
      <JoinWagerModal wager={joinWager} open={!!joinWager} onClose={() => setJoinWager(null)} />
    </div>
  )
}
