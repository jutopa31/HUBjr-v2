import React from 'react';
import { Calendar, Phone, FileText, AlertCircle } from 'lucide-react';
import { PacientePostAltaRow } from '../../services/pacientesPostAltaService';

interface PatientCardProps {
  patient: PacientePostAltaRow;
  onClick: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasNotas = patient.notas_evolucion && patient.notas_evolucion.trim() !== '';
  const hasPendiente = patient.pendiente && patient.pendiente.trim() !== '';

  return (
    <div
      onClick={onClick}
      className="medical-card p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Patient name + DNI */}
      <div className="mb-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
          {patient.nombre}
          {patient.dni && (
            <span className="font-normal text-sm text-gray-600 dark:text-gray-400 ml-2">
              ({patient.dni})
            </span>
          )}
        </h3>
      </div>

      {/* Diagnosis */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {truncateText(patient.diagnostico, 60)}
        </p>
      </div>

      {/* Date + Phone */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>{formatDate(patient.fecha_visita)}</span>
        </div>
        {patient.telefono && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-green-500" />
            <span>{patient.telefono}</span>
          </div>
        )}
      </div>

      {/* Indicators: Notes + Pending */}
      <div className="flex items-center gap-3 mb-3">
        {hasNotas && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span>Notas</span>
          </div>
        )}
        {hasPendiente && (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <AlertCircle className="h-4 w-4" />
            <span>Pendiente</span>
          </div>
        )}
      </div>

      {/* Action link */}
      <div className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
        Ver detalles →
      </div>
    </div>
  );
};

export default PatientCard;
