'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import CalibrationOverlay from './CalibrationOverlay';
import { smoothGaze } from '@/lib/gaze-utils';

interface GazeTrackerProps {
  onGaze: (x: number, y: number, timestamp: number) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webgazer: any;
  }
}

export default function GazeTracker({ onGaze }: GazeTrackerProps) {
  const [mode, setMode] = useState<'loading' | 'calibrating' | 'tracking' | 'mouse'>(
    'loading'
  );
  const [showDot, setShowDot] = useState(true);
  const gazeBuffer = useRef<Array<{ x: number; y: number }>>([]);
  const dotRef = useRef<HTMLDivElement>(null);
  const onGazeRef = useRef(onGaze);
  onGazeRef.current = onGaze;

  // Mouse fallback mode
  const startMouseMode = useCallback(() => {
    setMode('mouse');
  }, []);

  // Mouse mode event listener (separate effect so it cleans up properly)
  useEffect(() => {
    if (mode !== 'mouse') return;
    const handler = (e: MouseEvent) => {
      onGazeRef.current(e.clientX, e.clientY, Date.now());
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mode]);

  // Load WebGazer and check webcam on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Load WebGazer script if needed
      if (!window.webgazer) {
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;
        try {
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('WebGazer script failed'));
            document.head.appendChild(script);
          });
        } catch {
          console.warn('WebGazer failed to load, using mouse mode');
          if (!cancelled) startMouseMode();
          return;
        }
      }

      // Check webcam access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Release the stream so WebGazer can claim it
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) setMode('calibrating');
      } catch {
        console.warn('Webcam unavailable, using mouse mode');
        if (!cancelled) startMouseMode();
      }
    };

    init();
    return () => { cancelled = true; };
  }, [startMouseMode]);

  const handleCalibrationComplete = useCallback(async () => {
    try {
      // Start WebGazer first, then attach listener
      await window.webgazer
        .setRegression('ridge')
        .showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .showPredictionPoints(false)
        .begin();

      // Now attach the gaze listener
      window.webgazer.setGazeListener(
        (data: { x: number; y: number } | null) => {
          if (!data) return;
          gazeBuffer.current.push({ x: data.x, y: data.y });
          if (gazeBuffer.current.length > 20) {
            gazeBuffer.current = gazeBuffer.current.slice(-20);
          }
          const smoothed = smoothGaze(gazeBuffer.current, 5);
          onGazeRef.current(smoothed.x, smoothed.y, Date.now());

          if (dotRef.current) {
            dotRef.current.style.left = `${smoothed.x}px`;
            dotRef.current.style.top = `${smoothed.y}px`;
          }
        }
      );

      setMode('tracking');
    } catch (err) {
      console.warn('WebGazer start failed:', err);
      startMouseMode();
    }
  }, [startMouseMode]);

  const handleRecalibrate = () => {
    if (window.webgazer) {
      try { window.webgazer.pause(); } catch {}
    }
    gazeBuffer.current = [];
    setMode('calibrating');
  };

  const handleCalibrationSkip = () => {
    startMouseMode();
  };

  return (
    <>
      {mode === 'calibrating' && (
        <CalibrationOverlay
          onComplete={handleCalibrationComplete}
          onSkip={handleCalibrationSkip}
        />
      )}

      {/* Gaze indicator dot - visible by default so users can verify tracking */}
      {showDot && (mode === 'tracking' || mode === 'mouse') && (
        <div
          ref={dotRef}
          style={{
            position: 'fixed',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: mode === 'tracking' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none',
            zIndex: 9998,
            transform: 'translate(-50%, -50%)',
            transition: 'left 60ms, top 60ms',
          }}
        />
      )}

      {/* Status bar controls */}
      <div className="flex items-center gap-3 text-sm">
        {mode === 'mouse' && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                title="Eye tracking unavailable. The cursor position is used instead of gaze.">
            MOUSE MODE (no webcam)
          </span>
        )}
        {mode === 'tracking' && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
            👁 GAZE TRACKING
          </span>
        )}
        {mode === 'loading' && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
            Starting eye tracker...
          </span>
        )}
        {(mode === 'tracking' || mode === 'mouse') && (
          <>
            <button
              onClick={handleRecalibrate}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Recalibrate
            </button>
            <button
              onClick={() => setShowDot((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {showDot ? 'Hide dot' : 'Show dot'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
