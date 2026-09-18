import type { CancelGameRequest, CancelGameResponse, CreateGameRequest, CreateGameResponse, FundGameRequest, FundGameResponse, GameDetail, GameKind, GameResult, HistoryEntry, HistoryResponse, JoinGameRequest, JoinGameResponse, OpenWagersResponse, PlatformStats, RevealGameRequest, RevealGameResponse, VerificationResult } from "@/types"
import { WAGER_TTL_MINUTES } from "@/lib/config"

const delay = <T,>(value: T, ms = 450) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
const id = () => `gm_${Math.random().toString(36).slice(2, 10)}`
const hex = (length = 64) => Array.from({ length }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
const address = () => `NQ${hex(32).toUpperCase().slice(0, 32)}`
const hash = async (value: string) => { let h = 2166136261; for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16).padStart(8, "0").repeat(8) }
const games = new Map<string, GameDetail & { creatorSeed?: string; opponentSeed?: string; creatorFunded?: boolean; opponentFunded?: boolean }>()
const stats: PlatformStats = { gamesPlayed: 18342, nimWagered: 4210500, activePlayers: 612, biggestPayout: 82000 }

function resultFor(g: GameDetail & { creatorSeed?: string; opponentSeed?: string }): GameResult {
  const creator = g.creatorSeed ?? ""; const opponent = g.opponentSeed ?? ""; const combined = `${creator}${opponent}${g.gameId}`
  let n = 0; for (const c of combined) n = (n * 31 + c.charCodeAt(0)) >>> 0
  const pool = g.stakeAmount * 2; const other = g.opponentAddress ?? ""
  if (g.game === "coinflip") { const outcome = n % 2 ? "heads" : "tails"; const winner = g.creatorChoice === outcome ? g.creatorAddress : other; return { winner, loser: winner === g.creatorAddress ? other : g.creatorAddress, outcome, payoutAmount: pool, payoutTxHash: hex() , combinedSeed: combined } }
  if (g.game === "rps") { const choices = ["rock", "paper", "scissors"]; const creatorChoice = g.creatorChoice ?? "rock"; const opponentChoice = choices[n % 3]; const beats: Record<string,string> = { rock:"scissors", paper:"rock", scissors:"paper" }; if (creatorChoice === opponentChoice) return { winner:"tie", loser:"tie", outcome:`${creatorChoice} draw`, payoutAmount:0, payoutTxHash:null, combinedSeed:combined }; const winner = beats[creatorChoice] === opponentChoice ? g.creatorAddress : other; return { winner, loser: winner === g.creatorAddress ? other : g.creatorAddress, outcome:`${winner === g.creatorAddress ? creatorChoice : opponentChoice} beats ${winner === g.creatorAddress ? opponentChoice : creatorChoice}`, payoutAmount:pool, payoutTxHash:hex(), combinedSeed:combined } }
  const roll = (n % 6) + 1; const opponentChoice = (n % 6) + 1; const creatorChoice = Number(g.creatorChoice); const cd = Math.abs(creatorChoice - roll); const od = Math.abs(opponentChoice - roll); if (cd === od) return { winner:"tie", loser:"tie", outcome:`${roll} tie`, payoutAmount:0, payoutTxHash:null, combinedSeed:combined }; const winner = cd < od ? g.creatorAddress : other; return { winner, loser: winner === g.creatorAddress ? other : g.creatorAddress, outcome:`${roll} > ${winner === g.creatorAddress ? opponentChoice : creatorChoice}`, payoutAmount:pool, payoutTxHash:hex(), combinedSeed:combined }
}

const seed = () => { (["coinflip","rps","dice"] as GameKind[]).forEach((game, i) => { const gameId = id(); games.set(gameId, { gameId, game, status:"waiting_for_opponent", stakeAmount:[250,1000,500][i], creatorAddress:address(), opponentAddress:null, result:null, createdAt:new Date().toISOString(), settledAt:null, expiresAt:new Date(Date.now()+WAGER_TTL_MINUTES*60000).toISOString(), creatorChoice:game === "dice" ? "4" : game === "rps" ? "rock" : "heads", commitments:{ creator:hex(), opponent:null } }) }) }
seed()

export const mockApi = {
  async createGame(req: CreateGameRequest): Promise<CreateGameResponse> { const gameId=id(); const expiresAt=new Date(Date.now()+WAGER_TTL_MINUTES*60000).toISOString(); games.set(gameId, { gameId, game:req.game, status:"waiting_for_opponent", stakeAmount:req.stakeAmount, creatorAddress:req.creatorAddress, opponentAddress:null, result:null, createdAt:new Date().toISOString(), settledAt:null, expiresAt, creatorChoice:req.creatorChoice, commitments:{ creator:req.creatorSeedCommitment, opponent:null } }); return delay({ gameId, status:"waiting_for_opponent", expiresAt }) },
  async joinGame(gameId:string, req:JoinGameRequest):Promise<JoinGameResponse> { const g=games.get(gameId); if (!g || g.status !== "waiting_for_opponent") return delay({gameId,status:"error",result:{winner:"",loser:"",outcome:"wager unavailable",payoutAmount:0,payoutTxHash:null}}); g.opponentAddress=req.opponentAddress; g.commitments.opponent=req.opponentSeedCommitment; g.status="both_committed"; return delay({gameId,status:"both_committed",message:"Both players committed. Reveal your seeds."}) },
  async fundGame(gameId:string, req:FundGameRequest):Promise<FundGameResponse> { const g=games.get(gameId); if (!g) throw new Error("Game not found"); if (req.playerAddress === g.creatorAddress) g.creatorFunded=true; else g.opponentFunded=true; return delay({gameId,status:"funded",player:req.playerAddress}) },
  async revealGame(gameId:string, req:RevealGameRequest):Promise<RevealGameResponse> { const g=games.get(gameId); if (!g) throw new Error("Game not found"); if (req.playerAddress === g.creatorAddress) g.creatorSeed=req.seed; else g.opponentSeed=req.seed; if (!g.creatorSeed || !g.opponentSeed) { g.status="awaiting_reveal"; return delay({gameId,status:"awaiting_reveal",message:"Seed recorded. Waiting for the other player."}) } g.status="settled"; g.result=resultFor(g); g.settledAt=new Date().toISOString(); stats.gamesPlayed++; stats.nimWagered += g.stakeAmount*2; return delay({gameId,status:"settled",result:g.result,combinedSeed:g.result.combinedSeed,verification:{creatorSeedHash:g.commitments.creator,opponentSeedHash:g.commitments.opponent!}}) },
  async verifyGame(gameId:string):Promise<VerificationResult> { const g=games.get(gameId); if (!g || !g.result) throw new Error("Game is not settled"); return delay({gameId,combinedSeed:g.result.combinedSeed ?? "",derivedOpponentChoice:g.opponentSeed ?? "",matchesGameResult:true,commitmentChecks:{creatorValid:true,opponentValid:true},gameResult:g.result}) },
  async getGame(gameId:string):Promise<GameDetail> { const g=games.get(gameId); if (!g) throw new Error("Game not found"); if (g.status === "waiting_for_opponent" && g.expiresAt && Date.parse(g.expiresAt)<Date.now()) g.status="expired"; return delay({...g}) },
  async openWagers():Promise<OpenWagersResponse> { return delay({games:[...games.values()].filter(g=>g.status==="waiting_for_opponent").map(({gameId,game,stakeAmount,creatorAddress,createdAt})=>({gameId,game,stakeAmount,creatorAddress,createdAt}))}) },
  async cancelGame(gameId:string,_req:CancelGameRequest):Promise<CancelGameResponse> { const g=games.get(gameId); if(g) g.status="cancelled"; return delay({gameId,status:"cancelled"}) },
  async balance(address:string,_walletType:"nimiq"|"evm") { let n=0; for(const c of address)n=(n*31+c.charCodeAt(0))>>>0; return delay({address,balance:Math.round((500+n%25000)*100)/100},350) },
  async history(_address:string):Promise<HistoryResponse> { return delay({games:[]}) },
  async stats():Promise<PlatformStats> { return delay({...stats}) },
}

export { hash }
