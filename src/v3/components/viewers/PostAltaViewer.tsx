import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { PatientV3 } from '../../types/v3.types';
import { getPatientsByDestination } from '../../services/patientsV3Service';
import PatientCard from '../PatientCard';
import EvolucionEditor from '../EvolucionEditor';
import AIAssistantModal from '../AIAssistantModal';

interface PostAltaViewerProps {
  onPatientUpdated?: () => void;
}

export default function PostAltaViewer({ onPatientUpdated }: PostAltaViewerProps) {
  const { theme } = useTheme();
  const [patients, setPatients] = useState<PatientV3[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientV3 | null>(null);
  const [aiPatient, setAIPatient] = useState<PatientV3 | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await getPatientsByDestination('post_alta');
    if (fetchError) {
      setError('Error al cargar post-alta');
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }

  function handlePatientUpdated() {
    loadPatients();
    if (onPatientUpdated) {
      onPatientUpdated();
    }
  }

  if (loading) {
    return (
      <div
        className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        Cargando post-alta...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <button
          onClick={loadPatients}
          className="ml-2 text-blue-500 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div
        className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}
      >
        No hay pacientes en seguimiento post-alta
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onEvolucionar={setEditingPatient}
            onAI={setAIPatient}
            onPatientUpdated={handlePatientUpdated}
            showTransitions={[]}
          />
        ))}
      </div>

      {/* Evolution Editor Modal */}
      {editingPatient && (
        <EvolucionEditor
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSaved={handlePatientUpdated}
        />
      )}

      {/* AI Assistant Modal */}
      {aiPatient && (
        <AIAssistantModal
          patient={aiPatient}
          onClose={() => setAIPatient(null)}
          onApply={handlePatientUpdated}
        />
      )}
    </>
  );
}
