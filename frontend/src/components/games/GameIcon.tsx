import { Coins, Hand, Dice5 } from "lucide-react"
import type { GameKind } from "@/types"
import { cn } from "@/lib/utils"

const map: Record<GameKind, typeof Coins> = {
  coinflip: Coins,
  rps: Hand,
  dice: Dice5,
}

export function GameIcon({ kind, className }: { kind: GameKind; className?: string }) {
  const Icon = map[kind]
  return <Icon className={cn(className)} />
}
