import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WalletSession } from "@/types"

interface WalletStore {
  session: WalletSession | null
  setSession: (session: WalletSession) => void
  setBalance: (balanceNim: number) => void
  clear: () => void
}

/**
 * Single source of truth for the connected wallet session. Persisted so the
 * address/label survive reloads for display; balances are refreshed on mount.
 */
export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      setBalance: (balanceNim) =>
        set((s) => (s.session ? { session: { ...s.session, balanceNim } } : s)),
      clear: () => set({ session: null }),
    }),
    { name: "nimwager.session" },
  ),
)
