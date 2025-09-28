// Types for resident profile system

export interface ResidentProfile {
  id?: string;
  user_id: string;

  // Personal Information
  first_name: string;
  last_name: string;
  dni?: string;
  email: string;
  phone?: string;

  // Training Information
  training_level: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'fellow' | 'attending' | 'intern';
  program_year?: number;
  start_date: string;
  expected_graduation?: string;
  current_rotation?: string;

  // Hospital and Department
  hospital?: string;
  department?: string;
  program_director?: string;
  academic_coordinator?: string;

  // Contact and Emergency
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;

  // Academic Information
  medical_school?: string;
  graduation_year?: number;
  previous_internships?: string[];
  research_interests?: string[];
  publications?: string[];

  // Training Goals and Competencies
  learning_objectives?: string[];
  completed_rotations?: any;
  competency_assessments?: any;

  // Performance Tracking
  procedure_requirements?: any;
  procedure_progress?: any;

  // Profile Settings
  profile_picture_url?: string;
  bio?: string;
  preferred_language?: string;
  timezone?: string;

  // Status
  status?: 'active' | 'on_leave' | 'graduated' | 'transferred' | 'suspended';
  notes?: string;

  created_at?: string;
  updated_at?: string;
}

export interface TrainingMilestone {
  id?: string;
  resident_id: string;
  milestone_type: 'procedure' | 'rotation' | 'exam' | 'research' | 'presentation' | 'competency';
  milestone_name: string;
  description?: string;
  required_for_level?: string;
  target_count?: number;
  deadline_date?: string;
  current_count?: number;
  completion_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'waived';
  supervisor_signature?: string;
  evaluation_notes?: string;
  competency_level?: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
  created_at?: string;
  updated_at?: string;
}

export interface RotationAssignment {
  id?: string;
  resident_id: string;
  rotation_name: string;
  rotation_type?: 'core' | 'elective' | 'subspecialty' | 'research' | 'community';
  location?: string;
  department?: string;
  start_date: string;
  end_date: string;
  attending_supervisor?: string;
  senior_resident_supervisor?: string;
  learning_objectives?: string[];
  evaluation_method?: string;
  final_grade?: string;
  evaluation_comments?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  completion_certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupervisionRelationship {
  id?: string;
  resident_id: string;
  supervisor_name: string;
  supervisor_role?: 'attending' | 'chief_resident' | 'program_director' | 'research_mentor';
  supervisor_email?: string;
  relationship_type?: 'primary' | 'secondary' | 'research' | 'clinical' | 'academic';
  start_date: string;
  end_date?: string;
  meeting_frequency?: string;
  focus_areas?: string[];
  feedback_method?: string;
  status?: 'active' | 'completed' | 'on_hold';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Form data types
export interface ResidentProfileFormData {
  first_name: string;
  last_name: string;
  dni?: string;
  email: string;
  phone?: string;
  training_level: ResidentProfile['training_level'];
  program_year?: number;
  start_date: string;
  expected_graduation?: string;
  current_rotation?: string;
  medical_school?: string;
  graduation_year?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  bio?: string;
}

export interface TrainingMilestoneFormData {
  milestone_type: TrainingMilestone['milestone_type'];
  milestone_name: string;
  description?: string;
  required_for_level?: string;
  target_count?: number;
  deadline_date?: string;
}

export interface RotationAssignmentFormData {
  rotation_name: string;
  rotation_type?: RotationAssignment['rotation_type'];
  location?: string;
  department?: string;
  start_date: string;
  end_date: string;
  attending_supervisor?: string;
  learning_objectives?: string[];
}