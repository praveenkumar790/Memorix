const { redis } = require('../config/redis');

/**
 * Creates a sliding window rate limiter using Redis Sorted Sets (ZADD).
 * @param {string} prefix - Action identifier (e.g. 'chat', 'ingest')
 * @param {number} limit - Maximum allowed requests in the window
 * @param {number} windowMinutes - Time window in minutes (default: 60)
 */
const createSlidingRateLimiter = (prefix, limit, windowMinutes = 60) => {
  return async (req, res, next) => {
    if (!redis) return next(); // Fail-open if Redis is down
    if (!req.user || !req.user.id) return next();

    try {
      const key = `cache:ratelimit:${prefix}:user:${req.user.id}`;
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;
      const windowStart = now - windowMs;

      // 1. Clean up and count existing requests within the sliding window
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart); // Remove old requests
      pipeline.zcard(key); // Count remaining valid requests
      const results = await pipeline.exec();
      
      const currentCount = results[1][1];

      if (currentCount >= limit) {
        // Find the oldest request to calculate exact reset time
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        let resetTimeMs = now + windowMs; // Fallback to 1hr from now
        
        if (oldest && oldest.length > 1) {
            const oldestTimestamp = parseInt(oldest[1]);
            resetTimeMs = oldestTimestamp + windowMs; // Exactly when the oldest request drops out
        }

        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          resetAt: new Date(resetTimeMs).toISOString(),
          message: `You have reached the free tier limit of ${limit} ${prefix === 'chat' ? 'messages' : 'documents'} per hour. Our Premium Pro tier is coming soon!`
        });
      }

      // Add the current request
      // We use a unique string (timestamp + random) as the member, and the timestamp as the score
      const uniqueId = `${now}-${Math.random().toString(36).substring(2, 9)}`;
      
      const updatePipeline = redis.pipeline();
      updatePipeline.zadd(key, now, uniqueId);
      updatePipeline.expire(key, windowMinutes * 60); // Set overall TTL to prevent memory leaks
      await updatePipeline.exec();

      next();
    } catch (err) {
      console.error(`Rate limit error (${prefix}):`, err);
      next(); // Fail open on Redis errors
    }
  };
};

module.exports = createSlidingRateLimiter;
