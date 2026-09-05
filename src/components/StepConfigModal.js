import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {DEFAULT_STEP_TYPE, STEP_TYPES} from '../constants/steps';
import {uid} from '../utils/id';
import {showToast} from '../utils/toast';
import AppModal from './ui/AppModal';
import AppInput from './ui/AppInput';
import AppButton from './ui/AppButton';

const buildInitial = initialStep => {
  const typeKey = initialStep?.type || DEFAULT_STEP_TYPE;
  const definition = STEP_TYPES[typeKey] || STEP_TYPES[DEFAULT_STEP_TYPE];
  return {
    id: initialStep?.id || uid(),
    type: typeKey,
    label: initialStep?.label || definition.label,
    enabled: initialStep?.enabled !== false,
    config: {...definition.defaultConfig, ...(initialStep?.config || {})},
  };
};

const StepConfigModal = ({visible, initialStep = null, onSave, onClose}) => {
  const [form, setForm] = useState(() => buildInitial(initialStep));

  useEffect(() => {
    if (visible) {
      setForm(buildInitial(initialStep));
    }
  }, [visible, initialStep]);

  const isStepsType = form.type === 'steps';

  const updateConfig = (key, value) =>
    setForm(prev => ({...prev, config: {...prev.config, [key]: value}}));

  const handleSave = () => {
    const target = Number(form.config.target);
    const threshold = Number(form.config.threshold);
    const minIntervalMs = Number(form.config.minIntervalMs);

    if (!form.label.trim()) {
      showToast('Step label cannot be empty');
      return;
    }
    if (isStepsType) {
      if (!Number.isFinite(target) || target < 1) {
        showToast('Target steps must be at least 1');
        return;
      }
      if (!Number.isFinite(threshold) || threshold <= 0) {
        showToast('Sensitivity must be greater than 0');
        return;
      }
      if (!Number.isFinite(minIntervalMs) || minIntervalMs < 100) {
        showToast('Min interval must be at least 100ms');
        return;
      }
    }
    onSave({
      ...form,
      label: form.label.trim(),
      config: {...form.config, target, threshold, minIntervalMs},
    });
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <Text style={styles.title}>{initialStep ? 'Edit Step' : 'Add Step'}</Text>

      <Text style={styles.label}>Name</Text>
      <AppInput
        value={form.label}
        onChangeText={label => setForm(prev => ({...prev, label}))}
        placeholder="Step name"
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {Object.values(STEP_TYPES).map(definition => {
          const selected = form.type === definition.key;
          return (
            <View
              key={definition.key}
              style={[styles.typeChip, selected && styles.typeChipSelected]}>
              <Text style={styles.typeChipText}>{definition.label}</Text>
            </View>
          );
        })}
      </View>

      {isStepsType ? (
        <>
          <Text style={styles.label}>Target steps</Text>
          <AppInput
            value={String(form.config.target)}
            onChangeText={value => updateConfig('target', value)}
            keyboardType="numeric"
            placeholder="e.g. 10"
          />
          <Text style={styles.hint}>
            Step detection sensitivity (existing app logic).
          </Text>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Sensitivity</Text>
              <AppInput
                value={String(form.config.threshold)}
                onChangeText={value => updateConfig('threshold', value)}
                keyboardType="numeric"
                placeholder="e.g. 2.5"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Min. interval (ms)</Text>
              <AppInput
                value={String(form.config.minIntervalMs)}
                onChangeText={value => updateConfig('minIntervalMs', value)}
                keyboardType="numeric"
                placeholder="e.g. 300"
              />
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title="Cancel"
          variant="danger"
          onPress={onClose}
          style={styles.actionButton}
        />
        <AppButton
          title="Save Step"
          onPress={handleSave}
          style={styles.actionButton}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.round,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  typeChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});

export default StepConfigModal;
