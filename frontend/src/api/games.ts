import { http, USE_MOCK } from "./client"
import { mockApi } from "./mock"
import type {
  CancelGameRequest,
  CancelGameResponse,
  CreateGameRequest,
  CreateGameResponse,
  GameDetail,
  FundGameRequest,
  FundGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  RevealGameRequest,
  RevealGameResponse,
  VerificationResult,
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

export async function fundGame(gameId: string, req: FundGameRequest): Promise<FundGameResponse> {
  if (USE_MOCK) return mockApi.fundGame(gameId, req)
  const { data } = await http.post<FundGameResponse>(`/api/games/${gameId}/fund`, req)
  return data
}

export async function revealGame(gameId: string, req: RevealGameRequest): Promise<RevealGameResponse> {
  if (USE_MOCK) return mockApi.revealGame(gameId, req)
  const { data } = await http.post<RevealGameResponse>(`/api/games/${gameId}/reveal`, req)
  return data
}

export async function verifyGame(gameId: string): Promise<VerificationResult> {
  if (USE_MOCK) return mockApi.verifyGame(gameId)
  const { data } = await http.get<VerificationResult>(`/api/verify/${gameId}`)
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
