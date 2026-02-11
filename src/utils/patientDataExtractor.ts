// Utility to extract patient data from clinical notes
export interface ExtractedPatientData {
  name: string;
  age: string;
  dni: string;
  extractedScales: ExtractedScale[];
}

export interface ExtractedScale {
  name: string;
  score: string;
  details: string;
}

/**
 * Extract patient data from clinical notes.
 * @param notes - Clinical notes text
 * @returns Extracted patient data
 */
export function extractPatientData(notes: string): ExtractedPatientData {
  const extractedData: ExtractedPatientData = {
    name: '',
    age: '',
    dni: '',
    extractedScales: []
  };

  const normalizeDni = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 8 ? digits : '';
  };

  // Regex patterns for common headers
  const patterns = {
    name: [
      // Original multiline format
      /(?:^|\n)\s*(?:PACIENTE|Paciente|Nombre|Apellido\s*y\s*Nombre|Nombre\s*y\s*Apellido|Datos\s+paciente)\s*[:\-]\s*([^\n]+?)(?=\s+(?:DNI|EDAD|CAMA)\b|$)/i,
      // Inline format: stops at comma before DNI/EDAD/Edad
      /(?:PACIENTE|Paciente|Nombre|Apellido\s*y\s*Nombre|Nombre\s*y\s*Apellido)\s*[:\-]\s*([^,\n]+?)(?=\s*,\s*(?:DNI|D\.?N\.?I\.?|EDAD|Edad))/i,
      // Simple format: captures name until comma or newline
      /(?:PACIENTE|Paciente|Nombre)\s*[:\-]\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*[,\n]|$)/i
    ],
    age: [
      /(?:^|\n)\s*Edad\s*[:\-]\s*(\d{1,3})/i,
      /(?:^|\n)\s*(\d{1,3})\s*a(?:n|\u00f1)os?/i,
      // Inline format: Edad after comma
      /,\s*Edad\s*[:\-]?\s*(\d{1,3})/i
    ],
    dni: [
      // Original line-start format
      /(?:^|\n)\s*(?:DNI|D\.?N\.?I\.?|Documento(?:\s+Nacional)?|Doc\.?)\s*[:\-]?\s*([0-9.\-\s]{6,12})/i,
      // Inline format: DNI anywhere in text
      /(?:DNI|D\.?N\.?I\.?)\s*[:\-]?\s*([0-9.\-]{6,12})/i
    ]
  };

  // Extract name
  for (const pattern of patterns.name) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      extractedData.name = match[1].trim();
      break;
    }
  }

  // Extract age
  for (const pattern of patterns.age) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      extractedData.age = match[1].trim();
      break;
    }
  }

  // Extract DNI
  for (const pattern of patterns.dni) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      const normalized = normalizeDni(match[1].trim());
      if (normalized) {
        extractedData.dni = normalized;
      }
      break;
    }
  }

  // Extract scale results
  extractedData.extractedScales = extractScaleResults(notes);

  return extractedData;
}

/**
 * Extract scale results from notes.
 * @param notes - Clinical notes
 * @returns Extracted scales array
 */
function extractScaleResults(notes: string): ExtractedScale[] {
  const scales: ExtractedScale[] = [];

  // Patterns for different scales
  const scalePatterns = [
    {
      name: 'NIHSS',
      pattern: /Escala\s+NIHSS[^:]*:\s*(\d+)\s*puntos?\s*(.*?)(?=\n\n|$)/i
    },
    {
      name: 'Glasgow',
      pattern: /(?:Escala\s+)?Glasgow[^:]*:\s*(\d+)\s*puntos?\s*(.*?)(?=\n\n|$)/i
    },
    {
      name: 'UPDRS',
      pattern: /(?:Escala\s+)?UPDRS[^:]*:\s*(\d+)\s*puntos?\s*(.*?)(?=\n\n|$)/i
    },
    {
      name: 'mRS',
      pattern: /(?:Escala\s+)?mRS[^:]*:\s*(\d+)\s*puntos?\s*(.*?)(?=\n\n|$)/i
    },
    {
      name: 'ASPECTS',
      pattern: /(?:Escala\s+)?ASPECTS[^:]*:\s*(\d+)\s*puntos?\s*(.*?)(?=\n\n|$)/i
    }
  ];

  for (const scalePattern of scalePatterns) {
    const match = notes.match(scalePattern.pattern);
    if (match && match[1]) {
      scales.push({
        name: scalePattern.name,
        score: match[1].trim(),
        details: match[2] ? match[2].trim().replace(/\n/g, ' ') : ''
      });
    }
  }

  return scales;
}

/**
 * Validate if extracted data is enough to save.
 * @param data - Extracted data
 * @returns true if valid
 */
export function validatePatientData(data: ExtractedPatientData): boolean {
  // At least a name or one completed scale
  return data.name.length > 0 || data.extractedScales.length > 0;
}

/**
 * Clean and format patient name.
 * @param name - Name to clean
 * @returns Formatted name
 */
export function cleanPatientName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}]+|[^\p{L}\s.'-]+$/gu, '')
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

/**
 * Build a text summary of extracted data.
 * @param data - Extracted data
 * @returns Summary text
 */
export function generateDataSummary(data: ExtractedPatientData): string {
  const parts = [];

  if (data.name) parts.push(`Nombre: ${data.name}`);
  if (data.age) parts.push(`Edad: ${data.age} anos`);
  if (data.dni) parts.push(`DNI: ${data.dni}`);

  if (data.extractedScales.length > 0) {
    parts.push(`Escalas completadas: ${data.extractedScales.length}`);
    data.extractedScales.forEach((scale) => {
      parts.push(`- ${scale.name}: ${scale.score} puntos`);
    });
  }

  return parts.join('\n');
}

export function compileSectionsToText(
  sections: import('../types/evolucionadorStructured').StructuredSections
): string {
  const lines: string[] = [];

  const pushSection = (title: string, content: string) => {
    lines.push(`${title}:`);
    lines.push(content?.trim() ? content.trim() : 'Sin datos');
    lines.push('');
  };

  const { datosPaciente, antecedentes, motivoConsulta, examenFisico, estudiosComplementarios, interpretacion, sugerencias, media } = sections;
  const hasAnyContent = Boolean(
    datosPaciente.nombre ||
      datosPaciente.dni ||
      datosPaciente.edad ||
      datosPaciente.cama ||
      datosPaciente.obraSocial ||
      antecedentes.texto ||
      antecedentes.patologias.length ||
      antecedentes.medicacionHabitual ||
      antecedentes.alergias ||
      motivoConsulta.texto ||
      motivoConsulta.enfermedadActual ||
      examenFisico.texto ||
      examenFisico.examenNeurologico ||
      estudiosComplementarios.texto ||
      estudiosComplementarios.laboratorio ||
      estudiosComplementarios.imagenes ||
      estudiosComplementarios.otros ||
      interpretacion ||
      sugerencias ||
      (media?.items?.length ?? 0) > 0
  );

  if (!hasAnyContent) {
    return '';
  }

  const headerParts = [
    `PACIENTE: ${datosPaciente.nombre || 'Sin nombre'}`,
    `DNI: ${datosPaciente.dni || 'Sin DNI'}`,
    `EDAD: ${datosPaciente.edad || 'Sin edad'}`,
    `CAMA: ${datosPaciente.cama || 'Sin cama'}`
  ];

  const extraParts = [
    datosPaciente.sexo ? `SEXO: ${datosPaciente.sexo}` : '',
    datosPaciente.obraSocial ? `OBRA SOCIAL: ${datosPaciente.obraSocial}` : ''
  ].filter(Boolean);

  lines.push(headerParts[0]);
  lines.push(`${headerParts.slice(1).join(', ')}${extraParts.length ? `, ${extraParts.join(', ')}` : ''}`);
  lines.push('');

  const antecedentesParts: string[] = [];
  if (antecedentes.patologias.length > 0) {
    antecedentesParts.push(`Patologias frecuentes: ${antecedentes.patologias.join(', ')}`);
  }
  if (antecedentes.texto.trim()) {
    antecedentesParts.push(antecedentes.texto.trim());
  }
  if (antecedentes.medicacionHabitual.trim()) {
    antecedentesParts.push(`Medicacion habitual: ${antecedentes.medicacionHabitual.trim()}`);
  }
  if (antecedentes.alergias.trim()) {
    antecedentesParts.push(`Alergias: ${antecedentes.alergias.trim()}`);
  }
  pushSection('Antecedentes', antecedentesParts.join('\n') || 'Sin datos');

  const motivoParts = [
    motivoConsulta.texto.trim(),
    motivoConsulta.enfermedadActual.trim()
      ? `Enfermedad actual: ${motivoConsulta.enfermedadActual.trim()}`
      : ''
  ].filter(Boolean).join('\n');
  pushSection('Motivo de consulta', motivoParts);

  const examenParts = [
    examenFisico.texto.trim(),
    examenFisico.examenNeurologico.trim()
      ? `Examen neurologico: ${examenFisico.examenNeurologico.trim()}`
      : ''
  ].filter(Boolean).join('\n');
  pushSection('Examen fisico', examenParts);

  const estudiosParts = [
    estudiosComplementarios.texto.trim(),
    estudiosComplementarios.laboratorio.trim()
      ? `Laboratorio: ${estudiosComplementarios.laboratorio.trim()}`
      : '',
    estudiosComplementarios.imagenes.trim()
      ? `Imagenes: ${estudiosComplementarios.imagenes.trim()}`
      : '',
    estudiosComplementarios.otros.trim()
      ? `Otros: ${estudiosComplementarios.otros.trim()}`
      : ''
  ].filter(Boolean).join('\n');
  pushSection('Estudios complementarios', estudiosParts);

  if (interpretacion.trim()) {
    pushSection('Interpretacion', interpretacion.trim());
  }

  if (sugerencias.trim()) {
    pushSection('Sugerencias', sugerencias.trim());
  }

  if (media?.items?.length) {
    const mediaLines = media.items.map(item => {
      const desc = item.description?.trim();
      return `- ${item.category}: ${item.fileName}${desc ? ` (${desc})` : ''}`;
    });
    pushSection('Media', mediaLines.join('\n'));
  }

  return lines.join('\n').trim();
}
