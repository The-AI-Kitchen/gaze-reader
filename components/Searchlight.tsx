'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [labelPos, setLabelPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const updateHighlight = useCallback(
    (chunkId: string | null, target: GazeTarget | null) => {
      // Remove old highlight (unless locked)
      if (currentHighlight.current && currentHighlight.current !== lockedChunkId) {
        const oldEl = document.querySelector(
          `[data-chunk-id="${currentHighlight.current}"]`
        ) as HTMLElement | null;
        if (oldEl) {
          oldEl.style.backgroundColor = '';
          oldEl.style.transition = 'background-color 200ms ease';
        }
      }

      // Apply new highlight
      if (chunkId && chunkId !== lockedChunkId) {
        const newEl = document.querySelector(
          `[data-chunk-id="${chunkId}"]`
        ) as HTMLElement | null;
        if (newEl) {
          newEl.style.transition = 'background-color 200ms ease';
          newEl.style.backgroundColor = 'rgba(255, 235, 120, 0.25)';
        }
      }

      currentHighlight.current = chunkId;
    },
    [lockedChunkId]
  );

  useEffect(() => {
    if (gazeX === 0 && gazeY === 0) return;

    const target = gazeToChunk(gazeX, gazeY);
    const chunkId = target?.chunkId || null;

    // Update dwell history
    if (chunkId) {
      dwellHistory.current.push({ chunkId, timestamp: gazeTimestamp });
      // Keep history manageable
      if (dwellHistory.current.length > 50) {
        dwellHistory.current = dwellHistory.current.slice(-30);
      }
    }

    // Check dwell threshold
    if (chunkId && detectDwell(chunkId, dwellHistory.current, 300)) {
      if (chunkId !== currentHighlight.current) {
        updateHighlight(chunkId, target);
        onTargetChange(target);

        if (target) {
          setActiveLabel(target.chunkType);
          const rect = target.element.getBoundingClientRect();
          setLabelPos({ top: rect.top - 24, left: rect.left });
        }
      }
    }
  }, [gazeX, gazeY, gazeTimestamp, updateHighlight, onTargetChange]);

  // Handle locked chunk styling
  useEffect(() => {
    if (lockedChunkId) {
      const el = document.querySelector(
        `[data-chunk-id="${lockedChunkId}"]`
      ) as HTMLElement | null;
      if (el) {
        el.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
        el.style.outline = '2px solid rgba(59, 130, 246, 0.4)';
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
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.borderRadius = '';
        }
      }
    };
  }, [lockedChunkId]);

  return (
    <>
      {activeLabel && !lockedChunkId && (
        <div
          className="fixed z-30 px-2 py-0.5 bg-gray-800/70 text-white text-xs rounded pointer-events-none"
          style={{
            top: `${labelPos.top}px`,
            left: `${labelPos.left}px`,
            transition: 'top 200ms ease, left 200ms ease, opacity 200ms ease',
          }}
        >
          Looking at: {activeLabel}
        </div>
      )}
    </>
  );
}
