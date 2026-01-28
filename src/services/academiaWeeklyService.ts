import { supabase, isSupabaseConfigured } from '../utils/supabase';

type ServiceResult<T> = { data: T | null; error: Error | null };
type ServiceVoidResult = { error: Error | null };

const TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
  ]);
}

function toFriendlyError(error: any, fallbackMessage: string): Error {
  const rawMessage = typeof error?.message === 'string' ? error.message : '';
  if (rawMessage.toLowerCase().includes('timeout')) {
    return new Error('La solicitud tardo demasiado. Intenta nuevamente.');
  }
  return new Error(rawMessage || fallbackMessage);
}

export type WeeklyTopicStatus = 'proposed' | 'confirmed';

export interface WeeklyTopic {
  id: string;
  week_start_date: string; // YYYY-MM-DD (monday)
  topic_title: string;
  summary?: string | null;
  status?: WeeklyTopicStatus | null;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
}

export type WeeklyTopicPayload = Omit<WeeklyTopic, 'id' | 'created_at' | 'updated_at'>;

export async function fetchWeeklyTopics(): Promise<ServiceResult<WeeklyTopic[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_weekly_topics')
        .select('*')
        .order('week_start_date', { ascending: false })
    );

    if (error) {
      console.error('Error fetching weekly topics:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar los temas semanales') };
    }

    return { data: (data as WeeklyTopic[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchWeeklyTopics:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar los temas semanales') };
  }
}

export async function createWeeklyTopic(payload: WeeklyTopicPayload): Promise<ServiceResult<WeeklyTopic>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_weekly_topics')
        .insert([{
          week_start_date: payload.week_start_date,
          topic_title: payload.topic_title,
          summary: payload.summary || null,
          status: payload.status || 'proposed',
          created_by: payload.created_by
        }])
        .select()
        .single()
    );

    if (error) {
      console.error('Error creating weekly topic:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos guardar el tema semanal') };
    }

    return { data: data as WeeklyTopic, error: null };
  } catch (error) {
    console.error('Error in createWeeklyTopic:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos guardar el tema semanal') };
  }
}

export async function updateWeeklyTopic(
  id: string,
  updates: Partial<WeeklyTopicPayload>
): Promise<ServiceResult<WeeklyTopic>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    if (!id) {
      return { data: null, error: new Error('ID invalido') };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('academy_weekly_topics')
        .update({
          week_start_date: updates.week_start_date,
          topic_title: updates.topic_title,
          summary: updates.summary === undefined ? undefined : (updates.summary || null),
          status: updates.status || 'proposed'
        })
        .eq('id', id)
        .select()
        .single()
    );

    if (error) {
      console.error('Error updating weekly topic:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos actualizar el tema semanal') };
    }

    return { data: data as WeeklyTopic, error: null };
  } catch (error) {
    console.error('Error in updateWeeklyTopic:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos actualizar el tema semanal') };
  }
}

export async function deleteWeeklyTopic(id: string): Promise<ServiceVoidResult> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase no configurado') };
  }
  try {
    if (!id) {
      return { error: new Error('ID invalido') };
    }

    const { error } = await withTimeout(
      supabase
        .from('academy_weekly_topics')
        .delete()
        .eq('id', id)
    );

    if (error) {
      console.error('Error deleting weekly topic:', error);
      return { error: toFriendlyError(error, 'No pudimos eliminar el tema semanal') };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteWeeklyTopic:', error);
    return { error: toFriendlyError(error, 'No pudimos eliminar el tema semanal') };
  }
}
