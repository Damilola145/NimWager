export type GameType = 'coinflip' | 'rps' | 'dice';

export type WalletType = 'nimiq' | 'evm';

export type GameStatus =
  | 'waiting_for_opponent'
  | 'both_committed'
  | 'awaiting_reveal'
  | 'settled'
  | 'expired'
  | 'cancelled';

export interface HtlcEntry {
  txHash: string;
  contractAddress: string;
  preImageHash: string;
}

export interface GameResult {
  winner: string;
  loser: string;
  outcome: string;
  payoutAmount: number;
  payoutTxHash: string | null;
  combinedSeed: string;
  creatorSeed: string;
  opponentSeed: string;
}

export interface Game {
  gameId: string;
  game: GameType;
  creatorAddress: string;
  creatorWalletType: WalletType;
  stakeAmount: number;
  creatorChoice: string;
  creatorSeedCommitment: string;
  creatorSeed: string | null;
  opponentAddress: string | null;
  opponentWalletType: WalletType | null;
  opponentChoice: string | null;
  opponentSeedCommitment: string | null;
  opponentSeed: string | null;
  htlc: {
    creator: HtlcEntry | null;
    opponent: HtlcEntry | null;
  };
  status: GameStatus;
  result: GameResult | null;
  createdAt: string;
  settledAt: string | null;
  expiresAt: string;
}

export interface HistoryRecord {
  gameId: string;
  game: GameType;
  opponent: string | null;
  result: 'win' | 'loss' | 'tie';
  payoutAmount: number;
  settledAt: string;
}

export interface OutcomeResult {
  winnerChoice: string | null;
  outcome: string;
}

export interface AuthCheckResult {
  ok: boolean;
  error?: string;
}
