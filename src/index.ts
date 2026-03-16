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

const server = createServer(async (req, res) => {
  console.log(req.url);

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
});
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`server listens on ${PORT} port`);
});
