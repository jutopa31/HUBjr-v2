import { supabase } from '../utils/supabase';
import type { EvolucionadorDraft, EvolucionadorDraftPayload } from '../types';

const resolveErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export async function listEvolucionadorDrafts(
  userId: string,
  limit = 8
): Promise<{ success: boolean; data?: EvolucionadorDraft[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('evolucionador_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as EvolucionadorDraft[] };
  } catch (error) {
    return { success: false, error: resolveErrorMessage(error, 'Error cargando borradores') };
  }
}

export async function getEvolucionadorDraft(
  userId: string,
  draftId: string
): Promise<{ success: boolean; data?: EvolucionadorDraft; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('evolucionador_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('id', draftId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as EvolucionadorDraft };
  } catch (error) {
    return { success: false, error: resolveErrorMessage(error, 'Error cargando borrador') };
  }
}

export async function saveEvolucionadorDraft(
  userId: string,
  draftId: string | null,
  payload: EvolucionadorDraftPayload
): Promise<{ success: boolean; data?: EvolucionadorDraft; error?: string }> {
  try {
    if (draftId) {
      const { data, error } = await supabase
        .from('evolucionador_drafts')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('id', draftId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as EvolucionadorDraft };
    }

    const { data, error } = await supabase
      .from('evolucionador_drafts')
      .insert([
        {
          ...payload,
          user_id: userId,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as EvolucionadorDraft };
  } catch (error) {
    return { success: false, error: resolveErrorMessage(error, 'Error guardando borrador') };
  }
}

export async function deleteEvolucionadorDraft(
  userId: string,
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('evolucionador_drafts')
      .delete()
      .eq('user_id', userId)
      .eq('id', draftId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: resolveErrorMessage(error, 'Error eliminando borrador') };
  }
}
