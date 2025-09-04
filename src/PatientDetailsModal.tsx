import React from 'react';
import { X, User, Calendar, FileText, Brain, Copy, Download } from 'lucide-react';
import { PatientAssessment } from './types';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientAssessment | null;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  if (!isOpen || !patient) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar un toast notification
  };

  const downloadAsText = () => {
    const content = `EVALUACIÓN DIAGNÓSTICA - ${patient.patient_name}
=====================================================

DATOS DEL PACIENTE:
- Nombre: ${patient.patient_name}
- Edad: ${patient.patient_age} años
- DNI: ${patient.patient_dni || 'No especificado'}
- Fecha de evaluación: ${formatDate(patient.created_at || '')}
- Evaluado por: ${patient.created_by || 'Neurología'}

ESCALAS APLICADAS:
${patient.scale_results?.length ? 
  patient.scale_results.map((scale, index) => 
    `${index + 1}. ${scale.scale_name}: ${scale.score} puntos
   Detalles: ${scale.details}
   Fecha: ${formatDate(scale.completed_at)}
`).join('\n') : 'No se aplicaron escalas'}

NOTAS CLÍNICAS:
${patient.clinical_notes}

=====================================================
Generado desde HUBJR - Neurology Residency Hub
Hospital Nacional Posadas - Servicio de Neurología`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion_${patient.patient_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.patient_name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(patient.created_at || '')}
                  </span>
                  {patient.patient_age && (
                    <span>{patient.patient_age} años</span>
                  )}
                  {patient.patient_dni && (
                    <span>DNI: {patient.patient_dni}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(patient.clinical_notes)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
                title="Copiar notas"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={downloadAsText}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
                title="Descargar evaluación"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Applied Scales */}
            {patient.scale_results && patient.scale_results.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  Escalas Aplicadas ({patient.scale_results.length})
                </h3>
                <div className="grid gap-4">
                  {patient.scale_results.map((scale, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{scale.scale_name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(scale.completed_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{scale.score}</div>
                          <div className="text-xs text-gray-500">puntos</div>
                        </div>
                      </div>
                      {scale.details && (
                        <div className="text-sm text-gray-700 bg-white rounded p-3 border">
                          <div className="font-medium text-gray-900 mb-1">Detalles:</div>
                          <div className="whitespace-pre-wrap">{scale.details}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Notas Clínicas
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {patient.clinical_notes}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Información del Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Creado por:</span>
                  <div className="font-medium">{patient.created_by || 'Neurología'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <div className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status === 'active' ? 'Activo' : patient.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">ID del registro:</span>
                  <div className="font-mono text-xs text-gray-600">{patient.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;