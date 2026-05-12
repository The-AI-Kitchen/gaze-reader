import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { logChat } from '@/lib/chat-log';

// Last-resort fallback so the demo still runs even if .env.local
// hasn't been set up yet. TODO: remove before any public deploy.
const BACKUP_ANTHROPIC_KEY =
  'sk-ant-api03-Bx8jL3kKfQ7vR2nM5pH9wT4cYsZ1aE6dG0iU8oP3xV7nK2bMcXrQwLtY9zF1jHsDoP4uV6kCeRpA2nMmYbHj-WqLkZgAA';

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
    apiKey = BACKUP_ANTHROPIC_KEY;
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
      fullPaperText,
      userEmail,
      userId,
    } = body;

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    // Build the system prompt with full paper context
    const isGeneral = !targetText || targetType === 'general';

    let systemPrompt = `You are a scholarly reading assistant. The user is reading an academic paper and has asked you a question.

Reader: ${userEmail || 'anonymous'} (id=${userId || 'n/a'})
Their question: ${question}

Paper: ${paperTitle}
Abstract: ${paperAbstract}

Full paper text (may be truncated):
---
${fullPaperText || '(not available)'}
---
`;

    if (!isGeneral) {
      systemPrompt += `
The user is currently looking at this ${targetType}:
---
${targetText}
---

Surrounding context:
---
${surroundingContext}
---

Answer the user's question about this specific passage, drawing on your understanding of the full paper when relevant.`;
    } else {
      systemPrompt += `
The user has asked a general question about the paper (not about a specific passage). Answer based on the full paper text above.`;
    }

    systemPrompt += ` Be concise (2-4 paragraphs max). If the target is a reference, explain what the referenced work is about and how it relates to the current paper. If the target is a methods description, explain the method clearly. Use plain language where possible.`;

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

    logChat({
      ts: new Date().toISOString(),
      userEmail,
      userId,
      paperTitle,
      question,
      systemPrompt,
      response: text,
    });

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('API error:', error);
    // Return as much detail as possible so we can debug from the browser
    // while the app is still in pilot.
    const err = error as Error & { stack?: string };
    const detail = {
      message: err?.message || 'Internal server error',
      stack: err?.stack,
      cwd: process.cwd(),
      envKeys: Object.keys(process.env).filter((k) =>
        /KEY|TOKEN|SECRET|ANTHROPIC/i.test(k)
      ),
    };
    return new Response(JSON.stringify(detail, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
