/**
 * In-memory mock backend implementing the exact NimWager API contract.
 * Used automatically when VITE_API_URL is not set, so the real backend is a
 * drop-in swap. Settlement logic mirrors what a fair server would compute.
 */
import type {
  CancelGameRequest,
  CancelGameResponse,
  CreateGameRequest,
  CreateGameResponse,
  GameDetail,
  GameKind,
  GameResult,
  HistoryEntry,
  HistoryResponse,
  JoinGameRequest,
  JoinGameResponse,
  OpenWagersResponse,
  PlatformStats,
} from "@/types"
import { WAGER_TTL_MINUTES } from "@/lib/config"

const NETWORK_DELAY = 650

function delay<T>(value: T, ms = NETWORK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function randomAddress(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVXY"
  let body = ""
  for (let i = 0; i < 32; i++) body += chars[Math.floor(Math.random() * chars.length)]
  return `NQ${body}`.replace(/(.{4})/g, "$1 ").trim()
}

function id(): string {
  return "gm_" + Math.random().toString(36).slice(2, 10)
}

/* ---- In-memory stores ---- */
const games = new Map<string, GameDetail>()
const history: HistoryEntry[] = []

const stats: PlatformStats = {
  gamesPlayed: 18342,
  nimWagered: 4210500,
  activePlayers: 612,
  biggestPayout: 82000,
}

// Seed a handful of open wagers so the lobby feels alive.
;(function seed() {
  const seeds: Array<{ game: GameKind; stake: number; minsAgo: number }> = [
    { game: "coinflip", stake: 250, minsAgo: 1 },
    { game: "rps", stake: 1000, minsAgo: 3 },
    { game: "dice", stake: 500, minsAgo: 6 },
    { game: "coinflip", stake: 5000, minsAgo: 8 },
    { game: "rps", stake: 100, minsAgo: 11 },
  ]
  for (const s of seeds) {
    const gid = id()
    const createdAt = new Date(Date.now() - s.minsAgo * 60000).toISOString()
    games.set(gid, {
      gameId: gid,
      game: s.game,
      status: "waiting_for_opponent",
      stakeAmount: s.stake,
      creatorAddress: randomAddress(),
      opponentAddress: null,
      result: null,
      createdAt,
      settledAt: null,
      expiresAt: new Date(Date.now() + WAGER_TTL_MINUTES * 60000).toISOString(),
      creatorChoice: s.game === "dice" ? String(1 + Math.floor(Math.random() * 6)) : "heads",
    })
  }
})()

/* ---- Fair settlement per game ---- */
function settle(
  game: GameKind,
  creator: string,
  opponent: string,
  creatorChoice: string,
  opponentChoice: string,
  stake: number,
): GameResult {
  const pool = stake * 2
  const txHash = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")

  if (game === "coinflip") {
    const flip = Math.random() < 0.5 ? "heads" : "tails"
    const winner = creatorChoice === flip ? creator : opponent
    const loser = winner === creator ? opponent : creator
    return { winner, loser, outcome: flip, payoutAmount: pool, payoutTxHash: txHash }
  }

  if (game === "rps") {
    const beats: Record<string, string> = { rock: "scissors", paper: "rock", scissors: "paper" }
    if (creatorChoice === opponentChoice) {
      return { winner: "", loser: "", outcome: `draw — both picked ${creatorChoice}, refunded`, payoutAmount: stake, payoutTxHash: txHash }
    }
    const creatorWins = beats[creatorChoice] === opponentChoice
    const winner = creatorWins ? creator : opponent
    const loser = creatorWins ? opponent : creator
    const winChoice = creatorWins ? creatorChoice : opponentChoice
    const loseChoice = creatorWins ? opponentChoice : creatorChoice
    return { winner, loser, outcome: `${winChoice} beats ${loseChoice}`, payoutAmount: pool, payoutTxHash: txHash }
  }

  // dice
  const roll = 1 + Math.floor(Math.random() * 6)
  const dc = Math.abs(Number(creatorChoice) - roll)
  const dop = Math.abs(Number(opponentChoice) - roll)
  if (dc === dop) {
    return { winner: "", loser: "", outcome: `${roll} — tie, refunded`, payoutAmount: stake, payoutTxHash: txHash }
  }
  const winner = dc < dop ? creator : opponent
  const loser = dc < dop ? opponent : creator
  return { winner, loser, outcome: String(roll), payoutAmount: pool, payoutTxHash: txHash }
}

export const mockApi = {
  async createGame(req: CreateGameRequest): Promise<CreateGameResponse> {
    const gid = id()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + WAGER_TTL_MINUTES * 60000).toISOString()
    games.set(gid, {
      gameId: gid,
      game: req.game,
      status: "waiting_for_opponent",
      stakeAmount: req.stakeAmount,
      creatorAddress: req.creatorAddress,
      opponentAddress: null,
      result: null,
      createdAt: now,
      settledAt: null,
      expiresAt,
      creatorChoice: req.creatorChoice,
    })
    return delay({ gameId: gid, status: "waiting_for_opponent", expiresAt })
  },

  async joinGame(gameId: string, req: JoinGameRequest): Promise<JoinGameResponse> {
    const g = games.get(gameId)
    if (!g || g.status !== "waiting_for_opponent") {
      return delay({
        gameId,
        status: "error" as const,
        result: { winner: "", loser: "", outcome: "wager unavailable", payoutAmount: 0, payoutTxHash: "" },
      })
    }
    const result = settle(
      g.game,
      g.creatorAddress,
      req.opponentAddress,
      g.creatorChoice ?? "heads",
      req.opponentChoice,
      g.stakeAmount,
    )
    g.opponentAddress = req.opponentAddress
    g.opponentChoice = req.opponentChoice
    g.status = "settled"
    g.result = result
    g.settledAt = new Date().toISOString()
    stats.gamesPlayed += 1
    stats.nimWagered += g.stakeAmount * 2
    return delay({ gameId, status: "settled" as const, result }, 1200)
  },

  async getGame(gameId: string): Promise<GameDetail> {
    const g = games.get(gameId)
    if (!g) throw new Error("Game not found")
    // Auto-expire stale waiting wagers.
    if (g.status === "waiting_for_opponent" && g.expiresAt && new Date(g.expiresAt).getTime() < Date.now()) {
      g.status = "expired"
    }
    return delay({ ...g }, 400)
  },

  async openWagers(): Promise<OpenWagersResponse> {
    const open = [...games.values()]
      .filter((g) => g.status === "waiting_for_opponent")
      .filter((g) => !g.expiresAt || new Date(g.expiresAt).getTime() > Date.now())
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .map((g) => ({
        gameId: g.gameId,
        game: g.game,
        stakeAmount: g.stakeAmount,
        creatorAddress: g.creatorAddress,
        createdAt: g.createdAt,
      }))
    return delay({ games: open }, 400)
  },

  async cancelGame(gameId: string, _req: CancelGameRequest): Promise<CancelGameResponse> {
    const g = games.get(gameId)
    if (g) g.status = "cancelled"
    return delay({ gameId, status: "cancelled" as const })
  },

  async balance(address: string, _walletType: "nimiq" | "evm"): Promise<{ address: string; balance: number }> {
    let hash = 0
    for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0
    const balance = Math.round((500 + (hash % 25000) + (hash % 100) / 100) * 100) / 100
    return delay({ address, balance }, 350)
  },

  async history(address: string): Promise<HistoryResponse> {
    // Blend any locally-settled games for this address with seeded history.
    const local: HistoryEntry[] = [...games.values()]
      .filter((g) => g.status === "settled" && g.result)
      .filter((g) => g.creatorAddress === address || g.opponentAddress === address)
      .map((g) => {
        const r = g.result!
        const isDraw = !r.winner
        const won = r.winner === address
        return {
          gameId: g.gameId,
          game: g.game,
          opponent: g.creatorAddress === address ? g.opponentAddress ?? "unknown" : g.creatorAddress,
          result: isDraw ? "draw" : won ? "win" : "loss",
          payoutAmount: isDraw ? 0 : won ? r.payoutAmount - g.stakeAmount : -g.stakeAmount,
          settledAt: g.settledAt ?? g.createdAt,
        }
      })
    if (local.length === 0) {
      // Provide seeded demo history so the profile isn't empty.
      return delay({ games: seedHistory(address) })
    }
    return delay({ games: [...local, ...seedHistory(address)] })
  },

  async stats(): Promise<PlatformStats> {
    return delay({ ...stats }, 300)
  },
}

function seedHistory(address: string): HistoryEntry[] {
  const rows: Array<{ game: GameKind; result: string; payout: number; hrsAgo: number }> = [
    { game: "coinflip", result: "win", payout: 250, hrsAgo: 2 },
    { game: "rps", result: "loss", payout: -500, hrsAgo: 5 },
    { game: "dice", result: "win", payout: 1000, hrsAgo: 26 },
    { game: "coinflip", result: "loss", payout: -100, hrsAgo: 49 },
    { game: "rps", result: "draw", payout: 0, hrsAgo: 72 },
  ]
  return rows.map((r) => ({
    gameId: id(),
    game: r.game,
    opponent: randomAddress(),
    result: r.result,
    payoutAmount: r.payout,
    settledAt: new Date(Date.now() - r.hrsAgo * 3600000).toISOString(),
  }))
}
