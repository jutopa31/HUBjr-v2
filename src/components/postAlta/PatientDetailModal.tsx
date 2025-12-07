import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { PacientePostAltaRow, updatePacientePostAlta } from '../../services/pacientesPostAltaService';

interface PatientDetailModalProps {
  patient: PacientePostAltaRow;
  onClose: () => void;
  onUpdate: (updated: PacientePostAltaRow) => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, onClose, onUpdate }) => {
  const [editedPatient, setEditedPatient] = useState<PacientePostAltaRow>(patient);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if any field has changed
    const hasChanges =
      editedPatient.dni !== patient.dni ||
      editedPatient.nombre !== patient.nombre ||
      editedPatient.telefono !== patient.telefono ||
      editedPatient.diagnostico !== patient.diagnostico ||
      editedPatient.fecha_visita !== patient.fecha_visita ||
      editedPatient.pendiente !== patient.pendiente ||
      editedPatient.notas_evolucion !== patient.notas_evolucion;

    setIsDirty(hasChanges);
  }, [editedPatient, patient]);

  const handleChange = (field: keyof PacientePostAltaRow, value: string) => {
    setEditedPatient(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const isValid = (): boolean => {
    return !!(
      editedPatient.dni?.trim() &&
      editedPatient.nombre?.trim() &&
      editedPatient.diagnostico?.trim() &&
      editedPatient.fecha_visita?.trim()
    );
  };

  const handleSave = async () => {
    if (!isValid()) {
      setMessage({ type: 'error', text: 'Por favor complete los campos requeridos (DNI, Nombre, Diagnóstico, Fecha)' });
      return;
    }

    if (!patient.id) {
      setMessage({ type: 'error', text: 'Error: ID de paciente no encontrado' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Build payload with only changed fields
      const dirtyFields: Partial<PacientePostAltaRow> = {};

      if (editedPatient.dni !== patient.dni) dirtyFields.dni = editedPatient.dni;
      if (editedPatient.nombre !== patient.nombre) dirtyFields.nombre = editedPatient.nombre;
      if (editedPatient.telefono !== patient.telefono) dirtyFields.telefono = editedPatient.telefono || null;
      if (editedPatient.diagnostico !== patient.diagnostico) dirtyFields.diagnostico = editedPatient.diagnostico;
      if (editedPatient.fecha_visita !== patient.fecha_visita) dirtyFields.fecha_visita = editedPatient.fecha_visita;
      if (editedPatient.pendiente !== patient.pendiente) dirtyFields.pendiente = editedPatient.pendiente || null;
      if (editedPatient.notas_evolucion !== patient.notas_evolucion) dirtyFields.notas_evolucion = editedPatient.notas_evolucion || null;

      const { success, data, error } = await updatePacientePostAlta(patient.id, dirtyFields);

      if (success && data) {
        setMessage({ type: 'success', text: 'Cambios guardados exitosamente' });
        onUpdate(data);
        setIsDirty(false);

        // Auto-close after 1.5 seconds on success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: error || 'Error al guardar los cambios' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error inesperado al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {patient.nombre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Cerrar"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Section 1: Personal Info */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editedPatient.dni || ''}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editedPatient.nombre || ''}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre y apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editedPatient.telefono || ''}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 11-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Medical Info */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Información Médica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editedPatient.diagnostico || ''}
                  onChange={(e) => handleChange('diagnostico', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Diagnóstico principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Visita <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editedPatient.fecha_visita || ''}
                  onChange={(e) => handleChange('fecha_visita', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Follow-up */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Seguimiento
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pendiente
                </label>
                <textarea
                  value={editedPatient.pendiente || ''}
                  onChange={(e) => handleChange('pendiente', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tareas o estudios pendientes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas de Evolución
                </label>
                <textarea
                  value={editedPatient.notas_evolucion || ''}
                  onChange={(e) => handleChange('notas_evolucion', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Evolución del paciente en visitas ambulatorias"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Actions + Timestamps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || !isValid() || isSaving}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
                  ${isDirty && isValid() && !isSaving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>

              {!isDirty && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Sin cambios pendientes
                </span>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>
                <span className="font-medium">Creado:</span> {formatTimestamp(patient.created_at)}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span> {formatTimestamp(patient.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;
