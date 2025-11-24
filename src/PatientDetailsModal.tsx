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
    <div className="modal-overlay z-50">
      <div className="bg-[var(--bg-primary)] w-full h-full overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-[var(--border-secondary)] sticky top-0 z-10" style={{
          background: 'linear-gradient(to right, color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%), color-mix(in srgb, var(--accent) 10%, var(--bg-primary) 90%))'
        }}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full" style={{
                backgroundColor: 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)'
              }}>
                <User className="h-6 w-6" style={{ color: 'var(--state-info)' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{patient.patient_name}</h2>
                <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)] mt-1">
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
                  className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                  style={{ color: 'var(--state-info)' }}
                  title="Editar paciente"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => copyToClipboard(patient.clinical_notes)}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)]"
                title="Copiar notas"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={downloadAsText}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)]"
                title="Descargar evaluación"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)]"
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
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center">
                  <Brain className="h-6 w-6 mr-3" style={{ color: 'var(--state-info)' }} />
                  Escalas Aplicadas ({patient.scale_results.length})
                </h3>
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {patient.scale_results.map((scale, index) => (
                    <div key={index} className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-secondary)] hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{scale.scale_name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(scale.completed_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-[var(--text-primary)]">{scale.score}</div>
                          <div className="text-sm text-[var(--text-tertiary)] font-medium">puntos</div>
                        </div>
                      </div>
                      {scale.details && (
                        <div className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-secondary)]">
                          <div className="font-semibold text-[var(--text-primary)] mb-2">Detalles:</div>
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
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3" style={{ color: 'var(--state-info)' }} />
                Notas Clínicas
              </h3>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <div className="text-base text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {patient.clinical_notes}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-10 pt-8 border-t border-[var(--border-secondary)]">
              <h3 className="text-lg font-medium text-[var(--text-tertiary)] mb-4">Información del Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-[var(--text-tertiary)]">Creado por:</span>
                  <div className="font-medium text-[var(--text-primary)]">{patient.created_by || 'Neurología'}</div>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)]">Estado:</span>
                  <div className="font-medium">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs" style={{
                      backgroundColor: patient.status === 'active' 
                        ? 'color-mix(in srgb, var(--state-success) 10%, var(--bg-primary) 90%)'
                        : 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}>
                      {patient.status === 'active' ? 'Activo' : patient.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)]">ID del registro:</span>
                  <div className="font-mono text-xs text-[var(--text-secondary)]">{patient.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-8 border-t border-[var(--border-secondary)] flex justify-end space-x-4" style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="max-w-7xl mx-auto w-full flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] font-medium shadow-lg"
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
