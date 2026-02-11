/**
 * Servicio de integración de workflow
 * Maneja el flujo Interconsultas → Evolucionador → Pase de Sala
 */

import { supabase } from '../utils/supabase';
import type { InterconsultaRow } from './interconsultasService';
import type { PacientePostAltaRow } from './pacientesPostAltaService';
import type { PatientAssessment } from '../types';
import type { StructuredSections } from '../types/evolucionadorStructured';
import { createEmptyStructuredSections } from '../types/evolucionadorStructured';

/**
 * Genera template estructurado para Evolucionador desde interconsulta
 * @param interconsulta - Datos de la interconsulta
 * @returns Template con secciones estructuradas pre-cargadas (formato nuevo)
 */
export function generateEvolucionadorTemplate(interconsulta: InterconsultaRow): string {
  return `PACIENTE: ${interconsulta.nombre}
DNI: ${interconsulta.dni}, EDAD: ${interconsulta.edad || 'No especificada'}, CAMA: ${interconsulta.cama}

Antecedentes:

Enfermedad actual:
${interconsulta.relato_consulta || ''}

Examen neurológico

Estudios complementarios
${interconsulta.estudios_ocr ? interconsulta.estudios_ocr + '\n' : ''}
Interpretación

Sugerencias

Personal interviniente
`;
}

/**
 * Genera template estructurado para Evolucionador desde paciente Post-Alta
 * @param patient - Datos del paciente post-alta
 * @returns Template con secciones estructuradas pre-cargadas
 */
export function generateEvolucionadorTemplateFromPostAlta(patient: PacientePostAltaRow): string {
  // Formatear fecha de visita
  const fechaVisita = patient.fecha_visita
    ? new Date(patient.fecha_visita).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'No especificada';

  // Construir header con notas previas SI existen (al inicio del template)
  const notasPrevias = patient.notas_evolucion?.trim() || '';
  const headerPrevio = notasPrevias
    ? `--- EVOLUCIÓN PREVIA ---\n${notasPrevias}\n\n--- NUEVA EVOLUCIÓN ---\n\n`
    : '';

  // Construir sección de pendiente si existe
  const pendientePrevio = patient.pendiente?.trim()
    ? `Pendiente previo: ${patient.pendiente.trim()}`
    : '';

  return `${headerPrevio}PACIENTE: ${patient.nombre}
DNI: ${patient.dni}, EDAD: No especificada, CAMA: Ambulatorio

Antecedentes:
${patient.diagnostico || ''}

Enfermedad actual:
Paciente en seguimiento ambulatorio post-alta.
Fecha de visita programada: ${fechaVisita}

Examen neurológico

Estudios complementarios

Interpretación

Sugerencias
${pendientePrevio}

Personal interviniente
`;
}

export function generateStructuredTemplateFromInterconsulta(interconsulta: InterconsultaRow): StructuredSections {
  const structured = createEmptyStructuredSections();
  structured.datosPaciente.nombre = interconsulta.nombre || '';
  structured.datosPaciente.dni = interconsulta.dni || '';
  structured.datosPaciente.edad = interconsulta.edad || '';
  structured.datosPaciente.cama = interconsulta.cama || '';
  structured.motivoConsulta.texto = interconsulta.relato_consulta || '';
  structured.estudiosComplementarios.texto = interconsulta.estudios_ocr || '';
  return structured;
}

export function generateStructuredTemplateFromPostAlta(patient: PacientePostAltaRow): StructuredSections {
  const structured = createEmptyStructuredSections();
  structured.datosPaciente.nombre = patient.nombre || '';
  structured.datosPaciente.dni = patient.dni || '';
  structured.datosPaciente.edad = '';
  structured.datosPaciente.cama = 'Ambulatorio';

  if (patient.diagnostico) {
    structured.antecedentes.texto = patient.diagnostico;
  }

  const fechaVisita = patient.fecha_visita
    ? new Date(patient.fecha_visita).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'No especificada';

  structured.motivoConsulta.texto = `Paciente en seguimiento ambulatorio post-alta.\\nFecha de visita programada: ${fechaVisita}`;

  if (patient.pendiente?.trim()) {
    structured.sugerencias = `Pendiente previo: ${patient.pendiente.trim()}`;
  }

  if (patient.notas_evolucion?.trim()) {
    structured.interpretacion = patient.notas_evolucion.trim();
  }

  return structured;
}

/**
 * Sincroniza las notas de evolución de vuelta al paciente Post-Alta
 * @param postAltaPatientId - ID del paciente post-alta
 * @param evolutionNotes - Notas de evolución a sincronizar
 * @returns Resultado con éxito/error
 */
export async function syncNotesToPostAltaPatient(
  postAltaPatientId: string,
  evolutionNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[WorkflowIntegration] syncNotesToPostAltaPatient -> ID:', postAltaPatientId);

    // Obtener notas existentes
    const { data: patient, error: fetchError } = await supabase
      .from('pacientes_post_alta')
      .select('notas_evolucion')
      .eq('id', postAltaPatientId)
      .single();

    if (fetchError) {
      console.error('[WorkflowIntegration] Error al obtener paciente post-alta:', fetchError);
      return { success: false, error: 'No se pudo obtener el paciente' };
    }

    // Crear timestamp
    const timestamp = new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Append con separador
    const existingNotes = patient?.notas_evolucion?.trim() || '';
    const newSection = `--- Evolución ${timestamp} ---\n${evolutionNotes}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${newSection}`
      : newSection;

    // Actualizar
    const { error: updateError } = await supabase
      .from('pacientes_post_alta')
      .update({ notas_evolucion: updatedNotes })
      .eq('id', postAltaPatientId);

    if (updateError) {
      console.error('[WorkflowIntegration] Error al actualizar paciente post-alta:', updateError);
      return { success: false, error: 'No se pudo actualizar el paciente' };
    }

    console.log('[WorkflowIntegration] ✓ Notas sincronizadas a paciente post-alta');
    return { success: true };
  } catch (error: any) {
    console.error('[WorkflowIntegration] syncNotesToPostAltaPatient error:', error);
    return { success: false, error: error?.message || 'Error desconocido' };
  }
}

/**
 * Extrae secciones estructuradas del texto del Evolucionador (FORMATO NUEVO)
 * @param clinicalNotes - Notas clínicas completas del evolucionador en formato nuevo
 * @returns Objeto con las secciones extraídas del formato nuevo
 */
function extractStructuredSections_Nuevo(clinicalNotes: string): {
  paciente: string;
  datosBasicos: string;
  antecedentes: string;
  enfermedadActual: string;
  examenNeurologico: string;
  estudiosComplementarios: string;
  interpretacion: string;
  sugerencias: string;
  personalInterviniente: string;
} {
  const sections = {
    paciente: '',
    datosBasicos: '',
    antecedentes: '',
    enfermedadActual: '',
    examenNeurologico: '',
    estudiosComplementarios: '',
    interpretacion: '',
    sugerencias: '',
    personalInterviniente: ''
  };

  console.log('[WorkflowIntegration] extractStructuredSections_Nuevo -> Input length:', clinicalNotes.length);

  // Regex patterns para formato nuevo
  const patterns = {
    // PACIENTE: Nombre (primera línea)
    paciente: /^PACIENTE:\s*(.+?)(?=\n)/m,

    // DNI, EDAD, CAMA (segunda línea)
    datosBasicos: /DNI:\s*(.+?)(?=\n\n|$)/s,

    // Antecedentes
    antecedentes: /Antecedentes:\s*\n+([^\n]*(?:\n(?!Enfermedad actual:)[^\n]*)*)/i,

    // Enfermedad actual
    enfermedadActual: /Enfermedad actual:\s*\n+([^\n]*(?:\n(?!Examen neurológico)[^\n]*)*)/i,

    // Examen neurológico
    examenNeurologico: /Examen neurológico\s*\n+([^\n]*(?:\n(?!Estudios complementarios)[^\n]*)*)/i,

    // Estudios complementarios
    estudiosComplementarios: /Estudios complementarios\s*\n+([^\n]*(?:\n(?!Interpretación)[^\n]*)*)/i,

    // Interpretación
    interpretacion: /Interpretación\s*\n+([^\n]*(?:\n(?!Sugerencias)[^\n]*)*)/i,

    // Sugerencias
    sugerencias: /Sugerencias\s*\n+([^\n]*(?:\n(?!Personal interviniente)[^\n]*)*)/i,

    // Personal interviniente
    personalInterviniente: /Personal interviniente\s*\n+([^\n]*(?:\n[^\n]*)*)/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = clinicalNotes.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      sections[key as keyof typeof sections] = extracted;
      console.log(`[WorkflowIntegration] ✅ Extracted ${key}:`, extracted.substring(0, 100) + (extracted.length > 100 ? '...' : ''));
    } else {
      console.log(`[WorkflowIntegration] ⚠️ No match for ${key}`);
    }
  }

  // Log resumen
  console.log('[WorkflowIntegration] Extraction summary (NUEVO):', {
    paciente: sections.paciente.length,
    datosBasicos: sections.datosBasicos.length,
    antecedentes: sections.antecedentes.length,
    enfermedadActual: sections.enfermedadActual.length,
    examenNeurologico: sections.examenNeurologico.length,
    estudiosComplementarios: sections.estudiosComplementarios.length,
    interpretacion: sections.interpretacion.length,
    sugerencias: sections.sugerencias.length,
    personalInterviniente: sections.personalInterviniente.length
  });

  return sections;
}

/**
 * Extrae secciones estructuradas del texto del Evolucionador (FORMATO SOAP ANTIGUO)
 * @param clinicalNotes - Notas clínicas completas del evolucionador en formato SOAP
 * @returns Objeto con las secciones extraídas del formato SOAP
 */
function extractStructuredSections_SOAP(clinicalNotes: string): {
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

  console.log('[WorkflowIntegration] extractStructuredSections_SOAP -> Input length:', clinicalNotes.length);

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
 * Extrae secciones estructuradas del texto del Evolucionador
 * Detecta automáticamente el formato (SOAP antiguo o nuevo) y usa el parser apropiado
 * @param clinicalNotes - Notas clínicas completas del evolucionador
 * @returns Objeto con las secciones extraídas (formato varía según detección)
 */
export function extractStructuredSections(clinicalNotes: string): any {
  // Detectar formato automáticamente
  const hasNewFormat = /^PACIENTE:/.test(clinicalNotes.trim());
  const hasSOAPFormat = /^DATOS:/i.test(clinicalNotes.trim());

  if (hasNewFormat) {
    console.log('[WorkflowIntegration] ✅ Formato NUEVO detectado');
    return extractStructuredSections_Nuevo(clinicalNotes);
  } else if (hasSOAPFormat) {
    console.log('[WorkflowIntegration] ℹ️ Formato SOAP detectado (compatibilidad)');
    return extractStructuredSections_SOAP(clinicalNotes);
  } else {
    // Default: asumir SOAP para compatibilidad con evoluciones viejas
    console.warn('[WorkflowIntegration] ⚠️ Formato desconocido, asumiendo SOAP');
    return extractStructuredSections_SOAP(clinicalNotes);
  }
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
 * Extrae campos individuales de la línea de datos básicos (formato nuevo)
 * @param datosLine - Línea con formato "DNI: X, EDAD: Y, CAMA: Z"
 * @returns Objeto con campos dni, edad, cama
 */
export function extractDataFieldsFromLine(datosLine: string): {
  dni: string;
  edad: string;
  cama: string;
} {
  const fields = {
    dni: '',
    edad: '',
    cama: ''
  };

  // Formato: "DNI: 12345678, EDAD: 45, CAMA: 4-3"
  const dniMatch = datosLine.match(/DNI:\s*([^,\n]+)/i);
  if (dniMatch) fields.dni = dniMatch[1].trim();

  const edadMatch = datosLine.match(/EDAD:\s*([^,\n]+)/i);
  if (edadMatch) fields.edad = edadMatch[1].trim();

  const camaMatch = datosLine.match(/CAMA:\s*(.+?)(?=\n|$)/i);
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

  if (assessment.format_version === 2 && assessment.structured_sections) {
    console.log('[WorkflowIntegration] ✅ Usando structured_sections (format_version=2)');
    const structured = assessment.structured_sections as StructuredSections;

    const antecedentesParts = [
      structured.antecedentes.patologias.length
        ? `Patologias: ${structured.antecedentes.patologias.join(', ')}`
        : '',
      structured.antecedentes.texto.trim(),
      structured.antecedentes.medicacionHabitual.trim()
        ? `Medicacion habitual: ${structured.antecedentes.medicacionHabitual.trim()}`
        : '',
      structured.antecedentes.alergias.trim()
        ? `Alergias: ${structured.antecedentes.alergias.trim()}`
        : ''
    ].filter(Boolean).join('\n');

    const motivoParts = [
      structured.motivoConsulta.texto.trim(),
      structured.motivoConsulta.enfermedadActual.trim()
        ? `Enfermedad actual: ${structured.motivoConsulta.enfermedadActual.trim()}`
        : ''
    ].filter(Boolean).join('\n');

    const examenParts = [
      structured.examenFisico.texto.trim(),
      structured.examenFisico.examenNeurologico.trim()
        ? `Examen neurologico: ${structured.examenFisico.examenNeurologico.trim()}`
        : ''
    ].filter(Boolean).join('\n');

    const estudiosParts = [
      structured.estudiosComplementarios.texto.trim(),
      structured.estudiosComplementarios.laboratorio.trim()
        ? `Laboratorio: ${structured.estudiosComplementarios.laboratorio.trim()}`
        : '',
      structured.estudiosComplementarios.imagenes.trim()
        ? `Imagenes: ${structured.estudiosComplementarios.imagenes.trim()}`
        : '',
      structured.estudiosComplementarios.otros.trim()
        ? `Otros: ${structured.estudiosComplementarios.otros.trim()}`
        : ''
    ].filter(Boolean).join('\n');

    return {
      nombre: structured.datosPaciente.nombre || interconsulta.nombre,
      dni: structured.datosPaciente.dni || interconsulta.dni,
      edad: structured.datosPaciente.edad || interconsulta.edad || '',
      cama: structured.datosPaciente.cama || interconsulta.cama,
      fecha: new Date().toISOString().split('T')[0],

      antecedentes: antecedentesParts || '',
      motivo_consulta: motivoParts || '',
      examen_fisico: examenParts || '',
      estudios: estudiosParts || '',

      diagnostico: structured.interpretacion || '',
      plan: structured.sugerencias || '',

      pendientes: '',

      image_thumbnail_url: interconsulta.image_thumbnail_url || [],
      image_full_url: interconsulta.image_full_url || [],
      exa_url: interconsulta.exa_url || [],

      hospital_context: interconsulta.hospital_context || 'Posadas',
      severidad: 'II',
      display_order: 9999
    };
  }

  const sections = extractStructuredSections(assessment.clinical_notes);

  // Caso 1: Formato NUEVO
  if ('paciente' in sections && sections.paciente) {
    console.log('[WorkflowIntegration] ✅ Usando formato NUEVO para mapeo');

    const dataFields = extractDataFieldsFromLine(sections.datosBasicos);

    return {
      nombre: sections.paciente || interconsulta.nombre,
      dni: dataFields.dni || interconsulta.dni,
      edad: dataFields.edad || interconsulta.edad || '',
      cama: dataFields.cama || interconsulta.cama,
      fecha: new Date().toISOString().split('T')[0],

      antecedentes: sections.antecedentes || '',
      motivo_consulta: sections.enfermedadActual || '',
      examen_fisico: sections.examenNeurologico || '',
      estudios: sections.estudiosComplementarios || '',

      // Mapear nuevas secciones a campos existentes
      diagnostico: sections.interpretacion || '',
      plan: sections.sugerencias || '',

      // Personal interviniente NO se mapea (se ignora según requerimientos)
      pendientes: '',

      image_thumbnail_url: interconsulta.image_thumbnail_url || [],
      image_full_url: interconsulta.image_full_url || [],
      exa_url: interconsulta.exa_url || [],

      hospital_context: interconsulta.hospital_context || 'Posadas',
      severidad: 'II',
      display_order: 9999
    };
  }

  // Caso 2: Formato SOAP (compatibilidad hacia atrás)
  console.log('[WorkflowIntegration] ℹ️ Usando formato SOAP para mapeo (compatibilidad)');

  const dataFields = extractDataFields(sections.datos);

  return {
    nombre: dataFields.nombre || interconsulta.nombre,
    dni: dataFields.dni || interconsulta.dni,
    edad: dataFields.edad || interconsulta.edad || assessment.patient_age || '',
    cama: dataFields.cama || interconsulta.cama,
    fecha: new Date().toISOString().split('T')[0],

    antecedentes: sections.antecedentes,
    motivo_consulta: sections.enfermedadActual,
    examen_fisico: sections.examenFisico,
    estudios: sections.estudiosComplementarios,
    plan: sections.conducta,
    diagnostico: extractDiagnosticoFromConducta(sections.conducta),
    pendientes: sections.pendientes,

    image_thumbnail_url: interconsulta.image_thumbnail_url || [],
    image_full_url: interconsulta.image_full_url || [],
    exa_url: interconsulta.exa_url || [],

    hospital_context: interconsulta.hospital_context || 'Posadas',
    severidad: 'II',
    display_order: 9999
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

/**
 * Obtiene interconsulta completa por ID
 * @param id - ID de la interconsulta
 * @returns Datos de la interconsulta o null
 */
export async function getInterconsultaById(id: string): Promise<InterconsultaRow | null> {
  try {
    const { data, error } = await supabase
      .from('interconsultas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[WorkflowIntegration] Error al obtener interconsulta:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[WorkflowIntegration] Error inesperado al obtener interconsulta:', error);
    return null;
  }
}

/**
 * Obtiene assessment de diagnóstico por ID
 * @param id - ID del assessment
 * @returns Datos del assessment o null
 */
export async function getDiagnosticAssessmentById(id: string): Promise<PatientAssessment | null> {
  try {
    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[WorkflowIntegration] Error al obtener assessment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[WorkflowIntegration] Error inesperado al obtener assessment:', error);
    return null;
  }
}

/**
 * Crea paciente en Pase de Sala con datos editados manualmente
 * @param wardData - Datos editados por el usuario en el modal de confirmación
 * @param assessmentId - ID del assessment para marcar como response_sent
 * @returns Resultado con éxito/error y ID del paciente creado
 */
export async function createWardPatientDirectly(
  wardData: any,
  assessmentId: string
): Promise<{ success: boolean; patientId?: string; error?: string }> {
  try {
    console.log('[WorkflowIntegration] createWardPatientDirectly -> Guardando datos editados');

    // 1. Verificar duplicado por DNI
    const { data: existingPatient } = await supabase
      .from('ward_round_patients')
      .select('id, nombre')
      .eq('dni', wardData.dni)
      .eq('hospital_context', wardData.hospital_context || 'Posadas')
      .maybeSingle();

    if (existingPatient) {
      return {
        success: false,
        error: `Ya existe un paciente con DNI ${wardData.dni} en Pase de Sala (${existingPatient.nombre})`
      };
    }

    // 2. Insertar paciente con datos editados
    const { data: newPatient, error: insertError } = await supabase
      .from('ward_round_patients')
      .insert([{
        nombre: wardData.nombre,
        dni: wardData.dni,
        edad: wardData.edad,
        cama: wardData.cama,
        fecha: new Date().toISOString().split('T')[0],
        antecedentes: wardData.antecedentes || '',
        motivo_consulta: wardData.motivo_consulta || '',
        examen_fisico: wardData.examen_fisico || '',
        estudios: wardData.estudios || '',
        plan: wardData.plan || '',
        diagnostico: wardData.diagnostico || '',
        pendientes: wardData.pendientes || '',
        image_thumbnail_url: wardData.image_thumbnail_url || [],
        image_full_url: wardData.image_full_url || [],
        exa_url: wardData.exa_url || [],
        hospital_context: wardData.hospital_context || 'Posadas',
        severidad: wardData.severidad || 'II',
        display_order: wardData.display_order || 9999
      }])
      .select('id')
      .single();

    if (insertError) {
      console.error('[WorkflowIntegration] Error al insertar paciente:', insertError);
      throw insertError;
    }

    // 3. Marcar assessment como response_sent: true
    const { error: updateError } = await supabase
      .from('diagnostic_assessments')
      .update({ response_sent: true })
      .eq('id', assessmentId);

    if (updateError) {
      console.warn('[WorkflowIntegration] No se pudo actualizar assessment:', updateError);
    }

    console.log('[WorkflowIntegration] ✓ Paciente creado exitosamente con datos editados:', newPatient.id);

    return {
      success: true,
      patientId: newPatient.id
    };

  } catch (error: any) {
    console.error('[WorkflowIntegration] Error al crear paciente:', error);
    return {
      success: false,
      error: error?.message || 'Error desconocido'
    };
  }
}
