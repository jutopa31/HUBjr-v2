export type ClaudeVisionDocumentType = 'form' | 'lab_report' | 'imaging_report' | 'generic';

export type ClaudeVisionModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307';

export interface ClaudeVisionRequest {
  imageBase64: string;
  imageType: 'image/jpeg' | 'image/png' | 'image/webp';
  prompt: string;
  model?: ClaudeVisionModel;
}

export interface ClaudeVisionUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeVisionResponse {
  extractedText: string;
  confidence: number;
  processingTimeMs: number;
  tokensUsed: number;
  cost: number;
  fromCache?: boolean;
}

export interface ClaudeVisionCacheEntry {
  data: ClaudeVisionResponse;
  timestamp: number;
  expiresAt: number;
  cost: number;
}

export interface ClaudeVisionCacheStats {
  totalEntries: number;
  totalCostSaved: number;
  hitRate: number;
  oldestEntry: number;
}
