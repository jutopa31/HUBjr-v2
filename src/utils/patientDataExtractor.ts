// Utilidad para extraer datos de paciente desde las notas clínicas
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
 * Extrae información del paciente desde las notas clínicas
 * @param notes - Notas clínicas del paciente
 * @returns Datos extraídos del paciente
 */
export function extractPatientData(notes: string): ExtractedPatientData {
  const extractedData: ExtractedPatientData = {
    name: '',
    age: '',
    dni: '',
    extractedScales: []
  };

  // Patrones de regex para extraer información
  const patterns = {
    // Buscar nombres después de "Nombre:", "Paciente:", etc.
    name: [
      /Nombre:\s*([A-ZÁÉÍÓÚ][a-záéíóú\s]+)/i,
      /Paciente:\s*([A-ZÁÉÍÓÚ][a-záéíóú\s]+)/i,
      /Datos\s+paciente:\s*([A-ZÁÉÍÓÚ][a-záéíóú\s]+)/i
    ],
    
    // Buscar edad
    age: [
      /Edad:\s*(\d{1,3})\s*(?:años?)?/i,
      /(\d{1,3})\s*años/i,
      /Edad:\s*(\d{1,3})/i
    ],
    
    // Buscar DNI
    dni: [
      /DNI:\s*(\d{7,8})/i,
      /D\.?N\.?I\.?:\s*(\d{7,8})/i,
      /Documento:\s*(\d{7,8})/i
    ]
  };

  // Extraer nombre
  for (const pattern of patterns.name) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      extractedData.name = match[1].trim();
      break;
    }
  }

  // Extraer edad
  for (const pattern of patterns.age) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      extractedData.age = match[1].trim();
      break;
    }
  }

  // Extraer DNI
  for (const pattern of patterns.dni) {
    const match = notes.match(pattern);
    if (match && match[1]) {
      extractedData.dni = match[1].trim();
      break;
    }
  }

  // Extraer resultados de escalas
  extractedData.extractedScales = extractScaleResults(notes);

  return extractedData;
}

/**
 * Extrae los resultados de escalas desde las notas
 * @param notes - Notas clínicas
 * @returns Array de escalas extraídas
 */
function extractScaleResults(notes: string): ExtractedScale[] {
  const scales: ExtractedScale[] = [];
  
  // Patrones para diferentes escalas
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
 * Valida si los datos extraídos son suficientes para guardar
 * @param data - Datos extraídos
 * @returns true si los datos son válidos
 */
export function validatePatientData(data: ExtractedPatientData): boolean {
  // Al menos debe tener nombre o alguna escala completada
  return data.name.length > 0 || data.extractedScales.length > 0;
}

/**
 * Limpia y formatea el nombre del paciente
 * @param name - Nombre a limpiar
 * @returns Nombre formateado
 */
export function cleanPatientName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ\s]+$/g, '') // Remover caracteres especiales al inicio/final
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase()); // Primera letra de cada palabra en mayúscula
}

/**
 * Genera un resumen de los datos extraídos para mostrar al usuario
 * @param data - Datos extraídos
 * @returns Resumen en texto
 */
export function generateDataSummary(data: ExtractedPatientData): string {
  const parts = [];
  
  if (data.name) parts.push(`Nombre: ${data.name}`);
  if (data.age) parts.push(`Edad: ${data.age} años`);
  if (data.dni) parts.push(`DNI: ${data.dni}`);
  
  if (data.extractedScales.length > 0) {
    parts.push(`Escalas completadas: ${data.extractedScales.length}`);
    data.extractedScales.forEach(scale => {
      parts.push(`- ${scale.name}: ${scale.score} puntos`);
    });
  }

  return parts.join('\n');
}