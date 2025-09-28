import React, { useState } from 'react';
import { Users, Plus, Eye, Edit, CheckCircle, Calendar, FileText, Filter, Search } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';
import { PatientFormData, UserPatient } from '../../types/userTracking';

const MyPatients: React.FC = () => {
  const { patients, addPatient, updatePatient, dischargePatient, patientsLoading, error } = useUserData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<UserPatient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<UserPatient | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'discharged' | 'transferred'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<PatientFormData>({
    patient_name: '',
    patient_dni: '',
    diagnosis: '',
    date_assigned: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      patient_name: '',
      patient_dni: '',
      diagnosis: '',
      date_assigned: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddForm(false);
    setEditingPatient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id!, formData);
      } else {
        await addPatient(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleEdit = (patient: UserPatient) => {
    setFormData({
      patient_name: patient.patient_name,
      patient_dni: patient.patient_dni || '',
      diagnosis: patient.diagnosis || '',
      date_assigned: patient.date_assigned,
      notes: patient.notes || ''
    });
    setEditingPatient(patient);
    setShowAddForm(true);
  };

  const handleDischarge = async (patient: UserPatient) => {
    const outcome = window.prompt('Ingrese el resultado del alta (opcional):');
    if (outcome !== null) {
      await dischargePatient(patient.id!, outcome || undefined);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    const matchesSearch = patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.patient_dni && patient.patient_dni.includes(searchTerm)) ||
                         (patient.diagnosis && patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'discharged': return 'bg-green-100 text-green-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'discharged': return 'Alta';
      case 'transferred': return 'Transferido';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const calculateDaysAssigned = (dateAssigned: string, dateDiscarged?: string) => {
    const assignedDate = new Date(dateAssigned);
    const endDate = dateDiscarged ? new Date(dateDiscarged) : new Date();
    const diffTime = Math.abs(endDate.getTime() - assignedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (patientsLoading) {
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
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mis Pacientes</h2>
            <p className="text-sm text-gray-600">
              {patients.filter(p => p.status === 'active').length} activos • {patients.length} total
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Paciente</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="discharged">Alta</option>
            <option value="transferred">Transferidos</option>
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingPatient ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Paciente *
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nombre completo del paciente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  value={formData.patient_dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_dni: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico
                </label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Diagnóstico principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Asignación *
                </label>
                <input
                  type="date"
                  value={formData.date_assigned}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_assigned: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Notas adicionales sobre el paciente..."
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
                disabled={patientsLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {editingPatient ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron pacientes' : 'No hay pacientes asignados'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Intente cambiar los filtros de búsqueda.'
                : 'Comience agregando pacientes a su lista personal.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Agregar Primer Paciente
              </button>
            )}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{patient.patient_name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(patient.status)}`}>
                      {getStatusLabel(patient.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                    {patient.patient_dni && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>DNI: {patient.patient_dni}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Asignado: {formatDate(patient.date_assigned)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {calculateDaysAssigned(patient.date_assigned, patient.date_discharged)} días
                      </span>
                    </div>
                  </div>

                  {patient.diagnosis && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-700">
                        <strong>Diagnóstico:</strong> {patient.diagnosis}
                      </p>
                    </div>
                  )}

                  {patient.notes && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-700">{patient.notes}</p>
                    </div>
                  )}

                  {patient.outcome && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">
                        <strong>Resultado del alta:</strong> {patient.outcome}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(patient)}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-lg"
                    title="Editar paciente"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {patient.status === 'active' && (
                    <button
                      onClick={() => handleDischarge(patient)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg"
                      title="Dar de alta"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Detalles del Paciente</h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <FileText className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-gray-900">{selectedPatient.patient_name}</p>
                </div>
                {selectedPatient.patient_dni && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">DNI</label>
                    <p className="text-gray-900">{selectedPatient.patient_dni}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPatient.status)}`}>
                    {getStatusLabel(selectedPatient.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Días asignado</label>
                  <p className="text-gray-900">
                    {calculateDaysAssigned(selectedPatient.date_assigned, selectedPatient.date_discharged)} días
                  </p>
                </div>
              </div>

              {selectedPatient.diagnosis && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
                  <p className="text-gray-900">{selectedPatient.diagnosis}</p>
                </div>
              )}

              {selectedPatient.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <p className="text-gray-900">{selectedPatient.notes}</p>
                </div>
              )}

              {selectedPatient.learning_outcomes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resultados de Aprendizaje</label>
                  <p className="text-gray-900">{selectedPatient.learning_outcomes}</p>
                </div>
              )}

              {selectedPatient.outcome && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resultado del Alta</label>
                  <p className="text-gray-900">{selectedPatient.outcome}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatients;