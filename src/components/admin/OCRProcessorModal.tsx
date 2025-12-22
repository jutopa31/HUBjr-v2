import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { X, Upload, FileText, Loader2, Copy, Check, AlertTriangle, Camera, Clipboard } from 'lucide-react';
import {
  isSupportedOCRFile,
  renderPdfFirstPageToDataUrl
} from '../../services/ocrService';
import { runSequentialOcr, type OCRAutoProgress, type OCRAutoResult } from '../../services/ocrAutoService';
import { processOcrDataUrl as processClaudeOcrDataUrl, processOcrFile as processClaudeOcrFile } from '../../evolucionador/services/ocr/ocrOrchestrator';
import type { OCRProgress as ClaudeOCRProgress } from '../../evolucionador/types/ocr.types';

interface OCRProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

const isImageFile = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(png|jpe?g|bmp|tiff)$/i.test(file.name);
const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const mapClaudeStage = (stage: ClaudeOCRProgress['stage']): OCRAutoProgress['stage'] => {
  switch (stage) {
    case 'validating':
    case 'preprocessing':
      return 'loading';
    case 'processing':
    case 'parsing':
      return 'image-ocr';
    case 'complete':
      return 'complete';
    default:
      return 'loading';
  }
};

const OCRProcessorModal: React.FC<OCRProcessorModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<OCRAutoResult | null>(null);
  const [progress, setProgress] = useState<OCRAutoProgress | null>(null);
  const [resultSource, setResultSource] = useState<'local' | 'claude' | null>(null);
  const [claudeDetails, setClaudeDetails] = useState<{ tokensUsed: number; cost: number; confidence: number } | null>(null);
  const [ocrMode, setOcrMode] = useState<'local' | 'claude'>('local');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setProgress(null);
    setResultSource(null);
    setClaudeDetails(null);
    setIsProcessing(false);
    setError(null);
    setCopied(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEscapeKey(handleClose, isOpen);

  const handleProcessFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setResultSource(null);
    setClaudeDetails(null);
    setCopied(false);

    try {
      if (ocrMode === 'claude') {
        let claudeResult;
        let pageCount: number | null = null;

        if (isPdfFile(file)) {
          setProgress({
            stage: 'loading',
            message: 'Convirtiendo PDF a imagen',
            fileName: file.name,
            fileIndex: 1,
            totalFiles: 1,
            stageLabel: 'Convirtiendo PDF a imagen'
          });
          const rendered = await renderPdfFirstPageToDataUrl(file);
          pageCount = rendered.pageCount;
          claudeResult = await processClaudeOcrDataUrl(rendered.dataUrl, {
            documentType: 'generic',
            onProgress: (next: ClaudeOCRProgress) =>
              setProgress({
                stage: mapClaudeStage(next.stage),
                message: next.message || 'Procesando con Claude Vision',
                progress: next.progress,
                fileName: file.name,
                fileIndex: 1,
                totalFiles: 1,
                stageLabel: next.message
              })
          });
        } else if (isImageFile(file)) {
          claudeResult = await processClaudeOcrFile(file, {
            documentType: 'generic',
            onProgress: (next: ClaudeOCRProgress) =>
              setProgress({
                stage: mapClaudeStage(next.stage),
                message: next.message || 'Procesando con Claude Vision',
                progress: next.progress,
                fileName: file.name,
                fileIndex: 1,
                totalFiles: 1,
                stageLabel: next.message
              })
          });
        } else {
          setError('Claude Vision solo admite imagenes o PDF.');
          return;
        }

        const warnings: string[] = [];
        if (!claudeResult.text) {
          warnings.push('Claude Vision no detecto texto legible en la imagen.');
        }
        if (pageCount && pageCount > 1) {
          warnings.push('PDF con multiples paginas; se proceso solo la primera.');
        }
        setResultSource('claude');
        setClaudeDetails({
          tokensUsed: claudeResult.tokensUsed,
          cost: claudeResult.cost,
          confidence: claudeResult.confidence
        });
        setResult({
          fileName: file.name,
          text: claudeResult.text,
          method: 'image-ocr',
          warnings: warnings.length ? warnings : undefined
        });
      } else {
        const { results } = await runSequentialOcr([file], {
          onProgress: setProgress,
          minChars: 60
        });
        setResultSource('local');
        setResult(results[0] || null);
        setProgress((prev) => ({
          stage: 'complete',
          message: 'Procesamiento finalizado',
          fileName: prev?.fileName || file.name,
          fileIndex: prev?.fileIndex || 1,
          totalFiles: prev?.totalFiles || 1
        }));
      }
    } catch (ex) {
      console.error('OCR processing error', ex);
      const message = ex instanceof Error ? ex.message : 'No se pudo procesar el archivo.';
      if (message.includes('Anthropic API key missing')) {
        setError('Falta API key de Anthropic. Configura la key en Configuracion de IA (admin) o NEXT_PUBLIC_ANTHROPIC_API_KEY.');
      } else {
        setError(message);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [ocrMode]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!isSupportedOCRFile(file)) {
        setError('Formato no soportado. Utilice PDF, PNG o JPG.');
        return;
      }

      void handleProcessFile(file);
    },
    [handleProcessFile]
  );

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleCameraChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!isSupportedOCRFile(file)) {
        setError('Formato no soportado. Utilice PDF, PNG o JPG.');
        return;
      }
      void handleProcessFile(file);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [handleProcessFile]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;
      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          event.preventDefault();
          void handleProcessFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleProcessFile, isOpen]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) {
        return;
      }

      if (!isSupportedOCRFile(file)) {
        setError('Formato no soportado. Utilice PDF, PNG o JPG.');
        return;
      }

      void handleProcessFile(file);
    },
    [handleProcessFile]
  );

  const handleInsert = useCallback(() => {
    if (result?.text) {
      onInsert(result.text);
      setCopied(true);
    }
  }, [onInsert, result]);

  const handleCopy = useCallback(async () => {
    if (!result?.text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (clipboardError) {
      console.error('Clipboard error', clipboardError);
      setError('No se pudo copiar al portapapeles.');
    }
  }, [result]);

  const renderProgress = useMemo(() => {
    if (!progress) return null;
    const percentage = progress.progress ? Math.round(progress.progress * 100) : undefined;
    const isComplete = progress.stage === 'complete';

    return (
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
        <div className="flex items-center space-x-2">
          {isComplete ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span>{progress.message || 'Procesando archivo...'}</span>
          {percentage !== undefined && <span className="ml-auto font-medium">{percentage}%</span>}
        </div>
        {progress.processedPages && progress.totalPages && (
          <p className="mt-2 text-xs">
            Página {progress.processedPages} de {progress.totalPages}
          </p>
        )}
      </div>
    );
  }, [progress]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Procesar PDF o Imagen</h2>
            <p className="text-sm text-gray-600">Disponible solo para administradores. Extrae texto para integrarlo en las notas.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
          >
            <Upload className="h-10 w-10 text-blue-500" />
            <p className="mt-4 text-sm text-gray-700">
              Arrastre un archivo PDF o imagen aqui, o <span className="font-medium text-blue-600">seleccione uno</span>
            </p>
            <p className="text-xs text-gray-500">Formatos permitidos: PDF, PNG, JPG. Tamaño recomendado &lt; 10 MB.</p>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/bmp,image/tiff"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Modo OCR:</span>
            <button
              type="button"
              onClick={() => setOcrMode('local')}
              className={`rounded-full border px-3 py-1 font-semibold ${
                ocrMode === 'local'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Local (PDF/Tesseract)
            </button>
            <button
              type="button"
              onClick={() => setOcrMode('claude')}
              className={`rounded-full border px-3 py-1 font-semibold ${
                ocrMode === 'claude'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Claude Vision (imagen o PDF)
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <button
              type="button"
              onClick={handleCameraClick}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold hover:bg-gray-100"
            >
              <Camera className="h-3.5 w-3.5" /> Tomar foto
            </button>
            <button
              type="button"
              onClick={() => { /* paste handled globally via window listener */ }}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold hover:bg-gray-100"
              title="Usa Ctrl+V o Cmd+V para pegar imagen del portapapeles"
            >
              <Clipboard className="h-3.5 w-3.5" /> Pegar imagen (Ctrl+V)
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraChange}
            />
          </div>

          {selectedFile && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              </div>
              {renderProgress}
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 rounded-lg medical-card card-error p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">No se pudo procesar el archivo</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Resultado ({resultSource === 'claude' ? 'Claude Vision' : result.method === 'pdf-text' ? 'Texto PDF' : 'OCR'}):
                  </p>
                  {result.meta?.pageCount && (
                    <p className="text-xs text-gray-500">Paginas procesadas: {result.meta.pageCount}</p>
                  )}
                  {resultSource === 'claude' && claudeDetails && (
                    <p className="text-xs text-gray-500">
                      Tokens: {claudeDetails.tokensUsed} · Costo: ${claudeDetails.cost.toFixed(4)} · Confianza {Math.round(claudeDetails.confidence * 100)}%
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4 text-blue-700" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" /> Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleInsert}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Insertar en notas
                  </button>
                </div>
              </div>
              <textarea
                value={result.text}
                readOnly
                className="h-52 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800"
              />
              {result.warnings && (
                <ul className="rounded-lg medical-card card-warning p-3 text-xs">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>- {warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(OCRProcessorModal);
