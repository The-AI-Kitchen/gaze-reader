export interface GazeTarget {
  chunkId: string;
  chunkType: string;
  element: HTMLElement;
  text: string;
}

/**
 * Map viewport gaze coordinates to a chunk element.
 * Uses document.elementFromPoint which works in viewport coords automatically.
 */
export function gazeToChunk(x: number, y: number): GazeTarget | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  // Walk up the DOM tree to find a [data-chunk-id] element
  let current: HTMLElement | null = el as HTMLElement;
  while (current) {
    if (current.dataset?.chunkId) {
      return {
        chunkId: current.dataset.chunkId,
        chunkType: current.dataset.chunkType || 'paragraph',
        element: current,
        text: current.textContent?.trim() || '',
      };
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Moving average smoothing over last N gaze points.
 */
export function smoothGaze(
  rawPoints: Array<{ x: number; y: number }>,
  windowSize: number = 5
): { x: number; y: number } {
  const window = rawPoints.slice(-windowSize);
  if (window.length === 0) return { x: 0, y: 0 };

  const sum = window.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / window.length,
    y: sum.y / window.length,
  };
}

/**
 * Dwell detection: has gaze been on the same chunk for >= threshold ms?
 */
export function detectDwell(
  currentChunkId: string,
  dwellHistory: Array<{ chunkId: string; timestamp: number }>,
  thresholdMs: number = 300
): boolean {
  if (dwellHistory.length === 0) return false;

  // Find the earliest continuous occurrence of this chunk in recent history
  let earliest = Date.now();
  for (let i = dwellHistory.length - 1; i >= 0; i--) {
    if (dwellHistory[i].chunkId === currentChunkId) {
      earliest = dwellHistory[i].timestamp;
    } else {
      break;
    }
  }

  return Date.now() - earliest >= thresholdMs;
}
