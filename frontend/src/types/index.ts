/** Wallet families supported by NimWager. */
export type WalletType = "nimiq" | "evm"

/** The three supported game modes. */
export type GameKind = "coinflip" | "rps" | "dice"

export type GameStatus =
  | "waiting_for_opponent"
  | "both_committed"
  | "awaiting_reveal"
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
  payoutTxHash: string | null
  combinedSeed?: string
  creatorSeed?: string
  opponentSeed?: string
}

export interface VerificationResult {
  gameId: string
  combinedSeed: string
  derivedOpponentChoice: string
  matchesGameResult: boolean
  commitmentChecks: { creatorValid: boolean; opponentValid: boolean }
  gameResult: GameResult
}

/* ---- API request/response shapes (mirror the backend contract exactly) ---- */

export interface CreateGameRequest {
  game: GameKind
  creatorAddress: string
  walletType: WalletType
  stakeAmount: number
  creatorChoice: string
  creatorSeedCommitment: string
  signature: string
  publicKey: string
}

export interface CreateGameResponse {
  gameId: string
  status: "waiting_for_opponent"
  expiresAt: string
}

export interface JoinGameRequest {
  opponentAddress: string
  walletType: WalletType
  opponentSeedCommitment: string
  signature: string
  publicKey: string
}

export interface FundGameRequest {
  playerAddress: string
  htlcTxHash: string
  htlcContractAddress: string
  preImageHash: string
  signature: string
  publicKey: string
}

export interface FundGameResponse {
  gameId: string
  status: "funded"
  player: string
}

export interface RevealGameRequest {
  playerAddress: string
  seed: string
  signature: string
  publicKey: string
}

export interface RevealGameResponse {
  gameId: string
  status: "awaiting_reveal" | "settled"
  message?: string
  result?: GameResult
  combinedSeed?: string
  verification?: { creatorSeedHash: string; opponentSeedHash: string }
}

export interface JoinGameResponse {
  gameId: string
  status: "both_committed" | "settled" | "error"
  message?: string
  result?: GameResult
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
  creatorChoice?: string
  opponentChoice?: string
  commitments: { creator: string; opponent: string | null }
  creatorFunded?: boolean
  opponentFunded?: boolean
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
  publicKey: string
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
