import React, { useState } from 'react';
import { Plus, Stethoscope, Save, X, Calendar, User, ClipboardList, CheckCircle, AlertTriangle, FileText, Users } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';
import { ProcedureFormData, UserProcedure } from '../../types/userTracking';

interface ProcedureLoggerProps {
  onClose?: () => void;
}

const PROCEDURE_TYPES = [
  { value: 'lumbar_puncture', label: 'Punción Lumbar', icon: Stethoscope },
  { value: 'eeg', label: 'Electroencefalograma', icon: ClipboardList },
  { value: 'emg', label: 'Electromiografía', icon: ClipboardList },
  { value: 'ultrasound', label: 'Ecografía', icon: Stethoscope },
  { value: 'biopsy', label: 'Biopsia', icon: Stethoscope },
  { value: 'other', label: 'Otro Procedimiento', icon: Stethoscope }
] as const;

const ProcedureLogger: React.FC<ProcedureLoggerProps> = ({ onClose }) => {
  const { procedures, addProcedure, updateProcedure, deleteProcedure, proceduresLoading, error } = useUserData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<UserProcedure | null>(null);
  const [formData, setFormData] = useState<ProcedureFormData>({
    procedure_type: 'lumbar_puncture',
    procedure_name: '',
    patient_name: '',
    patient_dni: '',
    date_performed: new Date().toISOString().split('T')[0],
    success: true,
    complications: '',
    notes: '',
    learning_points: '',
    supervisor: ''
  });

  const resetForm = () => {
    setFormData({
      procedure_type: 'lumbar_puncture',
      procedure_name: '',
      patient_name: '',
      patient_dni: '',
      date_performed: new Date().toISOString().split('T')[0],
      success: true,
      complications: '',
      notes: '',
      learning_points: '',
      supervisor: ''
    });
    setShowAddForm(false);
    setEditingProcedure(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProcedure) {
        await updateProcedure(editingProcedure.id!, formData);
      } else {
        await addProcedure(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving procedure:', error);
    }
  };

  const handleEdit = (procedure: UserProcedure) => {
    setFormData({
      procedure_type: procedure.procedure_type,
      procedure_name: procedure.procedure_name,
      patient_name: procedure.patient_name || '',
      patient_dni: procedure.patient_dni || '',
      date_performed: procedure.date_performed,
      success: procedure.success,
      complications: procedure.complications || '',
      notes: procedure.notes || '',
      learning_points: procedure.learning_points || '',
      supervisor: procedure.supervisor || ''
    });
    setEditingProcedure(procedure);
    setShowAddForm(true);
  };

  const handleDelete = async (procedureId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este procedimiento?')) {
      await deleteProcedure(procedureId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getProcedureTypeInfo = (type: string) => {
    return PROCEDURE_TYPES.find(t => t.value === type) || PROCEDURE_TYPES[0];
  };

  const getSuccessRate = () => {
    if (procedures.length === 0) return 0;
    return Math.round((procedures.filter(p => p.success).length / procedures.length) * 100);
  };

  if (proceduresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Registro de Procedimientos</h2>
            <p className="text-sm text-gray-600">
              {procedures.length} procedimientos registrados • {getSuccessRate()}% tasa de éxito
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Procedimiento</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingProcedure ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Procedimiento
                </label>
                <select
                  value={formData.procedure_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, procedure_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {PROCEDURE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Procedimiento
                </label>
                <input
                  type="text"
                  value={formData.procedure_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, procedure_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Punción lumbar diagnóstica"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del paciente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI del Paciente
                </label>
                <input
                  type="text"
                  value={formData.patient_dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_dni: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Procedimiento
                </label>
                <input
                  type="date"
                  value={formData.date_performed}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_performed: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor
                </label>
                <input
                  type="text"
                  value={formData.supervisor}
                  onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dr. Nombre del supervisor"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.success}
                  onChange={(e) => setFormData(prev => ({ ...prev, success: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Procedimiento exitoso</span>
              </label>
            </div>

            {!formData.success && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complicaciones
                </label>
                <textarea
                  value={formData.complications}
                  onChange={(e) => setFormData(prev => ({ ...prev, complications: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describa las complicaciones..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Procedimiento
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Notas adicionales sobre el procedimiento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntos de Aprendizaje
              </label>
              <textarea
                value={formData.learning_points}
                onChange={(e) => setFormData(prev => ({ ...prev, learning_points: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="¿Qué aprendió de este procedimiento?"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={proceduresLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingProcedure ? 'Actualizar' : 'Guardar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Procedures List */}
      <div className="space-y-4">
        {procedures.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay procedimientos registrados</h3>
            <p className="text-gray-600 mb-4">Comience a registrar sus procedimientos para hacer seguimiento de su progreso.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Registrar Primer Procedimiento
            </button>
          </div>
        ) : (
          procedures.map((procedure) => {
            const typeInfo = getProcedureTypeInfo(procedure.procedure_type);

            return (
              <div key={procedure.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${procedure.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      {procedure.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">{procedure.procedure_name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {typeInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(procedure.date_performed)}</span>
                        </div>
                        {procedure.patient_name && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{procedure.patient_name}</span>
                          </div>
                        )}
                        {procedure.supervisor && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>Supervisor: {procedure.supervisor}</span>
                          </div>
                        )}
                      </div>

                      {procedure.notes && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-700">{procedure.notes}</p>
                        </div>
                      )}

                      {procedure.learning_points && (
                        <div className="mb-2">
                          <div className="flex items-start space-x-1">
                            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-700 font-medium">Aprendizaje: {procedure.learning_points}</p>
                          </div>
                        </div>
                      )}

                      {!procedure.success && procedure.complications && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>Complicaciones:</strong> {procedure.complications}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(procedure)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                      title="Editar procedimiento"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(procedure.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                      title="Eliminar procedimiento"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProcedureLogger;