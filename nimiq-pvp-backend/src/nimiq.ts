import { Nimiq } from '@nimiq/core';
import { RPC_URL, NETWORK } from './config';

let client: InstanceType<typeof Nimiq.Client> | null = null;

export async function initNimiq(): Promise<void> {
  client = new Nimiq.Client({
    network: NETWORK === 'main' ? 'main' : 'test',
    rpcUrl: RPC_URL,
  } as never);
  console.log(`Nimiq client initialized (network=${NETWORK})`);
}

export function getClient(): InstanceType<typeof Nimiq.Client> {
  if (!client) throw new Error('Nimiq client not initialized');
  return client;
}

export function nimToLuna(nim: number): bigint {
  return BigInt(Math.round(nim * 100_000));
}

export function lunaToNim(luna: number | bigint): number {
  return Number(luna) / 100_000;
}

export async function getBalance(address: string): Promise<number> {
  const account = await getClient().getAccount(address);
  return lunaToNim(account.balance);
}
