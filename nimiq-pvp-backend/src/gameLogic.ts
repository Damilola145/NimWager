import type { GameType, OutcomeResult } from './types';

export function determineOutcome(
  game: GameType,
  creatorChoice: string,
  opponentChoice: string,
): OutcomeResult {
  switch (game) {
    case 'coinflip':
      return { winnerChoice: creatorChoice, outcome: creatorChoice };

    case 'rps': {
      const beats: Record<string, string> = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
      };
      if (creatorChoice === opponentChoice) {
        return { winnerChoice: null, outcome: `tie: ${creatorChoice}` };
      }
      if (beats[creatorChoice] === opponentChoice) {
        return {
          winnerChoice: creatorChoice,
          outcome: `${creatorChoice} beats ${opponentChoice}`,
        };
      }
      return {
        winnerChoice: opponentChoice,
        outcome: `${opponentChoice} beats ${creatorChoice}`,
      };
    }

    case 'dice': {
      const c = parseInt(creatorChoice, 10);
      const o = parseInt(opponentChoice, 10);
      if (c === o) return { winnerChoice: null, outcome: `tie: ${c}` };
      return c > o
        ? { winnerChoice: creatorChoice, outcome: `${c} > ${o}` }
        : { winnerChoice: opponentChoice, outcome: `${o} > ${c}` };
    }

    default: {
      const _exhaustive: never = game;
      throw new Error(`Unknown game: ${_exhaustive}`);
    }
  }
}
