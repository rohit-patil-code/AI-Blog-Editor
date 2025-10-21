const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

const buildPool = (sslMode) => {
  let ssl;
  const mode = (sslMode || 'prefer').toLowerCase();

  if (['disable', 'false', 'off', '0'].includes(mode)) {
    ssl = false;
  } else {
    // 'require' or 'prefer' both start with SSL on
    ssl = { rejectUnauthorized: false };
  }

  return new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl
  });
};

let pool = buildPool(process.env.DB_SSL);

// Test database connection with SSL fallback if needed
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    logger.info('✅ Database connected');
    logger.info(`📊 Time: ${result.rows[0].now}`);
    logger.info(`🗄️ Version: ${result.rows[0].version}`);
    client.release();
  } catch (error) {
    const msg = String(error?.message || '');
    const sslMode = (process.env.DB_SSL || 'prefer').toLowerCase();

    // If SSL is enabled (require/prefer) and server says it doesn't support SSL, retry without SSL
    if (msg.includes('does not support SSL') && sslMode !== 'disable') {
      logger.warn('⚠️ Server does not support SSL. Retrying without SSL...');
      try {
        // Close previous pool before recreating
        await pool.end().catch(() => {});
        pool = buildPool('disable'); // no SSL
        const client = await pool.connect();
        const result = await client.query('SELECT NOW(), version()');
        logger.info('✅ Database connected without SSL');
        logger.info(`📊 Time: ${result.rows[0].now}`);
        logger.info(`🗄️ Version: ${result.rows[0].version}`);
        client.release();
        return;
      } catch (e2) {
        logger.error('❌ Fallback (non-SSL) connection failed:', e2.message);
        throw e2;
      }
    }

    logger.error('❌ Database connection failed:', error.message);
    logger.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      sslMode: process.env.DB_SSL || 'prefer'
    });
    throw error;
  }
};

// Execute query with the current pool
const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: result.rowCount });
  return result;
};

// Get client from pool for transactions
const getClient = async () => pool.connect();

// Graceful shutdown
const closePool = async () => {
  await pool.end();
  logger.info('✅ Database pool closed');
};

module.exports = {
  get pool() { return pool; }, // expose current pool
  connectDB,
  query,
  getClient,
  closePool
};