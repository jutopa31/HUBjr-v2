import { useCallback, useRef, useState } from 'react';
import type { OCRProcessOptions, OCRProgress, OCRResult } from '../types/ocr.types';
import { processOcrDataUrl, processOcrFile, processOcrPayload } from '../services/ocr/ocrOrchestrator';
import type { OCRImagePayload } from '../types/ocr.types';

export const useOCRProcessor = () => {
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const processFile = useCallback(async (file: File, options?: OCRProcessOptions) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const finalResult = await processOcrFile(file, {
        ...options,
        signal: controller.signal,
        onProgress: setProgress
      });
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo procesar el OCR.';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processDataUrl = useCallback(async (dataUrl: string, options?: OCRProcessOptions) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const finalResult = await processOcrDataUrl(dataUrl, {
        ...options,
        signal: controller.signal,
        onProgress: setProgress
      });
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo procesar el OCR.';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processPayload = useCallback(async (payload: OCRImagePayload, options?: OCRProcessOptions) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const finalResult = await processOcrPayload(payload, {
        ...options,
        signal: controller.signal,
        onProgress: setProgress
      });
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo procesar el OCR.';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setProgress({ stage: 'error', message: 'Procesamiento cancelado.' });
  }, []);

  return {
    progress,
    result,
    error,
    isProcessing,
    reset,
    cancel,
    processFile,
    processDataUrl,
    processPayload
  };
};
