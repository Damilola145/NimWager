import { useQuery } from "@tanstack/react-query"
import { getGame, getOpenWagers } from "@/api/games"
import { getPlatformStats, getPlayerHistory } from "@/api/players"

export function usePlatformStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getPlatformStats,
    refetchInterval: 15000,
  })
}

export function useOpenWagers() {
  return useQuery({
    queryKey: ["open-wagers"],
    queryFn: getOpenWagers,
    refetchInterval: 8000,
  })
}

export function useGame(gameId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGame(gameId as string),
    enabled: !!gameId,
    refetchInterval: poll ? 4000 : false,
  })
}

export function usePlayerHistory(address: string | undefined) {
  return useQuery({
    queryKey: ["history", address],
    queryFn: () => getPlayerHistory(address as string),
    enabled: !!address,
  })
}
