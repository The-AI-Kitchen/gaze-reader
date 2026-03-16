'use client';

import { useState, useCallback } from 'react';
import PaperViewer from '@/components/PaperViewer';
import GazeTracker from '@/components/GazeTracker';
import Searchlight from '@/components/Searchlight';
import QueryPanel from '@/components/QueryPanel';
import { type GazeTarget } from '@/lib/gaze-utils';
import { type ParsedPaper } from '@/lib/paper-parser';

export default function Home() {
  const [paper, setPaper] = useState<ParsedPaper | null>(null);
  const [gazeX, setGazeX] = useState(0);
  const [gazeY, setGazeY] = useState(0);
  const [gazeTimestamp, setGazeTimestamp] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<GazeTarget | null>(null);
  const [lockedChunkId, setLockedChunkId] = useState<string | null>(null);

  const handleGaze = useCallback((x: number, y: number, ts: number) => {
    setGazeX(x);
    setGazeY(y);
    setGazeTimestamp(ts);
  }, []);

  const handlePaperLoaded = useCallback((parsed: ParsedPaper) => {
    setPaper(parsed);
  }, []);

  const handleTargetChange = useCallback((target: GazeTarget | null) => {
    setCurrentTarget(target);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF8]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
          GazeReader
        </h1>
        <GazeTracker onGaze={handleGaze} />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Paper area (65%) */}
        <main className="w-[65%] overflow-y-auto p-8">
          <div className="max-w-[700px] mx-auto">
            {paper && (
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight paper-title mb-2">
                  {paper.title}
                </h1>
                {paper.abstract && (
                  <p className="text-sm text-gray-500 leading-relaxed mt-3 paper-text italic">
                    {paper.abstract}
                  </p>
                )}
              </div>
            )}
            <PaperViewer onPaperLoaded={handlePaperLoaded} />
          </div>
        </main>

        {/* Query panel (35%) */}
        <aside className="w-[35%] bg-[#F5F5F3] border-l border-gray-200 p-5 overflow-hidden flex flex-col">
          {paper ? (
            <QueryPanel
              currentTarget={currentTarget}
              chunks={paper.chunks}
              paperTitle={paper.title}
              paperAbstract={paper.abstract}
              onLockChunk={setLockedChunkId}
            />
          ) : (
            <div className="text-sm text-gray-400 text-center mt-20">
              Loading paper...
            </div>
          )}
        </aside>
      </div>

      {/* Searchlight */}
      <Searchlight
        gazeX={gazeX}
        gazeY={gazeY}
        gazeTimestamp={gazeTimestamp}
        lockedChunkId={lockedChunkId}
        onTargetChange={handleTargetChange}
      />
    </div>
  );
}
