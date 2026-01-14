/**
 * Types for Pending Patients (Patients without clear diagnosis)
 * Google Keep-style card interface for tracking diagnostic uncertainties
 */

export type CardColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface PendingPatient {
  id: string;
  patient_name: string;
  age?: number;
  dni?: string;
  admission_date?: string;

  // Clinical data
  chief_complaint: string;
  clinical_notes: string;
  differential_diagnoses?: string[];
  pending_tests?: string[];

  // Organization
  color: CardColor;
  priority: PriorityLevel;
  tags?: string[];

  // Metadata
  hospital_context: 'Posadas' | 'Julian';
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved: boolean;
  resolved_at?: string;
  final_diagnosis?: string;
}

export interface CreatePendingPatientInput {
  patient_name: string;
  age?: number;
  dni?: string;
  admission_date?: string;
  chief_complaint: string;
  clinical_notes: string;
  differential_diagnoses?: string[];
  pending_tests?: string[];
  color?: CardColor;
  priority?: PriorityLevel;
  tags?: string[];
  hospital_context: 'Posadas' | 'Julian';
}

export interface UpdatePendingPatientInput {
  patient_name?: string;
  age?: number;
  dni?: string;
  admission_date?: string;
  chief_complaint?: string;
  clinical_notes?: string;
  differential_diagnoses?: string[];
  pending_tests?: string[];
  color?: CardColor;
  priority?: PriorityLevel;
  tags?: string[];
  resolved?: boolean;
  final_diagnosis?: string;
}

export interface PendingPatientsFilters {
  search?: string;
  priority?: PriorityLevel;
  color?: CardColor;
  tags?: string[];
  resolved?: boolean;
  hospital_context?: 'Posadas' | 'Julian';
}

// Color theme mappings for cards
export const CARD_COLORS: Record<CardColor, { bg: string; border: string; text: string }> = {
  default: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-900 dark:text-gray-100'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-900 dark:text-pink-100'
  }
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  urgent: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-blue-600 dark:text-blue-400'
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};
