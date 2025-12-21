import type { ClaudeVisionDocumentType } from '../../types/claude.types';
import type { OCRImagePayload, OCRProcessOptions, OCRProgress, OCRResult } from '../../types/ocr.types';
import { ClaudeVisionService } from '../claude/claudeVisionService';
import { OCRCostCalculator } from './ocrCostCalculator';
import { preprocessImageDataUrl, preprocessImageFile } from './imagePreprocessor';

const isImageFile = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

const emitProgress = (options: OCRProcessOptions | undefined, progress: OCRProgress) => {
  options?.onProgress?.(progress);
};

export const processOcrFile = async (
  file: File,
  options?: OCRProcessOptions
): Promise<OCRResult> => {
  emitProgress(options, { stage: 'validating', message: 'Validando archivo' });

  if (!isImageFile(file)) {
    throw new Error('Formato no soportado. Use PNG, JPG o WEBP.');
  }

  emitProgress(options, { stage: 'preprocessing', message: 'Preparando imagen' });
  const payload = await preprocessImageFile(file);

  return processOcrPayload(payload, options);
};

export const processOcrDataUrl = async (
  dataUrl: string,
  options?: OCRProcessOptions
): Promise<OCRResult> => {
  emitProgress(options, { stage: 'preprocessing', message: 'Preparando imagen' });
  const payload = await preprocessImageDataUrl(dataUrl);
  return processOcrPayload(payload, options);
};

export const processOcrPayload = async (
  payload: OCRImagePayload,
  options?: OCRProcessOptions
): Promise<OCRResult> => {
  const documentType: ClaudeVisionDocumentType = options?.documentType || 'generic';
  emitProgress(options, { stage: 'processing', message: 'Procesando con Claude Vision' });

  const service = new ClaudeVisionService();
  const response = await service.processImage({
    imageBase64: payload.base64,
    imageType: payload.mimeType,
    documentType,
    signal: options?.signal
  });

  emitProgress(options, { stage: 'parsing', message: 'Normalizando respuesta' });

  const result: OCRResult = {
    text: response.extractedText,
    tokensUsed: response.tokensUsed,
    cost: response.cost,
    confidence: response.confidence,
    fromCache: response.fromCache,
    documentType
  };

  const costTracker = new OCRCostCalculator();
  costTracker.track(response.cost);

  emitProgress(options, { stage: 'complete', message: 'OCR completo' });

  return result;
};
