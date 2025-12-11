import React from 'react';
import { Camera, User, AlertCircle, GripVertical, ChevronRight } from 'lucide-react';

interface Patient {
  id?: string;
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;
  diagnostico: string;
  plan: string;
  pendientes: string;
  fecha: string;
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: (string | null)[];
  assigned_resident_id?: string | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface ResidentProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface WardPatientCardProps {
  patient: Patient;
  resident?: ResidentProfile;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent, patientId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPatientId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const WardPatientCard: React.FC<WardPatientCardProps> = ({
  patient,
  resident,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  isDragOver = false,
}) => {
  // Helper function to truncate text
  const truncate = (text: string, maxLength: number): string => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Calculate image count
  const getImageCount = (patient: Patient): number => {
    const thumbs = patient.image_thumbnail_url || [];
    const fulls = patient.image_full_url || [];
    return Math.max(thumbs.length, fulls.length);
  };

  // Get severity badge class
  const getSeverityBadgeClass = (severidad: string): string => {
    switch (severidad) {
      case 'I':
        return 'badge-severity-1';
      case 'II':
        return 'badge-severity-2';
      case 'III':
        return 'badge-severity-3';
      case 'IV':
        return 'badge-severity-4';
      default:
        return '';
    }
  };

  const imageCount = getImageCount(patient);
  const hasPendientes = patient.pendientes && patient.pendientes.trim() !== '';

  // Determine drag and drop styles
  const cardClasses = `
    medical-card p-4 rounded-lg
    border-2 border-gray-200 dark:border-gray-700
    hover:border-blue-300 dark:hover:border-blue-400
    hover:shadow-lg
    transition-all
    cursor-pointer
    relative
    ${isDragging ? 'opacity-50 cursor-move' : ''}
    ${isDragOver ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}
  `.trim();

  // Drag event handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && patient.id) {
      onDragStart(e, patient.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop && patient.id) {
      onDrop(e, patient.id);
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag handle (visible on hover) */}
      {onDragStart && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {/* Top row: Severity badge + Bed location */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {patient.severidad && (
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded ${getSeverityBadgeClass(
                patient.severidad
              )}`}
            >
              {patient.severidad}
            </span>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cama: {patient.cama || 'N/A'}
          </span>
        </div>
      </div>

      {/* Name + DNI */}
      <div className="mb-2">
        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
          {patient.nombre}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          DNI: {patient.dni || 'N/A'}
        </p>
      </div>

      {/* Age */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Edad: {patient.edad || 'N/A'}
        </p>
      </div>

      {/* Diagnosis (truncated) */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {truncate(patient.diagnostico || 'Sin diagnóstico', 80)}
        </p>
      </div>

      {/* Pendientes preview (if exists) */}
      {hasPendientes && (
        <div className="mb-3 flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800 dark:text-orange-300">
            {truncate(patient.pendientes, 40)}
          </p>
        </div>
      )}

      {/* Bottom info: Image count + Resident */}
      <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {imageCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <Camera className="h-4 w-4" />
              <span>{imageCount}</span>
            </div>
          )}
          {resident && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span className="truncate max-w-[120px]" title={resident.full_name}>
                {resident.full_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-end gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
        <span>Ver detalles</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
};

export default WardPatientCard;
