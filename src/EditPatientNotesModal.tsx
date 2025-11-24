import React, { useState, useEffect } from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { X, Save, FileText, AlertCircle, CheckCircle, User, Calendar } from 'lucide-react';
import { PatientAssessment } from './types';

interface EditPatientNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientId: string, updates: { clinical_notes: string; patient_name?: string; patient_age?: string; patient_dni?: string }) => Promise<boolean>;
  patient: PatientAssessment | null;
}

const EditPatientNotesModal: React.FC<EditPatientNotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patient
}) => {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientDni, setPatientDni] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEscapeKey(onClose, isOpen);

  // Cargar datos del paciente cuando se abre el modal
  useEffect(() => {
    if (isOpen && patient) {
      setClinicalNotes(patient.clinical_notes || '');
      setPatientName(patient.patient_name || '');
      setPatientAge(patient.patient_age || '');
      setPatientDni(patient.patient_dni || '');
      setSaveResult(null);
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = async () => {
    if (!clinicalNotes.trim()) {
      setSaveResult({ success: false, message: 'Las notas clínicas no pueden estar vacías' });
      return;
    }

    if (!patientName.trim()) {
      setSaveResult({ success: false, message: 'El nombre del paciente es requerido' });
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const updates = {
        clinical_notes: clinicalNotes.trim(),
        patient_name: patientName.trim(),
        patient_age: patientAge.trim(),
        patient_dni: patientDni.trim()
      };

      const success = await onSave(patient.id!, updates);
      
      if (success) {
        setSaveResult({ success: true, message: 'Paciente actualizado exitosamente' });
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
          setSaveResult(null);
        }, 2000);
      } else {
        setSaveResult({ success: false, message: 'Error al actualizar el paciente' });
      }

    } catch (error) {
      setSaveResult({ 
        success: false, 
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      setSaveResult(null);
      // Resetear formulario
      setClinicalNotes(patient?.clinical_notes || '');
      setPatientName(patient?.patient_name || '');
      setPatientAge(patient?.patient_age || '');
      setPatientDni(patient?.patient_dni || '');
    }
  };

  const hasChanges = clinicalNotes !== (patient.clinical_notes || '') ||
                    patientName !== (patient.patient_name || '') ||
                    patientAge !== (patient.patient_age || '') ||
                    patientDni !== (patient.patient_dni || '');

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-secondary)]" style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%), color-mix(in srgb, var(--accent) 10%, var(--bg-primary) 90%))'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)'
              }}>
                <FileText className="h-6 w-6" style={{ color: 'var(--state-info)' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Editar Información del Paciente</h2>
                <p className="text-sm text-[var(--text-secondary)] flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Creado: {formatDate(patient.created_at || '')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Patient Information */}
          <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Nombre del Paciente *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Nombre completo"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Edad
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 45"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={patientDni}
                  onChange={(e) => setPatientDni(e.target.value)}
                  className="w-full border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 12345678"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Notas Clínicas *
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full h-64 border border-[var(--border-primary)] rounded-lg px-3 py-3 resize-none font-mono text-sm"
              placeholder="Escriba las notas clínicas del paciente..."
              disabled={isSaving}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-[var(--text-tertiary)]">
              <span>Caracteres: {clinicalNotes.length}</span>
              {hasChanges && (
                <span className="font-medium" style={{ color: 'var(--state-warning)' }}>● Cambios sin guardar</span>
              )}
            </div>
          </div>

          {/* Scale Results (Read-only) */}
          {patient.scale_results && patient.scale_results.length > 0 && (
            <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Escalas Aplicadas (Solo lectura)
              </h3>
              <div className="space-y-2">
                {patient.scale_results.map((scale, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[var(--bg-primary)] rounded border border-[var(--border-secondary)] text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{scale.scale_name}</span>
                    <span className="font-semibold" style={{ color: 'var(--state-info)' }}>
                      Puntuación: {scale.score}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                * Las escalas no pueden editarse. Para modificar resultados, debe crear una nueva evaluación.
              </p>
            </div>
          )}

          {/* Save Result */}
          {saveResult && (
            <div className="p-4 rounded-lg flex items-center space-x-3" style={{
              backgroundColor: saveResult.success 
                ? 'color-mix(in srgb, var(--state-success) 10%, var(--bg-primary) 90%)'
                : 'color-mix(in srgb, var(--state-error) 10%, var(--bg-primary) 90%)',
              borderColor: saveResult.success
                ? 'color-mix(in srgb, var(--state-success) 30%, transparent)'
                : 'color-mix(in srgb, var(--state-error) 30%, transparent)'
            }}>
              {saveResult.success ? (
                <CheckCircle className="h-5 w-5" style={{ color: 'var(--state-success)' }} />
              ) : (
                <AlertCircle className="h-5 w-5" style={{ color: 'var(--state-error)' }} />
              )}
              <span className="text-sm text-[var(--text-primary)]">{saveResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex justify-between items-center">
          <div className="text-sm text-[var(--text-secondary)]">
            {hasChanges ? (
              <span style={{ color: 'var(--state-warning)' }}>● Hay cambios sin guardar</span>
            ) : (
              <span>Sin cambios pendientes</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)]"
            >
              {hasChanges ? 'Cancelar' : 'Cerrar'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !clinicalNotes.trim() || !patientName.trim() || !hasChanges}
              className="btn-accent px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPatientNotesModal;
