// Tipos compartidos para escalas y modales
export interface ScaleItem {
  id: string;
  label: string;
  options: string[];
  score: number;
}

export interface Scale {
  id: string;
  name: string;
  category: string;
  description: string;
  items: ScaleItem[];
}

export interface ScaleResult {
  scaleName: string;
  totalScore: number;
  details: string;
  interpretation: string;
}

export interface ScaleModalProps {
  scale: Scale;
  onClose: () => void;
  onSubmit: (result: ScaleResult) => void;
}

// Tipos para sugerencias de IA
export interface AISuggestion {
  scaleId: string;
  confidence: number;
  keywords: string[];
  reason: string;
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  timestamp: number;
}

// Tipos para evaluaciones diagnósticas de pacientes
export interface PatientAssessment {
  id?: string;
  patient_name: string;
  patient_age: string;
  patient_dni: string;
  clinical_notes: string;
  scale_results: SavedScaleResult[];
  hospital_context?: 'Posadas' | 'Julian';
  created_at?: string;
  created_by?: string;
  status?: string;
}

export interface SavedScaleResult {
  scale_name: string;
  score: string;
  details: string;
  completed_at: string;
}

export interface SavePatientData {
  patient_name: string;
  patient_age: string;
  patient_dni: string;
  clinical_notes: string;
  scale_results: SavedScaleResult[];
  hospital_context?: 'Posadas' | 'Julian';
}

// Tipos para contexto de hospital
export type HospitalContext = 'Posadas' | 'Julian';

// Interconsulta interface
export interface Interconsulta {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string; // YYYY-MM-DD
  respuesta?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}
