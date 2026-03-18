import { createClient } from 'redis';

const redisPassword = process.env.REDIS_PASSWORD;

const redisClient = createClient({
  url: `redis://${redisPassword}@localhost:6379`,
});

redisClient.on('error', (err) => {
  console.error('Redies client error', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to redis');
  }
  return redisClient;
}

export { redisClient };
