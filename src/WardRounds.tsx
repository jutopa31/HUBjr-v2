import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, ChevronUp, ChevronDown, ChevronRight, Check, User, Clipboard, Stethoscope, FlaskConical, Target, CheckCircle, Trash2, Users } from 'lucide-react';
import { supabase } from './utils/supabase';
import { createOrUpdateTaskFromPatient } from './utils/pendientesSync';
import { archiveWardPatient } from './utils/diagnosticAssessmentDB';
import DeletePatientModal from './components/DeletePatientModal';
import { useAuthContext } from './components/auth/AuthProvider';
import { robustQuery, formatQueryError } from './utils/queryHelpers';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';

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
  assigned_resident_id?: string;
}

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
    fecha: new Date().toISOString().split('T')[0],
    assigned_resident_id: undefined
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient>(emptyPatient);
  const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);
  const [loading, setLoading] = useState(true);

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
      setPatients(data || []);
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

  // Ordenar pacientes basado en el estado actual
  const sortedPatients = React.useMemo(() => {
    if (!sortField) return patients;

    return [...patients].sort((a, b) => {
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
  }, [patients, sortField, sortDirection]);

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
      const { data, error } = await supabase
        .from('ward_round_patients')
        .insert([newPatient])
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
        .update(updatedPatient)
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
            <td class="number-cell">${index + 1}</td>
            <td class="text-cell bold">${patient.cama || '-'}</td>
            <td class="text-cell bold">${patient.nombre || '-'}</td>
            <td class="text-cell">${patient.dni || '-'}</td>
            <td class="text-cell">${patient.edad || '-'}</td>
            <td class="severity-cell" style="background-color: ${severityColor}20; border-left: 3px solid ${severityColor};">
              <strong style="color: ${severityColor};">${patient.severidad || '-'}</strong>
            </td>
            <td class="text-cell small">${truncateText(patient.antecedentes, 80)}</td>
            <td class="text-cell small">${truncateText(patient.motivo_consulta, 80)}</td>
            <td class="text-cell small">${truncateText(patient.examen_fisico, 60)}</td>
            <td class="text-cell small">${truncateText(patient.estudios, 80)}</td>
            <td class="text-cell small">${truncateText(patient.diagnostico, 80)}</td>
            <td class="text-cell small">${truncateText(patient.plan, 80)}</td>
            <td class="text-cell small pending-cell">${truncateText(patient.pendientes, 60)}</td>
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
            .col-name { width: 10%; }
            .col-dni { width: 7%; }
            .col-age { width: 5%; }
            .col-bed { width: 8%; }
            .col-severity { width: 5%; }
            .col-history { width: 12%; }
            .col-reason { width: 12%; }
            .col-exam { width: 10%; }
            .col-studies { width: 12%; }
            .col-diagnosis { width: 12%; }
            .col-plan { width: 12%; }
            .col-pending { width: 10%; }
            
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
      <div className="mb-6 flex items-center justify-between banner rounded-lg p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pase de Sala - Neurología</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 btn-success px-4 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Paciente</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 btn-soft px-4 py-2 rounded-lg"
          >
            <Download className="h-4 w-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Formulario para agregar paciente */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <h2 className="text-lg font-semibold">Agregar Nuevo Paciente</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatient(emptyPatient);
                  setDniError(''); // Clear DNI error when closing
                }}
                className="p-1 rounded-md btn-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* Sección 1: Datos Básicos */}
              <section className="medical-card p-4">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-accent mr-2" />
                  <h3 className="text-sm font-semibold">Datos del Paciente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="mt-1 text-sm text-red-600 font-medium">{dniError}</p>
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
                  <Clipboard className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Historia Clínica</h3>
                </div>
                <div className="space-y-4">
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Stethoscope className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Examen Físico</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">EF/NIHSS/ABCD2</label>
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <FlaskConical className="h-5 w-5 text-orange-600 mr-2" />
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

              {/* Sección 5: Diagnóstico y Plan */}
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Diagnóstico y Tratamiento</h3>
                </div>
                <div className="space-y-4">
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Seguimiento</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Lista de pacientes compacta y expandible */}
      <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div id="ward-round-table" className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-200">
            {/* Header para ordenamiento */}
            <div className="bg-gray-50 px-6 py-1.5 border-b border-gray-200 sticky top-0 z-10">
              <div className="grid grid-cols-12 gap-2 items-center px-6">
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('cama')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-start py-1"
                  >
                    <span>Ubicación</span>
                    {sortField === 'cama' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
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
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2 hidden lg:block">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Users className="h-3 w-3 inline mr-1" />
                    <span>Residente</span>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <button
                    onClick={() => handleSort('diagnostico')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 justify-start py-1"
                  >
                    <span>Diagnóstico</span>
                    {sortField === 'diagnostico' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
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
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('pendientes')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800 justify-start py-1"
                  >
                    <span>Pendientes</span>
                    {sortField === 'pendientes' && (
                      sortDirection === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-1">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    <span>Acciones</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de pacientes */}
            {sortedPatients.map((patient) => {
              const isExpanded = expandedRows.has(patient.id || '');
              return (
                <div key={patient.id} className={`expandable-row mb-2 ${
                  patient.severidad === 'I' ? 'bg-green-50 border-l-4 border-l-green-400' :
                  patient.severidad === 'II' ? 'bg-yellow-50 border-l-4 border-l-yellow-400' :
                  patient.severidad === 'III' ? 'bg-orange-50 border-l-4 border-l-orange-400' :
                  patient.severidad === 'IV' ? 'bg-red-50 border-l-4 border-l-red-400' : 'bg-white border-l-4 border-l-gray-300'
                } ${isExpanded ? 'shadow-md mb-6' : 'hover:bg-gray-50'}`}>
                  
                  {/* Fila principal compacta */}
                  <div 
                    className="px-6 py-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(patient.id || '')}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icono de expansión */}
                      <div className="flex-shrink-0">
                        <ChevronRight 
                          className={`expand-icon h-4 w-4 text-gray-400 ${
                            isExpanded ? 'expanded' : ''
                          }`}
                        />
                      </div>
                      
                      {/* Información principal */}
                      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-gray-900">{patient.cama}</div>
                          <div className="text-xs text-gray-500">{patient.edad} años</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-gray-900">{patient.nombre}</div>
                          <div className="text-xs text-gray-500">
                            <span>DNI: {patient.dni}</span>
                            <span className="sm:hidden"> • {patient.edad} años</span>
                          </div>
                        </div>
                        <div className="col-span-2 hidden lg:block">
                          {patient.assigned_resident_id ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">
                                {residents.find(r => r.id === patient.assigned_resident_id)?.full_name || 'Residente'}
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
                              {residents.map(resident => (
                                <option key={resident.id} value={resident.id}>
                                  {resident.full_name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="col-span-2 hidden md:block">
                          <div className="text-xs text-gray-600 truncate">
                            {patient.diagnostico ? patient.diagnostico.slice(0, 25) + '...' : 'Sin diagnóstico'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <span className={`severity-indicator inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            patient.severidad === 'I' ? 'bg-green-100 text-green-800' :
                            patient.severidad === 'II' ? 'bg-yellow-100 text-yellow-800' :
                            patient.severidad === 'III' ? 'bg-orange-100 text-orange-800' :
                            patient.severidad === 'IV' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.severidad}
                          </span>
                        </div>
                        <div className="col-span-2">
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
                                  className="text-green-600 hover:text-green-800 p-1"
                                  title="Guardar (Ctrl+Enter)"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={cancelEditingPendientes}
                                  className="text-red-600 hover:text-red-800 p-1"
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
                              {patient.pendientes ? patient.pendientes.slice(0, 30) + (patient.pendientes.length > 30 ? '...' : '') : 'Sin pendientes'}
                            </div>
                          )}
                        </div>
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(patient.id || null);
                                setEditingPatient(patient);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar paciente completo"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(patient.id || '', patient.nombre, patient.dni);
                              }}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar o archivar paciente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandible */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-screen opacity-100 mb-4' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-6 pb-6 pt-4 border-t border-gray-200 bg-gray-50 medical-details">
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        
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
        </div>

      {/* Formulario de Edición Modal */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">Editar Paciente</h2>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingPatient(emptyPatient);
                  setDniError(''); // Clear DNI error when closing
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* Sección 1: Datos Básicos */}
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Datos del Paciente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="mt-1 text-sm text-red-600 font-medium">{dniError}</p>
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Clipboard className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Historia Clínica</h3>
                </div>
                <div className="space-y-4">
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Stethoscope className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Examen Físico</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">EF/NIHSS/ABCD2</label>
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <FlaskConical className="h-5 w-5 text-orange-600 mr-2" />
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

              {/* Sección 5: Diagnóstico y Plan */}
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Diagnóstico y Tratamiento</h3>
                </div>
                <div className="space-y-4">
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
              <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Seguimiento</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Modal para eliminar/archivar paciente */}
      <DeletePatientModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        patient={selectedPatientForDeletion}
        onConfirmDelete={handleDeleteAction}
        isProcessing={isProcessingDeletion}
      />
      </div>
    </LoadingWithRecovery>
  );
};

export default WardRounds;
