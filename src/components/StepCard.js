import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {getStepType} from '../utils/steps';
import AppSwitch from './ui/AppSwitch';
import IconButton from './ui/IconButton';
import Icon from './ui/Icon';

const StepCard = ({
  step,
  index,
  total,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const type = getStepType(step);
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  return (
    <View style={[styles.card, !step.enabled && styles.cardDisabled]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{type.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>
            <Text style={styles.order}>{index + 1}. </Text>
            {step.label}
          </Text>
          <Text style={styles.config}>
            {step.config.target} {type.label} · threshold{' '}
            {step.config.threshold} · every {step.config.minIntervalMs}ms
          </Text>
        </View>
        <AppSwitch value={step.enabled} onValueChange={onToggle} />
      </View>

      <View style={styles.footer}>
        <View style={styles.moveControls}>
          <IconButton
            icon={<Icon name="▲" />}
            size="sm"
            accessibilityLabel="Move step up"
            disabled={!canMoveUp}
            onPress={onMoveUp}
          />
          <IconButton
            icon={<Icon name="▼" />}
            size="sm"
            accessibilityLabel="Move step down"
            disabled={!canMoveDown}
            onPress={onMoveDown}
          />
        </View>
        <View style={styles.actionControls}>
          <IconButton
            icon={<Icon name="✎" />}
            size="sm"
            accessibilityLabel="Edit step"
            onPress={onEdit}
          />
          <IconButton
            icon={<Icon name="🗑" />}
            size="sm"
            variant="danger"
            accessibilityLabel="Delete step"
            onPress={onDelete}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  order: {
    color: colors.primary,
  },
  config: {
    marginTop: 2,
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  moveControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default StepCard;
