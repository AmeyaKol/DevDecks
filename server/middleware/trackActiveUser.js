import { getRedisClient } from '../services/cache.js';
import logger from '../utils/logger.js';

/**
 * Fire-and-forget: mark user active (5 min TTL) and add to today's DAU set in Redis.
 * Does not block the request; safe when Redis is down or unset.
 */
export const scheduleTrackActiveUser = (user) => {
  if (!user?._id) return;
  void (async () => {
    try {
      const client = getRedisClient();
      if (!client) return;
      const id = user._id.toString();
      await client.set(`active:${id}`, String(Date.now()), { ex: 300 });
      const today = new Date().toISOString().split('T')[0];
      await client.sadd(`dau:${today}`, id);
      await client.expire(`dau:${today}`, 86400 * 7);
    } catch (err) {
      logger.warn('trackActiveUser redis error', { message: err.message });
    }
  })();
};
