import { startServer } from './src/app';

startServer().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
