import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3, PatientDestination } from '../types/v3.types';
import { transitionPatient, deletePatient } from '../services/patientsV3Service';

interface PatientCardProps {
  patient: PatientV3;
  onEdit?: (patient: PatientV3) => void;
  onEvolucionar?: (patient: PatientV3) => void;
  onAI?: (patient: PatientV3) => void;
  onPatientUpdated?: () => void;
  showTransitions?: PatientDestination[];
}

export default function PatientCard({
  patient,
  onEdit,
  onEvolucionar,
  onAI,
  onPatientUpdated,
  showTransitions = [],
}: PatientCardProps) {
  const { theme } = useTheme();
  const [transitioning, setTransitioning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleTransition(to: PatientDestination) {
    setTransitioning(true);
    try {
      const { error } = await transitionPatient({
        from: patient.current_destination,
        to,
        patient_id: patient.id,
      });
      if (!error && onPatientUpdated) {
        onPatientUpdated();
      }
    } catch (err) {
      console.error('Error transitioning patient:', err);
    } finally {
      setTransitioning(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await deletePatient(patient.id);
      if (!error && onPatientUpdated) {
        onPatientUpdated();
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const transitionLabels: Record<PatientDestination, string> = {
    interconsulta: 'Interconsulta',
    pase_sala: 'Pase Sala',
    post_alta: 'Post-Alta',
    ambulatorio: 'Ambulatorio',
  };

  const transitionIcons: Record<PatientDestination, string> = {
    interconsulta: '📋',
    pase_sala: '🏥',
    post_alta: '📅',
    ambulatorio: '🚶',
  };

  const cardClass = `rounded-xl p-4 transition-all ${
    theme === 'dark'
      ? 'bg-gray-800 border border-gray-700 hover:border-gray-600'
      : 'bg-white border border-gray-200 hover:shadow-md'
  }`;

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3
            className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {patient.nombre}
          </h3>
          <div
            className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            DNI: {patient.dni}
            {patient.cama && ` | Cama: ${patient.cama}`}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700'
              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
          }`}
          title="Eliminar paciente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Clinical data preview */}
      {patient.diagnostico && (
        <div
          className={`text-sm mb-3 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          <span className="font-medium">Dx:</span> {patient.diagnostico}
        </div>
      )}

      {/* Evolution count */}
      {patient.evoluciones && patient.evoluciones.length > 0 && (
        <div
          className={`text-xs mb-3 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}
        >
          {patient.evoluciones.length} evolución(es)
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {onEvolucionar && (
          <button
            onClick={() => onEvolucionar(patient)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-green-900/50 text-green-400 hover:bg-green-900'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Evolucionar
          </button>
        )}

        {onAI && (
          <button
            onClick={() => onAI(patient)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-purple-900/50 text-purple-400 hover:bg-purple-900'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            AI
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(patient)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Editar
          </button>
        )}

        {/* Transition buttons */}
        {showTransitions.map((dest) => (
          <button
            key={dest}
            onClick={() => handleTransition(dest)}
            disabled={transitioning}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              transitioning
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {transitionIcons[dest]} {transitionLabels[dest]}
          </button>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`rounded-xl p-6 max-w-sm mx-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h4
              className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Confirmar eliminación
            </h4>
            <p
              className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              ¿Está seguro de eliminar al paciente {patient.nombre}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
