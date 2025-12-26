import Anthropic from '@anthropic-ai/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

// Claude Sonnet 4.5 for better cost efficiency and performance
const CLAUDE_CHAT_MODEL = 'claude-sonnet-4-5-20250929';

// Token limits to stay under $0.10 USD per session
const MAX_INPUT_TOKENS = 8000;  // Per message (includes context + history)
const MAX_OUTPUT_TOKENS = 2000; // Per response

// Claude Sonnet 4.5 pricing
// Input: $3 per million tokens ($0.003 per 1k tokens)
// Output: $15 per million tokens ($0.015 per 1k tokens)
// Estimated cost per message: ~$0.024 (input) + ~$0.030 (output) = ~$0.054
// With 5 messages limit: ~$0.05-0.08 total

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔵 AI Prompt API called');

  if (req.method !== 'POST') {
    console.log('🔴 Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server-side environment variable (not exposed to client)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('🔑 API Key present:', !!apiKey);

  if (!apiKey) {
    console.error('🔴 ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server'
    });
  }

  try {
    const { evolucionadorContent, chatHistory, userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: userMessage'
      });
    }

    // Prepare system prompt with evolucionador content (excluding patient data)
    const systemPrompt = `Eres un asistente médico especializado en neurología que ayuda a analizar y mejorar notas clínicas del evolucionador.

Tu función es:
- Responder preguntas sobre el contenido clínico desarrollado
- Sugerir diagnósticos diferenciales cuando sea apropiado
- Revisar la redacción y estructura de las notas
- Identificar información faltante o inconsistencias
- Proporcionar información médica relevante

IMPORTANTE: NO tienes acceso a los datos personales del paciente (nombre, DNI, etc.). Solo analizas el contenido clínico.

CONTEXTO DEL EVOLUCIONADOR:
${evolucionadorContent || '(No hay contenido en el evolucionador aún)'}

Responde de manera concisa, profesional y en español. Si el contenido del evolucionador está vacío, indica que necesitas contenido para poder ayudar.`;

    // Build conversation history for Claude API
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add previous chat history
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      chatHistory.forEach((msg: ChatMessage) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    console.log(`📝 Processing message with ${messages.length} total messages in history`);

    const client = new Anthropic({
      apiKey,
    });

    const response = await client.messages.create({
      model: CLAUDE_CHAT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      messages: messages,
    });

    // Extract text content from response
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    console.log(`✅ Response generated successfully`);
    console.log(`📊 Usage - Input tokens: ${response.usage.input_tokens}, Output tokens: ${response.usage.output_tokens}`);

    // Calculate approximate cost
    const inputCost = (response.usage.input_tokens / 1000) * 0.003;
    const outputCost = (response.usage.output_tokens / 1000) * 0.015;
    const totalCost = inputCost + outputCost;
    console.log(`💰 Estimated cost: $${totalCost.toFixed(4)} USD`);

    res.status(200).json({
      response: textContent,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        estimated_cost: totalCost
      }
    });
  } catch (error: any) {
    console.error('🔴 AI Prompt API Error:', error);

    // Return detailed error information
    res.status(error?.status || 500).json({
      error: error?.message || 'Error al procesar la solicitud de IA',
      status: error?.status,
      type: error?.type
    });
  }
}
