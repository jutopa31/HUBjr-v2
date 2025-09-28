// Types for user tracking system

export interface UserProcedure {
  id?: string;
  user_id: string;
  procedure_type: 'lumbar_puncture' | 'eeg' | 'emg' | 'ultrasound' | 'biopsy' | 'other';
  procedure_name: string;
  patient_name?: string;
  patient_dni?: string;
  date_performed: string; // ISO date string
  success: boolean;
  complications?: string;
  notes?: string;
  learning_points?: string;
  supervisor?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPatient {
  id?: string;
  user_id: string;
  patient_id?: string;
  patient_name: string;
  patient_dni?: string;
  diagnosis?: string;
  date_assigned: string; // ISO date string
  date_discharged?: string;
  status: 'active' | 'discharged' | 'transferred';
  outcome?: string;
  learning_outcomes?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserClass {
  id?: string;
  user_id: string;
  activity_type: 'class' | 'journal_review' | 'presentation' | 'conference' | 'workshop';
  title: string;
  description?: string;
  date_attended: string; // ISO date string
  duration_hours?: number;
  instructor?: string;
  topic?: string;
  assessment_score?: number; // 0-100
  notes?: string;
  certificates?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserReview {
  id?: string;
  user_id: string;
  review_type: 'monthly' | 'quarterly' | 'annual' | 'rotation' | 'case_based';
  reviewer_name: string;
  reviewer_role?: 'attending' | 'chief_resident' | 'program_director';
  period_start?: string;
  period_end?: string;
  overall_rating?: number; // 1-5
  clinical_skills_rating?: number; // 1-5
  knowledge_rating?: number; // 1-5
  professionalism_rating?: number; // 1-5
  strengths?: string;
  areas_for_improvement?: string;
  goals_next_period?: string;
  comments?: string;
  date_reviewed: string; // ISO date string
  created_at?: string;
  updated_at?: string;
}

export interface UserGoal {
  id?: string;
  user_id: string;
  goal_type: 'procedure' | 'knowledge' | 'research' | 'clinical' | 'professional';
  title: string;
  description?: string;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
  progress_percentage: number; // 0-100
  completion_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Statistics interfaces
export interface UserStatistics {
  procedures: {
    total: number;
    byType: Record<string, number>;
    successRate: number;
    recentProcedures: any[]; // Mixed array of procedures and lumbar punctures
    lumbarPuncturesCount?: number;
    lumbarPuncturesSuccessRate?: number;
  };
  patients: {
    active: number;
    total: number;
    discharged: number;
    averageStayDays?: number;
    recentPatients: UserPatient[];
  };
  education: {
    totalHours: number;
    activitiesByType: Record<string, number>;
    averageScore?: number;
    recentActivities: UserClass[];
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  performance: {
    latestReview?: UserReview;
    averageRating?: number;
    trendDirection?: 'improving' | 'stable' | 'declining';
  };
}

// Monthly summary for progress tracking
export interface MonthlyProgress {
  month: string; // YYYY-MM format
  proceduresCount: number;
  patientsCount: number;
  educationHours: number;
  goalsCompleted: number;
  averageRating?: number;
}

// Form data types for creating new entries
export interface ProcedureFormData {
  procedure_type: UserProcedure['procedure_type'];
  procedure_name: string;
  patient_name?: string;
  patient_dni?: string;
  date_performed: string;
  success: boolean;
  complications?: string;
  notes?: string;
  learning_points?: string;
  supervisor?: string;
}

export interface PatientFormData {
  patient_name: string;
  patient_dni?: string;
  diagnosis?: string;
  date_assigned: string;
  notes?: string;
}

export interface ClassFormData {
  activity_type: UserClass['activity_type'];
  title: string;
  description?: string;
  date_attended: string;
  duration_hours?: number;
  instructor?: string;
  topic?: string;
  assessment_score?: number;
  notes?: string;
}

export interface GoalFormData {
  goal_type: UserGoal['goal_type'];
  title: string;
  description?: string;
  target_date?: string;
  priority: UserGoal['priority'];
}

// Filter options for data queries
export interface UserDataFilters {
  dateFrom?: string;
  dateTo?: string;
  procedureType?: UserProcedure['procedure_type'];
  patientStatus?: UserPatient['status'];
  activityType?: UserClass['activity_type'];
  goalStatus?: UserGoal['status'];
  goalType?: UserGoal['goal_type'];
}