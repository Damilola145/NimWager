import { useCallback } from "react"
import { useConnect, useDisconnect, useSignMessage, type Connector } from "wagmi"
import { useWalletStore } from "@/store/walletStore"
import { connectNimiq, getNimiqBalance, signNimiqMessage } from "./nimiq"
import type { WalletSession } from "@/types"

/**
 * Unified wallet API over both families. Nimiq is the primary flow via the Hub;
 * EVM is the secondary flow via wagmi. Signing and balance lookups are routed
 * by the active session's walletType.
 */
export function useWallet() {
  const session = useWalletStore((s) => s.session)
  const setSession = useWalletStore((s) => s.setSession)
  const setBalance = useWalletStore((s) => s.setBalance)
  const clear = useWalletStore((s) => s.clear)

  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const connectNimiqWallet = useCallback(async (): Promise<WalletSession> => {
    const account = await connectNimiq()
    const balanceNim = await getNimiqBalance(account.address)
    const next: WalletSession = {
      walletType: "nimiq",
      address: account.address,
      label: account.label,
      balanceNim,
    }
    setSession(next)
    return next
  }, [setSession])

  const connectEvmWallet = useCallback(
    async (connector: Connector): Promise<WalletSession> => {
      const res = await connectAsync({ connector })
      const address = res.accounts[0]
      const balanceNim = await getNimiqBalance(address)
      const next: WalletSession = {
        walletType: "evm",
        address,
        label: connector.name,
        balanceNim,
      }
      setSession(next)
      return next
    },
    [connectAsync, setSession],
  )

  const disconnect = useCallback(async () => {
    if (session?.walletType === "evm") {
      try {
        await disconnectAsync()
      } catch {
        /* ignore */
      }
    }
    clear()
  }, [session, disconnectAsync, clear])

  /** Sign an ownership challenge; returns a hex/hex-string signature. */
  const signChallenge = useCallback(
    async (message: string): Promise<string> => {
      if (!session) throw new Error("No wallet connected")
      if (session.walletType === "nimiq") {
        return signNimiqMessage(session.address, message)
      }
      return signMessageAsync({ message, account: session.address as `0x${string}` })
    },
    [session, signMessageAsync],
  )

  const refreshBalance = useCallback(async () => {
    if (!session) return
    const balanceNim = await getNimiqBalance(session.address)
    setBalance(balanceNim)
  }, [session, setBalance])

  return {
    session,
    isConnected: !!session,
    evmConnectors: connectors,
    connectNimiqWallet,
    connectEvmWallet,
    disconnect,
    signChallenge,
    refreshBalance,
  }
}

/** Build the ownership-challenge message signed before create/join/cancel. */
export function buildChallenge(action: string, address: string): string {
  return `NimWager ${action}\naddress: ${address}\nts: ${Date.now()}`
}
