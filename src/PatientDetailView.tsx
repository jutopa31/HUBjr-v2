import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Edit, Save, X, Plus, User,
  Brain, Syringe, FileText, AlertCircle,
  Clock, Building2
} from 'lucide-react';
import { PatientAssessment, Scale, ScaleResult } from './types';
import ScaleModal from './ScaleModal';

interface PatientDetailViewProps {
  patient: PatientAssessment & {
    cama?: string;
    severidad?: string;
    pendientes?: string;
    source: 'saved' | 'ward';
  };
  onBack: () => void;
  onEdit: (patient: PatientAssessment) => void;
}

type DetailTab = 'overview' | 'scales' | 'procedures' | 'notes' | 'timeline';

const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patient,
  onBack,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(patient.clinical_notes);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [scaleResults, setScaleResults] = useState<ScaleResult[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    try {
      // TODO: Load scale results and procedures for this patient
      // For now, mock data
      setScaleResults([
        {
          id: '1',
          scale_type: 'NIHSS',
          total_score: 8,
          result_data: { motor: 4, speech: 2, consciousness: 2 },
          created_at: '2024-01-15T10:00:00',
          created_by: 'Dr. Alonso'
        }
      ]);

      setProcedures([
        {
          id: '1',
          type: 'lumbar_puncture',
          date: '2024-01-15T09:00:00',
          status: 'completed',
          notes: 'Procedimiento exitoso, LCR claro'
        }
      ]);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      // TODO: Save notes to database
      setIsEditing(false);
      console.log('Saving notes:', editedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleScaleComplete = (result: ScaleResult) => {
    setScaleResults(prev => [...prev, result]);
    setSelectedScale(null);
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'scales', label: 'Escalas', icon: Brain },
    { id: 'procedures', label: 'Procedimientos', icon: Syringe },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'timeline', label: 'Cronología', icon: Clock }
  ];

  const TabButton: React.FC<{
    tab: DetailTab;
    label: string;
    icon: React.ElementType;
  }> = ({ tab, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-500 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <p className="text-gray-900">{patient.patient_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <p className="text-gray-900">{patient.dni}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
            <p className="text-gray-900">{patient.age} años</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
            <p className="text-gray-900">
              {new Date(patient.admission_date).toLocaleDateString('es-AR')}
            </p>
          </div>
          {patient.cama && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cama</label>
              <p className="text-gray-900">Cama {patient.cama}</p>
            </div>
          )}
          {patient.severidad && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
              <span className={`px-2 py-1 rounded-full text-sm ${
                patient.severidad === 'Alta' ? 'bg-red-100 text-red-800' :
                patient.severidad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {patient.severidad}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Diagnóstico y Plan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
            <p className="text-gray-900">{patient.diagnosis}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Tratamiento</label>
            <p className="text-gray-900">{patient.treatment_plan}</p>
          </div>
          {patient.pendientes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pendientes</label>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-yellow-700">{patient.pendientes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ScalesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Evaluaciones con Escalas</h3>
        <button
          onClick={() => {/* TODO: Open scale selection modal */}}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Escala</span>
        </button>
      </div>

      {scaleResults.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No hay evaluaciones con escalas registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scaleResults.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{result.scale_type}</h4>
                <span className="text-2xl font-bold text-blue-600">{result.total_score}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Realizada el {new Date(result.created_at).toLocaleString('es-AR')}</p>
                <p>Por: {result.created_by}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ProceduresTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Procedimientos</h3>
        <button
          onClick={() => {/* TODO: Open procedure modal */}}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Procedimiento</span>
        </button>
      </div>

      {procedures.length === 0 ? (
        <div className="text-center py-8">
          <Syringe className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No hay procedimientos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {procedures.map((procedure) => (
            <div key={procedure.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">
                  {procedure.type === 'lumbar_puncture' ? 'Punción Lumbar' : procedure.type}
                </h4>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  procedure.status === 'completed' ? 'bg-green-100 text-green-800' :
                  procedure.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {procedure.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Fecha: {new Date(procedure.date).toLocaleString('es-AR')}</p>
                {procedure.notes && <p>Notas: {procedure.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const NotesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notas Clínicas</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              rows={12}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escriba las notas clínicas..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Guardar</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedNotes(patient.clinical_notes);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-gray-900">
            {patient.clinical_notes || 'No hay notas clínicas registradas.'}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'scales':
        return <ScalesTab />;
      case 'procedures':
        return <ProceduresTab />;
      case 'notes':
        return <NotesTab />;
      case 'timeline':
        return <div>Timeline content - TODO</div>;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{patient.patient_name}</h1>
              {patient.source === 'ward' ? (
                <Building2 className="h-5 w-5 text-blue-500" />
              ) : (
                <FileText className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-gray-600">
              {patient.diagnosis} • DNI: {patient.dni} • {patient.age} años
            </p>
          </div>
        </div>
        <button
          onClick={() => onEdit(patient)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Editar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab.id as DetailTab}
            label={tab.label}
            icon={tab.icon}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>

      {/* Scale Modal */}
      {selectedScale && (
        <ScaleModal
          scale={selectedScale}
          onClose={() => setSelectedScale(null)}
          onComplete={handleScaleComplete}
          patient={{
            name: patient.patient_name,
            age: patient.age,
            diagnosis: patient.diagnosis || ''
          }}
        />
      )}
    </div>
  );
};

export default PatientDetailView;