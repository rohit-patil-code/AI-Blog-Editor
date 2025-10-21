const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// All AI routes require authentication and rate limiting
router.use(authenticateToken);
router.use(aiRateLimiter);

// Generate content
router.post('/generate', [
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Prompt must be between 10 and 2000 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'technical', 'creative'])
    .withMessage('Tone must be professional, casual, technical, or creative'),
  body('length')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Length must be short, medium, or long'),
  body('creativity')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Creativity must be between 0 and 1')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400
        }
      });
    }

    const { prompt, tone, length, creativity } = req.body;

    const result = await aiService.generateContent(prompt, {
      tone,
      length,
      creativity
    });

    // Log AI usage
    await logAIUsage(req.user.user_id, null, 'generate', result.tokensUsed);

    res.json({
      content: result.content,
      tokensUsed: result.tokensUsed,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error('AI generate error:', error);
    res.status(500).json({
      error: {
        code: 'AI_GENERATE_ERROR',
        message: 'Failed to generate content',
        statusCode: 500
      }
    });
  }
});

// Grammar correction
router.post('/grammar', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400
        }
      });
    }

    const { text } = req.body;

    const result = await aiService.correctGrammar(text);

    // Log AI usage
    await logAIUsage(req.user.user_id, null, 'grammar', result.tokensUsed);

    res.json({
      correctedText: result.correctedText,
      changes: result.changes,
      tokensUsed: result.tokensUsed,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error('AI grammar error:', error);
    res.status(500).json({
      error: {
        code: 'AI_GRAMMAR_ERROR',
        message: 'Failed to correct grammar',
        statusCode: 500
      }
    });
  }
});

// Content enhancement
router.post('/enhance', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  body('type')
    .isIn(['expand', 'simplify', 'improve', 'summarize'])
    .withMessage('Type must be expand, simplify, improve, or summarize')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400
        }
      });
    }

    const { text, type } = req.body;

    const result = await aiService.enhanceContent(text, type);

    // Log AI usage
    await logAIUsage(req.user.user_id, null, `enhance_${type}`, result.tokensUsed);

    res.json({
      enhancedText: result.enhancedText,
      tokensUsed: result.tokensUsed,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error('AI enhance error:', error);
    res.status(500).json({
      error: {
        code: 'AI_ENHANCE_ERROR',
        message: 'Failed to enhance content',
        statusCode: 500
      }
    });
  }
});

// Generate title suggestions
router.post('/titles', [
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400
        }
      });
    }

    const { content, count = 5 } = req.body;

    const result = await aiService.generateTitles(content, count);

    // Log AI usage
    await logAIUsage(req.user.user_id, null, 'titles', result.tokensUsed);

    res.json({
      titles: result.titles,
      tokensUsed: result.tokensUsed,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error('AI titles error:', error);
    res.status(500).json({
      error: {
        code: 'AI_TITLES_ERROR',
        message: 'Failed to generate titles',
        statusCode: 500
      }
    });
  }
});

// Get AI usage analytics
router.get('/usage', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);

    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PERIOD',
          message: 'Period must be between 1 and 365 days',
          statusCode: 400
        }
      });
    }

    // Get usage statistics
    const usageResult = await query(
      `SELECT 
        feature_type,
        COUNT(*) as request_count,
        SUM(tokens_used) as total_tokens,
        AVG(tokens_used) as avg_tokens_per_request
       FROM ai_usage_logs 
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY feature_type
       ORDER BY request_count DESC`,
      [req.user.user_id]
    );

    // Get daily usage for the period
    const dailyResult = await query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as requests,
        SUM(tokens_used) as tokens
       FROM ai_usage_logs 
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(timestamp)
       ORDER BY date DESC`,
      [req.user.user_id]
    );

    // Get total usage
    const totalResult = await query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens
       FROM ai_usage_logs 
       WHERE user_id = $1`,
      [req.user.user_id]
    );

    const total = totalResult.rows[0];

    res.json({
      period: `${days} days`,
      total: {
        requests: parseInt(total.total_requests) || 0,
        tokens: parseInt(total.total_tokens) || 0
      },
      byFeature: usageResult.rows,
      dailyUsage: dailyResult.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI usage error:', error);
    res.status(500).json({
      error: {
        code: 'AI_USAGE_ERROR',
        message: 'Failed to fetch AI usage data',
        statusCode: 500
      }
    });
  }
});

// Helper function to log AI usage
async function logAIUsage(userId, postId, featureType, tokensUsed) {
  try {
    await query(
      'INSERT INTO ai_usage_logs (user_id, post_id, feature_type, tokens_used, timestamp) VALUES ($1, $2, $3, $4, NOW())',
      [userId, postId, featureType, tokensUsed]
    );
  } catch (error) {
    logger.error('Failed to log AI usage:', error);
    // Don't throw error as this shouldn't break the main flow
  }
}

module.exports = router;

