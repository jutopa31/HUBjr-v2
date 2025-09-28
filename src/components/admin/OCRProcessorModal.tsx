import React, { useCallback, useMemo, useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { X, Upload, FileText, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import {
  extractTextFromDocument,
  isSupportedOCRFile,
  OCRProgress,
  OCRResult,
} from '../../services/ocrService';

interface OCRProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

const OCRProcessorModal: React.FC<OCRProcessorModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setProgress(null);
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
    setCopied(false);

    try {
      const extraction = await extractTextFromDocument(file, setProgress);
      setResult(extraction);
      setProgress({ stage: 'complete', message: 'Procesamiento finalizado' });
    } catch (ex) {
      console.error('OCR processing error', ex);
      setError(ex instanceof Error ? ex.message : 'No se pudo procesar el archivo.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

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

    return (
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Procesar PDF o Imagen</h2>
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

          {selectedFile && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              </div>
              {renderProgress}
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                  <p className="text-sm font-medium text-gray-700">Resultado ({result.method === 'pdf-text' ? 'Texto PDF' : 'OCR'}):</p>
                  {result.meta?.pageCount && (
                    <p className="text-xs text-gray-500">Paginas procesadas: {result.meta.pageCount}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4 text-green-600" /> Copiado
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
                <ul className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
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
