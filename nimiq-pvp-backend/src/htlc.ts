import { Transaction } from '@nimiq/core';
import { BufferUtils } from '@nimiq/core';
import { getClient } from './nimiq';

export async function broadcastSignedTx(signedTxHex: string): Promise<string> {
  const client = getClient();
  const tx = Transaction.deserialize(BufferUtils.fromHex(signedTxHex));
  const details = await client.sendTransaction(tx);
  return details.transactionHash;
}
