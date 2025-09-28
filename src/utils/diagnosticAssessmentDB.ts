// Operaciones de base de datos para evaluaciones diagnósticas
import { supabase } from './supabase';
import { PatientAssessment, SavePatientData, SavedScaleResult } from '../types';
import { ExtractedPatientData, ExtractedScale } from './patientDataExtractor';

// Admin privilege types
export type AdminPrivilegeType =
  | 'hospital_context_access'
  | 'full_admin'
  | 'lumbar_puncture_admin'
  | 'scale_management'
  | 'user_management';

// Interface for admin privileges
interface AdminPrivilege {
  id: string;
  user_email: string;
  privilege_type: AdminPrivilegeType;
  privilege_value: any;
  description?: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

// Interface para pacientes del pase de sala
interface WardRoundPatient {
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
}

/**
 * Guarda una nueva evaluación diagnóstica en Supabase
 * @param patientData - Datos del paciente a guardar
 * @returns Promise con el resultado de la operación
 */
export async function savePatientAssessment(patientData: SavePatientData): Promise<{ success: boolean; data?: PatientAssessment; error?: string }> {
  try {
    console.log('💾 Guardando evaluación diagnóstica:', patientData);

    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .insert([{
        patient_name: patientData.patient_name,
        patient_age: patientData.patient_age,
        patient_dni: patientData.patient_dni,
        clinical_notes: patientData.clinical_notes,
        scale_results: patientData.scale_results,
        hospital_context: patientData.hospital_context || 'Posadas',
        created_by: 'neurologist',
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error guardando evaluación:', error);
      return { 
        success: false, 
        error: `Error al guardar: ${error.message}` 
      };
    }

    console.log('✅ Evaluación guardada exitosamente:', data);
    return { 
      success: true, 
      data: data as PatientAssessment 
    };

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { 
      success: false, 
      error: 'Error inesperado al guardar la evaluación' 
    };
  }
}

/**
 * Convierte datos extraídos a formato para guardar en base de datos
 * @param extractedData - Datos extraídos del texto
 * @param fullNotes - Texto completo de las notas
 * @returns Datos formateados para guardar
 */
export function convertExtractedDataToSaveFormat(
  extractedData: ExtractedPatientData,
  fullNotes: string,
  hospitalContext: 'Posadas' | 'Julian' = 'Posadas'
): SavePatientData {
  const scaleResults: SavedScaleResult[] = extractedData.extractedScales.map((scale: ExtractedScale) => ({
    scale_name: scale.name,
    score: scale.score,
    details: scale.details,
    completed_at: new Date().toISOString()
  }));

  return {
    patient_name: extractedData.name || 'Paciente sin nombre',
    patient_age: extractedData.age || '',
    patient_dni: extractedData.dni || '',
    clinical_notes: fullNotes,
    scale_results: scaleResults,
    hospital_context: hospitalContext
  };
}

/**
 * Obtiene todas las evaluaciones diagnósticas guardadas
 * @param hospitalContext - Contexto del hospital para filtrar (opcional)
 * @returns Promise con las evaluaciones
 */
export async function getPatientAssessments(hospitalContext?: 'Posadas' | 'Julian'): Promise<{ success: boolean; data?: PatientAssessment[]; error?: string }> {
  try {
    let query = supabase
      .from('diagnostic_assessments')
      .select('*');

    // Filtrar por contexto de hospital si se especifica
    if (hospitalContext) {
      query = query.eq('hospital_context', hospitalContext);
    } else {
      // Por defecto, solo mostrar Posadas
      query = query.eq('hospital_context', 'Posadas');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      return { 
        success: false, 
        error: `Error al obtener evaluaciones: ${error.message}` 
      };
    }

    return { 
      success: true, 
      data: data as PatientAssessment[] 
    };

  } catch (error) {
    console.error('❌ Error inesperado obteniendo evaluaciones:', error);
    return { 
      success: false, 
      error: 'Error inesperado al obtener las evaluaciones' 
    };
  }
}

/**
 * Busca evaluaciones por nombre de paciente
 * @param patientName - Nombre del paciente a buscar
 * @returns Promise con las evaluaciones encontradas
 */
export async function searchPatientAssessments(patientName: string): Promise<{ success: boolean; data?: PatientAssessment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .ilike('patient_name', `%${patientName}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error buscando evaluaciones:', error);
      return { 
        success: false, 
        error: `Error en la búsqueda: ${error.message}` 
      };
    }

    return { 
      success: true, 
      data: data as PatientAssessment[] 
    };

  } catch (error) {
    console.error('❌ Error inesperado buscando evaluaciones:', error);
    return { 
      success: false, 
      error: 'Error inesperado en la búsqueda' 
    };
  }
}

/**
 * Elimina una evaluación diagnóstica
 * @param assessmentId - ID de la evaluación a eliminar
 * @returns Promise con el resultado
 */
export async function deletePatientAssessment(assessmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('diagnostic_assessments')
      .delete()
      .eq('id', assessmentId);

    if (error) {
      console.error('❌ Error eliminando evaluación:', error);
      return { 
        success: false, 
        error: `Error al eliminar: ${error.message}` 
      };
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado eliminando evaluación:', error);
    return { 
      success: false, 
      error: 'Error inesperado al eliminar la evaluación' 
    };
  }
}

/**
 * Actualiza una evaluación diagnóstica existente
 * @param assessmentId - ID de la evaluación a actualizar
 * @param updates - Datos a actualizar
 * @returns Promise con el resultado de la operación
 */
export async function updatePatientAssessment(
  assessmentId: string, 
  updates: Partial<SavePatientData>
): Promise<{ success: boolean; data?: PatientAssessment; error?: string }> {
  try {
    console.log('🔄 Actualizando evaluación diagnóstica:', assessmentId, updates);

    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .update({
        ...(updates.patient_name && { patient_name: updates.patient_name }),
        ...(updates.patient_age && { patient_age: updates.patient_age }),
        ...(updates.patient_dni && { patient_dni: updates.patient_dni }),
        ...(updates.clinical_notes && { clinical_notes: updates.clinical_notes }),
        ...(updates.scale_results && { scale_results: updates.scale_results }),
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando evaluación:', error);
      return { 
        success: false, 
        error: `Error al actualizar: ${error.message}` 
      };
    }

    console.log('✅ Evaluación actualizada exitosamente:', data);
    return { 
      success: true, 
      data: data as PatientAssessment 
    };

  } catch (error) {
    console.error('❌ Error inesperado actualizando:', error);
    return { 
      success: false, 
      error: 'Error inesperado al actualizar la evaluación' 
    };
  }
}

/**
 * Valida la conexión con Supabase
 * @returns Promise indicando si la conexión es exitosa
 */
export async function validateSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('diagnostic_assessments')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error de conexión con Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error validando conexión:', error);
    return false;
  }
}

/**
 * Convierte un paciente del pase de sala al formato de evaluación diagnóstica
 * @param wardPatient - Paciente del pase de sala
 * @param hospitalContext - Contexto hospitalario
 * @returns Datos formateados para guardar en diagnostic_assessments
 */
export function convertWardPatientToAssessment(
  wardPatient: WardRoundPatient,
  hospitalContext: 'Posadas' | 'Julian' = 'Posadas'
): SavePatientData {
  // Concatenar toda la información clínica en un texto estructurado
  const clinicalNotes = `INFORMACIÓN DEL PASE DE SALA - ${wardPatient.fecha}

DATOS BÁSICOS:
- Cama: ${wardPatient.cama}
- Edad: ${wardPatient.edad} años
- Severidad: ${wardPatient.severidad}

ANTECEDENTES:
${wardPatient.antecedentes}

MOTIVO DE CONSULTA:
${wardPatient.motivo_consulta}

EXAMEN FÍSICO:
${wardPatient.examen_fisico}

ESTUDIOS:
${wardPatient.estudios}

DIAGNÓSTICO:
${wardPatient.diagnostico}

PLAN DE TRATAMIENTO:
${wardPatient.plan}

PENDIENTES:
${wardPatient.pendientes}

---
Paciente archivado desde Pase de Sala el ${new Date().toLocaleString('es-AR')}`;

  return {
    patient_name: wardPatient.nombre,
    patient_age: wardPatient.edad,
    patient_dni: wardPatient.dni,
    clinical_notes: clinicalNotes,
    scale_results: [], // No hay escalas en el pase de sala
    hospital_context: hospitalContext
  };
}

/**
 * Verifica si ya existe un paciente con el mismo DNI en diagnostic_assessments
 * @param dni - DNI del paciente a verificar
 * @returns Promise con el resultado de la verificación
 */
export async function checkForDuplicatePatient(dni: string): Promise<{ exists: boolean; patient?: PatientAssessment; error?: string }> {
  try {
    if (!dni || dni.trim() === '') {
      return { exists: false };
    }

    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('patient_dni', dni.trim())
      .limit(1);

    if (error) {
      console.error('❌ Error verificando duplicado:', error);
      return {
        exists: false,
        error: `Error al verificar duplicado: ${error.message}`
      };
    }

    if (data && data.length > 0) {
      return {
        exists: true,
        patient: data[0] as PatientAssessment
      };
    }

    return { exists: false };

  } catch (error) {
    console.error('❌ Error inesperado verificando duplicado:', error);
    return {
      exists: false,
      error: 'Error inesperado al verificar duplicado'
    };
  }
}

/**
 * Archiva un paciente del pase de sala en diagnostic_assessments
 * @param wardPatient - Paciente del pase de sala
 * @param hospitalContext - Contexto hospitalario
 * @returns Promise con el resultado de la operación
 */
export async function archiveWardPatient(
  wardPatient: WardRoundPatient,
  hospitalContext: 'Posadas' | 'Julian' = 'Posadas'
): Promise<{ success: boolean; data?: PatientAssessment; error?: string; duplicate?: boolean }> {
  try {
    console.log('📦 Archivando paciente del pase de sala:', wardPatient.nombre);

    // Verificar si ya existe un paciente con el mismo DNI
    const duplicateCheck = await checkForDuplicatePatient(wardPatient.dni);

    if (duplicateCheck.error) {
      return { success: false, error: duplicateCheck.error };
    }

    if (duplicateCheck.exists) {
      return {
        success: false,
        duplicate: true,
        error: `Ya existe un paciente archivado con DNI ${wardPatient.dni}. Nombre: ${duplicateCheck.patient?.patient_name}`
      };
    }

    // Convertir al formato de diagnostic_assessment
    const assessmentData = convertWardPatientToAssessment(wardPatient, hospitalContext);

    // Guardar en diagnostic_assessments
    const result = await savePatientAssessment(assessmentData);

    if (result.success) {
      console.log('✅ Paciente archivado exitosamente');
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ Error inesperado archivando paciente:', error);
    return {
      success: false,
      error: 'Error inesperado al archivar paciente'
    };
  }
}

// ===============================
// ADMIN PRIVILEGE FUNCTIONS
// ===============================

/**
 * Checks if a user has a specific admin privilege
 * @param userEmail - User's email address
 * @param privilegeType - Type of privilege to check
 * @returns Promise with privilege check result
 */
export async function hasAdminPrivilege(
  userEmail: string,
  privilegeType: AdminPrivilegeType
): Promise<{ success: boolean; hasPrivilege: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('has_admin_privilege', {
        user_email_param: userEmail,
        privilege_type_param: privilegeType
      });

    if (error) {
      console.error('❌ Error checking admin privilege:', error);
      return {
        success: false,
        hasPrivilege: false,
        error: `Error checking privilege: ${error.message}`
      };
    }

    return {
      success: true,
      hasPrivilege: data === true
    };
  } catch (error) {
    console.error('❌ Unexpected error checking privilege:', error);
    return {
      success: false,
      hasPrivilege: false,
      error: 'Unexpected error checking privilege'
    };
  }
}

/**
 * Gets all privileges for a user
 * @param userEmail - User's email address
 * @returns Promise with user's privileges
 */
export async function getUserPrivileges(
  userEmail: string
): Promise<{ success: boolean; privileges: AdminPrivilege[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_privileges', {
        user_email_param: userEmail
      });

    if (error) {
      console.error('❌ Error getting user privileges:', error);
      return {
        success: false,
        privileges: [],
        error: `Error getting privileges: ${error.message}`
      };
    }

    return {
      success: true,
      privileges: data || []
    };
  } catch (error) {
    console.error('❌ Unexpected error getting privileges:', error);
    return {
      success: false,
      privileges: [],
      error: 'Unexpected error getting privileges'
    };
  }
}

/**
 * Checks if user has hospital context access privilege
 * @param userEmail - User's email address
 * @returns Promise with hospital context access result
 */
export async function hasHospitalContextAccess(
  userEmail: string
): Promise<{ success: boolean; hasAccess: boolean; error?: string }> {
  // Check for specific hospital context access privilege
  const contextAccess = await hasAdminPrivilege(userEmail, 'hospital_context_access');

  if (!contextAccess.success) {
    return {
      success: false,
      hasAccess: false,
      error: contextAccess.error
    };
  }

  // If user has specific hospital context access, return true
  if (contextAccess.hasPrivilege) {
    return {
      success: true,
      hasAccess: true
    };
  }

  // Also check for full admin access
  const fullAdmin = await hasAdminPrivilege(userEmail, 'full_admin');

  if (!fullAdmin.success) {
    return {
      success: false,
      hasAccess: false,
      error: fullAdmin.error
    };
  }

  return {
    success: true,
    hasAccess: fullAdmin.hasPrivilege
  };
}

/**
 * Enhanced version of getPatientAssessments that considers user privileges
 * @param userEmail - User's email address
 * @param hospitalContext - Hospital context to filter by
 * @param forceContext - Force a specific context regardless of privileges
 * @returns Promise with filtered patient assessments
 */
export async function getPatientAssessmentsWithPrivileges(
  userEmail: string,
  hospitalContext?: 'Posadas' | 'Julian',
  forceContext: boolean = false
): Promise<{ success: boolean; data?: PatientAssessment[]; error?: string; privilegeInfo?: any }> {
  try {
    // Check user's hospital context access
    const accessCheck = await hasHospitalContextAccess(userEmail);

    if (!accessCheck.success) {
      return {
        success: false,
        error: accessCheck.error
      };
    }

    const hasContextAccess = accessCheck.hasAccess;

    // Determine which contexts the user can access
    let allowedContexts: ('Posadas' | 'Julian')[] = ['Posadas']; // Default: everyone can see Posadas

    if (hasContextAccess) {
      allowedContexts = ['Posadas', 'Julian']; // Privileged users can see both
    }

    // If a specific context is requested and user doesn't have access, deny
    if (hospitalContext === 'Julian' && !hasContextAccess && !forceContext) {
      return {
        success: false,
        error: 'Access denied: You do not have permission to view Consultorios Julian patients'
      };
    }

    // If user has access or requesting Posadas, proceed with normal query
    let contextToQuery: 'Posadas' | 'Julian' | undefined = hospitalContext;

    // If no specific context requested, default based on privileges
    if (!contextToQuery) {
      contextToQuery = 'Posadas'; // Default to Posadas
    }

    const result = await getPatientAssessments(contextToQuery);

    if (result.success) {
      return {
        ...result,
        privilegeInfo: {
          hasContextAccess,
          allowedContexts,
          currentContext: contextToQuery
        }
      };
    }

    return result;

  } catch (error) {
    console.error('❌ Error getting patient assessments with privileges:', error);
    return {
      success: false,
      error: 'Unexpected error checking patient access'
    };
  }
}