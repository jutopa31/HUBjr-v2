import { supabase, isSupabaseConfigured } from '../utils/supabase';

export type RankingPeriod = 'weekly' | 'monthly';

export type Topic = {
  id: string;
  title: string;
  period: RankingPeriod;
  startDate: string; // ISO
  endDate: string; // ISO
  objectives?: string;
  materials?: { label: string; url: string }[];
};

export type Participation = {
  id: string;
  topicId: string;
  userId: string;
  type: 'articulo' | 'clase' | 'revision';
  link?: string;
  comment?: string;
  status: 'submitted' | 'validated' | 'rejected';
  createdAt: string; // ISO
};

export type ParticipationRow = Participation & {
  displayName?: string;
};

export type RankingEntry = {
  userId: string;
  displayName: string;
  level?: string;
  points: number;
  hospitalContext?: string;
};

export type ActiveTopics = {
  weekly?: Topic;
  monthly?: Topic;
};

export type TopicStatistics = {
  activeTopics: number;
  pendingParticipations: number;
  weeklyPointsAwarded: number;
  monthlyPointsAwarded: number;
  activeResidents: number;
};

export type ResidentOption = {
  userId: string;
  firstName: string;
  lastName: string;
  level?: string;
  displayName: string;
};

export async function getActiveTopics(): Promise<ActiveTopics> {
  if (!isSupabaseConfigured()) return {};
  try {
    // Obtener fecha de hoy (solo fecha, sin hora) en formato ISO
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

    console.log('🔍 getActiveTopics - Buscando temas activos para fecha (solo día):', todayDateOnly);

    // Obtener todos los temas publicados y filtrar por fecha en el cliente
    const { data, error } = await supabase
      .from('ranking_topics')
      .select('*')
      .in('period', ['weekly', 'monthly'])
      .eq('status', 'published');

    if (error) {
      console.error('❌ Error en query getActiveTopics:', error);
      throw error;
    }

    console.log('📊 Temas publicados encontrados:', data?.length || 0);

    const result: ActiveTopics = {};

    (data || []).forEach((row: any) => {
      // Extraer solo la fecha (sin hora) de start_date y end_date
      const startDate = row.start_date.split('T')[0];
      const endDate = row.end_date.split('T')[0];

      console.log(`  - Evaluando: ${row.title} (${row.period})`);
      console.log(`    Inicio: ${startDate} | Fin: ${endDate} | Hoy: ${todayDateOnly}`);
      console.log(`    ¿Inicio <= Hoy? ${startDate <= todayDateOnly} | ¿Fin >= Hoy? ${endDate >= todayDateOnly}`);

      // Comparar solo fechas (formato YYYY-MM-DD)
      if (startDate <= todayDateOnly && endDate >= todayDateOnly) {
        const topic: Topic = {
          id: row.id,
          title: row.title,
          period: row.period,
          startDate: row.start_date,
          endDate: row.end_date,
          objectives: row.objectives || undefined,
          materials: row.materials || undefined
        };

        console.log(`    ✅ Tema ACTIVO agregado al resultado`);

        if (row.period === 'weekly') result.weekly = topic;
        if (row.period === 'monthly') result.monthly = topic;
      } else {
        console.log(`    ❌ Tema fuera de rango de fechas`);
      }
    });

    console.log('✅ Resultado final getActiveTopics:', result);
    return result;
  } catch (e) {
    console.warn('getActiveTopics error (topics missing or query failed):', e);
    return {};
  }
}

export async function submitParticipation(input: Omit<Participation, 'id' | 'status' | 'createdAt'>): Promise<Participation> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    return { id: 'mock-' + Math.random().toString(36).slice(2), status: 'submitted', createdAt: now, ...input };
  }
  try {
    const payload = {
      topic_id: input.topicId,
      user_id: input.userId,
      type: input.type,
      link: input.link || null,
      comment: input.comment || null,
      status: 'submitted'
    };
    const { data, error } = await supabase
      .from('ranking_participations')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      topicId: data.topic_id,
      userId: data.user_id,
      type: data.type,
      link: data.link || undefined,
      comment: data.comment || undefined,
      status: data.status,
      createdAt: data.created_at || now
    };
  } catch (e) {
    console.warn('submitParticipation fallback (error or missing table):', e);
    return { id: 'mock-' + Math.random().toString(36).slice(2), status: 'submitted', createdAt: now, ...input };
  }
}

export async function getLeaderboard(
  period: RankingPeriod,
  filters?: { level?: string; hospitalContext?: string }
): Promise<RankingEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = supabase
      .from(period === 'weekly' ? 'ranking_leaderboard_weekly' : 'ranking_leaderboard_monthly')
      .select('*')
      .order('points', { ascending: false })
      .limit(50) as any;
    if (filters?.level) query = query.eq('level', filters.level);
    if (filters?.hospitalContext) query = query.eq('hospital_context', filters.hospitalContext);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      userId: row.user_id,
      displayName: row.display_name || 'Anonimo',
      level: row.level || undefined,
      points: row.points || 0,
      hospitalContext: row.hospital_context || undefined,
    }));
  } catch (e) {
    console.warn('getLeaderboard error (view missing or query failed):', e);
    return [];
  }
}export async function getMyEntry(period: RankingPeriod, userId: string): Promise<RankingEntry | null> {
  if (!userId) return null;
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from(period === 'weekly' ? 'ranking_leaderboard_weekly' : 'ranking_leaderboard_monthly')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId: data.user_id,
      displayName: data.display_name || 'Anonimo',
      level: data.level || undefined,
      points: data.points || 0,
      hospitalContext: data.hospital_context || undefined,
    };
  } catch (e) {
    console.warn('getMyEntry error:', e);
    return null;
  }
}

export async function createTopic(input: {
  title: string;
  period: RankingPeriod;
  startDate: string;
  endDate: string;
  objectives?: string;
  materials?: { label: string; url: string }[];
  hospitalContext: string;
  status?: 'draft' | 'published';
}): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured()) return { success: true, id: 'mock-topic' };
  try {
    const payload: any = {
      title: input.title,
      period: input.period,
      // Publicado por defecto para que aparezca en el banner de temas activos
      status: input.status || 'published',
      start_date: input.startDate,
      end_date: input.endDate,
      objectives: input.objectives || null,
      materials: input.materials || null,
      hospital_context: input.hospitalContext,
    };
    const { data, error } = await supabase
      .from('ranking_topics')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, id: data.id };
  } catch (e) {
    console.warn('createTopic error:', e);
    return { success: false };
  }
}

export async function awardPointsForLumbarPuncture(params: {
  residentUserId: string;
  points: number;
  period?: RankingPeriod; // defaults to weekly
  topicId?: string; // optional override
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const period = params.period || 'weekly';
  if (!isSupabaseConfigured()) return { success: true };
  try {
    let topicId = params.topicId;
    if (!topicId) {
      const topics = await getActiveTopics();
      topicId = (period === 'weekly' ? topics.weekly?.id : topics.monthly?.id) as string | undefined;
    }
    if (!topicId) return { success: false, error: 'No hay un tema activo para este período' };

    const { error } = await supabase.rpc('ranking_award_points', {
      user_id: params.residentUserId,
      topic_id: topicId,
      points: params.points,
      reason: params.reason || 'lumbar_puncture'
    });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.warn('awardPointsForLumbarPuncture error:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Error agregando puntos' };
  }
}

export async function listSubmittedParticipations(): Promise<ParticipationRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('ranking_participations')
      .select('id, topic_id, user_id, type, link, comment, status, created_at, resident_profiles!inner(first_name,last_name)')
      .eq('status', 'submitted')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      topicId: row.topic_id,
      userId: row.user_id,
      type: row.type,
      link: row.link || undefined,
      comment: row.comment || undefined,
      status: row.status,
      createdAt: row.created_at,
      displayName: row.resident_profiles ? `${row.resident_profiles.first_name || ''} ${row.resident_profiles.last_name || ''}`.trim() : undefined
    }));
  } catch (e) {
    console.warn('listSubmittedParticipations error:', e);
    return [];
  }
}

export async function validateParticipation(participationId: string, points: number): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    // Prefer RPC if available (atomic + RLS-safe for admins)
    const { error } = await supabase.rpc('ranking_validate_participation', {
      participation_id: participationId,
      points
    });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.warn('ranking_validate_participation RPC failed, falling back:', e);
    try {
      const { data: part, error: fetchError } = await supabase
        .from('ranking_participations')
        .select('id, topic_id, user_id')
        .eq('id', participationId)
        .single();
      if (fetchError) throw fetchError;
      const { error: updateError } = await supabase
        .from('ranking_participations')
        .update({ status: 'validated' })
        .eq('id', participationId);
      if (updateError) throw updateError;
      const { error: ledgerError } = await supabase
        .from('ranking_ledger')
        .insert({
          user_id: part.user_id,
          topic_id: part.topic_id,
          participation_id: participationId,
          points,
          reason: 'validated'
        });
      if (ledgerError) throw ledgerError;
      return { success: true };
    } catch (inner) {
      console.warn('validateParticipation fallback failed:', inner);
      return { success: false };
    }
  }
}

export async function rejectParticipation(participationId: string, reason?: string): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase
      .from('ranking_participations')
      .update({ status: 'rejected', comment: reason || null })
      .eq('id', participationId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.warn('rejectParticipation error:', e);
    return { success: false };
  }
}

export async function getAllTopics(): Promise<{ published: Topic[], draft: Topic[], closed: Topic[] }> {
  if (!isSupabaseConfigured()) return { published: [], draft: [], closed: [] };
  try {
    const { data, error } = await supabase
      .from('ranking_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('🗂️ getAllTopics - Total de temas en DB:', data?.length || 0);

    const published: Topic[] = [];
    const draft: Topic[] = [];
    const closed: Topic[] = [];

    (data || []).forEach((row: any) => {
      console.log(`  📄 ${row.title} | status: ${row.status} | period: ${row.period} | inicio: ${row.start_date} | fin: ${row.end_date}`);

      const topic: Topic = {
        id: row.id,
        title: row.title,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        objectives: row.objectives || undefined,
        materials: row.materials || undefined
      };

      if (row.status === 'published') published.push(topic);
      else if (row.status === 'draft') draft.push(topic);
      else if (row.status === 'closed') closed.push(topic);
    });

    console.log(`📊 Agrupados: published=${published.length}, draft=${draft.length}, closed=${closed.length}`);

    return { published, draft, closed };
  } catch (e) {
    console.warn('getAllTopics error:', e);
    return { published: [], draft: [], closed: [] };
  }
}

export async function updateTopic(topicId: string, updates: Partial<{
  title: string;
  startDate: string;
  endDate: string;
  objectives: string;
  materials: { label: string; url: string }[];
  status: 'draft' | 'published' | 'closed';
}>): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate;
    if (updates.endDate !== undefined) payload.end_date = updates.endDate;
    if (updates.objectives !== undefined) payload.objectives = updates.objectives || null;
    if (updates.materials !== undefined) payload.materials = updates.materials || null;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('ranking_topics')
      .update(payload)
      .eq('id', topicId);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.warn('updateTopic error:', e);
    return { success: false };
  }
}

export async function deleteTopic(topicId: string): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase
      .from('ranking_topics')
      .delete()
      .eq('id', topicId);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.warn('deleteTopic error:', e);
    return { success: false };
  }
}

export async function getTopicStatistics(): Promise<TopicStatistics> {
  if (!isSupabaseConfigured()) {
    return {
      activeTopics: 0,
      pendingParticipations: 0,
      weeklyPointsAwarded: 0,
      monthlyPointsAwarded: 0,
      activeResidents: 0
    };
  }

  try {
    const now = new Date();
    const nowISO = now.toISOString();

    // Count active topics (published and current date in range)
    const activeTopicsPromise = supabase
      .from('ranking_topics')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('start_date', nowISO)
      .gte('end_date', nowISO);

    // Count pending participations
    const pendingParticipationsPromise = supabase
      .from('ranking_participations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted');

    // Sum weekly points (ISO week)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyPointsPromise = supabase
      .from('ranking_ledger')
      .select('points')
      .gte('created_at', startOfWeek.toISOString());

    // Sum monthly points
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPointsPromise = supabase
      .from('ranking_ledger')
      .select('points')
      .gte('created_at', startOfMonth.toISOString());

    // Count unique residents this week
    const activeResidentsPromise = supabase
      .from('ranking_ledger')
      .select('user_id')
      .gte('created_at', startOfWeek.toISOString());

    const [activeTopicsRes, pendingParticipationsRes, weeklyPointsRes, monthlyPointsRes, activeResidentsRes] = await Promise.all([
      activeTopicsPromise,
      pendingParticipationsPromise,
      weeklyPointsPromise,
      monthlyPointsPromise,
      activeResidentsPromise
    ]);

    const weeklyPoints = (weeklyPointsRes.data || []).reduce((sum: number, row: any) => sum + (row.points || 0), 0);
    const monthlyPoints = (monthlyPointsRes.data || []).reduce((sum: number, row: any) => sum + (row.points || 0), 0);
    const uniqueResidents = new Set((activeResidentsRes.data || []).map((row: any) => row.user_id)).size;

    return {
      activeTopics: activeTopicsRes.count || 0,
      pendingParticipations: pendingParticipationsRes.count || 0,
      weeklyPointsAwarded: weeklyPoints,
      monthlyPointsAwarded: monthlyPoints,
      activeResidents: uniqueResidents
    };
  } catch (e) {
    console.warn('getTopicStatistics error:', e);
    return {
      activeTopics: 0,
      pendingParticipations: 0,
      weeklyPointsAwarded: 0,
      monthlyPointsAwarded: 0,
      activeResidents: 0
    };
  }
}

export async function getAllResidents(): Promise<ResidentOption[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('resident_profiles')
      .select('user_id, first_name, last_name, training_level')
      .order('last_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      userId: row.user_id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      level: row.training_level || undefined,
      displayName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Sin nombre'
    }));
  } catch (e) {
    console.warn('getAllResidents error:', e);
    return [];
  }
}












