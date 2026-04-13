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

/** Lightweight Redis reachability check for health/metrics. */
const pingRedis = async () => {
  const client = getRedisClient();
  if (!client) return { ok: false, reason: 'not_configured' };
  try {
    if (typeof client.ping === 'function') {
      const pong = await client.ping();
      return { ok: pong === 'PONG' || pong === true || pong === 'OK', detail: pong };
    }
    await client.set('__health_ping__', '1', { ex: 10 });
    const v = await client.get('__health_ping__');
    return { ok: v === '1', detail: 'set_get' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
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
  try {
    await client.incr(key);
  } catch {
    // Redis unavailable or misconfigured — do not fail writes
  }
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

export { buildCacheKey, getCache, setCache, bumpCacheVersion, getRedisClient, pingRedis };
