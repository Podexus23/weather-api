import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppError } from './errors.js';

const mockReq = (url: string): IncomingMessage =>
  ({
    url,
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as IncomingMessage;

const mockRes = () => {
  const setHeader = vi.fn();
  const res = { setHeader } as unknown as ServerResponse;
  return { res, setHeader };
};

vi.mock('../infra/redis.js', () => {
  return {
    redisClient: {
      incr: vi.fn(),
      expire: vi.fn(),
      isOpen: true,
      disconnect: vi.fn(),
      connect: vi.fn(),
      on: vi.fn(),
    },
  };
});

import { redisClient } from '../infra/redis.js';

describe('middleware/rateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when within limit', async () => {
    const mod = await import('./rateLimiter.js');
    (redisClient.incr as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(1);
    (redisClient.expire as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const limiter = mod.createRateLimiter({ windowMs: 60_000, max: 2, message: 'Too many' });
    const req = mockReq('/api/weather?city=london');
    const { res, setHeader } = mockRes();

    const allowed = await limiter(req, res);
    expect(allowed).toBe(true);
    expect(redisClient.expire).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);
  });

  it('should throw AppError(429) when limit is exceeded', async () => {
    const mod = await import('./rateLimiter.js');
    (redisClient.incr as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(3);

    const limiter = mod.createRateLimiter({
      windowMs: 60_000,
      max: 2,
      message: 'Weather API rate limit exceeded (10 requests per minute)',
    });
    const req = mockReq('/api/weather?city=london');
    const { res } = mockRes();

    const promise = limiter(req, res);
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({ statusCode: 429 });
  });

  it('should not break the request when redis fails', async () => {
    const mod = await import('./rateLimiter.js');
    (redisClient.incr as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('redis down'));

    const limiter = mod.createRateLimiter({ windowMs: 60_000, max: 2, message: 'Too many' });
    const req = mockReq('/api/weather?city=london');
    const { res } = mockRes();

    const allowed = await limiter(req, res);
    expect(allowed).toBe(true);
  });
});
