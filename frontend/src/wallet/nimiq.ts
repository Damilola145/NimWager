import HubApi from "@nimiq/hub-api"
import { APP_NAME, NIMIQ_HUB_URL } from "@/lib/config"
import { getPlayerBalance } from "@/api/players"

/**
 * Nimiq wallet integration via the official Hub API.
 * The Hub opens a popup/redirect owned by Nimiq — private keys never touch our
 * app; we only receive an address and signatures.
 */

let hub: HubApi | null = null

function getHub(): HubApi {
  if (!hub) hub = new HubApi(NIMIQ_HUB_URL)
  return hub
}

export interface NimiqAccount {
  address: string
  label?: string
}

/** Prompt the user to choose a Nimiq address to connect. */
export async function connectNimiq(): Promise<NimiqAccount> {
  const api = getHub()
  const chosen = await api.chooseAddress({ appName: APP_NAME })
  return { address: chosen.address, label: chosen.label }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/** Sign an ownership challenge with the connected Nimiq address. */
export async function signNimiqMessage(signer: string, message: string): Promise<string> {
  const api = getHub()
  const signed = await api.signMessage({ appName: APP_NAME, signer, message })
  const sig = signed.signature as unknown
  if (sig instanceof Uint8Array) return bytesToHex(sig)
  return String(sig)
}

/**
 * Fetch the wallet balance from the NimWager backend. The backend queries the
 * Nimiq RPC node because the Hub SDK does not expose account balances directly.
 */
export async function getNimiqBalance(address: string): Promise<number> {
  const { balance } = await getPlayerBalance(address, "nimiq")
  return balance
}
