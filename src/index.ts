import { createServer } from 'node:http';
import 'dotenv/config';
import axios from 'axios';

const buildWeatherUrl = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const city = parsedUrl.searchParams.get('city');
  if (!city) throw Error('please add city query parameter');

  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;
};

const server = createServer((req, res) => {
  void (async () => {
    console.log(req.url);
    try {
      if (req.url?.startsWith('/api/weather') && process.env.WEATHER_API_KEY) {
        const cityUrl = buildWeatherUrl(req.url, `http://${req.headers.host}`);
        const { data } = await axios<Record<string, unknown>>(cityUrl);
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
  console.log(`server listens on ${PORT} port`);
});

server.on('error', (err) => {
  console.log('Server error:', err);
});
