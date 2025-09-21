import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../components/auth/AuthProvider';
import { supabase } from '../utils/supabase';
import {
  UserProcedure,
  UserPatient,
  UserClass,
  UserReview,
  UserGoal,
  UserStatistics,
  ProcedureFormData,
  PatientFormData,
  ClassFormData,
  GoalFormData,
  UserDataFilters
} from '../types/userTracking';
import { LumbarPuncture } from '../types/lumbarPuncture';

interface UseUserDataReturn {
  // Data
  procedures: UserProcedure[];
  lumbarPunctures: LumbarPuncture[];
  patients: UserPatient[];
  classes: UserClass[];
  reviews: UserReview[];
  goals: UserGoal[];
  statistics: UserStatistics | null;
  residentProfile: any; // Will be typed later

  // Loading states
  loading: boolean;
  proceduresLoading: boolean;
  lumbarPuncturesLoading: boolean;
  patientsLoading: boolean;
  classesLoading: boolean;
  reviewsLoading: boolean;
  goalsLoading: boolean;
  profileLoading: boolean;

  // Error states
  error: string | null;

  // CRUD operations for procedures
  addProcedure: (data: ProcedureFormData) => Promise<boolean>;
  updateProcedure: (id: string, data: Partial<UserProcedure>) => Promise<boolean>;
  deleteProcedure: (id: string) => Promise<boolean>;

  // CRUD operations for patients
  addPatient: (data: PatientFormData) => Promise<boolean>;
  updatePatient: (id: string, data: Partial<UserPatient>) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  dischargePatient: (id: string, outcome?: string) => Promise<boolean>;

  // CRUD operations for classes
  addClass: (data: ClassFormData) => Promise<boolean>;
  updateClass: (id: string, data: Partial<UserClass>) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;

  // CRUD operations for goals
  addGoal: (data: GoalFormData) => Promise<boolean>;
  updateGoal: (id: string, data: Partial<UserGoal>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  updateGoalProgress: (id: string, progress: number) => Promise<boolean>;

  // Data loading functions
  loadProcedures: (filters?: UserDataFilters) => Promise<void>;
  loadLumbarPunctures: (filters?: UserDataFilters) => Promise<void>;
  loadPatients: (filters?: UserDataFilters) => Promise<void>;
  loadClasses: (filters?: UserDataFilters) => Promise<void>;
  loadReviews: (filters?: UserDataFilters) => Promise<void>;
  loadGoals: (filters?: UserDataFilters) => Promise<void>;
  loadResidentProfile: () => Promise<void>;
  loadStatistics: () => Promise<void>;

  // Utility functions
  refreshAll: () => Promise<void>;
}

export function useUserData(): UseUserDataReturn {
  const { user } = useAuthContext();

  // Data states
  const [procedures, setProcedures] = useState<UserProcedure[]>([]);
  const [lumbarPunctures, setLumbarPunctures] = useState<LumbarPuncture[]>([]);
  const [patients, setPatients] = useState<UserPatient[]>([]);
  const [classes, setClasses] = useState<UserClass[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [residentProfile, setResidentProfile] = useState<any>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [lumbarPuncturesLoading, setLumbarPuncturesLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Helper function to build query with filters
  const buildQuery = useCallback((table: string, filters?: UserDataFilters) => {
    let query = supabase.from(table).select('*').eq('user_id', user?.id);

    if (filters?.dateFrom) {
      if (table === 'user_procedures') {
        query = query.gte('date_performed', filters.dateFrom);
      } else if (table === 'user_patients') {
        query = query.gte('date_assigned', filters.dateFrom);
      } else if (table === 'user_classes') {
        query = query.gte('date_attended', filters.dateFrom);
      } else if (table === 'user_reviews') {
        query = query.gte('date_reviewed', filters.dateFrom);
      }
    }

    if (filters?.dateTo) {
      if (table === 'user_procedures') {
        query = query.lte('date_performed', filters.dateTo);
      } else if (table === 'user_patients') {
        query = query.lte('date_assigned', filters.dateTo);
      } else if (table === 'user_classes') {
        query = query.lte('date_attended', filters.dateTo);
      } else if (table === 'user_reviews') {
        query = query.lte('date_reviewed', filters.dateTo);
      }
    }

    if (filters?.procedureType && table === 'user_procedures') {
      query = query.eq('procedure_type', filters.procedureType);
    }

    if (filters?.patientStatus && table === 'user_patients') {
      query = query.eq('status', filters.patientStatus);
    }

    if (filters?.activityType && table === 'user_classes') {
      query = query.eq('activity_type', filters.activityType);
    }

    if (filters?.goalStatus && table === 'user_goals') {
      query = query.eq('status', filters.goalStatus);
    }

    if (filters?.goalType && table === 'user_goals') {
      query = query.eq('goal_type', filters.goalType);
    }

    return query;
  }, [user?.id]);

  // Load procedures
  const loadProcedures = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setProceduresLoading(true);
    setError(null);

    try {
      const query = buildQuery('user_procedures', filters);
      const { data, error: queryError } = await query.order('date_performed', { ascending: false });

      if (queryError) throw queryError;
      setProcedures(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading procedures');
    } finally {
      setProceduresLoading(false);
    }
  }, [user?.id, buildQuery]);

  // Load lumbar punctures
  const loadLumbarPunctures = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setLumbarPuncturesLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('lumbar_punctures')
        .select('*')
        .eq('resident_id', user.id);

      // Apply filters for lumbar punctures
      if (filters?.dateFrom) {
        query = query.gte('procedure_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('procedure_date', filters.dateTo);
      }

      const { data, error: queryError } = await query.order('procedure_date', { ascending: false });

      if (queryError) throw queryError;
      setLumbarPunctures(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading lumbar punctures');
    } finally {
      setLumbarPuncturesLoading(false);
    }
  }, [user?.id]);

  // Load resident profile
  const loadResidentProfile = useCallback(async () => {
    if (!user?.id) return;

    setProfileLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('resident_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError; // PGRST116 is "not found"
      setResidentProfile(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading resident profile');
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  // Load patients
  const loadPatients = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setPatientsLoading(true);
    setError(null);

    try {
      const query = buildQuery('user_patients', filters);
      const { data, error: queryError } = await query.order('date_assigned', { ascending: false });

      if (queryError) throw queryError;
      setPatients(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading patients');
    } finally {
      setPatientsLoading(false);
    }
  }, [user?.id, buildQuery]);

  // Load classes
  const loadClasses = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setClassesLoading(true);
    setError(null);

    try {
      const query = buildQuery('user_classes', filters);
      const { data, error: queryError } = await query.order('date_attended', { ascending: false });

      if (queryError) throw queryError;
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading classes');
    } finally {
      setClassesLoading(false);
    }
  }, [user?.id, buildQuery]);

  // Load reviews
  const loadReviews = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setReviewsLoading(true);
    setError(null);

    try {
      const query = buildQuery('user_reviews', filters);
      const { data, error: queryError } = await query.order('date_reviewed', { ascending: false });

      if (queryError) throw queryError;
      setReviews(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [user?.id, buildQuery]);

  // Load goals
  const loadGoals = useCallback(async (filters?: UserDataFilters) => {
    if (!user?.id) return;

    setGoalsLoading(true);
    setError(null);

    try {
      const query = buildQuery('user_goals', filters);
      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setGoals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading goals');
    } finally {
      setGoalsLoading(false);
    }
  }, [user?.id, buildQuery]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Calculate combined statistics from both regular procedures and lumbar punctures
      const totalProcedures = procedures.length + lumbarPunctures.length;
      const successfulRegularProcedures = procedures.filter(p => p.success).length;
      const successfulLumbarPunctures = lumbarPunctures.filter(lp => lp.successful).length;
      const totalSuccessful = successfulRegularProcedures + successfulLumbarPunctures;

      // Combine procedure types
      const proceduresByType = procedures.reduce((acc, proc) => {
        acc[proc.procedure_type] = (acc[proc.procedure_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Add lumbar punctures to the type breakdown
      if (lumbarPunctures.length > 0) {
        proceduresByType['lumbar_puncture'] = lumbarPunctures.length;
      }

      // Combine recent procedures (mix of both types, sorted by date)
      const recentCombined = [
        ...procedures.slice(0, 3).map(p => ({
          ...p,
          procedure_name: p.procedure_name,
          date_performed: p.date_performed,
          success: p.success,
          type: 'general'
        })),
        ...lumbarPunctures.slice(0, 3).map(lp => ({
          id: lp.id,
          procedure_name: `Punción Lumbar - ${lp.indication}`,
          date_performed: lp.procedure_date,
          success: lp.successful,
          type: 'lumbar_puncture'
        }))
      ].sort((a, b) => new Date(b.date_performed).getTime() - new Date(a.date_performed).getTime())
       .slice(0, 5);

      const stats: UserStatistics = {
        procedures: {
          total: totalProcedures,
          byType: proceduresByType,
          successRate: totalProcedures > 0 ? (totalSuccessful / totalProcedures) * 100 : 0,
          recentProcedures: recentCombined as any, // Type assertion for compatibility
          lumbarPuncturesCount: lumbarPunctures.length,
          lumbarPuncturesSuccessRate: lumbarPunctures.length > 0
            ? (successfulLumbarPunctures / lumbarPunctures.length) * 100
            : 0
        },
        patients: {
          active: patients.filter(p => p.status === 'active').length,
          total: patients.length,
          discharged: patients.filter(p => p.status === 'discharged').length,
          recentPatients: patients.slice(0, 5)
        },
        education: {
          totalHours: classes.reduce((sum, cls) => sum + (cls.duration_hours || 0), 0),
          activitiesByType: classes.reduce((acc, cls) => {
            acc[cls.activity_type] = (acc[cls.activity_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          averageScore: classes.filter(c => c.assessment_score !== undefined).length > 0
            ? classes.filter(c => c.assessment_score !== undefined)
                .reduce((sum, c) => sum + (c.assessment_score || 0), 0) /
              classes.filter(c => c.assessment_score !== undefined).length
            : undefined,
          recentActivities: classes.slice(0, 5)
        },
        goals: {
          total: goals.length,
          completed: goals.filter(g => g.status === 'completed').length,
          inProgress: goals.filter(g => g.status === 'in_progress').length,
          completionRate: goals.length > 0
            ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100
            : 0
        },
        performance: {
          latestReview: reviews[0],
          averageRating: reviews.length > 0 && reviews.some(r => r.overall_rating)
            ? reviews.filter(r => r.overall_rating)
                .reduce((sum, r) => sum + (r.overall_rating || 0), 0) /
              reviews.filter(r => r.overall_rating).length
            : undefined
        }
      };

      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating statistics');
    }
  }, [procedures, lumbarPunctures, patients, classes, reviews, goals, user?.id]);

  // CRUD operations for procedures
  const addProcedure = useCallback(async (data: ProcedureFormData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_procedures')
        .insert([{ ...data, user_id: user.id }]);

      if (error) throw error;
      await loadProcedures();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding procedure');
      return false;
    }
  }, [user?.id, loadProcedures]);

  const updateProcedure = useCallback(async (id: string, data: Partial<UserProcedure>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_procedures')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await loadProcedures();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating procedure');
      return false;
    }
  }, [loadProcedures]);

  const deleteProcedure = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_procedures')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadProcedures();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting procedure');
      return false;
    }
  }, [loadProcedures]);

  // CRUD operations for patients
  const addPatient = useCallback(async (data: PatientFormData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_patients')
        .insert([{ ...data, user_id: user.id, status: 'active' }]);

      if (error) throw error;
      await loadPatients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding patient');
      return false;
    }
  }, [user?.id, loadPatients]);

  const updatePatient = useCallback(async (id: string, data: Partial<UserPatient>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_patients')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await loadPatients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating patient');
      return false;
    }
  }, [loadPatients]);

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPatients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting patient');
      return false;
    }
  }, [loadPatients]);

  const dischargePatient = useCallback(async (id: string, outcome?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_patients')
        .update({
          status: 'discharged',
          date_discharged: new Date().toISOString().split('T')[0],
          outcome
        })
        .eq('id', id);

      if (error) throw error;
      await loadPatients();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error discharging patient');
      return false;
    }
  }, [loadPatients]);

  // CRUD operations for classes
  const addClass = useCallback(async (data: ClassFormData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_classes')
        .insert([{ ...data, user_id: user.id }]);

      if (error) throw error;
      await loadClasses();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding class');
      return false;
    }
  }, [user?.id, loadClasses]);

  const updateClass = useCallback(async (id: string, data: Partial<UserClass>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_classes')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await loadClasses();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating class');
      return false;
    }
  }, [loadClasses]);

  const deleteClass = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadClasses();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting class');
      return false;
    }
  }, [loadClasses]);

  // CRUD operations for goals
  const addGoal = useCallback(async (data: GoalFormData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_goals')
        .insert([{
          ...data,
          user_id: user.id,
          status: 'not_started',
          progress_percentage: 0
        }]);

      if (error) throw error;
      await loadGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding goal');
      return false;
    }
  }, [user?.id, loadGoals]);

  const updateGoal = useCallback(async (id: string, data: Partial<UserGoal>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await loadGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating goal');
      return false;
    }
  }, [loadGoals]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting goal');
      return false;
    }
  }, [loadGoals]);

  const updateGoalProgress = useCallback(async (id: string, progress: number): Promise<boolean> => {
    try {
      const updateData: Partial<UserGoal> = {
        progress_percentage: Math.max(0, Math.min(100, progress))
      };

      if (progress >= 100) {
        updateData.status = 'completed';
        updateData.completion_date = new Date().toISOString().split('T')[0];
      } else if (progress > 0) {
        updateData.status = 'in_progress';
      }

      const { error } = await supabase
        .from('user_goals')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await loadGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating goal progress');
      return false;
    }
  }, [loadGoals]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadProcedures(),
      loadLumbarPunctures(),
      loadPatients(),
      loadClasses(),
      loadReviews(),
      loadGoals(),
      loadResidentProfile()
    ]);
    setLoading(false);
  }, [loadProcedures, loadLumbarPunctures, loadPatients, loadClasses, loadReviews, loadGoals, loadResidentProfile]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, refreshAll]);

  // Update statistics when data changes
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    // Data
    procedures,
    lumbarPunctures,
    patients,
    classes,
    reviews,
    goals,
    residentProfile,
    statistics,

    // Loading states
    loading,
    proceduresLoading,
    lumbarPuncturesLoading,
    patientsLoading,
    classesLoading,
    reviewsLoading,
    goalsLoading,
    profileLoading,

    // Error state
    error,

    // CRUD operations
    addProcedure,
    updateProcedure,
    deleteProcedure,
    addPatient,
    updatePatient,
    deletePatient,
    dischargePatient,
    addClass,
    updateClass,
    deleteClass,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,

    // Data loading functions
    loadProcedures,
    loadLumbarPunctures,
    loadPatients,
    loadClasses,
    loadReviews,
    loadGoals,
    loadResidentProfile,
    loadStatistics,

    // Utility functions
    refreshAll
  };
}