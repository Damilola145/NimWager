import { Activity, Coins, Users, Trophy } from "lucide-react"
import { usePlatformStats } from "@/hooks/useApi"
import { formatNumber, formatNim } from "@/lib/format"

export function StatsTicker() {
  const { data, isLoading } = usePlatformStats()

  const items = [
    { icon: Activity, label: "Games played", value: data ? formatNumber(data.gamesPlayed) : "—" },
    { icon: Coins, label: "NIM wagered", value: data ? formatNim(data.nimWagered) : "—" },
    { icon: Users, label: "Active players", value: data ? formatNumber(data.activePlayers) : "—" },
    { icon: Trophy, label: "Biggest payout", value: data ? formatNim(data.biggestPayout) : "—" },
  ]

  // Duplicate the row so the marquee loops seamlessly.
  const row = [...items, ...items]

  return (
    <div className="relative overflow-hidden border-y border-border bg-card/40">
      <div className="flex w-max animate-ticker gap-8 py-3" aria-hidden={!isLoading ? undefined : true}>
        {row.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2.5 px-2">
            <item.icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="ml-6 h-1 w-1 rounded-full bg-border" />
          </div>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
