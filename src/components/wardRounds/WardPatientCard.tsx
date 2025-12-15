import React from 'react';
import { Camera, User, AlertCircle, GripVertical, ChevronRight, Edit, Trash2 } from 'lucide-react';

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
  onEdit?: () => void;
  onDelete?: () => void;
  onDragStart?: (e: React.DragEvent, patientId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPatientId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  // Inline editing props
  isEditing?: boolean;
  editValues?: Patient;
  onEditValuesChange?: (values: Patient) => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
}

const WardPatientCard: React.FC<WardPatientCardProps> = ({
  patient,
  resident,
  onClick,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  isDragOver = false,
  isEditing = false,
  editValues,
  onEditValuesChange,
  onSave,
  onCancelEdit,
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
    transition-all duration-200
    cursor-pointer
    relative
    group
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

  // Action button handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  // Data to display (either edit values or original patient data)
  const displayData = isEditing && editValues ? editValues : patient;

  // Handle field change during inline editing
  const handleFieldChange = (field: keyof Patient, value: string) => {
    if (onEditValuesChange && editValues) {
      onEditValuesChange({ ...editValues, [field]: value });
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={isEditing ? undefined : onClick}
      draggable={!!onDragStart && !isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag handle (visible on hover) - only in read mode */}
      {onDragStart && !isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {isEditing ? (
        /* ==================== EDIT MODE ==================== */
        <div className="space-y-3">
          {/* Header with Save/Cancel buttons */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editando Paciente
            </h3>
            <div className="flex gap-1">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Cancelar edición"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                title="Guardar cambios"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={displayData.nombre || ''}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
              <input
                type="text"
                value={displayData.dni || ''}
                onChange={(e) => handleFieldChange('dni', e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input
                type="text"
                value={displayData.edad || ''}
                onChange={(e) => handleFieldChange('edad', e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cama</label>
              <input
                type="text"
                value={displayData.cama || ''}
                onChange={(e) => handleFieldChange('cama', e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Medical Fields - Full width */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Antecedentes</label>
              <textarea
                value={displayData.antecedentes || ''}
                onChange={(e) => handleFieldChange('antecedentes', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de Consulta</label>
              <textarea
                value={displayData.motivo_consulta || ''}
                onChange={(e) => handleFieldChange('motivo_consulta', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">EF/NIHSS/ABCD2</label>
              <textarea
                value={displayData.examen_fisico || ''}
                onChange={(e) => handleFieldChange('examen_fisico', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Estudios</label>
              <textarea
                value={displayData.estudios || ''}
                onChange={(e) => handleFieldChange('estudios', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnóstico</label>
              <textarea
                value={displayData.diagnostico || ''}
                onChange={(e) => handleFieldChange('diagnostico', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <textarea
                value={displayData.plan || ''}
                onChange={(e) => handleFieldChange('plan', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pendientes</label>
              <textarea
                value={displayData.pendientes || ''}
                onChange={(e) => handleFieldChange('pendientes', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ) : (
        /* ==================== READ MODE ==================== */
        <>
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

      {/* Action footer - Clinical Precision Design */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
        {/* Left side: View details indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Detalles</span>
          <ChevronRight className="h-3 w-3" />
        </div>

        {/* Right side: Action buttons (medical interface style) */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="
                  p-1.5 rounded-md
                  text-blue-700 dark:text-blue-400
                  hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500
                  border border-blue-200 dark:border-blue-800
                  hover:border-blue-600 dark:hover:border-blue-500
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  transform hover:scale-105 active:scale-95
                "
                title="Editar paciente completo"
                aria-label="Editar paciente"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="
                  p-1.5 rounded-md
                  text-red-600 dark:text-red-400
                  hover:text-white hover:bg-red-600 dark:hover:bg-red-500
                  border border-red-200 dark:border-red-800
                  hover:border-red-600 dark:hover:border-red-500
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                  transform hover:scale-105 active:scale-95
                "
                title="Eliminar o archivar paciente"
                aria-label="Eliminar paciente"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default WardPatientCard;
