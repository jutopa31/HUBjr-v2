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
  return `DATOS:
PACIENTE: ${interconsulta.nombre}
DNI: ${interconsulta.dni}
EDAD: ${interconsulta.edad || 'No especificada'}
CAMA: ${interconsulta.cama}

ANTECEDENTES:
- Antecedentes personales:
- Medicación actual:
- Alergias:

ENFERMEDAD ACTUAL:
${interconsulta.relato_consulta || ''}

${interconsulta.estudios_ocr ? `ESTUDIOS COMPLEMENTARIOS:
${interconsulta.estudios_ocr}

` : 'ESTUDIOS COMPLEMENTARIOS:\n\n'}EXAMEN FÍSICO:
- Signos vitales:
- Nivel de conciencia:
- Examen neurológico:

CONDUCTA:
- Diagnóstico presuntivo:
- Plan terapéutico:
- Interconsultas:

PENDIENTES:
- Estudios pendientes:
- Seguimiento:
`;
}

/**
 * Extrae secciones estructuradas del texto del Evolucionador
 * @param clinicalNotes - Notas clínicas completas del evolucionador
 * @returns Objeto con las secciones extraídas
 */
export function extractStructuredSections(clinicalNotes: string): {
  datos: string;
  antecedentes: string;
  enfermedadActual: string;
  examenFisico: string;
  estudiosComplementarios: string;
  conducta: string;
  pendientes: string;
} {
  const sections = {
    datos: '',
    antecedentes: '',
    enfermedadActual: '',
    examenFisico: '',
    estudiosComplementarios: '',
    conducta: '',
    pendientes: ''
  };

  console.log('[WorkflowIntegration] extractStructuredSections -> Input length:', clinicalNotes.length);

  // Regex patterns para nuevos headers estandarizados
  const patterns = {
    // Datos - extrae todo entre DATOS: y ANTECEDENTES:
    datos: /DATOS:\s*\n+([\s\S]*?)(?=\s*\n+ANTECEDENTES:)/i,

    // Antecedentes - extrae hasta ENFERMEDAD ACTUAL:
    antecedentes: /ANTECEDENTES:\s*\n+([\s\S]*?)(?=\s*\n+ENFERMEDAD\s+ACTUAL:)/i,

    // Enfermedad actual - extrae hasta ESTUDIOS COMPLEMENTARIOS:
    enfermedadActual: /ENFERMEDAD\s+ACTUAL:\s*\n+([\s\S]*?)(?=\s*\n+ESTUDIOS\s+COMPLEMENTARIOS:)/i,

    // Estudios complementarios - extrae hasta EXAMEN FÍSICO:
    estudiosComplementarios: /ESTUDIOS\s+COMPLEMENTARIOS:\s*\n+([\s\S]*?)(?=\s*\n+EXAMEN\s+F[ÍI]SICO:)/i,

    // Examen físico - extrae hasta CONDUCTA:
    examenFisico: /EXAMEN\s+F[ÍI]SICO:\s*\n+([\s\S]*?)(?=\s*\n+CONDUCTA:)/i,

    // Conducta - extrae hasta PENDIENTES:
    conducta: /CONDUCTA:\s*\n+([\s\S]*?)(?=\s*\n+PENDIENTES:)/i,

    // Pendientes - extrae hasta el final
    pendientes: /PENDIENTES:\s*\n+([\s\S]*?)$/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = clinicalNotes.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      sections[key as keyof typeof sections] = extracted;
      console.log(`[WorkflowIntegration] ✅ Extracted ${key}:`, extracted.substring(0, 100) + (extracted.length > 100 ? '...' : ''));
    } else {
      console.warn(`[WorkflowIntegration] ⚠️ Failed to extract ${key} from clinical notes`);
    }
  }

  // Log resumen
  console.log('[WorkflowIntegration] Extraction summary:', {
    datos: sections.datos.length,
    antecedentes: sections.antecedentes.length,
    enfermedadActual: sections.enfermedadActual.length,
    examenFisico: sections.examenFisico.length,
    estudiosComplementarios: sections.estudiosComplementarios.length,
    conducta: sections.conducta.length,
    pendientes: sections.pendientes.length
  });

  return sections;
}

/**
 * Extrae campos individuales de la sección DATOS
 * @param datosSection - Texto de la sección DATOS
 * @returns Objeto con campos nombre, dni, edad, cama
 */
export function extractDataFields(datosSection: string): {
  nombre: string;
  dni: string;
  edad: string;
  cama: string;
} {
  const fields = {
    nombre: '',
    dni: '',
    edad: '',
    cama: ''
  };

  // Buscar PACIENTE:
  const nombreMatch = datosSection.match(/PACIENTE:\s*(.+)/i);
  if (nombreMatch) fields.nombre = nombreMatch[1].trim();

  // Buscar DNI:
  const dniMatch = datosSection.match(/DNI:\s*(.+)/i);
  if (dniMatch) fields.dni = dniMatch[1].trim();

  // Buscar EDAD:
  const edadMatch = datosSection.match(/EDAD:\s*(.+)/i);
  if (edadMatch) fields.edad = edadMatch[1].trim();

  // Buscar CAMA:
  const camaMatch = datosSection.match(/CAMA:\s*(.+)/i);
  if (camaMatch) fields.cama = camaMatch[1].trim();

  return fields;
}

/**
 * Intenta extraer diagnóstico de la sección CONDUCTA
 * Busca líneas que contengan "diagnóstico" o "impresión"
 * @param conducta - Texto de la sección CONDUCTA
 * @returns Diagnóstico extraído o string vacío
 */
function extractDiagnosticoFromConducta(conducta: string): string {
  if (!conducta) return '';

  // Buscar líneas con "Diagnóstico presuntivo:", "Dx:", "Impresión:", etc.
  const match = conducta.match(/(?:Diagn[óo]stico.*?:|Dx:?|Impresi[óo]n:?)\s*(.+?)(?=\n-|\n\n|$)/is);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Si no encuentra, intentar extraer primera viñeta
  const firstBullet = conducta.match(/^-\s*(.+)/m);
  if (firstBullet) {
    return firstBullet[1].trim();
  }

  return '';
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
  console.log('[WorkflowIntegration] mapToWardRoundPatient -> Starting mapping for:', interconsulta.nombre);

  const sections = extractStructuredSections(assessment.clinical_notes);

  // Extraer datos individuales de la sección DATOS
  const dataFields = extractDataFields(sections.datos);

  const mappedData = {
    // Datos del paciente - priorizar extracción de DATOS:, fallback a interconsulta
    nombre: dataFields.nombre || interconsulta.nombre,
    dni: dataFields.dni || interconsulta.dni,
    edad: dataFields.edad || interconsulta.edad || assessment.patient_age || '',
    cama: dataFields.cama || interconsulta.cama,
    fecha: new Date().toISOString().split('T')[0],

    // Mapeo de secciones del Evolucionador
    antecedentes: sections.antecedentes,                    // ANTECEDENTES: → antecedentes
    motivo_consulta: sections.enfermedadActual,             // ENFERMEDAD ACTUAL: → motivo_consulta
    examen_fisico: sections.examenFisico,                   // EXAMEN FÍSICO: → examen_fisico
    estudios: sections.estudiosComplementarios,             // ESTUDIOS COMPLEMENTARIOS: → estudios
    plan: sections.conducta,                                // CONDUCTA: → plan
    pendientes: sections.pendientes,                        // PENDIENTES: → pendientes

    // Diagnóstico - extraer de CONDUCTA (primera línea si contiene "Diagnóstico")
    diagnostico: extractDiagnosticoFromConducta(sections.conducta),

    // Imágenes (trasladar desde interconsulta)
    image_thumbnail_url: interconsulta.image_thumbnail_url || [],
    image_full_url: interconsulta.image_full_url || [],
    exa_url: interconsulta.exa_url || [],

    // Metadata
    hospital_context: interconsulta.hospital_context || 'Posadas',
    severidad: 'II', // Default moderado
    display_order: 9999
  };

  console.log('[WorkflowIntegration] mapToWardRoundPatient -> Mapped data:', {
    nombre: mappedData.nombre,
    antecedentes_length: mappedData.antecedentes.length,
    motivo_consulta_length: mappedData.motivo_consulta.length,
    examen_fisico_length: mappedData.examen_fisico.length,
    estudios_length: mappedData.estudios.length,
    plan_length: mappedData.plan.length,
    pendientes_length: mappedData.pendientes.length
  });

  return mappedData;
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
