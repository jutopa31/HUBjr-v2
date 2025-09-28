// React hooks for lumbar puncture data management
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuthContext } from '../components/auth/AuthProvider';
import {
  LumbarPuncture,
  LumbarPunctureFormData,
  CSFAnalysisResults,
  CSFAnalysisFormData,
  LPComplication,
  LPComplicationFormData,
  LPStats,
  MonthlyLPStats,
  LPAnalytics,
  LPSearchParams
} from '../types/lumbarPuncture';

// Main hook for lumbar puncture management
export function useLumbarPuncture() {
  const { user } = useAuthContext();
  const [procedures, setProcedures] = useState<LumbarPuncture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lumbar punctures (shared access) with optional filtering
  const fetchProcedures = useCallback(async (searchParams?: LPSearchParams) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use the view that includes resident names
      let query = supabase
        .from('lumbar_punctures_with_names')
        .select('*');

      // Only filter by resident if specified in search params
      if (searchParams?.filters?.resident_id) {
        query = query.eq('resident_id', searchParams.filters.resident_id);
      }

      // Apply filters
      if (searchParams?.filters) {
        const { filters } = searchParams;

        if (filters.date_from) {
          query = query.gte('procedure_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('procedure_date', filters.date_to);
        }
        if (filters.indication) {
          query = query.ilike('indication', `%${filters.indication}%`);
        }
        if (filters.supervisor) {
          query = query.ilike('supervisor', `%${filters.supervisor}%`);
        }
        if (typeof filters.successful === 'boolean') {
          query = query.eq('successful', filters.successful);
        }
        if (filters.trainee_role) {
          query = query.eq('trainee_role', filters.trainee_role);
        }
        if (filters.technical_difficulty) {
          query = query.eq('technical_difficulty', filters.technical_difficulty);
        }
      }

      // Apply search
      if (searchParams?.search) {
        query = query.or(`
          indication.ilike.%${searchParams.search}%,
          supervisor.ilike.%${searchParams.search}%,
          patient_initials.ilike.%${searchParams.search}%,
          primary_diagnosis.ilike.%${searchParams.search}%,
          clinical_question.ilike.%${searchParams.search}%
        `);
      }

      // Apply sorting
      const sortBy = searchParams?.sort_by || 'procedure_date';
      const sortOrder = searchParams?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (searchParams?.limit) {
        query = query.limit(searchParams.limit);
      }
      if (searchParams?.offset) {
        query = query.range(searchParams.offset, searchParams.offset + (searchParams.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProcedures(data || []);
    } catch (err) {
      console.error('Error fetching lumbar punctures:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener las punciones lumbares');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new lumbar puncture
  const createProcedure = useCallback(async (formData: LumbarPunctureFormData): Promise<LumbarPuncture | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('lumbar_punctures')
        .insert([
          {
            ...formData,
            resident_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh the procedures list
      await fetchProcedures();

      return data;
    } catch (err) {
      console.error('Error creating lumbar puncture:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la punción lumbar');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProcedures]);

  // Update an existing lumbar puncture
  const updateProcedure = useCallback(async (id: string, formData: Partial<LumbarPunctureFormData>): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('lumbar_punctures')
        .update(formData)
        .eq('id', id)
        .eq('resident_id', user.id);

      if (error) throw error;

      // Refresh the procedures list
      await fetchProcedures();

      return true;
    } catch (err) {
      console.error('Error updating lumbar puncture:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lumbar puncture');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProcedures]);

  // Delete a lumbar puncture
  const deleteProcedure = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('lumbar_punctures')
        .delete()
        .eq('id', id)
        .eq('resident_id', user.id);

      if (error) throw error;

      // Refresh the procedures list
      await fetchProcedures();

      return true;
    } catch (err) {
      console.error('Error deleting lumbar puncture:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lumbar puncture');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProcedures]);

  // Get a single procedure by ID
  const getProcedure = useCallback(async (id: string): Promise<LumbarPuncture | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lumbar_punctures')
        .select('*')
        .eq('id', id)
        .eq('resident_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching lumbar puncture:', err);
      return null;
    }
  }, [user]);

  // Initialize data fetching
  useEffect(() => {
    if (user) {
      fetchProcedures();
    }
  }, [user, fetchProcedures]);

  return {
    procedures,
    loading,
    error,
    fetchProcedures,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    getProcedure
  };
}

// Hook for CSF analysis results
export function useCSFAnalysis() {
  const [results, setResults] = useState<CSFAnalysisResults[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch CSF results for a specific lumbar puncture
  const fetchCSFResults = useCallback(async (lumbarPunctureId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('csf_analysis_results')
        .select('*')
        .eq('lumbar_puncture_id', lumbarPunctureId);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Error fetching CSF results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSF results');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create CSF analysis result
  const createCSFResult = useCallback(async (formData: CSFAnalysisFormData): Promise<CSFAnalysisResults | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('csf_analysis_results')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Refresh results
      await fetchCSFResults(formData.lumbar_puncture_id);

      return data;
    } catch (err) {
      console.error('Error creating CSF result:', err);
      setError(err instanceof Error ? err.message : 'Failed to create CSF result');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCSFResults]);

  // Update CSF analysis result
  const updateCSFResult = useCallback(async (id: string, formData: Partial<CSFAnalysisFormData>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('csf_analysis_results')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error updating CSF result:', err);
      setError(err instanceof Error ? err.message : 'Failed to update CSF result');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    fetchCSFResults,
    createCSFResult,
    updateCSFResult
  };
}

// Hook for complications tracking
export function useLPComplications() {
  const [complications, setComplications] = useState<LPComplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch complications for a specific lumbar puncture
  const fetchComplications = useCallback(async (lumbarPunctureId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('lp_complications')
        .select('*')
        .eq('lumbar_puncture_id', lumbarPunctureId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplications(data || []);
    } catch (err) {
      console.error('Error fetching complications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch complications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create complication record
  const createComplication = useCallback(async (formData: LPComplicationFormData): Promise<LPComplication | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('lp_complications')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Refresh complications
      await fetchComplications(formData.lumbar_puncture_id);

      return data;
    } catch (err) {
      console.error('Error creating complication:', err);
      setError(err instanceof Error ? err.message : 'Failed to create complication');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchComplications]);

  // Update complication
  const updateComplication = useCallback(async (id: string, formData: Partial<LPComplicationFormData>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('lp_complications')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error updating complication:', err);
      setError(err instanceof Error ? err.message : 'Failed to update complication');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    complications,
    loading,
    error,
    fetchComplications,
    createComplication,
    updateComplication
  };
}

// Hook for lumbar puncture statistics and analytics
export function useLPStatistics() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<LPStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyLPStats[]>([]);
  const [analytics, setAnalytics] = useState<LPAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch overall statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_resident_lp_stats', { resident_uuid: user.id });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching LP stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch monthly statistics
  const fetchMonthlyStats = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_monthly_lp_stats', {
          resident_uuid: user.id,
          start_date: startDate,
          end_date: endDate
        });

      if (error) throw error;
      setMonthlyStats(data || []);
    } catch (err) {
      console.error('Error fetching monthly LP stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch comprehensive analytics
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // First get lumbar puncture IDs for this resident
      const { data: lpIds } = await supabase
        .from('lumbar_punctures')
        .select('id')
        .eq('resident_id', user.id);

      const lumbarPunctureIds = lpIds?.map(lp => lp.id) || [];

      // Fetch multiple analytics in parallel
      const [
        overallStatsResult,
        monthlyStatsResult,
        indicationBreakdownResult,
        complicationRatesResult,
        difficultyTrendsResult,
        supervisorStatsResult
      ] = await Promise.all([
        supabase.rpc('get_resident_lp_stats', { resident_uuid: user.id }),
        supabase.rpc('get_monthly_lp_stats', {
          resident_uuid: user.id,
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }),
        // Custom queries for other analytics
        supabase
          .from('lumbar_punctures')
          .select('indication, successful')
          .eq('resident_id', user.id),
        lumbarPunctureIds.length > 0 ? supabase
          .from('lp_complications')
          .select('complication_type, lumbar_puncture_id')
          .in('lumbar_puncture_id', lumbarPunctureIds) : { data: [] },
        supabase
          .from('lumbar_punctures')
          .select('technical_difficulty, successful')
          .eq('resident_id', user.id)
          .not('technical_difficulty', 'is', null),
        supabase
          .from('lumbar_punctures')
          .select('supervisor, successful')
          .eq('resident_id', user.id)
      ]);

      // Process indication breakdown
      const indicationData = indicationBreakdownResult.data || [];
      const indicationBreakdown = indicationData.reduce((acc: any[], procedure: any) => {
        const existing = acc.find(item => item.indication === procedure.indication);
        if (existing) {
          existing.count++;
          if (procedure.successful) existing.successful++;
        } else {
          acc.push({
            indication: procedure.indication,
            count: 1,
            successful: procedure.successful ? 1 : 0
          });
        }
        return acc;
      }, []).map((item: any) => ({
        ...item,
        success_rate: (item.successful / item.count) * 100
      }));

      // Process complication rates
      const complicationData = complicationRatesResult.data || [];
      const totalProcedures = overallStatsResult.data?.[0]?.total_procedures || 1;
      const complicationRates = complicationData.reduce((acc: any[], comp: any) => {
        const existing = acc.find(item => item.complication_type === comp.complication_type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({
            complication_type: comp.complication_type,
            count: 1
          });
        }
        return acc;
      }, []).map((item: any) => ({
        ...item,
        percentage: (item.count / totalProcedures) * 100
      }));

      // Process difficulty trends
      const difficultyData = difficultyTrendsResult.data || [];
      const difficultyTrends = difficultyData.reduce((acc: any[], procedure: any) => {
        const difficulty = procedure.technical_difficulty;
        const existing = acc.find(item => item.difficulty === difficulty);
        if (existing) {
          existing.count++;
          if (procedure.successful) existing.successful++;
        } else {
          acc.push({
            difficulty,
            count: 1,
            successful: procedure.successful ? 1 : 0
          });
        }
        return acc;
      }, []).map((item: any) => ({
        ...item,
        success_rate: (item.successful / item.count) * 100
      }));

      // Process supervisor stats
      const supervisorData = supervisorStatsResult.data || [];
      const supervisorStats = supervisorData.reduce((acc: any[], procedure: any) => {
        const supervisor = procedure.supervisor;
        const existing = acc.find(item => item.supervisor === supervisor);
        if (existing) {
          existing.procedures++;
          if (procedure.successful) existing.successful++;
        } else {
          acc.push({
            supervisor,
            procedures: 1,
            successful: procedure.successful ? 1 : 0
          });
        }
        return acc;
      }, []).map((item: any) => ({
        ...item,
        avg_success_rate: (item.successful / item.procedures) * 100
      }));

      setAnalytics({
        overall_stats: overallStatsResult.data?.[0] || {
          total_procedures: 0,
          successful_procedures: 0,
          success_rate: 0,
          complications_count: 0,
          average_attempts: 0
        },
        monthly_stats: monthlyStatsResult.data || [],
        indication_breakdown: indicationBreakdown,
        complication_rates: complicationRates,
        difficulty_trends: difficultyTrends,
        supervisor_stats: supervisorStats
      });

    } catch (err) {
      console.error('Error fetching LP analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize statistics fetching
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchAnalytics();
    }
  }, [user, fetchStats, fetchAnalytics]);

  return {
    stats,
    monthlyStats,
    analytics,
    loading,
    error,
    fetchStats,
    fetchMonthlyStats,
    fetchAnalytics
  };
}

// Hook for fetching available residents and supervisors for filtering
export function useLPFilters() {
  const [residents, setResidents] = useState<{ id: string; name: string; level?: string }[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    try {
      // Get unique residents who have performed lumbar punctures
      const { data: residentData } = await supabase
        .from('lumbar_punctures_with_names')
        .select('resident_id, resident_name, resident_level')
        .not('resident_name', 'is', null);

      // Get unique supervisors
      const { data: supervisorData } = await supabase
        .from('lumbar_punctures')
        .select('supervisor')
        .not('supervisor', 'is', null);

      // Process residents (remove duplicates)
      const uniqueResidents = residentData?.reduce((acc: any[], current) => {
        if (!acc.find(item => item.id === current.resident_id)) {
          acc.push({
            id: current.resident_id,
            name: current.resident_name,
            level: current.resident_level
          });
        }
        return acc;
      }, []) || [];

      // Process supervisors (remove duplicates)
      const uniqueSupervisors = [...new Set(
        supervisorData?.map(item => item.supervisor).filter(Boolean) || []
      )];

      setResidents(uniqueResidents);
      setSupervisors(uniqueSupervisors);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    residents,
    supervisors,
    loading,
    refetch: fetchFilters
  };
}

// Hook for department-wide statistics
export function useDepartmentLPStats() {
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [residentComparison, setResidentComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartmentStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get department-wide statistics
      const { data: deptData, error: deptError } = await supabase
        .rpc('get_department_lp_stats');

      if (deptError) throw deptError;

      // Get resident comparison data
      const { data: comparisonData, error: comparisonError } = await supabase
        .rpc('get_resident_lp_comparison');

      if (comparisonError) throw comparisonError;

      setDepartmentStats(deptData?.[0] || null);
      setResidentComparison(comparisonData || []);
    } catch (err) {
      console.error('Error fetching department stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch department statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentStats();
  }, [fetchDepartmentStats]);

  return {
    departmentStats,
    residentComparison,
    loading,
    error,
    refetch: fetchDepartmentStats
  };
}