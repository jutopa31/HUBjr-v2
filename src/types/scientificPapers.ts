/**
 * Scientific Papers Types
 * Types and interfaces for the Trabajos Científicos feature
 */

// =============================================================================
// Status Types
// =============================================================================

export type PaperStatus =
  | 'pending'      // Pendiente - Not started
  | 'in_progress'  // En progreso - Being worked on
  | 'completed'    // Completado - Finished but not submitted
  | 'submitted'    // Enviado - Submitted to event
  | 'accepted'     // Aceptado - Accepted by event
  | 'rejected';    // Rechazado - Rejected by event

export const PAPER_STATUS_LABELS: Record<PaperStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  submitted: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado'
};

export const PAPER_STATUS_COLORS: Record<PaperStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-300' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
  submitted: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-300' },
  accepted: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900', darkText: 'dark:text-emerald-300' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' }
};

// =============================================================================
// Paper Type Types
// =============================================================================

export type PaperType = 'abstract' | 'poster' | 'articulo' | 'caso_clinico';

export const PAPER_TYPE_LABELS: Record<PaperType, string> = {
  abstract: 'Abstract',
  poster: 'Poster',
  articulo: 'Artículo',
  caso_clinico: 'Caso Clínico'
};

export const PAPER_TYPE_ICONS: Record<PaperType, string> = {
  abstract: 'FileText',
  poster: 'Presentation',
  articulo: 'BookOpen',
  caso_clinico: 'Stethoscope'
};

// =============================================================================
// Priority Types
// =============================================================================

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};

export const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300' },
  high: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-300' },
  low: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300' }
};

// =============================================================================
// Card Color Types (Google Keep style)
// =============================================================================

export type CardColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

export const CARD_COLORS: Record<CardColor, { light: string; dark: string; name: string }> = {
  default: { light: 'bg-white', dark: 'dark:bg-gray-800', name: 'Predeterminado' },
  red: { light: 'bg-red-50', dark: 'dark:bg-red-900/30', name: 'Rojo' },
  orange: { light: 'bg-orange-50', dark: 'dark:bg-orange-900/30', name: 'Naranja' },
  yellow: { light: 'bg-yellow-50', dark: 'dark:bg-yellow-900/30', name: 'Amarillo' },
  green: { light: 'bg-green-50', dark: 'dark:bg-green-900/30', name: 'Verde' },
  teal: { light: 'bg-teal-50', dark: 'dark:bg-teal-900/30', name: 'Turquesa' },
  blue: { light: 'bg-blue-50', dark: 'dark:bg-blue-900/30', name: 'Azul' },
  purple: { light: 'bg-purple-50', dark: 'dark:bg-purple-900/30', name: 'Morado' },
  pink: { light: 'bg-pink-50', dark: 'dark:bg-pink-900/30', name: 'Rosa' }
};

// =============================================================================
// File Types
// =============================================================================

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

export type FileType = 'abstract' | 'draft' | 'final';

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  abstract: 'Abstract',
  draft: 'Borrador',
  final: 'Versión Final'
};

// =============================================================================
// Main Interface
// =============================================================================

export interface ScientificPaper {
  id: string;
  title: string;
  description?: string | null;
  paper_type: PaperType;
  event_name?: string | null;

  deadline?: string | null;      // ISO date string (YYYY-MM-DD)
  status: PaperStatus;

  abstract_url?: string | null;
  draft_url?: string | null;
  final_url?: string | null;

  assigned_residents: string[];  // Array of emails
  pending_tasks?: string[] | null;

  color: CardColor;
  priority: PriorityLevel;

  hospital_context: 'Posadas' | 'Julian';
  created_by: string;            // Email of creator
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Form Types
// =============================================================================

export interface ScientificPaperFormData {
  title: string;
  description?: string;
  paper_type: PaperType;
  event_name?: string;
  deadline?: string;
  status: PaperStatus;
  assigned_residents: string[];
  pending_tasks?: string[];
  color: CardColor;
  priority: PriorityLevel;
}

export interface ScientificPaperCreateData extends ScientificPaperFormData {
  hospital_context: 'Posadas' | 'Julian';
  created_by: string;
}

export interface ScientificPaperUpdateData extends Partial<ScientificPaperFormData> {
  abstract_url?: string | null;
  draft_url?: string | null;
  final_url?: string | null;
}

// =============================================================================
// Filter Types
// =============================================================================

export interface ScientificPapersFilters {
  search?: string;
  status?: PaperStatus | 'all';
  paper_type?: PaperType | 'all';
  assigned_resident?: string | 'all';
  priority?: PriorityLevel | 'all';
  has_deadline?: boolean;
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface ScientificPapersStats {
  total: number;
  byStatus: Record<PaperStatus, number>;
  byType: Record<PaperType, number>;
  urgentDeadlines: number;  // Papers with deadline < 7 days
  overdueCount: number;     // Papers past deadline
}

// =============================================================================
// Deadline Helper Types
// =============================================================================

export interface DeadlineInfo {
  text: string;
  color: 'red' | 'yellow' | 'green' | 'gray';
  urgent: boolean;
  daysRemaining: number | null;
}

/**
 * Calculate deadline information with timezone-safe date handling
 * Uses UTC dates to avoid timezone shift issues
 */
export function getDeadlineInfo(deadline: string | null | undefined): DeadlineInfo {
  if (!deadline) {
    return { text: 'Sin fecha', color: 'gray', urgent: false, daysRemaining: null };
  }

  // Parse deadline as UTC date to avoid timezone issues
  // Format: YYYY-MM-DD -> treat as start of day in UTC
  const [year, month, day] = deadline.split('-').map(Number);
  const deadlineDate = new Date(Date.UTC(year, month - 1, day));

  // Get today's date at UTC midnight
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  const diffTime = deadlineDate.getTime() - todayUTC.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      text: absDays === 1 ? 'Vencido ayer' : `Vencido hace ${absDays} días`,
      color: 'red',
      urgent: true,
      daysRemaining: diffDays
    };
  } else if (diffDays === 0) {
    return { text: 'Vence hoy', color: 'red', urgent: true, daysRemaining: 0 };
  } else if (diffDays === 1) {
    return { text: 'Vence mañana', color: 'red', urgent: true, daysRemaining: 1 };
  } else if (diffDays <= 7) {
    return { text: `Faltan ${diffDays} días`, color: 'red', urgent: true, daysRemaining: diffDays };
  } else if (diffDays <= 14) {
    return { text: `Faltan ${diffDays} días`, color: 'yellow', urgent: false, daysRemaining: diffDays };
  } else {
    return { text: `Faltan ${diffDays} días`, color: 'green', urgent: false, daysRemaining: diffDays };
  }
}

// =============================================================================
// Resident Type (for assignment)
// =============================================================================

export interface ResidentOption {
  email: string;
  name: string;
  initials: string;
}
