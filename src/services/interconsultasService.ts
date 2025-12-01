import { supabase } from '../utils/supabase';
import { robustQuery } from '../utils/queryHelpers';

export interface InterconsultaRow {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string; // ISO date or YYYY-MM-DD
  relato_consulta?: string | null;
  respuesta?: string | null;
  hospital_context?: string; // default handled in DB
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listInterconsultas(): Promise<{ data: InterconsultaRow[]; error?: string }>{
  try {
    console.log('[InterconsultasService] listInterconsultas -> fetching for hospital_context="Posadas"');
    const result: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .select('*')
        .eq('hospital_context', 'Posadas')
        .order('created_at', { ascending: false }),
      {
        timeout: 8000,
        retries: 2,
        operationName: 'listInterconsultas'
      }
    );

    const { data, error } = result || {};
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

export async function createInterconsulta(payload: InterconsultaRow): Promise<{ success: boolean; data?: InterconsultaRow; error?: string }>{
  try {
    console.log('[InterconsultasService] createInterconsulta -> payload:', payload);
    const resp2: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .insert([
          {
            nombre: payload.nombre,
            dni: payload.dni,
            cama: payload.cama,
            fecha_interconsulta: payload.fecha_interconsulta,
            relato_consulta: payload.relato_consulta || null,
            respuesta: payload.respuesta || null,
            hospital_context: 'Posadas'
          }
        ])
        .select()
        .single(),
      { timeout: 15000, retries: 2, operationName: 'createInterconsulta' }
    );
    const { error, data } = resp2 || {};
    if (error) {
      console.error('[InterconsultasService] createInterconsulta error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] createInterconsulta -> success');
    return { success: true, data: data as InterconsultaRow };
  } catch (e: any) {
    console.error('[InterconsultasService] createInterconsulta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function updateRespuesta(id: string, respuesta: string): Promise<{ success: boolean; data?: InterconsultaRow; error?: string }>{
  try {
    console.log('[InterconsultasService] updateRespuesta -> id:', id);
    const resp3: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update({ respuesta })
        .eq('id', id)
        .select()
        .single(),
      { timeout: 8000, retries: 2, operationName: 'updateRespuesta' }
    );
    const { error, data } = resp3 || {};
    if (error) {
      console.error('[InterconsultasService] updateRespuesta error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] updateRespuesta -> success');
    return { success: true, data: data as InterconsultaRow };
  } catch (e: any) {
    console.error('[InterconsultasService] updateRespuesta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}
