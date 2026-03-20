import { createServer } from 'node:http';

import { compileFile } from 'pug';
import { dirname, extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';
import { getCityFromRequest, getOptionsFromRequest } from './routes/weather.js';
import { weatherLimiter } from './middleware/rateLimiter.js';
import { getWeather } from './services/weatherService.js';
import { sendHtml, sendJson } from './helpers/sendResponse.js';
import { AppError, BadRequestError, NotFoundError } from './middleware/errors.js';
import { handleError } from './helpers/handleError.js';
import type { WeatherApiResponse } from './types/weather.js';
import { mimeTypes } from './types/mime.js';
import { createReadStream } from 'node:fs';
import { isSystemError } from './types/systemError.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const weatherTemplate = compileFile(join(__dirname, '../view/weather.pug'));

export const server = createServer((req, res) => {
  void (async () => {
    try {
      const host = req.headers.host ?? 'localhost';
      const rawUrl = req.url ?? '/';
      const url = new URL(rawUrl, `http://${host}`);
      const pathname = url.pathname;
      const publicRoot = join(__dirname, '../public');

      if (pathname.startsWith('/public/')) {
        const relativePath = pathname.replace('/public/', '');
        const candidate = join(publicRoot, relativePath);

        if (!candidate.startsWith(publicRoot + sep)) {
          throw new BadRequestError('Forbidden');
        }

        if (req.method !== 'GET') {
          throw new NotFoundError('Not found');
        }

        try {
          const fileStat = await stat(candidate);
          const ext = extname(candidate).toLocaleLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';

          //cache headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', fileStat.size);
          res.setHeader('Cache-Control', 'public, max-age=86400'); // for 1 day

          const stream = createReadStream(candidate);

          stream.pipe(res);
          stream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
              res.writeHead(500);
              res.end('Internal Server Error');
            }
          });
        } catch (err) {
          if (isSystemError(err) && err.code === 'ENOENT') {
            throw new NotFoundError('File not found');
          }
          throw new AppError('Internal Server Error', 500);
        }
        return;
      }

      if (req.method === 'GET' && pathname === '/api/weather') {
        if (!process.env.WEATHER_API_KEY) {
          throw new AppError('Server misconfiguration: WEATHER_API_KEY is not set', 500, false);
        }

        const allowed = await weatherLimiter(req, res);
        if (!allowed) return;

        const city = getCityFromRequest(rawUrl, `http://${host}`);
        const weatherData = await getWeather(city);
        const options = getOptionsFromRequest(rawUrl, `http://${host}`);

        if (options && options === 'html') {
          const html = weatherTemplate({ city, weather: weatherData });
          sendHtml(res, 200, html);
        } else {
          sendJson<WeatherApiResponse>(res, 200, { data: weatherData });
        }
        return;
      }

      throw new NotFoundError('Not found');
    } catch (error) {
      handleError(error, res);
    }
  })();
});
