import Tesseract from 'tesseract.js';

export type OCRMethod = 'pdf-text' | 'image-ocr';

export interface OCRProgress {
  stage: 'initial' | 'loading' | 'pdf-text-extraction' | 'image-ocr' | 'complete';
  progress?: number;
  processedPages?: number;
  totalPages?: number;
  message?: string;
}

export interface OCRResult {
  text: string;
  method: OCRMethod;
  warnings?: string[];
  meta?: {
    pageCount?: number;
    languageHint?: string;
    elapsedMs?: number;
  };
}

const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';
let pdfjsPromise: Promise<any> | null = null;

const loadPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist');
  }
  const module = await pdfjsPromise;
  const pdfjsLib = (module as any).getDocument ? module : (module as any).default;
  const globalOptions = (pdfjsLib as any)?.GlobalWorkerOptions;
  if (globalOptions && !globalOptions.workerSrc) {
    globalOptions.workerSrc = PDF_WORKER_SRC;
  }
  return pdfjsLib;
};

const normalizeWhitespace = (text: string): string =>
  text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();

const isPdf = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const isImage = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(png|jpe?g|bmp|tiff)$/i.test(file.name);

export const extractTextFromPdf = async (
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
  const start = performance.now();
  onProgress?.({ stage: 'loading', progress: 0 });

  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let combinedText = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');

    combinedText += `${pageText}\n\n`;
    onProgress?.({
      stage: 'pdf-text-extraction',
      processedPages: pageNumber,
      totalPages: pdf.numPages,
      progress: pageNumber / pdf.numPages,
    });
  }

  const cleanedText = normalizeWhitespace(combinedText);

  return {
    text: cleanedText,
    method: 'pdf-text',
    meta: {
      pageCount: pdf.numPages,
      elapsedMs: performance.now() - start,
    },
    warnings: cleanedText ? undefined : ['No se detectó texto en el PDF, considere usar OCR'],
  };
};

export const extractTextFromImage = async (
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
  const start = performance.now();
  onProgress?.({ stage: 'loading', progress: 0 });

  const { data } = await Tesseract.recognize(file, 'spa+eng', {
    logger: ({ progress, status }) => {
      onProgress?.({ stage: 'image-ocr', progress, message: status });
    },
  });

  const cleanedText = normalizeWhitespace(data.text);

  return {
    text: cleanedText,
    method: 'image-ocr',
    meta: {
      languageHint: 'spa+eng',
      elapsedMs: performance.now() - start,
    },
    warnings: cleanedText ? undefined : ['OCR no detectó texto legible en la imagen'],
  };
};

export const extractTextFromDocument = async (
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
  if (isPdf(file)) {
    return extractTextFromPdf(file, onProgress);
  }

  if (isImage(file)) {
    return extractTextFromImage(file, onProgress);
  }

  throw new Error('Formato de archivo no soportado. Use PDF, PNG o JPG.');
};

export const isSupportedOCRFile = (file: File): boolean => isPdf(file) || isImage(file);
