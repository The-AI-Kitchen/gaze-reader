import { Chunk } from './paper-parser';

export interface AskPayload {
  question: string;
  targetText: string;
  targetType: string;
  surroundingContext: string;
  paperTitle: string;
  paperAbstract: string;
}

export function buildContext(
  targetChunkId: string,
  allChunks: Chunk[],
  paperTitle: string,
  paperAbstract: string,
  question: string
): AskPayload {
  const targetIndex = allChunks.findIndex((c) => c.id === targetChunkId);
  const target = allChunks[targetIndex];

  if (!target) {
    return {
      question,
      targetText: '',
      targetType: 'paragraph',
      surroundingContext: '',
      paperTitle,
      paperAbstract,
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
  };
}
