// Modal principal para procesamiento OCR de documentos e imágenes
import React, { useState, useCallback, useEffect } from 'react';
import { X, FileText, Download, Copy, Settings, RotateCcw, PlayCircle, PauseCircle } from 'lucide-react';
import { OCRService } from '../services/ocrService';
import FileDropZone from './FileDropZone';
import OCRProgressBar from './OCRProgressBar';
import { 
  ProcessingResult, 
  BatchProcessingResult, 
  OCRProgress, 
  OCRSettings,
  DEFAULT_OCR_SETTINGS 
} from '../types/ocrTypes';

interface OCRProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextExtracted?: (text: string, source: string) => void;
}

const OCRProcessorModal: React.FC<OCRProcessorModalProps> = ({
  isOpen,
  onClose,
  onTextExtracted
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress>({ progress: 0, status: 'initializing' });
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [batchResult, setBatchResult] = useState<BatchProcessingResult | null>(null);
  const [settings, setSettings] = useState<OCRSettings>(DEFAULT_OCR_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ProcessingResult | null>(null);
  const [ocrService] = useState(() => new OCRService(settings));

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setResults([]);
      setBatchResult(null);
      setProgress({ progress: 0, status: 'initializing' });
      setProcessing(false);
      setSelectedResult(null);
    }
  }, [isOpen]);

  // Update OCR service settings when settings change
  useEffect(() => {
    ocrService.updateSettings(settings);
  }, [settings, ocrService]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    setBatchResult(null);
  }, []);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setBatchResult(null);

    try {
      if (files.length === 1) {
        // Procesar archivo único
        const result = await ocrService.processFile(files[0], setProgress);
        setResults([result]);
        
        if (onTextExtracted) {
          onTextExtracted(result.text, result.source_file);
        }
      } else {
        // Procesar lote
        const batchResult = await ocrService.processFileBatch(files, setProgress);
        setResults(batchResult.results);
        setBatchResult(batchResult);
        
        if (onTextExtracted && batchResult.results.length > 0) {
          const combinedText = batchResult.results
            .map(r => `=== ${r.source_file} ===\n${r.text}`)
            .join('\n\n');
          onTextExtracted(combinedText, `${batchResult.results.length} archivos`);
        }
      }
    } catch (error) {
      console.error('Error en procesamiento OCR:', error);
      setProgress({
        progress: 0,
        status: 'error',
        currentFile: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Aquí podrías mostrar una notificación toast
      console.log('Texto copiado al portapapeles');
    });
  };

  const handleDownloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setBatchResult(null);
    setProgress({ progress: 0, status: 'initializing' });
    setSelectedResult(null);
  };

  const totalCharacters = results.reduce((total, result) => total + result.text.length, 0);
  const averageConfidence = results.length > 0 
    ? results.reduce((sum, result) => sum + result.confidence, 0) / results.length 
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Procesador OCR</h2>
                <p className="text-sm text-gray-600">Extrae texto de PDFs e imágenes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Configuración"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                disabled={processing}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Panel principal */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Zona de archivos */}
              {!processing && results.length === 0 && (
                <FileDropZone
                  onFilesSelected={handleFilesSelected}
                  maxFiles={10}
                  disabled={processing}
                  className="mb-6"
                />
              )}

              {/* Configuración rápida */}
              {showSettings && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Configuración OCR</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Idioma</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="spa">Español</option>
                        <option value="eng">Inglés</option>
                        <option value="spa+eng">Español + Inglés</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.enhance}
                          onChange={(e) => setSettings(prev => ({ ...prev, enhance: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-xs font-medium text-gray-700">Mejorar calidad de imagen</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Aviso sobre PDFs */}
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-600 text-sm">⚠️</span>
                      <div className="text-xs text-orange-800">
                        <strong>Nota importante:</strong> El procesamiento de archivos PDF está temporalmente limitado debido a problemas de compatibilidad. 
                        Para mejores resultados, convierta sus PDFs a imágenes (PNG, JPG) antes de subirlos.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Barra de progreso */}
              {processing && (
                <div className="mb-6">
                  <OCRProgressBar progress={progress} />
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-4">
                  {/* Estadísticas del lote */}
                  {batchResult && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Resumen del procesamiento</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Total:</span>
                          <span className="font-medium ml-2">{batchResult.total}</span>
                        </div>
                        <div>
                          <span className="text-green-700">Exitosos:</span>
                          <span className="font-medium ml-2">{batchResult.successful}</span>
                        </div>
                        <div>
                          <span className="text-red-700">Errores:</span>
                          <span className="font-medium ml-2">{batchResult.failed}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">Caracteres:</span>
                          <span className="font-medium ml-2">{totalCharacters.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de resultados */}
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{result.source_file}</h4>
                                <div className="text-xs text-gray-500 flex items-center space-x-4 mt-1">
                                  <span>Método: {result.method === 'direct' ? 'Extracción directa' : 'OCR'}</span>
                                  <span>Confianza: {Math.round(result.confidence * 100)}%</span>
                                  <span>Caracteres: {result.text.length}</span>
                                  {result.words && <span>Palabras: {result.words}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyText(result.text)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded"
                                title="Copiar texto"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadText(result.text, result.source_file)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded"
                                title="Descargar texto"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedResult(selectedResult?.source_file === result.source_file ? null : result)}
                                className="p-2 text-blue-600 hover:text-blue-800 rounded"
                                title="Ver/ocultar texto completo"
                              >
                                {selectedResult?.source_file === result.source_file ? '−' : '+'}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {selectedResult?.source_file === result.source_file && (
                          <div className="p-4 bg-gray-50">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono bg-white p-3 rounded border">
                              {result.text || 'No se extrajo texto del documento.'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con controles */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {files.length > 0 && (
                    <span>{files.length} archivo(s) seleccionado(s)</span>
                  )}
                  {results.length > 0 && (
                    <span className="ml-4">
                      {totalCharacters.toLocaleString()} caracteres extraídos
                      {averageConfidence > 0 && (
                        <span className="ml-2">• Confianza promedio: {Math.round(averageConfidence * 100)}%</span>
                      )}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {results.length > 0 && (
                    <button
                      onClick={handleReset}
                      disabled={processing}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reiniciar</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleProcess}
                    disabled={files.length === 0 || processing}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <PauseCircle className="h-4 w-4" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        <span>Procesar {files.length > 1 ? `${files.length} archivos` : 'archivo'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRProcessorModal;