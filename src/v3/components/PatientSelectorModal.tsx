import React, { useState, useEffect } from 'react';
import { X, Search, Users, Building2, Calendar, UserCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3, PatientDestination, DestinationCounts } from '../types/v3.types';
import { getPatientsByDestination, getDestinationCounts } from '../services/patientsV3Service';

interface PatientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: PatientV3) => void;
  currentPatientId?: string;
}

const tabs: { id: PatientDestination; label: string; icon: React.ReactNode }[] = [
  { id: 'interconsulta', label: 'Interconsultas', icon: <Users className="w-4 h-4" /> },
  { id: 'pase_sala', label: 'Pase Sala', icon: <Building2 className="w-4 h-4" /> },
  { id: 'post_alta', label: 'Post-Alta', icon: <Calendar className="w-4 h-4" /> },
  { id: 'ambulatorio', label: 'Ambulatorio', icon: <UserCheck className="w-4 h-4" /> },
];

export default function PatientSelectorModal({
  isOpen,
  onClose,
  onSelectPatient,
  currentPatientId,
}: PatientSelectorModalProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<PatientDestination>('interconsulta');
  const [patients, setPatients] = useState<PatientV3[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<DestinationCounts>({
    interconsulta: 0,
    pase_sala: 0,
    post_alta: 0,
    ambulatorio: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadCounts();
      loadPatients(activeTab);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadPatients(activeTab);
    }
  }, [activeTab]);

  async function loadCounts() {
    const { data } = await getDestinationCounts();
    if (data) setCounts(data);
  }

  async function loadPatients(destination: PatientDestination) {
    setLoading(true);
    const { data } = await getPatientsByDestination(destination);
    setPatients(data || []);
    setLoading(false);
  }

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(query) ||
      p.dni.toLowerCase().includes(query) ||
      (p.diagnostico && p.diagnostico.toLowerCase().includes(query))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl shadow-2xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Seleccionar Paciente
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                    : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI o diagnóstico..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Cargando pacientes...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes en esta categoría'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    patient.id === currentPatientId
                      ? theme === 'dark'
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-blue-500 bg-blue-50'
                      : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {patient.nombre}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        DNI: {patient.dni} {patient.cama && `| Cama: ${patient.cama}`}
                      </p>
                      {patient.diagnostico && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          Dx: {patient.diagnostico.substring(0, 60)}
                          {patient.diagnostico.length > 60 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    {patient.id === currentPatientId && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        Actual
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
