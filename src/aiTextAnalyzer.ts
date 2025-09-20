import { AISuggestion, AIAnalysisResult } from './types';

interface MedicalPattern {
  keywords: string[];
  scaleId: string;
  reason: string;
  baseConfidence: number;
}

// Patrones médicos para detección de escalas relevantes
const MEDICAL_PATTERNS: MedicalPattern[] = [
  // NIHSS - Ictus
  {
    keywords: ['ictus', 'avc', 'stroke', 'hemiparesia', 'hemiplejia', 'disartria', 'disfagia', 'afasia', 'desviacion conjugada', 'negligencia', 'ataxia', 'deficit motor', 'deficit sensitivo', 'campo visual', 'debilidad', 'paralisis'],
    scaleId: 'nihss',
    reason: 'Síntomas compatibles con ictus agudo',
    baseConfidence: 0.85
  },
  
  // Glasgow Coma Scale
  {
    keywords: ['glasgow', 'conciencia', 'coma', 'estupor', 'confuso', 'desorientado', 'respuesta verbal', 'apertura ocular', 'respuesta motora', 'tce', 'traumatismo craneal'],
    scaleId: 'glasgow',
    reason: 'Alteración del nivel de conciencia',
    baseConfidence: 0.8
  },
  
  // UPDRS - Parkinson
  {
    keywords: ['parkinson', 'temblor', 'rigidez', 'bradicinesia', 'bradiciensia', 'bradiquinesia', 'acinesia', 'festinacion', 'micrografia', 'hipomimia', 'freezing', 'discinesias', 'fluctuaciones motoras', 'trastorno movimiento'],
    scaleId: 'updrs1',
    reason: 'Síntomas parkinsonianos detectados',
    baseConfidence: 0.75
  },
  {
    keywords: ['parkinson', 'temblor', 'rigidez', 'bradicinesia', 'bradiciensia', 'bradiquinesia', 'acinesia', 'festinacion', 'micrografia', 'hipomimia', 'freezing', 'discinesias', 'fluctuaciones motoras', 'trastorno movimiento'],
    scaleId: 'updrs2',
    reason: 'Síntomas parkinsonianos detectados',
    baseConfidence: 0.75
  },
  {
    keywords: ['parkinson', 'temblor', 'rigidez', 'bradicinesia', 'bradiciensia', 'bradiquinesia', 'acinesia', 'festinacion', 'micrografia', 'hipomimia', 'freezing', 'discinesias', 'fluctuaciones motoras', 'trastorno movimiento'],
    scaleId: 'updrs3',
    reason: 'Síntomas parkinsonianos detectados',
    baseConfidence: 0.75
  },
  {
    keywords: ['parkinson', 'temblor', 'rigidez', 'bradicinesia', 'bradiciensia', 'bradiquinesia', 'acinesia', 'festinacion', 'micrografia', 'hipomimia', 'freezing', 'discinesias', 'fluctuaciones motoras', 'trastorno movimiento'],
    scaleId: 'updrs4',
    reason: 'Síntomas parkinsonianos detectados',
    baseConfidence: 0.75
  },
  
  // Criterios diagnósticos Parkinson
  {
    keywords: ['parkinson', 'temblor de reposo', 'bradicinesia', 'rigidez', 'asimetría', 'levodopa', 'criterios diagnósticos'],
    scaleId: 'parkinson_diagnosis',
    reason: 'Evaluación diagnóstica de Parkinson',
    baseConfidence: 0.9
  },
  
  // Ashworth - Espasticidad
  {
    keywords: ['espasticidad', 'tono muscular', 'hipertonía', 'rigidez', 'contractura', 'clonus', 'reflejo aumentado', 'ashworth'],
    scaleId: 'ashworth',
    reason: 'Alteración del tono muscular',
    baseConfidence: 0.8
  },
  
  // McDonald - Esclerosis Múltiple
  {
    keywords: ['esclerosis múltiple', 'em', 'desmielinizante', 'lesiones', 'brotes', 'recaídas', 'gadolinio', 'bandas oligoclonales', 'dis', 'dit', 'mcdonald'],
    scaleId: 'mcdonald_2024',
    reason: 'Sospecha de esclerosis múltiple',
    baseConfidence: 0.85
  },
  
  // MIDAS - Migraña
  {
    keywords: ['migraña', 'migrana', 'cefalea', 'dolor cabeza', 'dolor de cabeza', 'discapacidad', 'trabajo perdido', 'productividad', 'actividades perdidas', 'dias perdidos', 'ausentismo'],
    scaleId: 'midas',
    reason: 'Evaluación de discapacidad por migraña',
    baseConfidence: 0.8
  },
  
  // MMSE - Evaluación Cognitiva
  {
    keywords: ['deterioro cognitivo', 'demencia', 'alzheimer', 'memoria', 'orientación', 'cálculo', 'denominación', 'repetición', 'mmse', 'minimental', 'mini mental', 'cognición', 'cognitivo'],
    scaleId: 'mmse',
    reason: 'Evaluación cognitiva necesaria',
    baseConfidence: 0.85
  },
  
  // Hoehn y Yahr - Parkinson
  {
    keywords: ['estadificación', 'estadificar', 'progresión', 'bilateral', 'unilateral', 'equilibrio', 'inestabilidad postural', 'hoehn', 'yahr', 'estadio parkinson'],
    scaleId: 'hoehn_yahr',
    reason: 'Estadificación de Parkinson',
    baseConfidence: 0.8
  },
  
  // EDSS - Esclerosis Múltiple
  {
    keywords: ['discapacidad', 'deambulación', 'caminar', 'sistemas funcionales', 'piramidal', 'cerebelar', 'cerebeloso', 'tronco cerebral', 'sensorial', 'vesical', 'visual', 'cerebral', 'edss'],
    scaleId: 'edss',
    reason: 'Evaluación de discapacidad en esclerosis múltiple',
    baseConfidence: 0.8
  },
  
  // Fisher Grade - Hemorragia Subaracnoidea
  {
    keywords: ['fisher', 'subaracnoidea', 'sangrado cisternal', 'coagulo intraventricular', 'hemorragia subaracnoidea', 'sah', 'fisher iv'],
    scaleId: 'fisher_grade',
    reason: 'Clasificacion tomografica para hemorragia subaracnoidea',
    baseConfidence: 0.8
  },
  
  // WFNS - Hemorragia Subaracnoidea
  {
    keywords: ['wfns', 'world federation', 'gcs 13', 'deficit motor', 'hemorragia subaracnoidea', 'wfns v', 'wfns iii'],
    scaleId: 'wfns',
    reason: 'Gradar severidad clinica en hemorragia subaracnoidea',
    baseConfidence: 0.78
  },
  
  // Epworth Sleepiness Scale
  {
    keywords: ['epworth', 'somnolencia diurna', 'hipersomnia', 'quedarse dormido', 'suenio', 'sueno excesivo', 'somnolencia'],
    scaleId: 'epworth',
    reason: 'Evaluar somnolencia diurna excesiva',
    baseConfidence: 0.75
  },
];

// Función para normalizar texto (eliminar acentos, minúsculas)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = (normalizedText: string): string[] =>
  normalizedText.split(' ').filter(Boolean);

const getMatchedKeywords = (
  normalizedText: string,
  pattern: MedicalPattern,
  tokens: string[]
): string[] => {
  if (!normalizedText) return [];

  const tokenSet = new Set(tokens);

  return pattern.keywords.filter(keyword => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return false;

    if (normalizedKeyword.includes(' ')) {
      return normalizedText.includes(normalizedKeyword);
    }

    if (tokenSet.has(normalizedKeyword)) {
      return true;
    }

    if (normalizedKeyword.length <= 3) {
      return false;
    }

    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }

    for (const token of tokenSet) {
      if (token.length >= 4 && normalizedKeyword.startsWith(token)) return true;
      if (normalizedKeyword.length >= 4 && token.startsWith(normalizedKeyword)) return true;
    }

    return false;
  });
};

// Función para calcular la confianza basada en coincidencias
const calculateConfidence = (
  matchedKeywords: string[],
  pattern: MedicalPattern,
  tokenCount: number
): number => {
  if (matchedKeywords.length === 0) return 0;

  const baseConfidence = pattern.baseConfidence;
  const matchScore = Math.min(matchedKeywords.length / 3, 1);
  const coverageWeight = 0.35 + 0.65 * matchScore;
  const lengthWeight =
  tokenCount < 12
    ? 0.85
    : Math.min(1, 0.85 + (tokenCount - 12) / 120);

  let confidence = baseConfidence * coverageWeight * lengthWeight;

  if (matchedKeywords.length >= 3) {
    confidence += 0.1;
  }

  const importantKeywords = ['temblor', 'hemiparesia', 'disartria', 'glasgow', 'ictus', 'debilidad', 'somnolencia'];
  const hasImportantKeyword = matchedKeywords.some(kw =>
    importantKeywords.some(imp => normalizeText(kw).includes(imp))
  );

  if (hasImportantKeyword) {
    confidence += 0.15;
  }

  return Math.min(confidence, 1);
};

// Función principal de análisis
export const analyzeText = (text: string): AIAnalysisResult => {
  console.log('🔍 AI Analyzer - Analyzing text:', text.substring(0, 100) + '...');
  
  if (!text || text.trim().length < 6) {
    console.log('⚠️ AI Analyzer - Text too short, skipping analysis');
    return {
      suggestions: [],
      timestamp: Date.now()
    };
  }
  
  const normalizedText = normalizeText(text);
  const suggestions: AISuggestion[] = [];
  
  const tokens = tokenize(normalizedText);

  MEDICAL_PATTERNS.forEach(pattern => {
    const matchedKeywords = getMatchedKeywords(normalizedText, pattern, tokens);
    const confidence = calculateConfidence(matchedKeywords, pattern, tokens.length);

    if (confidence >= 0.1) {
      suggestions.push({
        scaleId: pattern.scaleId,
        confidence,
        keywords: matchedKeywords,
        reason: pattern.reason
      });
    }
  });
  
  // Ordenar por confianza descendente
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  // Limitar a las 5 mejores sugerencias
  const topSuggestions = suggestions.slice(0, 5);
  
  console.log('✅ AI Analyzer - Found suggestions:', topSuggestions.length);
  console.log('📊 AI Analyzer - Suggestions:', topSuggestions);
  
  return {
    suggestions: topSuggestions,
    timestamp: Date.now()
  };
};

// Hook personalizado para usar el analizador con debouncing
import { useState, useEffect } from 'react';

export const useAITextAnalysis = (text: string, delay: number = 1000) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult>({
    suggestions: [],
    timestamp: Date.now()
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = analyzeText(text);
      setAnalysis(result);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [text, delay]);
  
  return analysis;
};