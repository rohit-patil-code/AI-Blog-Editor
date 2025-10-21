const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429
      }
    });
  }
});

// AI-specific rate limiter
const createAIRateLimiter = (maxRequests) => {
  return rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: maxRequests,
    message: {
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI request limit exceeded. Upgrade your plan for more requests.',
        statusCode: 429
      }
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user ? `user:${req.user.user_id}` : `ip:${req.ip}`;
    },
    handler: (req, res) => {
      logger.warn('AI rate limit exceeded', {
        userId: req.user?.user_id,
        ip: req.ip,
        url: req.url
      });
      res.status(429).json({
        error: {
          code: 'AI_RATE_LIMIT_EXCEEDED',
          message: 'AI request limit exceeded. Upgrade your plan for more requests.',
          statusCode: 429
        }
      });
    }
  });
};

// Create rate limiters for different tiers
const freeTierLimiter = createAIRateLimiter(parseInt(process.env.AI_RATE_LIMIT_FREE_TIER) || 50);
const premiumTierLimiter = createAIRateLimiter(parseInt(process.env.AI_RATE_LIMIT_PREMIUM_TIER) || 500);

// Dynamic AI rate limiter based on user tier
const aiRateLimiter = async (req, res, next) => {
  try {
    if (!req.user) {
      // For unauthenticated users, use IP-based limiting
      return generalLimiter(req, res, next);
    }

    // For authenticated users, check their tier
    // For now, we'll use free tier for all users
    // In a real app, you'd check the user's subscription tier
    return freeTierLimiter(req, res, next);
  } catch (error) {
    logger.error('Rate limiter error:', error);
    next();
  }
};

module.exports = {
  generalLimiter,
  aiRateLimiter,
  freeTierLimiter,
  premiumTierLimiter
};

