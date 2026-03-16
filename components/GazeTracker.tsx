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

  // Mouse mode event listener
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

  // Load WebGazer, start it, THEN show calibration
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 0. Inject CSS to pin WebGazer's video to bottom-right corner,
      //    small but VISIBLE. The video must stay rendered (not opacity:0,
      //    not display:none) for the browser to keep processing frames.
      //    CSS !important in a <style> beats WebGazer's per-frame inline
      //    style updates. The bottom-right calibration dot is removed
      //    to make room (see CalibrationOverlay).
      const styleId = 'webgazer-position-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          #webgazerVideoContainer {
            position: fixed !important;
            bottom: 8px !important;
            right: 8px !important;
            top: auto !important;
            left: auto !important;
            width: 120px !important;
            height: 90px !important;
            z-index: 10002 !important;
            border-radius: 8px !important;
            border: 2px solid #3b82f6 !important;
            overflow: hidden !important;
            pointer-events: none !important;
          }
          #webgazerVideoFeed {
            width: 120px !important;
            height: 90px !important;
            object-fit: cover !important;
          }
          #webgazerFaceOverlay,
          #webgazerFaceFeedbackBox {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }

      // 1. Load WebGazer script
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

      // 2. Start WebGazer
      try {
        await window.webgazer
          .setRegression('ridge')
          .showPredictionPoints(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false)
          .begin();

        console.log('WebGazer started, showing calibration');

        // 3. Show calibration (WebGazer is running, clicks train the model)
        if (!cancelled) setMode('calibrating');
      } catch (err) {
        console.warn('WebGazer failed to start:', err);
        if (!cancelled) startMouseMode();
      }
    };

    init();
    return () => { cancelled = true; };
  }, [startMouseMode]);

  // After calibration: hide video, attach gaze listener, switch to tracking
  const handleCalibrationComplete = useCallback(() => {
    try {
      // Make the webcam nearly invisible after calibration.
      // We can NOT use display:none or opacity:0 because the browser
      // stops processing video frames, which kills WebGazer's gaze
      // pipeline. Keep the video at a real size (WebGazer may use CSS
      // dimensions for frame capture) but nearly transparent.
      const posStyle = document.getElementById('webgazer-position-styles');
      if (posStyle) {
        posStyle.textContent = `
          #webgazerVideoContainer {
            position: fixed !important;
            bottom: 0 !important;
            right: 0 !important;
            top: auto !important;
            left: auto !important;
            width: 120px !important;
            height: 90px !important;
            overflow: hidden !important;
            opacity: 0.01 !important;
            pointer-events: none !important;
            z-index: -1 !important;
          }
          #webgazerVideoFeed {
            width: 120px !important;
            height: 90px !important;
            object-fit: cover !important;
          }
          #webgazerFaceOverlay,
          #webgazerFaceFeedbackBox {
            display: none !important;
          }
        `;
      }

      let gazeCount = 0;

      // Attach our gaze listener (WebGazer is already running)
      window.webgazer.setGazeListener(
        (data: { x: number; y: number } | null) => {
          if (!data) return;

          // Log first few gaze points for debugging
          gazeCount++;
          if (gazeCount <= 5) {
            console.log(`Gaze point #${gazeCount}:`, Math.round(data.x), Math.round(data.y));
          }

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
      console.log('Gaze tracking active - look around the screen to test');
    } catch (err) {
      console.warn('Failed to attach gaze listener:', err);
      startMouseMode();
    }
  }, [startMouseMode]);

  const handleRecalibrate = () => {
    // Clear old calibration data
    gazeBuffer.current = [];
    if (window.webgazer) {
      try {
        window.webgazer.clearData();
      } catch {}
    }
    setMode('calibrating');
  };

  const handleCalibrationSkip = () => {
    // Stop WebGazer if it was running
    if (window.webgazer) {
      try { window.webgazer.end(); } catch {}
    }
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

      {/* Gaze indicator dot */}
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
                title="Eye tracking unavailable. Hover your cursor over paragraphs instead.">
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
        {mode === 'calibrating' && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Calibrating...
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
