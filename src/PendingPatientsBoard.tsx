import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import PatientCard from './components/pendingPatients/PatientCard';
import PatientFormModal from './components/pendingPatients/PatientFormModal';
import {
  PendingPatient,
  CreatePendingPatientInput,
  PriorityLevel,
  CardColor,
  PRIORITY_LABELS
} from './types/pendingPatients';
import * as pendingPatientsService from './services/pendingPatientsService';

interface PendingPatientsBoardProps {
  hospitalContext: 'Posadas' | 'Julian';
}

export default function PendingPatientsBoard({ hospitalContext }: PendingPatientsBoardProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PendingPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PendingPatient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PendingPatient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  // FASE 2: Load patients from Supabase
  useEffect(() => {
    loadPatients();
  }, [hospitalContext, showResolved]);

  const loadPatients = async () => {
    setLoading(true);
    const { data, error } = await pendingPatientsService.fetchPendingPatients(
      hospitalContext,
      showResolved
    );

    if (!error && data) {
      setPatients(data);
    } else {
      console.error('Error loading patients:', error);
      setPatients([]);
    }
    setLoading(false);
  };

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = patients.filter(p => p.hospital_context === hospitalContext);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clinical_notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni?.includes(searchTerm)
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    // Resolved filter
    if (!showResolved) {
      filtered = filtered.filter(p => !p.resolved);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredPatients(filtered);
  }, [patients, searchTerm, priorityFilter, showResolved, hospitalContext]);

  const handleCreatePatient = async (data: CreatePendingPatientInput) => {
    const { data: newPatient, error } = await pendingPatientsService.createPendingPatient(
      data,
      user?.email || ''
    );

    if (!error && newPatient) {
      setPatients([...patients, newPatient]);
    } else {
      console.error('Error creating patient:', error);
      alert('Error al crear paciente. Por favor intenta de nuevo.');
    }
  };

  const handleEditPatient = (patient: PendingPatient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleUpdatePatient = async (data: CreatePendingPatientInput) => {
    if (!editingPatient) return;

    const { data: updatedPatient, error } = await pendingPatientsService.updatePendingPatient(
      editingPatient.id,
      data
    );

    if (!error && updatedPatient) {
      setPatients(patients.map(p =>
        p.id === editingPatient.id ? updatedPatient : p
      ));
      setEditingPatient(null);
    } else {
      console.error('Error updating patient:', error);
      alert('Error al actualizar paciente. Por favor intenta de nuevo.');
    }
  };

  const handleDeletePatient = async (id: string) => {
    const { success, error } = await pendingPatientsService.deletePendingPatient(id);

    if (success) {
      setPatients(patients.filter(p => p.id !== id));
    } else {
      console.error('Error deleting patient:', error);
      alert('Error al eliminar paciente. Por favor intenta de nuevo.');
    }
  };

  const handleResolvePatient = async (id: string, finalDiagnosis: string) => {
    const { data: resolvedPatient, error } = await pendingPatientsService.resolvePendingPatient(
      id,
      finalDiagnosis
    );

    if (!error && resolvedPatient) {
      setPatients(patients.map(p =>
        p.id === id ? resolvedPatient : p
      ));
    } else {
      console.error('Error resolving patient:', error);
      alert('Error al marcar paciente como resuelto. Por favor intenta de nuevo.');
    }
  };

  const handleColorChange = async (id: string, color: CardColor) => {
    const { data: updatedPatient, error } = await pendingPatientsService.changePatientColor(
      id,
      color
    );

    if (!error && updatedPatient) {
      setPatients(patients.map(p =>
        p.id === id ? updatedPatient : p
      ));
    } else {
      console.error('Error changing color:', error);
      // Silently fail for color changes - not critical
    }
  };

  const openCreateModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const priorityOptions: Array<{ value: PriorityLevel | 'all'; label: string }> = [
    { value: 'all', label: 'Todas las prioridades' },
    { value: 'urgent', label: PRIORITY_LABELS.urgent },
    { value: 'high', label: PRIORITY_LABELS.high },
    { value: 'medium', label: PRIORITY_LABELS.medium },
    { value: 'low', label: PRIORITY_LABELS.low }
  ];

  const unresolvedCount = patients.filter(p => !p.resolved && p.hospital_context === hospitalContext).length;
  const resolvedCount = patients.filter(p => p.resolved && p.hospital_context === hospitalContext).length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header - Compact */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Pacientes Pendientes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pacientes sin diagnóstico claro • {unresolvedCount} pendientes • {resolvedCount} resueltos
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Paciente
          </button>
        </div>

        {/* Filters - Inline and compact */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Mostrar resueltos
          </label>
        </div>
      </div>

      {/* Content - Grid of cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Cargando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No hay pacientes pendientes</p>
            <p className="text-sm mt-1">
              {searchTerm || priorityFilter !== 'all'
                ? 'Intenta ajustar los filtros'
                : 'Crea tu primer paciente pendiente'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {filteredPatients.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={handleEditPatient}
                onDelete={handleDeletePatient}
                onResolve={handleResolvePatient}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <PatientFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingPatient ? handleUpdatePatient : handleCreatePatient}
        editingPatient={editingPatient}
        hospitalContext={hospitalContext}
      />
    </div>
  );
}
