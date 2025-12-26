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
  status: 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada';
  hospital_context?: string; // default handled in DB
  user_id?: string;
  created_at?: string;
  updated_at?: string;

  // Nuevos campos de imágenes (workflow integration)
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: string[];
  estudios_ocr?: string;
  edad?: string; // Agregado para template de evolucionador
}

export interface InterconsultaFilters {
  status?: string[];
  searchText?: string;
  dateFrom?: string;
  dateTo?: string;
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
            edad: payload.edad || null,
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

export async function updateStatus(id: string, status: string): Promise<{ success: boolean; data?: InterconsultaRow; error?: string }>{
  try {
    console.log('[InterconsultasService] updateStatus -> id:', id, 'status:', status);
    const resp: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update({ status })
        .eq('id', id)
        .select()
        .single(),
      { timeout: 8000, retries: 2, operationName: 'updateStatus' }
    );
    const { error, data } = resp || {};
    if (error) {
      console.error('[InterconsultasService] updateStatus error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] updateStatus -> success');
    return { success: true, data: data as InterconsultaRow };
  } catch (e: any) {
    console.error('[InterconsultasService] updateStatus unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function updateRespuestaWithStatus(id: string, respuesta: string, currentStatus: string): Promise<{ success: boolean; data?: InterconsultaRow; error?: string }>{
  try {
    console.log('[InterconsultasService] updateRespuestaWithStatus -> id:', id, 'currentStatus:', currentStatus);

    // Auto-status logic: If currentStatus is 'Pendiente' and respuesta is not empty, set status to 'En Proceso'
    const updatePayload: any = { respuesta };
    if (currentStatus === 'Pendiente' && respuesta.trim() !== '') {
      updatePayload.status = 'En Proceso';
      console.log('[InterconsultasService] Auto-updating status to "En Proceso"');
    }

    const resp: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single(),
      { timeout: 8000, retries: 2, operationName: 'updateRespuestaWithStatus' }
    );
    const { error, data } = resp || {};
    if (error) {
      console.error('[InterconsultasService] updateRespuestaWithStatus error:', error);
      return { success: false, error: error.message };
    }
    console.log('[InterconsultasService] updateRespuestaWithStatus -> success');
    return { success: true, data: data as InterconsultaRow };
  } catch (e: any) {
    console.error('[InterconsultasService] updateRespuestaWithStatus unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

/**
 * Borra una interconsulta permanentemente (hard delete)
 */
export async function deleteInterconsulta(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[InterconsultasService] deleteInterconsulta -> id:', id);
    const { error } = await supabase
      .from('interconsultas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[InterconsultasService] deleteInterconsulta error:', error);
      return { success: false, error: error.message };
    }

    console.log('[InterconsultasService] deleteInterconsulta -> success');
    return { success: true };
  } catch (e: any) {
    console.error('[InterconsultasService] deleteInterconsulta unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

/**
 * Borra múltiples interconsultas permanentemente (hard delete)
 */
export async function deleteMultipleInterconsultas(ids: string[]): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    console.log('[InterconsultasService] deleteMultipleInterconsultas -> ids:', ids);
    const { error, count } = await supabase
      .from('interconsultas')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) {
      console.error('[InterconsultasService] deleteMultipleInterconsultas error:', error);
      return { success: false, error: error.message };
    }

    console.log('[InterconsultasService] deleteMultipleInterconsultas -> deleted count:', count);
    return { success: true, deletedCount: count || 0 };
  } catch (e: any) {
    console.error('[InterconsultasService] deleteMultipleInterconsultas unexpected error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// ============================================================================
// NUEVAS FUNCIONES PARA WORKFLOW INTEGRATION
// ============================================================================

/**
 * Sube una imagen a una interconsulta y actualiza sus arrays de URLs
 * @param interconsultaId - ID de la interconsulta
 * @param file - Archivo de imagen a subir
 * @returns URLs de thumbnail y full, o null si falla
 */
export async function uploadImageToInterconsulta(
  interconsultaId: string,
  file: File
): Promise<{ thumbnailUrl: string; fullUrl: string } | null> {
  try {
    console.log('[InterconsultasService] uploadImageToInterconsulta -> id:', interconsultaId);

    // Import dinámico del storageService para evitar dependencias circulares
    const { uploadImageToStorage } = await import('./storageService');

    // Subir imagen a Supabase Storage
    const uploadResult = await uploadImageToStorage(file, 'interconsultas');
    if (!uploadResult) {
      throw new Error('Error al subir imagen a storage');
    }

    const { publicUrl } = uploadResult;

    // Obtener arrays actuales
    const { data: current, error: fetchError } = await supabase
      .from('interconsultas')
      .select('image_thumbnail_url, image_full_url')
      .eq('id', interconsultaId)
      .single();

    if (fetchError) throw fetchError;

    // Append nueva imagen a los arrays (usamos publicUrl para ambos por ahora)
    const newThumbnails = [...(current?.image_thumbnail_url || []), publicUrl];
    const newFulls = [...(current?.image_full_url || []), publicUrl];

    // Actualizar en BD
    const { error: updateError } = await supabase
      .from('interconsultas')
      .update({
        image_thumbnail_url: newThumbnails,
        image_full_url: newFulls,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    if (updateError) throw updateError;

    console.log('[InterconsultasService] uploadImageToInterconsulta -> success');
    return { thumbnailUrl: publicUrl, fullUrl: publicUrl };
  } catch (error: any) {
    console.error('[InterconsultasService] uploadImageToInterconsulta error:', error);
    return null;
  }
}

/**
 * Remueve una imagen de una interconsulta por índice
 * @param interconsultaId - ID de la interconsulta
 * @param index - Índice de la imagen a remover
 * @returns true si se removió exitosamente
 */
export async function removeImageFromInterconsulta(
  interconsultaId: string,
  index: number
): Promise<boolean> {
  try {
    console.log('[InterconsultasService] removeImageFromInterconsulta -> id:', interconsultaId, 'index:', index);

    // Obtener arrays actuales
    const { data: current, error: fetchError } = await supabase
      .from('interconsultas')
      .select('image_thumbnail_url, image_full_url')
      .eq('id', interconsultaId)
      .single();

    if (fetchError || !current) {
      console.error('[InterconsultasService] removeImageFromInterconsulta fetch error:', fetchError);
      return false;
    }

    // Crear copias y remover por índice
    const newThumbnails = [...(current.image_thumbnail_url || [])];
    const newFulls = [...(current.image_full_url || [])];

    newThumbnails.splice(index, 1);
    newFulls.splice(index, 1);

    // Actualizar en BD
    const { error: updateError } = await supabase
      .from('interconsultas')
      .update({
        image_thumbnail_url: newThumbnails,
        image_full_url: newFulls,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    if (updateError) {
      console.error('[InterconsultasService] removeImageFromInterconsulta update error:', updateError);
      return false;
    }

    console.log('[InterconsultasService] removeImageFromInterconsulta -> success');
    return true;
  } catch (error: any) {
    console.error('[InterconsultasService] removeImageFromInterconsulta error:', error);
    return false;
  }
}

/**
 * Agrega texto OCR extraído al campo estudios_ocr de una interconsulta
 * @param interconsultaId - ID de la interconsulta
 * @param ocrText - Texto extraído mediante OCR
 * @returns true si se agregó exitosamente
 */
export async function appendOCRTextToInterconsulta(
  interconsultaId: string,
  ocrText: string
): Promise<boolean> {
  try {
    console.log('[InterconsultasService] appendOCRTextToInterconsulta -> id:', interconsultaId);

    // Obtener texto OCR actual
    const { data: current, error: fetchError } = await supabase
      .from('interconsultas')
      .select('estudios_ocr')
      .eq('id', interconsultaId)
      .single();

    if (fetchError) {
      console.error('[InterconsultasService] appendOCRTextToInterconsulta fetch error:', fetchError);
      return false;
    }

    // Appendear nuevo texto con separador si ya existe contenido
    const existingText = current?.estudios_ocr || '';
    const newText = existingText
      ? `${existingText}\n\n--- Nuevo estudio ---\n${ocrText}`
      : ocrText;

    // Actualizar en BD
    const { error: updateError } = await supabase
      .from('interconsultas')
      .update({
        estudios_ocr: newText,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    if (updateError) {
      console.error('[InterconsultasService] appendOCRTextToInterconsulta update error:', updateError);
      return false;
    }

    console.log('[InterconsultasService] appendOCRTextToInterconsulta -> success');
    return true;
  } catch (error: any) {
    console.error('[InterconsultasService] appendOCRTextToInterconsulta error:', error);
    return false;
  }
}

/**
 * Actualiza la respuesta y status de una interconsulta (usado desde Evolucionador)
 * @param interconsultaId - ID de la interconsulta
 * @param respuesta - Texto de respuesta (clinical notes del evolucionador)
 * @param newStatus - Nuevo status de la interconsulta
 * @returns true si se actualizó exitosamente
 */
export async function updateInterconsultaResponse(
  interconsultaId: string,
  respuesta: string,
  newStatus: 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada'
): Promise<boolean> {
  try {
    console.log('[InterconsultasService] updateInterconsultaResponse -> id:', interconsultaId, 'status:', newStatus);

    const result: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update({
          respuesta,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', interconsultaId),
      {
        timeout: 8000,
        retries: 2,
        operationName: 'updateInterconsultaResponse'
      }
    );

    const { error } = result || {};
    if (error) {
      console.error('[InterconsultasService] updateInterconsultaResponse error:', error);
      return false;
    }

    console.log('[InterconsultasService] updateInterconsultaResponse -> success');
    return true;
  } catch (error: any) {
    console.error('[InterconsultasService] updateInterconsultaResponse unexpected error:', error);
    return false;
  }
}

/**
 * Actualiza los datos básicos de una interconsulta
 * @param id - ID de la interconsulta
 * @param updates - Datos a actualizar (nombre, DNI, cama, relato, edad)
 * @returns Objeto con success y data actualizado
 */
export async function updateInterconsultaData(
  id: string,
  updates: {
    nombre?: string;
    dni?: string;
    cama?: string;
    relato_consulta?: string;
    edad?: string;
  }
): Promise<{ success: boolean; data?: InterconsultaRow; error?: string }> {
  try {
    console.log('[InterconsultasService] updateInterconsultaData -> id:', id, 'updates:', updates);

    const result: any = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single(),
      {
        timeout: 8000,
        retries: 2,
        operationName: 'updateInterconsultaData'
      }
    );

    const { error, data } = result || {};
    if (error) {
      console.error('[InterconsultasService] updateInterconsultaData error:', error);
      return { success: false, error: error.message };
    }

    console.log('[InterconsultasService] updateInterconsultaData -> success');
    return { success: true, data: data as InterconsultaRow };
  } catch (error: any) {
    console.error('[InterconsultasService] updateInterconsultaData unexpected error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
