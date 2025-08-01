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