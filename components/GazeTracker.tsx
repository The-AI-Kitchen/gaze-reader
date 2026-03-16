'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import CalibrationOverlay from './CalibrationOverlay';
import { smoothGaze } from '@/lib/gaze-utils';

interface GazeTrackerProps {
  onGaze: (x: number, y: number, timestamp: number) => void;
}

declare global {
  interface Window {
    webgazer: {
      setGazeListener: (
        cb: (data: { x: number; y: number } | null, elapsedTime: number) => void
      ) => Window['webgazer'];
      begin: () => Promise<void>;
      end: () => void;
      showVideo: (show: boolean) => Window['webgazer'];
      showFaceOverlay: (show: boolean) => Window['webgazer'];
      showFaceFeedbackBox: (show: boolean) => Window['webgazer'];
      showPredictionPoints: (show: boolean) => Window['webgazer'];
      setRegression: (type: string) => Window['webgazer'];
      setTracker: (type: string) => Window['webgazer'];
      pause: () => void;
      resume: () => void;
    };
  }
}

export default function GazeTracker({ onGaze }: GazeTrackerProps) {
  const [mode, setMode] = useState<'loading' | 'calibrating' | 'tracking' | 'mouse'>(
    'loading'
  );
  const [showDot, setShowDot] = useState(false);
  const gazeBuffer = useRef<Array<{ x: number; y: number }>>([]);
  const dotRef = useRef<HTMLDivElement>(null);

  const startMouseMode = useCallback(() => {
    setMode('mouse');
    const handler = (e: MouseEvent) => {
      onGaze(e.clientX, e.clientY, Date.now());
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [onGaze]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initWebGazer = async () => {
      // Load WebGazer script
      if (!window.webgazer) {
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;

        try {
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('WebGazer failed to load'));
            document.head.appendChild(script);
          });
        } catch {
          console.warn('WebGazer failed to load, falling back to mouse mode');
          cleanup = startMouseMode();
          return;
        }
      }

      try {
        // Check webcam permission
        await navigator.mediaDevices.getUserMedia({ video: true });

        setMode('calibrating');
      } catch {
        console.warn('Webcam unavailable, falling back to mouse mode');
        cleanup = startMouseMode();
      }
    };

    initWebGazer();

    return () => {
      cleanup?.();
      if (window.webgazer && mode === 'tracking') {
        try { window.webgazer.end(); } catch {}
      }
    };
  }, []);

  const handleCalibrationComplete = useCallback(async () => {
    try {
      window.webgazer
        .setRegression('ridge')
        .showVideo(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .showPredictionPoints(false)
        .setGazeListener((data, _elapsed) => {
          if (!data) return;
          gazeBuffer.current.push({ x: data.x, y: data.y });
          if (gazeBuffer.current.length > 20) {
            gazeBuffer.current = gazeBuffer.current.slice(-20);
          }
          const smoothed = smoothGaze(gazeBuffer.current, 5);
          onGaze(smoothed.x, smoothed.y, Date.now());

          if (dotRef.current) {
            dotRef.current.style.left = `${smoothed.x}px`;
            dotRef.current.style.top = `${smoothed.y}px`;
          }
        });

      await window.webgazer.begin();
      setMode('tracking');
    } catch (err) {
      console.warn('WebGazer initialization failed:', err);
      startMouseMode();
    }
  }, [onGaze, startMouseMode]);

  const handleRecalibrate = () => {
    if (window.webgazer) {
      window.webgazer.pause();
    }
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

      {/* Gaze/mouse indicator dot */}
      {showDot && (mode === 'tracking' || mode === 'mouse') && (
        <div
          ref={dotRef}
          className="fixed w-3 h-3 rounded-full bg-red-400/40 pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2"
          style={{ transition: 'left 50ms, top 50ms' }}
        />
      )}

      {/* Status bar controls */}
      <div className="flex items-center gap-3 text-sm">
        {mode === 'mouse' && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            MOUSE MODE
          </span>
        )}
        {mode === 'tracking' && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
            GAZE TRACKING
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
