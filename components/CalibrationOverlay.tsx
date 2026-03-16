'use client';

import { useState } from 'react';

interface CalibrationOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DOT_POSITIONS = [
  { top: '10%', left: '10%' },
  { top: '10%', left: '50%' },
  { top: '10%', left: '90%' },
  { top: '50%', left: '10%' },
  { top: '50%', left: '50%' },
  { top: '50%', left: '90%' },
  { top: '90%', left: '10%' },
  { top: '90%', left: '50%' },
  { top: '90%', left: '90%' },
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
    <div className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center">
      {done ? (
        <p className="text-xl text-green-700 font-medium">
          Calibration complete!
        </p>
      ) : (
        <>
          <p className="text-lg text-gray-700 mb-8 text-center max-w-md">
            Look at each dot and click it. This calibrates the eye tracker.
          </p>
          {DOT_POSITIONS.map((pos, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className="absolute w-6 h-6 rounded-full border-2 border-blue-500 transition-all duration-200 hover:scale-110"
              style={{
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)',
                backgroundColor: clicked.has(i) ? '#3b82f6' : 'transparent',
              }}
            />
          ))}
          <button
            onClick={onSkip}
            className="absolute bottom-8 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Skip calibration
          </button>
          <p className="absolute bottom-16 text-sm text-gray-500">
            {clicked.size} / 9 dots clicked
          </p>
        </>
      )}
    </div>
  );
}
