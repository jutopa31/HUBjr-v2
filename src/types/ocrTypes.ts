// Tipos para el sistema OCR y procesamiento de documentos

export interface OCRResult {
  text: string;
  confidence: number;
  words: number;
  processing_time: number;
  method: 'direct' | 'ocr' | 'image_ocr';
  source_file: string;
}

export interface PDFResult {
  text: string;
  method: 'direct' | 'ocr';
  confidence: number;
  pages: number;
  source_file: string;
}

export interface ProcessingResult {
  text: string;
  method: 'direct' | 'ocr' | 'image_ocr';
  confidence: number;
  source_file: string;
  processing_time: number;
  file_size: number;
  pages?: number;
  words?: number;
  enhanced?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: string;
  size?: number;
}

export interface OCRProgress {
  progress: number;
  status: 'initializing' | 'processing' | 'enhancing' | 'recognizing' | 'completed' | 'error';
  currentFile?: string;
  totalFiles?: number;
  currentFileIndex?: number;
}

export interface EnhancementSettings {
  upscale: boolean;
  binarization: boolean;
  contrast: number;
  brightness: number;
  denoising: boolean;
}

export interface OCRSettings {
  language: 'spa' | 'eng' | 'spa+eng';
  pageSegmentationMode: number;
  characterWhitelist?: string;
  enhance: boolean;
  enhancementSettings: EnhancementSettings;
}

export interface BatchProcessingResult {
  total: number;
  successful: number;
  failed: number;
  results: ProcessingResult[];
  errors: { file: string; error: string }[];
  totalProcessingTime: number;
}

export type SupportedFileType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/tiff' | 'image/bmp' | 'image/webp';

export const DEFAULT_OCR_SETTINGS: OCRSettings = {
  language: 'spa+eng',
  pageSegmentationMode: 1, // PSM.AUTO
  characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?()[]{}"-\'áéíóúñüÁÉÍÓÚÑÜ',
  enhance: true,
  enhancementSettings: {
    upscale: true,
    binarization: true,
    contrast: 1.2,
    brightness: 1.0,
    denoising: true
  }
};

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/bmp',
  'image/webp'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_BATCH = 10;