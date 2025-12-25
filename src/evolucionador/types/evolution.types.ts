export type EvolutionFormat = 'detailed' | 'summary';

export interface EvolutionOptions {
  includePhysicalExam: boolean;
  suggestPlan: boolean;
  format: EvolutionFormat;
}

export interface EvolutionSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface EvolutionResult {
  fullNote: string;
  sections: EvolutionSections;
  tokensUsed: number;
  cost: number;
  processingTimeMs: number;
}

export interface GenerateEvolutionRequest {
  epicrisisContext: string;
  currentStudies: string;
  patientData?: {
    name?: string;
    age?: number;
    diagnosis?: string;
  };
  options: EvolutionOptions;
}

export interface GenerateEvolutionResponse {
  evolutionNote: string;
  tokensUsed: number;
  cost: number;
  sections: EvolutionSections;
  processingTimeMs: number;
}
