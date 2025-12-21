import type { ClaudeVisionDocumentType } from './claude.types';

export type OCRStage =
  | 'idle'
  | 'validating'
  | 'preprocessing'
  | 'processing'
  | 'parsing'
  | 'complete'
  | 'error';

export interface OCRProgress {
  stage: OCRStage;
  message?: string;
  progress?: number;
}

export interface OCRImagePayload {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  byteSize: number;
}

export interface OCRResult {
  text: string;
  tokensUsed: number;
  cost: number;
  confidence: number;
  fromCache?: boolean;
  documentType: ClaudeVisionDocumentType;
}

export interface OCRProcessOptions {
  documentType?: ClaudeVisionDocumentType;
  onProgress?: (progress: OCRProgress) => void;
  signal?: AbortSignal;
}
