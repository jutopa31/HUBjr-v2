import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Camera, Check, Clipboard, FileText, Loader2, Upload, X } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { isSupportedOCRFile } from '../../services/ocrService';
import {
  appendStudyText,
  runSequentialOcr,
  type OCRAutoProgress,
  type OCRAutoResult
} from '../../services/ocrAutoService';

interface OCRStudiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  initialValue?: string;
}

const OCRStudiesModal: React.FC<OCRStudiesModalProps> = ({ isOpen, onClose, onApply, initialValue = '' }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<OCRAutoProgress | null>(null);
  const [results, setResults] = useState<OCRAutoResult[]>([]);
  const [previewText, setPreviewText] = useState<string>(initialValue);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = useCallback(() => {
    setSelectedFiles([]);
    setProgress(null);
    setResults([]);
    setPreviewText(initialValue || '');
    setIsProcessing(false);
    setError(null);
  }, [initialValue]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEscapeKey(handleClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setPreviewText(initialValue || '');
      setError(null);
      setResults([]);
    }
  }, [initialValue, isOpen]);

  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return;

    const supported = files.filter(isSupportedOCRFile);
    if (supported.length === 0) {
      setError('Formato no soportado. Usa PDF, PNG o JPG.');
      return;
    }

    setSelectedFiles(supported);
    setError(null);
    setProgress(null);
    setResults([]);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files || []);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      handleFiles(files);
    },
    [handleFiles]
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
          handleFiles([file]);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles, isOpen]);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleCameraChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFiles([file]);
      }
      // Reset input value to allow reusing the same capture
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const processFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { results: ocrResults, mergedText } = await runSequentialOcr(selectedFiles, {
        onProgress: setProgress,
        minChars: 80
      });
      setResults(ocrResults);
      setPreviewText((current) => appendStudyText(current, mergedText));
    } catch (ex) {
      console.error('[OCRStudiesModal] Error procesando archivos', ex);
      setError(ex instanceof Error ? ex.message : 'No se pudo procesar los archivos.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [selectedFiles]);

  const handleApply = useCallback(() => {
    const cleaned = previewText.trim();
    if (!cleaned) {
      setError('No hay texto para insertar.');
      return;
    }
    onApply(cleaned);
    handleClose();
  }, [handleClose, onApply, previewText]);

  const progressLabel = useMemo(() => {
    if (!progress) return '';
    if (progress.stageLabel) return progress.stageLabel;
    if (progress.stage === 'processing') return 'Procesando OCR';
    if (progress.stage === 'preprocessing') return 'Preparando archivo';
    if (progress.stage === 'validating') return 'Validando archivo';
    return 'Procesando';
  }, [progress]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">OCR Estudios Complementarios</p>
            <h2 className="text-lg font-semibold text-gray-900">Extrae texto sin guardar imagenes</h2>
            <p className="text-sm text-gray-600">Procesamiento secuencial: un archivo a la vez para mantener la app fluida.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
            <div className="space-y-3">
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <Upload className="h-10 w-10 text-blue-500" />
                <p className="mt-3 text-sm text-gray-700">
                  Arrastra PDF o imagenes aqui, o <span className="font-medium text-blue-600">selecciona</span>
                </p>
                <p className="text-xs text-gray-500">No se guardan imagenes; solo texto extraido.</p>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/bmp,image/tiff"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
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
                  onClick={() => {
                    /* Paste handler is global; provide hint */
                  }}
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

              {selectedFiles.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-gray-800">Archivos en cola ({selectedFiles.length})</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-blue-700 hover:underline"
                      onClick={() => setSelectedFiles([])}
                      disabled={isProcessing}
                    >
                      Limpiar
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-700">
                    {selectedFiles.map((file, index) => (
                      <li key={file.name + index} className="flex items-center justify-between">
                        <span className="truncate">{file.name}</span>
                        <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Procesamiento secuencial</p>
                  <p className="text-xs text-gray-500">Evita bloqueos procesando cada archivo en orden.</p>
                </div>
                <button
                  type="button"
                  onClick={processFiles}
                  disabled={isProcessing || selectedFiles.length === 0}
                  className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold ${
                    isProcessing || selectedFiles.length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                    </>
                  ) : (
                    'Procesar archivos'
                  )}
                </button>
              </div>

              {progress && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">{progressLabel}</span>
                    <span className="ml-auto text-xs">
                      Archivo {progress.fileIndex} de {progress.totalFiles}
                    </span>
                  </div>
                  {progress.progress !== undefined && (
                    <div className="mt-2 h-2 w-full rounded-full bg-blue-100">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">No se pudo procesar</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Previsualizacion y edicion</p>
                  <p className="text-xs text-gray-500">Edita antes de insertar en Estudios Complementarios.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Texto limpio, sin guardar imagenes
                </div>
              </div>
              <textarea
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
                placeholder="Texto extraido aparecera aqui..."
                className="h-56 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />

              {results.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                  <p className="mb-2 font-semibold text-gray-800">Resumen de archivos</p>
                  <ul className="space-y-1">
                    {results.map((result, index) => (
                      <li key={result.fileName + index} className="flex items-start justify-between gap-3">
                        <span className="truncate font-medium">{result.fileName}</span>
                        <span className="text-gray-500">{result.method === 'pdf-text' ? 'PDF' : 'OCR'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!previewText.trim()}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    previewText.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Insertar en estudios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRStudiesModal;
