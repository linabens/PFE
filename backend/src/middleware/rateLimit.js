const config = require('../config');

/**
 * Rate limit simple en mémoire (par clé). Pour production multi-instances, utiliser Redis.
 */
function createRateLimiter({ windowMs, max, keyFn }) {
  const buckets = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const key = keyFn(req);
    if (!key) return next();

    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      return res.status(429).json({
        success: false,
        error: 'Trop de requêtes — réessayez plus tard.',
      });
    }
    next();
  };
}

const orderCreateRateLimiter = createRateLimiter({
  windowMs: config.orderRateLimitWindowMs,
  max: config.orderRateLimitMax,
  keyFn: (req) => (req.session && req.session.id ? `order:session:${req.session.id}` : null),
});

module.exports = { createRateLimiter, orderCreateRateLimiter };
