import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, shadows, spacing, typography} from '../theme';
import {getStepType} from '../utils/steps';
import AppButton from './ui/AppButton';
import StatusBadge from './ui/StatusBadge';

const ActiveAlarmOverlay = ({
  activeAlarm,
  activeStep,
  activeStepIndex = 0,
  enabledStepsCount = 0,
  stepProgress = 0,
  onStop,
}) => {
  const target = activeStep?.config.target || 0;
  const type = activeStep ? getStepType(activeStep) : null;
  const percent = target > 0 ? Math.min(stepProgress / target, 1) : 0;

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.banner}>
        <View style={styles.header}>
          <StatusBadge label="Ringing" tone="ringing" />
          <Text style={styles.time}>{activeAlarm?.time}</Text>
        </View>

        {activeStep && type ? (
          <View style={styles.stepBlock}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepLabel}>
                Step {activeStepIndex + 1} of {enabledStepsCount}:{' '}
                {activeStep.label}
              </Text>
              <Text style={styles.stepCount}>
                {stepProgress} / {target} {type.label}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, {width: `${Math.round(percent * 100)}%`}]}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.noStep}>
            No enabled steps — use Stop to dismiss.
          </Text>
        )}

        <AppButton
          title="Stop Alarm"
          variant="danger"
          onPress={onStop}
          style={styles.stopButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
  },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    ...shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.h2,
    color: colors.text,
  },
  stepBlock: {
    marginTop: spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  stepLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  stepCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  noStep: {
    ...typography.bodySmall,
    color: colors.warning,
    marginTop: spacing.lg,
  },
  stopButton: {
    marginTop: spacing.lg,
  },
});

export default ActiveAlarmOverlay;
