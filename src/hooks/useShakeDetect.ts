import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 2.5;
const SHAKE_COUNT_REQUIRED = 3;
const SHAKE_WINDOW_MS = 2000;

export function useShakeDetect(
  enabled: boolean,
  onShake: () => void
) {
  const shakeTimesRef = useRef<number[]>([]);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const cleanup = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > SHAKE_THRESHOLD) {
        const now = Date.now();
        shakeTimesRef.current.push(now);
        // Keep only shakes within the window
        shakeTimesRef.current = shakeTimesRef.current.filter(
          (t) => now - t < SHAKE_WINDOW_MS
        );
        if (shakeTimesRef.current.length >= SHAKE_COUNT_REQUIRED) {
          shakeTimesRef.current = [];
          onShake();
        }
      }
    });

    return cleanup;
  }, [enabled, onShake, cleanup]);
}
