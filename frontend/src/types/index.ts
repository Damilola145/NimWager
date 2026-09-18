/** Wallet families supported by NimWager. */
export type WalletType = "nimiq" | "evm"

/** The three supported game modes. */
export type GameKind = "coinflip" | "rps" | "dice"

export type GameStatus =
  | "waiting_for_opponent"
  | "settled"
  | "expired"
  | "cancelled"
  | "error"

/** Per-game choice unions kept as plain strings to match the backend contract. */
export type CoinChoice = "heads" | "tails"
export type RpsChoice = "rock" | "paper" | "scissors"
export type DiceChoice = "1" | "2" | "3" | "4" | "5" | "6"
export type GameChoice = CoinChoice | RpsChoice | DiceChoice

export interface WalletSession {
  walletType: WalletType
  address: string
  /** Human label from the wallet (Nimiq account label / ENS-style), optional. */
  label?: string
  /** Balance in NIM, fetched from the NimWager backend. */
  balanceNim: number
}

export interface GameResult {
  winner: string
  loser: string
  outcome: string
  payoutAmount: number
  payoutTxHash: string
}

/* ---- API request/response shapes (mirror the backend contract exactly) ---- */

export interface CreateGameRequest {
  game: GameKind
  creatorAddress: string
  walletType: WalletType
  stakeAmount: number
  creatorChoice: string
  signature: string
}

export interface CreateGameResponse {
  gameId: string
  status: "waiting_for_opponent"
  expiresAt: string
}

export interface JoinGameRequest {
  opponentAddress: string
  walletType: WalletType
  opponentChoice: string
  signature: string
}

export interface JoinGameResponse {
  gameId: string
  status: "settled" | "error"
  result: GameResult
}

export interface GameDetail {
  gameId: string
  game: GameKind
  status: GameStatus
  stakeAmount: number
  creatorAddress: string
  opponentAddress: string | null
  result: GameResult | null
  createdAt: string
  settledAt: string | null
  /** Present on responses derived from create; optional otherwise. */
  expiresAt?: string
  /** The choice the creator made — tracked for reveal UI. */
  creatorChoice?: string
  /** The choice the opponent made — tracked for reveal UI. */
  opponentChoice?: string
}

export interface OpenWager {
  gameId: string
  game: GameKind
  stakeAmount: number
  creatorAddress: string
  createdAt: string
}

export interface OpenWagersResponse {
  games: OpenWager[]
}

export interface CancelGameRequest {
  creatorAddress: string
  signature: string
}

export interface CancelGameResponse {
  gameId: string
  status: "cancelled"
}

export interface HistoryEntry {
  gameId: string
  game: GameKind
  opponent: string
  result: "win" | "loss" | "draw" | string
  payoutAmount: number
  settledAt: string
}

export interface HistoryResponse {
  games: HistoryEntry[]
}

export interface PlatformStats {
  gamesPlayed: number
  nimWagered: number
  activePlayers: number
  biggestPayout: number
}
