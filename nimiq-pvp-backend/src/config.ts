export const PORT: number = Number(process.env.PORT) || 3000;

export const RPC_URL: string =
  process.env.NIMIQ_RPC_URL || 'https://rpc.nimiqwatch.com';

export type NimiqNetwork = 'main' | 'test' | 'dev';

export const NETWORK: NimiqNetwork =
  (process.env.NIMIQ_NETWORK as NimiqNetwork) || 'main';

export const GAME_TIMEOUT_MS = 10 * 60 * 1000; // 10 min to find opponent
export const HTLC_TIMEOUT_MS = 20 * 60 * 1000; // 20 min HTLC expiry
