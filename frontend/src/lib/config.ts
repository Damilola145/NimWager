/**
 * Central runtime config. All values are sourced from Vite env vars so the app
 * is a drop-in swap once the real backend + network are wired up.
 */

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export const NIMIQ_NETWORK: "main" | "test" =
  import.meta.env.VITE_NIMIQ_NETWORK === "main" ? "main" : "test"

/** Nimiq Hub endpoint depends on the target network. */
export const NIMIQ_HUB_URL =
  NIMIQ_NETWORK === "main" ? "https://hub.nimiq.com" : "https://hub.nimiq-testnet.com"

/** Block explorer base — appended with the tx hash on result screens. */
export const NIMIQ_EXPLORER_URL =
  NIMIQ_NETWORK === "main" ? "https://nimiq.watch" : "https://test.nimiq.watch"

export const APP_NAME = "NimWager"

/** How long an unmatched wager stays open before auto-refund (client display only). */
export const WAGER_TTL_MINUTES = 15
