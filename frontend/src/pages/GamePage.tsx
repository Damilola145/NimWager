import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Loader2,
  Clock,
  Hourglass,
  XCircle,
  ArrowLeft,
  Copy,
  Check,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { StatusBadge } from "@/components/ui/Badge"
import { GameIcon } from "@/components/games/GameIcon"
import { GameResultReveal } from "@/components/games/GameResultReveal"
import { useGame } from "@/hooks/useApi"
import { useWallet, buildChallenge } from "@/wallet/useWallet"
import { useToast } from "@/components/ui/Toast"
import { cancelGame, revealGame } from "@/api/games"
import { getGameSecret } from "@/lib/gameSecrets"
import { apiErrorMessage } from "@/api/client"
import { GAMES } from "@/lib/games"
import { formatNim, truncateAddress, timeUntil } from "@/lib/format"

export function GamePage() {
  const { gameId } = useParams()
  const { session, signChallenge } = useWallet()
  const { toast } = useToast()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useGame(
    gameId,
    // poll while the game is likely still open
    true,
  )

  const isWaiting = data?.status === "waiting_for_opponent"

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <XCircle className="mb-3 h-10 w-10 text-danger" />
        <h1 className="text-xl font-bold">Wager not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This game does not exist or has been removed.
        </p>
        <Link to="/lobby" className="mt-5">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to lobby
          </Button>
        </Link>
      </div>
    )
  }

  const meta = GAMES[data.game]

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Link
        to="/lobby"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Lobby
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              meta.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
            }`}
          >
            <GameIcon kind={data.game} className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{meta.name}</h1>
            <p className="text-xs text-muted-foreground">Stake {formatNim(data.stakeAmount)}</p>
          </div>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {data.status === "settled" && data.result ? (
        <GameResultReveal detail={data} viewerAddress={session?.address} />
      ) : data.status === "both_committed" || data.status === "awaiting_reveal" ? (
        <RevealState detail={data} onRevealed={() => refetch()} />
      ) : isWaiting ? (
        <WaitingState
          detail={data}
          isCreator={session?.address === data.creatorAddress}
          onCancel={async () => {
            if (!session) return
            try {
              const signature = await signChallenge(buildChallenge("cancel-wager", session.address))
              await cancelGame(data.gameId, { creatorAddress: session.address, signature, publicKey: session.address })
              toast({ variant: "info", title: "Wager cancelled", description: "Your stake has been refunded." })
              refetch()
            } catch (err) {
              toast({ variant: "error", title: "Cancel failed", description: apiErrorMessage(err) })
            }
          }}
          onExpire={() => refetch()}
        />
      ) : data.status === "expired" ? (
        <TerminalState
          icon={<Hourglass className="h-7 w-7" />}
          tone="danger"
          title="Wager expired"
          body={`No opponent joined in time. Your ${formatNim(data.stakeAmount)} stake has been refunded.`}
        />
      ) : (
        <TerminalState
          icon={<Ban className="h-7 w-7" />}
          tone="muted"
          title="Wager cancelled"
          body={`This wager was cancelled and the ${formatNim(data.stakeAmount)} stake refunded.`}
        />
      )}
    </div>
  )
}

function RevealState({ detail, onRevealed }: { detail: import("@/types").GameDetail; onRevealed: () => void }) {
  const { session, signChallenge } = useWallet()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState(false)

  async function reveal() {
    if (!session) { toast({ variant: "error", title: "Connect your wallet", description: "A wallet signature is required to reveal your seed." }); return }
    const seed = getGameSecret(detail.gameId)
    if (!seed) { toast({ variant: "error", title: "Seed unavailable", description: "Reconnect in the same browser session used to create or join this wager." }); return }
    setBusy(true)
    try {
      const signature = await signChallenge(buildChallenge("reveal", session.address))
      const result = await revealGame(detail.gameId, { playerAddress: session.address, seed, signature, publicKey: session.address })
      setRevealed(true)
      toast({ variant: "success", title: result.status === "settled" ? "Game settled" : "Seed revealed", description: result.message ?? "Waiting for the other player to reveal." })
      onRevealed()
    } catch (err) { toast({ variant: "error", title: "Reveal failed", description: apiErrorMessage(err) }) } finally { setBusy(false) }
  }

  return <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
    <h2 className="text-lg font-bold">Both players committed</h2>
    <p className="mt-2 text-sm text-muted-foreground">Reveal your private seed to derive the outcome fairly. Only its SHA256 commitment was shared before now.</p>
    <Button className="mt-5 w-full" onClick={reveal} disabled={busy || revealed}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : revealed ? "Seed revealed" : "Reveal seed"}</Button>
  </div>
}

function WaitingState({
  detail,
  isCreator,
  onCancel,
  onExpire,
}: {
  detail: import("@/types").GameDetail
  isCreator: boolean
  onCancel: () => Promise<void>
  onExpire: () => void
}) {
  const [countdown, setCountdown] = useState<string | null>(
    detail.expiresAt ? timeUntil(detail.expiresAt) : null,
  )
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!detail.expiresAt) return
    const t = setInterval(() => {
      const next = timeUntil(detail.expiresAt!)
      setCountdown(next)
      if (next === null) {
        clearInterval(t)
        onExpire()
      }
    }, 1000)
    return () => clearInterval(t)
  }, [detail.expiresAt, onExpire])

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <h2 className="text-xl font-bold">Waiting for an opponent</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your stake is locked. The game settles automatically the moment someone joins.
      </p>

      {countdown && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Auto-refund in</span>
          <span className="font-mono font-semibold text-foreground">{countdown}</span>
        </div>
      )}

      <div className="mt-6 space-y-2 rounded-xl bg-muted/30 p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Creator</span>
          <span className="font-mono">{truncateAddress(detail.creatorAddress, "nimiq")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stake</span>
          <span className="font-semibold">{formatNim(detail.stakeAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Winner takes</span>
          <span className="font-semibold text-success">{formatNim(detail.stakeAmount * 2)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copied" : "Share wager link"}
        </Button>
        {isCreator && (
          <Button
            variant="danger"
            className="flex-1"
            loading={cancelling}
            onClick={async () => {
              setCancelling(true)
              await onCancel()
              setCancelling(false)
            }}
          >
            Cancel &amp; refund
          </Button>
        )}
      </div>
    </div>
  )
}

function TerminalState({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode
  title: string
  body: string
  tone: "danger" | "muted"
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
          tone === "danger" ? "bg-danger/15 text-danger" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      <Link to="/lobby" className="mt-6 inline-block">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to lobby
        </Button>
      </Link>
    </div>
  )
}
