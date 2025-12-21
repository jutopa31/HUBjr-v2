export const CLAUDE_VISION_MODEL = 'claude-3-5-sonnet-20241022';
export const CLAUDE_VISION_MAX_TOKENS = 2048;

export const CLAUDE_OCR_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

export const CLAUDE_IMAGE_MAX_BYTES = 800 * 1024;
export const CLAUDE_IMAGE_MAX_DIMENSION = 2000;
export const CLAUDE_IMAGE_MIN_QUALITY = 0.6;
export const CLAUDE_IMAGE_DEFAULT_QUALITY = 0.9;

export const CLAUDE_COST_RATES = {
  inputPer1k: 0.003,
  outputPer1k: 0.015,
  cacheReadPer1k: 0.0003
};
