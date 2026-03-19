import { createServer } from 'node:http';
import 'dotenv/config';
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
    let allowed: boolean;
    console.log(req.url);

    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const publicRoot = join(__dirname, '../public');

      if (url.pathname.startsWith('/public/')) {
        const relativePath = url.pathname.replace('/public/', '');
        const candidate = join(publicRoot, relativePath);

        if (!candidate.startsWith(publicRoot + sep)) {
          throw new BadRequestError('Forbidden');
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
            throw new BadRequestError('File not found');
          }
          throw new AppError('Internal Server Error', 500);
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
          sendHtml(res, 200, html);
        } else {
          sendJson<WeatherApiResponse>(res, 200, { data: weatherData });
        }
      } else {
        throw new NotFoundError('Not found');
      }
    } catch (error) {
      handleError(error, res);
    }
  })();
});
