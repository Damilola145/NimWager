import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Wallet, ChevronDown, LogOut, User, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useWallet } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"
import { useToast } from "@/components/ui/Toast"
import { truncateAddress, formatNim } from "@/lib/format"
import { cn } from "@/lib/utils"

export function WalletButton() {
  const { session, disconnect, refreshBalance } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) refreshBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.address])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  if (!session) {
    return (
      <Button onClick={openConnectModal} size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>
    )
  }

  async function copyAddress() {
    if (!session) return
    await navigator.clipboard.writeText(session.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDisconnect() {
    disconnect()
    setMenuOpen(false)
    toast({ variant: "info", title: "Wallet disconnected" })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition hover:border-primary/40"
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            session.walletType === "nimiq" ? "bg-primary" : "bg-accent",
          )}
        />
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold leading-tight text-foreground">
            {truncateAddress(session.address, session.walletType)}
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {Number.isFinite(session.balanceNim) ? formatNim(session.balanceNim) : "—"}
          </p>
        </div>
        <span className="text-xs font-semibold text-foreground sm:hidden">
          {truncateAddress(session.address, session.walletType)}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
          <div className="border-b border-border p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {session.walletType === "nimiq" ? "Nimiq" : "EVM"} wallet
              </span>
              <button
                onClick={copyAddress}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="break-all font-mono text-xs text-foreground">{session.address}</p>
            <p className="mt-2 text-lg font-bold text-primary">{Number.isFinite(session.balanceNim) ? formatNim(session.balanceNim) : "—"}</p>
          </div>
          <div className="p-1.5">
            <Link
              to={`/profile/${encodeURIComponent(session.address)}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <User className="h-4 w-4" /> My profile &amp; history
            </Link>
            <button
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
