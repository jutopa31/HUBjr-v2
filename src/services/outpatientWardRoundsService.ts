import { supabase } from '../utils/supabase';

export interface OutpatientPatient {
  id?: string;
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
  fecha_proxima_cita?: string;
  estado_pendiente: 'pendiente' | 'en_proceso' | 'resuelto';
  pendientes: string;
  fecha: string;
  assigned_resident_id?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all outpatient ward round records
 */
export async function fetchOutpatientPatients() {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('outpatient_ward_rounds')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[outpatientWardRoundsService] Error fetching outpatient patients:', error);
    return { data: null, error };
  }
}

/**
 * Add a new outpatient patient record
 */
export async function addOutpatientPatient(
  patient: Omit<OutpatientPatient, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('outpatient_ward_rounds')
        .insert([patient])
        .select()
        .single(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[outpatientWardRoundsService] Error adding outpatient patient:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing outpatient patient record
 */
export async function updateOutpatientPatient(id: string, updates: Partial<OutpatientPatient>) {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('outpatient_ward_rounds')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[outpatientWardRoundsService] Error updating outpatient patient:', error);
    return { data: null, error };
  }
}

/**
 * Delete an outpatient patient record
 */
export async function deleteOutpatientPatient(id: string) {
  try {
    const { error } = await Promise.race([
      supabase
        .from('outpatient_ward_rounds')
        .delete()
        .eq('id', id),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[outpatientWardRoundsService] Error deleting outpatient patient:', error);
    return { error };
  }
}

/**
 * Fetch upcoming appointments (using the view created in SQL)
 */
export async function fetchUpcomingAppointments() {
  try {
    const { data, error } = await Promise.race([
      supabase.from('upcoming_outpatient_appointments').select('*'),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[outpatientWardRoundsService] Error fetching upcoming appointments:', error);
    return { data: null, error };
  }
}
