import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientDestination, PatientEntryForm } from '../types/v3.types';
import { createPatient } from '../services/patientsV3Service';
import DestinationSelector from './DestinationSelector';

interface PatientEntryProps {
  onPatientCreated: () => void;
  defaultDestination?: PatientDestination;
}

export default function PatientEntry({
  onPatientCreated,
  defaultDestination = 'interconsulta',
}: PatientEntryProps) {
  const { theme } = useTheme();
  const [form, setForm] = useState<PatientEntryForm>({
    nombre: '',
    dni: '',
    cama: '',
  });
  const [selectedDestination, setSelectedDestination] =
    useState<PatientDestination>(defaultDestination);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!form.dni.trim()) {
      setError('El DNI es requerido');
      return;
    }

    setSaving(true);
    try {
      const { error: saveError } = await createPatient(
        form,
        selectedDestination,
        'Posadas' // Default hospital context
      );

      if (saveError) {
        throw saveError;
      }

      // Reset form on success
      setForm({ nombre: '', dni: '', cama: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onPatientCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar paciente');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof PatientEntryForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  const inputClass = `w-full px-3 py-2 rounded-lg border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  } focus:outline-none focus:ring-1 focus:ring-blue-500`;

  return (
    <div
      className={`rounded-xl p-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          + Nuevo Paciente
        </h2>
        {success && (
          <span className="text-sm text-green-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Guardado
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Input Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo"
              className={inputClass}
              disabled={saving}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              DNI *
            </label>
            <input
              type="text"
              value={form.dni}
              onChange={(e) => handleChange('dni', e.target.value)}
              placeholder="12345678"
              className={inputClass}
              disabled={saving}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Cama
            </label>
            <input
              type="text"
              value={form.cama || ''}
              onChange={(e) => handleChange('cama', e.target.value)}
              placeholder="301"
              className={inputClass}
              disabled={saving}
            />
          </div>
        </div>

        {/* Destination Selector and Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Guardar en:
            </span>
            <DestinationSelector
              selected={selectedDestination}
              onChange={setSelectedDestination}
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? (
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
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
