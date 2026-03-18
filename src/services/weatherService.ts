import axios from 'axios';
import { redisClient } from '../infra/redis.js';

export const getWeather = async (city: string): Promise<Record<string, unknown>> => {
  const cachedData = await redisClient.get(`weather:${city}`);

  if (cachedData) {
    console.log(`${city} retrieved from cache`);
    //TODO create proper weather interface and remove assertion
    const parsed = JSON.parse(cachedData) as Record<string, unknown>;
    return parsed;
  }

  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;
  const freshData = await axios<Record<string, unknown>>(url);
  await redisClient.setEx(`weather:${city}`, 3600, JSON.stringify(freshData.data));
  return freshData.data;
};
