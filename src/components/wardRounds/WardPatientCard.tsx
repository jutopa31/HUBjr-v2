import React from 'react';
import { Camera, AlertCircle, AlertTriangle, GripVertical, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { AccordionSection } from '../shared/AccordionModal';

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
  resident: _resident, // Not used after removing resident display
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

  // Responsive truncation based on viewport - UPDATED LIMITS
  const getTruncateLength = (field: 'diagnosis' | 'pendientes'): number => {
    if (typeof window === 'undefined') return field === 'diagnosis' ? 120 : 80;
    if (window.innerWidth < 768) {
      // Mobile: increased from 60 → 80 for diagnosis
      return field === 'diagnosis' ? 80 : 35;
    }
    if (window.innerWidth < 1024) {
      return field === 'diagnosis' ? 100 : 60;
    }
    return field === 'diagnosis' ? 120 : 80;
  };

  const [truncateLengths, setTruncateLengths] = React.useState({
    diagnosis: getTruncateLength('diagnosis'),
    pendientes: getTruncateLength('pendientes')
  });

  // Estado de acordeón para la card
  const [expandedCardSections, setExpandedCardSections] = React.useState<string[]>([
    'motivo_consulta',
    'diagnostico'
  ]);

  const toggleCardSection = (section: string) => {
    setExpandedCardSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  React.useEffect(() => {
    const handleResize = () => {
      setTruncateLengths({
        diagnosis: getTruncateLength('diagnosis'),
        pendientes: getTruncateLength('pendientes')
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Determine drag and drop styles - Clinical Precision enhanced hover
  const cardClasses = `
    medical-card rounded-lg
    p-3 md:p-3.5 lg:p-4
    border-2 border-gray-200 dark:border-gray-700
    hover:border-[#06B6D4] dark:hover:border-[#06B6D4]
    hover:shadow-2xl
    hover:scale-[1.02]
    transition-all duration-200 ease-out
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
    console.log('[WardPatientCard] 🔄 handleFieldChange called:', { field, value, hasEditValues: !!editValues, hasCallback: !!onEditValuesChange });
    if (onEditValuesChange && editValues) {
      const updated = { ...editValues, [field]: value };
      console.log('[WardPatientCard] ✅ Calling onEditValuesChange with:', { field, value, updatedPatient: updated.nombre });
      onEditValuesChange(updated);
    } else {
      console.warn('[WardPatientCard] ⚠️ Cannot update field - missing editValues or onEditValuesChange');
    }
  };

  // Touch event handlers for mobile feedback
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditing) {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.98)';
      target.style.transition = 'transform 0.1s ease';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1)';
  };

  return (
    <div
      className={cardClasses}
      onClick={isEditing ? undefined : onClick}
      draggable={!!onDragStart && !isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle (visible on hover) - only in read mode, hidden on mobile */}
      {onDragStart && !isEditing && (
        <div className="hidden md:block absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {isEditing ? (
        /* ==================== EDIT MODE ==================== */
        <div className="space-y-3">
          {/* Header with Save/Cancel buttons - Clinical Precision */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#06B6D4] dark:border-[#06B6D4]">
            <h3 className="font-semibold text-sm text-[#06B6D4] dark:text-[#06B6D4] flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editando Paciente
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 text-xs rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium"
                title="Cancelar edición"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="px-3 py-1.5 text-xs rounded-md bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                title="Guardar cambios"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Basic Info Grid - Clinical Precision */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={displayData.nombre || ''}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
              <input
                type="text"
                value={displayData.dni || ''}
                onChange={(e) => handleFieldChange('dni', e.target.value)}
                className="w-full px-2 py-1.5 text-sm font-mono rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input
                type="text"
                value={displayData.edad || ''}
                onChange={(e) => handleFieldChange('edad', e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cama</label>
              <input
                type="text"
                value={displayData.cama || ''}
                onChange={(e) => handleFieldChange('cama', e.target.value)}
                className="w-full px-2 py-1.5 text-sm font-mono rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Medical Fields CON ACORDEÓN */}
          <div className="space-y-2">
            {/* Antecedentes */}
            <AccordionSection
              title="Antecedentes"
              isExpanded={expandedCardSections.includes('antecedentes')}
              onToggle={() => toggleCardSection('antecedentes')}
            >
              <textarea
                value={displayData.antecedentes || ''}
                onChange={(e) => handleFieldChange('antecedentes', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Antecedentes del paciente"
              />
            </AccordionSection>

            {/* Motivo de Consulta */}
            <AccordionSection
              title="Motivo de Consulta"
              isExpanded={expandedCardSections.includes('motivo_consulta')}
              onToggle={() => toggleCardSection('motivo_consulta')}
            >
              <textarea
                value={displayData.motivo_consulta || ''}
                onChange={(e) => handleFieldChange('motivo_consulta', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Motivo de consulta"
              />
            </AccordionSection>

            {/* EF/NIHSS/ABCD2 */}
            <AccordionSection
              title="EF/NIHSS/ABCD2"
              isExpanded={expandedCardSections.includes('examen_fisico')}
              onToggle={() => toggleCardSection('examen_fisico')}
            >
              <textarea
                value={displayData.examen_fisico || ''}
                onChange={(e) => handleFieldChange('examen_fisico', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Examen físico"
              />
            </AccordionSection>

            {/* Estudios Complementarios */}
            <AccordionSection
              title="Estudios"
              isExpanded={expandedCardSections.includes('estudios')}
              onToggle={() => toggleCardSection('estudios')}
            >
              <textarea
                value={displayData.estudios || ''}
                onChange={(e) => handleFieldChange('estudios', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Estudios complementarios"
              />
            </AccordionSection>

            {/* Diagnóstico */}
            <AccordionSection
              title="Diagnóstico"
              isExpanded={expandedCardSections.includes('diagnostico')}
              onToggle={() => toggleCardSection('diagnostico')}
            >
              <textarea
                value={displayData.diagnostico || ''}
                onChange={(e) => handleFieldChange('diagnostico', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Diagnóstico"
              />
            </AccordionSection>

            {/* Plan */}
            <AccordionSection
              title="Plan"
              isExpanded={expandedCardSections.includes('plan')}
              onToggle={() => toggleCardSection('plan')}
            >
              <textarea
                value={displayData.plan || ''}
                onChange={(e) => handleFieldChange('plan', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Plan de tratamiento"
              />
            </AccordionSection>

            {/* Pendientes */}
            <AccordionSection
              title="Pendientes"
              isExpanded={expandedCardSections.includes('pendientes')}
              onToggle={() => toggleCardSection('pendientes')}
            >
              <textarea
                value={displayData.pendientes || ''}
                onChange={(e) => handleFieldChange('pendientes', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4] focus:ring-opacity-20 transition-all duration-200"
                placeholder="Tareas pendientes"
              />
            </AccordionSection>
          </div>
        </div>
      ) : (
        /* ==================== READ MODE ==================== */
        <>
      {/* Top row: Severity, Bed, and Actions */}
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          {patient.severidad && (
            <span
              className={`px-1.5 md:px-2 py-0.5 text-xs font-semibold rounded flex items-center gap-1 ${getSeverityBadgeClass(
                patient.severidad
              )}`}
            >
              {patient.severidad === 'IV' && <AlertCircle className="h-3 w-3" />}
              {patient.severidad === 'III' && <AlertTriangle className="h-3 w-3" />}
              <span>{patient.severidad}</span>
            </span>
          )}
          <span className="text-xs md:text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
            Cama: {patient.cama || 'N/A'}
          </span>
        </div>

        {/* Action buttons - Accessible touch targets, flexbox layout on all breakpoints */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="
                  p-2.5 md:p-1.5 rounded-md
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
                <Edit className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="
                  p-2.5 md:p-1.5 rounded-md
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
                <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Patient identity: Name, DNI, Age */}
      <div className="mb-2 md:mb-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
          {patient.nombre}
        </h3>
        <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
          <span className="font-mono">DNI: {patient.dni || 'N/A'}</span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span>Edad: {patient.edad || 'N/A'}</span>
        </div>
      </div>

      {/* Diagnosis - Prominent display with responsive truncation */}
      <div className="mb-2 md:mb-3">
        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 md:line-clamp-2">
          {truncate(patient.diagnostico || 'Sin diagnóstico', truncateLengths.diagnosis)}
        </p>
      </div>

      {/* Pendientes alert - Enhanced mobile visibility */}
      {hasPendientes && (
        <div className="mb-2 md:mb-3 flex items-start gap-2 p-2.5 md:p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border-2 md:border border-orange-300 md:border-orange-200 dark:border-orange-700">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-900 dark:text-orange-200 font-medium">
            {truncate(patient.pendientes, truncateLengths.pendientes)}
          </p>
        </div>
      )}

      {/* Mobile: Prominent tap indicator */}
      <div className="md:hidden mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <span>Toca para ver detalles</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {/* Desktop: Subtle indicator with metadata */}
      <div className="hidden md:flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {imageCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <Camera className="h-4 w-4" />
              <span>{imageCount}</span>
            </div>
          )}
        </div>

        {/* "Detalles" indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Detalles</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>

        </>
      )}
    </div>
  );
};

export default WardPatientCard;
