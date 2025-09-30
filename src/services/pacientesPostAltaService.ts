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