import axios from 'axios';
import { redisClient } from '../infra/redis.js';
import { AppError, ExternalAPIError, NotFoundError } from '../middleware/errors.js';
import { isWeatherData, type WeatherApiResponse } from '../types/weather.js';

export const getWeather = async (city: string): Promise<WeatherApiResponse> => {
  try {
    const cachedData = await redisClient.get(`weather:${city}`);

    if (cachedData) {
      console.log(`${city} retrieved from cache`);
      const parsed = JSON.parse(cachedData) as Record<string, unknown>;
      if (isWeatherData(parsed)) {
        return parsed;
      } else {
        throw new AppError('Cache response structure', 503);
      }
    }

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;
    const { data: rawData } = await axios<Record<string, unknown>>(url);
    if (isWeatherData(rawData)) {
      await redisClient.setEx(`weather:${city}`, 3600, JSON.stringify(rawData));
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
