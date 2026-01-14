import React, { useState, useEffect } from 'react';
import { PendingPatient, CreatePendingPatientInput, CardColor, PriorityLevel, CARD_COLORS, PRIORITY_LABELS } from '../../types/pendingPatients';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePendingPatientInput) => void;
  editingPatient?: PendingPatient | null;
  hospitalContext: 'Posadas' | 'Julian';
}

export default function PatientFormModal({ isOpen, onClose, onSave, editingPatient, hospitalContext }: PatientFormModalProps) {
  const [formData, setFormData] = useState<CreatePendingPatientInput>({
    patient_name: '',
    age: undefined,
    dni: '',
    admission_date: '',
    chief_complaint: '',
    clinical_notes: '',
    differential_diagnoses: [],
    pending_tests: [],
    color: 'default',
    priority: 'medium',
    tags: [],
    hospital_context: hospitalContext
  });

  const [differentialInput, setDifferentialInput] = useState('');
  const [testInput, setTestInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        patient_name: editingPatient.patient_name,
        age: editingPatient.age,
        dni: editingPatient.dni || '',
        admission_date: editingPatient.admission_date || '',
        chief_complaint: editingPatient.chief_complaint,
        clinical_notes: editingPatient.clinical_notes,
        differential_diagnoses: editingPatient.differential_diagnoses || [],
        pending_tests: editingPatient.pending_tests || [],
        color: editingPatient.color,
        priority: editingPatient.priority,
        tags: editingPatient.tags || [],
        hospital_context: editingPatient.hospital_context
      });
    } else {
      resetForm();
    }
  }, [editingPatient, hospitalContext]);

  const resetForm = () => {
    setFormData({
      patient_name: '',
      age: undefined,
      dni: '',
      admission_date: '',
      chief_complaint: '',
      clinical_notes: '',
      differential_diagnoses: [],
      pending_tests: [],
      color: 'default',
      priority: 'medium',
      tags: [],
      hospital_context: hospitalContext
    });
    setDifferentialInput('');
    setTestInput('');
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.patient_name && formData.chief_complaint && formData.clinical_notes) {
      onSave(formData);
      resetForm();
      onClose();
    }
  };

  const addDifferential = () => {
    if (differentialInput.trim()) {
      setFormData({
        ...formData,
        differential_diagnoses: [...(formData.differential_diagnoses || []), differentialInput.trim()]
      });
      setDifferentialInput('');
    }
  };

  const removeDifferential = (index: number) => {
    setFormData({
      ...formData,
      differential_diagnoses: formData.differential_diagnoses?.filter((_, i) => i !== index)
    });
  };

  const addTest = () => {
    if (testInput.trim()) {
      setFormData({
        ...formData,
        pending_tests: [...(formData.pending_tests || []), testInput.trim()]
      });
      setTestInput('');
    }
  };

  const removeTest = (index: number) => {
    setFormData({
      ...formData,
      pending_tests: formData.pending_tests?.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag)
    });
  };

  if (!isOpen) return null;

  const colorOptions: CardColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  const priorityOptions: PriorityLevel[] = ['urgent', 'high', 'medium', 'low'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {editingPatient ? 'Editar Paciente Pendiente' : 'Nuevo Paciente Pendiente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Nombre del paciente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Edad</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">DNI</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de ingreso</label>
              <input
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo de consulta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notas clínicas <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.clinical_notes}
              onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              rows={4}
              placeholder="Historia clínica, hallazgos relevantes, evolución..."
              required
            />
          </div>

          {/* Differential Diagnoses */}
          <div>
            <label className="block text-sm font-medium mb-1">Diagnósticos diferenciales</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={differentialInput}
                onChange={(e) => setDifferentialInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDifferential())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="Agregar diagnóstico diferencial..."
              />
              <button
                type="button"
                onClick={addDifferential}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            {formData.differential_diagnoses && formData.differential_diagnoses.length > 0 && (
              <ul className="space-y-1">
                {formData.differential_diagnoses.map((dx, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                    <span>{dx}</span>
                    <button
                      type="button"
                      onClick={() => removeDifferential(idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending Tests */}
          <div>
            <label className="block text-sm font-medium mb-1">Estudios pendientes</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTest())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="Agregar estudio pendiente..."
              />
              <button
                type="button"
                onClick={addTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            {formData.pending_tests && formData.pending_tests.length > 0 && (
              <ul className="space-y-1">
                {formData.pending_tests.map((test, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                    <span>{test}</span>
                    <button
                      type="button"
                      onClick={() => removeTest(idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Etiquetas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="Agregar etiqueta..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Color de tarjeta</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-10 rounded ${CARD_COLORS[color].bg} ${CARD_COLORS[color].border} border-2 ${
                      formData.color === color ? 'ring-2 ring-blue-500' : ''
                    } hover:scale-105 transition-transform`}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingPatient ? 'Guardar cambios' : 'Crear paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
