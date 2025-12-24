import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Plus, Stethoscope, ChevronRight, ChevronDown, ChevronUp, Database, Search, X, LayoutList, FileText } from 'lucide-react';
import { Scale, SavePatientData } from './types';
import AIBadgeSystem from './AIBadgeSystem';
import { useAITextAnalysis } from './aiTextAnalyzer';
import SavePatientModal from './SavePatientModal';
import HintsScaleModal, { HintsSavePayload } from './components/HintsScaleModal';
import OCRProcessorModal from './components/admin/OCRProcessorModal';
import { extractPatientData, validatePatientData } from './utils/patientDataExtractor';
import { savePatientAssessment } from './utils/diagnosticAssessmentDB';
import { generateEvolucionadorTemplate } from './services/workflowIntegrationService';
import { useAuth } from './hooks/useAuth';
import { listEvolucionadorDrafts, saveEvolucionadorDraft } from './services/evolucionadorDraftsService';

const AI_SUGGESTIONS_GROUP = 'Sugerencias IA';
const SEARCH_RESULTS_GROUP = 'Resultados de búsqueda';

interface DiagnosticAlgorithmContentProps {
  notes: string;
  setNotes: (v: string) => void;
  copyNotes: () => void;
  clearNotes?: () => void;
  openScaleModal: (scaleId: string) => void;
  medicalScales: Scale[];
  clickedScale?: string | null;
  currentHospitalContext?: 'Posadas' | 'Julian';

  // Workflow integration props
  activeInterconsulta?: any | null;
  onClearInterconsulta?: () => void;
}

const DiagnosticAlgorithmContent: React.FC<DiagnosticAlgorithmContentProps> = ({
  notes,
  setNotes,
  copyNotes,
  clearNotes,
  openScaleModal,
  medicalScales,
  clickedScale,
  currentHospitalContext = 'Posadas',
  activeInterconsulta,
  onClearInterconsulta
}) => {
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Evaluación Neurológica': true,
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
  const previousMobileView = useRef(isMobileView);
  const [isScalesVisible, setIsScalesVisible] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(true);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftSyncLabel, setDraftSyncLabel] = useState<string | null>(null);
  const [draftListStatus, setDraftListStatus] = useState<string | null>(null);
  const isHydratingDraft = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const hasLoadedDraft = useRef(false);
  const { user } = useAuth();
  const userId = user?.id || null;

  // Estado y ref para el dropdown de patologías rápidas
  const [showPathologyDropdown, setShowPathologyDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados para workflow integration (interconsulta ? evolucionador ? pase)
  const [showSaveToWardModal, setShowSaveToWardModal] = useState(false);
  const [selectedFinalStatus, setSelectedFinalStatus] = useState<string>('Resuelta');
  const [lastSavedAssessmentId, setLastSavedAssessmentId] = useState<string | null>(null);

  // useEffect para pre-cargar template desde interconsulta
  useEffect(() => {
    if (activeInterconsulta && activeInterconsulta.id) {
      console.log('[DiagnosticAlgorithm] Pre-cargando template desde interconsulta:', activeInterconsulta.nombre);
      const template = generateEvolucionadorTemplate(activeInterconsulta);
      setNotes(template);

      // Mostrar notificación al usuario
      setSaveStatus({
        success: true,
        message: `?? Datos de interconsulta cargados: ${activeInterconsulta.nombre}`
      });

      // Limpiar notificación después de 3 segundos
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [activeInterconsulta, setNotes]);

  useEffect(() => {
    if (!userId) return;
    hasLoadedDraft.current = false;
    setDraftListStatus(null);
    setDraftSyncLabel(null);
    setActiveDraftId(null);
  }, [activeInterconsulta?.id, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      setIsScalesVisible((prev) => {
        if (previousMobileView.current === mobile) {
          return prev;
        }
        return mobile ? false : !userCollapsed;
      });
      previousMobileView.current = mobile;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userCollapsed]);

  // Auto-resize del textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Resetear altura para calcular correctamente el scrollHeight
    textarea.style.height = 'auto';

    // Calcular nueva altura basada en contenido
    const newHeight = Math.max(300, textarea.scrollHeight);

    // Aplicar nueva altura
    textarea.style.height = `${newHeight}px`;
  }, [notes]);

  useEffect(() => {
    if (!userId || hasLoadedDraft.current) return;
    let isMounted = true;
    const loadDrafts = async () => {
      setDraftListStatus('Cargando borrador...');
      const result = await listEvolucionadorDrafts(userId);
      if (!isMounted) return;
      if (!result.success) {
        setDraftListStatus(result.error || 'No se pudo cargar el borrador');
        return;
      }
      const drafts = result.data || [];
      const matchingDraft = activeInterconsulta?.id
        ? drafts.find((draft) => draft.source_interconsulta_id === activeInterconsulta.id)
        : drafts[0];
      if (matchingDraft) {
        setActiveDraftId(matchingDraft.id);
        if (notes !== (matchingDraft.notes || '')) {
          isHydratingDraft.current = true;
          setNotes(matchingDraft.notes || '');
          setDraftSyncLabel('Borrador restaurado');
          setTimeout(() => {
            isHydratingDraft.current = false;
          }, 0);
        }
      }
      setDraftListStatus(null);
      hasLoadedDraft.current = true;
    };
    void loadDrafts();
    return () => {
      isMounted = false;
    };
  }, [activeInterconsulta?.id, notes, setNotes, userId]);

  useEffect(() => {
    if (!userId) return;
    if (isHydratingDraft.current) return;
    if (!notes.trim()) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setDraftSyncLabel('Guardando borrador...');
    saveTimerRef.current = window.setTimeout(async () => {
      const extracted = extractPatientData(notes);
      const payload = {
        notes,
        patient_name: extracted.name || undefined,
        patient_dni: extracted.dni || undefined,
        patient_age: extracted.age || undefined,
        source_interconsulta_id: activeInterconsulta?.id || null
      };
      const result = await saveEvolucionadorDraft(userId, activeDraftId, payload);
      if (result.success && result.data) {
        const timestamp = new Date(result.data.updated_at || Date.now()).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setActiveDraftId(result.data.id);
        setDraftSyncLabel(`Borrador guardado ${timestamp}`);
        return;
      }
      setDraftSyncLabel(result.error || 'No se pudo guardar borrador');
    }, 900);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [activeDraftId, activeInterconsulta?.id, notes, userId]);

  // Análisis de IA del texto de notas
  const aiAnalysis = useAITextAnalysis(notes, 2000);
  
  // Debug: log del análisis
  console.log('[DiagnosticAlgorithm] Current notes:', notes);
  console.log('[DiagnosticAlgorithm] AI Analysis:', aiAnalysis);
  console.log('[DiagnosticAlgorithm] medicalScales received:', medicalScales?.length || 0);
  console.log('[DiagnosticAlgorithm] medicalScales data:', medicalScales?.map(s => ({ id: s.id, name: s.name, hasItems: !!s.items?.length })));

  // Array de patologías frecuentes
  const commonPathologies = [
    { label: 'Hipertensión arterial', abbreviation: 'HTA' },
    { label: 'Diabetes mellitus', abbreviation: 'DBT' },
    { label: 'Tabaquismo', abbreviation: 'TBQ' },
    { label: 'Dislipemia', abbreviation: 'DLP' },
    { label: 'Obesidad', abbreviation: 'Obesidad' },
    { label: 'Enfermedad pulmonar obstructiva crónica', abbreviation: 'EPOC' },
    { label: 'Cardiopatía', abbreviation: 'Cardiopatía' },
    { label: 'Fibrilación auricular', abbreviation: 'FA' },
    { label: 'Enfermedad renal crónica', abbreviation: 'ERC' },
    { label: 'Hipotiroidismo', abbreviation: 'Hipotiroidismo' },
    { label: 'ACV previo', abbreviation: 'ACV previo' },
    { label: 'Epilepsia', abbreviation: 'Epilepsia' },
    { label: 'Migraña', abbreviation: 'Migraña' },
    { label: 'Demencia', abbreviation: 'Demencia' },
    { label: 'Enfermedad de Parkinson', abbreviation: 'Enf. Parkinson' }
  ];

  // Función para insertar texto en la posición del cursor
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = notes.substring(0, start) + text + ' ' + notes.substring(end);

    setNotes(newText);

    // Restaurar foco y posición del cursor después del texto insertado
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
      if (!isMobileView) {
        setUserCollapsed(!next);
      }
      return next;
    });
  }, [isMobileView]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Función para manejar el guardado de paciente
  const handleSavePatient = () => {
    console.log('[DiagnosticAlgorithm] Abriendo modal con contexto:', currentHospitalContext);
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
      console.log('[DiagnosticAlgorithm] handleConfirmSave -> payload:', patientData);
      console.log('[DiagnosticAlgorithm] Guardando con contexto:', patientData.hospital_context);

      // Agregar source_interconsulta_id si viene de interconsulta
      const enrichedData = {
        ...patientData,
        source_interconsulta_id: activeInterconsulta?.id || null,
        response_sent: false
      };

      const result = await savePatientAssessment(enrichedData as any);

      if (result.success) {
        const contextLabel = patientData.hospital_context === 'Julian' ? 'Consultorios Julian' : 'Hospital Posadas';

        // Guardar el ID del assessment para usar después
        if (result.data?.id) {
          setLastSavedAssessmentId(result.data.id);
          console.log('[DiagnosticAlgorithm] Assessment guardado con ID:', result.data.id);
        }

        setSaveStatus({
          success: true,
          message: `Paciente guardado exitosamente en ${contextLabel}.`
        });
        setShowSaveModal(false);

        // Si vino de interconsulta, mostrar modal de confirmación para Pase de Sala
        if (activeInterconsulta) {
          setShowSaveToWardModal(true);
        } else {
          // Limpiar mensaje después de 5 segundos si no hay interconsulta
          setTimeout(() => setSaveStatus(null), 5000);
        }
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

  // Handlers para el modal de confirmación Pase de Sala
  const handleSaveToWardConfirm = async () => {
    if (!activeInterconsulta || !lastSavedAssessmentId) {
      console.error('[DiagnosticAlgorithm] Faltan datos para crear paciente en Pase de Sala');
      return;
    }

    try {
      const { createWardPatientFromEvolution } = await import('./services/workflowIntegrationService');
      const { updateInterconsultaResponse: updateResponse } = await import('./services/interconsultasService');

      // Crear paciente en Pase de Sala
      const result = await createWardPatientFromEvolution(activeInterconsulta.id, lastSavedAssessmentId);

      if (result.success) {
        // Actualizar respuesta e interconsulta
        await updateResponse(activeInterconsulta.id, notes, selectedFinalStatus as any);

        setSaveStatus({
          success: true,
          message: '? Paciente agregado al Pase de Sala exitosamente'
        });

        setShowSaveToWardModal(false);
        onClearInterconsulta?.();

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus({
          success: false,
          message: `Error: ${result.error}`
        });
      }
    } catch (error) {
      console.error('[DiagnosticAlgorithm] Error al crear paciente en Pase de Sala:', error);
      setSaveStatus({
        success: false,
        message: 'Error al crear paciente en Pase de Sala'
      });
    }
  };

  const handleSaveToWardCancel = async () => {
    if (!activeInterconsulta) return;

    try {
      const { updateInterconsultaResponse } = await import('./services/interconsultasService');

      // Solo actualizar status, no agregar a pase
      await updateInterconsultaResponse(activeInterconsulta.id, notes, selectedFinalStatus as any);

      setShowSaveToWardModal(false);
      onClearInterconsulta?.();

      setSaveStatus({
        success: true,
        message: 'Interconsulta actualizada'
      });

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('[DiagnosticAlgorithm] Error al actualizar interconsulta:', error);
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
        groups[SEARCH_RESULTS_GROUP] = allFilteredScales;
      }
      return groups;
    }
    
    // Si hay sugerencias, crear grupo especial
    if (suggestedScales.length > 0) {
      groups[AI_SUGGESTIONS_GROUP] = suggestedScales;
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
    <div className="max-w-7xl mx-auto">
      {/* Compact Header with Gradient */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 mb-3 dark:from-gray-900 dark:via-gray-800 dark:to-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Icono redondeado con sombra */}
          <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-700 dark:ring-gray-600">
            <Stethoscope className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>

          {/* Título */}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Evolucionador</h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              Notas y escalas neurológicas
            </p>
          </div>
        </div>

        {/* Botones de acción - solo en desktop, en mobile están en Mobile Controls */}
        <div className="hidden lg:flex items-center gap-3 flex-wrap">
          {userId && (draftListStatus || draftSyncLabel) && (
            <p className="text-xs text-gray-500">
              {draftListStatus || draftSyncLabel}
            </p>
          )}
          <button
            onClick={handleToggleScales}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Mostrar/Ocultar escalas"
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{isScalesVisible ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          <button
            onClick={handleSavePatient}
            className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            title="Guardar paciente"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Guardar</span>
          </button>
          <button
            onClick={copyNotes}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Copiar notas"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Copiar</span>
          </button>
          <button
            onClick={() => {
              const normalExamText = `Examen neurológico:
Vigil, orientado en tiempo persona y espacio, lenguaje conservado. Repite, nomina, obedece comandos simples y complejos. Pupilas isocóricas reactivas a la luz. MOE conservados. Sin déficit motor ni sensitivo. Taxia y sensibilidad conservadas.

`;
              setNotes(notes + normalExamText);
            }}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Insertar examen físico normal"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">EF normal</span>
          </button>
          <button
            onClick={() => setShowOcrModal(true)}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Procesar OCR de PDF o imagen"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">OCR</span>
          </button>
          {clearNotes && (
            <button
              onClick={clearNotes}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Limpiar notas"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicador de interconsulta activa */}
      {activeInterconsulta && (
        <div className="mb-4 space-y-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">?? Evolucionando interconsulta:</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {activeInterconsulta.nombre} - DNI: {activeInterconsulta.dni} - Cama: {activeInterconsulta.cama}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Descartar conexión con interconsulta? Los datos ya cargados permanecerán en el editor.')) {
                    onClearInterconsulta?.();
                  }
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="flex h-full flex-col lg:flex-row">
      {/* Mobile Controls */}
      <div className="border-b bg-white dark:bg-[#1a1a1a] px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Evolucionador</p>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Notas y escalas neurológicas</h2>
            {userId && (draftListStatus || draftSyncLabel) && (
              <p className="text-xs text-gray-500">{draftListStatus || draftSyncLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleScales}
            className="inline-flex items-center rounded-full btn-accent px-3 py-1.5 text-xs font-semibold"
          >
            <LayoutList className="mr-1.5 h-3.5 w-3.5" />
            {isScalesVisible ? 'Ocultar' : 'Escalas'}
          </button>
        </div>

        {/* Botones de acción para móviles */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSavePatient}
            className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            title="Guardar paciente"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Guardar</span>
          </button>
          <button
            onClick={copyNotes}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Copiar notas"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar</span>
          </button>
          <button
            onClick={() => setShowOcrModal(true)}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Procesar OCR de PDF o imagen"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>OCR</span>
          </button>
          <button
            onClick={() => {
              const normalExamText = `Examen neurológico:
Vigil, orientado en tiempo persona y espacio, lenguaje conservado. Repite, nomina, obedece comandos simples y complejos. Pupilas isocóricas reactivas a la luz. MOE conservados. Sin déficit motor ni sensitivo. Taxia y sensibilidad conservadas.

`;
              setNotes(notes + normalExamText);
            }}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Insertar examen físico normal"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>EF normal</span>
          </button>
          {clearNotes && (
            <button
              onClick={clearNotes}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Limpiar notas"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar</span>
            </button>
          )}
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
                <p className="text-xs text-[var(--text-secondary)]">Busque y expanda por categoría</p>
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
                    aria-label="Limpiar búsqueda"
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
              <span className="font-medium">Accesos rápidos:</span>
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
                          Búsqueda
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
                            className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#161616] ${clickedScale === scale.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
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
              <p className="mt-1">Seleccione una escala, abra el modal y se insertará el resultado en las notas.</p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="order-1 flex flex-1 flex-col p-2 lg:order-1 bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col p-3">
            {/* Mensaje de estado del guardado */}
            {saveStatus && (
              <div className={`mb-2 flex items-center space-x-2 rounded-lg border px-3 py-2 ${
                saveStatus.success
                  ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                  : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
              }`}
              >
                <div className={`h-2 w-2 rounded-full ${
                  saveStatus.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">{saveStatus.message}</span>
              </div>
            )}

            {userId && (draftListStatus || draftSyncLabel) && (
              <div className="mb-2 flex items-center space-x-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm">{draftListStatus || draftSyncLabel}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a0a0a] p-4 font-mono text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                minHeight: '300px',
                height: '300px',
                overflowY: 'hidden'
              }}
              placeholder="Escriba aquí las notas del paciente..."
            />
        </div>
      </div>

      {/* BOTONES DUPLICADOS ELIMINADOS - ahora todos están en el header */}
      {/* Dropdown de Antecedentes */}
      {showPathologyDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPathologyDropdown(false)}
          />
          <div className="fixed top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-2xl">
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
                    setShowPathologyDropdown(false);
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
          interconsultaContext={activeInterconsulta}
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
              payload.nystagmus === 'bidirectional_gaze' ? 'Bidireccional según mirada' :
              payload.nystagmus === 'vertical_torsional' ? 'Vertical puro o torsional puro' :
              'No evaluable / no interpretable'
            }`);
            lines.push(`- Test of Skew: ${
              payload.skew === 'negative' ? 'Negativo' :
              payload.skew === 'positive' ? 'Positivo' :
              'No evaluable / no realizado'
            }`);
            lines.push(`- Audición (HINTS+): ${
              payload.hearing === 'no_deficit' ? 'Sin nuevo déficit auditivo' :
              payload.hearing === 'sudden_ssnhl_unilateral' ? 'Hipoacusia neurosensorial súbita unilateral' :
              'No evaluable / no realizado'
            }`);
            if (payload.interpretation) {
              lines.push(`- Interpretación: ${payload.interpretation.tituloInterpretacion}`);
              lines.push(`  ${payload.interpretation.textoInterpretacion}`);
            }
            const block = lines.join('\n');
            const prefix = notes.trim().length > 0 ? '\n\n' : '';
            setNotes(notes + prefix + block);
            setShowHintsModal(false);
          }}
        />
      )}

      {/* Modal de confirmación: Agregar a Pase de Sala */}
      {showSaveToWardModal && activeInterconsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              ¿Agregar a Pase de Sala?
            </h3>

            <p className="mb-4 text-gray-700 dark:text-gray-300">
              La evolución se guardó correctamente. ¿Deseas agregar este paciente al Pase de Sala?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Estado final de la interconsulta:
              </label>
              <select
                value={selectedFinalStatus}
                onChange={(e) => setSelectedFinalStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Resuelta">Resuelta</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSaveToWardCancel}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium transition"
              >
                No, solo actualizar interconsulta
              </button>

              <button
                onClick={handleSaveToWardConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition shadow-md"
              >
                Sí, agregar a Pase de Sala
              </button>
            </div>
          </div>
        </div>
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



