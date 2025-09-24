import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit, User,
  FileText, Brain, Syringe, Activity, ChevronRight, Building2,
  CheckCircle, Users
} from 'lucide-react';
import { PatientAssessment, HospitalContext } from './types';
import { useAuthContext } from './components/auth/AuthProvider';
import PatientDetailView from './PatientDetailView';

interface UnifiedPatientsProps {
  hospitalContext: HospitalContext;
  onPatientSelect?: (patient: PatientAssessment) => void;
}

interface Patient extends PatientAssessment {
  // Ward-specific fields from WardRounds
  cama?: string;
  assigned_resident_id?: string;
  source: 'saved' | 'ward';
  severidad?: string;
  pendientes?: string;
}

type ViewMode = 'list' | 'cards' | 'detail';
type FilterType = 'all' | 'today' | 'mine' | 'urgent' | 'ward' | 'saved';

const UnifiedPatients: React.FC<UnifiedPatientsProps> = ({
  hospitalContext,
  onPatientSelect
}) => {
  const { user, hasHospitalContextAccess } = useAuthContext();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  useEffect(() => {
    loadPatients();
  }, [hospitalContext]);

  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, activeFilter, user]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual data loading from both sources
      // This would combine data from SavedPatients and WardRounds
      const mockPatients: Patient[] = [
        {
          id: '1',
          patient_name: 'Juan Pérez',
          dni: '12345678',
          age: 65,
          admission_date: '2024-01-15',
          clinical_notes: 'Paciente con ACV isquémico agudo. Tratamiento con tPA.',
          diagnosis: 'ACV Isquémico',
          treatment_plan: 'Anticoagulación, rehabilitación',
          created_by: user?.id || '',
          created_at: '2024-01-15T08:00:00',
          updated_at: '2024-01-15T08:00:00',
          hospital_context: hospitalContext,
          cama: '12',
          severidad: 'Alta',
          pendientes: 'Control neurológico c/4hs',
          source: 'ward'
        },
        {
          id: '2',
          patient_name: 'María González',
          dni: '87654321',
          age: 45,
          admission_date: '2024-01-14',
          clinical_notes: 'Cefalea tensional crónica. Evaluación con escalas.',
          diagnosis: 'Cefalea Tensional',
          treatment_plan: 'Analgésicos, técnicas de relajación',
          created_by: user?.id || '',
          created_at: '2024-01-14T10:30:00',
          updated_at: '2024-01-14T10:30:00',
          hospital_context: hospitalContext,
          source: 'saved'
        },
        {
          id: '3',
          patient_name: 'Carlos Rodríguez',
          dni: '11223344',
          age: 72,
          admission_date: '2024-01-16',
          clinical_notes: 'Sospecha de enfermedad de Parkinson. Pendiente evaluación UPDRS.',
          diagnosis: 'Parkinsonismo',
          treatment_plan: 'Evaluación neurológica completa',
          created_by: user?.id || '',
          created_at: '2024-01-16T14:15:00',
          updated_at: '2024-01-16T14:15:00',
          hospital_context: hospitalContext,
          cama: '15',
          severidad: 'Media',
          pendientes: 'UPDRS, DaTscan',
          source: 'ward'
        }
      ];

      setPatients(mockPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.patient_name.toLowerCase().includes(term) ||
        patient.dni.includes(term) ||
        patient.diagnosis?.toLowerCase().includes(term) ||
        patient.clinical_notes.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(p =>
          p.admission_date === today ||
          p.updated_at.split('T')[0] === today
        );
        break;
      case 'mine':
        filtered = filtered.filter(p => p.created_by === user?.id);
        break;
      case 'urgent':
        filtered = filtered.filter(p => p.severidad === 'Alta');
        break;
      case 'ward':
        filtered = filtered.filter(p => p.source === 'ward');
        break;
      case 'saved':
        filtered = filtered.filter(p => p.source === 'saved');
        break;
    }

    setFilteredPatients(filtered);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  const getSeverityColor = (severidad?: string) => {
    switch (severidad?.toLowerCase()) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    return source === 'ward' ? Building2 : FileText;
  };

  const FilterButton: React.FC<{
    filter: FilterType;
    label: string;
    count?: number;
  }> = ({ filter, label, count }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeFilter === filter
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  );

  const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    const SourceIcon = getSourceIcon(patient.source);

    return (
      <div
        onClick={() => handlePatientClick(patient)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <SourceIcon className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">{patient.patient_name}</h3>
            {patient.cama && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Cama {patient.cama}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {patient.severidad && (
              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(patient.severidad)}`}>
                {patient.severidad}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>DNI: {patient.dni} • {patient.age} años</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>{patient.diagnosis}</span>
          </div>
          {patient.pendientes && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-700">{patient.pendientes}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {new Date(patient.updated_at).toLocaleDateString('es-AR')}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open evaluation modal
              }}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open procedures modal
              }}
              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Syringe className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open edit modal
              }}
              className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedPatient && viewMode === 'detail') {
    return (
      <PatientDetailView
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onEdit={() => {/* TODO */}}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Pacientes
        </h1>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setShowNewPatientModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes por nombre, DNI o diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton filter="all" label="Todos" count={patients.length} />
          <FilterButton filter="today" label="Hoy" />
          <FilterButton filter="mine" label="Mis Pacientes" />
          <FilterButton filter="urgent" label="Urgentes" />
          <FilterButton filter="ward" label="Sala" />
          <FilterButton filter="saved" label="Guardados" />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32"></div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {filteredPatients.length} de {patients.length} pacientes
            </p>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron pacientes</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega tu primer paciente'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedPatients;