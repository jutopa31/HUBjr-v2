/**
 * Service for Pending Patients (Patients without clear diagnosis)
 * Handles all Supabase interactions with timeout protection
 * Google Keep-style interface for diagnostic tracking
 */

import { supabase } from '../utils/supabase';
import { PendingPatient, CreatePendingPatientInput, UpdatePendingPatientInput } from '../types/pendingPatients';

const QUERY_TIMEOUT = 12000; // 12 seconds timeout protection

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), ms)
  );
}

/**
 * Fetch all pending patients for a given hospital context
 * @param hospitalContext - 'Posadas' or 'Julian'
 * @param includeResolved - Whether to include resolved patients (default: false)
 * @returns Promise with data array or error
 */
export async function fetchPendingPatients(
  hospitalContext: 'Posadas' | 'Julian',
  includeResolved: boolean = false
): Promise<{ data: PendingPatient[] | null; error: any }> {
  try {
    let query = supabase
      .from('pending_patients')
      .select('*')
      .eq('hospital_context', hospitalContext);

    if (!includeResolved) {
      query = query.eq('resolved', false);
    }

    query = query.order('priority', { ascending: true }).order('created_at', { ascending: false });

    const { data, error } = await Promise.race([
      query,
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error fetching pending patients:', error);
      return { data: null, error };
    }

    console.log(`✅ Fetched ${data?.length || 0} pending patients for ${hospitalContext}`);
    return { data: data as PendingPatient[], error: null };
  } catch (error) {
    console.error('🔴 Exception in fetchPendingPatients:', error);
    return { data: null, error };
  }
}

/**
 * Create a new pending patient
 * @param patientData - Patient data to create
 * @param userEmail - Email of the user creating the patient
 * @returns Promise with created patient or error
 */
export async function createPendingPatient(
  patientData: CreatePendingPatientInput,
  userEmail: string
): Promise<{ data: PendingPatient | null; error: any }> {
  try {
    const newPatient = {
      ...patientData,
      color: patientData.color || 'default',
      priority: patientData.priority || 'medium',
      created_by: userEmail,
      resolved: false,
      // Ensure arrays are proper arrays, not undefined
      differential_diagnoses: patientData.differential_diagnoses || [],
      pending_tests: patientData.pending_tests || [],
      tags: patientData.tags || []
    };

    console.log('📤 Creating pending patient with data:', newPatient);

    const { data, error } = await Promise.race([
      supabase.from('pending_patients').insert(newPatient).select().single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error creating pending patient:', error);
      console.error('🔴 Error details:', JSON.stringify(error, null, 2));
      console.error('🔴 Data that failed:', JSON.stringify(newPatient, null, 2));
      return { data: null, error };
    }

    console.log('✅ Created pending patient:', data.id);
    return { data: data as PendingPatient, error: null };
  } catch (error) {
    console.error('🔴 Exception in createPendingPatient:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing pending patient
 * @param patientId - UUID of the patient to update
 * @param updates - Partial patient data to update
 * @returns Promise with updated patient or error
 */
export async function updatePendingPatient(
  patientId: string,
  updates: UpdatePendingPatientInput
): Promise<{ data: PendingPatient | null; error: any }> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('pending_patients')
        .update(updates)
        .eq('id', patientId)
        .select()
        .single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error updating pending patient:', error);
      return { data: null, error };
    }

    console.log('✅ Updated pending patient:', patientId);
    return { data: data as PendingPatient, error: null };
  } catch (error) {
    console.error('🔴 Exception in updatePendingPatient:', error);
    return { data: null, error };
  }
}

/**
 * Delete a pending patient
 * @param patientId - UUID of the patient to delete
 * @returns Promise with success boolean or error
 */
export async function deletePendingPatient(
  patientId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await Promise.race([
      supabase.from('pending_patients').delete().eq('id', patientId),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error deleting pending patient:', error);
      return { success: false, error };
    }

    console.log('✅ Deleted pending patient:', patientId);
    return { success: true, error: null };
  } catch (error) {
    console.error('🔴 Exception in deletePendingPatient:', error);
    return { success: false, error };
  }
}

/**
 * Mark a patient as resolved with final diagnosis
 * @param patientId - UUID of the patient to resolve
 * @param finalDiagnosis - Final diagnosis text
 * @returns Promise with updated patient or error
 */
export async function resolvePendingPatient(
  patientId: string,
  finalDiagnosis: string
): Promise<{ data: PendingPatient | null; error: any }> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('pending_patients')
        .update({
          resolved: true,
          final_diagnosis: finalDiagnosis
          // resolved_at is set automatically by trigger
        })
        .eq('id', patientId)
        .select()
        .single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error resolving pending patient:', error);
      return { data: null, error };
    }

    console.log('✅ Resolved pending patient:', patientId);
    return { data: data as PendingPatient, error: null };
  } catch (error) {
    console.error('🔴 Exception in resolvePendingPatient:', error);
    return { data: null, error };
  }
}

/**
 * Change the color of a patient card (Google Keep style)
 * @param patientId - UUID of the patient
 * @param color - New color
 * @returns Promise with updated patient or error
 */
export async function changePatientColor(
  patientId: string,
  color: string
): Promise<{ data: PendingPatient | null; error: any }> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('pending_patients')
        .update({ color })
        .eq('id', patientId)
        .select()
        .single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error changing patient color:', error);
      return { data: null, error };
    }

    console.log('✅ Changed patient color:', patientId, '→', color);
    return { data: data as PendingPatient, error: null };
  } catch (error) {
    console.error('🔴 Exception in changePatientColor:', error);
    return { data: null, error };
  }
}

/**
 * Search pending patients by text query
 * @param hospitalContext - 'Posadas' or 'Julian'
 * @param searchQuery - Text to search in patient name, chief complaint, and notes
 * @returns Promise with matching patients or error
 */
export async function searchPendingPatients(
  hospitalContext: 'Posadas' | 'Julian',
  searchQuery: string
): Promise<{ data: PendingPatient[] | null; error: any }> {
  try {
    // Use textSearch for full-text search capability
    const { data, error } = await Promise.race([
      supabase
        .from('pending_patients')
        .select('*')
        .eq('hospital_context', hospitalContext)
        .or(`patient_name.ilike.%${searchQuery}%,chief_complaint.ilike.%${searchQuery}%,clinical_notes.ilike.%${searchQuery}%,dni.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false }),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error searching pending patients:', error);
      return { data: null, error };
    }

    console.log(`✅ Found ${data?.length || 0} matching patients`);
    return { data: data as PendingPatient[], error: null };
  } catch (error) {
    console.error('🔴 Exception in searchPendingPatients:', error);
    return { data: null, error };
  }
}

/**
 * Get statistics for pending patients dashboard
 * @param hospitalContext - 'Posadas' or 'Julian'
 * @returns Promise with stats object or error
 */
export async function getPendingPatientsStats(
  hospitalContext: 'Posadas' | 'Julian'
): Promise<{
  data: {
    total: number;
    pending: number;
    resolved: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  error: any;
}> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('pending_patients')
        .select('resolved, priority')
        .eq('hospital_context', hospitalContext),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error fetching pending patients stats:', error);
      return { data: null, error };
    }

    const stats = {
      total: data.length,
      pending: data.filter(p => !p.resolved).length,
      resolved: data.filter(p => p.resolved).length,
      urgent: data.filter(p => p.priority === 'urgent' && !p.resolved).length,
      high: data.filter(p => p.priority === 'high' && !p.resolved).length,
      medium: data.filter(p => p.priority === 'medium' && !p.resolved).length,
      low: data.filter(p => p.priority === 'low' && !p.resolved).length
    };

    console.log('✅ Fetched pending patients stats:', stats);
    return { data: stats, error: null };
  } catch (error) {
    console.error('🔴 Exception in getPendingPatientsStats:', error);
    return { data: null, error };
  }
}
