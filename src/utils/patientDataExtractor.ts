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
