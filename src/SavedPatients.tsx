import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Calendar, User, FileText, Brain, RefreshCw } from 'lucide-react';
import { PatientAssessment } from './types';
import { getPatientAssessments, deletePatientAssessment } from './utils/diagnosticAssessmentDB';
import PatientDetailsModal from './PatientDetailsModal';

const SavedPatients: React.FC = () => {
  const [patients, setPatients] = useState<PatientAssessment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientAssessment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPatients();
  }, []);

  // Filtrar pacientes cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(patient =>
        patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_dni.includes(searchTerm) ||
        patient.clinical_notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPatientAssessments();
      
      if (result.success && result.data) {
        setPatients(result.data);
        setFilteredPatients(result.data);
      } else {
        setError(result.error || 'Error al cargar pacientes');
      }
    } catch (error) {
      setError('Error inesperado al cargar pacientes');
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm('¿Está seguro que desea eliminar este paciente?')) {
      return;
    }

    try {
      const result = await deletePatientAssessment(patientId);
      
      if (result.success) {
        // Recargar la lista de pacientes
        await loadPatients();
      } else {
        setError(result.error || 'Error al eliminar paciente');
      }
    } catch (error) {
      setError('Error inesperado al eliminar paciente');
      console.error('Error deleting patient:', error);
    }
  };

  const handleViewPatient = (patient: PatientAssessment) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScaleSummary = (patient: PatientAssessment) => {
    const scaleCount = patient.scale_results?.length || 0;
    if (scaleCount === 0) return 'Sin escalas';
    if (scaleCount === 1) return '1 escala';
    return `${scaleCount} escalas`;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <div className="text-lg text-gray-600">Cargando pacientes guardados...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-blue-600" />
            Pacientes Guardados
          </h1>
          <p className="text-gray-600 mt-1">
            Evaluaciones diagnósticas guardadas desde Algoritmos Diagnósticos
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadPatients}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, DNI o contenido de notas..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-800 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mostrando</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
            </div>
            <Search className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Escalas</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((total, patient) => total + (patient.scale_results?.length || 0), 0)}
              </p>
            </div>
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {patients.length === 0 ? (
              <>
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No hay pacientes guardados</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Los pacientes se guardarán aquí cuando use la función "Guardar Paciente" 
                  en la sección de Algoritmos Diagnósticos.
                </p>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-600">
                  No hay pacientes que coincidan con la búsqueda "{searchTerm}"
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edad/DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Escalas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.patient_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.clinical_notes.slice(0, 60)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.patient_age && `${patient.patient_age} años`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.patient_dni || 'Sin DNI'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getScaleSummary(patient)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(patient.created_at || '')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPatient(patient)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => patient.id && handleDeletePatient(patient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        patient={selectedPatient}
      />
    </div>
  );
};

export default SavedPatients;