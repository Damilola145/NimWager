import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, PenLine, AlertTriangle, Fuel, Swords } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { ChoicePicker } from "./ChoicePicker"
import { GameIcon } from "./GameIcon"
import { GAMES } from "@/lib/games"
import { formatNim, truncateAddress } from "@/lib/format"
import { useWallet, buildChallenge } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { useToast } from "@/components/ui/Toast"
import { joinGame, fundGame } from "@/api/games"
import { createRandomSeed, sha256Hex } from "@/lib/crypto"
import { rememberGameSecret } from "@/lib/gameSecrets"
import { apiErrorMessage } from "@/api/client"
import type { OpenWager } from "@/types"

type Phase = "idle" | "signing" | "settling" | "error"

export function JoinWagerModal({
  wager,
  open,
  onClose,
}: {
  wager: OpenWager | null
  open: boolean
  onClose: () => void
}) {
  const { session, signChallenge } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [choice, setChoice] = useState<string | null>(null)
  const [seed] = useState(createRandomSeed)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)

  if (!wager) return null
  const meta = GAMES[wager.game]
  const balance = session?.balanceNim ?? 0
  const insufficient = wager.stakeAmount > balance
  const busy = phase === "signing" || phase === "settling"
  const isOwnWager = session?.address === wager.creatorAddress
  const canConfirm = !!session && !!choice && !insufficient && !busy && !isOwnWager

  function resetAndClose() {
    if (busy) return
    setPhase("idle")
    setError(null)
    setChoice(null)
    onClose()
  }

  async function handleConfirm() {
    if (!session) return openConnectModal()
    if (!wager) return

    setError(null)
    setPhase("signing")
    toast({ variant: "pending", title: "Awaiting signature", description: "Confirm the stake in your wallet" })

    try {
      const signature = await signChallenge(buildChallenge("join", session.address))
      const opponentSeedCommitment = await sha256Hex(seed)
      setPhase("settling")
      const res = await joinGame(wager.gameId, {
        opponentAddress: session.address,
        walletType: session.walletType,
        opponentSeedCommitment,
        signature,
        publicKey: session.address,
      })
      rememberGameSecret(wager.gameId, seed)
      await fundGame(wager.gameId, { playerAddress: session.address, htlcTxHash: `mock_htlc_${wager.gameId}_${session.address.slice(-4)}`, htlcContractAddress: `mock_contract_${wager.gameId}`, preImageHash: await sha256Hex(seed), signature, publicKey: session.address })
      if (res.status === "error") {
        throw new Error("This wager is no longer available.")
      }
      toast({ variant: "success", title: "Game settled", description: "Revealing the result…" })
      setPhase("idle")
      onClose()
      navigate(`/game/${wager.gameId}`, { state: { justSettled: true } })
    } catch (err) {
      setPhase("error")
      setError(apiErrorMessage(err))
      toast({
        variant: "error",
        title: "Could not join wager",
        description: "Signature rejected or the wager was taken. Try another.",
      })
    }
  }

  const feeLabel = session?.walletType === "evm" ? "Gas paid in ETH by your wallet" : "≈ 0.001 NIM network fee"

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      dismissible={!busy}
      title={`Join ${meta.name} wager`}
      description="Match the stake, lock your pick, and settle instantly."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                meta.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
              }`}
            >
              <GameIcon kind={wager.game} className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{meta.name}</p>
              <p className="text-xs text-muted-foreground">
                vs {truncateAddress(wager.creatorAddress, "nimiq")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Stake</p>
            <p className="font-bold text-primary">{formatNim(wager.stakeAmount)}</p>
          </div>
        </div>

        {isOwnWager && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This is your own wager. Cancel it from the game page instead of joining.</span>
          </div>
        )}

        <ChoicePicker meta={meta} value={choice} onChange={setChoice} disabled={busy || isOwnWager} />

        <div className="space-y-2 rounded-xl bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Matched stake</span>
            <span className="font-semibold">{formatNim(wager.stakeAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Winner takes</span>
            <span className="font-semibold text-success">{formatNim(wager.stakeAmount * 2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" /> Network fee
            </span>
            <span>{feeLabel}</span>
          </div>
        </div>

        {insufficient && session && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Insufficient NIM balance to match this stake.</span>
          </div>
        )}

        {phase === "error" && error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!session ? (
          <Button className="w-full" onClick={openConnectModal}>
            Connect wallet to join
          </Button>
        ) : (
          <Button className="w-full" onClick={handleConfirm} disabled={!canConfirm}>
            {phase === "signing" && (
              <>
                <PenLine className="h-4 w-4" /> Awaiting signature…
              </>
            )}
            {phase === "settling" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Settling game…
              </>
            )}
            {(phase === "idle" || phase === "error") && (
              <>
                <Swords className="h-4 w-4" />
                {phase === "error" ? "Retry — Join & Stake" : "Join & Stake"}
              </>
            )}
          </Button>
        )}
      </div>
    </Modal>
  )
}
