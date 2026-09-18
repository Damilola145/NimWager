import { Nimiq } from '@nimiq/core';
import { getClient } from './nimiq';

export async function broadcastSignedTx(signedTxHex: string): Promise<string> {
  const tx = Nimiq.Transaction.unserialize(
    Nimiq.BufferUtils.fromHex(signedTxHex),
  );
  const details = await getClient().sendTransaction(tx);
  return details.hash.toString();
}
