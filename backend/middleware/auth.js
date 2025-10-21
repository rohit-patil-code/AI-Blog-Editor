const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required',
          statusCode: 401
        }
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
              statusCode: 401
            }
          });
        }
        return res.status(403).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
            statusCode: 403
          }
        });
      }

      // Get user from database - USE user_id column name
      try {
        const result = await query('SELECT user_id, username, email, created_at FROM users WHERE user_id = $1', [decoded.id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
              statusCode: 404
            }
          });
        }

        // Map user_id to id for consistency in req.user
        const user = result.rows[0];
        req.user = {
          id: user.user_id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        };
        next();
      } catch (dbError) {
        logger.error('Database error in auth middleware:', dbError);
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error fetching user',
            statusCode: 500
          }
        });
      }
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        statusCode: 500
      }
    });
  }
};

// Optional: Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
        statusCode: 403
      }
    });
  }
};

module.exports = {
  authenticateToken,
  isAdmin
};