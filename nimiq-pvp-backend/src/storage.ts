import type { Game, HistoryRecord } from './types';

export const games = new Map<string, Game>();
export const playerHistory = new Map<string, HistoryRecord[]>();
export const pendingNonces = new Map<string, string>();

export function recordHistory(address: string, record: HistoryRecord): void {
  const existing = playerHistory.get(address);
  if (existing) {
    existing.push(record);
  } else {
    playerHistory.set(address, [record]);
  }
}
