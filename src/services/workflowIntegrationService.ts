/**
 * Servicio de integración de workflow
 * Maneja el flujo Interconsultas → Evolucionador → Pase de Sala
 */

import { supabase } from '../utils/supabase';
import type { InterconsultaRow } from './interconsultasService';
import type { PatientAssessment } from '../types';

/**
 * Genera template estructurado para Evolucionador desde interconsulta
 * @param interconsulta - Datos de la interconsulta
 * @returns Template con secciones estructuradas pre-cargadas
 */
export function generateEvolucionadorTemplate(interconsulta: InterconsultaRow): string {
  const antecedentesPlaceholder = `- Antecedentes personales:
- Medicación actual:
- Alergias:`;

  const efPlaceholder = `- Nivel de conciencia:
- Pares craneales:
- Motor:
- Sensibilidad:
- NIHSS (si aplica):`;

  const diagnosticoPlaceholder = `- Diagnóstico presuntivo:
- Diferenciales:`;

  const planPlaceholder = `- Estudios solicitados:
- Conducta / interconsultas:
- Seguimiento:`;

  return `PACIENTE: ${interconsulta.nombre}
DNI: ${interconsulta.dni}
EDAD: ${interconsulta.edad || 'No especificada'}
CAMA: ${interconsulta.cama}

MOTIVO DE CONSULTA:
${interconsulta.relato_consulta || ''}

${interconsulta.estudios_ocr ? `ESTUDIOS COMPLEMENTARIOS (OCR):
${interconsulta.estudios_ocr}

` : ''}ANTECEDENTES:
${antecedentesPlaceholder}

EXAMEN FÍSICO:
${efPlaceholder}

DIAGNÓSTICO:
${diagnosticoPlaceholder}

PLAN:
${planPlaceholder}
`;
}

/**
 * Extrae secciones estructuradas del texto del Evolucionador
 * @param clinicalNotes - Notas clínicas completas del evolucionador
 * @returns Objeto con las secciones extraídas
 */
export function extractStructuredSections(clinicalNotes: string): {
  antecedentes: string;
  examenFisico: string;
  diagnostico: string;
  plan: string;
  motivoConsulta: string;
  estudiosOCR: string;
} {
  const sections = {
    antecedentes: '',
    examenFisico: '',
    diagnostico: '',
    plan: '',
    motivoConsulta: '',
    estudiosOCR: ''
  };

  // Regex patterns para extraer secciones
  const patterns = {
    motivoConsulta: /MOTIVO DE CONSULTA:\s*\n([\s\S]*?)(?=\n\n(?:ESTUDIOS COMPLEMENTARIOS|ANTECEDENTES)|$)/i,
    estudiosOCR: /ESTUDIOS COMPLEMENTARIOS \(OCR\):\s*\n([\s\S]*?)(?=\n\nANTECEDENTES|$)/i,
    antecedentes: /ANTECEDENTES:\s*\n([\s\S]*?)(?=\n\nEXAMEN|$)/i,
    examenFisico: /EXAMEN F[ÍI]SICO:\s*\n([\s\S]*?)(?=\n\nDIAGN[ÓO]STICO|$)/i,
    diagnostico: /DIAGN[ÓO]STICO:\s*\n([\s\S]*?)(?=\n\nPLAN|$)/i,
    plan: /PLAN:\s*\n([\s\S]*?)$/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = clinicalNotes.match(pattern);
    if (match) {
      sections[key as keyof typeof sections] = match[1].trim();
    }
  }

  return sections;
}

/**
 * Mapea datos de Evolucionador + Interconsulta a formato Pase de Sala
 * @param interconsulta - Datos de la interconsulta original
 * @param assessment - Assessment guardado en diagnostic_assessments
 * @returns Objeto con datos mapeados para ward_round_patients
 */
export function mapToWardRoundPatient(
  interconsulta: InterconsultaRow,
  assessment: PatientAssessment
): any {
  const sections = extractStructuredSections(assessment.clinical_notes);

  return {
    nombre: interconsulta.nombre,
    dni: interconsulta.dni,
    edad: interconsulta.edad || assessment.patient_age || '',
    cama: interconsulta.cama,
    fecha: new Date().toISOString().split('T')[0],

    // Datos de interconsulta
    motivo_consulta: sections.motivoConsulta || interconsulta.relato_consulta || '',
    estudios: sections.estudiosOCR || interconsulta.estudios_ocr || '',

    // Datos del Evolucionador (secciones extraídas)
    antecedentes: sections.antecedentes,
    examen_fisico: sections.examenFisico,
    diagnostico: sections.diagnostico,
    plan: sections.plan,

    // Imágenes (trasladar desde interconsulta)
    image_thumbnail_url: interconsulta.image_thumbnail_url || [],
    image_full_url: interconsulta.image_full_url || [],
    exa_url: interconsulta.exa_url || [],

    // Metadata
    hospital_context: interconsulta.hospital_context || 'Posadas',
    severidad: 'II', // Default moderado, usuario puede cambiar después
    pendientes: '',
    display_order: 9999 // Al final, se recalcula después
  };
}

/**
 * Crea paciente en Pase de Sala desde Evolucionador
 * @param interconsultaId - ID de la interconsulta origen
 * @param assessmentId - ID del assessment guardado en diagnostic_assessments
 * @returns Resultado con éxito/error y ID del paciente creado
 */
export async function createWardPatientFromEvolution(
  interconsultaId: string,
  assessmentId: string
): Promise<{ success: boolean; patientId?: string; error?: string }> {
  try {
    console.log('[WorkflowIntegration] createWardPatientFromEvolution -> interconsulta:', interconsultaId, 'assessment:', assessmentId);

    // 1. Obtener interconsulta completa
    const { data: interconsulta, error: icError } = await supabase
      .from('interconsultas')
      .select('*')
      .eq('id', interconsultaId)
      .single();

    if (icError || !interconsulta) {
      console.error('[WorkflowIntegration] Error fetching interconsulta:', icError);
      return { success: false, error: 'No se encontró la interconsulta' };
    }

    // 2. Obtener assessment completo
    const { data: assessment, error: assError } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assError || !assessment) {
      console.error('[WorkflowIntegration] Error fetching assessment:', assError);
      return { success: false, error: 'No se encontró la evaluación' };
    }

    // 3. Mapear datos
    const wardPatientData = mapToWardRoundPatient(interconsulta, assessment);

    // 4. Verificar duplicado por DNI
    const { data: existing } = await supabase
      .from('ward_round_patients')
      .select('id, nombre')
      .eq('dni', wardPatientData.dni)
      .eq('hospital_context', wardPatientData.hospital_context);

    if (existing && existing.length > 0) {
      console.warn('[WorkflowIntegration] Duplicate patient found:', existing[0]);
      return {
        success: false,
        error: `Ya existe un paciente con DNI ${wardPatientData.dni}: ${existing[0].nombre}`
      };
    }

    // 5. Insertar en ward_round_patients
    const { data: newPatient, error: insertError } = await supabase
      .from('ward_round_patients')
      .insert([wardPatientData])
      .select('id')
      .single();

    if (insertError) {
      console.error('[WorkflowIntegration] Error inserting ward patient:', insertError);
      throw insertError;
    }

    console.log('[WorkflowIntegration] Ward patient created successfully:', newPatient.id);

    // 6. Marcar assessment como con respuesta enviada
    await supabase
      .from('diagnostic_assessments')
      .update({ response_sent: true })
      .eq('id', assessmentId);

    return { success: true, patientId: newPatient.id };
  } catch (error: any) {
    console.error('[WorkflowIntegration] createWardPatientFromEvolution unexpected error:', error);
    return { success: false, error: error?.message || String(error) };
  }
}
