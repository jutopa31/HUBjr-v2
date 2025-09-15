import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Calendar, User, FileText, Brain, RefreshCw, ChevronRight, Building2 } from 'lucide-react';
import { PatientAssessment, HospitalContext } from './types';
import { getPatientAssessments, deletePatientAssessment, updatePatientAssessment } from './utils/diagnosticAssessmentDB';
import PatientDetailsModal from './PatientDetailsModal';
import EditPatientNotesModal from './EditPatientNotesModal';
import HospitalContextSelector from './HospitalContextSelector';

interface SavedPatientsProps {
  isAdminMode?: boolean;
}

const SavedPatients: React.FC<SavedPatientsProps> = ({ isAdminMode = false }) => {
  const [patients, setPatients] = useState<PatientAssessment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientAssessment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitalContext, setHospitalContext] = useState<HospitalContext>('Posadas');

  // Estado para el control de expansión de filas
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Cargar pacientes al montar el componente y cuando cambie el contexto
  useEffect(() => {
    loadPatients();
  }, [hospitalContext]);

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

      // Solo pasar el contexto si está en modo admin, sino usar por defecto Posadas
      const contextToUse = isAdminMode ? hospitalContext : 'Posadas';
      const result = await getPatientAssessments(contextToUse);

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

  const handleEditPatient = (patient: PatientAssessment) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleSavePatientEdit = async (patientId: string, updates: { clinical_notes: string; patient_name?: string; patient_age?: string; patient_dni?: string }): Promise<boolean> => {
    try {
      const result = await updatePatientAssessment(patientId, updates);
      
      if (result.success) {
        // Actualizar la lista de pacientes
        await loadPatients();
        return true;
      } else {
        setError(result.error || 'Error al actualizar paciente');
        return false;
      }
    } catch (error) {
      setError('Error inesperado al actualizar paciente');
      console.error('Error updating patient:', error);
      return false;
    }
  };

  // Función para alternar la expansión de una fila
  const toggleRowExpansion = (patientId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(patientId)) {
      newExpandedRows.delete(patientId);
    } else {
      newExpandedRows.add(patientId);
    }
    setExpandedRows(newExpandedRows);
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

  const getHospitalBadge = (context: HospitalContext | undefined) => {
    if (!context) context = 'Posadas'; // fallback por defecto

    const badgeStyles = {
      'Posadas': 'bg-blue-100 text-blue-800 border-blue-200',
      'Julian': 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeStyles[context]}`}>
        <Building2 className="h-3 w-3 mr-1" />
        {context}
      </span>
    );
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

      {/* Hospital Context Selector (Admin Only) */}
      <HospitalContextSelector
        currentContext={hospitalContext}
        onContextChange={setHospitalContext}
        isAdminMode={isAdminMode}
      />

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

      {/* Lista de pacientes compacta y expandible */}
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
            <div className="divide-y divide-gray-200">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pacientes guardados desde Algoritmos Diagnósticos
                  </div>
                  <div className="text-xs text-gray-500">
                    Haz clic en las filas para expandir los detalles
                  </div>
                </div>
              </div>

              {/* Lista de pacientes */}
              {filteredPatients.map((patient) => {
                const isExpanded = expandedRows.has(patient.id || '');
                return (
                  <div key={patient.id} className={`expandable-row bg-white hover:bg-gray-50 ${
                    isExpanded ? 'shadow-md border-l-4 border-l-blue-400' : 'border-l-4 border-l-transparent'
                  }`}>
                    
                    {/* Fila principal compacta */}
                    <div 
                      className="px-6 py-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleRowExpansion(patient.id || '')}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Icono de expansión */}
                        <div className="flex-shrink-0">
                          <ChevronRight 
                            className={`expand-icon h-4 w-4 text-gray-400 ${
                              isExpanded ? 'expanded' : ''
                            }`}
                          />
                        </div>
                        
                        {/* Avatar del usuario */}
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        {/* Información principal */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <div className="text-sm font-medium text-gray-900">{patient.patient_name}</div>
                            <div className="text-xs text-gray-500">
                              {patient.clinical_notes.length > 60 
                                ? `${patient.clinical_notes.slice(0, 60)}...` 
                                : patient.clinical_notes
                              }
                            </div>
                          </div>
                          
                          <div className="hidden lg:block">
                            <div className="text-sm text-gray-700">
                              {patient.patient_age && `${patient.patient_age} años`}
                            </div>
                            <div className="text-xs text-gray-500">
                              DNI: {patient.patient_dni || 'Sin especificar'}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="severity-indicator inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {getScaleSummary(patient)}
                                </span>
                                {isAdminMode && getHospitalBadge(patient.hospital_context)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(patient.created_at || '')}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPatient(patient);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalles completos"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  patient.id && handleDeletePatient(patient.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar paciente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    <div className={`expandable-content ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-6 pb-4 border-t border-gray-200 bg-gray-50 medical-details">
                        <div className="pt-4 space-y-4">
                          
                          {/* Información del paciente */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Información Personal</h4>
                              <div className="text-gray-600 medical-card p-2 rounded space-y-1">
                                <div><strong>Nombre:</strong> {patient.patient_name}</div>
                                <div><strong>Edad:</strong> {patient.patient_age ? `${patient.patient_age} años` : 'No especificada'}</div>
                                <div><strong>DNI:</strong> {patient.patient_dni || 'No especificado'}</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Fecha de Evaluación</h4>
                              <div className="text-gray-600 medical-card p-2 rounded">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {formatDate(patient.created_at || '')}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Escalas Aplicadas</h4>
                              <div className="text-gray-600 medical-card p-2 rounded">
                                <div className="flex items-center">
                                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                                  <span className="font-medium text-purple-800">
                                    {getScaleSummary(patient)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Notas clínicas */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Notas Clínicas</h4>
                            <div className="text-gray-600 medical-card p-3 rounded max-h-24 overflow-y-auto">
                              {patient.clinical_notes}
                            </div>
                          </div>
                          
                          {/* Resultados de escalas */}
                          {patient.scale_results && patient.scale_results.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Resultados de Escalas</h4>
                              <div className="medical-card p-3 rounded max-h-32 overflow-y-auto">
                                <div className="space-y-2">
                                  {patient.scale_results.map((result, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                      <span className="font-medium">{result.scale_name}</span>
                                      <span className="text-blue-600 font-semibold">
                                        Puntuación: {result.score}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        patient={selectedPatient}
        onEdit={handleEditPatient}
      />

      {/* Edit Patient Notes Modal */}
      <EditPatientNotesModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        patient={selectedPatient}
        onSave={handleSavePatientEdit}
      />
    </div>
  );
};

export default SavedPatients;