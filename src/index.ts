import { createServer } from 'node:http';
import 'dotenv/config';
import axios from 'axios';
import { connectRedis, redisClient } from './utils/redisClient.js';

const getCityFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const city = parsedUrl.searchParams.get('city');
  if (!city) throw Error('please add city query parameter');

  return city;
};

const getWeather = async (city: string): Promise<Record<string, unknown>> => {
  const cachedData = await redisClient.get(`weather:${city}`);

  if (cachedData) {
    console.log(`${city} retrieved from cache`);
    //TODO create proper weather interface and remove assertion
    const parsed = JSON.parse(cachedData) as Record<string, unknown>;
    return parsed;
  }

  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;
  const freshData = await axios<Record<string, unknown>>(url);
  console.log(freshData);
  await redisClient.setEx(`weather:${city}`, 3600, JSON.stringify(freshData.data));
  return freshData.data;
};

const server = createServer((req, res) => {
  void (async () => {
    console.log(req.url);
    try {
      if (req.url?.startsWith('/api/weather') && process.env.WEATHER_API_KEY) {
        const city = getCityFromRequest(req.url, `http://${req.headers.host}`);
        const data = await getWeather(city);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data,
          })
        );
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: 'Page not found',
          })
        );
      }
    } catch (error) {
      console.error('Request handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  })();
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  void (async () => {
    await connectRedis();
  })();

  console.log(`server listens on ${PORT} port`);
});

server.on('error', (err) => {
  console.log('Server error:', err);
});
