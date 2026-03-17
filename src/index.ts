import { createServer } from 'node:http';
import 'dotenv/config';

const URL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/london?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json`;

async function getWeather() {
  const res = await fetch(URL);
  if (res.ok) {
    const json = await res.json();
    return json;
  }
  return 'empty';
}

const server = createServer((req, res) => {
  void (async () => {
    console.log(req.url);
    try {
      if (req.url === '/api/weather' && process.env.WEATHER_API_KEY) {
        const data = await getWeather();
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
