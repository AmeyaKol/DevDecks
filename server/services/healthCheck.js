import mongoose from 'mongoose';
import { pingRedis } from './cache.js';

export const getHealthPayload = async () => {
  const mongoReady = mongoose.connection.readyState;
  const mongo = mongoReady === 1 ? 'connected' : 'disconnected';

  let redis = 'not_configured';
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const pr = await pingRedis();
    redis = pr.ok ? 'connected' : `error:${pr.reason || pr.detail || 'ping_failed'}`;
  }

  const healthy = mongoReady === 1;

  return {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongo,
    redis,
  };
};
