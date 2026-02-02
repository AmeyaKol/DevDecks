import { Redis } from '@upstash/redis';

let redisClient;

const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
};

const getCacheVersion = async (namespace) => {
  const client = getRedisClient();
  if (!client) return '0';
  const key = `cache:version:${namespace}`;
  const version = await client.get(key);
  return version ? String(version) : '0';
};

const bumpCacheVersion = async (namespace) => {
  const client = getRedisClient();
  if (!client) return;
  const key = `cache:version:${namespace}`;
  await client.incr(key);
};

const buildCacheKey = async (namespace, req) => {
  const version = await getCacheVersion(namespace);
  const userPart = req.user ? `user:${req.user._id}` : 'public';
  const queryPart = JSON.stringify(req.query || {});
  return `${namespace}:v${version}:${userPart}:${req.method}:${req.baseUrl}${req.path}:${queryPart}`;
};

const getCache = async (key) => {
  const client = getRedisClient();
  if (!client) return null;
  return client.get(key);
};

const setCache = async (key, value, ttlSeconds = 300) => {
  const client = getRedisClient();
  if (!client) return;
  await client.set(key, value, { ex: ttlSeconds });
};

export { buildCacheKey, getCache, setCache, bumpCacheVersion };
