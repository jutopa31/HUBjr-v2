import { supabase } from '../utils/supabase';

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
    const { data, error } = await supabase
      .from('interconsultas')
      .select('*')
      .eq('hospital_context', 'Posadas')
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: (data || []) as InterconsultaRow[] };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Unknown error' };
  }
}

export async function createInterconsulta(payload: InterconsultaRow): Promise<{ success: boolean; error?: string }>{
  try {
    const { error } = await supabase
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
      ]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function updateRespuesta(id: string, respuesta: string): Promise<{ success: boolean; error?: string }>{
  try {
    const { error } = await supabase
      .from('interconsultas')
      .update({ respuesta })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

