const { query, connectDB } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    await connectDB();
    logger.info('🌱 Starting database seeding...');

    // Check if users already exist
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      logger.info('Database already seeded, skipping...');
      process.exit(0);
    }

    // Create sample users
    const users = [
      {
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'DemoPassword123!'
      },
      {
        username: 'test_writer',
        email: 'writer@example.com',
        password: 'WriterPass123!'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        [user.username, user.email, hashedPassword]
      );
      logger.info(`Created user: ${user.username}`);
    }

    // Get user IDs
    const userResult = await query('SELECT user_id, username FROM users');
    const userIds = userResult.rows;

    // Create sample blog posts
    const samplePosts = [
      {
        user_id: userIds[0].user_id,
        title: 'Welcome to AI-Powered Blog Editor',
        content: `
          <h2>Welcome to the Future of Content Creation</h2>
          <p>This is a sample blog post created with our AI-powered blog editor. The editor provides real-time grammar correction, content generation, and intelligent writing assistance.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>AI content generation with customizable parameters</li>
            <li>Real-time grammar and style correction</li>
            <li>Smart content enhancements (expand, simplify, improve, summarize)</li>
            <li>Title suggestion generation</li>
            <li>Usage analytics and tracking</li>
          </ul>
          
          <p>Start writing your next great article with the power of AI at your fingertips!</p>
        `,
        status: 'published'
      },
      {
        user_id: userIds[0].user_id,
        title: 'The Art of Writing with AI',
        content: `
          <h2>Embracing AI as Your Writing Partner</h2>
          <p>Artificial Intelligence is revolutionizing how we create content. Instead of replacing human creativity, AI serves as a powerful tool that enhances our writing capabilities.</p>
          
          <h3>Benefits of AI-Assisted Writing:</h3>
          <ul>
            <li><strong>Overcome Writer's Block:</strong> AI can help generate ideas and content when you're stuck</li>
            <li><strong>Improve Quality:</strong> Real-time grammar and style suggestions help polish your work</li>
            <li><strong>Save Time:</strong> Focus on ideas while AI handles the technical aspects</li>
            <li><strong>Learn and Grow:</strong> AI suggestions help you become a better writer over time</li>
          </ul>
          
          <p>Remember, the best content comes from the perfect blend of human creativity and AI assistance.</p>
        `,
        status: 'draft'
      },
      {
        user_id: userIds[1].user_id,
        title: 'Getting Started with Our Blog Editor',
        content: `
          <h2>Your First Steps</h2>
          <p>Ready to start creating amazing content? Here's how to get the most out of our AI-powered blog editor:</p>
          
          <h3>Step 1: Create Your Account</h3>
          <p>Sign up for a free account to start using all the AI features.</p>
          
          <h3>Step 2: Start Writing</h3>
          <p>Create a new blog post and begin writing. The AI will assist you in real-time.</p>
          
          <h3>Step 3: Use AI Features</h3>
          <p>Try out the various AI features like content generation, grammar correction, and content enhancement.</p>
          
          <p>Happy writing!</p>
        `,
        status: 'published'
      }
    ];

    for (const post of samplePosts) {
      await query(
        'INSERT INTO blog_posts (user_id, title, content, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'1 day\' * RANDOM() * 7, NOW() - INTERVAL \'1 day\' * RANDOM() * 7)',
        [post.user_id, post.title, post.content, post.status]
      );
      logger.info(`Created blog post: ${post.title}`);
    }

    // Create some sample AI usage logs
    const usageLogs = [
      { user_id: userIds[0].user_id, feature_type: 'generate', tokens_used: 150 },
      { user_id: userIds[0].user_id, feature_type: 'grammar', tokens_used: 75 },
      { user_id: userIds[0].user_id, feature_type: 'enhance_improve', tokens_used: 200 },
      { user_id: userIds[1].user_id, feature_type: 'titles', tokens_used: 50 },
      { user_id: userIds[1].user_id, feature_type: 'generate', tokens_used: 300 }
    ];

    for (const log of usageLogs) {
      await query(
        'INSERT INTO ai_usage_logs (user_id, feature_type, tokens_used, timestamp) VALUES ($1, $2, $3, NOW() - INTERVAL \'1 day\' * RANDOM() * 30)',
        [log.user_id, log.feature_type, log.tokens_used]
      );
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('📝 Sample users created:');
    logger.info('  - demo@example.com / DemoPassword123!');
    logger.info('  - writer@example.com / WriterPass123!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();

