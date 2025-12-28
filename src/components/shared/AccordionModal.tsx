/**
 * PLANTILLA REUTILIZABLE: Modal con Acordeón Colapsable
 *
 * Características:
 * - Header fijo con auto-save indicator
 * - Contenido scrolleable con acordeón
 * - Footer fijo con botones de acción
 * - Dark mode support
 * - Validaciones opcionales
 *
 * Ejemplo de uso: Ver WardConfirmationModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Edit as EditIcon, Plus, Minus } from 'lucide-react';

// ============================================================================
// COMPONENTE ACORDEÓN REUTILIZABLE
// ============================================================================

interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  contentLength?: number;
  badge?: React.ReactNode;
  previewText?: string;          // Texto de preview para mostrar cuando está colapsado

  // Props para edición inline
  isEditing?: boolean;           // Si esta sección está en modo edición
  onEditToggle?: () => void;     // Callback para toggle editar/guardar
  showEditButton?: boolean;      // Si mostrar el botón editar
  isSaving?: boolean;            // Si se está guardando (para spinner)
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  contentLength: _contentLength,
  badge,
  previewText = '',
  isEditing = false,
  onEditToggle,
  showEditButton = false,
  isSaving = false
}) => {
  // Truncar preview a 50-70 caracteres
  const truncatedPreview = previewText && previewText.length > 70
    ? previewText.substring(0, 67) + '...'
    : previewText;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header del acordeón - Vista compacta en una línea */}
      <div className="w-full px-3 py-2 flex items-center justify-between gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {/* Botón +/- */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isExpanded ? 'Colapsar sección' : 'Expandir sección'}
        >
          {isExpanded ? (
            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Título y preview en la misma línea */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-shrink-0">
            {title}
          </span>

          {/* Preview del texto - Solo visible cuando está colapsado */}
          {!isExpanded && truncatedPreview && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {truncatedPreview}
            </span>
          )}

          {/* Badge personalizado */}
          {badge}
        </button>

        {/* Botón Editar/Guardar - Más compacto */}
        {showEditButton && onEditToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditToggle();
            }}
            disabled={isSaving}
            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-all ${
              isEditing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
          >
            {isSaving ? (
              <>
                <Save className="h-3 w-3 animate-pulse" />
                <span className="hidden sm:inline">Guardando...</span>
              </>
            ) : isEditing ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Guardar</span>
              </>
            ) : (
              <>
                <EditIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Editar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Contenido - Solo visible cuando está expandido */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TEMPLATE: Modal Base con Acordeón
// ============================================================================

interface AccordionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: T) => Promise<void>;
  title: string;
  subtitle?: string;
  initialData: T;
  children: (props: {
    data: T;
    updateData: (updater: (prev: T) => T) => void;
    expandedSections: string[];
    toggleSection: (section: string) => void;
  }) => React.ReactNode;
  validateData?: (data: T) => { isValid: boolean; errors?: Record<string, string> };
  enableAutoSave?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export function AccordionModal<T>({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  initialData,
  children,
  validateData,
  enableAutoSave = true,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar'
}: AccordionModalProps<T>) {
  const [data, setData] = useState<T>(initialData);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setData(initialData);
      setExpandedSections([]);
      setAutoSaveStatus('idle');
      setValidationErrors({});
    }
  }, [isOpen, initialData]);

  // Auto-save con debounce
  useEffect(() => {
    if (!enableAutoSave || !isOpen || JSON.stringify(data) === JSON.stringify(initialData)) {
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, isOpen, initialData, enableAutoSave]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleConfirm = async () => {
    // Validar si existe función de validación
    if (validateData) {
      const validation = validateData(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors || {});
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirm(data);
    } catch (error) {
      console.error('[AccordionModal] Error al confirmar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isValid = validateData ? validateData(data).isValid : true;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* ===== HEADER FIJO ===== */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de auto-save */}
            {enableAutoSave && autoSaveStatus === 'saving' && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Auto-guardando...
              </span>
            )}
            {enableAutoSave && autoSaveStatus === 'saved' && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Guardado ✓
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ===== CONTENIDO SCROLLEABLE ===== */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {children({
              data,
              updateData: setData,
              expandedSections,
              toggleSection
            })}
          </div>
        </div>

        {/* ===== FOOTER FIJO ===== */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelButtonText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? 'Guardando...' : confirmButtonText}
            </button>
          </div>
          {!isValid && Object.keys(validationErrors).length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
              * Completa los campos obligatorios
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO DE USO
// ============================================================================

/*
import { AccordionModal, AccordionSection } from './components/shared/AccordionModal';

interface MyFormData {
  nombre: string;
  descripcion: string;
  observaciones: string;
}

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [formData] = useState<MyFormData>({
    nombre: '',
    descripcion: '',
    observaciones: ''
  });

  const handleConfirm = async (data: MyFormData) => {
    console.log('Datos confirmados:', data);
    // Guardar en BD...
    setShowModal(false);
  };

  const validateForm = (data: MyFormData) => {
    const errors: Record<string, string> = {};
    if (!data.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Abrir Modal</button>

      <AccordionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Mi Formulario"
        subtitle="Completa los datos"
        initialData={formData}
        validateData={validateForm}
        confirmButtonText="Guardar"
      >
        {({ data, updateData, expandedSections, toggleSection }) => (
          <>
            <AccordionSection
              title="Información Básica"
              isExpanded={expandedSections.includes('basica')}
              onToggle={() => toggleSection('basica')}
            >
              <input
                value={data.nombre}
                onChange={(e) => updateData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </AccordionSection>

            <AccordionSection
              title="Descripción"
              isExpanded={expandedSections.includes('descripcion')}
              onToggle={() => toggleSection('descripcion')}
              contentLength={data.descripcion.length}
            >
              <textarea
                value={data.descripcion}
                onChange={(e) => updateData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              />
            </AccordionSection>
          </>
        )}
      </AccordionModal>
    </>
  );
}
*/
