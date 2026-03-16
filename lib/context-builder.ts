import { Chunk } from './paper-parser';

export interface AskPayload {
  question: string;
  targetText: string;
  targetType: string;
  surroundingContext: string;
  paperTitle: string;
  paperAbstract: string;
  fullPaperText: string;
}

/**
 * Build the full paper text once (truncated to ~12k chars to stay within
 * reasonable token limits while giving Claude the whole picture).
 */
export function buildFullPaperText(chunks: Chunk[]): string {
  let text = '';
  for (const chunk of chunks) {
    text += chunk.text + '\n\n';
    // Cap at ~12k chars (~3k tokens) to keep requests fast
    if (text.length > 12000) {
      text += '[... remainder of paper truncated for brevity ...]';
      break;
    }
  }
  return text;
}

export function buildContext(
  targetChunkId: string | null,
  allChunks: Chunk[],
  paperTitle: string,
  paperAbstract: string,
  question: string,
  fullPaperText: string
): AskPayload {
  // No specific target: general question about the whole paper
  if (!targetChunkId) {
    return {
      question,
      targetText: '',
      targetType: 'general',
      surroundingContext: '',
      paperTitle,
      paperAbstract,
      fullPaperText,
    };
  }

  const targetIndex = allChunks.findIndex((c) => c.id === targetChunkId);
  const target = allChunks[targetIndex];

  if (!target) {
    return {
      question,
      targetText: '',
      targetType: 'general',
      surroundingContext: '',
      paperTitle,
      paperAbstract,
      fullPaperText,
    };
  }

  // Get 2 chunks before and 2 after for surrounding context
  const start = Math.max(0, targetIndex - 2);
  const end = Math.min(allChunks.length, targetIndex + 3);
  const surrounding = allChunks
    .slice(start, end)
    .filter((c) => c.id !== target.id)
    .map((c) => c.text)
    .join('\n\n');

  return {
    question,
    targetText: target.text,
    targetType: target.type,
    surroundingContext: surrounding,
    paperTitle,
    paperAbstract,
    fullPaperText,
  };
}
