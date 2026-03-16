'use client';

import { useState } from 'react';

interface CalibrationOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

// 3x3 grid with generous padding from all edges
// Positions are in viewport units so they don't get squeezed
const DOT_POSITIONS = [
  { top: '12vh', left: '8vw' },
  { top: '12vh', left: '50vw' },
  { top: '12vh', left: '92vw' },
  { top: '50vh', left: '8vw' },
  { top: '50vh', left: '50vw' },
  { top: '50vh', left: '92vw' },
  { top: '88vh', left: '8vw' },
  { top: '88vh', left: '50vw' },
  { top: '88vh', left: '92vw' },
];

export default function CalibrationOverlay({
  onComplete,
  onSkip,
}: CalibrationOverlayProps) {
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const handleClick = (index: number) => {
    const next = new Set(clicked);
    next.add(index);
    setClicked(next);

    if (next.size === 9) {
      setDone(true);
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#ffffff',
      }}
    >
      {done ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <p className="text-xl text-green-700 font-medium">
            Calibration complete!
          </p>
        </div>
      ) : (
        <>
          {/* Instructions in top-center, between the top-left and top-center dots */}
          <div style={{
            position: 'absolute',
            top: '4vh',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10000,
          }}>
            <p className="text-base text-gray-700 font-medium">
              Look at each dot and click it. ({clicked.size}/9)
            </p>
            <p className="text-sm text-gray-400 mt-1">
              This calibrates the eye tracker.
            </p>
          </div>

          {/* 9 calibration dots */}
          {DOT_POSITIONS.map((pos, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '3px solid #3b82f6',
                backgroundColor: clicked.has(i) ? '#3b82f6' : 'transparent',
                cursor: 'pointer',
                transition: 'transform 0.15s, background-color 0.15s',
                zIndex: 10001,
                padding: 0,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.3)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'translate(-50%, -50%)';
              }}
            />
          ))}

          {/* Skip link at bottom center */}
          <div style={{
            position: 'absolute',
            bottom: '3vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
          }}>
            <button
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Skip calibration (use mouse instead)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
