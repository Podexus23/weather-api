import axios from 'axios';
import { redisClient } from '../infra/redis.js';
import { ExternalAPIError, NotFoundError } from '../middleware/errors.js';
import { isWeatherData, type WeatherApiResponse } from '../types/weather.js';

export const getWeather = async (city: string): Promise<WeatherApiResponse> => {
  try {
    const cacheKey = `weather:${city}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log(`${city} retrieved from cache`);
      try {
        const parsed = JSON.parse(cachedData) as Record<string, unknown>;
        if (isWeatherData(parsed)) {
          return parsed;
        }
        // Wrong cache data: delete and fetch new data.
        await redisClient.del(cacheKey);
      } catch {
        // Wrong JSON data: delete and fetch new data.
        await redisClient.del(cacheKey);
      }
    }

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;
    const { data: rawData } = await axios.get<Record<string, unknown>>(url, { timeout: 5000 });
    if (isWeatherData(rawData)) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(rawData));
      return rawData;
    } else {
      throw new ExternalAPIError('Invalid API response structure');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new ExternalAPIError('Weather API timeout');
      }
      if (error.response?.status === 404) {
        throw new NotFoundError(`City "${city}" not found`);
      }
    }
    throw error;
  }
};
