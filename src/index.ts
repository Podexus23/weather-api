import 'dotenv/config';
import { connectRedis } from './infra/redis.js';
import { server } from './server.js';
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
