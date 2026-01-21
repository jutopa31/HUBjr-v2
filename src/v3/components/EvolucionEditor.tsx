import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3 } from '../types/v3.types';
import { updatePatient, addEvolutionNote } from '../services/patientsV3Service';
import PatientTimeline from './PatientTimeline';

interface EvolucionEditorProps {
  patient: PatientV3;
  onClose: () => void;
  onSaved: () => void;
}

export default function EvolucionEditor({
  patient,
  onClose,
  onSaved,
}: EvolucionEditorProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    relato_consulta: patient.relato_consulta || '',
    antecedentes: patient.antecedentes || '',
    examen_fisico: patient.examen_fisico || '',
    estudios: patient.estudios || '',
    diagnostico: patient.diagnostico || '',
    plan: patient.plan || '',
    pendientes: patient.pendientes || '',
  });
  const [newEvolution, setNewEvolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  async function handleAutoSave() {
    setSaving(true);
    try {
      await updatePatient(patient.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveManual() {
    setSaving(true);
    try {
      await updatePatient(patient.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvolution() {
    if (!newEvolution.trim()) return;

    setSavingNote(true);
    try {
      await addEvolutionNote(patient.id, newEvolution, false);
      setNewEvolution('');
      onSaved();
    } catch (err) {
      console.error('Error adding evolution:', err);
    } finally {
      setSavingNote(false);
    }
  }

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass = `w-full px-3 py-2 rounded-lg border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  } focus:outline-none focus:ring-1 focus:ring-blue-500`;

  const textareaClass = `${inputClass} resize-none`;

  const labelClass = `block text-xs font-medium mb-1 ${
    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}
        >
          <div>
            <h2
              className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Evolucionar: {patient.nombre}
            </h2>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              DNI: {patient.dni} {patient.cama && `| Cama: ${patient.cama}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-gray-500">Guardando...</span>
            )}
            {saved && (
              <span className="text-xs text-green-500">Guardado</span>
            )}
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`p-2 rounded-lg ${
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Ver historial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
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
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4">
          {showTimeline && (
            <div className="mb-6">
              <PatientTimeline patient={patient} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Relato de consulta</label>
                <textarea
                  value={formData.relato_consulta}
                  onChange={(e) => handleChange('relato_consulta', e.target.value)}
                  className={textareaClass}
                  rows={3}
                  placeholder="Motivo de consulta..."
                />
              </div>

              <div>
                <label className={labelClass}>Antecedentes</label>
                <textarea
                  value={formData.antecedentes}
                  onChange={(e) => handleChange('antecedentes', e.target.value)}
                  className={textareaClass}
                  rows={3}
                  placeholder="Antecedentes personales..."
                />
              </div>

              <div>
                <label className={labelClass}>Examen físico</label>
                <textarea
                  value={formData.examen_fisico}
                  onChange={(e) => handleChange('examen_fisico', e.target.value)}
                  className={textareaClass}
                  rows={3}
                  placeholder="Hallazgos del examen..."
                />
              </div>

              <div>
                <label className={labelClass}>Estudios</label>
                <textarea
                  value={formData.estudios}
                  onChange={(e) => handleChange('estudios', e.target.value)}
                  className={textareaClass}
                  rows={2}
                  placeholder="Estudios realizados/pendientes..."
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Diagnóstico</label>
                <textarea
                  value={formData.diagnostico}
                  onChange={(e) => handleChange('diagnostico', e.target.value)}
                  className={textareaClass}
                  rows={2}
                  placeholder="Diagnóstico actual..."
                />
              </div>

              <div>
                <label className={labelClass}>Plan</label>
                <textarea
                  value={formData.plan}
                  onChange={(e) => handleChange('plan', e.target.value)}
                  className={textareaClass}
                  rows={3}
                  placeholder="Plan de tratamiento..."
                />
              </div>

              <div>
                <label className={labelClass}>Pendientes</label>
                <textarea
                  value={formData.pendientes}
                  onChange={(e) => handleChange('pendientes', e.target.value)}
                  className={textareaClass}
                  rows={2}
                  placeholder="Tareas pendientes..."
                />
              </div>

              {/* Add evolution note */}
              <div>
                <label className={labelClass}>Nueva nota de evolución</label>
                <textarea
                  value={newEvolution}
                  onChange={(e) => setNewEvolution(e.target.value)}
                  className={textareaClass}
                  rows={4}
                  placeholder="Escribir nota de evolución..."
                />
                <button
                  onClick={handleAddEvolution}
                  disabled={savingNote || !newEvolution.trim()}
                  className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    savingNote || !newEvolution.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {savingNote ? 'Agregando...' : 'Agregar evolución'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 flex items-center justify-end gap-2 p-4 border-t ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
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
            Cerrar
          </button>
          <button
            onClick={handleSaveManual}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
