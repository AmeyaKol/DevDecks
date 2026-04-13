import mongoose from 'mongoose';
import User from '../models/User.js';
import Deck from '../models/Deck.js';
import Flashcard from '../models/Flashcard.js';
import Folder from '../models/Folder.js';
import { getRedisClient, pingRedis } from './cache.js';
import { getMetricsSnapshot } from './usageMetrics.js';

const ACTIVE_KEY_PREFIX = 'active:';

/**
 * Admin metrics: Mongo totals, optional Redis active/DAU, in-process traffic snapshot.
 * Redis active count uses KEYS (admin-only, low frequency); fine for modest scale.
 */
export const buildAdminMetrics = async () => {
  const memory = process.memoryUsage();
  const trafficSinceDeploy = getMetricsSnapshot();

  const [totalUsers, totalDecks, totalCards, totalFolders] = await Promise.all([
    User.countDocuments(),
    Deck.countDocuments(),
    Flashcard.countDocuments(),
    Folder.countDocuments(),
  ]);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const cardsCreatedToday = await Flashcard.countDocuments({
    createdAt: { $gte: todayStart },
  });

  const redis = {
    configured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    ping: null,
    activeUsersNow: null,
    dailyActiveUsers: {},
    note: null,
  };

  const client = getRedisClient();
  if (client) {
    try {
      const ping = await pingRedis();
      redis.ping = ping.ok ? 'ok' : `fail:${ping.reason || ping.detail || 'unknown'}`;
      const keys = await client.keys(`${ACTIVE_KEY_PREFIX}*`);
      redis.activeUsersNow = Array.isArray(keys) ? keys.length : 0;
      redis.note =
        'activeUsersNow uses KEYS active:* (admin-only). For very large keyspaces prefer a dedicated counter.';

      const dauData = {};
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        dauData[dateStr] = await client.scard(`dau:${dateStr}`);
      }
      redis.dailyActiveUsers = dauData;
    } catch (e) {
      redis.error = e.message;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory,
    },
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    trafficSinceDeploy,
    totals: {
      users: totalUsers,
      decks: totalDecks,
      cards: totalCards,
      folders: totalFolders,
    },
    cardsCreatedToday,
    redis,
    usageEventsPreview: {},
  };
};
