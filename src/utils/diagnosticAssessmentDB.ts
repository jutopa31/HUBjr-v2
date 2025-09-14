// Operaciones de base de datos para evaluaciones diagnósticas
import { supabase } from './supabase';
import { PatientAssessment, SavePatientData, SavedScaleResult } from '../types';
import { ExtractedPatientData, ExtractedScale } from './patientDataExtractor';

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
  fullNotes: string
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
    scale_results: scaleResults
  };
}

/**
 * Obtiene todas las evaluaciones diagnósticas guardadas
 * @returns Promise con las evaluaciones
 */
export async function getPatientAssessments(): Promise<{ success: boolean; data?: PatientAssessment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .order('created_at', { ascending: false });

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