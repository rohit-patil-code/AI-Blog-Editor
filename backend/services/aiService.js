const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('⚠️ OPENAI_API_KEY not found in environment variables');
      this.client = null;
    } else {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      logger.info('✅ OpenAI client initialized successfully');
    }
  }

  // Generate content based on prompt
  async generateContent(prompt, options = {}) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const {
        tone = 'professional',
        length = 'medium',
        creativity = 0.7
      } = options;

      const systemPrompt = this.getSystemPrompt(tone, length);
      const maxTokens = this.getMaxTokens(length);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: creativity,
        max_tokens: maxTokens
      });

      const content = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      logger.info('Content generated', { 
        promptLength: prompt.length, 
        tokensUsed, 
        contentLength: content.length 
      });

      return {
        content,
        tokensUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  // Correct grammar and style
  async correctGrammar(text) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional grammar and style editor. Correct any grammar, spelling, punctuation, and style issues in the provided text. Return the corrected text and a list of changes made. Format your response as JSON with "correctedText" and "changes" fields. The changes should include the original text, corrected text, position, and reason for each change.`
          },
          {
            role: 'user',
            content: `Please correct the grammar and style in this text:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content);
      const tokensUsed = response.usage.total_tokens;

      logger.info('Grammar corrected', { 
        textLength: text.length, 
        tokensUsed, 
        changesCount: result.changes?.length || 0 
      });

      return {
        correctedText: result.correctedText,
        changes: result.changes || [],
        tokensUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Grammar correction error:', error);
      throw new Error('Failed to correct grammar');
    }
  }

  // Enhance content (expand, simplify, improve, summarize)
  async enhanceContent(text, type) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const prompts = {
        expand: `Expand the following text to provide more detail, examples, and context while maintaining the original meaning and tone:\n\n${text}`,
        simplify: `Simplify the following text to make it more accessible and easier to understand while keeping the key information:\n\n${text}`,
        improve: `Improve the following text by enhancing clarity, flow, and impact while maintaining the original meaning:\n\n${text}`,
        summarize: `Summarize the following text into a concise version that captures the main points:\n\n${text}`
      };

      const systemPrompts = {
        expand: 'You are a content writer who excels at expanding ideas with relevant details and examples.',
        simplify: 'You are a technical writer who specializes in making complex content accessible to all audiences.',
        improve: 'You are a professional editor who enhances content for better readability and impact.',
        summarize: 'You are a skilled summarizer who can distill content to its essential points.'
      };

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompts[type] },
          { role: 'user', content: prompts[type] }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const enhancedText = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      logger.info('Content enhanced', { 
        type, 
        textLength: text.length, 
        tokensUsed, 
        enhancedLength: enhancedText.length 
      });

      return {
        enhancedText,
        tokensUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Content enhancement error:', error);
      throw new Error('Failed to enhance content');
    }
  }

  // Generate title suggestions
  async generateTitles(content, count = 5) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional content strategist who creates compelling, SEO-friendly titles. Generate ${count} different title options for the given content. Return only the titles, one per line, without numbering or bullet points.`
          },
          {
            role: 'user',
            content: `Generate ${count} title suggestions for this content:\n\n${content}`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const titles = response.choices[0].message.content
        .split('\n')
        .map(title => title.trim())
        .filter(title => title.length > 0)
        .slice(0, count);

      const tokensUsed = response.usage.total_tokens;

      logger.info('Titles generated', { 
        contentLength: content.length, 
        tokensUsed, 
        titlesCount: titles.length 
      });

      return {
        titles,
        tokensUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Title generation error:', error);
      throw new Error('Failed to generate titles');
    }
  }

  // Get system prompt based on tone and length
  getSystemPrompt(tone, length) {
    const toneInstructions = {
      professional: 'Write in a professional, formal tone suitable for business and academic contexts.',
      casual: 'Write in a friendly, conversational tone that feels approachable and engaging.',
      technical: 'Write in a precise, technical tone with clear explanations and terminology.',
      creative: 'Write in an imaginative, expressive tone that captivates and inspires readers.'
    };

    const lengthInstructions = {
      short: 'Keep the response concise and to the point (100-200 words).',
      medium: 'Provide a balanced response with good detail (300-500 words).',
      long: 'Create a comprehensive, detailed response (600-1000 words).'
    };

    return `You are an expert content writer. ${toneInstructions[tone]} ${lengthInstructions[length]} Focus on creating high-quality, engaging content that provides value to readers.`;
  }

  // Get max tokens based on length
  getMaxTokens(length) {
    const tokenLimits = {
      short: 300,
      medium: 600,
      long: 1200
    };
    return tokenLimits[length] || 600;
  }
}

module.exports = new AIService();