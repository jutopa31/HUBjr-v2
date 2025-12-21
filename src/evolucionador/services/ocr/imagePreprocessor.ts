import {
  CLAUDE_IMAGE_DEFAULT_QUALITY,
  CLAUDE_IMAGE_MAX_BYTES,
  CLAUDE_IMAGE_MAX_DIMENSION,
  CLAUDE_IMAGE_MIN_QUALITY
} from '../../config/claude.config';
import type { OCRImagePayload } from '../../types/ocr.types';

interface PreprocessOptions {
  maxBytes?: number;
  maxDimension?: number;
  outputMimeType?: OCRImagePayload['mimeType'];
  initialQuality?: number;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
    img.src = dataUrl;
  });

const estimateBase64Bytes = (base64: string): number => Math.ceil((base64.length * 3) / 4);

const extractDataUrl = (dataUrl: string): { mimeType: OCRImagePayload['mimeType']; base64: string } => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
  if (!match) {
    throw new Error('Formato de imagen no soportado.');
  }
  return { mimeType: match[1] as OCRImagePayload['mimeType'], base64: match[2] };
};

const toDataUrl = (base64: string, mimeType: OCRImagePayload['mimeType']): string =>
  `data:${mimeType};base64,${base64}`;

const scaleDimensions = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number; scale: number } => {
  const maxCurrent = Math.max(width, height);
  if (maxCurrent <= maxDimension) {
    return { width, height, scale: 1 };
  }
  const scale = maxDimension / maxCurrent;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale
  };
};

const renderToCanvas = (
  img: HTMLImageElement,
  options: { width: number; height: number }
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el canvas.');
  }
  ctx.drawImage(img, 0, 0, options.width, options.height);
  return canvas;
};

const encodeCanvas = (
  canvas: HTMLCanvasElement,
  mimeType: OCRImagePayload['mimeType'],
  quality: number
): string => {
  return canvas.toDataURL(mimeType, quality);
};

const ensureBrowser = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Preprocesamiento de imagen solo disponible en navegador.');
  }
};

export const preprocessImageDataUrl = async (
  dataUrl: string,
  options: PreprocessOptions = {}
): Promise<OCRImagePayload> => {
  ensureBrowser();
  const outputMimeType = options.outputMimeType || 'image/jpeg';
  const maxBytes = options.maxBytes ?? CLAUDE_IMAGE_MAX_BYTES;
  const maxDimension = options.maxDimension ?? CLAUDE_IMAGE_MAX_DIMENSION;
  const initialQuality = options.initialQuality ?? CLAUDE_IMAGE_DEFAULT_QUALITY;

  const img = await loadImage(dataUrl);
  const { width, height } = scaleDimensions(img.width, img.height, maxDimension);
  let canvas = renderToCanvas(img, { width, height });

  let quality = initialQuality;
  let encoded = encodeCanvas(canvas, outputMimeType, quality);
  let { base64 } = extractDataUrl(encoded);

  while (estimateBase64Bytes(base64) > maxBytes && quality > CLAUDE_IMAGE_MIN_QUALITY) {
    quality = Math.max(CLAUDE_IMAGE_MIN_QUALITY, quality - 0.08);
    encoded = encodeCanvas(canvas, outputMimeType, quality);
    base64 = extractDataUrl(encoded).base64;
  }

  if (estimateBase64Bytes(base64) > maxBytes) {
    const smaller = scaleDimensions(width, height, Math.round(maxDimension * 0.8));
    canvas = renderToCanvas(img, { width: smaller.width, height: smaller.height });
    encoded = encodeCanvas(canvas, outputMimeType, CLAUDE_IMAGE_MIN_QUALITY);
    base64 = extractDataUrl(encoded).base64;
  }

  return {
    base64,
    mimeType: outputMimeType,
    byteSize: estimateBase64Bytes(base64)
  };
};

export const preprocessImageFile = async (
  file: File,
  options: PreprocessOptions = {}
): Promise<OCRImagePayload> => {
  const dataUrl = await readFileAsDataUrl(file);
  return preprocessImageDataUrl(dataUrl, options);
};

export const toDataUrlFromPayload = (payload: OCRImagePayload): string =>
  toDataUrl(payload.base64, payload.mimeType);

export const extractDataUrlInfo = (dataUrl: string): OCRImagePayload => {
  const { base64, mimeType } = extractDataUrl(dataUrl);
  return { base64, mimeType, byteSize: estimateBase64Bytes(base64) };
};
