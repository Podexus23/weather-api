import 'dotenv/config';
import { connectRedis, disconnectRedis } from './infra/redis.js';
import { server } from './server.js';
const PORT = process.env.PORT || 8000;

let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Shutting down (${signal})...`);

  try {
    server.close(() => {
      void (async () => {
        try {
          await disconnectRedis();
        } catch (err) {
          console.error('Redis disconnect error:', err);
        } finally {
          process.exit(0);
        }
      })();
    });
  } catch (err) {
    console.error('Server close error:', err);
    void (async () => {
      try {
        await disconnectRedis();
      } catch (e) {
        console.error('Redis disconnect error:', e);
      } finally {
        process.exit(1);
      }
    })();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const start = async () => {
  await connectRedis();
  console.log(`server listens on ${PORT} port`);
  server.listen(PORT);
};

void start().catch((err) => {
  console.error('Startup error:', err);
  void disconnectRedis().finally(() => process.exit(1));
});

server.on('error', (err) => {
  console.log('Server error:', err);
});
