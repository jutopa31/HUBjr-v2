// Using Claude 3 Opus as Claude 3.5 Sonnet is not available for this API key
export const CLAUDE_VISION_MODEL = 'claude-3-opus-20240229';
export const CLAUDE_VISION_MAX_TOKENS = 2048;

export const CLAUDE_OCR_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

export const CLAUDE_IMAGE_MAX_BYTES = 800 * 1024;
export const CLAUDE_IMAGE_MAX_DIMENSION = 2000;
export const CLAUDE_IMAGE_MIN_QUALITY = 0.6;
export const CLAUDE_IMAGE_DEFAULT_QUALITY = 0.9;

// Claude 3 Opus pricing (February 29, 2024 version)
// Source: https://www.anthropic.com/pricing
export const CLAUDE_COST_RATES = {
  inputPer1k: 0.015,  // Claude 3 Opus input cost
  outputPer1k: 0.075,  // Claude 3 Opus output cost
  cacheReadPer1k: 0.0015
};
