import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3, AIInputMode } from '../types/v3.types';
import { processAIInput } from '../services/aiAssistantService';
import { updatePatient, addEvolutionNote } from '../services/patientsV3Service';

interface AIAssistantModalProps {
  patient: PatientV3;
  onClose: () => void;
  onApply: () => void;
}

const tabs: { id: AIInputMode; label: string; icon: string }[] = [
  { id: 'texto', label: 'Texto', icon: '📝' },
  { id: 'ocr', label: 'OCR', icon: '📄' },
  { id: 'camara', label: 'Cámara', icon: '📷' },
];

export default function AIAssistantModal({
  patient,
  onClose,
  onApply,
}: AIAssistantModalProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<AIInputMode>('texto');
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function handleProcess() {
    setError(null);
    setResult(null);
    setProcessing(true);

    try {
      let content = '';
      let images: string[] = [];

      if (activeTab === 'texto') {
        if (!textInput.trim()) {
          throw new Error('Por favor ingrese texto para procesar');
        }
        content = textInput;
      } else if (activeTab === 'ocr' || activeTab === 'camara') {
        if (!imagePreview) {
          throw new Error('Por favor seleccione o capture una imagen');
        }
        images = [imagePreview];
      }

      const response = await processAIInput(
        { mode: activeTab, content, images },
        patient
      );

      setResult(response.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando');
    } finally {
      setProcessing(false);
    }
  }

  async function handleApplyAsDraft() {
    if (!result) return;

    setApplying(true);
    try {
      await updatePatient(patient.id, { ai_draft: result });
      onApply();
      onClose();
    } catch (err) {
      setError('Error aplicando borrador');
    } finally {
      setApplying(false);
    }
  }

  async function handleApplyAsEvolution() {
    if (!result) return;

    setApplying(true);
    try {
      await addEvolutionNote(patient.id, result, true);
      onApply();
      onClose();
    } catch (err) {
      setError('Error agregando evolución');
    } finally {
      setApplying(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError('No se pudo acceder a la cámara');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      setImagePreview(canvas.toDataURL('image/jpeg'));
    }
    stopCamera();
  }

  // Cleanup camera on unmount or tab change
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'camara') {
      stopCamera();
    }
  }, [activeTab]);

  const inputClass = `w-full px-3 py-2 rounded-lg border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  } focus:outline-none focus:ring-1 focus:ring-blue-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div>
            <h2
              className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              AI Asistente
            </h2>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {patient.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`flex border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700/50'
                    : 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Text Input Tab */}
          {activeTab === 'texto' && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Pegar texto clínico (HC, informes, notas)
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className={`${inputClass} resize-none`}
                rows={8}
                placeholder="Pegar aquí el texto del paciente..."
              />
            </div>
          )}

          {/* OCR Tab */}
          {activeTab === 'ocr' && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Cargar imagen o PDF
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-8 border-2 border-dashed rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
              >
                Seleccionar archivo
              </button>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Camera Tab */}
          {activeTab === 'camara' && (
            <div>
              {!cameraActive && !imagePreview && (
                <button
                  onClick={startCamera}
                  className={`w-full py-8 border-2 border-dashed rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  Activar cámara
                </button>
              )}

              {cameraActive && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white rounded-full text-gray-900 font-medium shadow-lg hover:bg-gray-100"
                  >
                    Capturar
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Captured"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      startCamera();
                    }}
                    className={`mt-2 w-full py-2 text-sm ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tomar otra foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-4">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Resultado generado por AI
              </label>
              <div
                className={`p-3 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto ${
                  theme === 'dark'
                    ? 'bg-purple-900/30 text-purple-200'
                    : 'bg-purple-50 text-purple-800'
                }`}
              >
                {result}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between p-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelar
          </button>

          <div className="flex gap-2">
            {!result ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  'Procesar con AI'
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setResult(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Reintentar
                </button>
                <button
                  onClick={handleApplyAsDraft}
                  disabled={applying}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  Guardar como borrador
                </button>
                <button
                  onClick={handleApplyAsEvolution}
                  disabled={applying}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Agregar como evolución
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
