import { NIMIQ_EXPLORER_URL } from "./config"
import type { WalletType } from "@/types"

/** Truncate an address for compact display, aware of both address formats. */
export function truncateAddress(address: string, type: WalletType = "nimiq"): string {
  if (!address) return ""
  if (type === "nimiq") {
    // Nimiq addresses are 36 chars: NQ.. .... .... — keep first + last block.
    const compact = address.replace(/\s+/g, "")
    if (compact.length <= 12) return address
    return `${compact.slice(0, 6)}…${compact.slice(-4)}`
  }
  // EVM 0x...
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

const nimFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export function formatNim(amount: number): string {
  return `${nimFmt.format(amount)} NIM`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function explorerTxUrl(txHash: string): string {
  return `${NIMIQ_EXPLORER_URL}/#${txHash}`
}

/** Human "time ago" for feeds/history. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/** Countdown string toward an ISO expiry, or null if already expired. */
export function timeUntil(iso: string): string | null {
  const target = new Date(iso).getTime()
  const diff = target - Date.now()
  if (diff <= 0) return null
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
