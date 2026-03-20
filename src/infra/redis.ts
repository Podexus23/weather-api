import { createClient } from 'redis';

const redisClient = createClient({
  url: `${process.env.REDIS_URL}`,
});

redisClient.on('error', (err) => {
  console.error('Redis client error', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to redis');
  }
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
    console.log('Disconnected from redis');
  }
}

export { redisClient };
