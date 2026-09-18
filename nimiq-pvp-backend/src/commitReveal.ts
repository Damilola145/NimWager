import crypto from 'crypto';
import type { GameType } from './types';

export const CHOICE_MAP: Record<GameType, string[]> = {
  coinflip: ['heads', 'tails'],
  rps: ['rock', 'paper', 'scissors'],
  dice: ['1', '2', '3', '4', '5', '6'],
};

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function verifyReveal(seed: string, commitmentHex: string): boolean {
  return sha256Hex(seed) === commitmentHex;
}

export function deriveChoice(
  combinedSeedHex: string,
  allowedChoices: string[],
): string {
  const seedBytes = Buffer.from(combinedSeedHex, 'hex');
  const choiceCount = allowedChoices.length;
  const maxAcceptable = Math.floor(0xffffffff / choiceCount) * choiceCount;

  for (let i = 0; i + 4 <= seedBytes.length; i += 4) {
    const value = seedBytes.readUInt32BE(i);
    if (value < maxAcceptable) {
      return allowedChoices[value % choiceCount];
    }
  }
  return allowedChoices[seedBytes[0] % choiceCount];
}

export function combineSeeds(
  creatorSeed: string,
  opponentSeed: string,
  gameId: string,
): string {
  return crypto
    .createHash('sha256')
    .update(creatorSeed)
    .update(opponentSeed)
    .update(gameId)
    .digest('hex');
}
