// Servicio Principal para el Sistema de Examen Físico Neurológico Interactivo
// Maneja creación, validación, guardado y generación de reportes

import { 
  NeurologicalExamData, 
  ExamTemplate, 
  ValidationResult, 
  ExamReport, 
  ExamProgress,
  MentalStateExam,
  CranialNervesExam,
  MotorExam,
  SensoryExam,
  ReflexExam,
  CoordinationExam,
  GaitExam
} from '../types/neurologicalExamTypes';

export class NeurologicalExamService {
  
  // ==================== CREACIÓN Y GESTIÓN DE EXÁMENES ====================
  
  /**
   * Crea un nuevo examen neurológico con valores por defecto
   * @param examType - Tipo de examen a crear
   * @param patientId - ID del paciente (opcional)
   * @param examiner - Nombre del examinador
   * @returns Nueva instancia de examen neurológico
   */
  createNewExam(
    examType: 'complete' | 'focused_stroke' | 'focused_movement' | 'focused_cognitive' | 'focused_neuropathy' = 'complete',
    patientId?: string,
    examiner: string = 'Dr. Usuario'
  ): NeurologicalExamData {
    
    const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      exam_id: examId,
      patient_id: patientId,
      examiner: examiner,
      exam_date: new Date().toISOString(),
      exam_type: examType,
      
      // Inicializar todas las secciones con valores por defecto
      mental_state: this.createDefaultMentalState(),
      cranial_nerves: this.createDefaultCranialNerves(),
      motor_system: this.createDefaultMotorExam(),
      sensory_system: this.createDefaultSensoryExam(),
      reflexes: this.createDefaultReflexExam(),
      coordination: this.createDefaultCoordinationExam(),
      gait: this.createDefaultGaitExam(),
      
      exam_metadata: {
        sections_completed: [],
        completion_percentage: 0,
        total_time: 0,
        validated: false,
        validation_warnings: []
      },
      
      general_observations: '',
      additional_tests: '',
      clinical_impression: '',
      recommendations: []
    };
  }

  // ==================== PLANTILLAS DE EXAMEN ====================
  
  /**
   * Obtiene las plantillas de examen disponibles
   * @returns Array de plantillas de examen
   */
  getExamTemplates(): ExamTemplate[] {
    return [
      {
        id: 'complete',
        name: 'Examen Neurológico Completo',
        description: 'Evaluación neurológica exhaustiva de todos los sistemas',
        required_sections: ['mental_state', 'cranial_nerves', 'motor_system', 'sensory_system', 'reflexes', 'coordination', 'gait'],
        optional_sections: [],
        specialized_questions: {},
        validation_rules: []
      },
      {
        id: 'focused_stroke',
        name: 'Evaluación Focalizada - Stroke',
        description: 'Examen orientado a déficits neurológicos focales y NIHSS',
        required_sections: ['mental_state', 'cranial_nerves', 'motor_system', 'coordination'],
        optional_sections: ['sensory_system', 'reflexes', 'gait'],
        specialized_questions: {
          emphasize_nihss: true,
          detailed_language_assessment: true,
          visual_field_testing: true
        },
        validation_rules: []
      },
      {
        id: 'focused_movement',
        name: 'Evaluación Focalizada - Trastornos del Movimiento',
        description: 'Examen detallado del sistema motor y coordinación',
        required_sections: ['motor_system', 'coordination', 'gait'],
        optional_sections: ['mental_state', 'cranial_nerves', 'reflexes'],
        specialized_questions: {
          detailed_tremor_assessment: true,
          rigidity_assessment: true,
          bradykinesia_tests: true,
          postural_stability: true
        },
        validation_rules: []
      },
      {
        id: 'focused_cognitive',
        name: 'Evaluación Focalizada - Cognitiva',
        description: 'Examen exhaustivo del estado mental y funciones cognitivas',
        required_sections: ['mental_state'],
        optional_sections: ['cranial_nerves', 'motor_system', 'coordination'],
        specialized_questions: {
          detailed_memory_testing: true,
          executive_function_tests: true,
          language_assessment: true,
          visuospatial_testing: true
        },
        validation_rules: []
      },
      {
        id: 'focused_neuropathy',
        name: 'Evaluación Focalizada - Neuropatía',
        description: 'Examen orientado a sistemas sensitivo y motor periférico',
        required_sections: ['sensory_system', 'motor_system', 'reflexes'],
        optional_sections: ['cranial_nerves', 'coordination', 'gait'],
        specialized_questions: {
          detailed_sensory_testing: true,
          distal_strength_assessment: true,
          vibration_testing: true,
          autonomic_assessment: true
        },
        validation_rules: []
      }
    ];
  }

  // ==================== PROGRESO Y NAVEGACIÓN ====================
  
  /**
   * Calcula el progreso actual del examen
   * @param examData - Datos del examen
   * @returns Progreso del examen
   */
  getExamProgress(examData: NeurologicalExamData): ExamProgress {
    const allSections = ['mental_state', 'cranial_nerves', 'motor_system', 'sensory_system', 'reflexes', 'coordination', 'gait'];
    const completedSections = examData.exam_metadata.sections_completed;
    const completionPercentage = (completedSections.length / allSections.length) * 100;
    
    // Estimar tiempo restante basado en progreso actual
    const avgTimePerSection = 8; // minutos promedio por sección
    const remainingSections = allSections.length - completedSections.length;
    const estimatedTimeRemaining = remainingSections * avgTimePerSection;
    
    return {
      current_section: this.getCurrentSection(examData),
      sections_completed: completedSections,
      total_sections: allSections.length,
      completion_percentage: Math.round(completionPercentage),
      estimated_time_remaining: estimatedTimeRemaining
    };
  }

  /**
   * Determina la sección actual basada en el progreso
   * @param examData - Datos del examen
   * @returns Nombre de la sección actual
   */
  getCurrentSection(examData: NeurologicalExamData): string {
    const sections = ['mental_state', 'cranial_nerves', 'motor_system', 'sensory_system', 'reflexes', 'coordination', 'gait'];
    const completed = examData.exam_metadata.sections_completed;
    
    for (const section of sections) {
      if (!completed.includes(section)) {
        return section;
      }
    }
    
    return 'completed';
  }

  // ==================== VALIDACIÓN ====================
  
  /**
   * Valida la consistencia y completitud del examen
   * @param examData - Datos del examen a validar
   * @returns Resultado de validación
   */
  validateExam(examData: NeurologicalExamData): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Validaciones de consistencia clínica
    this.validateClinicalConsistency(examData, warnings, suggestions);
    
    // Validaciones de completitud
    const completeness = this.calculateCompleteness(examData);
    
    // Validaciones específicas por tipo de examen
    this.validateByExamType(examData, errors);
    
    return {
      valid: errors.length === 0,
      warnings,
      errors,
      suggestions,
      completeness_score: completeness
    };
  }

  /**
   * Valida consistencia clínica entre hallazgos
   */
  private validateClinicalConsistency(examData: NeurologicalExamData, warnings: string[], suggestions: string[]): void {
    // Ejemplo: Si hay debilidad unilateral, verificar reflejos del mismo lado
    // Esta lógica se expandirá con más reglas clínicas
    
    if (examData.motor_system && examData.reflexes) {
      // Verificar correlación entre fuerza y reflejos
      // (Implementación simplificada - se expandirá)
      suggestions.push('Verificar correlación entre hallazgos motores y reflejos');
    }
    
    if (examData.mental_state.consciousness.level !== 'alert') {
      warnings.push('Nivel de conciencia alterado - verificar confiabilidad de otros hallazgos');
    }
  }

  /**
   * Calcula el porcentaje de completitud del examen
   */
  private calculateCompleteness(examData: NeurologicalExamData): number {
    // Lógica simplificada - se expandirá para evaluar cada sección
    const sections = examData.exam_metadata.sections_completed;
    const totalSections = 7; // mental_state, cranial_nerves, motor, sensory, reflexes, coordination, gait
    
    return Math.round((sections.length / totalSections) * 100);
  }

  /**
   * Validaciones específicas según tipo de examen
   */
  private validateByExamType(examData: NeurologicalExamData, errors: string[]): void {
    const template = this.getExamTemplates().find(t => t.id === examData.exam_type);
    
    if (template) {
      for (const requiredSection of template.required_sections) {
        if (!examData.exam_metadata.sections_completed.includes(requiredSection)) {
          errors.push(`Sección requerida '${requiredSection}' no completada para examen tipo '${examData.exam_type}'`);
        }
      }
    }
  }

  // ==================== GUARDADO Y CARGA ====================
  
  /**
   * Guarda el examen en el sistema de almacenamiento
   * @param examData - Datos del examen a guardar
   * @returns Promise<boolean> - Éxito del guardado
   */
  async saveExam(examData: NeurologicalExamData): Promise<boolean> {
    try {
      // Por ahora usamos localStorage, después se migrará a Supabase
      const examKey = `neurological_exam_${examData.exam_id}`;
      localStorage.setItem(examKey, JSON.stringify(examData));
      
      // También guardar en índice de exámenes
      const existingExams = this.getExamIndex();
      const examIndex = {
        exam_id: examData.exam_id,
        patient_id: examData.patient_id,
        examiner: examData.examiner,
        exam_date: examData.exam_date,
        exam_type: examData.exam_type,
        completion_percentage: examData.exam_metadata.completion_percentage
      };
      
      const updatedIndex = existingExams.filter(e => e.exam_id !== examData.exam_id);
      updatedIndex.push(examIndex);
      localStorage.setItem('neurological_exams_index', JSON.stringify(updatedIndex));
      
      console.log(`✅ Examen ${examData.exam_id} guardado exitosamente`);
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando examen:', error);
      return false;
    }
  }

  /**
   * Carga un examen desde el almacenamiento
   * @param examId - ID del examen a cargar
   * @returns Promise<NeurologicalExamData | null>
   */
  async loadExam(examId: string): Promise<NeurologicalExamData | null> {
    try {
      const examKey = `neurological_exam_${examId}`;
      const savedData = localStorage.getItem(examKey);
      
      if (savedData) {
        return JSON.parse(savedData) as NeurologicalExamData;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error cargando examen:', error);
      return null;
    }
  }

  /**
   * Obtiene el índice de exámenes guardados
   */
  getExamIndex(): any[] {
    try {
      const index = localStorage.getItem('neurological_exams_index');
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('❌ Error cargando índice de exámenes:', error);
      return [];
    }
  }

  // ==================== GENERACIÓN DE REPORTES ====================
  
  /**
   * Genera un reporte estructurado del examen
   * @param examData - Datos del examen
   * @returns Reporte completo del examen
   */
  generateReport(examData: NeurologicalExamData): ExamReport {
    return {
      patient_info: {
        name: 'Paciente',
        age: 0,
        gender: 'No especificado',
        medical_record: examData.patient_id || 'Sin especificar'
      },
      exam_metadata: {
        exam_date: new Date(examData.exam_date).toLocaleDateString(),
        examiner: examData.examiner,
        exam_type: examData.exam_type,
        duration: examData.exam_metadata.total_time
      },
      findings: {
        mental_state: this.summarizeMentalState(examData.mental_state),
        cranial_nerves: this.summarizeCranialNerves(examData.cranial_nerves),
        motor_system: this.summarizeMotorSystem(examData.motor_system),
        sensory_system: this.summarizeSensorySystem(examData.sensory_system),
        reflexes: this.summarizeReflexes(examData.reflexes),
        coordination: this.summarizeCoordination(examData.coordination),
        gait: this.summarizeGait(examData.gait)
      },
      summary: {
        normal_findings: [],
        abnormal_findings: [],
        clinical_impression: examData.clinical_impression,
        differential_diagnosis: [],
        recommendations: examData.recommendations
      },
      structured_data: examData,
      completeness_score: this.calculateCompleteness(examData),
      validation_status: this.validateExam(examData).valid ? 'complete' : 'incomplete'
    };
  }

  // ==================== VALORES POR DEFECTO ====================
  
  private createDefaultMentalState(): MentalStateExam {
    return {
      consciousness: {
        level: 'alert',
        orientation: { person: true, place: true, time: true }
      },
      cognition: {
        attention: { level: 'normal', digit_span: '', attention_tests: '' },
        memory: { immediate_recall: '', recent_memory: '', remote_memory: '', working_memory: '' },
        language: { fluency: '', comprehension: '', repetition: '', naming: '', reading: '', writing: '' },
        executive_function: { abstract_thinking: '', judgment: '', problem_solving: '' }
      },
      mood_affect: { mood: '', affect: '', anxiety_level: '' },
      thought: { process: '', content: '', perceptual_disturbances: '' },
      insight_judgment: { insight: '', judgment: '' }
    };
  }

  private createDefaultCranialNerves(): CranialNervesExam {
    return {
      I_olfactory: { tested: false, left: 'normal', right: 'normal', substances_used: [], notes: '' },
      II_optic: {
        visual_acuity: { left: '20/20', right: '20/20', corrected: false },
        visual_fields: { left: 'normal', right: 'normal', confrontation_method: true },
        pupils: {
          size: { left: 3, right: 3 },
          shape: { left: 'round', right: 'round' },
          light_reaction: { left: 'brisk', right: 'brisk' },
          accommodation: 'normal',
          relative_afferent_defect: { left: false, right: false }
        },
        fundoscopy: { left: 'normal', right: 'normal', optic_disc: 'normal', vessels: 'normal', macula: 'normal' }
      },
      III_IV_VI_extraocular: {
        movements: { full_range: true, limitations: 'none', diplopia: false, diplopia_direction: '' },
        nystagmus: { present: false, direction: '', type: '' },
        ptosis: { left: false, right: false, severity: '' },
        lid_lag: false
      },
      V_trigeminal: {
        motor: { jaw_muscles: 'normal', jaw_deviation: 'none', jaw_opening: 'normal', masseter_strength: 'normal' },
        sensory: {
          light_touch: { v1_left: 'normal', v1_right: 'normal', v2_left: 'normal', v2_right: 'normal', v3_left: 'normal', v3_right: 'normal' },
          pinprick: { v1_left: 'normal', v1_right: 'normal', v2_left: 'normal', v2_right: 'normal', v3_left: 'normal', v3_right: 'normal' }
        },
        reflexes: { corneal: { left: 'present', right: 'present' }, jaw_jerk: 2 }
      },
      VII_facial: {
        motor: {
          upper_face: { forehead_wrinkles: { left: 'normal', right: 'normal' }, eye_closure: { left: 'normal', right: 'normal' } },
          lower_face: { smile: { left: 'normal', right: 'normal' }, lip_pursing: { left: 'normal', right: 'normal' }, cheek_puff: { left: 'normal', right: 'normal' } },
          pattern: 'normal'
        },
        sensory: { taste_anterior_two_thirds: 'normal' },
        other: { hyperacusis: false, dry_eye: false }
      },
      VIII_vestibulocochlear: {
        hearing: { left: 'normal', right: 'normal', hearing_aids: false },
        weber_test: 'midline',
        rinne_test: { left: 'positive', right: 'positive' },
        vestibular: { vertigo: false, nystagmus: 'absent', balance_issues: 'none', head_impulse_test: 'normal' }
      },
      IX_X_glossopharyngeal_vagus: {
        palate_elevation: 'symmetric',
        uvula_deviation: 'none',
        gag_reflex: 'present',
        voice_quality: 'normal',
        swallowing: 'normal',
        cough_reflex: 'present'
      },
      XI_accessory: {
        sternocleidomastoid: { left: 5, right: 5 },
        trapezius: { left: 5, right: 5 },
        shoulder_shrug: 'symmetric'
      },
      XII_hypoglossal: {
        tongue_protrusion: 'midline',
        tongue_movements: 'normal',
        tongue_atrophy: 'none',
        fasciculations: false
      }
    };
  }

  private createDefaultMotorExam(): MotorExam {
    return {
      inspection: {
        muscle_bulk: { upper_limbs: { left: 'normal', right: 'normal' }, lower_limbs: { left: 'normal', right: 'normal' }, trunk: 'normal' },
        fasciculations: { present: false, location: '', description: '' },
        abnormal_movements: { tremor: 'none', chorea: 'none', dystonia: 'none', myoclonus: 'none', tics: 'none' }
      },
      tone: {
        upper_limbs: { left: 'normal', right: 'normal' },
        lower_limbs: { left: 'normal', right: 'normal' },
        neck: 'normal',
        trunk: 'normal',
        rigidity_type: 'none',
        spasticity_pattern: 'none'
      },
      strength: {
        cervical: { neck_flexion: 5, neck_extension: 5 },
        shoulder: { abduction: { left: 5, right: 5 }, adduction: { left: 5, right: 5 }, flexion: { left: 5, right: 5 }, extension: { left: 5, right: 5 } },
        elbow: { flexion: { left: 5, right: 5 }, extension: { left: 5, right: 5 } },
        wrist: { flexion: { left: 5, right: 5 }, extension: { left: 5, right: 5 } },
        hand: { finger_flexion: { left: 5, right: 5 }, finger_extension: { left: 5, right: 5 }, thumb_opposition: { left: 5, right: 5 }, hand_grip: { left: 5, right: 5 } },
        hip: { flexion: { left: 5, right: 5 }, extension: { left: 5, right: 5 }, abduction: { left: 5, right: 5 }, adduction: { left: 5, right: 5 } },
        knee: { flexion: { left: 5, right: 5 }, extension: { left: 5, right: 5 } },
        ankle: { dorsiflexion: { left: 5, right: 5 }, plantar_flexion: { left: 5, right: 5 }, inversion: { left: 5, right: 5 }, eversion: { left: 5, right: 5 } },
        toe: { extension: { left: 5, right: 5 }, flexion: { left: 5, right: 5 } }
      },
      motor_pattern: {
        upper_motor_neuron_signs: [],
        lower_motor_neuron_signs: [],
        distribution: 'generalized'
      }
    };
  }

  private createDefaultSensoryExam(): SensoryExam {
    return {
      primary_sensation: {
        light_touch: {
          face: { left: 'normal', right: 'normal' },
          upper_limbs: { left: 'normal', right: 'normal' },
          trunk: 'normal',
          lower_limbs: { left: 'normal', right: 'normal' }
        },
        pinprick: {
          face: { left: 'normal', right: 'normal' },
          upper_limbs: { left: 'normal', right: 'normal' },
          trunk: 'normal',
          lower_limbs: { left: 'normal', right: 'normal' }
        },
        temperature: { upper_limbs: { left: 'normal', right: 'normal' }, lower_limbs: { left: 'normal', right: 'normal' } },
        vibration: { upper_limbs: { left: 'normal', right: 'normal' }, lower_limbs: { left: 'normal', right: 'normal' } },
        position_sense: { upper_limbs: { left: 'normal', right: 'normal' }, lower_limbs: { left: 'normal', right: 'normal' } }
      },
      cortical_sensation: {
        two_point_discrimination: { fingertips: { left: 'normal', right: 'normal' }, palm: { left: 'normal', right: 'normal' } },
        stereognosis: { left: 'normal', right: 'normal' },
        graphesthesia: { left: 'normal', right: 'normal' },
        extinction: 'absent',
        localization: 'normal'
      },
      sensory_level: { present: false, level: '', type: 'complete' }
    };
  }

  private createDefaultReflexExam(): ReflexExam {
    return {
      deep_tendon_reflexes: {
        biceps: { left: 2, right: 2 },
        triceps: { left: 2, right: 2 },
        brachioradialis: { left: 2, right: 2 },
        patellar: { left: 2, right: 2 },
        achilles: { left: 2, right: 2 }
      },
      pathological_reflexes: {
        babinski: { left: 'flexor', right: 'flexor' },
        chaddock: { left: 'negative', right: 'negative' },
        oppenheim: { left: 'negative', right: 'negative' },
        gordon: { left: 'negative', right: 'negative' },
        hoffman: { left: 'negative', right: 'negative' },
        clonus: { ankle: { left: 'absent', right: 'absent' }, patella: { left: 'absent', right: 'absent' } }
      },
      superficial_reflexes: {
        abdominal: { upper: { left: 'present', right: 'present' }, lower: { left: 'present', right: 'present' } },
        cremasteric: { left: 'present', right: 'present' },
        anal_wink: 'present'
      },
      primitive_reflexes: {
        glabellar: 'normal',
        snout: 'absent',
        palmomental: { left: 'absent', right: 'absent' },
        grasp: { left: 'absent', right: 'absent' }
      }
    };
  }

  private createDefaultCoordinationExam(): CoordinationExam {
    return {
      appendicular: {
        finger_to_nose: { left: 'normal', right: 'normal' },
        finger_to_finger: 'normal',
        heel_to_shin: { left: 'normal', right: 'normal' },
        rapid_alternating_movements: { hands: { left: 'normal', right: 'normal' }, feet: { left: 'normal', right: 'normal' } },
        point_to_point: { left: 'normal', right: 'normal' }
      },
      truncal: { sitting_balance: 'normal', standing_balance: 'normal', trunk_stability: 'normal' },
      equilibrium_tests: {
        romberg_test: { eyes_open: 'stable', eyes_closed: 'stable', duration: 30 },
        tandem_romberg: 'stable',
        single_leg_stand: { left: 'stable', right: 'stable' }
      }
    };
  }

  private createDefaultGaitExam(): GaitExam {
    return {
      casual_gait: {
        initiation: 'normal',
        base: 'normal',
        speed: 'normal',
        stride_length: 'normal',
        arm_swing: 'normal',
        turning: 'smooth',
        line_deviation: false
      },
      specialized_gait_tests: {
        tandem_walk: 'normal',
        heel_walk: 'normal',
        toe_walk: 'normal',
        duck_walk: 'normal',
        high_step_walk: 'normal'
      },
      postural_stability: {
        pull_test: 'normal',
        nudge_test: 'normal',
        postural_reflexes: 'normal'
      },
      gait_pattern: { type: 'normal', description: 'Marcha normal sin alteraciones' }
    };
  }

  // ==================== MÉTODOS DE RESUMEN ====================
  
  private summarizeMentalState(mentalState: MentalStateExam): string {
    return `Conciencia: ${mentalState.consciousness.level}, Orientación: ${mentalState.consciousness.orientation.person && mentalState.consciousness.orientation.place && mentalState.consciousness.orientation.time ? 'completa' : 'alterada'}`;
  }

  private summarizeCranialNerves(_cranialNerves: CranialNervesExam): string {
    return 'Examen de nervios craneales documentado';
  }

  private summarizeMotorSystem(motorSystem: MotorExam): string {
    return `Tono: ${motorSystem.tone.upper_limbs.left}, Fuerza: documentada`;
  }

  private summarizeSensorySystem(_sensorySystem: SensoryExam): string {
    return 'Examen sensitivo documentado';
  }

  private summarizeReflexes(_reflexes: ReflexExam): string {
    return 'Reflejos osteotendinosos documentados';
  }

  private summarizeCoordination(coordination: CoordinationExam): string {
    return `Coordinación: ${coordination.appendicular.finger_to_nose.left}`;
  }

  private summarizeGait(gait: GaitExam): string {
    return `Marcha: ${gait.gait_pattern.type}`;
  }
}