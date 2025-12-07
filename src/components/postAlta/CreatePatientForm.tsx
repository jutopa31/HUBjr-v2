import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { PacientePostAltaRow, createPacientePostAlta } from '../../services/pacientesPostAltaService';

interface CreatePatientFormProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreate: (patient: PacientePostAltaRow) => void;
}

const CreatePatientForm: React.FC<CreatePatientFormProps> = ({ isOpen, onToggle, onCreate }) => {
  const initialFormState: Omit<PacientePostAltaRow, 'id' | 'user_id' | 'hospital_context' | 'created_at' | 'updated_at'> = {
    dni: '',
    nombre: '',
    diagnostico: '',
    fecha_visita: new Date().toISOString().slice(0, 10), // Default: today
    telefono: '',
    pendiente: '',
    notas_evolucion: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const isValid = (): boolean => {
    return !!(
      formData.dni.trim() &&
      formData.nombre.trim() &&
      formData.diagnostico.trim() &&
      formData.fecha_visita.trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      setMessage({ type: 'error', text: 'Por favor complete los campos requeridos (DNI, Nombre, Diagnóstico, Fecha)' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { success, error } = await createPacientePostAlta(formData);

      if (success) {
        setMessage({ type: 'success', text: 'Paciente creado exitosamente' });

        // Clear form
        setFormData(initialFormState);

        // Notify parent to refresh list
        onCreate(formData as PacientePostAltaRow);

        // Auto-collapse form after 2 seconds
        setTimeout(() => {
          setMessage(null);
          onToggle();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: error || 'Error al crear el paciente' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error inesperado' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="medical-card rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Nuevo Paciente Post-Alta
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Form - Collapsible */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Required Fields Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Campos Requeridos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre y apellido"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.diagnostico}
                  onChange={(e) => handleChange('diagnostico', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Diagnóstico principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Visita <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_visita}
                  onChange={(e) => handleChange('fecha_visita', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Campos Opcionales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono || ''}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 11-1234-5678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pendiente
                </label>
                <textarea
                  value={formData.pendiente || ''}
                  onChange={(e) => handleChange('pendiente', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tareas o estudios pendientes"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas de Evolución
                </label>
                <textarea
                  value={formData.notas_evolucion || ''}
                  onChange={(e) => handleChange('notas_evolucion', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Evolución del paciente en visitas ambulatorias"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid() || isSubmitting}
              className={`
                w-full px-4 py-2 rounded-md font-medium transition-colors
                ${isValid() && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? 'Creando...' : 'Crear Paciente'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreatePatientForm;
