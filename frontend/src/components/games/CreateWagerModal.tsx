import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, PenLine, AlertTriangle, Fuel } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { ChoicePicker } from "./ChoicePicker"
import { StakeInput } from "./StakeInput"
import { GameIcon } from "./GameIcon"
import { GAMES } from "@/lib/games"
import { formatNim } from "@/lib/format"
import { useWallet, buildChallenge } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { useToast } from "@/components/ui/Toast"
import { createGame } from "@/api/games"
import { apiErrorMessage } from "@/api/client"
import type { GameKind } from "@/types"

type Phase = "idle" | "signing" | "submitting" | "error"

export function CreateWagerModal({
  kind,
  open,
  onClose,
}: {
  kind: GameKind
  open: boolean
  onClose: () => void
}) {
  const meta = GAMES[kind]
  const { session, signChallenge } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [choice, setChoice] = useState<string | null>(null)
  const [stakeStr, setStakeStr] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)

  const stake = parseFloat(stakeStr) || 0
  const balance = session?.balanceNim ?? 0
  const insufficient = stake > balance
  const busy = phase === "signing" || phase === "submitting"
  const canConfirm = !!session && !!choice && stake > 0 && !insufficient && !busy

  function resetAndClose() {
    if (busy) return
    setPhase("idle")
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    if (!session) {
      openConnectModal()
      return
    }
    if (!choice || stake <= 0) return

    setError(null)
    setPhase("signing")
    const pendingId = toast({
      variant: "pending",
      title: "Awaiting signature",
      description: "Confirm the stake in your wallet",
    })

    try {
      const signature = await signChallenge(buildChallenge("create-wager", session.address))
      setPhase("submitting")
      const res = await createGame({
        game: kind,
        creatorAddress: session.address,
        walletType: session.walletType,
        stakeAmount: stake,
        creatorChoice: choice,
        signature,
      })
      toast({ variant: "success", title: "Wager created", description: "Waiting for an opponent to join." })
      setPhase("idle")
      onClose()
      navigate(`/game/${res.gameId}`)
    } catch (err) {
      setPhase("error")
      setError(apiErrorMessage(err))
      toast({
        variant: "error",
        title: "Wager not created",
        description: "Signature rejected or the request failed. Your picks are saved — try again.",
      })
    } finally {
      // dismiss the pending toast if still up
      // (auto-dismissing toasts already cleared themselves)
      void pendingId
    }
  }

  const feeLabel = session?.walletType === "evm" ? "Gas paid in ETH by your wallet" : "≈ 0.001 NIM network fee"

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      dismissible={!busy}
      title={`Create ${meta.name} wager`}
      description={meta.rules}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              meta.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
            }`}
          >
            <GameIcon kind={kind} className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{meta.name}</p>
            <p className="text-xs text-muted-foreground">{meta.tagline}</p>
          </div>
        </div>

        <ChoicePicker meta={meta} value={choice} onChange={setChoice} disabled={busy} />

        <StakeInput
          value={stakeStr}
          onChange={setStakeStr}
          balance={balance}
          disabled={busy}
          insufficient={insufficient}
        />

        <div className="space-y-2 rounded-xl bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Your stake</span>
            <span className="font-semibold">{formatNim(stake)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Potential payout</span>
            <span className="font-semibold text-success">{formatNim(stake * 2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" /> Network fee
            </span>
            <span>{feeLabel}</span>
          </div>
        </div>

        {phase === "error" && error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!session ? (
          <Button className="w-full" onClick={openConnectModal}>
            Connect wallet to stake
          </Button>
        ) : (
          <Button className="w-full" onClick={handleConfirm} disabled={!canConfirm}>
            {phase === "signing" && (
              <>
                <PenLine className="h-4 w-4" /> Awaiting signature…
              </>
            )}
            {phase === "submitting" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating wager…
              </>
            )}
            {(phase === "idle" || phase === "error") && (phase === "error" ? "Retry — Confirm & Stake" : "Confirm & Stake")}
          </Button>
        )}
      </div>
    </Modal>
  )
}
