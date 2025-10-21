const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all blog posts for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    let queryParams = [req.user.id]; // Changed from req.user.user_id
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM blog_posts ${whereClause}`,
      queryParams
    );
    const totalPosts = parseInt(countResult.rows[0].count);

    // Get posts with pagination
    const postsResult = await query(
      `SELECT post_id, title, content, status, created_at, updated_at 
       FROM blog_posts ${whereClause} 
       ORDER BY updated_at DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const posts = postsResult.rows;

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: offset + posts.length < totalPosts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Get blogs error:', error);
    res.status(500).json({
      error: {
        code: 'BLOGS_FETCH_ERROR',
        message: 'Failed to fetch blog posts',
        statusCode: 500
      }
    });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT post_id, title, content, status, created_at, updated_at FROM blog_posts WHERE post_id = $1 AND user_id = $2',
      [id, req.user.id] // Changed
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Blog post not found',
          statusCode: 404
        }
      });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Get blog error:', error);
    res.status(500).json({
      error: {
        code: 'BLOG_FETCH_ERROR',
        message: 'Failed to fetch blog post',
        statusCode: 500
      }
    });
  }
});

// Create new blog post
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published')
], async (req, res) => {
  try {
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

    const { title, content, status = 'draft' } = req.body;

    const result = await query(
      'INSERT INTO blog_posts (user_id, title, content, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING post_id, title, content, status, created_at, updated_at',
      [req.user.id, title, content, status] // Changed
    );

    const post = result.rows[0];

    logger.info('Blog post created', { 
      postId: post.post_id, 
      userId: req.user.id, // Changed
      title: post.title 
    });

    res.status(201).json({
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    logger.error('Create blog error:', error);
    res.status(500).json({
      error: {
        code: 'BLOG_CREATE_ERROR',
        message: 'Failed to create blog post',
        statusCode: 500
      }
    });
  }
});

// Update blog post
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content cannot be empty'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published')
], async (req, res) => {
  try {
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

    const { id } = req.params;
    const { title, content, status } = req.body;

    const existingPost = await query(
      'SELECT post_id FROM blog_posts WHERE post_id = $1 AND user_id = $2',
      [id, req.user.id] // Changed
    );

    if (existingPost.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Blog post not found',
          statusCode: 404
        }
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (content !== undefined) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      values.push(content);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update',
          statusCode: 400
        }
      });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE blog_posts SET ${updates.join(', ')} WHERE post_id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING post_id, title, content, status, created_at, updated_at`,
      [...values, req.user.id] // Changed
    );

    const post = result.rows[0];

    logger.info('Blog post updated', { 
      postId: post.post_id, 
      userId: req.user.id // Changed
    });

    res.json({
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    logger.error('Update blog error:', error);
    res.status(500).json({
      error: {
        code: 'BLOG_UPDATE_ERROR',
        message: 'Failed to update blog post',
        statusCode: 500
      }
    });
  }
});

// Delete blog post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM blog_posts WHERE post_id = $1 AND user_id = $2 RETURNING post_id, title',
      [id, req.user.id] // Changed
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Blog post not found',
          statusCode: 404
        }
      });
    }

    logger.info('Blog post deleted', { 
      postId: id, 
      userId: req.user.id // Changed
    });

    res.json({
      message: 'Blog post deleted successfully',
      post: result.rows[0]
    });
  } catch (error) {
    logger.error('Delete blog error:', error);
    res.status(500).json({
      error: {
        code: 'BLOG_DELETE_ERROR',
        message: 'Failed to delete blog post',
        statusCode: 500
      }
    });
  }
});

// Publish/unpublish blog post
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'published'].includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either draft or published',
          statusCode: 400
        }
      });
    }

    const result = await query(
      'UPDATE blog_posts SET status = $1, updated_at = NOW() WHERE post_id = $2 AND user_id = $3 RETURNING post_id, title, status, updated_at',
      [status, id, req.user.id] // Changed
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Blog post not found',
          statusCode: 404
        }
      });
    }

    const post = result.rows[0];

    logger.info('Blog post status updated', { 
      postId: post.post_id, 
      userId: req.user.id, // Changed
      status: post.status 
    });

    res.json({
      message: `Blog post ${status} successfully`,
      post
    });
  } catch (error) {
    logger.error('Publish blog error:', error);
    res.status(500).json({
      error: {
        code: 'BLOG_PUBLISH_ERROR',
        message: 'Failed to update blog post status',
        statusCode: 500
      }
    });
  }
});

module.exports = router;