import { afterEach, describe, expect, test, vi } from 'vitest';

import { detectDwell, smoothGaze } from './gaze-utils';

describe('smoothGaze', () => {
  test('returns {0,0} for empty input', () => {
    // Arrange
    const rawPoints: Array<{ x: number; y: number }> = [];

    // Act
    const smoothed = smoothGaze(rawPoints);

    // Assert
    expect(smoothed).toEqual({ x: 0, y: 0 });
  });

  test.skip('averages the last N points (default 5)', () => {
    // Arrange
    // We include 6 points so we can verify it uses the *last* 5 by default.
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 40, y: 40 },
      { x: 50, y: 50 },
    ];

    // Act
    const smoothed = smoothGaze(rawPoints);

    // Assert
    // Last 5 points are: (10,10), (20,20), (30,30), (40,40), (50,50)
    // Average is: (30,30)
    expect(smoothed).toEqual({ x: 30, y: 30 });
  });
});

describe('detectDwell', () => {
  // We use fake timers so `Date.now()` is predictable inside the tests.
  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns true when gaze stayed on chunk for >= threshold', () => {
    // Arrange
    vi.useFakeTimers();
    const fixedNow = new Date('2026-01-01T00:00:01.000Z');
    vi.setSystemTime(fixedNow);

    const now = Date.now();
    const dwellHistory = [
      { chunkId: 'a', timestamp: now - 400 },
      { chunkId: 'a', timestamp: now - 350 },
      { chunkId: 'a', timestamp: now - 300 },
    ];

    // Act
    const hasDwelled = detectDwell('a', dwellHistory, 300);

    // Assert
    expect(hasDwelled).toBe(true);
  });

  test('returns false when the most recent chunk differs (no continuous dwell)', () => {
    // Arrange
    vi.useFakeTimers();
    const fixedNow = new Date('2026-01-01T00:00:01.000Z');
    vi.setSystemTime(fixedNow);

    const now = Date.now();
    const dwellHistory = [
      { chunkId: 'a', timestamp: now - 1000 },
      { chunkId: 'a', timestamp: now - 800 },
      { chunkId: 'b', timestamp: now - 10 },
    ];

    // Act
    const hasDwelled = detectDwell('a', dwellHistory, 300);

    // Assert
    // Even though chunk 'a' appears in history, the *most recent* chunk is 'b',
    // so we should NOT count this as a continuous dwell on 'a'.
    expect(hasDwelled).toBe(false);
  });
});

