/**
 * WardPatientCard Demo Component
 *
 * This file demonstrates the WardPatientCard component with sample data.
 * Use this for visual testing and integration verification.
 *
 * To use: Import and render <WardPatientCardDemo /> in your app
 */

import React, { useState } from 'react';
import WardPatientCard from './WardPatientCard';

// Sample data matching the Patient interface
const samplePatients = [
  {
    id: '1',
    cama: '101',
    dni: '12345678',
    nombre: 'Juan Pérez García',
    edad: '45',
    antecedentes: 'HTA, DM2',
    motivo_consulta: 'Cefalea intensa',
    examen_fisico: 'Vigil, OTEP, MOE',
    estudios: 'TAC cerebral sin contraste',
    severidad: 'II',
    diagnostico: 'Cefalea tensional. Hipertensión arterial no controlada. Control de factores de riesgo cardiovascular.',
    plan: 'Analgesia, control TA',
    pendientes: 'Pendiente laboratorio completo y TAC cerebral con contraste',
    fecha: '2025-12-07',
    image_thumbnail_url: ['url1', 'url2'],
    image_full_url: ['url1', 'url2'],
    assigned_resident_id: 'res1',
    display_order: 0
  },
  {
    id: '2',
    cama: '205',
    dni: '87654321',
    nombre: 'María González López',
    edad: '67',
    antecedentes: 'ACV isquémico previo, FA',
    motivo_consulta: 'Debilidad hemicuerpo derecho',
    examen_fisico: 'Vigil, hemiparesia derecha',
    estudios: 'RMN cerebral, ECG',
    severidad: 'IV',
    diagnostico: 'ACV isquémico agudo en territorio ACM izquierda',
    plan: 'Anticoagulación, neurorehabilitación',
    pendientes: '',
    fecha: '2025-12-07',
    image_thumbnail_url: ['url1', 'url2', 'url3'],
    image_full_url: ['url1', 'url2', 'url3'],
    assigned_resident_id: 'res2',
    display_order: 1
  },
  {
    id: '3',
    cama: 'UCO-3',
    dni: '45678901',
    nombre: 'Carlos Rodríguez Fernández',
    edad: '52',
    antecedentes: 'Tabaquismo, dislipidemia',
    motivo_consulta: 'Mareos y vértigo',
    examen_fisico: 'Vigil, nistagmo horizontal',
    estudios: 'Videoelectronistagmografía',
    severidad: 'I',
    diagnostico: 'Vértigo posicional paroxístico benigno del canal semicircular posterior derecho',
    plan: 'Maniobra de Epley, seguimiento ambulatorio',
    pendientes: 'Evaluación ORL para descartar otras causas de vértigo periférico',
    fecha: '2025-12-07',
    assigned_resident_id: 'res1',
    display_order: 2
  },
  {
    id: '4',
    cama: '310',
    dni: '23456789',
    nombre: 'Ana Martínez Sánchez',
    edad: '38',
    antecedentes: 'Migraña crónica',
    motivo_consulta: 'Crisis migrañosa refractaria',
    examen_fisico: 'Vigil, sin focalidad neurológica',
    estudios: 'TAC cerebral normal',
    severidad: 'III',
    diagnostico: 'Estado migrañoso refractario a tratamiento convencional con componente depresivo asociado',
    plan: 'Protocolo para estado migrañoso, valoración psiquiatría',
    pendientes: 'RMN cerebral con angio-RMN, interconsulta psiquiatría urgente',
    fecha: '2025-12-07',
    image_thumbnail_url: [],
    image_full_url: [],
    assigned_resident_id: undefined,
    display_order: 3
  }
];

const sampleResidents = [
  {
    id: 'res1',
    email: 'dr.garcia@hospital.com',
    full_name: 'Dr. García',
    role: 'R3'
  },
  {
    id: 'res2',
    email: 'dr.lopez@hospital.com',
    full_name: 'Dra. López',
    role: 'R2'
  }
];

const WardPatientCardDemo: React.FC = () => {
  const [patients, setPatients] = useState(samplePatients);
  const [selectedPatient, setSelectedPatient] = useState<typeof samplePatients[0] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, patientId: string) => {
    setDraggedId(patientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPatientId: string) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetPatientId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = patients.findIndex(p => p.id === draggedId);
    const targetIndex = patients.findIndex(p => p.id === targetPatientId);

    const newPatients = [...patients];
    const [removed] = newPatients.splice(draggedIndex, 1);
    newPatients.splice(targetIndex, 0, removed);

    const updatedPatients = newPatients.map((p, index) => ({
      ...p,
      display_order: index
    }));

    setPatients(updatedPatients);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handlePatientClick = (patient: typeof samplePatients[0]) => {
    setSelectedPatient(patient);
    console.log('Patient clicked:', patient);
  };

  const closeModal = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            WardPatientCard Component Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrating the card view for ward rounds. Try dragging cards to reorder them!
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onDragEnter={() => setDragOverId(patient.id!)}
              onDragLeave={() => setDragOverId(null)}
            >
              <WardPatientCard
                patient={patient}
                resident={sampleResidents.find(r => r.id === patient.assigned_resident_id)}
                onClick={() => handlePatientClick(patient)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === patient.id}
                isDragOver={dragOverId === patient.id}
              />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Severity Legend
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="badge-severity-1 px-3 py-1 text-xs font-semibold rounded">I</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Mild</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-severity-2 px-3 py-1 text-xs font-semibold rounded">II</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-severity-3 px-3 py-1 text-xs font-semibold rounded">III</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-severity-4 px-3 py-1 text-xs font-semibold rounded">IV</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
            </div>
          </div>
        </div>

        {/* Simple Modal */}
        {selectedPatient && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <div
              className="medical-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {selectedPatient.nombre}
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>DNI:</strong> {selectedPatient.dni}</p>
                <p><strong>Edad:</strong> {selectedPatient.edad}</p>
                <p><strong>Cama:</strong> {selectedPatient.cama}</p>
                <p><strong>Severidad:</strong> {selectedPatient.severidad}</p>
                <p><strong>Diagnóstico:</strong> {selectedPatient.diagnostico}</p>
                <p><strong>Plan:</strong> {selectedPatient.plan}</p>
                {selectedPatient.pendientes && (
                  <p><strong>Pendientes:</strong> {selectedPatient.pendientes}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WardPatientCardDemo;
