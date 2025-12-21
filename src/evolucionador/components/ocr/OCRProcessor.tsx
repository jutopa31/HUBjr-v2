import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ClaudeVisionDocumentType } from '../../types/claude.types';
import { useOCRProcessor } from '../../hooks/useOCRProcessor';
import ImagePreview from './ImagePreview';
import OCRResultCard from './OCRResultCard';
import OCRUploader from './OCRUploader';

interface OCRProcessorProps {
  documentType?: ClaudeVisionDocumentType;
  onInsertText?: (text: string) => void;
  helperText?: string;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });

const OCRProcessor: React.FC<OCRProcessorProps> = ({ documentType = 'generic', onInsertText, helperText }) => {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const { progress, result, error, isProcessing, reset, processDataUrl } = useOCRProcessor();

  const handleFileSelected = useCallback(async (file: File) => {
    reset();
    setIsPreparing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error('[OCRProcessor] Error reading file', err);
    } finally {
      setIsPreparing(false);
    }
  }, [reset]);

  const handleConfirmPreview = useCallback(async (dataUrl: string) => {
    setPreviewDataUrl(null);
    await processDataUrl(dataUrl, { documentType });
  }, [documentType, processDataUrl]);

  const handleCancelPreview = useCallback(() => {
    setPreviewDataUrl(null);
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;
      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          event.preventDefault();
          void handleFileSelected(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelected]);

  const progressLabel = useMemo(() => {
    if (!progress) return '';
    switch (progress.stage) {
      case 'validating':
        return 'Validando imagen';
      case 'preprocessing':
        return 'Preparando imagen';
      case 'processing':
        return 'Procesando con Claude Vision';
      case 'parsing':
        return 'Normalizando respuesta';
      case 'complete':
        return 'OCR completo';
      default:
        return progress.message || 'Procesando';
    }
  }, [progress]);

  return (
    <div className="space-y-4">
      <OCRUploader onFileSelected={handleFileSelected} disabled={isProcessing || isPreparing} helperText={helperText} />

      {previewDataUrl && (
        <ImagePreview imageDataUrl={previewDataUrl} onConfirm={handleConfirmPreview} onCancel={handleCancelPreview} />
      )}

      {(isProcessing || isPreparing) && (
        <div className="flex items-center gap-2 rounded-lg border p-3 border-blue-100 bg-blue-50 text-blue-700 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{progressLabel || 'Procesando...'}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border p-3 border-red-200 bg-red-50 text-red-800 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">No se pudo procesar</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {result && <OCRResultCard result={result} onInsert={onInsertText} />}
    </div>
  );
};

export default React.memo(OCRProcessor);
