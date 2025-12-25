import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Loader2,
  Check,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { isSupportedOCRFile, renderPdfFirstPageToDataUrl } from '../../services/ocrService';
import { runSequentialOcr } from '../../services/ocrAutoService';
import { processOcrDataUrl, processOcrFile } from '../../evolucionador/services/ocr/ocrOrchestrator';
import type { OCRProgress } from '../../evolucionador/types/ocr.types';
import type { EvolutionOptions } from '../../evolucionador/types/evolution.types';
import { ClaudeEvolutionService } from '../../evolucionador/services/claude/claudeEvolutionService';

interface EpicrisisAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

const EpicrisisAssistantModal: React.FC<EpicrisisAssistantModalProps> = ({
  isOpen,
  onClose,
  onInsert
}) => {
  // Epicrisis state
  const [epicrisisFile, setEpicrisisFile] = useState<File | null>(null);
  const [epicrisisText, setEpicrisisText] = useState<string>('');
  const [isProcessingEpicrisis, setIsProcessingEpicrisis] = useState(false);
  const [epicrisisProgress, setEpicrisisProgress] = useState<OCRProgress | null>(null);

  // Studies state
  const [studyFiles, setStudyFiles] = useState<File[]>([]);
  const [studiesText, setStudiesText] = useState<string>('');
  const [isProcessingStudies, setIsProcessingStudies] = useState(false);
  const [studiesProgress, setStudiesProgress] = useState<OCRProgress | null>(null);
  const [currentStudyIndex, setCurrentStudyIndex] = useState<number>(0);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [generationCost, setGenerationCost] = useState<number>(0);
  const [generationTokens, setGenerationTokens] = useState<number>(0);

  // Options state
  const [options, setOptions] = useState<EvolutionOptions>({
    includePhysicalExam: true,
    suggestPlan: true,
    format: 'detailed'
  });

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [ocrMode, setOcrMode] = useState<'local' | 'claude'>('local');

  const epicrisisInputRef = useRef<HTMLInputElement>(null);
  const studyInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const evolutionService = useMemo(() => new ClaudeEvolutionService(), []);

  const resetState = useCallback(() => {
    setEpicrisisFile(null);
    setEpicrisisText('');
    setStudyFiles([]);
    setStudiesText('');
    setGeneratedNote('');
    setGenerationCost(0);
    setGenerationTokens(0);
    setError(null);
    setIsProcessingEpicrisis(false);
    setIsProcessingStudies(false);
    setIsGenerating(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEscapeKey(handleClose, isOpen);

  // Process epicrisis file
  const handleEpicrisisFile = useCallback(async (file: File) => {
    if (!isSupportedOCRFile(file)) {
      setError('Formato no soportado. Use PDF, PNG o JPG.');
      return;
    }

    setEpicrisisFile(file);
    setIsProcessingEpicrisis(true);
    setError(null);

    try {
      let extractedText = '';

      if (ocrMode === 'claude') {
        // Claude Vision mode
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          setEpicrisisProgress({ stage: 'preprocessing', message: 'Convirtiendo PDF a imagen' });
          const { dataUrl } = await renderPdfFirstPageToDataUrl(file);
          const result = await processOcrDataUrl(dataUrl, {
            documentType: 'generic',
            onProgress: setEpicrisisProgress
          });
          extractedText = result.text;
        } else {
          const result = await processOcrFile(file, {
            documentType: 'generic',
            onProgress: setEpicrisisProgress
          });
          extractedText = result.text;
        }
      } else {
        // Local mode (free)
        const { results } = await runSequentialOcr([file], {
          onProgress: (progress) => {
            setEpicrisisProgress({
              stage: progress.stage,
              message: progress.message,
              progress: progress.progress
            });
          },
          minChars: 60
        });
        extractedText = results[0]?.text || '';
      }

      setEpicrisisText(extractedText);
    } catch (err) {
      console.error('Error processing epicrisis:', err);
      setError(err instanceof Error ? err.message : 'Error procesando epicrisis');
    } finally {
      setIsProcessingEpicrisis(false);
      setEpicrisisProgress(null);
    }
  }, [ocrMode]);

  // Process study files
  const handleStudyFiles = useCallback(async (files: File[]) => {
    const supported = files.filter(isSupportedOCRFile);
    if (supported.length === 0) {
      setError('Ningún archivo soportado. Use PDF, PNG o JPG.');
      return;
    }

    setStudyFiles((prev) => [...prev, ...supported]);
    setIsProcessingStudies(true);
    setError(null);

    try {
      const extractedTexts: string[] = [];

      if (ocrMode === 'claude') {
        // Claude Vision mode - process each file individually
        for (let i = 0; i < supported.length; i++) {
          const file = supported[i];
          setCurrentStudyIndex(i);

          let result;
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            setStudiesProgress({ stage: 'preprocessing', message: `Convirtiendo ${file.name}` });
            const { dataUrl } = await renderPdfFirstPageToDataUrl(file);
            result = await processOcrDataUrl(dataUrl, {
              documentType: 'generic',
              onProgress: setStudiesProgress
            });
          } else {
            result = await processOcrFile(file, {
              documentType: 'generic',
              onProgress: setStudiesProgress
            });
          }

          extractedTexts.push(`--- ${file.name} ---\n${result.text}`);
        }
      } else {
        // Local mode (free) - process all files together
        const { results } = await runSequentialOcr(supported, {
          onProgress: (progress) => {
            setCurrentStudyIndex(progress.fileIndex - 1);
            setStudiesProgress({
              stage: progress.stage,
              message: progress.message,
              progress: progress.progress
            });
          },
          minChars: 60
        });

        results.forEach((result) => {
          extractedTexts.push(`--- ${result.fileName} ---\n${result.text}`);
        });
      }

      const consolidated = extractedTexts.join('\n\n');
      setStudiesText((prev) => (prev ? `${prev}\n\n${consolidated}` : consolidated));
    } catch (err) {
      console.error('Error processing studies:', err);
      setError(err instanceof Error ? err.message : 'Error procesando estudios');
    } finally {
      setIsProcessingStudies(false);
      setStudiesProgress(null);
      setCurrentStudyIndex(0);
    }
  }, [ocrMode]);

  // Generate evolution note
  const handleGenerate = useCallback(async () => {
    if (!epicrisisText.trim()) {
      setError('Debe procesar una epicrisis primero.');
      return;
    }

    if (!studiesText.trim()) {
      setError('Debe agregar al menos un estudio actual.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await evolutionService.generateEvolutionNote(
        epicrisisText,
        studiesText,
        {},
        options
      );

      setGeneratedNote(result.fullNote);
      setGenerationCost(result.cost);
      setGenerationTokens(result.tokensUsed);
    } catch (err) {
      console.error('Error generating evolution:', err);
      setError(err instanceof Error ? err.message : 'Error generando evolución');
    } finally {
      setIsGenerating(false);
    }
  }, [epicrisisText, studiesText, options, evolutionService]);

  // Insert generated note
  const handleInsert = useCallback(() => {
    if (generatedNote.trim()) {
      onInsert(generatedNote);
      handleClose();
    }
  }, [generatedNote, onInsert, handleClose]);

  // File input handlers
  const handleEpicrisisInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleEpicrisisFile(file);
    },
    [handleEpicrisisFile]
  );

  const handleStudyInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) void handleStudyFiles(files);
    },
    [handleStudyFiles]
  );

  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleStudyFiles([file]);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [handleStudyFiles]
  );

  const removeStudyFile = useCallback((index: number) => {
    setStudyFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canGenerate = epicrisisText.trim() && studiesText.trim() && !isGenerating;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Asistente de Epicrisis con IA
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Genera notas de evolución inteligentes basadas en epicrisis y estudios actuales
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error display */}
          {error && (
            <div className="flex items-start space-x-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Epicrisis */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Paso 1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Epicrisis (Antecedentes)
                </h3>
              </div>
              {epicrisisText && (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sube o fotografía la epicrisis del paciente para extraer antecedentes de internación reciente
            </p>

            {/* OCR Mode Selector */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Modo OCR:</span>
              <button
                type="button"
                onClick={() => setOcrMode('local')}
                disabled={isProcessingEpicrisis || isProcessingStudies}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  ocrMode === 'local'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Local (Gratis - Tesseract/PDF.js)
              </button>
              <button
                type="button"
                onClick={() => setOcrMode('claude')}
                disabled={isProcessingEpicrisis || isProcessingStudies}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  ocrMode === 'claude'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Claude Vision (IA - ~$0.01-0.02)
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => epicrisisInputRef.current?.click()}
                disabled={isProcessingEpicrisis}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                <Upload className="h-4 w-4" />
                Subir Epicrisis
              </button>
              <input
                ref={epicrisisInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleEpicrisisInputChange}
              />
            </div>

            {epicrisisFile && (
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FileText className="h-4 w-4" />
                <span>{epicrisisFile.name}</span>
                {isProcessingEpicrisis && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}

            {epicrisisProgress && (
              <div className="mb-3 rounded bg-blue-50 dark:bg-blue-900/20 p-2 text-sm text-blue-700 dark:text-blue-300">
                {epicrisisProgress.message || 'Procesando...'}
              </div>
            )}

            {epicrisisText && (
              <div className="mt-3">
                <textarea
                  value={epicrisisText}
                  onChange={(e) => setEpicrisisText(e.target.value)}
                  className="w-full h-32 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 font-mono resize-none"
                  placeholder="Texto de epicrisis extraído..."
                />
              </div>
            )}
          </div>

          {/* Step 2: Current Studies */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 px-3 py-1 text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Paso 2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estudios Actuales
                </h3>
              </div>
              {studiesText && (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Agrega fotos de estudios, laboratorios o datos actuales del paciente (puedes agregar múltiples)
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => studyInputRef.current?.click()}
                disabled={isProcessingStudies}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                <Upload className="h-4 w-4" />
                Subir Estudios
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingStudies}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                <Camera className="h-4 w-4" />
                Tomar Foto
              </button>
              <input
                ref={studyInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={handleStudyInputChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
            </div>

            {studyFiles.length > 0 && (
              <div className="mb-3 space-y-2">
                {studyFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 rounded p-2 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeStudyFile(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isProcessingStudies && (
              <div className="mb-3 rounded bg-purple-50 dark:bg-purple-900/20 p-2 text-sm text-purple-700 dark:text-purple-300">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {studiesProgress?.message || `Procesando estudio ${currentStudyIndex + 1}...`}
                  </span>
                </div>
              </div>
            )}

            {studiesText && (
              <div className="mt-3">
                <textarea
                  value={studiesText}
                  onChange={(e) => setStudiesText(e.target.value)}
                  className="w-full h-32 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 font-mono resize-none"
                  placeholder="Textos de estudios extraídos..."
                />
              </div>
            )}
          </div>

          {/* Step 3: Options and Generation */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-300">
                Paso 3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuración y Generación
              </h3>
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePhysicalExam}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, includePhysicalExam: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir examen físico completo
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.suggestPlan}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, suggestPlan: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sugerir plan terapéutico detallado
                </span>
              </label>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Formato:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={options.format === 'detailed'}
                    onChange={() => setOptions((prev) => ({ ...prev, format: 'detailed' }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Detallado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={options.format === 'summary'}
                    onChange={() => setOptions((prev) => ({ ...prev, format: 'summary' }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Resumido</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando evolución...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generar Evolución con IA
                </>
              )}
            </button>
          </div>

          {/* Generated Note */}
          {generatedNote && (
            <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nota de Evolución Generada
                  </h3>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Tokens: {generationTokens} | Costo: ${generationCost.toFixed(4)}
                </div>
              </div>

              <textarea
                value={generatedNote}
                onChange={(e) => setGeneratedNote(e.target.value)}
                className="w-full h-64 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 text-sm text-gray-900 dark:text-gray-100 font-mono resize-none mb-4"
              />

              <button
                onClick={handleInsert}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                <ChevronRight className="h-5 w-5" />
                Insertar en Evolucionador
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EpicrisisAssistantModal);
