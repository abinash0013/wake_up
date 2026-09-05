import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {colors, radii, spacing, typography} from '../theme';
import {normalizeSteps, createStep} from '../utils/steps';
import {normalizeRepeatDays} from '../utils/days';
import {DEFAULT_SOUND} from '../constants/sound';
import {showToast} from '../utils/toast';
import AppModal from './ui/AppModal';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import AppSwitch from './ui/AppSwitch';
import Icon from './ui/Icon';
import DaySelector from './DaySelector';
import SoundPickerModal from './SoundPickerModal';

const parseTimeToDate = time => {
  const match = time?.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    return new Date();
  }
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') {
    hours += 12;
  }
  const date = new Date();
  date.setHours(hours, Number(match[2]), 0, 0);
  return date;
};

const parseTimeParts = time => {
  const match = time?.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    const now = new Date();
    const hours = now.getHours();
    return {
      hour: hours % 12 || 12,
      minute: now.getMinutes(),
      ampm: hours >= 12 ? 'PM' : 'AM',
    };
  }
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    ampm: match[3].toUpperCase(),
  };
};

const AlarmFormModal = ({
  visible,
  mode = 'edit',
  alarm = null,
  initialTime,
  onSave,
  onClose,
}) => {
  const defaultTime =
    mode === 'create' ? initialTime || '7:00 AM' : alarm?.time || '7:00 AM';
  const [time, setTime] = useState(defaultTime);
  const [name, setName] = useState('');
  const [vibrate, setVibrate] = useState(true);
  const [sound, setSound] = useState(DEFAULT_SOUND);
  const [steps, setSteps] = useState(() =>
    normalizeSteps(mode === 'create' ? undefined : alarm?.steps),
  );
  // Inline fields edit the single walking step shown to the user.
  const [stepTarget, setStepTarget] = useState('100');
  const [stepThreshold, setStepThreshold] = useState('2.5');
  const [stepMinInterval, setStepMinInterval] = useState('300');
  const [repeatDays, setRepeatDays] = useState(() =>
    normalizeRepeatDays(mode === 'create' ? undefined : alarm?.repeatDays),
  );
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTime(
        mode === 'create' ? initialTime || '7:00 AM' : alarm?.time || '7:00 AM',
      );
      setName(mode === 'create' ? '' : alarm?.name || '');
      setVibrate(mode === 'create' ? true : alarm?.vibrate !== false);
      setSound(
        mode === 'create' ? DEFAULT_SOUND : alarm?.sound || DEFAULT_SOUND,
      );
      const normalized = normalizeSteps(
        mode === 'create' ? undefined : alarm?.steps,
      );
      setSteps(normalized);
      const first = normalized[0];
      setStepTarget(String(first.config.target));
      setStepThreshold(String(first.config.threshold));
      setStepMinInterval(String(first.config.minIntervalMs));
      setRepeatDays(
        normalizeRepeatDays(mode === 'create' ? undefined : alarm?.repeatDays),
      );
    }
  }, [visible, mode, alarm, initialTime]);

  const openTimePicker = () => {
    if (Platform.OS !== 'android') {
      showToast('Time picking is only supported on Android');
      return;
    }
    DateTimePickerAndroid.open({
      value: parseTimeToDate(time),
      mode: 'time',
      is24Hour: false,
      onChange: (event, selectedTime) => {
        if (event.type === 'dismissed' || !selectedTime) {
          return;
        }
        const updatedTime = new Date();
        updatedTime.setHours(
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          0,
          0,
        );
        const hours = updatedTime.getHours();
        const minutes = updatedTime.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        setTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
      },
    });
  };

  const timeParts = parseTimeParts(time);

  const handleSave = () => {
    Keyboard.dismiss();
    if (repeatDays.length === 0) {
      showToast('Select at least one day for the alarm');
      return;
    }

    const target = Number(stepTarget);
    const threshold = Number(stepThreshold);
    const minIntervalMs = Number(stepMinInterval);
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

    // Apply the inline walking-step values to the (single) walking step.
    const firstStep = createStep('steps', {
      config: {target, threshold, minIntervalMs},
    });
    const updatedSteps =
      mode === 'create'
        ? [firstStep]
        : steps.map((step, index) =>
            index === 0
              ? {...step, config: {target, threshold, minIntervalMs}}
              : step,
          );

    onSave({
      time,
      steps: updatedSteps,
      repeatDays,
      name: name.trim(),
      vibrate,
      sound,
    });
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {mode === 'create' ? 'New Alarm' : 'Edit Alarm'}
        </Text>

        <Text style={styles.label}>Name (optional)</Text>
        <AppInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning run"
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Time</Text>
        <View style={styles.clockRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change hour"
            onPress={openTimePicker}
            style={({pressed}) => [
              styles.timeCell,
              pressed && styles.timeCellPressed,
            ]}>
            <Text style={styles.timeCellText}>{timeParts.hour}</Text>
          </Pressable>
          <Text style={styles.colon}>:</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change minutes"
            onPress={openTimePicker}
            style={({pressed}) => [
              styles.timeCell,
              pressed && styles.timeCellPressed,
            ]}>
            <Text style={styles.timeCellText}>
              {String(timeParts.minute).padStart(2, '0')}
            </Text>
          </Pressable>
          <View style={styles.ampmBadge}>
            <Text style={styles.ampmText}>{timeParts.ampm}</Text>
          </View>
        </View>
        <Text style={styles.hint}>Tap the time to change it</Text>

        <Text style={styles.label}>Repeat</Text>
        <DaySelector selected={repeatDays} onChange={setRepeatDays} />

        <Text style={styles.label}>Sound</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose alarm sound"
          onPress={() => setShowSoundPicker(true)}
          style={({pressed}) => [
            styles.soundRow,
            pressed && styles.soundRowPressed,
          ]}>
          <Icon name="🔔" size={16} color={colors.textSecondary} />
          <Text style={styles.soundText} numberOfLines={1}>
            {sound.title}
          </Text>
          <Icon name="›" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.switchRow}>
          <Icon name="📳" size={16} color={colors.textSecondary} />
          <Text style={styles.switchLabel}>Vibrate</Text>
          <AppSwitch value={vibrate} onValueChange={setVibrate} />
        </View>

        <View style={styles.divider} />
        <Text style={styles.label}>Walking step</Text>
        <Text style={styles.stepHint}>
          You will need to walk this many steps to stop the alarm.
        </Text>
        <Text style={styles.label}>Target steps</Text>
        <AppInput
          value={stepTarget}
          onChangeText={setStepTarget}
          keyboardType="numeric"
          placeholder="e.g. 100"
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Sensitivity</Text>
            <AppInput
              value={stepThreshold}
              onChangeText={setStepThreshold}
              keyboardType="numeric"
              placeholder="e.g. 2.5"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Min. interval (ms)</Text>
            <AppInput
              value={stepMinInterval}
              onChangeText={setStepMinInterval}
              keyboardType="numeric"
              placeholder="e.g. 300"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Cancel"
            variant="danger"
            onPress={onClose}
            style={styles.actionButton}
          />
          <AppButton
            title={mode === 'create' ? 'Add Alarm' : 'Save Alarm'}
            onPress={handleSave}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      <SoundPickerModal
        visible={showSoundPicker}
        current={sound}
        onSelect={selected => {
          setSound(selected);
          setShowSoundPicker(false);
        }}
        onClose={() => setShowSoundPicker(false)}
      />
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
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timeCell: {
    minWidth: 88,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  timeCellPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  timeCellText: {
    ...typography.h1,
    color: colors.text,
    fontSize: 30,
  },
  colon: {
    ...typography.h1,
    color: colors.textMuted,
    fontSize: 30,
    paddingBottom: spacing.xs,
  },
  ampmBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.round,
    backgroundColor: colors.primaryLight,
  },
  ampmText: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 15,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  stepHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  soundRowPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  soundText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  switchLabel: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
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

export default AlarmFormModal;
