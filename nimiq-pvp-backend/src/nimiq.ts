import { Client, ClientConfiguration } from '@nimiq/core';
import { RPC_URL, NETWORK } from './config';

let client: Client | null = null;

export async function initNimiq(): Promise<void> {
  const config = new ClientConfiguration();
  config.network(NETWORK === 'main' ? 'MainAlbatross' : 'TestAlbatross');
  config.logLevel('info');
  // If you're using a custom RPC endpoint, set it on the config:
  // config.rpcUrl?.(RPC_URL); // check v2 API for exact method name

  client = await Client.create(config.build());
  await client.waitForConsensusEstablished();
  console.log(`Nimiq client initialized (network=${NETWORK})`);
}

export function getClient(): Client {
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
