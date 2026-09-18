import { useState } from "react"
import { Wallet, ChevronLeft, Loader2, ShieldCheck } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"
import { useWallet } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { truncateAddress } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Connector } from "wagmi"

export function WalletConnectModal() {
  const open = useUiStore((s) => s.connectModalOpen)
  const close = useUiStore((s) => s.closeConnectModal)
  const { connectNimiqWallet, connectEvmWallet, evmConnectors } = useWallet()
  const { toast } = useToast()

  const [view, setView] = useState<"choose" | "evm">("choose")
  const [pending, setPending] = useState<string | null>(null)

  function reset() {
    setView("choose")
    setPending(null)
  }

  function handleClose() {
    if (pending) return
    reset()
    close()
  }

  async function handleNimiq() {
    setPending("nimiq")
    try {
      const session = await connectNimiqWallet()
      toast({
        variant: "success",
        title: "Nimiq wallet connected",
        description: truncateAddress(session.address, "nimiq"),
      })
      reset()
      close()
    } catch (err) {
      toast({
        variant: "error",
        title: "Nimiq connection cancelled",
        description: err instanceof Error ? err.message : "The Hub was closed before finishing.",
      })
    } finally {
      setPending(null)
    }
  }

  async function handleEvm(connector: Connector) {
    setPending(connector.uid)
    try {
      const session = await connectEvmWallet(connector)
      toast({
        variant: "success",
        title: "EVM wallet connected",
        description: truncateAddress(session.address, "evm"),
      })
      reset()
      close()
    } catch (err) {
      toast({
        variant: "error",
        title: "EVM connection failed",
        description: err instanceof Error ? err.message : "Request was rejected.",
      })
    } finally {
      setPending(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      dismissible={!pending}
      title={view === "choose" ? "Connect a wallet" : "EVM wallets"}
      description={
        view === "choose"
          ? "Nimiq is the native chain for NimWager. EVM is available as a secondary option."
          : "Connect with an Ethereum-compatible wallet."
      }
    >
      {view === "choose" ? (
        <div className="space-y-4">
          {/* Primary: Nimiq */}
          <button
            onClick={handleNimiq}
            disabled={!!pending}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-left transition",
              "hover:border-primary hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {pending === "nimiq" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wallet className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Connect Nimiq Wallet</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Primary
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Sign in with the Nimiq Hub</p>
            </div>
          </button>

          {/* Secondary: EVM */}
          <button
            onClick={() => setView("evm")}
            disabled={!!pending}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl border border-border bg-muted/40 p-4 text-left transition",
              "hover:border-accent/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-foreground">Connect EVM Wallet</span>
              <p className="text-sm text-muted-foreground">MetaMask, WalletConnect &amp; more</p>
            </div>
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            <span>NimWager never sees your keys. All signing happens inside your wallet.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setView("choose")}
            disabled={!!pending}
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {evmConnectors.length === 0 && (
            <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              No EVM wallets detected. Install MetaMask or set{" "}
              <code className="rounded bg-background px-1">VITE_WALLETCONNECT_PROJECT_ID</code> to enable
              WalletConnect.
            </p>
          )}

          {evmConnectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleEvm(connector)}
              disabled={!!pending}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted/40 p-4 text-left transition hover:border-accent/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                {pending === connector.uid ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
              </div>
              <span className="font-semibold text-foreground">{connector.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
