import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Upload, Edit, Edit2, Save, X, ChevronUp, ChevronDown, ChevronRight, Check, User, Clipboard, Stethoscope, FlaskConical, Target, CheckCircle, Trash2, Users, Image as ImageIcon, ExternalLink, Maximize2, GripVertical, LayoutGrid, Table as TableIcon, Camera } from 'lucide-react';
import { supabase } from './utils/supabase';
import Toast from './components/Toast';
import { readImageFromClipboard, isClipboardSupported } from './services/clipboardService';
import { createOrUpdateTaskFromPatient } from './utils/pendientesSync';
import { archiveWardPatient } from './utils/diagnosticAssessmentDB';
import DeletePatientModal from './components/DeletePatientModal';
import CSVImportModal from './components/wardRounds/CSVImportModal';
import { useAuthContext } from './components/auth/AuthProvider';
import { robustQuery, formatQueryError } from './utils/queryHelpers';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';
import SectionHeader from './components/layout/SectionHeader';
import useEscapeKey from './hooks/useEscapeKey';
import {
  fetchOutpatientPatients,
  addOutpatientPatient,
  deleteOutpatientPatient,
  type OutpatientPatient
} from './services/outpatientWardRoundsService';
import WardPatientCard from './components/wardRounds/WardPatientCard';

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
  assigned_resident_id?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

const NORMAL_EF_TEXT = 'Vigil, OTEP, MOE, PIR, Motor:, Sensitivo:, ROT, Babinski, Hoffman, Sensibilidad, Taxia';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOutpatientModal, setShowOutpatientModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient>(emptyPatient);
  const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);
  const [newOutpatient, setNewOutpatient] = useState<OutpatientPatient>(emptyOutpatient);
  const [loading, setLoading] = useState(true);
  const [outpatientLoading, setOutpatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [inlineDetailValues, setInlineDetailValues] = useState<Partial<Patient>>({});
  const [activeInlineField, setActiveInlineField] = useState<keyof Patient | null>(null);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [isHeaderEditMode, setIsHeaderEditMode] = useState(false);
  const [imageLightboxUrl, setImageLightboxUrl] = useState<string | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{uploaded: number, total: number}>({uploaded: 0, total: 0});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Estados para edición inline de pendientes
  const [editingPendientesId, setEditingPendientesId] = useState<string | null>(null);
  const [tempPendientes, setTempPendientes] = useState<string>('');

  // Estados para validación de DNI duplicado
  const [dniError, setDniError] = useState<string>('');
  const [isDniChecking, setIsDniChecking] = useState(false);
  // Debounce handler para validar DNI sin bucles de "procesando"
  const dniValidationTimeout = React.useRef<number | null>(null);

  // Estado de guardado para evitar dobles envíos y loops de UI
  const [isSavingNewPatient, setIsSavingNewPatient] = useState(false);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);

  // Estados para el modal de eliminar/archivar paciente
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatientForDeletion, setSelectedPatientForDeletion] = useState<{ id: string; nombre: string; dni: string } | null>(null);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);

  // Estados para drag & drop y persistencia de orden
  const [draggedPatientId, setDraggedPatientId] = useState<string | null>(null);
  const [dragOverPatientId, setDragOverPatientId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Estado para vista dual (tabla vs cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  const closeAddForm = () => {
    setShowAddForm(false);
    setNewPatient(emptyPatient);
    setDniError('');
  };

  const closeEditingModal = () => {
    setEditingId(null);
    setEditingPatient(emptyPatient);
    setDniError('');
  };

  const closeSelectedPatientModal = () => {
    setSelectedPatient(null);
    setActiveInlineField(null);
    setIsDetailEditMode(false);
    setIsHeaderEditMode(false);
    setImageLightboxUrl(null);
    closeCameraModal();
  };

  const closeImageLightbox = () => setImageLightboxUrl(null);

  const isAnyModalOpen = showOutpatientModal || showAddForm || showCSVImportModal || showCameraModal || Boolean(editingId) || Boolean(selectedPatient) || Boolean(imageLightboxUrl);

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
    if (editingId) {
      closeEditingModal();
      return;
    }
    if (showAddForm) {
      closeAddForm();
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

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
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
    await Promise.all([loadPatients(), loadResidents()]);
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
        fecha: newOutpatient.fecha || new Date().toISOString().split('T')[0]
      };
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
      setDniError('');
      return true;
    }
    if (!dni.trim()) {
      setDniError('');
      return true;
    }

    setIsDniChecking(true);
    setDniError('');

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
        setDniError(`⚠️ DNI ya existe: ${existingPatient.nombre} (${existingPatient.dni})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating DNI:', error);
      setDniError('Error al validar DNI');
      return false;
    } finally {
      setIsDniChecking(false);
    }
  };

  // Función para ordenar pacientes
  const handleSort = (field: keyof Patient) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Función para alternar la expansión de una fila
  const toggleRowExpansion = (patientId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(patientId)) {
      newExpandedRows.delete(patientId);
    } else {
      newExpandedRows.add(patientId);
    }
    setExpandedRows(newExpandedRows);
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

  // Agregar nuevo paciente
  const addPatient = async () => {
    // Validar DNI antes de agregar
    const isValidDNI = await validateDNI(newPatient.dni);
    if (!isValidDNI) {
      return; // No agregar si hay duplicado
    }

    try {
      setIsSavingNewPatient(true);
      console.log('[WardRounds] addPatient -> payload:', newPatient);

      const payload = {
        ...newPatient,
        display_order: getNextDisplayOrder()
      };

      const { data, error } = await supabase
        .from('ward_round_patients')
        .insert([payload])
        .select();

      if (error) throw error;
      console.log('[WardRounds] addPatient -> inserted:', data);

      setNewPatient(emptyPatient);
      setShowAddForm(false);
      setDniError(''); // Limpiar error al cerrar
      await loadPatients();
    } catch (error) {
      console.error('[WardRounds] Error adding patient:', error);
      alert('Error al agregar paciente');
    } finally {
      setIsSavingNewPatient(false);
    }
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

      setEditingId(null);
      setDniError(''); // Limpiar error al cerrar
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
    setActiveInlineField(null);
    setIsDetailEditMode(false);
    setIsHeaderEditMode(false);
    setImagePreviewError(null);
    setImageUploadError(null);
  };


  const startInlineFieldEdit = (field: keyof Patient) => {
    setActiveInlineField(field);
  };

  const cancelInlineFieldEdit = () => {
    setActiveInlineField(null);
  };

  const saveInlineFieldEdit = async (_field: keyof Patient) => {
    if (!selectedPatient?.id) return;

    const updatedPatient: Patient = { ...selectedPatient, ...(inlineDetailValues as Patient) };
    setIsDetailSaving(true);
    try {
      await updatePatient(selectedPatient.id, updatedPatient);
      setSelectedPatient(updatedPatient);
      setInlineDetailValues(updatedPatient);
      setActiveInlineField(null);
    } catch (error) {
      console.error('Error saving inline field:', error);
    } finally {
      setIsDetailSaving(false);
    }
  };

  const startDetailEditMode = () => {
    if (!selectedPatient) return;
    if (isHeaderEditMode) {
      cancelHeaderEditMode();
    }
    setInlineDetailValues(selectedPatient);
    setActiveInlineField(null);
    setIsDetailEditMode(true);
  };

  const cancelDetailEditMode = () => {
    setInlineDetailValues(selectedPatient || {});
    setActiveInlineField(null);
    setIsDetailEditMode(false);
  };

  const saveAllDetailEdits = async () => {
    if (!selectedPatient?.id) return;

    const updatedPatient: Patient = { ...selectedPatient, ...(inlineDetailValues as Patient) };
    setIsDetailSaving(true);
    try {
      await updatePatient(selectedPatient.id, updatedPatient);
      setSelectedPatient(updatedPatient);
      setInlineDetailValues(updatedPatient);
      setIsDetailEditMode(false);
    } catch (error) {
      console.error('Error saving all detail edits:', error);
    } finally {
      setIsDetailSaving(false);
    }
  };

  const startHeaderEditMode = () => {
    if (!selectedPatient) return;
    if (isDetailEditMode) {
      cancelDetailEditMode();
    }
    setInlineDetailValues(selectedPatient);
    setActiveInlineField(null);
    setIsHeaderEditMode(true);
  };

  const cancelHeaderEditMode = () => {
    setInlineDetailValues(selectedPatient || {});
    setActiveInlineField(null);
    setIsHeaderEditMode(false);
  };

  const saveHeaderEdits = async () => {
    if (!selectedPatient?.id) return;

    const headerUpdates = {
      nombre: inlineDetailValues.nombre || selectedPatient.nombre,
      dni: inlineDetailValues.dni || selectedPatient.dni,
      edad: inlineDetailValues.edad || selectedPatient.edad,
      cama: inlineDetailValues.cama || selectedPatient.cama,
      fecha: inlineDetailValues.fecha || selectedPatient.fecha,
      severidad: inlineDetailValues.severidad || selectedPatient.severidad
    };

    const updatedPatient: Patient = { ...selectedPatient, ...headerUpdates };
    setIsDetailSaving(true);
    try {
      await updatePatient(selectedPatient.id, updatedPatient);
      setSelectedPatient(updatedPatient);
      setInlineDetailValues(updatedPatient);
      setIsHeaderEditMode(false);
    } catch (error) {
      console.error('Error saving header edits:', error);
    } finally {
      setIsDetailSaving(false);
    }
  };

  const renderDetailCard = (
    label: string,
    field: keyof Patient,
    placeholder: string,
    options: { multiline?: boolean } = {}
  ) => {
    const { multiline = false } = options;
    const isActive = activeInlineField === field;
    const isEditing = isDetailEditMode || isActive;
    const value = (inlineDetailValues[field] as string) || '';
    const displayValue = value && value.trim() ? value : placeholder;

    return (
      <div
        className="p-3 rounded-xl border border-[var(--border-primary)] bg-white/90 shadow-sm transition-all duration-200"
        tabIndex={0}
        onKeyDown={(e) => {
          if (isDetailEditMode) return;
          const target = e.target as HTMLElement;
          if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
          if (target.closest && target.closest('button')) return;

          if (e.key === 'Enter') {
            e.preventDefault();
            isActive ? cancelInlineFieldEdit() : startInlineFieldEdit(field);
          }
          if (e.key === 'Escape' && isActive) {
            e.preventDefault();
            cancelInlineFieldEdit();
          }
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
              {label.slice(0, 2).toUpperCase()}
            </span>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h4>
          </div>
          {!isDetailEditMode && (
            <button
              type="button"
              className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                isActive ? cancelInlineFieldEdit() : startInlineFieldEdit(field);
              }}
              title={isActive ? 'Cancelar edicion' : 'Editar seccion'}
            >
              <Edit className="h-4 w-4" />
              <span>{isActive ? 'Cerrar' : 'Editar'}</span>
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            {field === 'examen_fisico' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setInlineDetailValues((prev) => ({
                    ...prev,
                    examen_fisico: (prev.examen_fisico as string) && (prev.examen_fisico as string).trim()
                      ? `${prev.examen_fisico as string}\n${NORMAL_EF_TEXT}`
                      : NORMAL_EF_TEXT
                  }))}
                >
                  EF normal
                </button>
              </div>
            )}
            {multiline ? (
              <textarea
                value={value}
                onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full min-h-[120px] rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
              />
            )}
            {!isDetailEditMode && (
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="btn-soft px-3 py-1.5 text-sm rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelInlineFieldEdit();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-accent px-3 py-1.5 text-sm rounded"
                  disabled={isDetailSaving || isUpdatingPatient}
                  onClick={(e) => {
                    e.stopPropagation();
                    saveInlineFieldEdit(field);
                  }}
                >
                  {isDetailSaving || isUpdatingPatient ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-5">
            {displayValue}
          </p>
        )}
      </div>
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
   * Sube imágenes secuencialmente mostrando progreso
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
      const { uploadImageToStorage } = await import('./services/storageService');
      const results: any[] = [];
      for (let i = 0; i < filesArray.length; i++) {
        const result = await uploadImageToStorage(filesArray[i], patientIdForUpload);
        results.push(result);
        setUploadProgress({uploaded: i + 1, total: filesArray.length});
      }

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
            {!isDetailEditMode && (
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

        {isDetailEditMode ? (
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
                const fullUrl = normalizeUrl(img.full);
                const thumbUrl = normalizeUrl(img.thumbnail) || fullUrl;
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
                          onError={() => {
                            setImagePreviewError(`Error cargando imagen ${idx + 1}`);
                            console.error('[WardRounds] Image preview failed', { thumbUrl, fullUrl, idx });
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
  const handleDeleteAction = async (action: 'delete' | 'archive') => {
    if (!selectedPatientForDeletion) return;

    setIsProcessingDeletion(true);

    try {
      const { id, nombre: patientName } = selectedPatientForDeletion;

      // Enhanced logging for production debugging
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      console.log(`[WardRounds] ${action} action for patient:`, { id, patientName, isProduction });

      if (action === 'archive') {
        console.log('[WardRounds] Starting archive process...');

        // Obtener toda la información del paciente (simplified, no timeout)
        const { data: fullPatientData, error: fetchError } = await supabase
          .from('ward_round_patients')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error(`Error al obtener datos del paciente: ${fetchError.message}`);
        }

        console.log('[WardRounds] Patient data fetched, starting archive...');

        // Intentar archivar el paciente (simplified, will use auto-recovery instead of manual timeout)
        const archiveResult = await archiveWardPatient(fullPatientData, 'Posadas');

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
      let userMessage = `Error al ${action === 'archive' ? 'archivar' : 'eliminar'} paciente`;

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

  // Exportar a PDF estilo tabla Excel compacta
  const exportToPDF = () => {
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
            <td class="text-cell small col-history">${truncateText(patient.antecedentes, 80)}</td>
            <td class="text-cell small col-reason">${truncateText(patient.motivo_consulta, 80)}</td>
            <td class="text-cell small col-exam">${truncateText(patient.examen_fisico, 60)}</td>
            <td class="text-cell small col-studies">${truncateText(patient.estudios, 80)}</td>
            <td class="text-cell small col-diagnosis">${truncateText(patient.diagnostico, 80)}</td>
            <td class="text-cell small col-plan">${truncateText(patient.plan, 80)}</td>
            <td class="text-cell small pending-cell col-pending">${truncateText(patient.pendientes, 60)}</td>
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
              body { -webkit-print-color-adjust: exact; }
              @page { 
                margin: 0.5cm; 
                size: A4 landscape;
              }
            }
            
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 8px;
              font-size: 8px;
              line-height: 1.2;
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
              font-size: 16px;
              margin: 0 0 3px 0;
              font-weight: bold;
            }
            
            .header .info {
              color: #666;
              font-size: 9px;
            }
            
            .summary-bar {
              background: #f8f9fa;
              padding: 6px 12px;
              border-radius: 4px;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
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
              font-size: 7px;
            }
            
            th {
              background: #f9fafb;
              font-weight: bold;
              padding: 4px 2px;
              text-align: center;
              border: 1px solid #d1d5db;
              font-size: 7px;
              color: #374151;
              white-space: nowrap;
            }
            
            td {
              padding: 3px 2px;
              border: 1px solid #e5e7eb;
              vertical-align: top;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            .number-cell {
              width: 25px;
              text-align: center;
              font-weight: bold;
              background: #f9fafb;
            }
            
            .text-cell {
              max-width: 80px;
              word-break: break-word;
            }
            
            .text-cell.bold {
              font-weight: bold;
              color: #1f2937;
            }
            
            .text-cell.small {
              font-size: 6px;
              line-height: 1.3;
            }
            
            .severity-cell {
              width: 35px;
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
            .col-num { width: 3%; }
            .col-bed { width: 4%; }
            .col-name { width: 11%; }
            .col-dni { width: 7%; }
            .col-age { width: 4%; }
            .col-severity { width: 4%; }
            .col-history { width: 13%; }
            .col-reason { width: 13%; }
            .col-exam { width: 11%; }
            .col-studies { width: 13%; }
            .col-diagnosis { width: 13%; }
            .col-plan { width: 13%; }
            .col-pending { width: 11%; }
            
            .footer {
              margin-top: 8px;
              text-align: center;
              color: #6b7280;
              font-size: 7px;
              border-top: 1px solid #e5e7eb;
              padding-top: 4px;
            }
          </style>
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
          
          <div class="footer">
            Pase de Sala Neurología - Hospital Nacional Posadas - Servicio de Neurología
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar un momento para que se cargue el contenido antes de imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
      <div className="h-full flex flex-col p-6 overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
      <SectionHeader
        title={"Pase de Sala - Neurología"}
        subtitle={new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex space-x-3">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center space-x-2 px-3 py-2 rounded btn-soft text-sm"
              title={viewMode === 'table' ? 'Cambiar a vista de tarjetas' : 'Cambiar a vista de tabla'}
            >
              {viewMode === 'table' ? (
                <>
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Vista Cards</span>
                </>
              ) : (
                <>
                  <TableIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Vista Tabla</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowOutpatientModal(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded btn-soft text-sm"
              title="Ambulatorios"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Ambulatorios</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded btn-accent text-sm"
              title="Agregar Paciente"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar Paciente</span>
            </button>
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded btn-soft text-sm"
              title="Importar CSV"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Importar CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 btn-soft px-3 py-2 text-sm rounded"
              title="Exportar PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exportar PDF</span>
            </button>
          </div>
        }
      />
      </div>

      {showOutpatientModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-5xl w-full h-[70vh] flex flex-col">
            <div
              className="p-4 border-b flex items-center justify-between sticky top-0 z-10"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold">Ambulatorios</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Vista compacta en modal</p>
                </div>
              </div>
              <button onClick={closeOutpatientModal} className="p-1 rounded-md btn-soft">
                <X className="h-5 w-5" />
              </button>
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
                  placeholder="Próxima cita (YYYY-MM-DD)"
                  value={newOutpatient.fecha_proxima_cita}
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

            <div className="flex-1 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th className="px-3 py-2 text-left">Paciente</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                    <th className="px-3 py-2 text-left">Pendientes</th>
                    <th className="px-3 py-2 text-left">Próxima cita</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {outpatientLoading && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-[var(--text-secondary)]">
                        Cargando ambulatorios...
                      </td>
                    </tr>
                  )}
                  {!outpatientLoading && outpatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-[var(--text-secondary)]">
                        Sin pacientes ambulatorios cargados
                      </td>
                    </tr>
                  )}
                  {outpatients.map((p) => (
                    <tr key={p.id ?? `${p.dni}-${p.fecha}`} className="border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                      <td className="px-3 py-2 font-semibold">{p.nombre}</td>
                      <td className="px-3 py-2">{p.motivo_consulta || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{p.pendientes || '-'}</td>
                      <td className="px-3 py-2">{p.fecha_proxima_cita || 'Sin definir'}</td>
                      <td className="px-3 py-2 capitalize">{p.estado_pendiente}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => p.id && removeOutpatient(p.id, p.nombre)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para agregar paciente */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <h2 className="text-lg font-semibold">Agregar Nuevo Paciente</h2>
              <button
                onClick={closeAddForm}
                className="p-1 rounded-md btn-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-secondary)]">

              {/* Sección 1: Datos Básicos */}
              <section className="medical-card p-4">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold">Datos del Paciente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Cama</label>
                    <input
                      type="text"
                      value={newPatient.cama}
                      onChange={(e) => setNewPatient({...newPatient, cama: e.target.value})}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none ring-accent"
                      placeholder="EMA CAMILLA 3, UTI 1, 3C7..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>DNI</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newPatient.dni}
                        onChange={(e) => {
                          const dni = e.target.value;
                          setNewPatient({...newPatient, dni});
                          // Validar DNI después de un breve delay
                          // Limpiar timeout previo para evitar múltiples validaciones simultáneas
                          if (dniValidationTimeout.current) {
                            clearTimeout(dniValidationTimeout.current as unknown as number);
                          }
                          if (ENABLE_DNI_CHECK) {
                            if (dni.trim()) {
                              dniValidationTimeout.current = window.setTimeout(() => validateDNI(dni), 500);
                            } else {
                              setDniError('');
                            }
                          } else {
                            // Checker disabled
                            setDniError('');
                          }
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ring-accent`}
                        placeholder="12345678"
                      />
                      {ENABLE_DNI_CHECK && isDniChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {dniError && (
                      <p className="mt-1 text-sm text-gray-800 font-medium">{dniError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      value={newPatient.nombre}
                      onChange={(e) => setNewPatient({...newPatient, nombre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido, Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                    <input
                      type="text"
                      value={newPatient.edad}
                      onChange={(e) => setNewPatient({...newPatient, edad: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="52 años"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      Residente Asignado
                    </label>
                    <select
                      value={newPatient.assigned_resident_id || ''}
                      onChange={(e) => setNewPatient({...newPatient, assigned_resident_id: e.target.value || undefined})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin asignar</option>
                      {residents.map(resident => (
                        <option key={resident.id} value={resident.id}>
                          {resident.full_name} ({resident.role === 'resident' ? 'Residente' :
                           resident.role === 'attending' ? 'Staff' : 'Interno'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Sección 2: Historia Clínica */}
              <section className="medical-card p-4">
                <div className="flex items-center mb-4">
                  <Clipboard className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Historia Clínica</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Antecedentes</label>
                    <textarea
                      value={newPatient.antecedentes}
                      onChange={(e) => setNewPatient({...newPatient, antecedentes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="HTA, DBT, dislipidemia..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Consulta</label>
                    <textarea
                      value={newPatient.motivo_consulta}
                      onChange={(e) => setNewPatient({...newPatient, motivo_consulta: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Cuadro de inicio súbito caracterizado por..."
                    />
                  </div>
                </div>
              </section>

              {/* Sección 3: Examen Físico */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <Stethoscope className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Examen Físico</h3>
                </div>
                <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">EF/NIHSS/ABCD2</label>
                  <button
                    type="button"
                    onClick={() => setNewPatient((prev) => ({
                      ...prev,
                      examen_fisico: prev.examen_fisico && prev.examen_fisico.trim()
                        ? `${prev.examen_fisico}\n${NORMAL_EF_TEXT}`
                        : NORMAL_EF_TEXT
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    EF normal
                  </button>
                  </div>
                  <textarea
                    value={newPatient.examen_fisico}
                    onChange={(e) => setNewPatient({...newPatient, examen_fisico: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Paciente consciente, orientado. NIHSS: 0..."
                  />
                </div>
              </section>

              {/* Sección 4: Estudios */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <FlaskConical className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Estudios Complementarios</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Laboratorio e Imágenes</label>
                  <textarea
                    value={newPatient.estudios}
                    onChange={(e) => setNewPatient({...newPatient, estudios: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="TC sin contraste, laboratorio, ECG..."
                  />
                </div>
              </section>

              {/* Sección 4b: Imágenes y links */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <ImageIcon className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Imágenes / Multimedia</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de miniatura (opcional)</label>
                    <input
                      type="url"
                      value={(newPatient.image_thumbnail_url && newPatient.image_thumbnail_url[0]) || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, image_thumbnail_url: e.target.value ? [e.target.value] : [] })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://.../thumbnail.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de imagen completa</label>
                    <input
                      type="url"
                      value={(newPatient.image_full_url && newPatient.image_full_url[0]) || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, image_full_url: e.target.value ? [e.target.value] : [] })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://.../imagen.jpg"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Usa enlaces directos (Supabase Storage o Google Drive con link de vista) para permitir la previsualización y ampliación.</p>
              </section>

              {/* Sección 5: Diagnóstico y Plan */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Diagnóstico y Tratamiento</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
                    <textarea
                      value={newPatient.diagnostico}
                      onChange={(e) => setNewPatient({...newPatient, diagnostico: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="ACV isquémico en territorio de ACM derecha..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan de Tratamiento</label>
                    <textarea
                      value={newPatient.plan}
                      onChange={(e) => setNewPatient({...newPatient, plan: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Antiagregación, control de factores de riesgo..."
                    />
                  </div>
                </div>
              </section>

              {/* Sección 6: Seguimiento */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Seguimiento</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
                      <select
                        value={newPatient.severidad}
                        onChange={(e) => setNewPatient({...newPatient, severidad: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="I">I - Estable</option>
                        <option value="II">II - Moderado</option>
                        <option value="III">III - Severo</option>
                        <option value="IV">IV - Crítico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                      <input
                        type="date"
                        value={newPatient.fecha}
                        onChange={(e) => setNewPatient({...newPatient, fecha: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pendientes</label>
                    <textarea
                      value={newPatient.pendientes}
                      onChange={(e) => setNewPatient({...newPatient, pendientes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Interconsulta neuropsicología, control en 48hs..."
                    />
                  </div>
                </div>
              </section>

            </div>
            <div className="p-4 border-t bg-white flex justify-end space-x-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatient(emptyPatient);
                  setDniError(''); // Clear DNI error when closing
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={addPatient}
                disabled={!!dniError || (ENABLE_DNI_CHECK && isDniChecking) || isSavingNewPatient}
                className={`px-4 py-2 rounded-lg text-sm ${
                  dniError || (ENABLE_DNI_CHECK && isDniChecking) || isSavingNewPatient
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={dniError ? 'Resuelva el error de DNI para continuar' : ''}
              >
                {isSavingNewPatient ? 'Guardando...' : ((ENABLE_DNI_CHECK && isDniChecking) ? 'Verificando DNI...' : 'Guardar Paciente')}
              </button>
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
                  <div className="hidden sm:flex items-center justify-end w-20 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de pacientes */}
            {sortedPatients.map((patient) => {
              const isExpanded = expandedRows.has(patient.id || '');
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
                  } ${isExpanded ? 'shadow-md mb-6' : 'hover:bg-gray-50'} ${isDragTarget ? 'ring-2 ring-blue-200 ring-inset' : ''}`}
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
                      {/* Icono de expansión */}
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(patient.id || '');
                          }}
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          <ChevronRight
                            className={`expand-icon h-4 w-4 text-gray-500 ${isExpanded ? 'expanded' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Información principal */}
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
                      {/* Columna de Acciones - fuera del grid para alinearse con el header */}
                      <div className="hidden sm:flex items-center justify-end space-x-1 w-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!patient.id) return;
                            setEditingId(patient.id);
                            setEditingPatient(patient);
                          }}
                          className="p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar paciente completo"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!patient.id) return;
                            openDeleteModal(patient.id, patient.nombre, patient.dni);
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar o archivar paciente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandible */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded ? 'max-h-screen opacity-100 mb-4' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-4 border-t border-gray-200 bg-gray-50 medical-details">
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Antecedentes</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.antecedentes || 'No especificado'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Motivo de Consulta</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.motivo_consulta || 'No especificado'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">EF/NIHSS/ABCD2</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.examen_fisico || 'No especificado'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Estudios Complementarios</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.estudios || 'No especificado'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Diagnóstico</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.diagnostico || 'No especificado'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Plan</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.plan || 'No especificado'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Pendientes</h4>
                            <p className="text-gray-600 bg-white p-3 rounded border break-words overflow-wrap">
                              {patient.pendientes || 'Sin pendientes'}
                            </p>
                          </div>
                        </div>
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
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Agregar el primer paciente
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
                return (
                  <WardPatientCard
                    key={patient.id}
                    patient={patient}
                    resident={resident}
                    onClick={() => setSelectedPatient(patient)}
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
                onClick={() => setShowAddForm(true)}
                className="btn-accent px-4 py-2 rounded inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar primer paciente
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

      {/* Modal de detalle con ediciA3n inline */}
      {selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex-1">
                {isHeaderEditMode ? (
                  // HEADER EDIT MODE: Grid de 5 campos editables
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <input
                      type="text"
                      value={(inlineDetailValues.nombre as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, nombre: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del paciente"
                    />
                    <input
                      type="text"
                      value={(inlineDetailValues.dni as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, dni: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DNI"
                    />
                    <input
                      type="text"
                      value={(inlineDetailValues.edad as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, edad: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Edad"
                    />
                    <input
                      type="text"
                      value={(inlineDetailValues.cama as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, cama: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cama / ubicación"
                    />
                    <input
                      type="date"
                      value={(inlineDetailValues.fecha as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, fecha: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fecha"
                    />
                    <select
                      value={(inlineDetailValues.severidad as string) || ''}
                      onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, severidad: e.target.value }))}
                      className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Severidad</option>
                      <option value="I">I - Estable</option>
                      <option value="II">II - Moderado</option>
                      <option value="III">III - Severo</option>
                      <option value="IV">IV - Crítico</option>
                    </select>
                  </div>
                ) : isDetailEditMode ? (
                  // FULL EDIT MODE: Layout original con 3 campos
                  <>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedPatient.nombre || 'Paciente sin nombre'}
                    </h2>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                      <input
                        type="text"
                        value={(inlineDetailValues.cama as string) || ''}
                        onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, cama: e.target.value }))}
                        className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Cama / ubicacion"
                      />
                      <input
                        type="text"
                        value={(inlineDetailValues.edad as string) || ''}
                        onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, edad: e.target.value }))}
                        className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Edad"
                      />
                      <input
                        type="date"
                        value={(inlineDetailValues.fecha as string) || ''}
                        onChange={(e) => setInlineDetailValues((prev) => ({ ...prev, fecha: e.target.value }))}
                        className="rounded-lg border border-[var(--border-primary)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Fecha"
                      />
                    </div>
                  </>
                ) : (
                  // READ-ONLY MODE: Vista normal con botón Edit2
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{selectedPatient.nombre || 'Paciente sin nombre'}</span>
                      <span className="text-xs text-gray-500 font-normal">DNI {selectedPatient.dni || 'Sin DNI'}</span>
                      <button
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={startHeaderEditMode}
                        title="Editar datos básicos"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </h2>
                    <p className="text-sm text-gray-600">
                      Cama {selectedPatient.cama || 'Sin cama'} | {selectedPatient.edad ? `${selectedPatient.edad} anos` : 'Edad sin registrar'} | {selectedPatient.fecha || 'Sin fecha'}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="badge badge-info text-xs uppercase">
                  Sev {selectedPatient.severidad || '-'}
                </span>
                <button
                  type="button"
                  className="btn-soft px-3 py-2 text-sm rounded"
                  onClick={() => (isDetailEditMode ? cancelDetailEditMode() : startDetailEditMode())}
                >
                  {isDetailEditMode ? 'Cerrar edicion' : 'Editar'}
                </button>
                <button
                  type="button"
                  className="p-2 rounded hover:bg-gray-100 text-gray-500"
                  onClick={closeSelectedPatientModal}
                  title="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] gap-4 items-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderDetailCard('Antecedentes', 'antecedentes', 'Sin antecedentes', { multiline: true })}
                  {renderDetailCard('Motivo de Consulta', 'motivo_consulta', 'Sin motivo', { multiline: true })}
                  {renderDetailCard('EF/NIHSS/ABCD2', 'examen_fisico', 'Sin examen', { multiline: true })}
                  {renderDetailCard('Estudios Complementarios', 'estudios', 'Sin estudios', { multiline: true })}
                  {renderDetailCard('Diagnostico', 'diagnostico', 'Sin diagnostico', { multiline: true })}
                  {renderDetailCard('Plan', 'plan', 'Sin plan', { multiline: true })}
                  {renderDetailCard('Pendientes', 'pendientes', 'Sin pendientes', { multiline: true })}
                </div>
                <div className="flex justify-end items-start">
                  <div className="w-full max-w-xs lg:max-w-sm">{renderImagePreviewCard()}</div>
                </div>
              </div>
            </div>

            {(isDetailEditMode || isHeaderEditMode) && (
              <div className="p-3 border-t bg-white flex items-center justify-between sticky bottom-0">
                <div className="text-xs text-gray-500">
                  {isHeaderEditMode ? 'Editando datos básicos' : 'Editando todas las secciones'}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                    onClick={isHeaderEditMode ? cancelHeaderEditMode : cancelDetailEditMode}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    disabled={isDetailSaving || isUpdatingPatient}
                    onClick={isHeaderEditMode ? saveHeaderEdits : saveAllDetailEdits}
                  >
                    {isDetailSaving || isUpdatingPatient ? 'Guardando...' : (isHeaderEditMode ? 'Guardar cambios' : 'Guardar todo')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de Edición Modal */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl w-full h-[80vh] flex flex-col rounded-2xl shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Editar Paciente</h2>
              <button
                onClick={closeEditingModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-secondary)]">

              {/* Sección 1: Datos Básicos */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Datos del Paciente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cama</label>
                    <input
                      type="text"
                      value={editingPatient.cama}
                      onChange={(e) => setEditingPatient({...editingPatient, cama: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="EMA CAMILLA 3, UTI 1, 3C7..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">DNI</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingPatient.dni}
                        onChange={(e) => {
                          const dni = e.target.value;
                          setEditingPatient({...editingPatient, dni});
                          // Validar DNI después de un breve delay, excluyendo el paciente actual
                          if (dni.trim()) {
                            setTimeout(() => validateDNI(dni, editingId || undefined), 500);
                          } else {
                            setDniError('');
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          dniError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="12345678"
                      />
                      {isDniChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {dniError && (
                      <p className="mt-1 text-sm text-gray-800 font-medium">{dniError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      value={editingPatient.nombre}
                      onChange={(e) => setEditingPatient({...editingPatient, nombre: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido, Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                    <input
                      type="text"
                      value={editingPatient.edad}
                      onChange={(e) => setEditingPatient({...editingPatient, edad: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="52 años"
                    />
                  </div>
                </div>
              </section>

              {/* Sección 2: Historia Clínica */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <Clipboard className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Historia Clínica</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Antecedentes</label>
                    <textarea
                      value={editingPatient.antecedentes}
                      onChange={(e) => setEditingPatient({...editingPatient, antecedentes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="HTA, DBT, dislipidemia..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Consulta</label>
                    <textarea
                      value={editingPatient.motivo_consulta}
                      onChange={(e) => setEditingPatient({...editingPatient, motivo_consulta: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Cuadro de inicio súbito caracterizado por..."
                    />
                  </div>
                </div>
              </section>

              {/* Sección 3: Examen Físico */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <Stethoscope className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Examen Físico</h3>
                </div>
                <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">EF/NIHSS/ABCD2</label>
                  <button
                    type="button"
                    onClick={() => setEditingPatient((prev) => ({
                      ...prev,
                      examen_fisico: prev.examen_fisico && prev.examen_fisico.trim()
                        ? `${prev.examen_fisico}\n${NORMAL_EF_TEXT}`
                        : NORMAL_EF_TEXT
                    }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    EF normal
                  </button>
                  </div>
                  <textarea
                    value={editingPatient.examen_fisico}
                    onChange={(e) => setEditingPatient({...editingPatient, examen_fisico: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Paciente consciente, orientado. NIHSS: 0..."
                  />
                </div>
              </section>

              {/* Sección 4: Estudios */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <FlaskConical className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Estudios Complementarios</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Laboratorio e Imágenes</label>
                  <textarea
                    value={editingPatient.estudios}
                    onChange={(e) => setEditingPatient({...editingPatient, estudios: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="TC sin contraste, laboratorio, ECG..."
                  />
                </div>
              </section>

              {/* Sección 4b: Imágenes y links */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <ImageIcon className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Imágenes / Multimedia</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de miniatura (opcional)</label>
                    <input
                      type="url"
                      value={(editingPatient.image_thumbnail_url && editingPatient.image_thumbnail_url[0]) || ''}
                      onChange={(e) => setEditingPatient({ ...editingPatient, image_thumbnail_url: e.target.value ? [e.target.value] : [] })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://.../thumbnail.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de imagen completa</label>
                    <input
                      type="url"
                      value={(editingPatient.image_full_url && editingPatient.image_full_url[0]) || ''}
                      onChange={(e) => setEditingPatient({ ...editingPatient, image_full_url: e.target.value ? [e.target.value] : [] })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://.../imagen.jpg"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Enlaces directos permiten previsualizar y abrir la imagen ampliada desde el modal.</p>
              </section>

              {/* Sección 5: Diagnóstico y Plan */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Diagnóstico y Tratamiento</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
                    <textarea
                      value={editingPatient.diagnostico}
                      onChange={(e) => setEditingPatient({...editingPatient, diagnostico: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="ACV isquémico en territorio de ACM derecha..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan de Tratamiento</label>
                    <textarea
                      value={editingPatient.plan}
                      onChange={(e) => setEditingPatient({...editingPatient, plan: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Antiagregación, control de factores de riesgo..."
                    />
                  </div>
                </div>
              </section>

              {/* Sección 6: Seguimiento */}
              <section className="rounded-xl border border-[var(--border-primary)] bg-white/90 p-3 shadow-sm">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Seguimiento</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
                      <select
                        value={editingPatient.severidad}
                        onChange={(e) => setEditingPatient({...editingPatient, severidad: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="I">I - Estable</option>
                        <option value="II">II - Moderado</option>
                        <option value="III">III - Severo</option>
                        <option value="IV">IV - Crítico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                      <input
                        type="date"
                        value={editingPatient.fecha}
                        onChange={(e) => setEditingPatient({...editingPatient, fecha: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pendientes</label>
                    <textarea
                      value={editingPatient.pendientes}
                      onChange={(e) => setEditingPatient({...editingPatient, pendientes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Interconsulta neuropsicología, control en 48hs..."
                    />
                  </div>
                </div>
              </section>

            </div>
            <div className="p-4 border-t bg-white flex justify-end space-x-3 sticky bottom-0">
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingPatient(emptyPatient);
                  setDniError(''); // Clear DNI error when closing
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingId) {
                    updatePatient(editingId, editingPatient);
                  }
                }}
                disabled={!!dniError || isDniChecking || isUpdatingPatient}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-sm ${
                  dniError || isDniChecking || isUpdatingPatient
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={dniError ? 'Resuelva el error de DNI para continuar' : isUpdatingPatient ? 'Guardando...' : ''}
              >
                <Save className="h-4 w-4" />
                <span>{isDniChecking ? 'Verificando DNI...' : isUpdatingPatient ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
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
    </div>
    </LoadingWithRecovery>
  );
};

export default WardRounds;
