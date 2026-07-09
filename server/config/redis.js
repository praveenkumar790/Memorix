const Redis = require('ioredis');

// Initialize Redis client using REDIS_URL from env, with a fallback for local dev
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// maxRetriesPerRequest ensures we don't hang if Redis goes completely down
const redis = new Redis(redisUrl, {
  family: 0, // Allows Node to resolve both IPv4 and IPv6 (prevents Upstash connection hangs)
  maxRetriesPerRequest: 1,
  showFriendlyErrorStack: true,
  retryStrategy(times) {
    // Backoff up to 2 seconds
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  // Only log, never crash the app
  console.error('[Redis Error]', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

/**
 * Gets a parsed JSON value from the cache.
 * Returns null if not found OR if there's a Redis error.
 */
async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[Redis] getCache error for key ${key}:`, error.message);
    return null; // Fall through to DB
  }
}

/**
 * Sets a JSON value in the cache with a mandatory TTL (in seconds).
 */
async function setCache(key, value, ttlSeconds) {
  if (!ttlSeconds) {
    console.error(`[Redis] WARNING: setCache called without TTL for key ${key}. Defaulting to 60s.`);
    ttlSeconds = 60;
  }
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`[Redis] setCache error for key ${key}:`, error.message);
  }
}

/**
 * Deletes a key from the cache (for invalidation).
 */
async function deleteCache(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] deleteCache error for key ${key}:`, error.message);
  }
}

module.exports = {
  redis,
  getCache,
  setCache,
  deleteCache
};
