'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gazeToChunk, detectDwell, type GazeTarget } from '@/lib/gaze-utils';

interface SearchlightProps {
  gazeX: number;
  gazeY: number;
  gazeTimestamp: number;
  lockedChunkId: string | null;
  onTargetChange: (target: GazeTarget | null) => void;
}

export default function Searchlight({
  gazeX,
  gazeY,
  gazeTimestamp,
  lockedChunkId,
  onTargetChange,
}: SearchlightProps) {
  const dwellHistory = useRef<Array<{ chunkId: string; timestamp: number }>>([]);
  const currentHighlight = useRef<string | null>(null);
  const onTargetChangeRef = useRef(onTargetChange);
  onTargetChangeRef.current = onTargetChange;

  const clearHighlight = useCallback((chunkId: string) => {
    const el = document.querySelector(
      `[data-chunk-id="${chunkId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.style.backgroundColor = '';
      el.style.borderLeft = '';
      el.style.paddingLeft = '';
      el.style.transition = 'background-color 200ms ease, border-left 200ms ease';
    }
  }, []);

  const applyHighlight = useCallback((chunkId: string) => {
    const el = document.querySelector(
      `[data-chunk-id="${chunkId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.style.transition = 'background-color 200ms ease, border-left 200ms ease';
      // Visible highlight: warm yellow background + left accent bar
      el.style.backgroundColor = 'rgba(255, 220, 80, 0.3)';
      el.style.borderLeft = '4px solid rgba(245, 180, 30, 0.8)';
      el.style.paddingLeft = '8px';
    }
  }, []);

  useEffect(() => {
    if (gazeX === 0 && gazeY === 0) return;

    const target = gazeToChunk(gazeX, gazeY);
    const chunkId = target?.chunkId || null;

    // Update dwell history
    if (chunkId) {
      dwellHistory.current.push({ chunkId, timestamp: gazeTimestamp });
      if (dwellHistory.current.length > 50) {
        dwellHistory.current = dwellHistory.current.slice(-30);
      }
    }

    // Check dwell threshold
    if (chunkId && detectDwell(chunkId, dwellHistory.current, 300)) {
      if (chunkId !== currentHighlight.current) {
        // Remove old highlight (unless locked)
        if (currentHighlight.current && currentHighlight.current !== lockedChunkId) {
          clearHighlight(currentHighlight.current);
        }
        // Apply new highlight (unless locked chunk)
        if (chunkId !== lockedChunkId) {
          applyHighlight(chunkId);
        }
        currentHighlight.current = chunkId;
        onTargetChangeRef.current(target);
      }
    }
  }, [gazeX, gazeY, gazeTimestamp, lockedChunkId, clearHighlight, applyHighlight]);

  // Handle locked chunk styling (when user asks a question)
  useEffect(() => {
    if (lockedChunkId) {
      const el = document.querySelector(
        `[data-chunk-id="${lockedChunkId}"]`
      ) as HTMLElement | null;
      if (el) {
        el.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
        el.style.borderLeft = '4px solid rgba(59, 130, 246, 0.6)';
        el.style.paddingLeft = '8px';
        el.style.outline = '2px solid rgba(59, 130, 246, 0.3)';
        el.style.outlineOffset = '2px';
        el.style.borderRadius = '4px';
      }
    }

    return () => {
      if (lockedChunkId) {
        const el = document.querySelector(
          `[data-chunk-id="${lockedChunkId}"]`
        ) as HTMLElement | null;
        if (el) {
          el.style.backgroundColor = '';
          el.style.borderLeft = '';
          el.style.paddingLeft = '';
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.borderRadius = '';
        }
      }
    };
  }, [lockedChunkId]);

  // No floating label needed - the highlight itself is the feedback
  return null;
}
