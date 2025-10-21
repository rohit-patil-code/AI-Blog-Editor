const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    code: err.code
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404, code: 'CAST_ERROR' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400, code: 'DUPLICATE_KEY' };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400, code: 'VALIDATION_ERROR' };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401, code: 'INVALID_TOKEN' };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401, code: 'TOKEN_EXPIRED' };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const field = err.constraint?.replace('_key', '').replace('users_', '').replace('blog_posts_', '');
    const message = `${field || 'Field'} already exists`;
    error = { message, statusCode: 400, code: 'UNIQUE_VIOLATION' };
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced resource not found';
    error = { message, statusCode: 400, code: 'FOREIGN_KEY_VIOLATION' };
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field missing';
    error = { message, statusCode: 400, code: 'NOT_NULL_VIOLATION' };
  }

  if (err.code === '22P02') { // Invalid text representation
    const message = 'Invalid data format';
    error = { message, statusCode: 400, code: 'INVALID_FORMAT' };
  }

  if (err.code === '42P01') { // Undefined table
    const message = 'Database table not found. Please run migrations.';
    error = { message, statusCode: 500, code: 'TABLE_NOT_FOUND' };
  }

  if (err.code === '28P01') { // Invalid password
    const message = 'Database authentication failed';
    error = { message, statusCode: 500, code: 'DB_AUTH_FAILED' };
  }

  if (err.code === '08006') { // Connection failure
    const message = 'Database connection failed';
    error = { message, statusCode: 503, code: 'DB_CONNECTION_FAILED' };
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' };
  }

  res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.detail
      })
    }
  });
};

module.exports = { errorHandler };