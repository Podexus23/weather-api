# Weather API (Redis cache + rate limiting)

A small Node.js/TypeScript weather wrapper service that fetches weather data from a 3rd-party provider (Visual Crossing API) and exposes it via a simple REST endpoint.

This project was built following the idea from the roadmap here: [Weather API wrapper service on roadmap.sh](https://roadmap.sh/projects/weather-api-wrapper-service).

## Features
- `GET /api/weather?city=...` returns weather data as JSON
- Optional `options=html` renders a minimal HTML page using **Pug**
- Redis caching for weather responses (`weather:<city>`) with TTL
- Redis-backed rate limiting per client IP with `X-RateLimit-*` headers
- Basic input validation for `city`

## API

### Get weather (JSON)
`GET /api/weather?city=London`

Response:
- `200` with `{ data: ... }`
- `400` for invalid/missing `city`
- `404` if the city is not found or resource is missing
- `429` when rate limit is exceeded
- `502/500` for external/API/server errors

### Get weather (HTML)
`GET /api/weather?city=London&options=html`

Returns:
- `200` with rendered HTML
- Error responses are handled centrally

## Architecture (high level)
- `src/server.ts`: HTTP server, static file serving, and dispatching `/api/weather`
- `src/routes/weather.ts`: parsing/validation of query params (`city`, `options`)
- `src/services/weatherService.ts`: caching + fetching from the external API
- `src/infra/redis.ts`: Redis client connection lifecycle
- `src/middleware/rateLimiter.ts`: rate limiting logic
- `src/helpers/handleError.ts`: centralized error-to-response mapping

## Environment variables
Copy `.env.example` to `.env` and fill in values:
- `PORT`
- `WEATHER_API_KEY` (Visual Crossing API key)
- `REDIS_URL` (e.g. `redis://:password@host:port`)
- `REDIS_PASSWORD` (if used by your Redis setup)

## Run
1. Install dependencies:
   - `npm install`
2. Start in dev mode:
   - `npm run dev`
3. Or start the built version:
   - `npm run build && npm start`

## Tests
- `npm test`
- Coverage (if supported in your environment):
  - `npm run test:coverage`

## Lint
- `npm run lint`
