import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
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
      return new Response('Missing required fields', { status: 400 });
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

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });

    // Stream the response as text
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    console.error('API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(message, { status: 500 });
  }
}
