'use client';

import { useEffect, useState, useRef } from 'react';
import { parsePaper, chunksToHtml, type Chunk, type ParsedPaper } from '@/lib/paper-parser';

interface PaperViewerProps {
  onPaperLoaded: (paper: ParsedPaper) => void;
}

export default function PaperViewer({ onPaperLoaded }: PaperViewerProps) {
  const [paperHtml, setPaperHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPaper() {
      try {
        const res = await fetch('/papers/sample-paper.html');
        const rawHtml = await res.text();
        const parsed = parsePaper(rawHtml);

        // Also load metadata
        const metaRes = await fetch('/papers/sample-paper.json');
        const meta = await metaRes.json();
        parsed.title = meta.title || parsed.title;
        parsed.abstract = meta.abstract || parsed.abstract;

        const renderedHtml = chunksToHtml(parsed.chunks);
        setPaperHtml(renderedHtml);
        onPaperLoaded(parsed);
      } catch (err) {
        console.error('Failed to load paper:', err);
        setPaperHtml('<p>Failed to load paper. Check the console for details.</p>');
      } finally {
        setLoading(false);
      }
    }
    loadPaper();
  }, [onPaperLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading paper...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="paper-container"
      className="paper-content"
      dangerouslySetInnerHTML={{ __html: paperHtml }}
    />
  );
}
