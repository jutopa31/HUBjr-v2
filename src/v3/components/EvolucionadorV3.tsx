import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  Save,
  Users,
  Trash2,
  ChevronRight,
  ChevronDown,
  Stethoscope,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3, PatientDestination } from '../types/v3.types';
import {
  createPatient,
  updatePatient,
  getPatientsByDestination,
} from '../services/patientsV3Service';
import PatientSelectorModal from './PatientSelectorModal';
import PatientEntry from './PatientEntry';

// Medical scales data (simplified - can be expanded)
const medicalScales = [
  {
    id: 'nihss',
    name: 'NIHSS',
    description: 'National Institutes of Health Stroke Scale',
    category: 'Stroke',
  },
  {
    id: 'glasgow',
    name: 'Glasgow Coma Scale',
    description: 'Escala de coma de Glasgow',
    category: 'Evaluación Neurológica',
  },
  {
    id: 'mrs',
    name: 'Modified Rankin Scale',
    description: 'Escala modificada de Rankin',
    category: 'Stroke',
  },
  {
    id: 'updrs3',
    name: 'UPDRS III',
    description: 'Unified Parkinson Disease Rating Scale - Motor',
    category: 'Parkinson',
  },
  {
    id: 'moca',
    name: 'MoCA',
    description: 'Montreal Cognitive Assessment',
    category: 'Cognitivo',
  },
  {
    id: 'mmse',
    name: 'MMSE',
    description: 'Mini-Mental State Examination',
    category: 'Cognitivo',
  },
  {
    id: 'aspects',
    name: 'ASPECTS',
    description: 'Alberta Stroke Program Early CT Score',
    category: 'Stroke',
  },
  {
    id: 'ich',
    name: 'ICH Score',
    description: 'Intracerebral Hemorrhage Score',
    category: 'Stroke',
  },
  {
    id: 'hunt-hess',
    name: 'Hunt & Hess',
    description: 'Clasificación de hemorragia subaracnoidea',
    category: 'Stroke',
  },
  {
    id: 'fisher',
    name: 'Fisher',
    description: 'Escala de Fisher para HSA',
    category: 'Stroke',
  },
];

interface EvolucionadorV3Props {
  hospitalContext?: string;
  openScaleModal?: (scaleId: string) => void;
}

export default function EvolucionadorV3({
  hospitalContext = 'Posadas',
  openScaleModal,
}: EvolucionadorV3Props) {
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Patient state
  const [selectedPatient, setSelectedPatient] = useState<PatientV3 | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  // Notes state
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Scales sidebar
  const [isScalesSidebarOpen, setIsScalesSidebarOpen] = useState(true);
  const [scaleSearch, setScaleSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Evaluación Neurológica': true,
    Stroke: true,
    Parkinson: false,
    Cognitivo: false,
  });

  // Load patient data into notes when selected
  useEffect(() => {
    if (selectedPatient) {
      const template = generateTemplate(selectedPatient);
      setNotes(template);
      setLastSaved(new Date(selectedPatient.updated_at));
    }
  }, [selectedPatient?.id]);

  // Auto-save effect
  useEffect(() => {
    if (!selectedPatient || !notes) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [notes, selectedPatient]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.max(520, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, [notes]);

  function generateTemplate(patient: PatientV3): string {
    const sections = [
      `PACIENTE: ${patient.nombre}`,
      `DNI: ${patient.dni}`,
      patient.cama ? `CAMA: ${patient.cama}` : null,
      patient.edad ? `EDAD: ${patient.edad}` : null,
      '',
      '--- RELATO DE CONSULTA ---',
      patient.relato_consulta || '',
      '',
      '--- ANTECEDENTES ---',
      patient.antecedentes || '',
      '',
      '--- EXAMEN FÍSICO ---',
      patient.examen_fisico || '',
      '',
      '--- ESTUDIOS ---',
      patient.estudios || '',
      '',
      '--- DIAGNÓSTICO ---',
      patient.diagnostico || '',
      '',
      '--- PLAN ---',
      patient.plan || '',
      '',
      '--- PENDIENTES ---',
      patient.pendientes || '',
    ];

    return sections.filter((s) => s !== null).join('\n');
  }

  function parseNotesToPatientData(text: string): Partial<PatientV3> {
    const sections: Partial<PatientV3> = {};

    const patterns: { key: keyof PatientV3; regex: RegExp }[] = [
      { key: 'relato_consulta', regex: /--- RELATO DE CONSULTA ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'antecedentes', regex: /--- ANTECEDENTES ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'examen_fisico', regex: /--- EXAMEN FÍSICO ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'estudios', regex: /--- ESTUDIOS ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'diagnostico', regex: /--- DIAGNÓSTICO ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'plan', regex: /--- PLAN ---\n([\s\S]*?)(?=\n---|$)/i },
      { key: 'pendientes', regex: /--- PENDIENTES ---\n([\s\S]*?)(?=\n---|$)/i },
    ];

    patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);
      if (match && match[1]) {
        (sections as Record<string, string>)[key] = match[1].trim();
      }
    });

    return sections;
  }

  async function handleAutoSave() {
    if (!selectedPatient) return;

    setIsSaving(true);
    setSaveStatus('Guardando...');

    try {
      const patientData = parseNotesToPatientData(notes);
      await updatePatient(selectedPatient.id, patientData);
      setLastSaved(new Date());
      setSaveStatus('Guardado');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Auto-save error:', err);
      setSaveStatus('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualSave() {
    if (!selectedPatient) return;
    await handleAutoSave();
  }

  function handleCopyNotes() {
    if (notes) {
      navigator.clipboard.writeText(notes).then(() => {
        setSaveStatus('Copiado al portapapeles');
        setTimeout(() => setSaveStatus(null), 2000);
      });
    }
  }

  function handleClearNotes() {
    if (window.confirm('¿Limpiar todas las notas?')) {
      setNotes('');
      setSelectedPatient(null);
    }
  }

  function handleSelectPatient(patient: PatientV3) {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
  }

  function handlePatientCreated() {
    setShowNewPatientForm(false);
    // Optionally refresh or select the new patient
  }

  function handleScaleClick(scaleId: string) {
    if (openScaleModal) {
      openScaleModal(scaleId);
    } else {
      // Insert placeholder in notes
      const scaleText = `\n[Escala ${scaleId.toUpperCase()}: pendiente]\n`;
      setNotes((prev) => prev + scaleText);
    }
  }

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  // Group scales by category
  const groupedScales = medicalScales.reduce((acc, scale) => {
    if (!acc[scale.category]) acc[scale.category] = [];
    acc[scale.category].push(scale);
    return acc;
  }, {} as Record<string, typeof medicalScales>);

  // Filter scales by search
  const filteredGroupedScales = Object.entries(groupedScales).reduce((acc, [category, scales]) => {
    if (!scaleSearch) {
      acc[category] = scales;
    } else {
      const filtered = scales.filter(
        (s) =>
          s.name.toLowerCase().includes(scaleSearch.toLowerCase()) ||
          s.description.toLowerCase().includes(scaleSearch.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
    }
    return acc;
  }, {} as Record<string, typeof medicalScales>);

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Evolucionador
            </p>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notas y escalas neurologicas
            </h2>
          </div>
          {selectedPatient && (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {selectedPatient.nombre}
            </span>
          )}
          {saveStatus && (
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                saveStatus.includes('Error')
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              }`}
            >
              {saveStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPatientSelector(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {selectedPatient ? 'Cambiar paciente' : 'Seleccionar paciente'}
          </button>

          <button
            onClick={() => setShowNewPatientForm(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>

          <button
            onClick={handleManualSave}
            disabled={!selectedPatient || isSaving}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
            }`}
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>

          <button
            onClick={handleCopyNotes}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Copy className="w-4 h-4" />
            Copiar
          </button>

          <button
            onClick={handleClearNotes}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'text-red-400 hover:bg-red-900/30'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>

          <button
            onClick={() => setIsScalesSidebarOpen(!isScalesSidebarOpen)}
            className={`lg:hidden px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Escalas
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {isScalesSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsScalesSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
            aria-label="Cerrar panel de escalas"
          />
        )}
        {/* Scales Sidebar */}
        <aside
          className={`${
            isScalesSidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-full max-w-xs' : 'hidden'
          } border-r flex flex-col lg:static lg:z-auto lg:flex lg:w-80 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Sidebar Header */}
          <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Escalas
                </p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Algoritmos y scores
                </p>
              </div>
              <button
                onClick={() => setIsScalesSidebarOpen(false)}
                className={`lg:hidden p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Cerrar escalas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              />
              <input
                type="text"
                value={scaleSearch}
                onChange={(e) => setScaleSearch(e.target.value)}
                placeholder="Buscar escala..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Scales List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {Object.entries(filteredGroupedScales).map(([category, scales]) => (
              <div
                key={category}
                className={`rounded-lg border overflow-hidden ${
                  isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className={`flex w-full items-center justify-between px-3 py-2 ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {category}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {scales.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedCategories[category] ? 'rotate-180' : ''
                    } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                </button>

                {expandedCategories[category] && (
                  <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {scales.map((scale) => (
                      <button
                        key={scale.id}
                        onClick={() => handleScaleClick(scale.id)}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {scale.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {scale.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Notes Area */}
        <div className={`flex-1 flex flex-col p-4 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {!selectedPatient && !notes ? (
            <div
              className={`flex-1 flex flex-col items-center justify-center text-center p-8 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay paciente seleccionado</p>
              <p className="text-sm mb-4">Selecciona un paciente existente o crea uno nuevo para comenzar</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPatientSelector(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Seleccionar paciente
                </button>
                <button
                  onClick={() => setShowNewPatientForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear nuevo
                </button>
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full flex-1 resize-none rounded-lg border p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              style={{ minHeight: '520px' }}
              placeholder="Escriba aquí las notas del paciente..."
            />
          )}

          {lastSaved && selectedPatient && (
            <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Último guardado: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

      </div>

      {/* Patient Selector Modal */}
      <PatientSelectorModal
        isOpen={showPatientSelector}
        onClose={() => setShowPatientSelector(false)}
        onSelectPatient={handleSelectPatient}
        currentPatientId={selectedPatient?.id}
      />

      {/* New Patient Form Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-lg rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nuevo Paciente
              </h3>
              <button
                onClick={() => setShowNewPatientForm(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PatientEntry
              onPatientCreated={handlePatientCreated}
              defaultDestination="ambulatorio"
            />
          </div>
        </div>
      )}
    </div>
  );
}
