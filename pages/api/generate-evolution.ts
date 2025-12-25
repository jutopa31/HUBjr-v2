import Anthropic from '@anthropic-ai/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CLAUDE_COST_RATES } from '../../src/evolucionador/config/claude.config';
import type {
  GenerateEvolutionRequest,
  GenerateEvolutionResponse,
  EvolutionSections
} from '../../src/evolucionador/types/evolution.types';

// Use Claude Sonnet for evolution generation (better cost/performance balance)
const EVOLUTION_MODEL = 'claude-3-5-sonnet-20241022';
const EVOLUTION_MAX_TOKENS = 4096;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔵 Generate Evolution API called');

  if (req.method !== 'POST') {
    console.log('🔴 Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('🔑 API Key present:', !!apiKey);

  if (!apiKey) {
    console.error('🔴 ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server'
    });
  }

  try {
    const {
      epicrisisContext,
      currentStudies,
      patientData,
      options
    } = req.body as GenerateEvolutionRequest;

    if (!epicrisisContext || !currentStudies || !options) {
      return res.status(400).json({
        error: 'Missing required fields: epicrisisContext, currentStudies, or options'
      });
    }

    const prompt = buildPrompt(
      epicrisisContext,
      currentStudies,
      patientData || {},
      options
    );

    const client = new Anthropic({ apiKey });

    console.log('📝 Generating evolution note...');
    const message = await client.messages.create({
      model: EVOLUTION_MODEL,
      max_tokens: EVOLUTION_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const evolutionNote = extractTextFromMessage(message.content);
    const tokensUsed = (message.usage.input_tokens || 0) + (message.usage.output_tokens || 0);
    const cost = calculateCost(message.usage.input_tokens || 0, message.usage.output_tokens || 0);
    const sections = parseSections(evolutionNote);

    console.log('✅ Evolution note generated successfully');
    console.log(`📊 Tokens: ${tokensUsed}, Cost: $${cost.toFixed(4)}`);

    const response: GenerateEvolutionResponse = {
      evolutionNote,
      tokensUsed,
      cost,
      sections,
      processingTimeMs: 0 // Will be calculated on client side
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('🔴 Generate Evolution API Error:', error);

    res.status(error?.status || 500).json({
      error: error?.message || 'Unknown error generating evolution',
      status: error?.status,
      type: error?.type
    });
  }
}

function buildPrompt(
  epicrisis: string,
  studies: string,
  patientData: { name?: string; age?: number; diagnosis?: string },
  options: { includePhysicalExam: boolean; suggestPlan: boolean; format: 'detailed' | 'summary' }
): string {
  const patientInfo = formatPatientInfo(patientData);
  const formatInstruction = getFormatInstruction(options.format);
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

function formatPatientInfo(patientData: {
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

function getFormatInstruction(format: 'detailed' | 'summary'): string {
  if (format === 'detailed') {
    return 'Usa formato DETALLADO con todas las secciones completas y bien desarrolladas.';
  }
  return 'Usa formato RESUMIDO, siendo conciso pero completo en cada sección.';
}

function extractTextFromMessage(content: any[]): string {
  return content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  // Using Claude 3.5 Sonnet pricing
  const inputCost = (inputTokens / 1000) * 0.003; // $0.003 per 1K input tokens
  const outputCost = (outputTokens / 1000) * 0.015; // $0.015 per 1K output tokens
  return inputCost + outputCost;
}

function parseSections(fullNote: string): EvolutionSections {
  const sections: EvolutionSections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  };

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
