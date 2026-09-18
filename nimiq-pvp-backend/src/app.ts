import express, { type Express } from 'express';

import { PORT } from './config';
import { initNimiq } from './nimiq';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { gamesRouter } from './routes/games';
import { verifyRouter } from './routes/verify';
import { playersRouter } from './routes/players';
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',              // local dev
    'https://nimwager-frontend4.onrender.com/', // deployed
  ],
  credentials: true,
}));

export function buildApp(): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/verify', verifyRouter);
  app.use('/api/players', playersRouter);

  app.use(errorHandler);
  return app;
}

export async function startServer(): Promise<Express> {
  await initNimiq();
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`NIMIQ PVP backend v2 running on port ${PORT}`);
  });
  return app;
}
