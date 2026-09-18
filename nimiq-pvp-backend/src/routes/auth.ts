import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { pendingNonces } from '../storage';

export const authRouter = Router();

export function generateChallenge(address: string, action: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const challenge = `NIMIQ_PVP|${action}|${address}|${nonce}|${Date.now()}`;
  pendingNonces.set(address, challenge);
  return challenge;
}

authRouter.post('/challenge', (req: Request, res: Response) => {
  const { address, action } = (req.body ?? {}) as {
    address?: string;
    action?: string;
  };
  if (!address) {
    res.status(400).json({ error: 'Address required' });
    return;
  }
  const challenge = generateChallenge(address, action || 'create');
  res.json({ challenge });
});
