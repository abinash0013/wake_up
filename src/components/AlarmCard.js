import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, shadows, spacing, typography} from '../theme';
import {getEnabledSteps, getStepType} from '../utils/steps';
import {describeRepeatDays} from '../utils/days';
import StatusBadge from './ui/StatusBadge';
import AppSwitch from './ui/AppSwitch';
import AppButton from './ui/AppButton';
import Icon from './ui/Icon';

const AlarmProgress = ({
  activeStep,
  activeStepIndex,
  enabledStepsCount,
  progress,
}) => {
  if (!activeStep) {
    return null;
  }
  const type = getStepType(activeStep);
  const target = activeStep.config.target;
  const percent = target > 0 ? Math.min(progress / target, 1) : 0;

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressStepLabel}>
          Step {activeStepIndex + 1} of {enabledStepsCount}
        </Text>
        <Text style={styles.progressCount}>
          {progress} / {target} {type.label}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${percent * 100}%`}]} />
      </View>
    </View>
  );
};

const AlarmCard = ({
  alarm,
  onToggle,
  onEdit,
  onDelete,
  actionsDisabled = false,
  isActive = false,
  activeStep,
  activeStepIndex,
  enabledStepsCount,
  stepProgress,
}) => {
  const enabledSteps = getEnabledSteps(alarm);
  const firstStep = enabledSteps[0];
  const stepType = firstStep ? getStepType(firstStep) : null;
  const walkTarget = firstStep ? firstStep.config.target : null;
  const vibrateText = alarm.vibrate ? 'Vibrate on' : 'Vibrate off';

  return (
    <View
      style={[
        styles.card,
        !alarm.enabled && styles.cardDisabled,
        isActive && styles.cardActive,
      ]}>
      <View style={styles.header}>
        <View style={styles.timeBlock}>
          <Text style={[styles.time, !alarm.enabled && styles.textDisabled]}>
            {alarm.time}
          </Text>
          {alarm.name ? (
            <Text style={[styles.name, !alarm.enabled && styles.textDisabled]}>
              {alarm.name}
            </Text>
          ) : null}
          <View style={styles.daysRow}>
            <Icon name="📅" size={12} color={colors.textMuted} />
            <Text style={styles.day}>
              {describeRepeatDays(alarm.repeatDays)}
            </Text>
          </View>
        </View>
        <StatusBadge
          label={isActive ? 'Ringing' : alarm.enabled ? 'Active' : 'Off'}
          tone={isActive ? 'ringing' : alarm.enabled ? 'active' : 'inactive'}
        />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon
            name={stepType?.icon || '👣'}
            size={14}
            color={colors.primary}
          />
          <Text style={styles.metaValue}>{walkTarget}</Text>
          <Text style={styles.metaLabel}>{stepType?.label || 'steps'}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="📳" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{vibrateText}</Text>
        </View>
      </View>

      {isActive && (
        <AlarmProgress
          activeStep={activeStep}
          activeStepIndex={activeStepIndex}
          enabledStepsCount={enabledStepsCount}
          progress={stepProgress}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Enabled</Text>
          <AppSwitch value={alarm.enabled} onValueChange={onToggle} />
        </View>
        <View style={styles.footerActions}>
          <AppButton
            title="Edit"
            variant="secondary"
            size="sm"
            icon={<Icon name="✎" size={13} color={colors.text} />}
            disabled={actionsDisabled}
            onPress={onEdit}
            style={styles.actionButton}
          />
          <AppButton
            title="Delete"
            variant="danger"
            size="sm"
            icon={<Icon name="🗑" size={13} color={colors.danger} />}
            disabled={actionsDisabled}
            onPress={onDelete}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    ...shadows.card,
  },
  cardActive: {
    borderLeftColor: colors.danger,
    backgroundColor: colors.surfaceLight,
  },
  cardDisabled: {
    borderLeftColor: colors.disabled,
    opacity: 0.55,
  },
  textDisabled: {
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBlock: {
    flex: 1,
  },
  time: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  name: {
    marginTop: spacing.xs,
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  day: {
    ...typography.caption,
    color: colors.textSecondary,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLighter,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '800',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: colors.borderStrong,
  },
  progressBlock: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    borderRadius: radii.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressStepLabel: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  progressCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.lg,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AlarmCard;
