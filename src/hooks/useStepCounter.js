import {useEffect, useRef} from 'react';
import {
  SensorTypes,
  accelerometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';

const DEFAULT_THRESHOLD = 2.5;
const DEFAULT_MIN_INTERVAL_MS = 300;

// Subscribes to the accelerometer and reports cumulative step detections
// via onStep. "active" gates the subscription; "resetKey" restarts the count
// (e.g. when moving to the next alarm step). Callbacks/config are read from
// refs so the subscription stays stable across re-renders.
const useStepCounter = ({
  active = false,
  threshold = DEFAULT_THRESHOLD,
  minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
  onStep,
  resetKey,
}) => {
  const onStepRef = useRef(onStep);
  const thresholdRef = useRef(threshold);
  const minIntervalRef = useRef(minIntervalMs);

  onStepRef.current = onStep;
  thresholdRef.current = threshold;
  minIntervalRef.current = minIntervalMs;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    setUpdateIntervalForType(SensorTypes.accelerometer, 50);

    let previousMagnitude = 0;
    let previousTime = Date.now();
    let count = 0;

    const subscription = accelerometer.subscribe(({x, y, z}) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const currentTime = Date.now();

      if (
        magnitude - previousMagnitude > thresholdRef.current &&
        currentTime - previousTime > minIntervalRef.current
      ) {
        count += 1;
        previousTime = currentTime;
        onStepRef.current(count);
      }
      previousMagnitude = magnitude;
    });

    return () => subscription.unsubscribe();
  }, [active, resetKey]);
};

export default useStepCounter;
