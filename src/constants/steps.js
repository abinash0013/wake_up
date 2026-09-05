export const STEP_THRESHOLD_DEFAULT = 2.5;
export const STEP_MIN_INTERVAL_DEFAULT = 300;
export const STEP_TARGET_DEFAULT = 100;

// Step type registry. Adding a new alarm step type only requires
// registering it here and handling its config in the engine.
export const STEP_TYPES = {
  steps: {
    key: 'steps',
    label: 'Walk Steps',
    description: 'Walk a set number of steps to satisfy this step.',
    icon: '👣',
    defaultConfig: {
      target: STEP_TARGET_DEFAULT,
      threshold: STEP_THRESHOLD_DEFAULT,
      minIntervalMs: STEP_MIN_INTERVAL_DEFAULT,
    },
  },
};

export const DEFAULT_STEP_TYPE = 'steps';
