import { createServer } from 'node:http';
import 'dotenv/config';
import { connectRedis } from './infra/redis.js';
import { compileFile } from 'pug';
import { dirname, extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { getCityFromRequest, getOptionsFromRequest } from './routes/weather.js';
import { weatherLimiter } from './middleware/rateLimiter.js';
import { getWeather } from './services/weatherService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const weatherTemplate = compileFile(join(__dirname, '../view/weather.pug'));

const server = createServer((req, res) => {
  void (async () => {
    let allowed: boolean;
    console.log(req.url);

    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const publicRoot = join(__dirname, '../public');

      if (url.pathname.startsWith('/public/')) {
        const relativePath = url.pathname.replace('/public/', '');
        const candidate = join(publicRoot, relativePath);

        if (!candidate.startsWith(publicRoot + sep)) {
          throw Error('Forbidden');
        }

        try {
          const content = await readFile(candidate);
          const ext = extname(candidate);
          const contentType = ext === '.css' ? 'text/css' : 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        } catch {
          res.writeHead(404);
          res.end('File not found');
        }
        return;
      }

      if (req.url?.startsWith('/api/weather') && process.env.WEATHER_API_KEY) {
        allowed = await weatherLimiter(req, res);
        if (!allowed) return;

        const city = getCityFromRequest(req.url, `http://${req.headers.host}`);
        const weatherData = await getWeather(city);
        const options = getOptionsFromRequest(req.url, `http://${req.headers.host}`);
        if (options && options === 'html') {
          const html = weatherTemplate({ city, weather: weatherData });
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } else {
          res.writeHead(200, { 'Content-Type': 'Application/json' });
          res.end(
            JSON.stringify({
              data: weatherData,
            })
          );
        }
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
