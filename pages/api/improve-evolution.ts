import Anthropic from '@anthropic-ai/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Claude Sonnet for cost efficiency
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_OUTPUT_TOKENS = 4000;

// Load skill from markdown file
function loadSkill(): string {
  try {
    const skillPath = path.join(process.cwd(), 'src', 'skills', 'improve-evolution.md');
    return fs.readFileSync(skillPath, 'utf-8');
  } catch (error) {
    console.error('Error loading skill file:', error);
    // Fallback inline prompt if file not found
    return `Eres un neurologo experimentado. Mejora la siguiente nota de evolucion medica para hacerla mas profesional, estructurada y clinicamente util. Mantén el formato de secciones y no inventes datos.`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔵 Improve Evolution API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('🔴 ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server'
    });
  }

  try {
    const { evolutionNote } = req.body;

    if (!evolutionNote || typeof evolutionNote !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: evolutionNote'
      });
    }

    if (evolutionNote.trim().length < 50) {
      return res.status(400).json({
        error: 'La nota de evolucion es muy corta para mejorar. Agrega mas contenido.'
      });
    }

    // Load the skill prompt
    const skillPrompt = loadSkill();

    console.log('📝 Processing evolution note improvement');
    console.log('📄 Skill loaded, length:', skillPrompt.length);

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: skillPrompt,
      messages: [
        {
          role: 'user',
          content: `Mejora la siguiente nota de evolucion:\n\n${evolutionNote}`
        }
      ],
    });

    // Extract text content
    const improvedNote = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    console.log('✅ Evolution note improved successfully');
    console.log(`📊 Usage - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);

    // Calculate cost (Sonnet 4.5 pricing)
    const inputCost = (response.usage.input_tokens / 1000) * 0.003;
    const outputCost = (response.usage.output_tokens / 1000) * 0.015;
    const totalCost = inputCost + outputCost;
    console.log(`💰 Estimated cost: $${totalCost.toFixed(4)} USD`);

    res.status(200).json({
      improvedNote,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        estimated_cost: totalCost
      }
    });
  } catch (error: any) {
    console.error('🔴 Improve Evolution API Error:', error);

    res.status(error?.status || 500).json({
      error: error?.message || 'Error al procesar la mejora de la evolucion',
      status: error?.status,
      type: error?.type
    });
  }
}
