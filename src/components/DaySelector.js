import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {DAYS} from '../utils/days';

const DaySelector = ({selected, onChange}) => {
  const toggle = dayKey => {
    const next = selected.includes(dayKey)
      ? selected.filter(key => key !== dayKey)
      : [...selected, dayKey];
    onChange(next);
  };

  return (
    <View style={styles.row}>
      {DAYS.map(day => {
        const isSelected = selected.includes(day.key);
        return (
          <Pressable
            key={day.key}
            accessibilityRole="button"
            accessibilityLabel={day.label}
            accessibilityState={{selected: isSelected}}
            onPress={() => toggle(day.key)}
            style={({pressed}) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}>
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {day.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.round,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceLight,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.text,
  },
});

export default React.memo(DaySelector);
