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
  }
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

// Función para calcular la confianza basada en coincidencias
const calculateConfidence = (
  normalizedText: string, 
  pattern: MedicalPattern
): number => {
  const words = normalizedText.split(' ');
  const matchedKeywords: string[] = [];
  
  console.log(`🔍 Testing pattern ${pattern.scaleId} against text:`, normalizedText.substring(0, 100));
  
  pattern.keywords.forEach(keyword => {
    const normalizedKeyword = normalizeText(keyword);
    console.log(`  🔸 Testing keyword "${keyword}" -> "${normalizedKeyword}"`);
    
    // Buscar keyword completa o como parte de palabra
    if (normalizedText.includes(normalizedKeyword)) {
      matchedKeywords.push(keyword);
      console.log(`    ✅ MATCH found for "${keyword}"`);
    } else {
      console.log(`    ❌ No match for "${keyword}"`);
    }
  });
  
  console.log(`  📊 Pattern ${pattern.scaleId}: ${matchedKeywords.length} matches`);
  
  if (matchedKeywords.length === 0) return 0;
  
  // Calcular confianza basada en:
  // - Número de keywords coincidentes
  // - Longitud del texto (más texto = más contexto)
  // - Confianza base del patrón
  const keywordRatio = matchedKeywords.length / pattern.keywords.length;
  const textLengthFactor = Math.min(words.length / 50, 1); // Normalizar longitud
  const baseConfidence = pattern.baseConfidence;
  
  // Combinar factores - AJUSTADO para ser más sensible
  let confidence = baseConfidence * keywordRatio * (0.5 + 0.5 * textLengthFactor);
  
  // Boost si hay múltiples keywords del mismo patrón
  if (matchedKeywords.length >= 2) {
    confidence *= 1.3;
  }
  
  // Para keywords médicas importantes, dar boost extra
  const importantKeywords = ['temblor', 'hemiparesia', 'disartria', 'glasgow', 'ictus', 'debilidad'];
  const hasImportantKeyword = matchedKeywords.some(kw => 
    importantKeywords.some(imp => normalizeText(kw).includes(imp))
  );
  
  if (hasImportantKeyword) {
    confidence *= 1.5; // Boost significativo para keywords médicas importantes
  }
  
  console.log(`  📈 Final confidence for ${pattern.scaleId}: ${confidence.toFixed(3)} (matches: ${matchedKeywords.length}, important: ${hasImportantKeyword})`);
  
  // Limitar entre 0 y 1
  return Math.min(confidence, 1);
};

// Función principal de análisis
export const analyzeText = (text: string): AIAnalysisResult => {
  console.log('🔍 AI Analyzer - Analyzing text:', text.substring(0, 100) + '...');
  
  if (!text || text.trim().length < 10) {
    console.log('❌ AI Analyzer - Text too short, skipping analysis');
    return {
      suggestions: [],
      timestamp: Date.now()
    };
  }
  
  const normalizedText = normalizeText(text);
  const suggestions: AISuggestion[] = [];
  
  MEDICAL_PATTERNS.forEach(pattern => {
    const confidence = calculateConfidence(normalizedText, pattern);
    
    if (confidence >= 0.1) { // Umbral ultra bajo para detectar patrones médicos
      const matchedKeywords = pattern.keywords.filter(keyword => 
        normalizedText.includes(normalizeText(keyword))
      );
      
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