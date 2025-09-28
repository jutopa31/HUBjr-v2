import React, { useState } from 'react';
import { Plus, Stethoscope, Eye } from 'lucide-react';
import LumbarPunctureForm from './LumbarPunctureForm';
import LumbarPunctureResults from './LumbarPunctureResults';
import { LumbarPuncture, LumbarPunctureFormData } from '../types/lumbarPuncture';

type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'analytics';

interface LumbarPunctureDashboardProps {
  className?: string;
}

export default function LumbarPunctureDashboard({ className = '' }: LumbarPunctureDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProcedure, setSelectedProcedure] = useState<LumbarPuncture | null>(null);

  const handleCreateNew = () => {
    setSelectedProcedure(null);
    setViewMode('create');
  };

  const handleEdit = (procedure: LumbarPuncture) => {
    setSelectedProcedure(procedure);
    setViewMode('edit');
  };

  const handleView = (procedure: LumbarPuncture) => {
    setSelectedProcedure(procedure);
    setViewMode('view');
  };

  const handleFormSubmit = (_data: LumbarPunctureFormData) => {
    // Form submission is handled by the form component
    setViewMode('list');
    setSelectedProcedure(null);
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedProcedure(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <LumbarPunctureForm
            mode="create"
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        );

      case 'edit':
        return (
          <LumbarPunctureForm
            mode="edit"
            initialData={selectedProcedure || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        );

      case 'view':
        return selectedProcedure ? (
          <ProcedureDetailView
            procedure={selectedProcedure}
            onEdit={() => handleEdit(selectedProcedure)}
            onBack={() => setViewMode('list')}
          />
        ) : null;

      case 'list':
      default:
        return (
          <LumbarPunctureResults
            onEdit={handleEdit}
            onView={handleView}
          />
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation Header */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
              Gestión de Punciones Lumbares
            </h1>
            <p className="text-gray-600 mt-1">
              Seguimiento y análisis integral de procedimientos de punción lumbar
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Procedimiento</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}

// Detailed view component for individual procedures
interface ProcedureDetailViewProps {
  procedure: LumbarPuncture;
  onEdit: () => void;
  onBack: () => void;
}

function ProcedureDetailView({ procedure, onEdit, onBack }: ProcedureDetailViewProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Eye className="h-5 w-5 text-blue-600 mr-2" />
            Detalles de Punción Lumbar
          </h2>
          <p className="text-sm text-gray-600">
            {procedure.patient_initials} - {new Date(procedure.procedure_date).toLocaleDateString('es-AR')}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            Editar
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Volver a la Lista
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Patient & Procedure Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient & Procedure Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Patient Initials</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.patient_initials}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Age</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.patient_age || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Gender</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.patient_gender || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Procedure Date</label>
              <p className="mt-1 text-sm text-gray-900">{new Date(procedure.procedure_date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Procedure Time</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.procedure_time || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Supervisor</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.supervisor}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Trainee Role</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {procedure.trainee_role?.replace('_', ' ') || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Indication</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.indication}</p>
            </div>
            {procedure.primary_diagnosis && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Primary Diagnosis</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.primary_diagnosis}</p>
              </div>
            )}
            {procedure.clinical_question && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Clinical Question</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.clinical_question}</p>
              </div>
            )}
          </div>
        </div>

        {/* Procedure Technique & Outcomes */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Procedure Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Patient Position</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {procedure.patient_position?.replace('_', ' ') || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Needle Level</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.needle_level || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Needle Gauge</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.needle_gauge || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Needle Type</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {procedure.needle_type || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Success</label>
              <p className={`mt-1 text-sm font-medium ${procedure.successful ? 'text-green-600' : 'text-red-600'}`}>
                {procedure.successful ? 'Successful' : 'Unsuccessful'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Number of Attempts</label>
              <p className="mt-1 text-sm text-gray-900">{procedure.attempts_count}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Technical Difficulty</label>
              <p className="mt-1 text-sm text-gray-900">
                {procedure.technical_difficulty ? `${procedure.technical_difficulty}/5` : 'Not rated'}
              </p>
            </div>
          </div>
        </div>

        {/* Opening Pressure */}
        {procedure.opening_pressure_measured && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opening Pressure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Pressure Value</label>
                <p className="mt-1 text-sm text-gray-900">
                  {procedure.opening_pressure_value ? `${procedure.opening_pressure_value} cmH₂O` : 'Not recorded'}
                </p>
              </div>
              {procedure.opening_pressure_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{procedure.opening_pressure_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSF Analysis */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">CSF Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {procedure.csf_appearance && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Appearance</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{procedure.csf_appearance}</p>
              </div>
            )}
            {procedure.csf_volume_collected && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Volume Collected</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.csf_volume_collected} mL</p>
              </div>
            )}
            {procedure.csf_white_cells !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-500">White Cells</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.csf_white_cells} cells/μL</p>
              </div>
            )}
            {procedure.csf_red_cells !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Red Cells</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.csf_red_cells} cells/μL</p>
              </div>
            )}
            {procedure.csf_protein !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Protein</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.csf_protein} mg/dL</p>
              </div>
            )}
            {procedure.csf_glucose !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Glucose</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.csf_glucose} mg/dL</p>
              </div>
            )}
          </div>
        </div>

        {/* Complications */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Complications</h3>
          <div className="space-y-2">
            {[
              { condition: procedure.headache_post_lp, label: 'Post-LP headache' },
              { condition: procedure.nausea_vomiting, label: 'Nausea/vomiting' },
              { condition: procedure.back_pain, label: 'Back pain' },
              { condition: procedure.bleeding, label: 'Bleeding' },
              { condition: procedure.infection, label: 'Infection' }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${item.condition ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-sm text-gray-900">{item.label}</span>
                <span className={`text-sm ${item.condition ? 'text-red-600' : 'text-green-600'}`}>
                  {item.condition ? 'Yes' : 'No'}
                </span>
              </div>
            ))}
            {procedure.other_complications && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Other Complications</label>
                <p className="mt-1 text-sm text-gray-900">{procedure.other_complications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Educational Reflection */}
        {(procedure.learning_objectives_met || procedure.supervisor_feedback || procedure.resident_reflection) && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Educational Notes</h3>
            <div className="space-y-4">
              {procedure.learning_objectives_met && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Learning Objectives Met</label>
                  <p className="mt-1 text-sm text-gray-900">{procedure.learning_objectives_met}</p>
                </div>
              )}
              {procedure.supervisor_feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Supervisor Feedback</label>
                  <p className="mt-1 text-sm text-gray-900">{procedure.supervisor_feedback}</p>
                </div>
              )}
              {procedure.resident_reflection && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Resident Reflection</label>
                  <p className="mt-1 text-sm text-gray-900">{procedure.resident_reflection}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}