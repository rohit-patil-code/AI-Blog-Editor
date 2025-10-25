// ...existing code...
const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');
require('dotenv').config();

class AIService {
  constructor() {
    // Accept GENAI_API_KEY or GEMINI_API_KEY for compatibility
    this.apiKey = process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY || null;

    // Initialize client. The constructor accepts an options object but can also
    // rely on environment-based credentials depending on your setup.
    try {
      this.client = new GoogleGenAI(this.apiKey ? { apiKey: this.apiKey } : {});
      logger.info('✅ Gemini/GenAI client initialized successfully');
    } catch (err) {
      this.client = null;
      logger.warn('⚠️ Failed to initialize GoogleGenAI client:', err?.message || err);
    }

    // Models: primary from env, fallback to a safe text-bison
    this.defaultModel = process.env.GENAI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-latest';
    this.fallbackModel = process.env.GENAI_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'text-bison-001';
  }

  // low-level call wrapper using the same shape you requested:
  // const response = await ai.models.generateContent({ model, contents });
  async _callModel(model, contents, { temperature = 0.7, maxOutputTokens = 600 } = {}) {
    if (!this.client) {
      const e = new Error('Generative client not configured (set GENAI_API_KEY or GEMINI_API_KEY)');
      e.status = 503;
      throw e;
    }

    try {
      const res = await this.client.models.generateContent({
        model,
        contents,
        temperature,
        maxOutputTokens
      });

      // sample client returns object with .text or .output; prefer .text
      const text = res?.text ?? res?.response?.text ?? (Array.isArray(res?.output) ? res.output[0]?.content : undefined) ?? '';

      // tokens used if available (metadata shape varies)
      const tokensUsed = Number(res?.metadata?.tokenCount ?? res?.usage?.totalTokens ?? res?.usage?.total_tokens ?? 0) || 0;

      return { text: String(text), tokensUsed, raw: res };
    } catch (err) {
      // Normalize known errors
      const status = err?.status || err?.code || (err?.message && err.message.includes('quota') ? 429 : undefined);
      const e = new Error(err?.message || 'Generative API error');
      e.status = status || 500;
      e.raw = err;
      throw e;
    }
  }

  // Public: generateContent(prompt, options)
  async generateContent(prompt, options = {}) {
    const { creativity = options.creativity ?? 0.7, length = options.length ?? 'medium', tone = options.tone ?? 'professional' } = options;

    const systemPrompt = this.getSystemPrompt(tone, length);
    const finalPrompt = `${systemPrompt}\n\n${prompt}`;

    const maxOutputTokens = this.getMaxTokens(length);

    // Try primary model then fallback
    try {
      const resp = await this._callModel(this.defaultModel, finalPrompt, { temperature: creativity, maxOutputTokens });
      logger.info('Content generated', { model: this.defaultModel, tokensUsed: resp.tokensUsed });
      return { content: resp.text, tokensUsed: resp.tokensUsed, model: this.defaultModel, timestamp: new Date().toISOString() };
    } catch (err) {
      logger.warn(`Primary model ${this.defaultModel} failed: ${err.message}`);
      // If model-not-found / 404 or failure, try fallback
      try {
        const resp2 = await this._callModel(this.fallbackModel, finalPrompt, { temperature: creativity, maxOutputTokens });
        logger.info('Content generated (fallback)', { model: this.fallbackModel, tokensUsed: resp2.tokensUsed });
        return { content: resp2.text, tokensUsed: resp2.tokensUsed, model: this.fallbackModel, timestamp: new Date().toISOString() };
      } catch (err2) {
        logger.error('Generative content error (fallback):', err2);
        const e = new Error('Failed to generate content (Gemini/GenAI)');
        e.status = err2.status || 500;
        throw e;
      }
    }
  }

  // Grammar correction - ask model to return corrected text only
  async correctGrammar(text) {
    if (!text || !text.trim()) {
      return {
        correctedText: '',
        changes: [],
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Instruct model to return only the corrected text and nothing else.
    const prompt = `You are a professional grammar and style editor. Correct grammar, spelling, punctuation and minor stylistic issues while preserving the original meaning and tone. RETURN ONLY THE CORRECTED TEXT AND NOTHING ELSE (no explanations, no JSON, no metadata).\n\nText:\n${text}`;

    try {
      const resp = await this._callModel(this.defaultModel, prompt, {
        temperature: 0.0,
        maxOutputTokens: Math.min(1200, Math.max(300, Math.ceil(text.length / 2))),
      });

      const correctedText = (resp.text || '').trim();

      return {
        correctedText,
        changes: [], // caller requested corrected text only
        tokensUsed: resp.tokensUsed || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Grammar correction error:', err);
      throw err;
    }
  }

  // Enhance content
  async enhanceContent(text, type) {
    let prompt;
    switch (type) {
      case 'expand':
        prompt = `Expand the following text with more detail and examples while preserving meaning:\n\n${text}`;
        break;
      case 'simplify':
        prompt = `Simplify the following text for a general audience while preserving the key points:\n\n${text}`;
        break;
      case 'improve':
        prompt = `Improve clarity, flow, and impact of the following text:\n\n${text}`;
        break;
      case 'summarize':
        prompt = `Summarize the following text concisely:\n\n${text}`;
        break;
      default:
        prompt = text;
    }

    try {
      const resp = await this._callModel(this.defaultModel, prompt, { temperature: 0.6, maxOutputTokens: 900 });
      return { enhancedText: resp.text, tokensUsed: resp.tokensUsed, timestamp: new Date().toISOString() };
    } catch (err) {
      // try fallback
      try {
        const resp2 = await this._callModel(this.fallbackModel, prompt, { temperature: 0.6, maxOutputTokens: 900 });
        return { enhancedText: resp2.text, tokensUsed: resp2.tokensUsed, timestamp: new Date().toISOString() };
      } catch (err2) {
        logger.error('Enhance content error:', err2);
        throw err2;
      }
    }
  }

  // Generate titles
  async generateTitles(content, count = 5) {
    const prompt = `Generate ${count} SEO-friendly titles (one per line) for the content below. Return plain text, one title per line.\n\n${content}`;
    try {
      const resp = await this._callModel(this.defaultModel, prompt, { temperature: 0.8, maxOutputTokens: 300 });
      const lines = resp.text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, count);
      return { titles: lines, tokensUsed: resp.tokensUsed, timestamp: new Date().toISOString() };
    } catch (err) {
      try {
        const resp2 = await this._callModel(this.fallbackModel, prompt, { temperature: 0.8, maxOutputTokens: 300 });
        const lines2 = resp2.text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, count);
        return { titles: lines2, tokensUsed: resp2.tokensUsed, timestamp: new Date().toISOString() };
      } catch (err2) {
        logger.error('Title generation error:', err2);
        throw err2;
      }
    }
  }

  // Helpers for prompts/tokens
  getSystemPrompt(tone, length) {
    const toneMap = {
      professional: 'Write in a formal, informative tone.',
      casual: 'Write in a friendly, conversational tone.',
      technical: 'Write in a precise, technical tone with clear explanations.',
      creative: 'Write in an imaginative, expressive tone.'
    };
    const lengthMap = {
      short: 'Keep it concise (~100 words).',
      medium: 'Balanced detail (~300 words).',
      long: 'Comprehensive (~600-1000 words).'
    };
    return `You are an expert content writer. ${toneMap[tone] || ''} ${lengthMap[length] || ''}`;
  }

  getMaxTokens(length) {
    const limits = { short: 300, medium: 600, long: 1200 };
    return limits[length] || 600;
  }
}

module.exports = new AIService();
// ...existing code...