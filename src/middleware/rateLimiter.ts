import type { IncomingMessage, ServerResponse } from 'node:http';
import { redisClient } from '../infra/redis.js';
import { AppError } from './errors.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 60000,
    max = 10,
    message = 'Too many requests, please try again later',
    keyPrefix = 'rl',
  } = options;

  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    const key = `${keyPrefix}:${ip}`;

    try {
      const current = await redisClient.incr(key);
      if (current === 1) await redisClient.expire(key, Math.ceil(windowMs / 1000));

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        throw new AppError(message, 429);
      }

      return true;
    } catch (error) {
      // IMPORTANT: do not swallow "operational" errors produced by our own code (e.g. 429).
      if (error instanceof AppError) throw error;
      console.error('Rate limiter error:', error);
      return true;
    }
  };
};

export const weatherLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Weather API rate limit exceeded (10 requests per minute)',
});
