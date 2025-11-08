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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Editar Información del Paciente</h2>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Creado: {formatDate(patient.created_at || '')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Patient Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Paciente *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 45"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={patientDni}
                  onChange={(e) => setPatientDni(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 12345678"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Notas Clínicas *
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full h-64 border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              placeholder="Escriba las notas clínicas del paciente..."
              disabled={isSaving}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>Caracteres: {clinicalNotes.length}</span>
              {hasChanges && (
                <span className="text-orange-600 font-medium">● Cambios sin guardar</span>
              )}
            </div>
          </div>

          {/* Scale Results (Read-only) */}
          {patient.scale_results && patient.scale_results.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Escalas Aplicadas (Solo lectura)
              </h3>
              <div className="space-y-2">
                {patient.scale_results.map((scale, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <span className="font-medium">{scale.scale_name}</span>
                    <span className="text-blue-600 font-semibold">
                      Puntuación: {scale.score}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Las escalas no pueden editarse. Para modificar resultados, debe crear una nueva evaluación.
              </p>
            </div>
          )}

          {/* Save Result */}
          {saveResult && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              saveResult.success 
                ? 'bg-green-50 text-gray-800 border border-green-200'
                : 'bg-red-50 text-gray-800 border border-red-200'
            }`}>
              {saveResult.success ? (
                <CheckCircle className="h-5 w-5 text-blue-700" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-700" />
              )}
              <span className="text-sm">{saveResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {hasChanges ? (
              <span className="text-orange-600">● Hay cambios sin guardar</span>
            ) : (
              <span>Sin cambios pendientes</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50"
            >
              {hasChanges ? 'Cancelar' : 'Cerrar'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !clinicalNotes.trim() || !patientName.trim() || !hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
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
