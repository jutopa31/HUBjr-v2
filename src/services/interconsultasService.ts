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

export interface InterconsultaRow {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string; // ISO date or YYYY-MM-DD
  respuesta?: string | null;
  hospital_context?: string; // default handled in DB
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listInterconsultas(): Promise<{ data: InterconsultaRow[]; error?: string }>{
  try {
    console.log('[InterconsultasService] listInterconsultas -> fetching for hospital_context="Posadas"');
    const resp1: any = await withTimeout(
      supabase
      .from('interconsultas')
      .select('*')
      .eq('hospital_context', 'Posadas')
      .order('created_at', { ascending: false })
    );
    const { data, error } = resp1 || {};
    if (error) {
      console.error('[InterconsultasService] listInterconsultas error:', error);
      return { data: [], error: error.message };
    }
    console.log('[InterconsultasService] listInterconsultas -> rows:', (data || []).length);
    return { data: (data || []) as InterconsultaRow[] };
  } catch (e: any) {
    console.error('[InterconsultasService] listInterconsultas unexpected error:', e);
    return { data: [], error: e?.message || 'Unknown error' };
  }
}

export async function createInterconsulta(payload: InterconsultaRow): Promise<{ success: boolean; error?: string }>{
  try {
    console.log('[InterconsultasService] createInterconsulta -> payload:', payload);
    const resp2: any = await withTimeout(
      supabase
      .from('interconsultas')
      .insert([
        {
          nombre: payload.nombre,
          dni: payload.dni,
          cama: payload.cama,
          fecha_interconsulta: payload.fecha_interconsulta,
          respuesta: payload.respuesta || null,
          hospital_context: 'Posadas'
        }
      ])
    );
    const { error } = resp2 || {};
    if (error) {
      console.error('[InterconsultasService] createInterconsulta error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] createInterconsulta -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[InterconsultasService] createInterconsulta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function updateRespuesta(id: string, respuesta: string): Promise<{ success: boolean; error?: string }>{
  try {
    console.log('[InterconsultasService] updateRespuesta -> id:', id);
    const resp3: any = await withTimeout(
      supabase
      .from('interconsultas')
      .update({ respuesta })
      .eq('id', id)
    );
    const { error } = resp3 || {};
    if (error) {
      console.error('[InterconsultasService] updateRespuesta error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] updateRespuesta -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[InterconsultasService] updateRespuesta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}
