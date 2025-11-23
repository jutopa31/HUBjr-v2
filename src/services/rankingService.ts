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

export async function getActiveTopics(): Promise<ActiveTopics> {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data, error } = await supabase
      .from('ranking_topics')
      .select('*')
      .in('period', ['weekly', 'monthly'])
      .eq('status', 'published')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString());

    if (error) throw error;
    const result: ActiveTopics = {};
    (data || []).forEach((row: any) => {
      const topic: Topic = {
        id: row.id,
        title: row.title,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        objectives: row.objectives || undefined,
        materials: row.materials || undefined
      };
      if (row.period === 'weekly') result.weekly = topic;
      if (row.period === 'monthly') result.monthly = topic;
    });
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
      status: input.status || 'draft',
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












