import Anthropic from '@anthropic-ai/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  CLAUDE_VISION_MAX_TOKENS,
  CLAUDE_VISION_MODEL
} from '../../src/evolucionador/config/claude.config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server-side environment variable (not exposed to client)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server'
    });
  }

  try {
    const { imageBase64, imageType, prompt } = req.body;

    if (!imageBase64 || !imageType || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: imageBase64, imageType, or prompt'
      });
    }

    const client = new Anthropic({
      apiKey,
    });

    const message = await client.messages.create({
      model: CLAUDE_VISION_MODEL,
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
    });

    // Return the full Anthropic message response
    res.status(200).json(message);
  } catch (error: any) {
    console.error('🔴 OCR API Error:', error);

    // Return detailed error information
    res.status(error?.status || 500).json({
      error: error?.message || 'Unknown error processing OCR',
      status: error?.status,
      type: error?.type
    });
  }
}
