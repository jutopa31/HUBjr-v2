import {
  extractTextFromPdf,
  extractTextFromImage,
  isSupportedOCRFile,
  type OCRResult,
  type OCRProgress
} from './ocrService';

export interface OCRAutoProgress extends OCRProgress {
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  stageLabel?: string;
}

export interface OCRAutoResult extends OCRResult {
  fileName: string;
}

export interface OCRAutoOptions {
  onProgress?: (progress: OCRAutoProgress) => void;
  minChars?: number;
  preferImageOcr?: boolean;
}

const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const normalizeStudyText = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const mergeWarnings = (primary?: string[], extra?: string[]): string[] | undefined => {
  const combined = [...(primary || []), ...(extra || [])].filter(Boolean);
  if (combined.length === 0) return undefined;
  return Array.from(new Set(combined));
};

const emitProgress = (
  options: OCRAutoOptions | undefined,
  progress: OCRProgress,
  fileName: string,
  fileIndex: number,
  totalFiles: number,
  stageLabel?: string
) => {
  options?.onProgress?.({
    ...progress,
    fileName,
    fileIndex,
    totalFiles,
    stageLabel
  });
};

const processFileSequentially = async (
  file: File,
  fileIndex: number,
  totalFiles: number,
  options?: OCRAutoOptions
): Promise<OCRAutoResult> => {
  emitProgress(
    options,
    { stage: 'initial', message: 'Validando archivo' },
    file.name,
    fileIndex,
    totalFiles,
    'Validando archivo'
  );

  if (!isSupportedOCRFile(file)) {
    throw new Error(`Formato no soportado para ${file.name}. Usa PDF, PNG o JPG.`);
  }

  const minChars = options?.minChars ?? 40;

  let primaryResult: OCRResult | null = null;

  if (isPdfFile(file)) {
    try {
      primaryResult = await extractTextFromPdf(file, (progress) =>
        emitProgress(
          options,
          progress,
          file.name,
          fileIndex,
          totalFiles,
          progress.stage === 'pdf-text-extraction' ? 'Extrayendo texto de PDF' : 'Cargando PDF'
        )
      );
    } catch (pdfError) {
      // Si falla el lector de PDF, devolvemos advertencia sin romper el flujo
      console.error('[ocrAutoService] PDF extraction failed, skipping PDF text path:', pdfError);
      return {
        fileName: file.name,
        text: '',
        method: 'pdf-text',
        warnings: ['No se pudo leer el PDF. Convierta a imagen (JPG/PNG) o reintente.']
      };
    }
  }

  if (!primaryResult && !isPdfFile(file)) {
    primaryResult = await extractTextFromImage(file, (progress) =>
      emitProgress(options, progress, file.name, fileIndex, totalFiles, 'Aplicando OCR a imagen')
    );
  }

  if (!primaryResult) {
    return {
      fileName: file.name,
      text: '',
      method: isPdfFile(file) ? 'pdf-text' : 'image-ocr',
      warnings: ['No se pudo procesar el archivo. Convierta a imagen (JPG/PNG) o reintente.']
    };
  }

  const normalizedPrimary = normalizeStudyText(primaryResult.text);
  const shouldFallbackToImage =
    isPdfFile(file) && !options?.preferImageOcr && normalizedPrimary.length < minChars;

  let finalResult = primaryResult;

  if (shouldFallbackToImage) {
    // Solo intentamos fallback de imagen si el archivo es imagen; para PDF pedimos convertir a imagen
    if (!isPdfFile(file)) {
      const imageResult = await extractTextFromImage(file, (progress) =>
        emitProgress(options, progress, file.name, fileIndex, totalFiles, 'OCR de respaldo en imagen')
      );
      const normalizedImageText = normalizeStudyText(imageResult.text);

      finalResult =
        normalizedImageText.length > normalizedPrimary.length
          ? imageResult
          : { ...primaryResult, warnings: mergeWarnings(primaryResult.warnings, ['Texto PDF escaso; se mantuvo extraccion primaria']) };
    } else {
      finalResult = {
        ...primaryResult,
        warnings: mergeWarnings(primaryResult.warnings, ['Texto PDF escaso; convierta a imagen para mejorar OCR'])
      };
    }
  }

  return {
    ...finalResult,
    fileName: file.name,
    text: normalizeStudyText(finalResult.text),
    warnings: mergeWarnings(finalResult.warnings, shouldFallbackToImage ? ['Se aplico OCR secuencial para mejorar el texto'] : [])
  };
};

export const runSequentialOcr = async (
  files: File[],
  options?: OCRAutoOptions
): Promise<{ results: OCRAutoResult[]; mergedText: string }> => {
  if (files.length === 0) {
    return { results: [], mergedText: '' };
  }

  const results: OCRAutoResult[] = [];
  const totalFiles = files.length;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileIndex = index + 1;
    const result = await processFileSequentially(file, fileIndex, totalFiles, options);
    results.push(result);
    emitProgress(
      options,
      { stage: 'complete', message: 'Archivo procesado' },
      file.name,
      fileIndex,
      totalFiles,
      'Archivo procesado'
    );
  }

  return {
    results,
    mergedText: mergeResults(results)
  };
};

const mergeResults = (results: OCRAutoResult[]): string =>
  results
    .map((result) => {
      const safeText = normalizeStudyText(result.text);
      return safeText ? `- ${result.fileName}: ${safeText}` : `- ${result.fileName}: (sin texto detectado)`;
    })
    .join('\n\n')
    .trim();

export const appendStudyText = (current: string, incoming: string): string => {
  const existing = current?.trim() || '';
  const next = incoming.trim();
  if (!next) return existing;
  if (!existing) return next;
  return `${existing}\n\n${next}`;
};
