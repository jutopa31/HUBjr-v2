// TypeScript types for lumbar puncture management system

export interface LumbarPuncture {
  id: string;
  resident_id: string;
  patient_id?: string;
  patient_initials: string;
  patient_age?: number;
  patient_gender?: 'M' | 'F' | 'Other';

  // Procedure details
  procedure_date: string; // ISO date string
  procedure_time?: string; // HH:MM format
  indication: string;
  supervisor: string;
  trainee_role?: 'observer' | 'assisted' | 'performed_supervised' | 'performed_independent';

  // Pre-procedure
  contraindications_checked: boolean;
  informed_consent: boolean;
  platelet_count?: number;
  inr_value?: number;

  // Procedure technique
  patient_position?: 'lateral_decubitus' | 'sitting' | 'prone';
  needle_level?: 'L2-L3' | 'L3-L4' | 'L4-L5' | 'L5-S1' | 'other';
  needle_gauge?: '20G' | '22G' | '25G' | 'other';
  needle_type?: 'quincke' | 'sprotte' | 'whitacre' | 'other';
  local_anesthetic?: string;

  // Procedure outcomes
  successful: boolean;
  attempts_count: number;
  bloody_tap: boolean;
  traumatic_tap: boolean;
  dry_tap: boolean;

  // Opening pressure
  opening_pressure_measured: boolean;
  opening_pressure_value?: number; // in cmH2O
  opening_pressure_notes?: string;

  // CSF analysis
  csf_appearance?: 'clear' | 'cloudy' | 'turbid' | 'bloody' | 'xanthochromic';
  csf_volume_collected?: number; // in mL

  // Laboratory results
  csf_white_cells?: number; // cells/μL
  csf_red_cells?: number; // cells/μL
  csf_protein?: number; // mg/dL
  csf_glucose?: number; // mg/dL
  serum_glucose?: number; // mg/dL
  csf_lactate?: number; // mmol/L

  // Microbiology
  gram_stain_result?: string;
  culture_sent: boolean;
  pcr_tests_sent: string[];
  antigen_tests_sent: string[];

  // Special studies
  cytology_sent: boolean;
  flow_cytometry_sent: boolean;
  oligoclonal_bands_sent: boolean;

  // Complications
  headache_post_lp: boolean;
  headache_severity?: number; // 1-10 scale
  nausea_vomiting: boolean;
  back_pain: boolean;
  bleeding: boolean;
  infection: boolean;
  other_complications?: string;

  // Follow-up
  patient_discharge_same_day: boolean;
  follow_up_required: boolean;
  follow_up_notes?: string;

  // Educational value
  learning_objectives_met?: string;
  supervisor_feedback?: string;
  resident_reflection?: string;
  technical_difficulty?: number; // 1-5 scale

  // Clinical context
  primary_diagnosis?: string;
  differential_diagnosis: string[];
  clinical_question?: string;

  // Administrative
  procedure_location: string;
  assistance_required: string[];
  equipment_issues?: string;

  created_at: string;
  updated_at: string;
}

export interface CSFAnalysisResults {
  id: string;
  lumbar_puncture_id: string;

  // Detailed cell counts
  lymphocytes?: number; // cells/μL
  neutrophils?: number; // cells/μL
  monocytes?: number; // cells/μL
  eosinophils?: number; // cells/μL

  // Additional chemistry
  csf_chloride?: number; // mEq/L
  csf_albumin?: number; // mg/dL
  csf_igg?: number; // mg/dL
  albumin_ratio?: number; // CSF/serum albumin ratio
  igg_index?: number;

  // Specific markers
  tau_protein?: number; // pg/mL
  phospho_tau?: number; // pg/mL
  amyloid_beta_42?: number; // pg/mL
  amyloid_beta_40?: number; // pg/mL

  // Infectious markers
  bacterial_antigen_results?: Record<string, any>;
  viral_pcr_results?: Record<string, any>;
  fungal_studies?: Record<string, any>;

  // Final interpretation
  laboratory_interpretation?: string;
  clinically_significant?: boolean;

  created_at: string;
}

export interface LPComplication {
  id: string;
  lumbar_puncture_id: string;

  complication_type: 'post_dural_puncture_headache' | 'cerebral_herniation' | 'bleeding' | 'infection' | 'nerve_root_injury' | 'failed_procedure' | 'other';
  severity?: 'mild' | 'moderate' | 'severe';
  onset_time?: string; // ISO duration string
  duration?: string; // ISO duration string
  treatment_required: boolean;
  treatment_details?: string;
  resolution_status?: 'resolved' | 'ongoing' | 'chronic';

  reported_to_supervisor: boolean;
  incident_report_filed: boolean;

  description: string;
  created_at: string;
}

// Form data types for creating/editing
export interface LumbarPunctureFormData {
  patient_initials: string;
  patient_age?: number;
  patient_gender?: 'M' | 'F' | 'Other';
  procedure_date: string;
  procedure_time?: string;
  indication: string;
  supervisor: string;
  trainee_role?: 'observer' | 'assisted' | 'performed_supervised' | 'performed_independent';

  // Pre-procedure checklist
  contraindications_checked: boolean;
  informed_consent: boolean;
  platelet_count?: number;
  inr_value?: number;

  // Technique
  patient_position?: 'lateral_decubitus' | 'sitting' | 'prone';
  needle_level?: 'L2-L3' | 'L3-L4' | 'L4-L5' | 'L5-S1' | 'other';
  needle_gauge?: '20G' | '22G' | '25G' | 'other';
  needle_type?: 'quincke' | 'sprotte' | 'whitacre' | 'other';
  local_anesthetic: string;

  // Outcomes
  successful: boolean;
  attempts_count: number;
  bloody_tap: boolean;
  traumatic_tap: boolean;
  dry_tap: boolean;

  // Opening pressure
  opening_pressure_measured: boolean;
  opening_pressure_value?: number;
  opening_pressure_notes?: string;

  // CSF
  csf_appearance?: 'clear' | 'cloudy' | 'turbid' | 'bloody' | 'xanthochromic';
  csf_volume_collected?: number;

  // Basic lab results
  csf_white_cells?: number;
  csf_red_cells?: number;
  csf_protein?: number;
  csf_glucose?: number;
  serum_glucose?: number;
  csf_lactate?: number;

  // Microbiology
  gram_stain_result?: string;
  culture_sent: boolean;
  pcr_tests_sent: string[];
  antigen_tests_sent: string[];

  // Special studies
  cytology_sent: boolean;
  flow_cytometry_sent: boolean;
  oligoclonal_bands_sent: boolean;

  // Complications
  headache_post_lp: boolean;
  headache_severity?: number;
  nausea_vomiting: boolean;
  back_pain: boolean;
  bleeding: boolean;
  infection: boolean;
  other_complications?: string;

  // Follow-up
  patient_discharge_same_day: boolean;
  follow_up_required: boolean;
  follow_up_notes?: string;

  // Educational
  learning_objectives_met?: string;
  supervisor_feedback?: string;
  resident_reflection?: string;
  technical_difficulty?: number;

  // Clinical context
  primary_diagnosis?: string;
  differential_diagnosis: string[];
  clinical_question?: string;

  // Administrative
  procedure_location: string;
  assistance_required: string[];
  equipment_issues?: string;
}

export interface CSFAnalysisFormData {
  lumbar_puncture_id: string;

  // Detailed cell counts
  lymphocytes?: number;
  neutrophils?: number;
  monocytes?: number;
  eosinophils?: number;

  // Additional chemistry
  csf_chloride?: number;
  csf_albumin?: number;
  csf_igg?: number;
  albumin_ratio?: number;
  igg_index?: number;

  // Biomarkers
  tau_protein?: number;
  phospho_tau?: number;
  amyloid_beta_42?: number;
  amyloid_beta_40?: number;

  // Results
  bacterial_antigen_results?: Record<string, any>;
  viral_pcr_results?: Record<string, any>;
  fungal_studies?: Record<string, any>;

  laboratory_interpretation?: string;
  clinically_significant?: boolean;
}

export interface LPComplicationFormData {
  lumbar_puncture_id: string;
  complication_type: 'post_dural_puncture_headache' | 'cerebral_herniation' | 'bleeding' | 'infection' | 'nerve_root_injury' | 'failed_procedure' | 'other';
  severity?: 'mild' | 'moderate' | 'severe';
  onset_time?: string;
  duration?: string;
  treatment_required: boolean;
  treatment_details?: string;
  resolution_status?: 'resolved' | 'ongoing' | 'chronic';
  reported_to_supervisor: boolean;
  incident_report_filed: boolean;
  description: string;
}

// Statistics and analytics types
export interface LPStats {
  total_procedures: number;
  successful_procedures: number;
  success_rate: number;
  complications_count: number;
  average_attempts: number;
  most_common_indication?: string;
}

export interface MonthlyLPStats {
  month_year: string;
  total_lps: number;
  successful_lps: number;
  success_rate: number;
}

export interface LPAnalytics {
  overall_stats: LPStats;
  monthly_stats: MonthlyLPStats[];
  indication_breakdown: { indication: string; count: number; success_rate: number }[];
  complication_rates: { complication_type: string; count: number; percentage: number }[];
  difficulty_trends: { difficulty: number; count: number; success_rate: number }[];
  supervisor_stats: { supervisor: string; procedures: number; avg_success_rate: number }[];
}

// Filter and search types
export interface LPFilters {
  date_from?: string;
  date_to?: string;
  indication?: string;
  supervisor?: string;
  successful?: boolean;
  complication_type?: string;
  trainee_role?: string;
  technical_difficulty?: number;
}

export interface LPSearchParams {
  search?: string; // Free text search
  filters?: LPFilters;
  sort_by?: 'procedure_date' | 'created_at' | 'success_rate' | 'technical_difficulty';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Common indication options
export const COMMON_LP_INDICATIONS = [
  'Sospecha de meningitis',
  'Sospecha de encefalitis',
  'Sospecha de hemorragia subaracnoidea',
  'Evaluación de esclerosis múltiple',
  'Pseudotumor cerebri',
  'Hidrocefalia normotensiva',
  'Meningitis carcinomatosa',
  'Enfermedad inflamatoria del SNC',
  'Lupus neuropsiquiátrico',
  'Encefalitis autoinmune',
  'Polineuropatía desmielinizante inflamatoria crónica (CIDP)',
  'Síndrome de Guillain-Barré',
  'Linfoma del SNC',
  'Biomarcadores de enfermedad de Alzheimer',
  'Evaluación de demencia frontotemporal',
  'Anestesia raquídea',
  'Quimioterapia intratecal',
  'Protocolo de investigación',
  'Otro'
] as const;

// PCR test options
export const PCR_TEST_OPTIONS = [
  'HSV-1/2',
  'VZV',
  'CMV',
  'EBV',
  'Enterovirus',
  'Parechovirus',
  'Virus del Nilo Occidental',
  'Encefalitis Equina Oriental',
  'Panel respiratorio',
  'Panel fúngico',
  'Mycobacterium tuberculosis',
  'Borrelia burgdorferi',
  'Anticuerpos receptor NMDA',
  'Panel encefalitis autoinmune',
  'Bandas oligoclonales'
] as const;

// Antigen test options
export const ANTIGEN_TEST_OPTIONS = [
  'Streptococcus pneumoniae',
  'Neisseria meningitidis',
  'Haemophilus influenzae tipo b',
  'Streptococcus grupo B',
  'Antígeno criptocócico',
  'Antígeno de histoplasma'
] as const;