import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Save } from 'lucide-react';

export interface WardPatientData {
  // Datos básicos
  nombre: string;
  dni: string;
  edad: string;
  cama: string;

  // Secciones clínicas
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  plan: string;
  diagnostico: string;
  pendientes: string;

  // Metadata
  hospital_context: string;
  severidad?: string;
  display_order?: number;
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editedData: WardPatientData) => Promise<void>;
  initialData: WardPatientData;
  interconsultaName: string;
}

type SectionKey =
  | 'datos'
  | 'antecedentes'
  | 'motivo'
  | 'examen'
  | 'estudios'
  | 'plan'
  | 'diagnostico'
  | 'pendientes'
  | 'imagenes';

const WardConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  interconsultaName
}) => {
  const [editedData, setEditedData] = useState<WardPatientData>(initialData);
  const [expandedSections, setExpandedSections] = useState<SectionKey[]>(['datos']);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setEditedData(initialData);
      setExpandedSections(['datos']);
      setErrors({});
      setAutoSaveStatus('idle');
    }
  }, [isOpen, initialData]);

  // Auto-save effect (debounced)
  useEffect(() => {
    if (!isOpen || JSON.stringify(editedData) === JSON.stringify(initialData)) {
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [editedData, isOpen, initialData]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateField = (field: keyof WardPatientData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!editedData.dni.trim()) {
      newErrors.dni = 'El DNI es obligatorio';
    }
    if (!editedData.cama.trim()) {
      newErrors.cama = 'La cama es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) {
      // Expandir sección de datos si hay errores
      if (!expandedSections.includes('datos')) {
        setExpandedSections(prev => [...prev, 'datos']);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(editedData);
    } catch (error) {
      console.error('[WardConfirmationModal] Error al confirmar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isValid =
    editedData.nombre.trim() !== '' &&
    editedData.dni.trim() !== '' &&
    editedData.cama.trim() !== '';

  const hasImages =
    (editedData.image_thumbnail_url && editedData.image_thumbnail_url.length > 0) ||
    (editedData.image_full_url && editedData.image_full_url.length > 0) ||
    (editedData.exa_url && editedData.exa_url.length > 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header fijo */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirmar datos para Pase de Sala
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {interconsultaName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Auto-guardando...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
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

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">

            {/* Sección 1: Datos Básicos */}
            <AccordionSection
              title="Datos Básicos"
              isExpanded={expandedSections.includes('datos')}
              onToggle={() => toggleSection('datos')}
              badge={!isValid ? <AlertCircle className="h-4 w-4 text-red-500" /> : undefined}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editedData.nombre}
                    onChange={(e) => updateField('nombre', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.nombre
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Nombre completo"
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editedData.dni}
                    onChange={(e) => updateField('dni', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.dni
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="DNI"
                  />
                  {errors.dni && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.dni}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={editedData.edad}
                    onChange={(e) => updateField('edad', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Edad"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editedData.cama}
                    onChange={(e) => updateField('cama', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.cama
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Cama"
                  />
                  {errors.cama && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.cama}</p>
                  )}
                </div>
              </div>
            </AccordionSection>

            {/* Sección 2: Antecedentes */}
            <AccordionSection
              title="Antecedentes"
              isExpanded={expandedSections.includes('antecedentes')}
              onToggle={() => toggleSection('antecedentes')}
              contentLength={editedData.antecedentes.length}
            >
              <textarea
                value={editedData.antecedentes}
                onChange={(e) => updateField('antecedentes', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Antecedentes del paciente..."
              />
            </AccordionSection>

            {/* Sección 3: Motivo de Consulta */}
            <AccordionSection
              title="Motivo de Consulta / Enfermedad Actual"
              isExpanded={expandedSections.includes('motivo')}
              onToggle={() => toggleSection('motivo')}
              contentLength={editedData.motivo_consulta.length}
            >
              <textarea
                value={editedData.motivo_consulta}
                onChange={(e) => updateField('motivo_consulta', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder="Motivo de consulta / enfermedad actual..."
              />
            </AccordionSection>

            {/* Sección 4: Examen Físico */}
            <AccordionSection
              title="Examen Físico"
              isExpanded={expandedSections.includes('examen')}
              onToggle={() => toggleSection('examen')}
              contentLength={editedData.examen_fisico.length}
            >
              <textarea
                value={editedData.examen_fisico}
                onChange={(e) => updateField('examen_fisico', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Examen físico..."
              />
            </AccordionSection>

            {/* Sección 5: Estudios Complementarios */}
            <AccordionSection
              title="Estudios Complementarios"
              isExpanded={expandedSections.includes('estudios')}
              onToggle={() => toggleSection('estudios')}
              contentLength={editedData.estudios.length}
            >
              <textarea
                value={editedData.estudios}
                onChange={(e) => updateField('estudios', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Estudios complementarios..."
              />
            </AccordionSection>

            {/* Sección 6: Diagnóstico */}
            <AccordionSection
              title="Diagnóstico"
              isExpanded={expandedSections.includes('diagnostico')}
              onToggle={() => toggleSection('diagnostico')}
              contentLength={editedData.diagnostico.length}
            >
              <textarea
                value={editedData.diagnostico}
                onChange={(e) => updateField('diagnostico', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Diagnóstico..."
              />
            </AccordionSection>

            {/* Sección 7: Plan / Conducta */}
            <AccordionSection
              title="Plan / Conducta"
              isExpanded={expandedSections.includes('plan')}
              onToggle={() => toggleSection('plan')}
              contentLength={editedData.plan.length}
            >
              <textarea
                value={editedData.plan}
                onChange={(e) => updateField('plan', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Plan terapéutico / conducta..."
              />
            </AccordionSection>

            {/* Sección 8: Pendientes */}
            <AccordionSection
              title="Pendientes"
              isExpanded={expandedSections.includes('pendientes')}
              onToggle={() => toggleSection('pendientes')}
              contentLength={editedData.pendientes.length}
            >
              <textarea
                value={editedData.pendientes}
                onChange={(e) => updateField('pendientes', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Pendientes..."
              />
            </AccordionSection>

            {/* Sección 9: Imágenes (solo lectura) */}
            {hasImages && (
              <AccordionSection
                title="Imágenes"
                isExpanded={expandedSections.includes('imagenes')}
                onToggle={() => toggleSection('imagenes')}
                badge={
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(editedData.image_thumbnail_url?.length || 0) +
                     (editedData.exa_url?.length || 0)} archivos
                  </span>
                }
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">Las imágenes se trasladarán automáticamente desde la interconsulta:</p>
                  {editedData.image_thumbnail_url && editedData.image_thumbnail_url.length > 0 && (
                    <p className="text-xs">• {editedData.image_thumbnail_url.length} imagen(es) clínica(s)</p>
                  )}
                  {editedData.exa_url && editedData.exa_url.length > 0 && (
                    <p className="text-xs">• {editedData.exa_url.length} estudio(s) complementario(s)</p>
                  )}
                </div>
              </AccordionSection>
            )}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar en Pase de Sala'}
            </button>
          </div>
          {!isValid && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
              * Completa los campos obligatorios (Nombre, DNI, Cama)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente AccordionSection helper
interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  contentLength?: number;
  badge?: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  contentLength,
  badge
}) => {
  const hasContent = contentLength && contentLength > 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {title}
          </span>
          {hasContent && !isExpanded && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {contentLength} caracteres
            </span>
          )}
          {badge}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
};

export default WardConfirmationModal;
