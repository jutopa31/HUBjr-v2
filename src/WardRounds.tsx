import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Download, Upload, Edit, X, ChevronUp, ChevronDown, ChevronRight, Check, Clipboard, Stethoscope, Trash2, Users, ExternalLink, Maximize2, GripVertical, LayoutGrid, Table as TableIcon, Camera, RefreshCw, Save } from 'lucide-react';
import ReactDOM from 'react-dom';
import { supabase } from './utils/supabase';
import Toast from './components/Toast';
import { readImageFromClipboard, isClipboardSupported } from './services/clipboardService';
import { uploadMultipleImagesToStorage } from './services/storageService';
import { createOrUpdateTaskFromPatient } from './utils/pendientesSync';
import { archiveWardPatient } from './utils/diagnosticAssessmentDB';
import DeletePatientModal from './components/DeletePatientModal';
import CSVImportModal from './components/wardRounds/CSVImportModal';
import { useAuthContext } from './components/auth/AuthProvider';
import { robustQuery, formatQueryError } from './utils/queryHelpers';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';
import useEscapeKey from './hooks/useEscapeKey';
import {
  fetchOutpatientPatients,
  addOutpatientPatient,
  deleteOutpatientPatient,
  type OutpatientPatient
} from './services/outpatientWardRoundsService';
import WardPatientCard from './components/wardRounds/WardPatientCard';
import ScaleModal from './ScaleModal';
import { Scale, ScaleResult } from './types';
import { AccordionSection } from './components/shared/AccordionModal';

interface Patient {
  id?: string;
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;
  diagnostico: string;
  plan: string;
  pendientes: string;
  fecha: string;
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: (string | null)[];
  assigned_resident_id?: string | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

const NORMAL_EF_TEXT = 'Vigil, OTEP, MOE, PIR, Motor:, Sensitivo:, ROT, Babinski, Hoffman, Sensibilidad, Taxia';

// Clasificación TOAST para subtipos de ACV isquémico
const TOAST_CATEGORIES = [
  {
    id: 'large-artery',
    label: 'Ateroesclerosis de grandes arterias',
    description: 'ACV aterotrombótico'
  },
  {
    id: 'cardioembolism',
    label: 'Cardioembólico',
    description: 'ACV cardioembólico'
  },
  {
    id: 'small-vessel',
    label: 'Oclusión de pequeño vaso (Lacunar)',
    description: 'ACV lacunar'
  },
  {
    id: 'other',
    label: 'Otra etiología determinada',
    description: 'ACV de otra causa conocida'
  },
  {
    id: 'undetermined',
    label: 'Criptogénico (Indeterminado)',
    description: 'ACV de causa indeterminada'
  }
];

// Escalas neurológicas prioritarias para Ward Rounds
const PRIORITY_SCALES = [
  {
    id: 'nihss',
    name: 'NIHSS',
    fullName: 'Escala NIHSS',
  },
  {
    id: 'abcd2_score',
    name: 'ABCD2',
    fullName: 'ABCD2 Score',
  },
  {
    id: 'mrs',
    name: 'mRS',
    fullName: 'Modified Rankin Scale',
  },
  {
    id: 'glasgow',
    name: 'Glasgow',
    fullName: 'Escala de Glasgow',
  },
];

// Definiciones completas de las escalas neurológicas
const medicalScales: Scale[] = [
  {
    id: 'nihss',
    name: 'Escala NIHSS (National Institutes of Health Stroke Scale)',
    category: 'Evaluación Neurológica',
    description: 'Escala de evaluación de accidente cerebrovascular agudo',
    items: [
      {
        id: 'loc',
        label: '1. Nivel de consciencia',
        options: [
          '0 - Alerta, respuestas normales',
          '1 - No alerta, pero responde a mínimos estímulos verbales',
          '2 - No alerta, requiere estímulos repetidos o dolorosos para responder',
          '3 - Responde solo con reflejo motor o respuestas autonómicas, o totalmente irresponsivo'
        ],
        score: 0
      },
      {
        id: 'loc-questions',
        label: '2. Preguntas del nivel de consciencia',
        options: [
          '0 - Responde ambas preguntas correctamente (mes y edad)',
          '1 - Responde una pregunta correctamente',
          '2 - No responde ninguna pregunta correctamente'
        ],
        score: 0
      },
      {
        id: 'loc-commands',
        label: '3. Órdenes del nivel de consciencia',
        options: [
          '0 - Realiza ambas tareas correctamente (abrir/cerrar ojos, apretar/soltar mano)',
          '1 - Realiza una tarea correctamente',
          '2 - No realiza ninguna tarea correctamente'
        ],
        score: 0
      },
      {
        id: 'gaze',
        label: '4. Mejor mirada',
        options: [
          '0 - Normal',
          '1 - Parálisis parcial de la mirada',
          '2 - Desviación forzada o parálisis total de la mirada'
        ],
        score: 0
      },
      {
        id: 'visual',
        label: '5. Campos visuales',
        options: [
          '0 - Sin déficits campimétricos',
          '1 - Hemianopsia parcial',
          '2 - Hemianopsia completa',
          '3 - Hemianopsia bilateral (ceguera cortical)'
        ],
        score: 0
      },
      {
        id: 'facial',
        label: '6. Parálisis facial',
        options: [
          '0 - Movimientos normales simétricos',
          '1 - Paresia leve (asimetría al sonreír)',
          '2 - Parálisis parcial (parálisis total de la parte inferior de la cara)',
          '3 - Parálisis completa (ausencia de movimientos faciales en la parte superior e inferior)'
        ],
        score: 0
      },
      {
        id: 'motor-left-arm',
        label: '7a. Motor - Brazo izquierdo',
        options: [
          '0 - No hay caída, mantiene la posición 10 segundos',
          '1 - Caída parcial antes de 10 segundos, no llega a tocar la cama',
          '2 - Esfuerzo contra gravedad, no puede alcanzar o mantener 10 segundos',
          '3 - No esfuerzo contra gravedad, el miembro cae',
          '4 - No movimiento',
          'UN - Amputación o fusión articular (explicar)'
        ],
        score: 0
      },
      {
        id: 'motor-right-arm',
        label: '7b. Motor - Brazo derecho',
        options: [
          '0 - No hay caída, mantiene la posición 10 segundos',
          '1 - Caída parcial antes de 10 segundos, no llega a tocar la cama',
          '2 - Esfuerzo contra gravedad, no puede alcanzar o mantener 10 segundos',
          '3 - No esfuerzo contra gravedad, el miembro cae',
          '4 - No movimiento',
          'UN - Amputación o fusión articular (explicar)'
        ],
        score: 0
      },
      {
        id: 'motor-left-leg',
        label: '8a. Motor - Pierna izquierda',
        options: [
          '0 - No hay caída, mantiene la posición 5 segundos',
          '1 - Caída parcial antes de 5 segundos, no llega a tocar la cama',
          '2 - Esfuerzo contra gravedad, cae a la cama en menos de 5 segundos',
          '3 - No esfuerzo contra gravedad, el miembro cae inmediatamente',
          '4 - No movimiento',
          'UN - Amputación o fusión articular (explicar)'
        ],
        score: 0
      },
      {
        id: 'motor-right-leg',
        label: '8b. Motor - Pierna derecha',
        options: [
          '0 - No hay caída, mantiene la posición 5 segundos',
          '1 - Caída parcial antes de 5 segundos, no llega a tocar la cama',
          '2 - Esfuerzo contra gravedad, cae a la cama en menos de 5 segundos',
          '3 - No esfuerzo contra gravedad, el miembro cae inmediatamente',
          '4 - No movimiento',
          'UN - Amputación o fusión articular (explicar)'
        ],
        score: 0
      },
      {
        id: 'ataxia',
        label: '9. Ataxia de miembros',
        options: [
          '0 - Ausente',
          '1 - Presente en un miembro',
          '2 - Presente en dos miembros',
          'UN - Amputación o fusión articular (explicar)'
        ],
        score: 0
      },
      {
        id: 'sensory',
        label: '10. Sensibilidad',
        options: [
          '0 - Normal, sin pérdida sensorial',
          '1 - Pérdida sensorial leve a moderada',
          '2 - Pérdida sensorial severa o total'
        ],
        score: 0
      },
      {
        id: 'language',
        label: '11. Mejor lenguaje',
        options: [
          '0 - Sin afasia, normal',
          '1 - Afasia leve a moderada',
          '2 - Afasia severa',
          '3 - Mudo, afasia global'
        ],
        score: 0
      },
      {
        id: 'dysarthria',
        label: '12. Disartria',
        options: [
          '0 - Normal',
          '1 - Disartria leve a moderada',
          '2 - Disartria severa, habla ininteligible',
          'UN - Intubado u otra barrera física (explicar)'
        ],
        score: 0
      },
      {
        id: 'neglect',
        label: '13. Extinción e inatención (negligencia)',
        options: [
          '0 - Sin anormalidad',
          '1 - Inatención o extinción visual, táctil, auditiva, espacial o personal a la estimulación bilateral simultánea en una de las modalidades sensoriales',
          '2 - Hemi-inatención severa o extinción en más de una modalidad'
        ],
        score: 0
      }
    ]
  },
  {
    id: 'glasgow',
    name: 'Escala de Coma de Glasgow',
    category: 'Evaluación Neurológica',
    description: 'Escala para evaluar el nivel de conciencia',
    items: [
      {
        id: 'eye_opening',
        label: 'Apertura ocular',
        options: ['4 - Espontánea', '3 - Al habla', '2 - Al dolor', '1 - Ninguna'],
        score: 4
      },
      {
        id: 'verbal_response',
        label: 'Respuesta verbal',
        options: ['5 - Orientada', '4 - Confusa', '3 - Palabras inapropiadas', '2 - Sonidos incomprensibles', '1 - Ninguna'],
        score: 5
      },
      {
        id: 'motor_response',
        label: 'Respuesta motora',
        options: ['6 - Obedece órdenes', '5 - Localiza dolor', '4 - Retirada normal', '3 - Flexión anormal', '2 - Extensión', '1 - Ninguna'],
        score: 6
      }
    ]
  },
  {
    id: 'mrs',
    name: 'Escala de Rankin Modificada (mRS)',
    category: 'Stroke & Cerebrovascular',
    description: 'Escala para evaluar el grado de discapacidad después de un ACV',
    items: [
      {
        id: 'mrs_score',
        label: 'Grado de discapacidad funcional',
        options: [
          '0 - Sin síntomas',
          '1 - Sin discapacidad significativa: capaz de llevar a cabo todas las actividades y deberes habituales',
          '2 - Discapacidad leve: incapaz de llevar a cabo todas las actividades previas, pero capaz de cuidar sus propios asuntos sin asistencia',
          '3 - Discapacidad moderada: requiere algo de ayuda, pero capaz de caminar sin asistencia',
          '4 - Discapacidad moderadamente severa: incapaz de caminar sin asistencia e incapaz de atender sus necesidades corporales sin asistencia',
          '5 - Discapacidad severa: confinado a la cama, incontinente y requiere cuidado constante y atención de enfermería',
          '6 - Muerte'
        ],
        score: 0
      }
    ]
  },
  {
    id: 'abcd2_score',
    name: 'ABCD2 Score (AIT - Ataque Isquémico Transitorio)',
    category: 'Stroke & Cerebrovascular',
    description: 'Escala de riesgo de ACV después de un AIT en las próximas 48 horas',
    items: [
      {
        id: 'age',
        label: 'A - Edad (Age)',
        options: [
          '0 - < 60 años',
          '1 - ≥ 60 años'
        ],
        score: 0
      },
      {
        id: 'blood_pressure',
        label: 'B - Presión Arterial (Blood Pressure)',
        options: [
          '0 - < 140/90 mmHg',
          '1 - ≥ 140/90 mmHg'
        ],
        score: 0
      },
      {
        id: 'clinical_features',
        label: 'C - Características Clínicas (Clinical Features)',
        options: [
          '0 - Otros síntomas',
          '1 - Alteración del habla sin debilidad',
          '2 - Debilidad unilateral'
        ],
        score: 0
      },
      {
        id: 'duration',
        label: 'D - Duración de síntomas (Duration)',
        options: [
          '0 - < 10 minutos',
          '1 - 10-59 minutos',
          '2 - ≥ 60 minutos'
        ],
        score: 0
      },
      {
        id: 'diabetes',
        label: 'D - Diabetes',
        options: [
          '0 - No',
          '1 - Sí'
        ],
        score: 0
      }
    ]
  },
];

interface ResidentProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const WardRounds: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  // Feature flag: toggle DNI duplicate verification
  const ENABLE_DNI_CHECK = false;
  const normalizeUrl = (url?: string) =>
    url && (url.startsWith('http://') || url.startsWith('https://')) ? url : '';
  const emptyPatient: Patient = {
    cama: '',
    dni: '',
    nombre: '',
    edad: '',
    antecedentes: '',
    motivo_consulta: '',
    examen_fisico: '',
    estudios: '',
    severidad: '',
    diagnostico: '',
    plan: '',
    pendientes: '',
    image_thumbnail_url: [],
    image_full_url: [],
    exa_url: [],
    fecha: new Date().toISOString().split('T')[0],
    assigned_resident_id: undefined
  };

  const refreshSignedUrl = async (url: string): Promise<string> => {
    try {
      const match = url.match(/storage\/v1\/object\/sign\/ward-images\/([^?]+)/);
      if (!match || !match[1]) return url;
      const path = decodeURIComponent(match[1]);
      const { data, error } = await supabase.storage.from('ward-images').createSignedUrl(path, 60 * 60 * 24 * 7);
      if (error || !data?.signedUrl) {
        console.warn('[WardRounds] Failed to refresh signed url', error);
        return url;
      }
      return data.signedUrl;
    } catch (error) {
      console.error('[WardRounds] Unexpected error refreshing signed url', error);
      return url;
    }
  };

  const emptyOutpatient: OutpatientPatient = {
    dni: '',
    nombre: '',
    edad: '',
    antecedentes: '',
    motivo_consulta: '',
    examen_fisico: '',
    estudios: '',
    severidad: '',
    diagnostico: '',
    plan: '',
    fecha_proxima_cita: '',
    estado_pendiente: 'pendiente',
    pendientes: '',
    fecha: new Date().toISOString().split('T')[0]
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [outpatients, setOutpatients] = useState<OutpatientPatient[]>([]);
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [showOutpatientModal, setShowOutpatientModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [newOutpatient, setNewOutpatient] = useState<OutpatientPatient>(emptyOutpatient);
  const [loading, setLoading] = useState(true);
  const [outpatientLoading, setOutpatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [showToastDropdown, setShowToastDropdown] = useState(false);
  const [inlineDetailValues, setInlineDetailValues] = useState<Partial<Patient>>({});

  // Estado de edición por sección (solo una sección puede editarse a la vez)
  const [editingSection, setEditingSection] = useState<keyof Patient | null>(null);

  // Estado de guardado por sección
  const [savingSections, setSavingSections] = useState<Set<keyof Patient>>(new Set());
  const [imageLightboxUrl, setImageLightboxUrl] = useState<string | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{uploaded: number, total: number}>({uploaded: 0, total: 0});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});
  const quickImageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Estados para el sorting
  const [sortField, setSortField] = useState<keyof Patient | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estado para el control de expansión de filas
  const [expandedOutpatientRows, setExpandedOutpatientRows] = useState<Set<string>>(new Set());

  // Estados para edición inline de pendientes
  const [editingPendientesId, setEditingPendientesId] = useState<string | null>(null);
  const [tempPendientes, setTempPendientes] = useState<string>('');

  // Estado de guardado para evitar dobles envíos y loops de UI
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // Estados para el modal de eliminar/archivar paciente
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatientForDeletion, setSelectedPatientForDeletion] = useState<{ id: string; nombre: string; dni: string } | null>(null);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);

  // Estados para drag & drop y persistencia de orden
  const [draggedPatientId, setDraggedPatientId] = useState<string | null>(null);
  const [dragOverPatientId, setDragOverPatientId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Estado para edición inline en cards
  const [inlineEditingPatientId, setInlineEditingPatientId] = useState<string | null>(null);
  const [inlineEditValues, setInlineEditValues] = useState<Patient | null>(null);

  // Estado para vista dual (tabla vs cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'table';
    return window.matchMedia('(max-width: 768px)').matches ? 'cards' : 'table';
  });

  // Estados para acordeón
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'motivo_consulta',
    'diagnostico'
  ]);

  // Timer para debounce de auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      setViewMode(mediaQuery.matches ? 'cards' : 'table');
    };

    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const stopCameraStream = React.useCallback(() => {
    setCameraStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  const closeCameraModal = React.useCallback(() => {
    setShowCameraModal(false);
    setCameraError(null);
    stopCameraStream();
  }, [stopCameraStream]);

  const closeOutpatientModal = () => setShowOutpatientModal(false);

  /**
   * Guarda un solo campo del paciente
   */
  const saveSingleField = async (field: keyof Patient, value: any) => {
    if (!selectedPatient?.id) return;

    try {
      const { error } = await robustQuery(
        () => supabase
          .from('ward_round_patients')
          .update({ [field]: value })
          .eq('id', selectedPatient.id)
      );

      if (error) throw error;

      // Actualizar paciente seleccionado y lista local
      const updatedPatient = { ...selectedPatient, [field]: value };
      setSelectedPatient(updatedPatient);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
    } catch (error) {
      console.error(`Error guardando ${field}:`, error);
      throw error;
    }
  };

  /**
   * Activa modo edición para una sección específica
   */
  const startEditingSection = (section: keyof Patient) => {
    // Si ya hay otra sección editándose, guardarla primero
    if (editingSection && editingSection !== section) {
      saveAndCloseSection(editingSection);
    }

    setEditingSection(section);

    // Expandir automáticamente la sección al editarla
    if (!expandedSections.includes(section)) {
      setExpandedSections(prev => [...prev, section]);
    }
  };

  /**
   * Guarda y cierra una sección
   */
  const saveAndCloseSection = async (section: keyof Patient) => {
    const value = inlineDetailValues[section];
    const originalValue = selectedPatient?.[section];

    // Solo guardar si cambió
    if (value !== originalValue && selectedPatient?.id) {
      setSavingSections(prev => new Set(prev).add(section));

      try {
        await saveSingleField(section, value);
      } catch (error) {
        // Error ya manejado en saveSingleField
      } finally {
        setSavingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
      }
    }

    setEditingSection(null);
  };

  /**
   * Cancela edición de una sección
   */
  const cancelEditingSection = (section: keyof Patient) => {
    // Restaurar valor original
    if (selectedPatient) {
      setInlineDetailValues(prev => ({
        ...prev,
        [section]: selectedPatient[section]
      }));
    }

    setEditingSection(null);
  };

  const closeSelectedPatientModal = () => {
    setSelectedPatient(null);
    setEditingSection(null); // Cerrar cualquier sección que esté editándose
    setImageLightboxUrl(null);
    closeCameraModal();
  };

  const closeImageLightbox = () => setImageLightboxUrl(null);

  const isAnyModalOpen = showOutpatientModal || showCSVImportModal || showCameraModal || Boolean(selectedPatient) || Boolean(imageLightboxUrl);

  useEscapeKey(() => {
    if (imageLightboxUrl) {
      closeImageLightbox();
      return;
    }
    if (showCameraModal) {
      closeCameraModal();
      return;
    }
    if (selectedPatient) {
      closeSelectedPatientModal();
      return;
    }
    if (showCSVImportModal) {
      setShowCSVImportModal(false);
      return;
    }
    if (showOutpatientModal) {
      closeOutpatientModal();
    }
  }, isAnyModalOpen);

  // Apply section accent for this view
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = 'patients';
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete (document.body as any).dataset.section;
      }
    };
  }, []);

  // Load data once auth is ready (SessionGuard ensures clean auth state)
  useEffect(() => {
    if (!authLoading) {
      console.log('[WardRounds] Auth ready (validated by SessionGuard) -> loading data');
      loadData();
    }
  }, [authLoading]);

  useEffect(() => {
    if (showOutpatientModal) {
      loadOutpatients();
    }
  }, [showOutpatientModal]);

  useEffect(() => {
    const videoElement = cameraVideoRef.current;
    if (!videoElement) return;

    if (cameraStream) {
      videoElement.srcObject = cameraStream;
      const playPromise = videoElement.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } else {
      videoElement.srcObject = null;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!showCameraModal) {
      stopCameraStream();
      setIsCameraStarting(false);
      setIsCapturingPhoto(false);
      setCameraError(null);
    }
  }, [showCameraModal, stopCameraStream]);

  useEffect(() => () => stopCameraStream(), [stopCameraStream]);

  useEffect(() => {
    setImageOverrides({});
    setImagePreviewError(null);
  }, [selectedPatient?.id]);

  /**
   * Auto-save individual por sección
   * Se activa cuando se edita una sección específica
   */
  useEffect(() => {
    if (!editingSection || !selectedPatient) return;

    // Verificar si el campo específico cambió
    const fieldValue = inlineDetailValues[editingSection];
    const originalValue = selectedPatient[editingSection];

    if (fieldValue === originalValue) return;

    // Cancelar timer anterior
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Indicar que está guardando (agrega la sección al set)
    setSavingSections(prev => new Set(prev).add(editingSection));

    // Debounce de 2 segundos
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        // Guardar solo este campo
        await saveSingleField(editingSection, fieldValue);

        // Mantener el indicador de "guardado" por 1 segundo
        setTimeout(() => {
          setSavingSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(editingSection);
            return newSet;
          });
        }, 1000);
      } catch (error) {
        console.error('Error en auto-save:', error);
        setSavingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(editingSection);
          return newSet;
        });
        showToast('Error al guardar automáticamente', 'error');
      }
    }, 2000);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [inlineDetailValues[editingSection as keyof Patient], editingSection, selectedPatient]);

  const sortPatientsByDisplayOrder = (list: Patient[]) => {
    return [...list].sort((a, b) => {
      const orderA = typeof a.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const normalizePatientOrders = (data: Patient[]) => {
    const withDefaults = (data || []).map((patient, index) => ({
      ...patient,
      display_order: typeof patient.display_order === 'number' ? patient.display_order : index
    }));
    return sortPatientsByDisplayOrder(withDefaults);
  };

  const getNextDisplayOrder = () => {
    if (!patients.length) return 0;
    const maxOrder = patients.reduce((max, patient) => {
      const current = typeof patient.display_order === 'number' ? patient.display_order : -1;
      return current > max ? current : max;
    }, -1);
    return maxOrder + 1;
  };

  const detailCardConfigs: Array<{ label: string; field: keyof Patient; placeholder: string }> = [
    { label: 'Antecedentes', field: 'antecedentes', placeholder: 'Sin antecedentes' },
    { label: 'Motivo de Consulta', field: 'motivo_consulta', placeholder: 'Sin motivo' },
    { label: 'EF/NIHSS/ABCD2', field: 'examen_fisico', placeholder: 'Sin examen' },
    { label: 'Estudios Complementarios', field: 'estudios', placeholder: 'Sin estudios' },
    { label: 'Diagnostico', field: 'diagnostico', placeholder: 'Sin diagnostico' },
    { label: 'Plan', field: 'plan', placeholder: 'Sin plan' },
    { label: 'Pendientes', field: 'pendientes', placeholder: 'Sin pendientes' }
  ];

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  /**
   * Toggle expandir/colapsar sección de acordeón
   */
  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  /**
   * Handler para pegar imagen desde portapapeles
   * Lee la imagen del portapapeles y usa el flujo de upload existente
   */
  const handlePasteFromClipboard = async () => {
    // Check browser support
    if (!isClipboardSupported()) {
      showToast('Tu navegador no soporta pegar desde portapapeles', 'error');
      return;
    }

    // Check patient ID exists
    if (!selectedPatient?.id) {
      showToast('Guarda el paciente antes de pegar imágenes', 'error');
      return;
    }

    try {
      // Read image from clipboard
      const files = await readImageFromClipboard();

      if (!files || files.length === 0) {
        showToast('No hay imagen en el portapapeles', 'info');
        return;
      }

      // Use existing upload flow
      await handleMultipleFileUpload(files);

      // Show success message
      showToast('Imagen pegada correctamente', 'success');

    } catch (error: any) {
      console.error('[WardRounds] Clipboard paste error:', error);

      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        showToast('Permiso denegado para acceder al portapapeles', 'error');
      } else if (error.name === 'NotFoundError') {
        showToast('No hay imagen en el portapapeles', 'info');
      } else {
        showToast('Error al pegar imagen del portapapeles', 'error');
      }
    }
  };

  const loadData = async () => {
    console.log('[WardRounds] loadData -> start');
    await Promise.all([loadPatients(), loadResidents(), loadOutpatients()]);
    console.log('[WardRounds] loadData -> done');
  };

  const loadPatients = async () => {
    try {
      const result = await robustQuery(
        () => supabase
          .from('ward_round_patients')
          .select('*')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        {
          timeout: 8000,
          retries: 2,
          operationName: 'loadPatients'
        }
      );

      const { data, error } = result as any;

      if (error) throw error;
      console.log('[WardRounds] loadPatients -> rows:', (data || []).length);
      setPatients(normalizePatientOrders(data || []));
    } catch (error) {
      console.error('[WardRounds] Error loading patients:', error);
      const errorMessage = formatQueryError(error);
      alert(`Error al cargar pacientes: ${errorMessage}`);
      // Set empty array so UI isn't completely broken
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOutpatients = async () => {
    try {
      setOutpatientLoading(true);
      const { data, error } = await fetchOutpatientPatients();
      if (error) throw error;
      setOutpatients(data || []);
    } catch (error) {
      console.error('[WardRounds] Error loading outpatient patients:', error);
      setOutpatients([]);
    } finally {
      setOutpatientLoading(false);
    }
  };

  const mapWardPatientToOutpatient = (patient: Patient): Omit<OutpatientPatient, 'id' | 'created_at' | 'updated_at'> => ({
    dni: patient.dni,
    nombre: patient.nombre,
    edad: patient.edad,
    antecedentes: patient.antecedentes || '',
    motivo_consulta: patient.motivo_consulta || '',
    examen_fisico: patient.examen_fisico || '',
    estudios: patient.estudios || '',
    severidad: patient.severidad || '',
    diagnostico: patient.diagnostico || '',
    plan: patient.plan || '',
    fecha_proxima_cita: null,
    estado_pendiente: 'pendiente',
    pendientes: patient.pendientes || '',
    fecha: patient.fecha || new Date().toISOString().split('T')[0],
    assigned_resident_id: null
  });

  const loadResidents = async () => {
    try {
      // Try to get resident profiles from the database first (with timeout)
      const result = await robustQuery(
        () => supabase
          .from('resident_profiles')
          .select('id, user_id, first_name, last_name, email, training_level, status')
          .eq('status', 'active')
          .order('training_level', { ascending: true }),
        {
          timeout: 8000,
          retries: 2,
          operationName: 'loadResidents'
        }
      );

      const { data: residentProfiles, error: profilesError } = result as any;

      let residents: ResidentProfile[] = [];

      // If resident profiles exist, use them
      if (!profilesError && residentProfiles && residentProfiles.length > 0) {
        console.log('✅ Loading residents from resident_profiles table');
        residents = residentProfiles.map((profile: any) => ({
          id: profile.user_id, // Use user_id for consistency with assigned_resident_id
          email: profile.email,
          full_name: `${profile.first_name} ${profile.last_name}`,
          role: profile.training_level.toLowerCase().includes('r') ? 'resident' :
                profile.training_level === 'attending' ? 'attending' : 'intern'
        }));
      } else {
        // Fallback: use the original approach for backward compatibility
        console.log('⚠️ resident_profiles table not found or empty, using fallback method');

        const { data, error } = await supabase
          .from('ward_round_patients')
          .select('assigned_resident_id')
          .not('assigned_resident_id', 'is', null);

        if (error) throw error;

        // Get unique resident IDs and create basic profiles
        const residentIds = [...new Set(data?.map(p => p.assigned_resident_id).filter(Boolean))];

        if (residentIds.length > 0) {
          residents = residentIds.map(id => ({
            id: id as string,
            email: `resident${id}@hospital.com`,
            full_name: `Residente ${id?.slice(-4)}`,
            role: 'resident'
          }));
        }
      }

      // Always add current user to residents list if they're authenticated
      if (user?.id) {
        const currentUserProfile: ResidentProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario Actual',
          role: user.user_metadata?.role || 'resident'
        };

        const exists = residents.find(r => r.id === user.id);
        if (!exists) {
          residents = [currentUserProfile, ...residents];
        }
      }

      console.log(`📋 Loaded ${residents.length} residents`);
      setResidents(residents);
    } catch (error) {
      console.error('❌ Error loading residents:', error);
      // Set empty array so the component still works
      setResidents([]);
    }
  };

  const saveOutpatient = async () => {
    if (!newOutpatient.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setOutpatientLoading(true);
      const payload = {
        ...newOutpatient,
        fecha: newOutpatient.fecha || new Date().toISOString().split('T')[0],
        fecha_proxima_cita: newOutpatient.fecha_proxima_cita?.trim() ? newOutpatient.fecha_proxima_cita : null,
        assigned_resident_id: null
      };
      console.log('[WardRounds] Saving outpatient from modal', payload);
      const { error } = await addOutpatientPatient(payload);
      if (error) throw error;
      setNewOutpatient(emptyOutpatient);
      await loadOutpatients();
    } catch (error) {
      console.error('[WardRounds] Error adding outpatient patient:', error);
      alert('No se pudo agregar el paciente ambulatorio. Intenta nuevamente.');
    } finally {
      setOutpatientLoading(false);
    }
  };

  const removeOutpatient = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre} de ambulatorios?`)) return;
    try {
      setOutpatientLoading(true);
      const { error } = await deleteOutpatientPatient(id);
      if (error) throw error;
      await loadOutpatients();
    } catch (error) {
      console.error('[WardRounds] Error deleting outpatient patient:', error);
      alert('No se pudo eliminar el paciente ambulatorio.');
    } finally {
      setOutpatientLoading(false);
    }
  };

  // Función para validar DNI duplicado
  const validateDNI = async (dni: string, excludeId?: string) => {
    if (!ENABLE_DNI_CHECK) {
      return true;
    }
    if (!dni.trim()) {
      return true;
    }

    try {
      let query = supabase
        .from('ward_round_patients')
        .select('id, nombre, dni')
        .eq('dni', dni.trim());

      // Si estamos editando, excluir el paciente actual
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const existingPatient = data[0];
        console.warn(`⚠️ DNI ya existe: ${existingPatient.nombre} (${existingPatient.dni})`);
        alert(`⚠️ DNI duplicado: ${existingPatient.nombre} (${existingPatient.dni})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating DNI:', error);
      return false;
    }
  };

  const createEmptyPatient = async () => {
    // Prevenir clics múltiples
    if (isCreatingPatient) {
      console.log('[WardRounds] createEmptyPatient -> already creating, ignoring');
      return;
    }

    try {
      setIsCreatingPatient(true);
      console.log('[WardRounds] createEmptyPatient -> creating empty patient');

      const payload = {
        ...emptyPatient,
        display_order: getNextDisplayOrder()
      };

      const { data, error } = await supabase
        .from('ward_round_patients')
        .insert([payload])
        .select();

      if (error) throw error;
      console.log('[WardRounds] createEmptyPatient -> inserted:', data);

      if (data && data[0]) {
        // Abrir inmediatamente el paciente recién creado en vista de detalle EN MODO DE EDICIÓN
        handlePatientSelection(data[0]);
        await loadPatients();
      }
    } catch (error) {
      console.error('[WardRounds] Error creating empty patient:', error);
      alert('Error al crear paciente');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Función para ordenar pacientes
  const handleSort = (field: keyof Patient) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Función para alternar la expansión de una fila
  const toggleOutpatientRow = (patientId: string) => {
    const newExpandedRows = new Set(expandedOutpatientRows);
    if (newExpandedRows.has(patientId)) {
      newExpandedRows.delete(patientId);
    } else {
      newExpandedRows.add(patientId);
    }
    setExpandedOutpatientRows(newExpandedRows);
  };

  const orderedPatients = React.useMemo(() => sortPatientsByDisplayOrder(patients), [patients]);

  // Ordenar pacientes basado en el estado actual
  const sortedPatients = React.useMemo(() => {
    if (!sortField) return orderedPatients;

    return [...orderedPatients].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      // Convertir a string para comparación
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'es');
      } else {
        return bStr.localeCompare(aStr, 'es');
      }
    });
  }, [orderedPatients, sortField, sortDirection]);

  const sortedOutpatients = React.useMemo(() => {
    return [...outpatients].sort((a, b) => {
      const nextDateA = a.fecha_proxima_cita || a.fecha || '';
      const nextDateB = b.fecha_proxima_cita || b.fecha || '';
      return nextDateA.localeCompare(nextDateB, 'es');
    });
  }, [outpatients]);

  // Calculate severity counts for header badges
  const severityCounts = React.useMemo(() => {
    const counts = {
      I: 0,
      II: 0,
      III: 0,
      IV: 0
    };
    patients.forEach((patient) => {
      if (patient.severidad && Object.prototype.hasOwnProperty.call(counts, patient.severidad)) {
        counts[patient.severidad as 'I' | 'II' | 'III' | 'IV'] += 1;
      }
    });
    return counts;
  }, [patients]);

  const assignedResident = selectedPatient
    ? residents.find((resident) => resident.id === selectedPatient.assigned_resident_id)
    : null;

  const resetDragState = () => {
    setDraggedPatientId(null);
    setDragOverPatientId(null);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, patientId: string) => {
    if (!patientId) return;
    setDraggedPatientId(patientId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverRow = (event: React.DragEvent<HTMLDivElement>, patientId: string) => {
    event.preventDefault();
    if (dragOverPatientId !== patientId) {
      setDragOverPatientId(patientId);
    }
  };

  const persistNewOrder = async (orderedList: Patient[]) => {
    setIsReordering(true);
    setPatients(orderedList);
    try {
      const updates = orderedList
        .map((patient, index) => ({
          id: patient.id,
          display_order: index
        }))
        .filter((p) => p.id);

      const results = await Promise.all(
        updates.map(({ id, display_order }) =>
          supabase.from('ward_round_patients').update({ display_order }).eq('id', id as string)
        )
      );

      const errorResult = results.find((r: any) => r.error);
      if (errorResult?.error) throw errorResult.error;
    } catch (error) {
      console.error('[WardRounds] Error saving order:', error);
      alert('No se pudo guardar el nuevo orden. Vuelve a intentar.');
      await loadPatients();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDropRow = async (event: React.DragEvent<HTMLDivElement>, targetPatientId: string) => {
    event.preventDefault();
    if (!draggedPatientId || draggedPatientId === targetPatientId) {
      resetDragState();
      return;
    }

    const currentList = sortField ? sortedPatients : orderedPatients;
    const fromIndex = currentList.findIndex((p) => p.id === draggedPatientId);
    const toIndex = currentList.findIndex((p) => p.id === targetPatientId);

    if (fromIndex === -1 || toIndex === -1) {
      resetDragState();
      return;
    }

    const reordered = [...currentList];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const withOrder = reordered.map((patient, index) => ({
      ...patient,
      display_order: index
    }));

    setSortField(null);
    setSortDirection('asc');
    resetDragState();
    await persistNewOrder(withOrder);
  };

  // Actualizar paciente existente
  const updatePatient = async (id: string, updatedPatient: Patient) => {
    // Prevent multiple simultaneous updates
    if (isUpdatingPatient) {
      console.log('[WardRounds] updatePatient -> already updating, skipping');
      return;
    }

    setIsUpdatingPatient(true);

    try {
      console.log('[WardRounds] updatePatient -> id:', id, 'payload:', updatedPatient);

      // Validar DNI antes de actualizar (excluyendo el paciente actual)
      const isValidDNI = await validateDNI(updatedPatient.dni, id);
      if (!isValidDNI) {
        setIsUpdatingPatient(false);
        return; // No actualizar si hay duplicado
      }

      // Enhanced debugging for production
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      console.log('[WardRounds] Environment:', isProduction ? 'production' : 'development');

      // Optional session check (don't block the main operation)
      supabase.auth.getSession()
        .then((sessionResult) => {
          console.log('[WardRounds] User session status:', (sessionResult as any)?.data?.session ? 'authenticated' : 'not authenticated');
        })
        .catch((sessionError) => {
          console.log('[WardRounds] Session check failed (non-blocking):', sessionError.message);
        });

      const { data, error } = await supabase
        .from('ward_round_patients')
        .update({
          ...updatedPatient,
          // Asegurar que los arrays de imagen estén correctamente formateados
          image_thumbnail_url: updatedPatient.image_thumbnail_url || [],
          image_full_url: updatedPatient.image_full_url || [],
          exa_url: updatedPatient.exa_url || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(); // Add select to see what was actually updated

      console.log('[WardRounds] Update response:', { data, error });

      if (error) throw error;

      // Sincronizar con el sistema de tareas
      const patientWithId = { ...updatedPatient, id };
      const syncSuccess = await createOrUpdateTaskFromPatient(patientWithId);
      if (!syncSuccess) {
        console.warn('No se pudo sincronizar con el sistema de tareas');
      }

      loadPatients();
    } catch (error) {
      console.error('[WardRounds] Error updating patient:', error);

      // Enhanced error reporting for production debugging
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      const errorDetails = {
        environment: isProduction ? 'production' : 'development',
        patientId: id,
        error: error,
        errorMessage: (error as any)?.message || 'Unknown error',
        errorCode: (error as any)?.code || 'no_code',
        errorDetails: (error as any)?.details || 'no_details',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      console.error('[WardRounds] Detailed error info:', errorDetails);

      // More informative alert for debugging
      const errorMsg = `Error al actualizar paciente${isProduction ? ' (ver consola para detalles)' : ''}:\n${(error as any)?.message || 'Error desconocido'}`;
      alert(errorMsg);
    } finally {
      setIsUpdatingPatient(false);
    }
  };

  // ========== HANDLERS DE ESCALAS NEUROLÓGICAS ==========

  /**
   * Abre el modal de escala neurológica
   */
  const openScaleModal = useCallback((scaleId: string) => {
    const scale = medicalScales.find(s => s.id === scaleId);
    if (scale) {
      console.log('🔍 Opening scale modal:', scale.name);
      setSelectedScale(scale);
    } else {
      console.error('❌ Scale not found:', scaleId);
      showToast('Escala no encontrada', 'error');
    }
  }, []);

  /**
   * Cierra el modal de escala
   */
  const handleScaleModalClose = useCallback(() => {
    setSelectedScale(null);
  }, []);

  /**
   * Maneja el resultado de la escala completada
   * Anexa el resultado formateado al campo examen_fisico
   */
  const handleScaleModalSubmit = useCallback(async (result: ScaleResult) => {
    if (!selectedPatient?.id) {
      showToast('No hay paciente seleccionado', 'error');
      return;
    }

    // Formatear el resultado
    const resultText = `\n\n=== ${result.scaleName} ===\nPuntaje: ${result.totalScore}\n${result.details}${result.interpretation ? '\nInterpretación: ' + result.interpretation : ''}`;

    // Actualizar el campo examen_fisico
    const currentEF = inlineDetailValues.examen_fisico as string || selectedPatient.examen_fisico || '';
    const updatedEF = currentEF + resultText;

    // Actualizar estado local
    setInlineDetailValues(prev => ({
      ...prev,
      examen_fisico: updatedEF
    }));

    // Persistir a Supabase
    try {
      await updatePatient(selectedPatient.id, {
        ...selectedPatient,
        examen_fisico: updatedEF,
      });

      // Actualizar lista de pacientes
      setPatients(prev => prev.map(p =>
        p.id === selectedPatient.id
          ? { ...p, examen_fisico: updatedEF }
          : p
      ));

      // Actualizar selectedPatient para reflejar cambios
      setSelectedPatient(prev => prev ? { ...prev, examen_fisico: updatedEF } : null);

      showToast(`${result.scaleName} guardada correctamente`, 'success');
    } catch (error) {
      console.error('Error saving scale result:', error);
      showToast('Error al guardar la escala', 'error');
    }

    // Cerrar modal de escala
    setSelectedScale(null);
  }, [selectedPatient, inlineDetailValues]);

  // ======================================================

  // ========== CLASIFICACIÓN TOAST ==========

  /**
   * Inserta la categoría TOAST seleccionada en el campo diagnóstico
   */
  const insertToastCategory = useCallback((categoryId: string) => {
    const category = TOAST_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const currentDiagnostico = inlineDetailValues.diagnostico as string || '';
    const toastText = `\nClasificación TOAST: ${category.label}`;

    setInlineDetailValues(prev => ({
      ...prev,
      diagnostico: currentDiagnostico + toastText
    }));

    setShowToastDropdown(false);
  }, [inlineDetailValues]);

  // ==========================================

  // Asignar residente a paciente
  const assignResidentToPatient = async (patientId: string, residentId: string | null) => {
    try {
      console.log('[WardRounds] assignResidentToPatient -> patientId:', patientId, 'residentId:', residentId);
      const { error } = await supabase
        .from('ward_round_patients')
        .update({ assigned_resident_id: residentId })
        .eq('id', patientId);

      if (error) throw error;

      // Refresh the patients list to show the new assignment
      await loadPatients();

      // Show success message
      const resident = residents.find(r => r.id === residentId);
      const message = residentId
        ? `Paciente asignado a ${resident?.full_name || 'residente'}`
        : 'Asignación de residente removida';

      alert(message);
    } catch (error) {
      console.error('[WardRounds] Error assigning resident:', error);
      alert('Error al asignar residente');
    }
  };

  // Abrir modal + ventana detallada al seleccionar paciente
  const handlePatientSelection = (patient: Patient) => {
    const patientWithDefaults = { ...emptyPatient, ...patient };
    setSelectedPatient(patientWithDefaults);
    setInlineDetailValues(patientWithDefaults);
    setEditingSection(null); // Resetear sección editándose
    setImagePreviewError(null);
    setImageUploadError(null);
  };

  // ==========================================
  // Inline Card Editing Handlers
  // ==========================================

  const startInlineCardEdit = (patient: Patient) => {
    setInlineEditingPatientId(patient.id || null);
    setInlineEditValues(patient);
  };

  const cancelInlineCardEdit = () => {
    setInlineEditingPatientId(null);
    setInlineEditValues(null);
  };

  const saveInlineCardEdit = async () => {
    if (!inlineEditingPatientId || !inlineEditValues) return;

    setIsUpdatingPatient(true);
    try {
      await updatePatient(inlineEditingPatientId, inlineEditValues);
      setInlineEditingPatientId(null);
      setInlineEditValues(null);
    } catch (error) {
      console.error('Error saving inline card edit:', error);
      alert('Error al guardar los cambios del paciente');
    } finally {
      setIsUpdatingPatient(false);
    }
  };

  const renderAccordionCard = (
    label: string,
    field: keyof Patient,
    placeholder: string,
    _options: { multiline?: boolean } = {} // Prefix with _ to indicate intentionally unused
  ) => {
    const value = (inlineDetailValues[field] as string) || '';
    const isExpanded = expandedSections.includes(field);
    const isEditing = editingSection === field;
    const isSaving = savingSections.has(field);

    // Procesar valor (colapsar saltos de línea)
    const processedValue = value && value.trim()
      ? value.replace(/\n{3,}/g, '\n\n')
      : '';
    const displayValue = processedValue || placeholder;

    return (
      <AccordionSection
        title={label}
        isExpanded={isExpanded}
        onToggle={() => toggleSection(field)}
        contentLength={processedValue.length}
        isEditing={isEditing}
        isSaving={isSaving}
        showEditButton={true}
        onEditToggle={() => {
          if (isEditing) {
            saveAndCloseSection(field);
          } else {
            startEditingSection(field);
          }
        }}
      >
        {/* MODO EDICIÓN */}
        {isEditing ? (
          <div className="space-y-2">
            {/* Botones especiales según el campo */}
            {field === 'examen_fisico' && (
              <div className="flex flex-wrap gap-2 justify-end mb-2">
                {/* Botón EF normal */}
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  onClick={() => setInlineDetailValues((prev) => ({
                    ...prev,
                    examen_fisico: (prev.examen_fisico as string) && (prev.examen_fisico as string).trim()
                      ? `${prev.examen_fisico as string}\n${NORMAL_EF_TEXT}`
                      : NORMAL_EF_TEXT
                  }))}
                  title="Insertar plantilla de examen físico normal"
                >
                  EF normal
                </button>

                <div className="border-l border-gray-300 dark:border-gray-600"></div>

                {/* Botones de escalas neurológicas (4 botones) */}
                {PRIORITY_SCALES.map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200"
                    onClick={() => openScaleModal(scale.id)}
                    title={`Calcular ${scale.fullName}`}
                  >
                    {scale.id.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {field === 'diagnostico' && (
              <div className="flex justify-end mb-2 relative">
                {/* Botón ACV con dropdown TOAST */}
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowToastDropdown(!showToastDropdown);
                  }}
                  title="Clasificación TOAST para ACV isquémico"
                >
                  🧠 ACV - Clasificación TOAST
                </button>

                {/* Dropdown de categorías TOAST */}
                {showToastDropdown && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[280px]">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      Clasificación TOAST
                    </div>
                    {TOAST_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          insertToastCategory(category.id);
                        }}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {category.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {category.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Textarea editable */}
            <textarea
              value={value}
              onChange={(e) => setInlineDetailValues(prev => ({
                ...prev,
                [field]: e.target.value
              }))}
              placeholder={placeholder}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
              autoFocus
            />

            {/* Botón cancelar inline */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => cancelEditingSection(field)}
                className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* MODO LECTURA */
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {displayValue}
          </div>
        )}
      </AccordionSection>
    );
  };

  /**
   * Obtener imágenes del paciente como objetos estructurados
   * Combina los arrays paralelos en un solo array de objetos
   */
  const getPatientImages = (patient: Patient | Partial<Patient>) => {
    const thumbs = (patient.image_thumbnail_url as string[]) || [];
    const fulls = (patient.image_full_url as string[]) || [];
    const exas = (patient.exa_url as (string | null)[]) || [];

    const maxLength = Math.max(thumbs.length, fulls.length, exas.length);
    const images = [];

    for (let i = 0; i < maxLength; i++) {
      images.push({
        thumbnail: thumbs[i] || fulls[i] || '',
        full: fulls[i] || thumbs[i] || '',
        exa: exas[i] || undefined,
        index: i
      });
    }

    return images.filter(img => img.thumbnail || img.full);
  };

  /**
   * Agregar nuevas imágenes a un paciente
   * Añade las URLs de las imágenes subidas a los arrays existentes
   */
  const addImagesToPatient = (
    currentPatient: Patient | Partial<Patient>,
    newImages: any[]
  ): Partial<Patient> => {
    const currentThumbs = (currentPatient.image_thumbnail_url as string[]) || [];
    const currentFulls = (currentPatient.image_full_url as string[]) || [];
    const currentExas = (currentPatient.exa_url as (string | null)[]) || [];

    return {
      ...currentPatient,
      image_thumbnail_url: [
        ...currentThumbs,
        ...newImages.map(img => img.signedUrl || img.publicUrl)
      ],
      image_full_url: [
        ...currentFulls,
        ...newImages.map(img => img.signedUrl || img.publicUrl)
      ],
      exa_url: [
        ...currentExas,
        ...newImages.map(() => null)
      ]
    };
  };

  /**
   * Eliminar imagen en el índice específico
   * Remueve la imagen de todos los arrays paralelos
   */
  const removeImageAtIndex = (
    currentPatient: Patient | Partial<Patient>,
    index: number
  ): Partial<Patient> => {
    const thumbs = [...((currentPatient.image_thumbnail_url as string[]) || [])];
    const fulls = [...((currentPatient.image_full_url as string[]) || [])];
    const exas = [...((currentPatient.exa_url as (string | null)[]) || [])];

    thumbs.splice(index, 1);
    fulls.splice(index, 1);
    exas.splice(index, 1);

    return {
      ...currentPatient,
      image_thumbnail_url: thumbs,
      image_full_url: fulls,
      exa_url: exas
    };
  };

  /**
   * Handler para subir múltiples archivos
   * Sube imágenes en paralelo usando uploadMultipleImagesToStorage
   */
  const handleMultipleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const patientIdForUpload = selectedPatient?.id || '';
    if (!patientIdForUpload) {
      setImageUploadError('No hay ID de paciente; guarda primero el paciente antes de subir imagen.');
      return;
    }

    const basePatient = {
      ...selectedPatient,
      ...(inlineDetailValues as Patient)
    };

    const filesArray = Array.from(fileList);
    setUploadingImages(true);
    setUploadProgress({uploaded: 0, total: filesArray.length});
    setImageUploadError(null);
    setImagePreviewError(null);

    try {
      // Use parallel batch upload instead of sequential loop
      const results = await uploadMultipleImagesToStorage(filesArray, patientIdForUpload);

      // Update progress to show completion
      setUploadProgress({uploaded: filesArray.length, total: filesArray.length});

      const updatedPatient = addImagesToPatient(basePatient, results);
      await updatePatient(patientIdForUpload, updatedPatient as Patient);
      setInlineDetailValues(updatedPatient);
      setSelectedPatient(prev => ({ ...(prev as Patient), ...(updatedPatient as Patient) }));
    } catch (e: any) {
      console.error('[WardRounds] Multiple image upload failed', e);
      setImageUploadError(e?.message || 'No se pudieron subir las imágenes');
    } finally {
      setUploadingImages(false);
      setUploadProgress({uploaded: 0, total: 0});
    }
  };

  const isMobileCameraDevice = () =>
    typeof navigator !== 'undefined' && /android|iphone|ipad|mobile/i.test(navigator.userAgent || '');

  const startDesktopCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este navegador no permite abrir la camara directamente.');
      return;
    }

    if (cameraStream || isCameraStarting) return;

    try {
      setIsCameraStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(stream);
      setCameraError(null);
    } catch (error) {
      console.error('[WardRounds] Error al abrir la camara', error);
      setCameraError('No pudimos acceder a la camara. Revisa los permisos del navegador.');
      stopCameraStream();
    } finally {
      setIsCameraStarting(false);
    }
  };

  const handleCameraButtonClick = async () => {
    if (isMobileCameraDevice()) {
      cameraInputRef.current?.click();
      return;
    }

    setShowCameraModal(true);
    setCameraError(null);
    await startDesktopCamera();
  };

  const handleCaptureFromCamera = async () => {
    if (!cameraVideoRef.current) {
      setCameraError('Camara no inicializada.');
      return;
    }

    if (!selectedPatient?.id) {
      setImageUploadError('Selecciona o guarda el paciente antes de subir la foto.');
      return;
    }

    try {
      setIsCapturingPhoto(true);
      const videoElement = cameraVideoRef.current;
      const canvas = document.createElement('canvas');
      const width = videoElement.videoWidth || videoElement.clientWidth || 1280;
      const height = videoElement.videoHeight || videoElement.clientHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCameraError('No pudimos procesar la imagen de la camara.');
        return;
      }

      ctx.drawImage(videoElement, 0, 0, width, height);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92)
      );

      if (!blob) {
        setCameraError('No se pudo generar la imagen.');
        return;
      }

      const file = new File([blob], `ward-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      await handleMultipleFileUpload(dataTransfer.files);
      closeCameraModal();
    } catch (error) {
      console.error('[WardRounds] Error capturando foto de camara', error);
      setCameraError('Error al capturar la foto.');
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  /**
   * Handler para eliminar imagen
   * Elimina la imagen del índice especificado y actualiza la base de datos
   */
  const handleRemoveImage = async (index: number) => {
    if (!selectedPatient?.id) return;

    const updatedPatient = removeImageAtIndex(inlineDetailValues, index);

    try {
      await updatePatient(selectedPatient.id, updatedPatient as Patient);
      setInlineDetailValues(updatedPatient);
      setSelectedPatient({...selectedPatient, ...updatedPatient} as Patient);
    } catch (error) {
      console.error('[WardRounds] Error removing image:', error);
      setImageUploadError('Error al eliminar la imagen');
    }
  };

  const renderImagePreviewCard = () => {
    const images = getPatientImages(inlineDetailValues);
    const imageCount = images.length;

    return (
      <div className="p-3 rounded-xl border border-[var(--border-primary)] bg-white/90 shadow-sm">
        {/* Hidden inputs for file uploads - always available */}
        <input
          ref={quickImageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleMultipleFileUpload(e.target.files);
            if (quickImageInputRef.current) {
              quickImageInputRef.current.value = '';
            }
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleMultipleFileUpload(e.target.files);
            if (cameraInputRef.current) {
              cameraInputRef.current.value = '';
            }
          }}
        />

        {/* Header con contador de fotos */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
              IMG
            </span>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Imágenes {imageCount > 0 && `(${imageCount})`}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            {imageCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold dark:bg-blue-900 dark:text-blue-300">
                {imageCount} {imageCount === 1 ? 'foto' : 'fotos'}
              </span>
            )}
            {true && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded btn-soft text-xs"
                  onClick={() => quickImageInputRef.current?.click()}
                  disabled={uploadingImages || !selectedPatient?.id}
                  title="Agregar imágenes desde archivo"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Agregar</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded btn-soft text-xs"
                  onClick={handlePasteFromClipboard}
                  disabled={uploadingImages || !selectedPatient?.id}
                  title="Pegar imagen desde portapapeles"
                >
                  <Clipboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Pegar</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded btn-soft text-xs"
                  onClick={handleCameraButtonClick}
                  disabled={uploadingImages || !selectedPatient?.id}
                  title="Capturar con cámara"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Cámara</span>
                </button>
              </>
            )}
          </div>
        </div>

        {editingSection !== null ? (
          <div className="space-y-3">
            {/* URL inputs para cada imagen */}
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div key={idx} className="p-2 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Imagen {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    type="url"
                    value={img.full}
                    onChange={(e) => {
                      const fulls = [...((inlineDetailValues.image_full_url as string[]) || [])];
                      fulls[idx] = e.target.value;
                      setInlineDetailValues(prev => ({...prev, image_full_url: fulls}));
                    }}
                    className="w-full text-xs rounded border border-gray-300 px-2 py-1"
                    placeholder="URL imagen completa"
                  />
                  <input
                    type="url"
                    value={img.exa || ''}
                    onChange={(e) => {
                      const exas = [...((inlineDetailValues.exa_url as (string | null)[]) || [])];
                      exas[idx] = e.target.value || null;
                      setInlineDetailValues(prev => ({...prev, exa_url: exas}));
                    }}
                    className="w-full text-xs rounded border border-gray-300 px-2 py-1"
                    placeholder="URL EXA (opcional)"
                  />
                </div>
              ))}
            </div>

            {/* Upload section */}
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subir nuevas imágenes
              </label>

              {/* Button row - file picker + paste + camera */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = (e: any) => handleMultipleFileUpload(e.target.files);
                    input.click();
                  }}
                  disabled={uploadingImages}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>Seleccionar archivos</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  disabled={uploadingImages}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-colors dark:bg-green-700 dark:hover:bg-green-600"
                >
                  <Clipboard className="h-4 w-4" />
                  <span>Pegar imagen</span>
                </button>

                <button
                  type="button"
                  onClick={handleCameraButtonClick}
                  disabled={uploadingImages}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-colors dark:bg-purple-700 dark:hover:bg-purple-600"
                  title="Abrir cámara"
                >
                  <Camera className="h-4 w-4" />
                  <span>Cámara</span>
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">
                Puedes seleccionar archivos, pegar desde portapapeles o capturar con la cámara.
              </p>

              {uploadingImages && (
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  Subiendo {uploadProgress.uploaded} de {uploadProgress.total} imágenes...
                </div>
              )}
              {imageUploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">{imageUploadError}</p>
              )}
            </div>
          </div>
        ) : imageCount > 0 ? (
          <div className="space-y-2">
            {/* Grilla 2 columnas responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {images.map((img, idx) => {
                const overrideUrl = imageOverrides[idx];
                const fullUrl = overrideUrl || normalizeUrl(img.full);
                const thumbUrl = overrideUrl || normalizeUrl(img.thumbnail) || fullUrl;
                const exaUrl = img.exa ? normalizeUrl(img.exa) : '';

                return (
                  <div key={idx} className="relative group">
                    <button
                      type="button"
                      className="relative w-full overflow-hidden rounded-lg border border-[var(--border-primary)] group/img"
                      onClick={() => setImageLightboxUrl(fullUrl || thumbUrl)}
                      style={{ minHeight: '120px' }}
                    >
                      {/* Container flexible con aspect ratio preservado */}
                      <div className="w-full flex items-center justify-center bg-gray-100" style={{ minHeight: '120px' }}>
                        <img
                          src={thumbUrl}
                          alt={`Imagen ${idx + 1}`}
                          className="max-w-full max-h-48 object-contain transition-transform duration-200 group-hover/img:scale-[1.02]"
                          onError={async () => {
                            setImagePreviewError(`Error cargando imagen ${idx + 1}, reintentando...`);
                            const refreshed = await refreshSignedUrl(fullUrl || thumbUrl);
                            if (refreshed && refreshed !== fullUrl && refreshed !== thumbUrl) {
                              setImageOverrides((prev) => ({ ...prev, [idx]: refreshed }));
                              setImagePreviewError(null);
                            } else {
                              setImagePreviewError(`No se pudo cargar la imagen ${idx + 1}`);
                              console.error('[WardRounds] Image preview failed', { thumbUrl, fullUrl, idx });
                            }
                          }}
                        />
                      </div>

                      {/* Overlay al hover */}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs space-x-1">
                        <Maximize2 className="h-4 w-4" />
                        <span>Ver</span>
                      </div>
                    </button>

                    {/* Badge EXA individual */}
                    {exaUrl && (
                      <a
                        href={exaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center space-x-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>EXA</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            {imagePreviewError && (
              <p className="text-xs text-red-600">{imagePreviewError}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Sin imágenes. Usa el botón + para agregar fotos sin entrar en modo edición.
          </p>
        )}
      </div>
    );
  };

  // Abrir modal para eliminar/archivar paciente
  const openDeleteModal = (id: string, patientName: string, dni: string) => {
    setSelectedPatientForDeletion({ id, nombre: patientName, dni });
    setShowDeleteModal(true);
  };

  // Cerrar modal de eliminación
  const closeDeleteModal = () => {
    // Permitir cierre programático incluso si está procesando
    setShowDeleteModal(false);
    setSelectedPatientForDeletion(null);
    setIsProcessingDeletion(false); // Always reset processing state
  };

  // Auto-recovery function for stuck states
  const forceResetDeletionState = async () => {
    console.log('[WardRounds] Force resetting deletion state...');
    setIsProcessingDeletion(false);
    setShowDeleteModal(false);
    setSelectedPatientForDeletion(null);
    await loadPatients(); // Refresh data
  };

  // Auto-recovery timeout (reset stuck states after 30 seconds)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isProcessingDeletion) {
      timeout = setTimeout(async () => {
        console.warn('[WardRounds] Auto-recovery: resetting stuck deletion state');
        await forceResetDeletionState();
        alert('La operación tardó demasiado y fue cancelada. Intenta nuevamente.');
      }, 30000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isProcessingDeletion]);

  // Ejecutar acción de eliminación o archivo
  const handleDeleteAction = async (action: 'delete' | 'archive' | 'outpatient') => {
    if (!selectedPatientForDeletion) return;

    setIsProcessingDeletion(true);

    try {
      const { id, nombre: patientName } = selectedPatientForDeletion;

      // Enhanced logging for production debugging
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      console.log(`[WardRounds] ${action} action for patient:`, { id, patientName, isProduction });

      let fullPatientData: Patient | null = null;

      if (action === 'archive' || action === 'outpatient') {
        const { data, error: fetchError } = await supabase
          .from('ward_round_patients')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error(`Error al obtener datos del paciente: ${fetchError.message}`);
        }

        fullPatientData = data as Patient;
      }

      if ((action === 'archive' || action === 'outpatient') && !fullPatientData) {
        throw new Error('No se pudieron obtener los datos completos del paciente');
      }

      if (action === 'archive') {
        console.log('[WardRounds] Starting archive process...');


        // Intentar archivar el paciente (simplified, will use auto-recovery instead of manual timeout)
        const archiveResult = await archiveWardPatient(fullPatientData as Patient, 'Posadas');

        if (!archiveResult.success) {
          if (archiveResult.duplicate) {
            alert(`Paciente ya existe en archivo. ${archiveResult.error}`);
            // No continuar con la eliminación - let finally block handle cleanup
            throw new Error(`Duplicate patient: ${archiveResult.error}`);
          } else {
            throw new Error(archiveResult.error || 'Error al archivar paciente');
          }
        }

        // Si el archivo fue exitoso, proceder con la eliminación del pase
        console.log('✅ Paciente archivado exitosamente, procediendo con eliminación del pase...');
      }

      if (action === 'outpatient') {
        const sourcePatient = patients.find((p) => p.id === id) || fullPatientData;
        const outpatientPayload = mapWardPatientToOutpatient(sourcePatient as Patient);
        console.log('[WardRounds] Outpatient payload preview', outpatientPayload);
        const { error: outpatientError } = await addOutpatientPatient(outpatientPayload);
        if (outpatientError) {
          throw outpatientError;
        }
        await loadOutpatients();
      }

      console.log('[WardRounds] Deleting related tasks...');

      // Eliminar tareas relacionadas (simplified)
      try {
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('patient_id', id)
          .eq('source', 'ward_rounds');

        if (tasksError) {
          console.warn('Error al eliminar tareas relacionadas:', tasksError);
        }
      } catch (tasksError) {
        console.warn('Failed to delete tasks, continuing...');
      }

      console.log('[WardRounds] Deleting patient from ward...');

      // Eliminar el paciente del pase de sala (simplified)
      const { error } = await supabase
        .from('ward_round_patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Éxito
      await loadPatients();
      // Cerrar modal de forma explícita ahora que terminó el proceso
      setIsProcessingDeletion(false);
      closeDeleteModal();

      if (action === 'archive') {
        alert(`Paciente "${patientName}" guardado y eliminado del pase de sala.`);
      } else if (action === 'outpatient') {
        alert(`Paciente "${patientName}" movido a ambulatorios y eliminado del pase de sala.`);
      } else {
        alert(`Paciente "${patientName}" eliminado completamente.`);
      }

    } catch (error) {
      console.error('Error processing deletion:', error);

      // Enhanced error reporting
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      const detailedError = {
        action,
        patient: selectedPatientForDeletion,
        error: errorMessage,
        isProduction,
        timestamp: new Date().toISOString()
      };

      console.error('[WardRounds] Detailed deletion error:', detailedError);

      // User-friendly error messages
      let userMessage = `Error al ${
        action === 'archive' ? 'archivar' : action === 'outpatient' ? 'mover a ambulatorios' : 'eliminar'
      } paciente`;

      if (errorMessage.includes('Timeout')) {
        userMessage += ': La operación tardó demasiado. Intenta nuevamente.';
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('existe')) {
        userMessage += ': El paciente ya existe en el archivo.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userMessage += ': Problema de conexión. Verifica tu internet.';
      } else {
        userMessage += `: ${errorMessage}`;
      }

      if (isProduction) {
        userMessage += '\n\n(Ver consola para más detalles)';
      }

      alert(userMessage);
    } finally {
      setIsProcessingDeletion(false);
    }
  };

  // Funciones para edición inline de pendientes
  const startEditingPendientes = (patientId: string, currentPendientes: string) => {
    setEditingPendientesId(patientId);
    setTempPendientes(currentPendientes || '');
  };

  const saveInlinePendientes = async (patientId: string) => {
    try {
      // Actualizar pendientes en la base de datos del pase de sala
      const { error } = await supabase
        .from('ward_round_patients')
        .update({ pendientes: tempPendientes })
        .eq('id', patientId);

      if (error) throw error;
      
      // Obtener información completa del paciente para sincronizar con tareas
      const { data: patientData, error: fetchError } = await supabase
        .from('ward_round_patients')
        .select('id, nombre, dni, cama, severidad, pendientes')
        .eq('id', patientId)
        .single();

      if (!fetchError && patientData) {
        // Sincronizar con el sistema de tareas
        const syncSuccess = await createOrUpdateTaskFromPatient(patientData);
        if (!syncSuccess) {
          console.warn('No se pudo sincronizar con el sistema de tareas');
        }
      }
      
      setEditingPendientesId(null);
      setTempPendientes('');
      await loadPatients();
    } catch (error) {
      console.error('Error updating pendientes:', error);
      alert('Error al actualizar pendientes');
    }
  };

  const cancelEditingPendientes = () => {
    setEditingPendientesId(null);
    setTempPendientes('');
  };

  // Exportar a PDF estilo tabla Excel compacta (auto-scale)
  const exportTablePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Función para truncar texto largo
    const truncateText = (text: string, maxLength: number) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Generar filas de la tabla
    const generateTableRows = () => {
      return sortedPatients.map((patient, index) => {
        const severityColor = 
          patient.severidad === 'I' ? '#10b981' :
          patient.severidad === 'II' ? '#f59e0b' :
          patient.severidad === 'III' ? '#f97316' :
          patient.severidad === 'IV' ? '#ef4444' : '#6b7280';

        return `
          <tr>
            <td class="number-cell col-num">${index + 1}</td>
            <td class="text-cell bold col-bed">${patient.cama || '-'}</td>
            <td class="text-cell bold col-name">${patient.nombre || '-'}</td>
            <td class="text-cell col-dni">${patient.dni || '-'}</td>
            <td class="text-cell col-age">${patient.edad || '-'}</td>
            <td class="severity-cell col-severity" style="background-color: ${severityColor}20; border-left: 3px solid ${severityColor};">
              <strong style="color: ${severityColor};">${patient.severidad || '-'}</strong>
            </td>
            <td class="text-cell small col-history">${truncateText(patient.antecedentes, 500)}</td>
            <td class="text-cell small col-reason">${truncateText(patient.motivo_consulta, 400)}</td>
            <td class="text-cell small col-exam">${truncateText(patient.examen_fisico, 300)}</td>
            <td class="text-cell small col-studies">${truncateText(patient.estudios, 500)}</td>
            <td class="text-cell small col-diagnosis">${truncateText(patient.diagnostico, 400)}</td>
            <td class="text-cell small col-plan">${truncateText(patient.plan, 450)}</td>
            <td class="text-cell small pending-cell col-pending">${truncateText(patient.pendientes, 350)}</td>
          </tr>
        `;
      }).join('');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pase de Sala Neurología - ${today}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 10mm;
                size: A4 landscape;
              }
              thead {
                display: table-header-group;
              }
              tr, .patient-row {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
            
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 8px;
              font-size: 10pt;
              line-height: 1.4;
              color: #333;
            }
            
            .header {
              text-align: center;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 2px solid #2563eb;
            }
            
            .header h1 {
              color: #2563eb;
              font-size: 18pt;
              margin: 0 0 3px 0;
              font-weight: bold;
            }
            
            .header .info {
              color: #666;
              font-size: 9pt;
            }
            
            .summary-bar {
              background: #f8f9fa;
              padding: 6px 12px;
              border-radius: 4px;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9pt;
              border-left: 3px solid #2563eb;
            }
            
            .summary-stats {
              display: flex;
              gap: 15px;
            }
            
            .stat {
              display: flex;
              align-items: center;
              gap: 3px;
            }
            
            .stat-number {
              font-weight: bold;
              color: #2563eb;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #d1d5db;
              font-size: 10pt;
              table-layout: fixed;
            }
            
            th {
              background: #f9fafb;
              font-weight: bold;
              padding: 6px 4px;
              text-align: center;
              border: 1px solid #d1d5db;
              font-size: 10pt;
              color: #374151;
              white-space: nowrap;
            }
            
            td {
              padding: 5px 4px;
              border: 1px solid #e5e7eb;
              vertical-align: top;
              word-wrap: break-word;
              overflow-wrap: anywhere;
              word-break: break-word;
              white-space: normal;
              line-height: 1.4;
            }
            
            .number-cell {
              width: 2%;
              text-align: center;
              font-weight: bold;
              background: #f9fafb;
            }
            
            .text-cell {
              word-break: break-word;
            }
            
            .text-cell.bold {
              font-weight: bold;
              color: #1f2937;
            }
            
            .text-cell.small {
              font-size: 9pt;
              line-height: 1.4;
            }
            
            .severity-cell {
              width: 3%;
              text-align: center;
              font-weight: bold;
            }
            
            .pending-cell {
              background: #fefce8;
              border-left: 2px solid #f59e0b;
            }
            
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            tr:hover {
              background-color: #f3f4f6;
            }
            
            /* Optimización de columnas */
            .col-num { width: 2%; }
            .col-bed { width: 4%; }
            .col-name { width: 9%; }
            .col-dni { width: 6%; }
            .col-age { width: 3%; }
            .col-severity { width: 3%; }
            .col-history { width: 14%; }
            .col-reason { width: 12%; }
            .col-exam { width: 10%; }
            .col-studies { width: 15%; }
            .col-diagnosis { width: 11%; }
            .col-plan { width: 13%; }
            .col-pending { width: 10%; }
            
            .footer {
              margin-top: 8px;
              text-align: center;
              color: #6b7280;
              font-size: 8pt;
              border-top: 1px solid #e5e7eb;
              padding-top: 4px;
            }
          </style>
          <script>
            window.addEventListener('load', function() {
              const table = document.querySelector('table');
              const wrapper = document.querySelector('.table-wrapper');
              if (!table || !wrapper) return;

              const pageWidth = wrapper.clientWidth;
              const contentWidth = table.scrollWidth;
              if (contentWidth <= pageWidth) return;

              const scale = Math.max(0.65, Math.min(1, pageWidth / contentWidth));
              table.style.transform = 'scale(' + scale + ')';
              table.style.transformOrigin = 'top left';
              wrapper.style.height = (table.offsetHeight * scale) + 'px';
            });
          </script>
        </head>
        <body>
          <div class="header">
            <h1>PASE DE SALA NEUROLOGÍA</h1>
            <div class="info">${today} - Hospital Nacional Posadas</div>
          </div>
          
          <div class="summary-bar">
            <div class="summary-stats">
              <div class="stat">
                <span class="stat-number">${patients.length}</span>
                <span>Total</span>
              </div>
              <div class="stat">
                <span class="stat-number">${patients.filter(p => p.severidad === 'IV').length}</span>
                <span>Críticos</span>
              </div>
              <div class="stat">
                <span class="stat-number">${patients.filter(p => p.severidad === 'III').length}</span>
                <span>Severos</span>
              </div>
              <div class="stat">
                <span class="stat-number">${patients.filter(p => p.pendientes && p.pendientes.trim()).length}</span>
                <span>Con Pendientes</span>
              </div>
            </div>
            <div>Generado: ${new Date().toLocaleString('es-AR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-bed">Ubicación</th>
                <th class="col-name">Nombre</th>
                <th class="col-dni">DNI</th>
                <th class="col-age">Edad</th>
                <th class="col-severity">Sev</th>
                <th class="col-history">Antecedentes</th>
                <th class="col-reason">Motivo Consulta</th>
                <th class="col-exam">EF/NIHSS/ABCD2</th>
                <th class="col-studies">Estudios</th>
                <th class="col-diagnosis">Diagnóstico</th>
                <th class="col-plan">Plan</th>
                <th class="col-pending">Pendientes</th>
              </tr>
              </thead>
              <tbody>
              ${generateTableRows()}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            Pase de Sala Neurología - Hospital Nacional Posadas - Formato Tabla Completa
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // La ventana permanece abierta para que el usuario pueda revisar el PDF
    // El usuario puede imprimir manualmente con Ctrl+P cuando esté listo
  };

  return (
    <LoadingWithRecovery
      isLoading={authLoading || loading}
      onRetry={() => {
        console.log('[WardRounds] Manual retry triggered by user');
        setLoading(true);
        loadData();
      }}
      loadingMessage={authLoading ? 'Inicializando...' : 'Cargando pacientes...'}
      recoveryTimeout={15000}
    >
      <div className="max-w-7xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      {/* Compact Header with Gradient and Badges */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center gap-3">
            {/* Icono redondeado con sombra */}
            <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
              <Stethoscope className="h-5 w-5 text-blue-700" />
            </div>

            {/* Título y subtítulo */}
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Pase de Sala - Neurología</h1>
              <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Badges de estadísticas */}
            <div className="hidden lg:flex items-center gap-2 ml-4">
              <span className="text-xs px-2 py-1 bg-white rounded-full ring-1 ring-gray-200 text-[var(--text-secondary)]">
                {patients.length} total
              </span>
              <span className="text-xs px-2 py-1 bg-emerald-50 rounded-full ring-1 ring-emerald-100 text-emerald-800">
                {severityCounts['I']} Leve
              </span>
              <span className="text-xs px-2 py-1 bg-amber-50 rounded-full ring-1 ring-amber-100 text-amber-800">
                {severityCounts['II']} Moderado
              </span>
              <span className="text-xs px-2 py-1 bg-orange-50 rounded-full ring-1 ring-orange-100 text-orange-800">
                {severityCounts['III']} Severo
              </span>
              <span className="text-xs px-2 py-1 bg-red-50 rounded-full ring-1 ring-red-100 text-red-800">
                {severityCounts['IV']} Crítico
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
              title={viewMode === 'table' ? 'Cambiar a vista de tarjetas' : 'Cambiar a vista de tabla'}
            >
              {viewMode === 'table' ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </>
              ) : (
                <>
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tabla</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowOutpatientModal(true)}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
              title="Ambulatorios"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ambulatorios</span>
            </button>
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
              title="Importar CSV"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden md:inline">CSV</span>
            </button>
            <button
              onClick={exportTablePDF}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
              title="Exportar PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={createEmptyPatient}
              disabled={isCreatingPatient}
              className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Agregar Paciente"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isCreatingPatient ? 'Creando...' : 'Agregar'}</span>
            </button>
          </div>
        </div>

      {showOutpatientModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-6xl w-full h-[80vh] flex flex-col">
            <div
              className="p-4 border-b flex items-center justify-between sticky top-0 z-10"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold">Ambulatorios</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Lista intermedia con el mismo formato del pase</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadOutpatients}
                  className="p-2 rounded-md btn-soft text-sm flex items-center space-x-1"
                  disabled={outpatientLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refrescar</span>
                </button>
                <button onClick={closeOutpatientModal} className="p-1 rounded-md btn-soft">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  className="input"
                  placeholder="Nombre y apellido"
                  value={newOutpatient.nombre}
                  onChange={(e) => setNewOutpatient((prev) => ({ ...prev, nombre: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="DNI"
                  value={newOutpatient.dni}
                  onChange={(e) => setNewOutpatient((prev) => ({ ...prev, dni: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Motivo consulta"
                  value={newOutpatient.motivo_consulta}
                  onChange={(e) => setNewOutpatient((prev) => ({ ...prev, motivo_consulta: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Proxima cita (YYYY-MM-DD)"
                  value={newOutpatient.fecha_proxima_cita ?? ''}
                  onChange={(e) => setNewOutpatient((prev) => ({ ...prev, fecha_proxima_cita: e.target.value }))}
                />
                <button
                  onClick={saveOutpatient}
                  className="btn-accent flex items-center justify-center space-x-2 rounded px-3 py-2 text-sm"
                  disabled={outpatientLoading}
                >
                  <Check className="h-4 w-4" />
                  <span>{outpatientLoading ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[var(--bg-secondary)] px-3 sm:px-4 py-4">
              {outpatientLoading && (
                <div className="text-center text-[var(--text-secondary)] py-8">Cargando ambulatorios...</div>
              )}
              {!outpatientLoading && sortedOutpatients.length === 0 && (
                <div className="text-center text-[var(--text-secondary)] py-8">
                  Sin pacientes ambulatorios cargados
                </div>
              )}
              {!outpatientLoading && sortedOutpatients.length > 0 && (
                <div className="space-y-2">
                  <div className="hidden sm:block bg-white/80 border border-[var(--border-secondary)] rounded-lg px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="grid grid-cols-8 md:grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">Paciente</div>
                      <div className="col-span-3">Motivo / Diagnostico</div>
                      <div className="col-span-2">Pendientes</div>
                      <div className="col-span-2">Proxima cita</div>
                      <div className="col-span-2 text-right">Estado</div>
                    </div>
                  </div>
                  {sortedOutpatients.map((p) => {
                    const outpatientId = p.id ?? `${p.dni}-${p.fecha}`;
                    const isExpanded = expandedOutpatientRows.has(outpatientId);
                    return (
                      <div
                        key={outpatientId}
                        className={`expandable-row mb-2 bg-white border border-[var(--border-secondary)] rounded-lg ${
                          p.estado_pendiente === 'resuelto'
                            ? 'border-l-4 border-l-emerald-400'
                            : p.estado_pendiente === 'en_proceso'
                              ? 'border-l-4 border-l-blue-400'
                              : 'border-l-4 border-l-amber-400'
                        } ${isExpanded ? 'shadow-md' : 'hover:bg-gray-50'}`}
                      >
                        <div
                          className="px-3 sm:px-4 py-3 flex items-center justify-between cursor-pointer"
                          onClick={() => toggleOutpatientRow(outpatientId)}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOutpatientRow(outpatientId);
                              }}
                              title={isExpanded ? 'Contraer' : 'Expandir'}
                            >
                              <ChevronRight
                                className={`expand-icon h-4 w-4 text-gray-500 ${isExpanded ? 'expanded' : ''}`}
                              />
                            </button>
                            <div className="flex-1 grid grid-cols-8 md:grid-cols-12 gap-2 items-center min-w-0">
                              <div className="col-span-3">
                                <div className="text-sm font-medium text-gray-900 truncate">{p.nombre}</div>
                                <div className="text-xs text-gray-500">DNI: {p.dni || 'N/D'}</div>
                              </div>
                              <div className="col-span-3">
                                <div className="text-xs text-gray-700 truncate">{p.motivo_consulta || 'Sin motivo'}</div>
                                <div className="text-xs text-gray-500 truncate">{p.diagnostico || 'Sin diagnostico'}</div>
                              </div>
                              <div className="col-span-2 hidden md:block">
                                <div className="text-xs text-gray-600 truncate">{p.pendientes || 'Sin pendientes'}</div>
                              </div>
                              <div className="col-span-2 hidden sm:block">
                                <span className="text-xs text-gray-600">
                                  {p.fecha_proxima_cita || 'Sin fecha'}
                                </span>
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    p.estado_pendiente === 'resuelto'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : p.estado_pendiente === 'en_proceso'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {p.estado_pendiente || 'pendiente'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-1 min-w-[48px] sm:w-16">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (p.id) {
                                  removeOutpatient(p.id, p.nombre);
                                }
                              }}
                              className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                              title="Eliminar ambulatorio"
                              aria-label="Eliminar paciente ambulatorio"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded ? 'max-h-screen opacity-100 mb-3' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Antecedentes</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.antecedentes || 'No especificado'}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Examen fisico / EF</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.examen_fisico || 'No especificado'}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Estudios</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.estudios || 'No especificado'}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Diagnostico</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.diagnostico || 'No especificado'}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Plan</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.plan || 'No especificado'}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-1">Pendientes</h4>
                                  <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                                    {p.pendientes || 'Sin pendientes'}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-1 text-xs uppercase">Proxima cita</h4>
                                    <p className="text-gray-600 bg-white p-2 rounded border break-words overflow-wrap">
                                      {p.fecha_proxima_cita || 'Sin fecha'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-1 text-xs uppercase">Severidad</h4>
                                    <span
                                      className={`badge ${
                                        p.severidad === 'I'
                                          ? 'badge-severity-1'
                                          : p.severidad === 'II'
                                            ? 'badge-severity-2'
                                            : p.severidad === 'III'
                                              ? 'badge-severity-3'
                                              : p.severidad === 'IV'
                                                ? 'badge-severity-4'
                                                : 'bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {p.severidad || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Patient Display - Conditional Rendering */}
      {viewMode === 'table' ? (
        <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
          <div id="ward-round-table" className="flex-1 overflow-auto">
            <div className="divide-y divide-gray-200">
              {/* Header para ordenamiento */}
              <div className="bg-gray-50 px-3 sm:px-6 py-1.5 border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {/* Indicador de reordenamiento alineado con los íconos - oculto en mobile */}
                  <div className="hidden sm:flex items-center space-x-1 flex-shrink-0" style={{ width: '56px' }}>
                    {isReordering ? (
                      <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <span className="text-[10px] text-gray-400">Ordenar</span>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 sm:gap-2 items-center">
                    <div className="col-span-2">
                      <button
                        onClick={() => handleSort('cama')}
                        className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-start py-1"
                      >
                        <span>Ubicación</span>
                        {sortField === 'cama' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() => handleSort('nombre')}
                        className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-start py-1"
                      >
                        <span>Pacientes</span>
                        {sortField === 'nombre' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-2 hidden md:block">
                      <button
                        onClick={() => handleSort('diagnostico')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 justify-start py-1"
                      >
                        <span>Diagnóstico</span>
                        {sortField === 'diagnostico' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => handleSort('severidad')}
                        className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-center py-1"
                      >
                        <span>Sev</span>
                        {sortField === 'severidad' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() => handleSort('pendientes')}
                        className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-start py-1"
                      >
                        <span>Pendientes</span>
                        {sortField === 'pendientes' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-2 hidden lg:block">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <Users className="h-3 w-3 inline mr-1" />
                        <span>Residente</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end min-w-[60px] sm:w-20 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="hidden sm:inline">Acciones</span>
                    <span className="sm:hidden text-[10px]">Acc</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de pacientes */}
            {sortedPatients.map((patient) => {
              const isDragTarget = dragOverPatientId === (patient.id || '');
              return (
                <div
                  key={patient.id}
                  className={`expandable-row mb-2 ${
                    patient.severidad === 'I'
                      ? 'bg-green-50 border-l-4 border-l-green-400'
                      : patient.severidad === 'II'
                        ? 'bg-yellow-50 border-l-4 border-l-yellow-400'
                        : patient.severidad === 'III'
                        ? 'bg-orange-50 border-l-4 border-l-orange-400'
                        : patient.severidad === 'IV'
                          ? 'bg-red-50 border-l-4 border-l-red-400'
                          : 'bg-white border-l-4 border-l-gray-300'
                  } hover:bg-gray-50 ${isDragTarget ? 'ring-2 ring-blue-200 ring-inset' : ''}`}
                  onDragOver={(e) => handleDragOverRow(e, patient.id || '')}
                  onDrop={(e) => handleDropRow(e, patient.id || '')}
                  onDragEnd={resetDragState}
                  onDragLeave={() => setDragOverPatientId(null)}
                >
                  {/* Fila principal compacta */}
                  <div
                    className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer flex items-center justify-between"
                    onClick={() => handlePatientSelection(patient)}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      {/* Drag handle - hidden on mobile */}
                      <div
                        className="hidden sm:block flex-shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                        draggable={Boolean(patient.id) && !isReordering}
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => handleDragStart(e, patient.id || '')}
                        title="Arrastrar para reordenar"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* InformaciA3n principal */}
                      <div className="flex-1 grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 sm:gap-2 items-center min-w-0">
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-gray-900">{patient.cama}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">{patient.edad} años</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-gray-900 truncate">{patient.nombre}</div>
                          <div className="text-xs text-gray-500">
                            <span className="hidden sm:inline">DNI: {patient.dni}</span>
                            <span className="sm:hidden">{patient.edad} años</span>
                          </div>
                        </div>
                        <div className="col-span-2 hidden md:block">
                          <div className="text-xs text-gray-600 truncate">
                            {patient.diagnostico ? `${patient.diagnostico.slice(0, 25)}...` : 'Sin diagnóstico'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <span
                            className={`severity-indicator badge ${
                              patient.severidad === 'I'
                                ? 'badge-severity-1'
                                : patient.severidad === 'II'
                                  ? 'badge-severity-2'
                                  : patient.severidad === 'III'
                                    ? 'badge-severity-3'
                                    : patient.severidad === 'IV'
                                      ? 'badge-severity-4'
                                      : ''
                            }`}
                          >
                            {patient.severidad || '-'}
                          </span>
                        </div>
                        <div className="col-span-3">
                          {editingPendientesId === patient.id ? (
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={tempPendientes}
                                onChange={(e) => setTempPendientes(e.target.value)}
                                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-w-0 sm:h-auto h-8"
                                rows={2}
                                placeholder="Escribir pendientes..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    saveInlinePendientes(patient.id || '');
                                  }
                                  if (e.key === 'Escape') {
                                    cancelEditingPendientes();
                                  }
                                }}
                              />
                              <div className="flex sm:flex-col flex-row space-y-0 sm:space-y-1 space-x-1 sm:space-x-0">
                                <button
                                  onClick={() => saveInlinePendientes(patient.id || '')}
                                  className="text-blue-700 hover:text-blue-900 p-1"
                                  title="Guardar (Ctrl+Enter)"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={cancelEditingPendientes}
                                  className="text-gray-700 hover:text-gray-900 p-1"
                                  title="Cancelar (Esc)"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="text-xs text-gray-600 truncate cursor-text hover:bg-blue-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingPendientes(patient.id || '', patient.pendientes || '');
                              }}
                              title="Clic para editar pendientes"
                            >
                              {patient.pendientes
                                ? `${patient.pendientes.slice(0, 30)}${patient.pendientes.length > 30 ? '...' : ''}`
                                : 'Sin pendientes'}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 hidden lg:block">
                          {patient.assigned_resident_id ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">
                                {residents.find((r) => r.id === patient.assigned_resident_id)?.full_name || 'Residente'}
                              </span>
                            </div>
                          ) : (
                            <select
                              value=""
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.value) {
                                  assignResidentToPatient(patient.id!, e.target.value);
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-1 py-0.5 text-gray-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Asignar...</option>
                              {residents.map((resident) => (
                                <option key={resident.id} value={resident.id}>
                                  {resident.full_name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      {/* Columna de Acciones - visible en todos los dispositivos */}
                      <div className="flex items-center justify-end space-x-1 sm:space-x-1 min-w-[60px] sm:w-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientSelection(patient);
                          }}
                          className="p-1.5 sm:p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                          title="Editar paciente completo"
                          aria-label="Editar paciente"
                        >
                          <Edit className="h-4 w-4 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!patient.id) return;
                            openDeleteModal(patient.id, patient.nombre, patient.dni);
                          }}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                          title="Eliminar o archivar paciente"
                          aria-label="Eliminar paciente"
                        >
                          <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {patients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay pacientes registrados</p>
              <button
                onClick={createEmptyPatient}
                disabled={isCreatingPatient}
                className="mt-4 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingPatient ? 'Creando...' : 'Agregar el primer paciente'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {sortedPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPatients.map((patient) => {
                const resident = residents.find((r) => r.id === patient.assigned_resident_id);
                const isEditingThis = inlineEditingPatientId === patient.id;
                return (
                  <WardPatientCard
                    key={patient.id}
                    patient={patient}
                    resident={resident}
                    onClick={() => handlePatientSelection(patient)}
                    onEdit={() => startInlineCardEdit(patient)}
                    onDelete={() => {
                      if (!patient.id) return;
                      openDeleteModal(patient.id, patient.nombre, patient.dni);
                    }}
                    isEditing={isEditingThis}
                    editValues={isEditingThis ? inlineEditValues || patient : patient}
                    onEditValuesChange={setInlineEditValues}
                    onSave={saveInlineCardEdit}
                    onCancelEdit={cancelInlineCardEdit}
                    onDragStart={(e) => {
                      setDraggedPatientId(patient.id || null);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverPatientId(patient.id || null);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (!draggedPatientId || draggedPatientId === patient.id) return;

                      const draggedIndex = patients.findIndex((p) => p.id === draggedPatientId);
                      const targetIndex = patients.findIndex((p) => p.id === patient.id);

                      if (draggedIndex === -1 || targetIndex === -1) return;

                      const newPatients = [...patients];
                      const [draggedPatient] = newPatients.splice(draggedIndex, 1);
                      newPatients.splice(targetIndex, 0, draggedPatient);

                      const updatedPatients = newPatients.map((p, index) => ({
                        ...p,
                        display_order: index
                      }));

                      setPatients(updatedPatients);
                      setDraggedPatientId(null);
                      setDragOverPatientId(null);

                      setIsReordering(true);
                      try {
                        const draggedPatientData = updatedPatients.find((p) => p.id === draggedPatientId);
                        if (draggedPatientData && draggedPatientData.id) {
                          await updatePatient(draggedPatientData.id, draggedPatientData);
                        }
                      } catch (error) {
                        console.error('Error updating display order:', error);
                      } finally {
                        setIsReordering(false);
                      }
                    }}
                    isDragging={draggedPatientId === patient.id}
                    isDragOver={dragOverPatientId === patient.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="medical-card p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg mb-4">No hay pacientes registrados en el pase de sala</p>
              <button
                onClick={createEmptyPatient}
                disabled={isCreatingPatient}
                className="btn-accent px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {isCreatingPatient ? 'Creando...' : 'Agregar primer paciente'}
              </button>
            </div>
          )}
        </div>
      )}

      {showCameraModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl w-full rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Capturar foto</h2>
                <p className="text-sm text-gray-600">Vista previa en vivo desde la camara (desktop)</p>
              </div>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-100 text-gray-500"
                onClick={closeCameraModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 bg-[var(--bg-secondary)]">
              {cameraError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {cameraError}
                </div>
              )}

              <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                <video
                  ref={cameraVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {isCameraStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
                    Iniciando camara...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>En moviles usamos el selector nativo con capture=&quot;environment&quot;.</span>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => quickImageInputRef.current?.click()}
                >
                  Preferir archivos
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                  onClick={closeCameraModal}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-sm font-medium"
                  onClick={handleCaptureFromCamera}
                  disabled={isCameraStarting || isCapturingPhoto || uploadingImages}
                >
                  {isCapturingPhoto ? 'Guardando...' : 'Capturar y subir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle con edición inline */}
      {selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="p-3 sm:p-4 border-b bg-white sticky top-0 z-10">
              {/* Header simplificado - Solo lectura */}
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedPatient.nombre || 'Paciente sin nombre'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    DNI: {selectedPatient.dni || 'Sin DNI'} |
                    Cama: {selectedPatient.cama || 'Sin cama'} |
                    {selectedPatient.edad ? `${selectedPatient.edad} años` : 'Edad sin registrar'} |
                    {selectedPatient.fecha || 'Sin fecha'}
                  </p>
                </div>

              {/* Indicador de Auto-save por sección + Botón cerrar */}
              <div className="flex items-center gap-2">
                {Array.from(savingSections).length > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Save className="h-3 w-3 animate-pulse" />
                    Guardando {detailCardConfigs.find(c => c.field === Array.from(savingSections)[0])?.label}...
                  </span>
                )}

                {/* Botón cerrar siempre visible - fixed en móvil */}
                <button
                  type="button"
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors touch-manipulation"
                  onClick={closeSelectedPatientModal}
                  title="Cerrar"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5 sm:h-5 sm:w-5" />
                </button>
              </div>
              </div>

              {/* Segunda fila: metadatos - responsiva */}
              <div className="px-3 sm:px-4 pb-3 border-b bg-white dark:bg-gray-900 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">
                <Users className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{assignedResident ? assignedResident.full_name : 'Sin residente asignado'}</span>
                <span className="sm:hidden">{assignedResident ? assignedResident.full_name.split(' ')[0] : 'Sin residente'}</span>
              </span>
              <span className="badge badge-info text-xs uppercase">
                Sev {selectedPatient.severidad || '-'}
              </span>

              {/* Dropdown de escalas neurológicas */}
              <select
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    openScaleModal(e.target.value);
                    e.target.value = ''; // Reset select
                  }
                }}
                value=""
              >
                <option value="">📊 Escalas</option>
                {PRIORITY_SCALES.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.fullName}
                  </option>
                ))}
              </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-2 bg-[var(--bg-secondary)]">

              {/* DESKTOP: Layout auto-balanceado LG+ (1024px+) */}
              <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_minmax(240px,300px)] gap-3 items-start">

                {/* Contenedor de 2 columnas auto-flow para cards */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-3 auto-rows-max">
                  {detailCardConfigs.map((card) =>
                    renderAccordionCard(card.label, card.field, card.placeholder, { multiline: true })
                  )}
                </div>

                {/* Columna fija de imágenes */}
                <div className="flex flex-col">
                  {renderImagePreviewCard()}
                </div>
              </div>

              {/* TABLET: Grid 2 columnas MD-LG (768px-1023px) */}
              <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-3 auto-rows-max">
                {detailCardConfigs.map((card) =>
                  renderAccordionCard(card.label, card.field, card.placeholder, { multiline: true })
                )}
                <div className="flex justify-end items-start">
                  <div className="w-full max-w-xs">{renderImagePreviewCard()}</div>
                </div>
              </div>

              {/* MOBILE: Formulario vertical compacto - eliminado carrusel horizontal */}
              <div className="md:hidden space-y-3">
                {detailCardConfigs.map((card) => (
                  <div key={card.field}>
                    {renderAccordionCard(card.label, card.field, card.placeholder, { multiline: true })}
                  </div>
                ))}
                {renderImagePreviewCard()}
              </div>

            </div>

          </div>
        </div>
      )}

      {showCSVImportModal && (
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImportComplete={loadPatients}
          hospitalContext="Posadas"
        />
      )}

      {imageLightboxUrl && (
      <div className="modal-overlay" onClick={closeImageLightbox}>
        <div
          className="modal-content w-[80vw] h-[80vh] max-w-5xl bg-black text-white rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs text-white/80 truncate">{imageLightboxUrl}</span>
              <div className="flex items-center space-x-2">
                <a
                  href={imageLightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Abrir</span>
                </a>
                <button
                  type="button"
                  className="p-2 rounded bg-white/10 hover:bg-white/20"
                  onClick={closeImageLightbox}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 bg-black">
              <img
                src={imageLightboxUrl}
                alt="Vista ampliada"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para eliminar/archivar paciente */}
      <DeletePatientModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        patient={selectedPatientForDeletion}
        onConfirmDelete={handleDeleteAction}
        isProcessing={isProcessingDeletion}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de Escalas Neurológicas - renderizado con portal */}
      {selectedScale && ReactDOM.createPortal(
        <ScaleModal
          scale={selectedScale}
          onClose={handleScaleModalClose}
          onSubmit={handleScaleModalSubmit}
        />,
        document.getElementById('modal-root') || document.body
      )}
    </div>
    </LoadingWithRecovery>
  );
};

export default WardRounds;





