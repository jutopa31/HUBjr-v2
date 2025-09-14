// Tipos completos para el Sistema de Examen Físico Neurológico Interactivo
// Sistema modular con validación y generación de reportes automáticos

export type ConsciousnessLevel = 'alert' | 'somnolent' | 'stuporous' | 'coma';
export type AttentionLevel = 'normal' | 'decreased' | 'distractible';
export type VisualField = 'normal' | 'hemianopia' | 'quadrantanopia' | 'scotoma' | 'tunnel_vision';
export type PupilReaction = 'brisk' | 'sluggish' | 'absent' | 'fixed';
export type MotorStrength = 0 | 1 | 2 | 3 | 4 | 5; // Escala MRC 0-5
export type ReflexGrade = 0 | 1 | 2 | 3 | 4; // Escala 0-4+
export type SensoryResponse = 'normal' | 'decreased' | 'absent' | 'increased';
export type CoordinationTest = 'normal' | 'dysmetric' | 'ataxic' | 'unable';

// ==================== ESTADO MENTAL Y COGNITIVO ====================
export interface MentalStateExam {
  consciousness: {
    level: ConsciousnessLevel;
    glasgow_coma_scale?: number;
    orientation: {
      person: boolean;
      place: boolean;
      time: boolean;
    };
  };
  cognition: {
    attention: {
      level: AttentionLevel;
      digit_span: string;
      attention_tests: string;
    };
    memory: {
      immediate_recall: string;
      recent_memory: string;
      remote_memory: string;
      working_memory: string;
    };
    language: {
      fluency: string;
      comprehension: string;
      repetition: string;
      naming: string;
      reading: string;
      writing: string;
    };
    executive_function: {
      abstract_thinking: string;
      judgment: string;
      problem_solving: string;
    };
  };
  mood_affect: {
    mood: string;
    affect: string;
    anxiety_level: string;
  };
  thought: {
    process: string;
    content: string;
    perceptual_disturbances: string;
  };
  insight_judgment: {
    insight: string;
    judgment: string;
  };
}

// ==================== NERVIOS CRANEALES ====================
export interface CranialNervesExam {
  I_olfactory: {
    tested: boolean;
    left: SensoryResponse;
    right: SensoryResponse;
    substances_used: string[];
    notes: string;
  };
  II_optic: {
    visual_acuity: {
      left: string;
      right: string;
      corrected: boolean;
    };
    visual_fields: {
      left: VisualField;
      right: VisualField;
      confrontation_method: boolean;
    };
    pupils: {
      size: { left: number; right: number }; // mm
      shape: { left: string; right: string };
      light_reaction: {
        left: PupilReaction;
        right: PupilReaction;
      };
      accommodation: string;
      relative_afferent_defect: { left: boolean; right: boolean };
    };
    fundoscopy: {
      left: string;
      right: string;
      optic_disc: string;
      vessels: string;
      macula: string;
    };
  };
  III_IV_VI_extraocular: {
    movements: {
      full_range: boolean;
      limitations: string;
      diplopia: boolean;
      diplopia_direction: string;
    };
    nystagmus: {
      present: boolean;
      direction: string;
      type: string;
    };
    ptosis: {
      left: boolean;
      right: boolean;
      severity: string;
    };
    lid_lag: boolean;
  };
  V_trigeminal: {
    motor: {
      jaw_muscles: string;
      jaw_deviation: string;
      jaw_opening: string;
      masseter_strength: string;
    };
    sensory: {
      light_touch: {
        v1_left: SensoryResponse; v1_right: SensoryResponse;
        v2_left: SensoryResponse; v2_right: SensoryResponse;
        v3_left: SensoryResponse; v3_right: SensoryResponse;
      };
      pinprick: {
        v1_left: SensoryResponse; v1_right: SensoryResponse;
        v2_left: SensoryResponse; v2_right: SensoryResponse;
        v3_left: SensoryResponse; v3_right: SensoryResponse;
      };
    };
    reflexes: {
      corneal: { left: string; right: string };
      jaw_jerk: ReflexGrade;
    };
  };
  VII_facial: {
    motor: {
      upper_face: {
        forehead_wrinkles: { left: string; right: string };
        eye_closure: { left: string; right: string };
      };
      lower_face: {
        smile: { left: string; right: string };
        lip_pursing: { left: string; right: string };
        cheek_puff: { left: string; right: string };
      };
      pattern: 'central' | 'peripheral' | 'normal' | 'mixed';
    };
    sensory: {
      taste_anterior_two_thirds: string;
    };
    other: {
      hyperacusis: boolean;
      dry_eye: boolean;
    };
  };
  VIII_vestibulocochlear: {
    hearing: {
      left: string;
      right: string;
      hearing_aids: boolean;
    };
    weber_test: 'midline' | 'left' | 'right' | 'not_tested';
    rinne_test: {
      left: 'positive' | 'negative' | 'not_tested';
      right: 'positive' | 'negative' | 'not_tested';
    };
    vestibular: {
      vertigo: boolean;
      nystagmus: string;
      balance_issues: string;
      head_impulse_test: string;
    };
  };
  IX_X_glossopharyngeal_vagus: {
    palate_elevation: string;
    uvula_deviation: string;
    gag_reflex: string;
    voice_quality: string;
    swallowing: string;
    cough_reflex: string;
  };
  XI_accessory: {
    sternocleidomastoid: {
      left: MotorStrength;
      right: MotorStrength;
    };
    trapezius: {
      left: MotorStrength;
      right: MotorStrength;
    };
    shoulder_shrug: string;
  };
  XII_hypoglossal: {
    tongue_protrusion: string;
    tongue_movements: string;
    tongue_atrophy: string;
    fasciculations: boolean;
  };
}

// ==================== SISTEMA MOTOR ====================
export interface MotorExam {
  inspection: {
    muscle_bulk: {
      upper_limbs: { left: string; right: string };
      lower_limbs: { left: string; right: string };
      trunk: string;
    };
    fasciculations: {
      present: boolean;
      location: string;
      description: string;
    };
    abnormal_movements: {
      tremor: string;
      chorea: string;
      dystonia: string;
      myoclonus: string;
      tics: string;
    };
  };
  tone: {
    upper_limbs: { left: string; right: string };
    lower_limbs: { left: string; right: string };
    neck: string;
    trunk: string;
    rigidity_type: 'cogwheel' | 'lead_pipe' | 'paratonic' | 'none';
    spasticity_pattern: string;
  };
  strength: {
    // Músculos clave por segmento
    cervical: {
      neck_flexion: MotorStrength;
      neck_extension: MotorStrength;
    };
    shoulder: {
      abduction: { left: MotorStrength; right: MotorStrength };
      adduction: { left: MotorStrength; right: MotorStrength };
      flexion: { left: MotorStrength; right: MotorStrength };
      extension: { left: MotorStrength; right: MotorStrength };
    };
    elbow: {
      flexion: { left: MotorStrength; right: MotorStrength };
      extension: { left: MotorStrength; right: MotorStrength };
    };
    wrist: {
      flexion: { left: MotorStrength; right: MotorStrength };
      extension: { left: MotorStrength; right: MotorStrength };
    };
    hand: {
      finger_flexion: { left: MotorStrength; right: MotorStrength };
      finger_extension: { left: MotorStrength; right: MotorStrength };
      thumb_opposition: { left: MotorStrength; right: MotorStrength };
      hand_grip: { left: MotorStrength; right: MotorStrength };
    };
    hip: {
      flexion: { left: MotorStrength; right: MotorStrength };
      extension: { left: MotorStrength; right: MotorStrength };
      abduction: { left: MotorStrength; right: MotorStrength };
      adduction: { left: MotorStrength; right: MotorStrength };
    };
    knee: {
      flexion: { left: MotorStrength; right: MotorStrength };
      extension: { left: MotorStrength; right: MotorStrength };
    };
    ankle: {
      dorsiflexion: { left: MotorStrength; right: MotorStrength };
      plantar_flexion: { left: MotorStrength; right: MotorStrength };
      inversion: { left: MotorStrength; right: MotorStrength };
      eversion: { left: MotorStrength; right: MotorStrength };
    };
    toe: {
      extension: { left: MotorStrength; right: MotorStrength };
      flexion: { left: MotorStrength; right: MotorStrength };
    };
  };
  motor_pattern: {
    upper_motor_neuron_signs: string[];
    lower_motor_neuron_signs: string[];
    distribution: 'proximal' | 'distal' | 'generalized' | 'focal';
  };
}

// ==================== SISTEMA SENSITIVO ====================
export interface SensoryExam {
  primary_sensation: {
    light_touch: {
      face: { left: SensoryResponse; right: SensoryResponse };
      upper_limbs: { left: SensoryResponse; right: SensoryResponse };
      trunk: SensoryResponse;
      lower_limbs: { left: SensoryResponse; right: SensoryResponse };
    };
    pinprick: {
      face: { left: SensoryResponse; right: SensoryResponse };
      upper_limbs: { left: SensoryResponse; right: SensoryResponse };
      trunk: SensoryResponse;
      lower_limbs: { left: SensoryResponse; right: SensoryResponse };
    };
    temperature: {
      upper_limbs: { left: SensoryResponse; right: SensoryResponse };
      lower_limbs: { left: SensoryResponse; right: SensoryResponse };
    };
    vibration: {
      upper_limbs: { left: SensoryResponse; right: SensoryResponse };
      lower_limbs: { left: SensoryResponse; right: SensoryResponse };
    };
    position_sense: {
      upper_limbs: { left: SensoryResponse; right: SensoryResponse };
      lower_limbs: { left: SensoryResponse; right: SensoryResponse };
    };
  };
  cortical_sensation: {
    two_point_discrimination: {
      fingertips: { left: string; right: string };
      palm: { left: string; right: string };
    };
    stereognosis: { left: string; right: string };
    graphesthesia: { left: string; right: string };
    extinction: string;
    localization: string;
  };
  sensory_level: {
    present: boolean;
    level: string;
    type: 'complete' | 'incomplete' | 'dissociated';
  };
}

// ==================== REFLEJOS ====================
export interface ReflexExam {
  deep_tendon_reflexes: {
    biceps: { left: ReflexGrade; right: ReflexGrade };
    triceps: { left: ReflexGrade; right: ReflexGrade };
    brachioradialis: { left: ReflexGrade; right: ReflexGrade };
    patellar: { left: ReflexGrade; right: ReflexGrade };
    achilles: { left: ReflexGrade; right: ReflexGrade };
  };
  pathological_reflexes: {
    babinski: { left: 'flexor' | 'extensor' | 'equivocal'; right: 'flexor' | 'extensor' | 'equivocal' };
    chaddock: { left: string; right: string };
    oppenheim: { left: string; right: string };
    gordon: { left: string; right: string };
    hoffman: { left: 'positive' | 'negative'; right: 'positive' | 'negative' };
    clonus: {
      ankle: { left: string; right: string };
      patella: { left: string; right: string };
    };
  };
  superficial_reflexes: {
    abdominal: {
      upper: { left: string; right: string };
      lower: { left: string; right: string };
    };
    cremasteric: { left: string; right: string };
    anal_wink: string;
  };
  primitive_reflexes: {
    glabellar: string;
    snout: string;
    palmomental: { left: string; right: string };
    grasp: { left: string; right: string };
  };
}

// ==================== COORDINACIÓN Y EQUILIBRIO ====================
export interface CoordinationExam {
  appendicular: {
    finger_to_nose: { left: CoordinationTest; right: CoordinationTest };
    finger_to_finger: CoordinationTest;
    heel_to_shin: { left: CoordinationTest; right: CoordinationTest };
    rapid_alternating_movements: {
      hands: { left: CoordinationTest; right: CoordinationTest };
      feet: { left: CoordinationTest; right: CoordinationTest };
    };
    point_to_point: { left: CoordinationTest; right: CoordinationTest };
  };
  truncal: {
    sitting_balance: CoordinationTest;
    standing_balance: CoordinationTest;
    trunk_stability: string;
  };
  equilibrium_tests: {
    romberg_test: {
      eyes_open: 'stable' | 'unstable' | 'falls';
      eyes_closed: 'stable' | 'unstable' | 'falls';
      duration: number; // seconds
    };
    tandem_romberg: string;
    single_leg_stand: { left: string; right: string };
  };
}

// ==================== MARCHA Y POSTURA ====================
export interface GaitExam {
  casual_gait: {
    initiation: 'normal' | 'hesitation' | 'freezing';
    base: 'narrow' | 'normal' | 'wide';
    speed: 'normal' | 'slow' | 'fast' | 'variable';
    stride_length: 'normal' | 'short' | 'long' | 'variable';
    arm_swing: 'normal' | 'reduced' | 'asymmetric' | 'absent';
    turning: 'smooth' | 'en_bloc' | 'unstable';
    line_deviation: boolean;
  };
  specialized_gait_tests: {
    tandem_walk: CoordinationTest;
    heel_walk: CoordinationTest;
    toe_walk: CoordinationTest;
    duck_walk: CoordinationTest;
    high_step_walk: CoordinationTest;
  };
  postural_stability: {
    pull_test: 'normal' | 'retropulsion' | 'propulsion' | 'falls';
    nudge_test: string;
    postural_reflexes: string;
  };
  gait_pattern: {
    type: 'normal' | 'hemiplegic' | 'spastic' | 'ataxic' | 'parkinsonian' | 'steppage' | 'waddling' | 'antalgic';
    description: string;
  };
}

// ==================== EXAMEN COMPLETO ====================
export interface NeurologicalExamData {
  exam_id: string;
  patient_id?: string;
  examiner: string;
  exam_date: string;
  exam_type: 'complete' | 'focused_stroke' | 'focused_movement' | 'focused_cognitive' | 'focused_neuropathy';
  
  // Secciones del examen
  mental_state: MentalStateExam;
  cranial_nerves: CranialNervesExam;
  motor_system: MotorExam;
  sensory_system: SensoryExam;
  reflexes: ReflexExam;
  coordination: CoordinationExam;
  gait: GaitExam;
  
  // Metadatos del examen
  exam_metadata: {
    sections_completed: string[];
    completion_percentage: number;
    total_time: number; // minutes
    validated: boolean;
    validation_warnings: string[];
  };
  
  // Notas adicionales
  general_observations: string;
  additional_tests: string;
  clinical_impression: string;
  recommendations: string[];
}

// ==================== CONFIGURACIÓN Y PLANTILLAS ====================
export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  required_sections: string[];
  optional_sections: string[];
  specialized_questions: Record<string, any>;
  validation_rules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  description: string;
  condition: string;
  action: 'warning' | 'error' | 'suggestion';
  message: string;
}

// ==================== GENERACIÓN DE REPORTES ====================
export interface ExamReport {
  patient_info: {
    name: string;
    age: number;
    gender: string;
    medical_record: string;
  };
  exam_metadata: {
    exam_date: string;
    examiner: string;
    exam_type: string;
    duration: number;
  };
  
  findings: {
    mental_state: string;
    cranial_nerves: string;
    motor_system: string;
    sensory_system: string;
    reflexes: string;
    coordination: string;
    gait: string;
  };
  
  summary: {
    normal_findings: string[];
    abnormal_findings: string[];
    clinical_impression: string;
    differential_diagnosis: string[];
    recommendations: string[];
  };
  
  structured_data: NeurologicalExamData;
  completeness_score: number;
  validation_status: 'complete' | 'incomplete' | 'warnings';
}

// ==================== ESTADOS Y PROGRESO ====================
export interface ExamProgress {
  current_section: string;
  sections_completed: string[];
  total_sections: number;
  completion_percentage: number;
  estimated_time_remaining: number;
}

export interface ExamQuestion {
  id: string;
  section: string;
  subsection: string;
  question: string;
  type: 'select' | 'multiselect' | 'number' | 'text' | 'boolean' | 'scale';
  options?: string[];
  required: boolean;
  validation?: ValidationRule[];
  help_text?: string;
  clinical_significance?: string;
}

// ==================== SERVICIOS ====================
export interface NeurologicalExamService {
  createNewExam(examType: string, patientId?: string): NeurologicalExamData;
  saveExam(examData: NeurologicalExamData): Promise<boolean>;
  loadExam(examId: string): Promise<NeurologicalExamData | null>;
  validateExam(examData: NeurologicalExamData): ValidationResult;
  generateReport(examData: NeurologicalExamData): ExamReport;
  getExamProgress(examData: NeurologicalExamData): ExamProgress;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  completeness_score: number;
}

// ==================== EXPORTS PRINCIPALES ====================
export default NeurologicalExamData;