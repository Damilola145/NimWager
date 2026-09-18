import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Unhandled error:', err);
  res.status(err.status ?? 500).json({ error: err.message || 'Internal error' });
}
