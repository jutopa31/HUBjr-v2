// V3 Types - Unified patient data model for Evolucionador-centric architecture

export type PatientDestination = 'interconsulta' | 'pase_sala' | 'post_alta' | 'ambulatorio';

export interface DestinationHistoryEntry {
  destination: PatientDestination;
  entered_at: string;
  exited_at?: string;
}

export interface EvolutionNote {
  id: string;
  fecha: string;
  nota: string;
  ai_assisted: boolean;
  created_by?: string;
}

export interface PatientImage {
  id: string;
  url: string;
  thumbnail?: string;
  type: 'photo' | 'ocr' | 'document';
  uploaded_at: string;
  description?: string;
}

export interface PatientV3 {
  id: string;

  // Required (Brief Save)
  dni: string;
  nombre: string;
  cama?: string;

  // Lifecycle tracking
  current_destination: PatientDestination;
  destinations_history: DestinationHistoryEntry[];

  // Clinical data (progressive)
  edad?: string;
  relato_consulta?: string;
  antecedentes?: string;
  examen_fisico?: string;
  estudios?: string;
  diagnostico?: string;
  plan?: string;
  pendientes?: string;

  // Evolution notes (accumulated)
  evoluciones: EvolutionNote[];

  // AI content
  ai_draft?: string;
  ai_summary?: string;

  // Key dates
  fecha_ingreso: string;
  fecha_alta?: string;
  fecha_cita_seguimiento?: string;

  // Media (unified)
  images: PatientImage[];

  // Metadata
  hospital_context: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Form types for patient entry
export interface PatientEntryForm {
  nombre: string;
  dni: string;
  cama?: string;
}

// AI Assistant types
export type AIInputMode = 'texto' | 'ocr' | 'camara';

export interface AIAssistantInput {
  mode: AIInputMode;
  content: string;
  images?: string[];
}

export interface AIAssistantResponse {
  draft: string;
  summary?: string;
  extracted_data?: Partial<PatientV3>;
}

// Transition action types
export interface TransitionAction {
  from: PatientDestination;
  to: PatientDestination;
  patient_id: string;
  notes?: string;
}

// Filter/Query types
export interface PatientFilters {
  destination?: PatientDestination;
  hospital_context?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// Tab counts for viewer
export interface DestinationCounts {
  interconsulta: number;
  pase_sala: number;
  post_alta: number;
  ambulatorio: number;
}
