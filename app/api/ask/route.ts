import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // process.env may have ANTHROPIC_API_KEY set to empty by parent process,
  // so read directly from .env.local as fallback
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env.local');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim();
    } catch {}
  }
  if (!apiKey || apiKey.length < 10) {
    return new Response('API key not configured. Set ANTHROPIC_API_KEY in .env.local', { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const body = await req.json();
    const {
      question,
      targetText,
      targetType,
      surroundingContext,
      paperTitle,
      paperAbstract,
    } = body;

    if (!question || !targetText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = `You are a scholarly reading assistant. The user is reading an academic paper and looking at a specific passage. They have asked you a question about what they're looking at.

Paper: ${paperTitle}
Abstract: ${paperAbstract}

The user is currently looking at this ${targetType}:
---
${targetText}
---

Surrounding context:
---
${surroundingContext}
---

Answer the user's question about this specific passage. Be concise (2-4 paragraphs max). If the target is a reference, explain what the referenced work is about and how it relates to the current paper. If the target is a methods description, explain the method clearly. Use plain language where possible.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });

    // Extract text from the response
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(message, { status: 500 });
  }
}
