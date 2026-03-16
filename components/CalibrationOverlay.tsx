'use client';

import { useState } from 'react';

interface CalibrationOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DOT_POSITIONS = [
  { top: '15%', left: '10%' },
  { top: '15%', left: '50%' },
  { top: '15%', left: '90%' },
  { top: '50%', left: '10%' },
  { top: '50%', left: '50%' },
  { top: '50%', left: '90%' },
  { top: '85%', left: '10%' },
  { top: '85%', left: '50%' },
  { top: '85%', left: '90%' },
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
      {done ? (
        <p className="text-xl text-green-700 font-medium">
          Calibration complete!
        </p>
      ) : (
        <>
          {/* Instruction banner at top */}
          <div className="absolute top-6 left-0 right-0 text-center z-10">
            <p className="text-lg text-gray-700 font-medium">
              Look at each dot and click it.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              This calibrates the eye tracker. ({clicked.size} / 9 completed)
            </p>
          </div>

          {/* Calibration dots */}
          {DOT_POSITIONS.map((pos, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className="absolute w-8 h-8 rounded-full border-3 border-blue-500 transition-all duration-200 hover:scale-125 cursor-pointer"
              style={{
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)',
                backgroundColor: clicked.has(i) ? '#3b82f6' : 'transparent',
                borderWidth: '3px',
              }}
            />
          ))}

          {/* Skip link */}
          <button
            onClick={onSkip}
            className="absolute bottom-6 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Skip calibration (use mouse instead)
          </button>
        </>
      )}
    </div>
  );
}
