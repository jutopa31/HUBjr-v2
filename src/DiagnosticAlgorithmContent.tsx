import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Plus, Stethoscope, ChevronRight, ChevronDown, ChevronUp, Database, Search, X, Upload, LayoutList } from 'lucide-react';
import { Scale, SavePatientData } from './types';
import AIBadgeSystem from './AIBadgeSystem';
import { useAITextAnalysis } from './aiTextAnalyzer';
import SavePatientModal from './SavePatientModal';
import HintsScaleModal, { HintsSavePayload } from './components/HintsScaleModal';
import OCRProcessorModal from './components/admin/OCRProcessorModal';
import { extractPatientData, validatePatientData } from './utils/patientDataExtractor';
import { savePatientAssessment } from './utils/diagnosticAssessmentDB';

const AI_SUGGESTIONS_GROUP = 'Sugerencias IA';
const SEARCH_RESULTS_GROUP = 'Resultados de busqueda';

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
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'EvaluaciA3n NeurolA3gica': true,
    'Parkinson': false,
    [AI_SUGGESTIONS_GROUP]: true // Siempre expandido
  });

  // Estado para el modal de guardar paciente
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Estado para el buscador de escalas
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });
  const [isScalesVisible, setIsScalesVisible] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(true);

  // Estado y ref para el dropdown de patologÃ­as rÃ¡pidas
  const [showPathologyDropdown, setShowPathologyDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // AnÃ¡lisis de IA del texto de notas
  const aiAnalysis = useAITextAnalysis(notes, 2000);
  
  // Debug: log del anÃ¡lisis
  console.log('ðŸ” DiagnosticAlgorithm - Current notes:', notes);
  console.log('ðŸ¤– DiagnosticAlgorithm - AI Analysis:', aiAnalysis);
  console.log('ðŸ” DiagnosticAlgorithm - medicalScales received:', medicalScales?.length || 0);
  console.log('ðŸ” DiagnosticAlgorithm - medicalScales data:', medicalScales?.map(s => ({ id: s.id, name: s.name, hasItems: !!s.items?.length })));

  // Array de patologÃ­as frecuentes
  const commonPathologies = [
    { label: 'HipertensiÃ³n arterial', abbreviation: 'HTA' },
    { label: 'Diabetes mellitus', abbreviation: 'DBT' },
    { label: 'Tabaquismo', abbreviation: 'TBQ' },
    { label: 'Dislipemia', abbreviation: 'DLP' },
    { label: 'Obesidad', abbreviation: 'Obesidad' },
    { label: 'Enfermedad pulmonar obstructiva crÃ³nica', abbreviation: 'EPOC' },
    { label: 'CardiopatÃ­a', abbreviation: 'CardiopatÃ­a' },
    { label: 'FibrilaciÃ³n auricular', abbreviation: 'FA' },
    { label: 'Enfermedad renal crÃ³nica', abbreviation: 'ERC' },
    { label: 'Hipotiroidismo', abbreviation: 'Hipotiroidismo' },
    { label: 'ACV previo', abbreviation: 'ACV previo' },
    { label: 'Epilepsia', abbreviation: 'Epilepsia' },
    { label: 'MigraÃ±a', abbreviation: 'MigraÃ±a' },
    { label: 'Demencia', abbreviation: 'Demencia' },
    { label: 'Enfermedad de Parkinson', abbreviation: 'Enf. Parkinson' }
  ];

  // FunciÃ³n para insertar texto en la posiciÃ³n del cursor
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = notes.substring(0, start) + text + ' ' + notes.substring(end);

    setNotes(newText);

    // Restaurar foco y posiciÃ³n del cursor despuÃ©s del texto insertado
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length + 1; // +1 por el espacio
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [notes, setNotes]);

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

  // FunciÃ³n para manejar el guardado de paciente
  const handleSavePatient = () => {
    console.log('[DiagnosticAlgorithm] ðŸ¥ Abriendo modal con contexto:', currentHospitalContext);
    const extractedData = extractPatientData(notes);

    if (!validatePatientData(extractedData) && notes.trim().length === 0) {
      setSaveStatus({
        success: false,
        message: 'No hay datos suficientes para guardar. Agregue informaciÃ³n del paciente o complete alguna escala.'
      });
      return;
    }

    setShowSaveModal(true);
    setSaveStatus(null);
  };

  // FunciÃ³n para confirmar el guardado
  const handleConfirmSave = async (patientData: SavePatientData) => {
    try {
      console.log('[DiagnosticAlgorithm] handleConfirmSave -> payload:', patientData);
      console.log('[DiagnosticAlgorithm] ðŸ¥ Guardando con contexto:', patientData.hospital_context);
      const result = await savePatientAssessment(patientData);

      if (result.success) {
        const contextLabel = patientData.hospital_context === 'Julian' ? 'Consultorios Julian' : 'Hospital Posadas';
        setSaveStatus({
          success: true,
          message: `Paciente guardado exitosamente en ${contextLabel}.`
        });
        setShowSaveModal(false);
        
        // Limpiar mensaje despuÃ©s de 5 segundos
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('[DiagnosticAlgorithm] handleConfirmSave error:', error);
      setSaveStatus({
        success: false,
        message: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      // No cerrar el modal para que el usuario pueda intentar de nuevo
    }
  };

  // FunciÃ³n para filtrar escalas por bÃºsqueda
  const filterScalesBySearch = (scales: Scale[]) => {
    if (!searchQuery.trim()) return scales;
    
    const query = searchQuery.toLowerCase().trim();
    return scales.filter(scale => 
      scale.name.toLowerCase().includes(query) ||
      scale.description.toLowerCase().includes(query) ||
      scale.category.toLowerCase().includes(query)
    );
  };

  // FunciÃ³n para obtener escalas sugeridas por IA
  const getSuggestedScales = () => {
    const suggested = aiAnalysis.suggestions.map(suggestion => 
      medicalScales.find(scale => scale.id === suggestion.scaleId)
    ).filter(scale => scale !== undefined) as Scale[];
    
    return filterScalesBySearch(suggested);
  };

  // FunciÃ³n para obtener escalas no sugeridas
  const getNonSuggestedScales = () => {
    const suggestedIds = aiAnalysis.suggestions.map(s => s.scaleId);
    const nonSuggested = medicalScales.filter(scale => !suggestedIds.includes(scale.id));
    return filterScalesBySearch(nonSuggested);
  };

  // Crear agrupaciÃ³n dinÃ¡mica: primero sugerencias, luego por categorÃ­a
  const createDynamicGroups = () => {
    const suggestedScales = getSuggestedScales();
    const nonSuggestedScales = getNonSuggestedScales();
    
    const groups: { [key: string]: Scale[] } = {};
    
    // Si estamos en modo de bÃºsqueda, crear un grupo especial con todos los resultados
    if (searchQuery.trim()) {
      const allFilteredScales = [...suggestedScales, ...nonSuggestedScales];
      if (allFilteredScales.length > 0) {
        groups[SEARCH_RESULTS_GROUP] = allFilteredScales;
      }
      return groups;
    }
    
    // Si hay sugerencias, crear grupo especial
    if (suggestedScales.length > 0) {
      groups[AI_SUGGESTIONS_GROUP] = suggestedScales;
    }
    
    // Agrupar escalas restantes por categorÃ­a
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
      <div className="border-b bg-white dark:bg-[#1a1a1a] px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Evolucionador</p>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Notas y escalas neurolÃ³gicas</h2>
          </div>
          <button
            type="button"
            onClick={handleToggleScales}
            className="inline-flex items-center rounded-full btn-accent px-3 py-1.5 text-xs font-semibold"
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
              ? 'fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-[#1a1a1a] shadow-xl order-2'
              : 'hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-gray-200 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-[#1a1a1a] lg:order-2'
          }
        >
          <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#0f0f0f]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Escalas</p>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Algoritmos y scores</h2>
                <p className="text-xs text-[var(--text-secondary)]">Busque y expanda por categorA-a</p>
              </div>
              {isMobileView && (
                <button
                  type="button"
                  onClick={handleToggleScales}
                  className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-[#1c1c1c]"
                  aria-label="Cerrar panel de escalas"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar escalas..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-[#141414] dark:text-gray-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-tertiary)] hover:bg-gray-100 dark:hover:bg-[#1c1c1c]"
                    aria-label="Limpiar busqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {aiAnalysis.suggestions.length > 0 && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">IA sugiere {aiAnalysis.suggestions.length} escala(s)</p>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-[#0a0a0a]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="font-medium">Accesos rapidos:</span>
              <button
                type="button"
                onClick={() => openScaleModal('updrs3')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[var(--text-primary)] hover:border-blue-500 hover:text-blue-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-blue-500"
                title="Abrir UPDRS III (Examen Motor)"
              >
                UPDRS III
              </button>
            </div>

            {Object.entries(groupedScales).map(([category, scales]) => {
              const isAISuggestions = category === AI_SUGGESTIONS_GROUP;
              const isSearchResults = category === SEARCH_RESULTS_GROUP;

              return (
                <div
                  key={category}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111]"
                >
                  <button
                    onClick={() => !isAISuggestions && !isSearchResults && toggleCategory(category)}
                    className="flex w-full items-center justify-between px-3 py-2"
                    style={{ cursor: (isAISuggestions || isSearchResults) ? 'default' : 'pointer' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-md border border-gray-200 p-1.5 text-[var(--text-secondary)] dark:border-gray-800">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{category}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-[var(--text-tertiary)] dark:bg-[#1c1c1c]">
                        {scales.length}
                      </span>
                      {isAISuggestions && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          IA
                        </span>
                      )}
                      {isSearchResults && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                          BA§squeda
                        </span>
                      )}
                    </div>
                    {!isAISuggestions && !isSearchResults && (
                      expandedCategories[category]
                        ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
                        : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                    )}
                  </button>

                  {(expandedCategories[category] || isAISuggestions || isSearchResults) && (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                      {scales.map((scale) => (
                        <li key={scale.id} className="relative">
                          <button
                            onClick={() => {
                              const idLower = (scale.id || '').toLowerCase();
                              const nameLower = (scale.name || '').toLowerCase();
                              if (idLower.includes('hints') || nameLower.includes('hints')) {
                                setShowHintsModal(true);
                                return;
                              }
                              openScaleModal(scale.id);
                            }}
                            className={lex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#161616] }
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[var(--text-primary)]">{scale.name}</p>
                              <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{scale.description}</p>
                            </div>
                            <ChevronRight className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
                          </button>
                          <div className="absolute right-3 top-3">
                            <AIBadgeSystem
                              scaleId={scale.id}
                              suggestions={aiAnalysis.suggestions}
                              onScaleClick={openScaleModal}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3 text-xs text-[var(--text-secondary)] dark:border-gray-800 dark:bg-[#111]">
              <p className="font-semibold text-[var(--text-primary)]">Instrucciones</p>
              <p className="mt-1">Seleccione una escala, abra el modal y se insertara el resultado en las notas.</p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="order-1 flex flex-1 flex-col bg-gray-100 dark:bg-[#0a0a0a] p-4 lg:order-1 lg:p-6">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-2xl bg-white dark:bg-[#171717] shadow-2xl border border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-800 p-4 lg:p-6">
            <div className="mb-4 flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-left">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notas del Paciente</h2>
              <button
                type="button"
                onClick={handleToggleScales}
                className="hidden items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] lg:inline-flex"
              >
                <LayoutList className="h-4 w-4" />
                {isScalesVisible ? 'Ocultar escalas' : 'Mostrar escalas'}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleSavePatient}
                className="flex items-center space-x-2 rounded-lg btn-accent px-3 py-2 text-sm"
                title="Guardar paciente en base de datos"
              >
                <Database className="h-4 w-4" />
                <span>Guardar Paciente</span>
              </button>
              <button
                onClick={copyNotes}
                className="flex items-center space-x-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar</span>
              </button>
              {/* HINTS/HINTS+ ahora se abre desde la lista de escalas cuando exista una escala HINTS */}
              {isAdminMode && (
                <button
                  onClick={() => setShowOcrModal(true)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--state-info) 85%, #000)',
                    color: 'var(--on-accent)'
                  }}
                  title="Procesar PDF/Imagen con OCR"
                >
                  <Upload className="h-4 w-4" />
                  <span>OCR notas</span>
                </button>
              )}
              {clearNotes && (
                <button
                  onClick={clearNotes}
                  className="flex items-center space-x-2 rounded-lg btn-error px-3 py-2 text-sm"
                >
                  <span>ðŸ—‘ï¸</span>
                  <span>Limpiar</span>
                </button>
              )}
              <button
                onClick={() => {
                  const normalExamText = `Examen neurolÃ³gico:
Vigil, orientado en tiempo persona y espacio, lenguaje conservado. Repite, nomina, obedece comandos simples y complejos. Pupilas isocÃ³ricas reactivas a la luz. MOE conservados. Sin dÃ©ficit motor ni sensitivo. Taxia y sensibilidad conservadas.

`;
                  setNotes(notes + normalExamText);
                }}
                className="flex items-center space-x-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
              >
                <Plus className="h-4 w-4" />
                <span>EF normal</span>
              </button>
              <button
                onClick={() => {
                  const testText = `Paciente con temblor en reposo y rigidez muscular. Presenta hemiparesia derecha y disartria severa.`;
                  setNotes(notes + (notes ? '\n\n' : '') + testText);
                }}
                className="flex items-center space-x-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
              >
                <Plus className="h-4 w-4" />
                <span>Test IA</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowPathologyDropdown(!showPathologyDropdown)}
                  className="flex items-center space-x-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
                  title="Insertar antecedentes patolÃ³gicos frecuentes"
                >
                  <Plus className="h-4 w-4" />
                  <span>Antecedentes</span>
                </button>
                {showPathologyDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPathologyDropdown(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-2xl">
                      <div className="sticky top-0 border-b border-gray-300 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Antecedentes Frecuentes</h3>
                          <button
                            onClick={() => setShowPathologyDropdown(false)}
                            className="rounded p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Click para insertar en el cursor</p>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {commonPathologies.map((pathology, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              insertAtCursor(pathology.abbreviation);
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/30"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{pathology.label}</p>
                            </div>
                            <div className="ml-3 flex items-center space-x-2">
                              <span className="rounded-full bg-blue-900/50 px-2 py-1 text-xs font-semibold text-blue-300 border border-blue-800">
                                {pathology.abbreviation}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 lg:p-6">
            {/* Mensaje de estado del guardado */}
            {saveStatus && (
              <div className={`mb-4 flex items-center space-x-2 rounded-lg border p-3 ${
                saveStatus.success
                  ? 'border-green-800 bg-green-950/30 text-blue-300'
                  : 'border-red-800 bg-red-950/30 text-blue-300'
              }`}
              >
                <div className={`h-2 w-2 rounded-full ${
                  saveStatus.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">{saveStatus.message}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-full min-h-[18rem] w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a0a0a] p-4 font-mono text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Escriba aquÃ­ las notas del paciente..."
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
          currentHospitalContext={currentHospitalContext}
        />
      )}

      {showHintsModal && (
        <HintsScaleModal
          isOpen={showHintsModal}
          onClose={() => setShowHintsModal(false)}
          onSave={(payload: HintsSavePayload) => {
            const lines: string[] = [];
            lines.push('Escala HINTS / HINTS+:');
            lines.push(`- HIT horizontal: ${
              payload.hit === 'abnormal' ? 'Anormal (sacada correctiva)' :
              payload.hit === 'normal' ? 'Normal' :
              'No realizado / no interpretable'
            }`);
            lines.push(`- Nistagmo: ${
              payload.nystagmus === 'none_unidirectional' ? 'Ausente o unidireccional horizontal' :
              payload.nystagmus === 'bidirectional_gaze' ? 'Bidireccional segÃºn mirada' :
              payload.nystagmus === 'vertical_torsional' ? 'Vertical puro o torsional puro' :
              'No evaluable / no interpretable'
            }`);
            lines.push(`- Test of Skew: ${
              payload.skew === 'negative' ? 'Negativo' :
              payload.skew === 'positive' ? 'Positivo' :
              'No evaluable / no realizado'
            }`);
            lines.push(`- AudiciÃ³n (HINTS+): ${
              payload.hearing === 'no_deficit' ? 'Sin nuevo dÃ©ficit auditivo' :
              payload.hearing === 'sudden_ssnhl_unilateral' ? 'Hipoacusia neurosensorial sÃºbita unilateral' :
              'No evaluable / no realizado'
            }`);
            if (payload.interpretation) {
              lines.push(`- InterpretaciÃ³n: ${payload.interpretation.tituloInterpretacion}`);
              lines.push(`  ${payload.interpretation.textoInterpretacion}`);
            }
            const block = lines.join('\n');
            const prefix = notes.trim().length > 0 ? '\n\n' : '';
            setNotes(notes + prefix + block);
            setShowHintsModal(false);
          }}
        />
      )}

      {!isScalesVisible && (
        <button
          type="button"
          onClick={handleToggleScales}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full bg-blue-700 p-4 text-white shadow-lg transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Mostrar escalas"
        >
          <Stethoscope className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default React.memo(DiagnosticAlgorithmContent); 









