import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WeatherApiResponse } from '../types/weather.js';
import axios from 'axios';
import { redisClient } from '../infra/redis.js';
import { getWeather } from './weatherService.js';
import { ExternalAPIError, NotFoundError } from '../middleware/errors.js';

vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      isAxiosError: (err: unknown) => {
        if (typeof err !== 'object' || err === null) return false;
        return 'isAxiosError' in err && Boolean((err as Record<string, unknown>).isAxiosError);
      },
    },
  };
});

vi.mock('../infra/redis.js', () => {
  return {
    redisClient: {
      get: vi.fn(),
      setEx: vi.fn(),
      del: vi.fn(),
      isOpen: true,
      disconnect: vi.fn(),
      connect: vi.fn(),
      on: vi.fn(),
    },
  };
});

const mockAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  isAxiosError: (err: unknown) => boolean;
};

const mockRedis = redisClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  setEx: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

describe('services/weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEATHER_API_KEY = 'testkey';
  });

  const weatherData: WeatherApiResponse = {
    currentConditions: { temp: 10, conditions: 'Clear' },
    days: [{ datetime: '2026-03-16', temp: 5, conditions: 'Cloudy' }],
  };

  it('should return cached data when redis has valid weather structure', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(weatherData));

    const result = await getWeather('london');

    expect(result).toEqual(weatherData);
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(mockRedis.setEx).not.toHaveBeenCalled();
  });

  it('should ignore damaged cache and fetch from external API', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ bad: true }));
    mockRedis.del.mockResolvedValueOnce(undefined);
    mockAxios.get.mockResolvedValueOnce({ data: weatherData });

    const promise = getWeather('london');

    const result = await promise;
    expect(result).toEqual(weatherData);
    expect(mockRedis.del).toHaveBeenCalledWith('weather:london');
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockRedis.setEx).toHaveBeenCalledWith(`weather:london`, 3600, JSON.stringify(weatherData));
  });

  it('should fetch from external API and write to redis when cache misses', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockAxios.get.mockResolvedValueOnce({ data: weatherData });

    const result = await getWeather('london');

    expect(result).toEqual(weatherData);
    expect(mockRedis.setEx).toHaveBeenCalledWith(`weather:london`, 3600, JSON.stringify(weatherData));
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should throw timeout error on external API timeout', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockAxios.get.mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' });

    const promise = getWeather('london');
    await expect(promise).rejects.toMatchObject({ statusCode: 502 });
    await expect(promise).rejects.toBeInstanceOf(ExternalAPIError);
  });

  it('should throw NotFoundError on external API 404', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockAxios.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });

    const promise = getWeather('london');
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    await expect(promise).rejects.toMatchObject({ message: 'City "london" not found' });
  });
});
