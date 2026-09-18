import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Nimiq } from '@nimiq/core';

import { games, pendingNonces, recordHistory } from '../storage';
import { GAME_TIMEOUT_MS } from '../config';
import { determineOutcome } from '../gameLogic';
import {
  CHOICE_MAP,
  verifyReveal,
  deriveChoice,
  combineSeeds,
} from '../commitReveal';
import { broadcastSignedTx } from '../htlc';
import type {
  AuthCheckResult,
  Game,
  GameResult,
  GameType,
  WalletType,
} from '../types';

export const gamesRouter = Router();

function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string,
): boolean {
  try {
    const signature = Nimiq.Signature.fromHex(signatureHex);
    const publicKey = Nimiq.PublicKey.fromHex(publicKeyHex);
    const prefix = '\x16Nimiq Signed Message:\n';
    const fullMessage = prefix + message.length + message;
    const dataBytes = Nimiq.BufferUtils.fromUtf8(fullMessage);
    const hash = Nimiq.Hash.computeSha256(dataBytes);
    return signature.verify(publicKey, hash);
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

function consumeChallenge(
  address: string,
  signature: string,
  publicKey: string,
): AuthCheckResult {
  const challenge = pendingNonces.get(address);
  if (!challenge) {
    return { ok: false, error: 'No pending challenge for this address' };
  }
  if (!verifySignature(challenge, signature, publicKey)) {
    return { ok: false, error: 'Invalid signature' };
  }
  pendingNonces.delete(address);
  return { ok: true };
}

const VALID_GAMES: GameType[] = ['coinflip', 'rps', 'dice'];

gamesRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      game,
      creatorAddress,
      walletType,
      stakeAmount,
      creatorChoice,
      creatorSeedCommitment,
      signature,
      publicKey,
    } = req.body as {
      game?: GameType;
      creatorAddress?: string;
      walletType?: WalletType;
      stakeAmount?: number;
      creatorChoice?: string | number;
      creatorSeedCommitment?: string;
      signature?: string;
      publicKey?: string;
    };

    if (
      !game ||
      !creatorAddress ||
      !stakeAmount ||
      !creatorChoice ||
      !creatorSeedCommitment ||
      !signature ||
      !publicKey
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (!VALID_GAMES.includes(game)) {
      res.status(400).json({ error: 'Invalid game type' });
      return;
    }
    if (!CHOICE_MAP[game].includes(String(creatorChoice))) {
      res.status(400).json({ error: 'Invalid creatorChoice for game type' });
      return;
    }

    const auth = consumeChallenge(creatorAddress, signature, publicKey);
    if (!auth.ok) {
      res.status(401).json({ error: auth.error });
      return;
    }

    const gameId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + GAME_TIMEOUT_MS);

    const gameObj: Game = {
      gameId,
      game,
      creatorAddress,
      creatorWalletType: walletType ?? 'nimiq',
      stakeAmount,
      creatorChoice: String(creatorChoice),
      creatorSeedCommitment,
      creatorSeed: null,
      opponentAddress: null,
      opponentWalletType: null,
      opponentChoice: null,
      opponentSeedCommitment: null,
      opponentSeed: null,
      htlc: { creator: null, opponent: null },
      status: 'waiting_for_opponent',
      result: null,
      createdAt: now.toISOString(),
      settledAt: null,
      expiresAt: expiresAt.toISOString(),
    };

    games.set(gameId, gameObj);

    setTimeout(() => {
      const g = games.get(gameId);
      if (g && g.status === 'waiting_for_opponent') g.status = 'expired';
    }, GAME_TIMEOUT_MS);

    res.json({
      gameId,
      status: 'waiting_for_opponent',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

gamesRouter.post('/:gameId/fund', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const {
      playerAddress,
      htlcTxHash,
      htlcContractAddress,
      preImageHash,
      signature,
      publicKey,
    } = req.body as {
      playerAddress?: string;
      htlcTxHash?: string;
      htlcContractAddress?: string;
      preImageHash?: string;
      signature?: string;
      publicKey?: string;
    };

    const game = games.get(gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (!playerAddress || !htlcTxHash || !htlcContractAddress ||
        !preImageHash || !signature || !publicKey) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const auth = consumeChallenge(playerAddress, signature, publicKey);
    if (!auth.ok) {
      res.status(401).json({ error: auth.error });
      return;
    }

    const entry = {
      txHash: htlcTxHash,
      contractAddress: htlcContractAddress,
      preImageHash,
    };

    if (playerAddress === game.creatorAddress) {
      game.htlc.creator = entry;
    } else if (playerAddress === game.opponentAddress) {
      game.htlc.opponent = entry;
    } else {
      res.status(403).json({ error: 'Not a participant in this game' });
      return;
    }

    res.json({ gameId, status: 'funded', player: playerAddress });
  } catch (err) {
    console.error('Fund error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

gamesRouter.post('/:gameId/join', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const {
      opponentAddress,
      walletType,
      opponentSeedCommitment,
      signature,
      publicKey,
    } = req.body as {
      opponentAddress?: string;
      walletType?: WalletType;
      opponentSeedCommitment?: string;
      signature?: string;
      publicKey?: string;
    };

    const game = games.get(gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (game.status !== 'waiting_for_opponent') {
      res.status(400).json({ error: `Game is ${game.status}` });
      return;
    }
    if (!opponentAddress || !signature || !publicKey || !opponentSeedCommitment) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (game.creatorAddress === opponentAddress) {
      res.status(400).json({ error: 'Cannot join your own game' });
      return;
    }

    const auth = consumeChallenge(opponentAddress, signature, publicKey);
    if (!auth.ok) {
      res.status(401).json({ error: auth.error });
      return;
    }

    game.opponentAddress = opponentAddress;
    game.opponentWalletType = walletType ?? 'nimiq';
    game.opponentSeedCommitment = opponentSeedCommitment;
    game.status = 'both_committed';

    res.json({
      gameId,
      status: 'both_committed',
      message: 'Both players committed. Reveal your seeds to settle.',
    });
  } catch (err) {
    console.error('Join game error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

gamesRouter.post('/:gameId/reveal', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const {
      playerAddress,
      seed,
      signature,
      publicKey,
      redemptionTxHex,
    } = req.body as {
      playerAddress?: string;
      seed?: string;
      signature?: string;
      publicKey?: string;
      redemptionTxHex?: string;
    };

    const game = games.get(gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (game.status !== 'both_committed' && game.status !== 'awaiting_reveal') {
      res.status(400).json({ error: `Game is ${game.status}` });
      return;
    }
    if (!playerAddress || !seed || !signature || !publicKey) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const auth = consumeChallenge(playerAddress, signature, publicKey);
    if (!auth.ok) {
      res.status(401).json({ error: auth.error });
      return;
    }

    if (playerAddress === game.creatorAddress) {
      if (!verifyReveal(seed, game.creatorSeedCommitment)) {
        res.status(400).json({ error: 'Creator seed does not match commitment' });
        return;
      }
      game.creatorSeed = seed;
    } else if (playerAddress === game.opponentAddress) {
      if (!verifyReveal(seed, game.opponentSeedCommitment!)) {
        res.status(400).json({ error: 'Opponent seed does not match commitment' });
        return;
      }
      game.opponentSeed = seed;
    } else {
      res.status(403).json({ error: 'Not a participant in this game' });
      return;
    }

    if (!(game.creatorSeed && game.opponentSeed)) {
      game.status = 'awaiting_reveal';
      res.json({
        gameId,
        status: 'awaiting_reveal',
        message: 'Seed received. Waiting for the other player to reveal.',
      });
      return;
    }

    const combinedSeed = combineSeeds(
      game.creatorSeed,
      game.opponentSeed,
      game.gameId,
    );
    const opponentChoice = deriveChoice(combinedSeed, CHOICE_MAP[game.game]);
    game.opponentChoice = opponentChoice;

    const outcome = determineOutcome(game.game, game.creatorChoice, opponentChoice);

    let winner: string;
    let loser: string;
    let payoutAmount: number;

    if (outcome.winnerChoice === null) {
      winner = 'tie';
      loser = 'tie';
      payoutAmount = 0;
    } else if (outcome.winnerChoice === game.creatorChoice) {
      winner = game.creatorAddress;
      loser = game.opponentAddress!;
      payoutAmount = game.stakeAmount * 2;
    } else {
      winner = game.opponentAddress!;
      loser = game.creatorAddress;
      payoutAmount = game.stakeAmount * 2;
    }

    let payoutTxHash: string | null = null;
    if (outcome.winnerChoice !== null && redemptionTxHex) {
      try {
        payoutTxHash = await broadcastSignedTx(redemptionTxHex);
      } catch (err) {
        console.error('HTLC redemption broadcast failed:', err);
      }
    }

    game.status = 'settled';
    game.settledAt = new Date().toISOString();

    const result: GameResult = {
      winner,
      loser,
      outcome: outcome.outcome,
      payoutAmount,
      payoutTxHash,
      combinedSeed,
      creatorSeed: game.creatorSeed,
      opponentSeed: game.opponentSeed,
    };
    game.result = result;

    const base = {
      gameId,
      game: game.game,
      payoutAmount,
      settledAt: game.settledAt,
    };
    recordHistory(game.creatorAddress, {
      ...base,
      opponent: game.opponentAddress,
      result: outcome.winnerChoice === null
        ? 'tie'
        : (winner === game.creatorAddress ? 'win' : 'loss'),
    });
    recordHistory(game.opponentAddress!, {
      ...base,
      opponent: game.creatorAddress,
      result: outcome.winnerChoice === null
        ? 'tie'
        : (winner === game.opponentAddress ? 'win' : 'loss'),
    });

    res.json({
      gameId,
      status: 'settled',
      result,
      combinedSeed,
      verification: {
        creatorSeedHash: game.creatorSeedCommitment,
        opponentSeedHash: game.opponentSeedCommitment,
      },
    });
  } catch (err) {
    console.error('Reveal error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

gamesRouter.get('/open', (_req: Request, res: Response) => {
  const list: Array<{
    gameId: string;
    game: GameType;
    stakeAmount: number;
    creatorAddress: string;
    createdAt: string;
  }> = [];

  for (const game of games.values()) {
    if (game.status === 'waiting_for_opponent') {
      list.push({
        gameId: game.gameId,
        game: game.game,
        stakeAmount: game.stakeAmount,
        creatorAddress: game.creatorAddress,
        createdAt: game.createdAt,
      });
    }
  }
  res.json({ games: list });
});

gamesRouter.get('/:gameId', (req: Request, res: Response) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  res.json({
    gameId: game.gameId,
    game: game.game,
    status: game.status,
    stakeAmount: game.stakeAmount,
    creatorAddress: game.creatorAddress,
    opponentAddress: game.opponentAddress,
    result: game.result,
    createdAt: game.createdAt,
    settledAt: game.settledAt,
    commitments: {
      creator: game.creatorSeedCommitment,
      opponent: game.opponentSeedCommitment,
    },
  });
});

gamesRouter.post('/:gameId/cancel', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { creatorAddress, signature, publicKey } = req.body as {
      creatorAddress?: string;
      signature?: string;
      publicKey?: string;
    };

    const game = games.get(gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (!creatorAddress || !signature || !publicKey) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (game.creatorAddress !== creatorAddress) {
      res.status(403).json({ error: 'Only the creator can cancel' });
      return;
    }
    if (game.status !== 'waiting_for_opponent') {
      res.status(400).json({ error: `Game is ${game.status}` });
      return;
    }

    const auth = consumeChallenge(creatorAddress, signature, publicKey);
    if (!auth.ok) {
      res.status(401).json({ error: auth.error });
      return;
    }

    game.status = 'cancelled';
    res.json({ gameId, status: 'cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
