import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Plus, Calculator, Stethoscope, ChevronRight, ChevronDown, ChevronUp, Database, Search, X, Brain, Upload, LayoutList } from 'lucide-react';
import { Scale, SavePatientData } from './types';
import AIBadgeSystem from './AIBadgeSystem';
import { useAITextAnalysis } from './aiTextAnalyzer';
import SavePatientModal from './SavePatientModal';
import NeurologicalExamModal from './components/NeurologicalExamModal';
import OCRProcessorModal from './components/admin/OCRProcessorModal';
import { extractPatientData, validatePatientData } from './utils/patientDataExtractor';
import { savePatientAssessment } from './utils/diagnosticAssessmentDB';
import { useAuthContext } from './components/auth/AuthProvider';

interface DiagnosticAlgorithmContentProps {
  notes: string;
  setNotes: (v: string) => void;
  copyNotes: () => void;
  clearNotes?: () => void;
  openScaleModal: (scaleId: string) => void;
  medicalScales: Scale[];
  clickedScale?: string | null;
  isAdminMode?: boolean;
  currentHospitalContext?: 'Posadas' | 'Julian';
}

const DiagnosticAlgorithmContent: React.FC<DiagnosticAlgorithmContentProps> = ({
  notes,
  setNotes,
  copyNotes,
  clearNotes,
  openScaleModal,
  medicalScales,
  clickedScale,
  isAdminMode = false,
  currentHospitalContext = 'Posadas'
}) => {
  const { hasPrivilege, hasHospitalContextAccess } = useAuthContext();
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Evaluación Neurológica': true,
    'Parkinson': false,
    '🤖 Sugerencias IA': true // Siempre expandido
  });

  // Estado para el modal de guardar paciente
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Estado para el buscador de escalas
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estado para el modal de examen físico neurológico
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });
  const [isScalesVisible, setIsScalesVisible] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      setIsScalesVisible(() => {
        if (mobile) {
          return false;
        }
        return userCollapsed ? false : true;
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userCollapsed]);

  // Análisis de IA del texto de notas
  const aiAnalysis = useAITextAnalysis(notes, 2000);
  
  // Debug: log del análisis
  console.log('🔍 DiagnosticAlgorithm - Current notes:', notes);
  console.log('🤖 DiagnosticAlgorithm - AI Analysis:', aiAnalysis);
  console.log('🔍 DiagnosticAlgorithm - medicalScales received:', medicalScales?.length || 0);
  console.log('🔍 DiagnosticAlgorithm - medicalScales data:', medicalScales?.map(s => ({ id: s.id, name: s.name, hasItems: !!s.items?.length })));

  const handleInsertOcrText = useCallback((extractedText: string) => {
    const cleanedText = extractedText.trim();
    if (!cleanedText) {
      setShowOcrModal(false);
      return;
    }

    const trimmedCurrentNotes = notes.trim().length === 0 ? '' : notes.trimEnd();
    const mergedNotes = trimmedCurrentNotes.length > 0
      ? `${trimmedCurrentNotes}\n\n${cleanedText}`
      : cleanedText;

    setNotes(mergedNotes);
    setShowOcrModal(false);
  }, [notes, setNotes]);

  const handleToggleScales = useCallback(() => {
    setIsScalesVisible((prev) => {
      const next = !prev;
      setUserCollapsed(!next);
      return next;
    });
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Función para manejar el guardado de paciente
  const handleSavePatient = () => {
    const extractedData = extractPatientData(notes);
    
    if (!validatePatientData(extractedData) && notes.trim().length === 0) {
      setSaveStatus({
        success: false,
        message: 'No hay datos suficientes para guardar. Agregue información del paciente o complete alguna escala.'
      });
      return;
    }
    
    setShowSaveModal(true);
    setSaveStatus(null);
  };

  // Función para confirmar el guardado
  const handleConfirmSave = async (patientData: SavePatientData) => {
    try {
      const result = await savePatientAssessment(patientData);
      
      if (result.success) {
        setSaveStatus({
          success: true,
          message: 'Paciente guardado exitosamente en la base de datos.'
        });
        setShowSaveModal(false);
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      // No cerrar el modal para que el usuario pueda intentar de nuevo
    }
  };

  // Función para filtrar escalas por búsqueda
  const filterScalesBySearch = (scales: Scale[]) => {
    if (!searchQuery.trim()) return scales;
    
    const query = searchQuery.toLowerCase().trim();
    return scales.filter(scale => 
      scale.name.toLowerCase().includes(query) ||
      scale.description.toLowerCase().includes(query) ||
      scale.category.toLowerCase().includes(query)
    );
  };

  // Función para obtener escalas sugeridas por IA
  const getSuggestedScales = () => {
    const suggested = aiAnalysis.suggestions.map(suggestion => 
      medicalScales.find(scale => scale.id === suggestion.scaleId)
    ).filter(scale => scale !== undefined) as Scale[];
    
    return filterScalesBySearch(suggested);
  };

  // Función para obtener escalas no sugeridas
  const getNonSuggestedScales = () => {
    const suggestedIds = aiAnalysis.suggestions.map(s => s.scaleId);
    const nonSuggested = medicalScales.filter(scale => !suggestedIds.includes(scale.id));
    return filterScalesBySearch(nonSuggested);
  };

  // Crear agrupación dinámica: primero sugerencias, luego por categoría
  const createDynamicGroups = () => {
    const suggestedScales = getSuggestedScales();
    const nonSuggestedScales = getNonSuggestedScales();
    
    const groups: { [key: string]: Scale[] } = {};
    
    // Si estamos en modo de búsqueda, crear un grupo especial con todos los resultados
    if (searchQuery.trim()) {
      const allFilteredScales = [...suggestedScales, ...nonSuggestedScales];
      if (allFilteredScales.length > 0) {
        groups['🔍 Resultados de Búsqueda'] = allFilteredScales;
      }
      return groups;
    }
    
    // Si hay sugerencias, crear grupo especial
    if (suggestedScales.length > 0) {
      groups['🤖 Sugerencias IA'] = suggestedScales;
    }
    
    // Agrupar escalas restantes por categoría
    nonSuggestedScales.forEach(scale => {
      const category = scale.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(scale);
    });
    
    return groups;
  };

  const groupedScales = createDynamicGroups();

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mobile Controls */}
      <div className="border-b bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Evolucionador</p>
            <h2 className="text-base font-semibold text-gray-900">Notas y escalas neurológicas</h2>
          </div>
          <button
            type="button"
            onClick={handleToggleScales}
            className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            <LayoutList className="mr-1.5 h-3.5 w-3.5" />
            {isScalesVisible ? 'Ocultar escalas' : 'Mostrar escalas'}
          </button>
        </div>
      </div>

      {isMobileView && isScalesVisible && (
        <button
          type="button"
          onClick={handleToggleScales}
          className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
          aria-label="Cerrar panel de escalas"
        />
      )}

      {/* Left Sidebar */}
      {isScalesVisible && (
        <aside
          className={
            isMobileView
              ? 'fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl'
              : 'hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white'
          }
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
            <h2 className="flex items-center text-lg font-semibold">
              <Calculator className="mr-2 h-5 w-5" />
              Escalas y Algoritmos
            </h2>
            <div className="mt-1 mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-blue-100">Herramientas de evaluación neurológica</p>
              {/* Indicador de IA */}
              <div className="flex items-center space-x-2">
                {aiAnalysis.suggestions.length > 0 && (
                  <div className="flex items-center space-x-1 rounded-full bg-white/20 px-2 py-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                    <span className="text-xs text-blue-100">IA: {aiAnalysis.suggestions.length}</span>
                  </div>
                )}
                <div className="text-xs text-blue-200">
                  {notes.length > 0 ? `${notes.length} chars` : 'Sin texto'}
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white/15 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Buscar escalas..."
                  className="w-full rounded-lg border border-white/30 bg-white/20 py-2 pl-9 pr-10 text-sm text-white placeholder-blue-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white/70"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-100 transition-colors hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-xs text-blue-100">Buscando: "{searchQuery}"</p>
              )}
            </div>
          </div>

          {/* Sección de Examen Físico Neurológico */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
            <button
              onClick={() => setShowNeurologicalExam(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 font-medium text-white shadow-md transition hover:from-emerald-700 hover:to-cyan-700 hover:shadow-lg"
            >
              <Brain className="h-5 w-5" />
              <span>Examen Físico Neurológico</span>
              <Stethoscope className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-xs text-emerald-700">Evaluación sistemática por esferas neurológicas</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 border-b border-gray-200 pb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-700">
                <Calculator className="mr-2 h-4 w-4" />
                Escalas Diagnósticas
              </h3>
              <p className="mt-1 text-xs text-gray-500">Herramientas de puntuación y evaluación clínica</p>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedScales).map(([category, scales]) => {
                const isAISuggestions = category === '🤖 Sugerencias IA';
                const isSearchResults = category === '🔍 Resultados de Búsqueda';
                const isParkinson = category === 'Parkinson';

                return (
                  <div
                    key={category}
                    className={`overflow-hidden rounded-lg border ${
                      isAISuggestions
                        ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg'
                        : isSearchResults
                          ? 'border-green-300 bg-gradient-to-r from-green-50 to-teal-50 shadow-lg'
                          : 'border-gray-200'
                    }`}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => !isAISuggestions && !isSearchResults && toggleCategory(category)}
                      className={`flex w-full items-center justify-between p-3 transition-colors ${
                        isAISuggestions
                          ? 'cursor-default bg-gradient-to-r from-purple-100 to-blue-100'
                          : isSearchResults
                            ? 'cursor-default bg-gradient-to-r from-green-100 to-teal-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`rounded p-1.5 ${
                          isAISuggestions
                            ? 'bg-purple-200'
                            : isSearchResults
                              ? 'bg-green-200'
                              : isParkinson
                                ? 'bg-orange-100'
                                : 'bg-blue-100'
                        }`}>
                          <Stethoscope className={`h-4 w-4 ${
                            isAISuggestions
                              ? 'text-purple-700'
                              : isSearchResults
                                ? 'text-green-700'
                                : isParkinson
                                  ? 'text-orange-600'
                                  : 'text-blue-600'
                          }`} />
                        </div>
                        <span className={`font-medium ${
                          isAISuggestions || isSearchResults ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {category}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          isAISuggestions
                            ? 'bg-purple-200 text-purple-700'
                            : isSearchResults
                              ? 'bg-green-200 text-green-700'
                              : 'bg-gray-200 text-gray-500'
                        }`}>
                          {scales.length}
                        </span>
                        {isAISuggestions && (
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                            <span className="text-xs font-medium text-purple-700">Activo</span>
                          </div>
                        )}
                        {isSearchResults && (
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-green-700">Búsqueda</span>
                          </div>
                        )}
                      </div>
                      {!isAISuggestions && !isSearchResults && (
                        expandedCategories[category]
                          ? <ChevronUp className="h-5 w-5 text-gray-400" />
                          : <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Category Content */}
                    {(expandedCategories[category] || isAISuggestions || isSearchResults) && (
                      <div className="divide-y divide-gray-100">
                        {scales.map((scale) => (
                          <div key={scale.id} className="relative">
                            <button
                              onClick={() => {
                                console.log('🔍 Scale button clicked:', scale.id, scale.name);
                                openScaleModal(scale.id);
                              }}
                              className={`w-full p-3 text-left transition-colors ${
                                clickedScale === scale.id
                                  ? 'border-l-4 border-green-500 bg-green-100'
                                  : 'hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium text-gray-900">{scale.name}</h3>
                                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{scale.description}</p>
                                </div>
                                <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              </div>
                            </button>
                            <AIBadgeSystem
                              scaleId={scale.id}
                              suggestions={aiAnalysis.suggestions}
                              onScaleClick={openScaleModal}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-800">Instrucciones</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Seleccione una escala del listado</li>
                <li>• Complete la evaluación en el modal</li>
                <li>• Los resultados se insertarán automáticamente</li>
                <li>• Puede modificar las notas manualmente</li>
              </ul>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col bg-slate-50 p-4 lg:p-6">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-2xl bg-white shadow">
          <div className="border-b p-4 lg:p-6">
            <div className="mb-4 flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-left">
              <h2 className="text-lg font-semibold text-gray-900">Notas del Paciente</h2>
              <button
                type="button"
                onClick={handleToggleScales}
                className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 lg:inline-flex"
              >
                <LayoutList className="h-4 w-4" />
                {isScalesVisible ? 'Ocultar escalas' : 'Mostrar escalas'}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleSavePatient}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                title="Guardar paciente en base de datos"
              >
                <Database className="h-4 w-4" />
                <span>Guardar Paciente</span>
              </button>
              <button
                onClick={copyNotes}
                className="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar</span>
              </button>
              {isAdminMode && (
                <button
                  onClick={() => setShowOcrModal(true)}
                  className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                  title="Procesar PDF/Imagen con OCR"
                >
                  <Upload className="h-4 w-4" />
                  <span>OCR notas</span>
                </button>
              )}
              {clearNotes && (
                <button
                  onClick={clearNotes}
                  className="flex items-center space-x-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200"
                >
                  <span>🗑️</span>
                  <span>Limpiar</span>
                </button>
              )}
              <button
                onClick={() => {
                  const normalExamText = `Examen neurológico:
Vigil, orientado en tiempo persona y espacio, lenguaje conservado. Repite, nomina, obedece comandos simples y complejos. Pupilas isocóricas reactivas a la luz. MOE conservados. Sin déficit motor ni sensitivo. Taxia y sensibilidad conservadas.

`;
                  setNotes(notes + normalExamText);
                }}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>EF normal</span>
              </button>
              <button
                onClick={() => {
                  const testText = `Paciente con temblor en reposo y rigidez muscular. Presenta hemiparesia derecha y disartria severa.`;
                  setNotes(notes + (notes ? '\n\n' : '') + testText);
                }}
                className="flex items-center space-x-2 rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                <span>Test IA</span>
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 lg:p-6">
            {/* Mensaje de estado del guardado */}
            {saveStatus && (
              <div className={`mb-4 flex items-center space-x-2 rounded-lg border p-3 ${
                saveStatus.success
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
              >
                <div className={`h-2 w-2 rounded-full ${
                  saveStatus.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">{saveStatus.message}</span>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-full min-h-[18rem] w-full resize-none rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Escriba aquí las notas del paciente..."
            />
          </div>
        </div>
      </div>

      {/* Modal de guardar paciente */}
      {showOcrModal && (
        <OCRProcessorModal
          isOpen={showOcrModal}
          onClose={() => setShowOcrModal(false)}
          onInsert={handleInsertOcrText}
        />
      )}

      {showSaveModal && (
        <SavePatientModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleConfirmSave}
          extractedData={extractPatientData(notes)}
          fullNotes={notes}
          isAdminMode={isAdminMode || hasPrivilege('full_admin') || hasHospitalContextAccess}
          currentHospitalContext={currentHospitalContext}
        />
      )}

      {/* Modal de Examen Físico Neurológico */}
      <NeurologicalExamModal
        isOpen={showNeurologicalExam}
        onClose={() => setShowNeurologicalExam(false)}
        onExamCompleted={(examData) => {
          // Agregar resultados del examen a las notas
          const examSummary = `\n\n=== EXAMEN FÍSICO NEUROLÓGICO ===\nFecha: ${new Date().toLocaleDateString()}\nExaminador: ${examData.examiner || 'Dr. Usuario'}\n\nHallazgos principales:\n- Estado mental: ${examData.mental_state?.consciousness?.level || 'No evaluado'}\n- Consciencia: ${examData.mental_state?.consciousness?.orientation ? 'Orientado' : 'Desorientado'}\n- Examen realizado completo\n\n`;
          setNotes(notes + examSummary);
          setShowNeurologicalExam(false);
        }}
        examiner="Dr. Usuario"
      />

      {!isScalesVisible && (
        <button
          type="button"
          onClick={handleToggleScales}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Mostrar escalas"
        >
          <Stethoscope className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default React.memo(DiagnosticAlgorithmContent); 
