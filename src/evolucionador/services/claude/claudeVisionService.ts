import {
  CLAUDE_COST_RATES,
  CLAUDE_OCR_CACHE_TTL_SECONDS
} from '../../config/claude.config';
import type {
  ClaudeVisionDocumentType,
  ClaudeVisionResponse,
  ClaudeVisionUsage
} from '../../types/claude.types';
import { ClaudeCacheService } from './claudeCacheService';

export class ClaudeVisionService {
  private cacheService: ClaudeCacheService;

  constructor() {
    this.cacheService = new ClaudeCacheService();
  }

  async processImage(params: {
    imageBase64: string;
    imageType: 'image/jpeg' | 'image/png' | 'image/webp';
    documentType: ClaudeVisionDocumentType;
    signal?: AbortSignal;
    bypassCache?: boolean;
  }): Promise<ClaudeVisionResponse> {
    const { imageBase64, imageType, documentType, signal, bypassCache } = params;

    const cacheKey = await this.generateCacheKey(imageBase64, imageType, documentType);
    if (!bypassCache) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    const prompt = this.buildPromptForType(documentType);
    const startTime = Date.now();

    try {
      // Call our secure API route instead of Anthropic directly
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64,
          imageType,
          prompt
        }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw {
          status: response.status,
          message: errorData.error || `HTTP ${response.status}`,
          type: errorData.type
        };
      }

      const message = await response.json();

      const processingTimeMs = Date.now() - startTime;
      const extractedText = this.extractTextFromMessage(message.content);
      const usage = this.normalizeUsage(message.usage);
      const tokensUsed = usage.inputTokens + usage.outputTokens;
      const cost = this.calculateCost(usage);

      const result: ClaudeVisionResponse = {
        extractedText,
        confidence: this.estimateConfidence(extractedText),
        processingTimeMs,
        tokensUsed,
        cost
      };

      await this.cacheService.set(cacheKey, result, CLAUDE_OCR_CACHE_TTL_SECONDS);

      return result;
    } catch (error: any) {
      // Enhanced error handling with descriptive messages
      if (error?.name === 'AbortError') {
        throw new Error('Procesamiento cancelado por el usuario.');
      }
      if (error?.status === 401) {
        throw new Error('API key inválida o expirada. Verifica la configuración del servidor.');
      }
      if (error?.status === 404) {
        throw new Error('Modelo no encontrado. Verifica la configuración del servidor.');
      }
      if (error?.status === 429) {
        throw new Error('Límite de uso de API alcanzado. Espera unos minutos e intenta nuevamente.');
      }
      if (error?.status === 500 || error?.status === 503) {
        throw new Error('Error del servidor. Intenta nuevamente más tarde.');
      }

      // Generic error with original message
      const errorMessage = error?.message || 'Error desconocido al procesar la imagen';
      throw new Error(`Error de Claude Vision: ${errorMessage}`);
    }
  }

  private buildPromptForType(type: ClaudeVisionDocumentType): string {
    const prompts: Record<ClaudeVisionDocumentType, string> = {
      form: `Extrae datos de este formulario medico. Identifica:
- Datos del paciente (nombre, DNI, edad, cama)
- Diagnosticos y antecedentes
- Medicacion actual
- Signos vitales

Devuelve SOLO JSON valido:
{
  "patient": { "name": "", "dni": "", "age": "", "bed": "" },
  "clinicalHistory": "",
  "currentMedication": [],
  "vitalSigns": {},
  "diagnosis": []
}`,
      lab_report: `Extrae resultados del estudio de laboratorio. Identifica:
- Tipo de estudio
- Fecha
- Resultados con valores y unidades
- Valores fuera de rango

Devuelve SOLO JSON valido:
{
  "studyType": "",
  "date": "",
  "results": [{ "test": "", "value": "", "unit": "", "normalRange": "", "abnormal": false }]
}`,
      imaging_report: `Extrae informacion de informe de imagen. Identifica:
- Tipo de estudio
- Fecha
- Hallazgos principales
- Conclusiones

Devuelve SOLO JSON valido:
{
  "studyType": "",
  "date": "",
  "findings": "",
  "conclusion": ""
}`,
      generic: `Realiza OCR (reconocimiento óptico de caracteres) en esta imagen y devuelve ÚNICAMENTE el texto que se ve en el documento, palabra por palabra, tal como aparece. No agregues explicaciones, no resumas, no interpretes. Solo transcribe exactamente todo el texto visible.`
    };

    return prompts[type] || prompts.generic;
  }

  private calculateCost(usage: ClaudeVisionUsage): number {
    const inputCost = (usage.inputTokens / 1000) * CLAUDE_COST_RATES.inputPer1k;
    const outputCost = (usage.outputTokens / 1000) * CLAUDE_COST_RATES.outputPer1k;
    return inputCost + outputCost;
  }

  private estimateConfidence(text: string): number {
    if (!text || text.length < 50) return 0.3;
    if (text.includes('{') && text.includes('}')) return 0.9;
    if (text.length > 200) return 0.8;
    return 0.6;
  }

  private extractTextFromMessage(content: any[]): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();
  }

  private normalizeUsage(usage?: any): ClaudeVisionUsage {
    return {
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0
    };
  }

  private async generateCacheKey(
    imageBase64: string,
    imageType: string,
    documentType: ClaudeVisionDocumentType
  ): Promise<string> {
    // Use entire image data for hash to avoid cache collisions
    const hash = await this.hashString(imageBase64 + imageType + documentType);
    return `ocr_${documentType}_${hash}`;
  }

  private async hashString(value: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
  }
}
