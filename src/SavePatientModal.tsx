import React, { useState, useEffect } from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { X, Save, Database, AlertCircle, CheckCircle, User, Calendar, Building2 } from 'lucide-react';
import { ExtractedPatientData, cleanPatientName } from './utils/patientDataExtractor';
import { SavePatientData, HospitalContext } from './types';

interface SavePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: SavePatientData) => Promise<void>;
  extractedData: ExtractedPatientData;
  fullNotes: string;
  currentHospitalContext?: HospitalContext;
}

const SavePatientModal: React.FC<SavePatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  extractedData,
  fullNotes,
  currentHospitalContext = 'Posadas'
}) => {
  const [patientName, setPatientName] = useState(extractedData.name || '');
  const [patientAge, setPatientAge] = useState(extractedData.age || '');
  const [patientDni, setPatientDni] = useState(extractedData.dni || '');
  const [hospitalContext, setHospitalContext] = useState<HospitalContext>(currentHospitalContext);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Actualizar el contexto hospitalario cuando cambia el prop
  useEffect(() => {
    console.log('[SavePatientModal] Contexto hospitalario actualizado:', currentHospitalContext);
    setHospitalContext(currentHospitalContext);
  }, [currentHospitalContext]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!patientName.trim()) {
      setSaveResult({ success: false, message: 'El nombre del paciente es requerido' });
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      console.log('[SavePatientModal] handleSave -> start');
      console.log('[SavePatientModal] 🏥 Contexto hospitalario seleccionado:', hospitalContext);
      console.log('[SavePatientModal] 📋 Contexto desde prop:', currentHospitalContext);
      const saveData: SavePatientData = {
        patient_name: cleanPatientName(patientName),
        patient_age: patientAge,
        patient_dni: patientDni,
        clinical_notes: fullNotes,
        hospital_context: hospitalContext,
        scale_results: extractedData.extractedScales.map(scale => ({
          scale_name: scale.name,
          score: scale.score,
          details: scale.details,
          completed_at: new Date().toISOString()
        }))
      };

      console.log('[SavePatientModal] handleSave -> payload completo:', saveData);
      console.log('[SavePatientModal] ✅ Guardando en contexto:', saveData.hospital_context);
      await onSave(saveData);
      const contextLabel = hospitalContext === 'Julian' ? 'Consultorios Julian' : 'Hospital Posadas';
      setSaveResult({ success: true, message: `Paciente guardado exitosamente en ${contextLabel}` });
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        setSaveResult(null);
      }, 2000);

    } catch (error) {
      console.error('[SavePatientModal] handleSave error:', error);
      setSaveResult({ 
        success: false, 
        message: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      setSaveResult(null);
    }
  };

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)'
              }}>
                <Database className="h-6 w-6" style={{ color: 'var(--state-info)' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Guardar Evaluación Diagnóstica</h2>
                <p className="text-sm text-[var(--text-secondary)]">Revise y confirme los datos del paciente</p>
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

        {/* Banner de Contexto Hospitalario */}
        <div className="px-6 py-3 border-b" style={{
          backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)',
          borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)'
        }}>
          <div className="flex items-center justify-center space-x-2">
            <Building2 className="h-4 w-4" style={{ color: 'var(--state-info)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--state-info)' }}>
              Guardando en: {hospitalContext === 'Julian' ? '🏥 Consultorios Julian' : '🏥 Hospital Posadas'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Datos Extraídos - Resumen */}
          <div className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Datos extraídos automáticamente
            </h3>
            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
              {extractedData.extractedScales.length > 0 ? (
                <>
                  <div className="mb-2">
                    <strong>Escalas encontradas:</strong> {extractedData.extractedScales.length}
                  </div>
                  {extractedData.extractedScales.map((scale, index) => (
                    <div key={index} className="ml-4 text-xs">
                      • {scale.name}: {scale.score} puntos
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: 'var(--state-warning)' }}>No se encontraron escalas completadas en las notas</div>
              )}
            </div>
          </div>

          {/* Formulario Editable */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nombre del Paciente *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2"
                placeholder="Ingrese el nombre completo del paciente"
                disabled={isSaving}
              />
              {!patientName.trim() && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">Este campo es requerido</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Edad
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2"
                  placeholder="Ej: 45"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  value={patientDni}
                  onChange={(e) => setPatientDni(e.target.value)}
                  className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2"
                  placeholder="Ej: 12345678"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Vista previa de las notas */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Vista previa de las notas clínicas ({fullNotes.length} caracteres)
              </label>
              <div className="w-full h-32 border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-secondary)] overflow-y-auto text-sm text-[var(--text-primary)]">
                {fullNotes.slice(0, 500)}
                {fullNotes.length > 500 && '...'}
              </div>
            </div>
          </div>

          {/* Resultado del guardado */}
          {saveResult && (
            <div className="mt-4 p-4 rounded-lg flex items-center space-x-3" style={{
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
        <div className="p-6 border-t border-[var(--border-secondary)] flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 border border-[var(--border-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !patientName.trim()}
            className="btn-accent px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Paciente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePatientModal;
