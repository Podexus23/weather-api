import type { IncomingMessage, ServerResponse } from 'node:http';
import { redisClient } from './redisClient.js';

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
    const ip = req.socket.remoteAddress;
    const key = `${keyPrefix}:${ip}:${req.url}`;

    try {
      const current = await redisClient.incr(key);
      if (current === 1) await redisClient.expire(key, Math.ceil(windowMs / 1000));

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + windowMs) / 1000));
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Rate limiter error:', error);
      return true;
    }
  };
};
