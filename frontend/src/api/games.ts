import { http, USE_MOCK } from "./client"
import { mockApi } from "./mock"
import type {
  CancelGameRequest,
  CancelGameResponse,
  CreateGameRequest,
  CreateGameResponse,
  GameDetail,
  JoinGameRequest,
  JoinGameResponse,
  OpenWagersResponse,
} from "@/types"

export async function createGame(req: CreateGameRequest): Promise<CreateGameResponse> {
  if (USE_MOCK) return mockApi.createGame(req)
  const { data } = await http.post<CreateGameResponse>("/api/games/create", req)
  return data
}

export async function joinGame(gameId: string, req: JoinGameRequest): Promise<JoinGameResponse> {
  if (USE_MOCK) return mockApi.joinGame(gameId, req)
  const { data } = await http.post<JoinGameResponse>(`/api/games/${gameId}/join`, req)
  return data
}

export async function getGame(gameId: string): Promise<GameDetail> {
  if (USE_MOCK) return mockApi.getGame(gameId)
  const { data } = await http.get<GameDetail>(`/api/games/${gameId}`)
  return data
}

export async function getOpenWagers(): Promise<OpenWagersResponse> {
  if (USE_MOCK) return mockApi.openWagers()
  const { data } = await http.get<OpenWagersResponse>("/api/games/open")
  return data
}

export async function cancelGame(gameId: string, req: CancelGameRequest): Promise<CancelGameResponse> {
  if (USE_MOCK) return mockApi.cancelGame(gameId, req)
  const { data } = await http.post<CancelGameResponse>(`/api/games/${gameId}/cancel`, req)
  return data
}
