import { AIAssistantInput, AIAssistantResponse, PatientV3 } from '../types/v3.types';

const API_ENDPOINT = '/api/ocr';

interface ClaudeOCRResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// Process text input with Claude for evolution generation
export async function generateEvolutionFromText(
  input: string,
  patient: PatientV3
): Promise<AIAssistantResponse> {
  try {
    // Build context from patient data
    const patientContext = buildPatientContext(patient);

    // Call the existing OCR API endpoint which uses Claude
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Eres un asistente médico especializado en neurología. Basándote en la siguiente información del paciente y el nuevo texto proporcionado, genera un borrador de nota de evolución médica estructurada.

CONTEXTO DEL PACIENTE:
${patientContext}

NUEVO TEXTO A PROCESAR:
${input}

Por favor genera una evolución médica estructurada con las siguientes secciones:
- Motivo de consulta/Situación actual
- Hallazgos relevantes
- Impresión diagnóstica
- Plan sugerido

Mantén un tono profesional y objetivo. Incluye solo información clínicamente relevante.`,
        mode: 'text',
      }),
    });

    const data: ClaudeOCRResponse = await response.json();

    if (!data.success || !data.text) {
      throw new Error(data.error || 'Error procesando texto');
    }

    return {
      draft: data.text,
      summary: extractSummary(data.text),
    };
  } catch (error) {
    console.error('🔴 Error generating evolution from text:', error);
    throw error;
  }
}

// Process image with OCR via Claude Vision
export async function processImageOCR(
  imageBase64: string,
  patient: PatientV3
): Promise<AIAssistantResponse> {
  try {
    const patientContext = buildPatientContext(patient);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        prompt: `Extrae todo el texto visible de esta imagen médica. Si es un documento clínico (HC, estudios, informes), estructura la información de manera clara.

CONTEXTO DEL PACIENTE:
${patientContext}

Después de extraer el texto, genera una breve síntesis de los hallazgos relevantes para la evolución del paciente.`,
        mode: 'ocr',
      }),
    });

    const data: ClaudeOCRResponse = await response.json();

    if (!data.success || !data.text) {
      throw new Error(data.error || 'Error procesando imagen');
    }

    return {
      draft: data.text,
      summary: extractSummary(data.text),
    };
  } catch (error) {
    console.error('🔴 Error processing OCR:', error);
    throw error;
  }
}

// Process camera capture
export async function processCameraCapture(
  imageBase64: string,
  patient: PatientV3
): Promise<AIAssistantResponse> {
  // Camera capture uses the same OCR processing
  return processImageOCR(imageBase64, patient);
}

// Main entry point for AI processing
export async function processAIInput(
  input: AIAssistantInput,
  patient: PatientV3
): Promise<AIAssistantResponse> {
  switch (input.mode) {
    case 'texto':
      return generateEvolutionFromText(input.content, patient);
    case 'ocr':
      if (!input.images || input.images.length === 0) {
        throw new Error('No se proporcionó imagen para OCR');
      }
      return processImageOCR(input.images[0], patient);
    case 'camara':
      if (!input.images || input.images.length === 0) {
        throw new Error('No se proporcionó imagen de cámara');
      }
      return processCameraCapture(input.images[0], patient);
    default:
      throw new Error('Modo de entrada no soportado');
  }
}

// Helper: Build patient context string
function buildPatientContext(patient: PatientV3): string {
  const parts: string[] = [];

  parts.push(`Nombre: ${patient.nombre}`);
  parts.push(`DNI: ${patient.dni}`);
  if (patient.edad) parts.push(`Edad: ${patient.edad}`);
  if (patient.cama) parts.push(`Cama: ${patient.cama}`);
  if (patient.diagnostico) parts.push(`Diagnóstico: ${patient.diagnostico}`);
  if (patient.relato_consulta) parts.push(`Motivo: ${patient.relato_consulta}`);
  if (patient.antecedentes) parts.push(`Antecedentes: ${patient.antecedentes}`);

  // Add recent evolutions
  if (patient.evoluciones && patient.evoluciones.length > 0) {
    const recentEvolutions = patient.evoluciones.slice(-3);
    parts.push('\nEvoluciones recientes:');
    recentEvolutions.forEach((evo) => {
      parts.push(`- ${evo.fecha}: ${evo.nota.substring(0, 200)}...`);
    });
  }

  return parts.join('\n');
}

// Helper: Extract summary from generated text
function extractSummary(text: string): string {
  // Take first 200 characters as summary
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length > 0) {
    return lines[0].substring(0, 200);
  }
  return text.substring(0, 200);
}
