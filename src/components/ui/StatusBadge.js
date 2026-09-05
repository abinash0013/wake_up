import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing} from '../../theme';

const toneStyles = {
  active: {
    background: colors.successLight,
    color: colors.success,
    dot: colors.success,
  },
  inactive: {
    background: colors.surfaceLighter,
    color: colors.textMuted,
    dot: colors.textMuted,
  },
  ringing: {
    background: colors.dangerLight,
    color: colors.danger,
    dot: colors.danger,
  },
  warning: {
    background: colors.warningLight,
    color: colors.warning,
    dot: colors.warning,
  },
};

const StatusBadge = ({label, tone = 'inactive', dot = true}) => {
  const toneStyle = toneStyles[tone] || toneStyles.inactive;
  return (
    <View style={[styles.badge, {backgroundColor: toneStyle.background}]}>
      {dot && <View style={[styles.dot, {backgroundColor: toneStyle.dot}]} />}
      <Text style={[styles.label, {color: toneStyle.color}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.round,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default StatusBadge;
