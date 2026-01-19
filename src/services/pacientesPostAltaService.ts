import { supabase } from '../utils/supabase';

// Utility: timeout wrapper to avoid UI hanging on slow/failing requests
async function withTimeout<T>(promise: PromiseLike<T>, ms = 12000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    Promise.resolve(promise)
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e: any) => { clearTimeout(timer); reject(e); });
  });
}

export interface PacientePostAltaRow {
  id?: string;
  dni: string;
  nombre: string;
  diagnostico: string;
  pendiente?: string | null;
  fecha_visita: string; // ISO date or YYYY-MM-DD
  telefono?: string | null;  // NEW: contact phone number
  notas_evolucion?: string | null;  // NEW: evolution notes from ambulatory visits
  hospital_context?: string; // default handled in DB
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listPacientesPostAlta(fechaVisita?: string): Promise<{ data: PacientePostAltaRow[]; error?: string }> {
  try {
    const targetDate = fechaVisita || new Date().toISOString().slice(0, 10);
    console.log('[PacientesPostAltaService] listPacientesPostAlta -> fetching for date:', targetDate);

    const resp1: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .select('*')
      .eq('hospital_context', 'Posadas')
      .eq('fecha_visita', targetDate)
      .order('created_at', { ascending: false })
    );

    const { data, error } = resp1 || {};
    if (error) {
      console.error('[PacientesPostAltaService] listPacientesPostAlta error:', error);
      return { data: [], error: error.message };
    }

    console.log('[PacientesPostAltaService] listPacientesPostAlta -> rows:', (data || []).length);
    return { data: (data || []) as PacientePostAltaRow[] };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] listPacientesPostAlta unexpected error:', e);
    return { data: [], error: e?.message || 'Unknown error' };
  }
}

export async function createPacientePostAlta(payload: PacientePostAltaRow): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PacientesPostAltaService] createPacientePostAlta -> payload:', payload);

    const resp2: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .insert([
        {
          dni: payload.dni,
          nombre: payload.nombre,
          diagnostico: payload.diagnostico,
          pendiente: payload.pendiente || null,
          fecha_visita: payload.fecha_visita,
          telefono: payload.telefono || null,  // NEW
          notas_evolucion: payload.notas_evolucion || null,  // NEW
          hospital_context: 'Posadas'
        }
      ])
    );

    const { error } = resp2 || {};
    if (error) {
      console.error('[PacientesPostAltaService] createPacientePostAlta error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PacientesPostAltaService] createPacientePostAlta -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] createPacientePostAlta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function updatePendiente(id: string, pendiente: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PacientesPostAltaService] updatePendiente -> id:', id);

    const resp3: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .update({ pendiente })
      .eq('id', id)
    );

    const { error } = resp3 || {};
    if (error) {
      console.error('[PacientesPostAltaService] updatePendiente error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PacientesPostAltaService] updatePendiente -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] updatePendiente unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// NEW: List all patients for an entire month (for calendar view)
export async function listPacientesPostAltaMonth(year: number, month: number): Promise<{ data: PacientePostAltaRow[]; error?: string }> {
  try {
    // Calculate first and last day of month
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    console.log('[PacientesPostAltaService] listPacientesPostAltaMonth -> fetching for', year, month, 'range:', firstDay, 'to', lastDay);

    const resp: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .select('*')
      .eq('hospital_context', 'Posadas')
      .gte('fecha_visita', firstDay)
      .lte('fecha_visita', lastDay)
      .order('fecha_visita', { ascending: true })
    );

    const { data, error } = resp || {};
    if (error) {
      console.error('[PacientesPostAltaService] listPacientesPostAltaMonth error:', error);
      return { data: [], error: error.message };
    }

    console.log('[PacientesPostAltaService] listPacientesPostAltaMonth -> rows:', (data || []).length);
    return { data: (data || []) as PacientePostAltaRow[] };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] listPacientesPostAltaMonth unexpected error:', e);
    return { data: [], error: e?.message || 'Unknown error' };
  }
}

// NEW: Delete a patient by ID
export async function deletePacientePostAlta(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PacientesPostAltaService] deletePacientePostAlta -> id:', id);

    const resp: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .delete()
      .eq('id', id)
    );

    const { error } = resp || {};
    if (error) {
      console.error('[PacientesPostAltaService] deletePacientePostAlta error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PacientesPostAltaService] deletePacientePostAlta -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] deletePacientePostAlta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// NEW: Update all fields of a patient (for modal editing)
export async function updatePacientePostAlta(id: string, payload: Partial<PacientePostAltaRow>): Promise<{ success: boolean; data?: PacientePostAltaRow; error?: string }> {
  try {
    console.log('[PacientesPostAltaService] updatePacientePostAlta -> id:', id, 'payload:', payload);

    const resp: any = await withTimeout(
      supabase
      .from('pacientes_post_alta')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    );

    const { data, error } = resp || {};
    if (error) {
      console.error('[PacientesPostAltaService] updatePacientePostAlta error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PacientesPostAltaService] updatePacientePostAlta -> success');
    return { success: true, data: data as PacientePostAltaRow };
  } catch (e: any) {
    console.error('[PacientesPostAltaService] updatePacientePostAlta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}