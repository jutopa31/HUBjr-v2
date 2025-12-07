import React, { useState, useEffect } from 'react';
import CalendarView from './CalendarView';
import PatientCard from './PatientCard';
import PatientDetailModal from './PatientDetailModal';
import CreatePatientForm from './CreatePatientForm';
import {
  PacientePostAltaRow,
  listPacientesPostAlta,
  listPacientesPostAltaMonth
} from '../../services/pacientesPostAltaService';

/**
 * EXAMPLE INTEGRATION COMPONENT
 *
 * This demonstrates how to use the 4 Post-Alta Ambulatorio components together:
 * - CalendarView: Monthly calendar showing patient counts
 * - PatientCard: Patient summary cards
 * - PatientDetailModal: Edit patient details
 * - CreatePatientForm: Create new patients
 *
 * This is a reference implementation that can be integrated into PacientesPostAlta.tsx
 */

const PostAltaAmbulatorioExample: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patients, setPatients] = useState<PacientePostAltaRow[]>([]);
  const [patientCountByDate, setPatientCountByDate] = useState<Record<string, number>>({});
  const [selectedPatient, setSelectedPatient] = useState<PacientePostAltaRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load patients for selected date
  useEffect(() => {
    loadPatientsForDate(selectedDate);
  }, [selectedDate]);

  // Load month data for calendar counts
  useEffect(() => {
    loadMonthData(selectedDate);
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

  const loadPatientsForDate = async (date: Date) => {
    setLoading(true);
    const dateStr = date.toISOString().slice(0, 10);
    const { data } = await listPacientesPostAlta(dateStr);
    setPatients(data);
    setLoading(false);
  };

  const loadMonthData = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const { data } = await listPacientesPostAltaMonth(year, month);

    // Build count map: { '2024-01-15': 3, '2024-01-16': 2 }
    const countMap: Record<string, number> = {};
    data.forEach(patient => {
      const dateKey = patient.fecha_visita;
      countMap[dateKey] = (countMap[dateKey] || 0) + 1;
    });

    setPatientCountByDate(countMap);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePatientClick = (patient: PacientePostAltaRow) => {
    setSelectedPatient(patient);
  };

  const handlePatientUpdate = (updated: PacientePostAltaRow) => {
    // Optimistic update
    setPatients(prev =>
      prev.map(p => (p.id === updated.id ? updated : p))
    );
    setSelectedPatient(updated);

    // Reload if date changed
    if (updated.fecha_visita !== selectedPatient?.fecha_visita) {
      loadPatientsForDate(selectedDate);
      loadMonthData(selectedDate);
    }
  };

  const handlePatientCreate = () => {
    // Refresh lists after creation
    loadPatientsForDate(selectedDate);
    loadMonthData(selectedDate);
  };

  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Post-Alta Ambulatorio
      </h1>

      {/* Create Patient Form */}
      <CreatePatientForm
        isOpen={isFormOpen}
        onToggle={() => setIsFormOpen(!isFormOpen)}
        onCreate={handlePatientCreate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-1">
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            patientCountByDate={patientCountByDate}
          />
        </div>

        {/* Right: Patient List */}
        <div className="lg:col-span-2">
          <div className="medical-card p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 capitalize">
              {formatSelectedDate(selectedDate)}
            </h2>

            {loading ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                Cargando pacientes...
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No hay pacientes programados para esta fecha
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={() => handlePatientClick(patient)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdate={handlePatientUpdate}
        />
      )}
    </div>
  );
};

export default PostAltaAmbulatorioExample;
