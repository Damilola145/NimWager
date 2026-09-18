import { http, USE_MOCK } from "./client"
import { mockApi } from "./mock"
import type { HistoryResponse, PlatformStats, WalletType } from "@/types"

export interface PlayerBalanceResponse {
  address: string
  balance: number
}

export async function getPlayerBalance(address: string, walletType: WalletType): Promise<PlayerBalanceResponse> {
  if (USE_MOCK) return mockApi.balance(address, walletType)
  const { data } = await http.get<PlayerBalanceResponse>(
    `/api/players/${encodeURIComponent(address)}/balance`,
    { params: { walletType } },
  )
  return data
}

export async function getPlayerHistory(address: string): Promise<HistoryResponse> {
  if (USE_MOCK) return mockApi.history(address)
  const { data } = await http.get<HistoryResponse>(`/api/players/${encodeURIComponent(address)}/history`)
  return data
}

/**
 * Platform stats for the landing ticker. The backend contract doesn't pin a
 * stats route, so this targets GET /api/stats and mocks otherwise.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  if (USE_MOCK) return mockApi.stats()
  const { data } = await http.get<PlatformStats>("/api/stats")
  return data
}
