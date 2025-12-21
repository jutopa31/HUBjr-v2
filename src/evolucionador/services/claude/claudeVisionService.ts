import Anthropic from '@anthropic-ai/sdk';
import { loadAIConfig } from '../../../aiConfig';
import {
  CLAUDE_COST_RATES,
  CLAUDE_OCR_CACHE_TTL_SECONDS,
  CLAUDE_VISION_MAX_TOKENS,
  CLAUDE_VISION_MODEL
} from '../../config/claude.config';
import type {
  ClaudeVisionDocumentType,
  ClaudeVisionModel,
  ClaudeVisionResponse,
  ClaudeVisionUsage
} from '../../types/claude.types';
import { ClaudeCacheService } from './claudeCacheService';

interface ClaudeVisionServiceOptions {
  apiKey?: string;
  model?: ClaudeVisionModel;
}

export class ClaudeVisionService {
  private client: Anthropic;
  private cacheService: ClaudeCacheService;
  private model: ClaudeVisionModel;

  constructor(options?: ClaudeVisionServiceOptions) {
    const config = typeof window !== 'undefined' ? loadAIConfig() : null;
    const apiKey =
      options?.apiKey ||
      (config?.provider === 'claude' && config.enabled ? config.apiKey : '') ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      '';
    if (!apiKey) {
      throw new Error('Anthropic API key missing. Set NEXT_PUBLIC_ANTHROPIC_API_KEY or configure it in AI settings.');
    }

    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.cacheService = new ClaudeCacheService();
    this.model = options?.model || CLAUDE_VISION_MODEL;
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

    const message = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: CLAUDE_VISION_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageType,
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      },
      { signal }
    );

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
      generic: `Extrae el texto completo del documento medico y, si es posible, organiza en secciones clinicas.`
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

  private extractTextFromMessage(content: Anthropic.Messages.ContentBlock[]): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();
  }

  private normalizeUsage(usage?: Anthropic.Messages.Message['usage']): ClaudeVisionUsage {
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
    const prefix = imageBase64.slice(0, 64);
    const hash = await this.hashString(prefix + imageType + documentType);
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
