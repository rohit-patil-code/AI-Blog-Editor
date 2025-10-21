const { query, connectDB } = require('../config/database');
const logger = require('../utils/logger');

const migrations = [
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'create_blog_posts_table',
    sql: `
      CREATE TABLE IF NOT EXISTS blog_posts (
        post_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'create_ai_usage_logs_table',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES blog_posts(post_id) ON DELETE SET NULL,
        feature_type VARCHAR(50) NOT NULL,
        tokens_used INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'create_indexes',
    sql: `
      -- Index for user posts lookup
      CREATE INDEX IF NOT EXISTS idx_user_posts ON blog_posts(user_id, updated_at DESC);
      
      -- Index for post status filtering
      CREATE INDEX IF NOT EXISTS idx_post_status ON blog_posts(status);
      
      -- Index for AI usage analytics
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id, timestamp);
      
      -- Index for email-based authentication
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
  },
  {
    name: 'create_updated_at_trigger',
    sql: `
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      -- Trigger for blog_posts table
      DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
      CREATE TRIGGER update_blog_posts_updated_at
        BEFORE UPDATE ON blog_posts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

async function runMigrations() {
  try {
    await connectDB();
    logger.info('🚀 Starting database migrations...');

    for (const migration of migrations) {
      logger.info(`Running migration: ${migration.name}`);
      await query(migration.sql);
      logger.info(`✅ Migration ${migration.name} completed`);
    }

    logger.info('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

