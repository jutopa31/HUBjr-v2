import React, { useState } from 'react';
import { X, Save, Database, AlertCircle, CheckCircle, User, Calendar } from 'lucide-react';
import { ExtractedPatientData, cleanPatientName } from './utils/patientDataExtractor';
import { SavePatientData } from './types';

interface SavePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: SavePatientData) => Promise<void>;
  extractedData: ExtractedPatientData;
  fullNotes: string;
}

const SavePatientModal: React.FC<SavePatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  extractedData,
  fullNotes
}) => {
  const [patientName, setPatientName] = useState(extractedData.name || '');
  const [patientAge, setPatientAge] = useState(extractedData.age || '');
  const [patientDni, setPatientDni] = useState(extractedData.dni || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!patientName.trim()) {
      setSaveResult({ success: false, message: 'El nombre del paciente es requerido' });
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const saveData: SavePatientData = {
        patient_name: cleanPatientName(patientName),
        patient_age: patientAge,
        patient_dni: patientDni,
        clinical_notes: fullNotes,
        scale_results: extractedData.extractedScales.map(scale => ({
          scale_name: scale.name,
          score: scale.score,
          details: scale.details,
          completed_at: new Date().toISOString()
        }))
      };

      await onSave(saveData);
      setSaveResult({ success: true, message: 'Paciente guardado exitosamente' });
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        setSaveResult(null);
      }, 2000);

    } catch (error) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Guardar Evaluación Diagnóstica</h2>
                <p className="text-sm text-gray-600">Revise y confirme los datos del paciente</p>
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
        <div className="p-6">
          {/* Datos Extraídos - Resumen */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Datos extraídos automáticamente
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
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
                <div className="text-yellow-600">No se encontraron escalas completadas en las notas</div>
              )}
            </div>
          </div>

          {/* Formulario Editable */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nombre del Paciente *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese el nombre completo del paciente"
                disabled={isSaving}
              />
              {!patientName.trim() && (
                <p className="text-xs text-red-500 mt-1">Este campo es requerido</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 45"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  value={patientDni}
                  onChange={(e) => setPatientDni(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 12345678"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Vista previa de las notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vista previa de las notas clínicas ({fullNotes.length} caracteres)
              </label>
              <div className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 overflow-y-auto text-sm text-gray-700">
                {fullNotes.slice(0, 500)}
                {fullNotes.length > 500 && '...'}
              </div>
            </div>
          </div>

          {/* Resultado del guardado */}
          {saveResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
              saveResult.success 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">{saveResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !patientName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
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