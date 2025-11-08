import React from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { X, User, Calendar, FileText, Brain, Copy, Download, Edit } from 'lucide-react';
import { PatientAssessment } from './types';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientAssessment | null;
  onEdit?: (patient: PatientAssessment) => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit
}) => {
  useEscapeKey(onClose, isOpen);

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
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
              {onEdit && (
                <button
                  onClick={() => onEdit(patient)}
                  className="p-2 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-white"
                  title="Editar paciente"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
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
        <div className="overflow-y-auto h-full">
          <div className="p-8 pb-24 max-w-7xl mx-auto">
            {/* Applied Scales */}
            {patient.scale_results && patient.scale_results.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Brain className="h-6 w-6 mr-3 text-blue-700" />
                  Escalas Aplicadas ({patient.scale_results.length})
                </h3>
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {patient.scale_results.map((scale, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{scale.scale_name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(scale.completed_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-gray-900">{scale.score}</div>
                          <div className="text-sm text-gray-500 font-medium">puntos</div>
                        </div>
                      </div>
                      {scale.details && (
                        <div className="text-sm text-gray-700 bg-white rounded-lg p-4 border">
                          <div className="font-semibold text-gray-900 mb-2">Detalles:</div>
                          <div className="whitespace-pre-wrap leading-relaxed">{scale.details}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Notes */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-blue-600" />
                Notas Clínicas
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {patient.clinical_notes}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-500 mb-4">Información del Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Creado por:</span>
                  <div className="font-medium">{patient.created_by || 'Neurología'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <div className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      patient.status === 'active' ? 'bg-green-100 text-gray-800' : 'bg-gray-100 text-gray-800'
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
        <div className="fixed bottom-0 left-0 right-0 p-8 border-t border-gray-200 bg-white bg-opacity-95 backdrop-blur-sm flex justify-end space-x-4">
          <div className="max-w-7xl mx-auto w-full flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 font-medium shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
