import type {
  EvolutionOptions,
  EvolutionResult,
  EvolutionSections,
  GenerateEvolutionRequest,
  GenerateEvolutionResponse
} from '../../types/evolution.types';

export class ClaudeEvolutionService {
  async generateEvolutionNote(
    epicrisisContext: string,
    currentStudies: string,
    patientData: { name?: string; age?: number; diagnosis?: string } = {},
    options: EvolutionOptions
  ): Promise<EvolutionResult> {
    const request: GenerateEvolutionRequest = {
      epicrisisContext,
      currentStudies,
      patientData,
      options
    };

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate-evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: GenerateEvolutionResponse = await response.json();
      const processingTimeMs = Date.now() - startTime;

      return {
        fullNote: data.evolutionNote,
        sections: data.sections,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        processingTimeMs
      };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Generación cancelada por el usuario.');
      }
      throw new Error(`Error al generar evolución: ${error?.message || 'Error desconocido'}`);
    }
  }

  buildPrompt(
    epicrisis: string,
    studies: string,
    patientData: { name?: string; age?: number; diagnosis?: string },
    options: EvolutionOptions
  ): string {
    const patientInfo = this.formatPatientInfo(patientData);
    const formatInstruction = this.getFormatInstruction(options.format);
    const examInstruction = options.includePhysicalExam
      ? 'Incluye un examen físico neurológico completo y detallado.'
      : 'Resume brevemente los hallazgos del examen físico.';
    const planInstruction = options.suggestPlan
      ? 'Propone un plan terapéutico detallado basado en la evidencia actual.'
      : 'Menciona el plan de forma concisa.';

    return `Eres un médico neurólogo experimentado creando una nota de evolución médica.

${patientInfo}

EPICRISIS PREVIA (Antecedentes del paciente e internación reciente):
${epicrisis}

ESTUDIOS Y DATOS ACTUALES (Nueva información disponible):
${studies}

INSTRUCCIONES:
Genera una nota de evolución médica bien estructurada usando formato SOAP:

1. SUBJETIVO (S): Motivo de consulta actual, síntomas referidos por el paciente
2. OBJETIVO (O): Hallazgos del examen físico, signos vitales, resultados de estudios
3. EVALUACIÓN (A): Impresión diagnóstica integrando antecedentes de la epicrisis con datos actuales
4. PLAN (P): Conducta terapéutica y seguimiento

${formatInstruction}
${examInstruction}
${planInstruction}

IMPORTANTE:
- Integra apropiadamente los antecedentes de la epicrisis (internación reciente) con los datos actuales
- Usa terminología médica precisa pero clara
- Sé profesional y conciso
- NO inventes datos que no están en el contexto proporcionado
- Si falta información, indícalo como "No especificado" o "A evaluar"

NOTA DE EVOLUCIÓN:`;
  }

  private formatPatientInfo(patientData: {
    name?: string;
    age?: number;
    diagnosis?: string;
  }): string {
    const parts: string[] = [];

    if (patientData.name) {
      parts.push(`Paciente: ${patientData.name}`);
    }
    if (patientData.age) {
      parts.push(`Edad: ${patientData.age} años`);
    }
    if (patientData.diagnosis) {
      parts.push(`Diagnóstico principal: ${patientData.diagnosis}`);
    }

    return parts.length > 0 ? parts.join('\n') + '\n' : '';
  }

  private getFormatInstruction(format: 'detailed' | 'summary'): string {
    if (format === 'detailed') {
      return 'Usa formato DETALLADO con todas las secciones completas y bien desarrolladas.';
    }
    return 'Usa formato RESUMIDO, siendo conciso pero completo en cada sección.';
  }

  parseSections(fullNote: string): EvolutionSections {
    const sections: EvolutionSections = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    };

    // Patterns to match SOAP sections
    const subjectiveMatch = fullNote.match(
      /(?:SUBJETIVO|S:|Subjetivo)[\s:]*\n?([\s\S]*?)(?=\n\s*(?:OBJETIVO|O:|Objetivo)|$)/i
    );
    const objectiveMatch = fullNote.match(
      /(?:OBJETIVO|O:|Objetivo)[\s:]*\n?([\s\S]*?)(?=\n\s*(?:EVALUACIÓN|EVALUACION|A:|Evaluación)|$)/i
    );
    const assessmentMatch = fullNote.match(
      /(?:EVALUACIÓN|EVALUACION|A:|Evaluación)[\s:]*\n?([\s\S]*?)(?=\n\s*(?:PLAN|P:|Plan)|$)/i
    );
    const planMatch = fullNote.match(/(?:PLAN|P:|Plan)[\s:]*\n?([\s\S]*?)$/i);

    if (subjectiveMatch) sections.subjective = subjectiveMatch[1].trim();
    if (objectiveMatch) sections.objective = objectiveMatch[1].trim();
    if (assessmentMatch) sections.assessment = assessmentMatch[1].trim();
    if (planMatch) sections.plan = planMatch[1].trim();

    return sections;
  }
}
