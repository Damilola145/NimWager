import { Router, type Request, type Response } from 'express';
import { playerHistory } from '../storage';
import { getBalance } from '../nimiq';

export const playersRouter = Router();

playersRouter.get('/:address/history', (req: Request, res: Response) => {
  const history = playerHistory.get(req.params.address) ?? [];
  res.json({
    games: history.map((h) => ({
      gameId: h.gameId,
      game: h.game,
      opponent: h.opponent,
      result: h.result,
      payoutAmount: h.payoutAmount,
      settledAt: h.settledAt,
    })),
  });
});

playersRouter.get('/:address/balance', async (req: Request, res: Response) => {
  try {
    const walletType = (req.query.walletType as string) || 'nimiq';
    if (walletType !== 'nimiq') {
      res.status(400).json({ error: 'Only Nimiq wallets supported for balance' });
      return;
    }
    const balance = await getBalance(req.params.address);
    res.json({ address: req.params.address, balance });
  } catch (err) {
    console.error('Balance query error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
