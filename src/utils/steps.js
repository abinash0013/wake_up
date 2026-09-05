import {DEFAULT_STEP_TYPE, STEP_TYPES} from '../constants/steps';
import {uid} from './id';

export const createStep = (type = DEFAULT_STEP_TYPE, overrides = {}) => {
  const definition = STEP_TYPES[type] || STEP_TYPES[DEFAULT_STEP_TYPE];
  return {
    id: uid(),
    type: definition.key,
    label: definition.label,
    enabled: true,
    order: 0,
    config: {...definition.defaultConfig, ...(overrides.config || {})},
    ...overrides,
  };
};

export const normalizeStep = (step, index) => {
  const definition = STEP_TYPES[step.type] || STEP_TYPES[DEFAULT_STEP_TYPE];
  return {
    id: step.id || uid(),
    type: definition.key,
    label: step.label || definition.label,
    enabled: step.enabled !== false,
    order: Number.isInteger(step.order) ? step.order : index,
    config: {
      ...definition.defaultConfig,
      ...(step.config || {}),
    },
  };
};

// Ensure an alarm always carries a valid, ordered list of steps.
export const normalizeSteps = steps => {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [createStep()];
  }
  return steps
    .map((step, index) => normalizeStep(step, index))
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({...step, order: index}));
};

export const getEnabledSteps = alarm =>
  (alarm.steps || []).filter(step => step.enabled);

export const getStepType = step =>
  STEP_TYPES[step.type] || STEP_TYPES[DEFAULT_STEP_TYPE];

export const getStepSummary = step => {
  const definition = getStepType(step);
  return `${definition.label} ${step.config.target}`;
};
