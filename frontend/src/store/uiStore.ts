import { create } from "zustand"

interface UiStore {
  connectModalOpen: boolean
  openConnectModal: () => void
  closeConnectModal: () => void
}

/** Lightweight UI state so any gated action can pop the connect modal. */
export const useUiStore = create<UiStore>((set) => ({
  connectModalOpen: false,
  openConnectModal: () => set({ connectModalOpen: true }),
  closeConnectModal: () => set({ connectModalOpen: false }),
}))
