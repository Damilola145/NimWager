import { Router, type Request, type Response } from 'express';
import { games } from '../storage';
import {
  CHOICE_MAP,
  sha256Hex,
  deriveChoice,
  combineSeeds,
} from '../commitReveal';

export const verifyRouter = Router();

verifyRouter.get('/:gameId', (req: Request, res: Response) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  if (game.status !== 'settled' || !game.creatorSeed || !game.opponentSeed) {
    res.status(400).json({ error: 'Game not settled' });
    return;
  }

  const combinedSeed = combineSeeds(
    game.creatorSeed,
    game.opponentSeed,
    game.gameId,
  );
  const derivedOpponentChoice = deriveChoice(combinedSeed, CHOICE_MAP[game.game]);

  res.json({
    gameId: game.gameId,
    combinedSeed,
    derivedOpponentChoice,
    matchesGameResult: derivedOpponentChoice === game.opponentChoice,
    commitmentChecks: {
      creatorValid: sha256Hex(game.creatorSeed) === game.creatorSeedCommitment,
      opponentValid:
        sha256Hex(game.opponentSeed) === game.opponentSeedCommitment,
    },
    gameResult: game.result,
  });
});
