import React, { useState } from 'react';
import { PendingPatient, CARD_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, CardColor } from '../../types/pendingPatients';

interface PatientCardProps {
  patient: PendingPatient;
  onEdit: (patient: PendingPatient) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string, finalDiagnosis: string) => void;
  onColorChange: (id: string, color: CardColor) => void;
}

export default function PatientCard({ patient, onEdit, onDelete, onResolve, onColorChange }: PatientCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorTheme = CARD_COLORS[patient.color || 'default'];

  const handleResolve = () => {
    if (finalDiagnosis.trim()) {
      onResolve(patient.id, finalDiagnosis);
      setShowResolveInput(false);
      setFinalDiagnosis('');
    }
  };

  const colorOptions: CardColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

  return (
    <div
      className={`${colorTheme.bg} ${colorTheme.border} border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 relative group ${
        patient.resolved ? 'opacity-60' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowColorPicker(false);
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${colorTheme.text}`}>
            {patient.patient_name}
            {patient.age && <span className="text-sm ml-2">({patient.age} años)</span>}
          </h3>
          {patient.dni && (
            <p className="text-xs text-gray-600 dark:text-gray-400">DNI: {patient.dni}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${PRIORITY_COLORS[patient.priority]}`}>
            {PRIORITY_LABELS[patient.priority]}
          </span>
          {/* Resolved Badge */}
          {patient.resolved && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              ✓ Resuelto
            </span>
          )}
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="mb-3">
        <p className={`text-sm font-medium ${colorTheme.text}`}>
          <span className="font-semibold">Motivo de consulta:</span> {patient.chief_complaint}
        </p>
      </div>

      {/* Clinical Notes */}
      <div className="mb-3">
        <p className={`text-sm ${colorTheme.text} whitespace-pre-wrap line-clamp-4`}>
          {patient.clinical_notes}
        </p>
      </div>

      {/* Differential Diagnoses */}
      {patient.differential_diagnoses && patient.differential_diagnoses.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Diagnósticos diferenciales:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
            {patient.differential_diagnoses.map((dx, idx) => (
              <li key={idx}>{dx}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Tests */}
      {patient.pending_tests && patient.pending_tests.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Estudios pendientes:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
            {patient.pending_tests.map((test, idx) => (
              <li key={idx}>{test}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {patient.tags && patient.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {patient.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Final Diagnosis (if resolved) */}
      {patient.resolved && patient.final_diagnosis && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            Diagnóstico final:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{patient.final_diagnosis}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{new Date(patient.created_at).toLocaleDateString()}</span>
          <span>{patient.hospital_context}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && !patient.resolved && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Cambiar color"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="grid grid-cols-4 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorChange(patient.id, color);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded ${CARD_COLORS[color].bg} ${CARD_COLORS[color].border} border-2 hover:scale-110 transition-transform`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(patient)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Resolve Button */}
          <button
            onClick={() => setShowResolveInput(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Marcar como resuelto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de eliminar este paciente?')) {
                onDelete(patient.id);
              }
            }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Resolve Input */}
      {showResolveInput && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <label className="block text-sm font-medium mb-1">Diagnóstico final:</label>
          <textarea
            value={finalDiagnosis}
            onChange={(e) => setFinalDiagnosis(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800"
            rows={2}
            placeholder="Ingresa el diagnóstico final..."
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setShowResolveInput(false);
                setFinalDiagnosis('');
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleResolve}
              className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
