import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {DEFAULT_SOUND} from '../constants/sound';
import AppModal from './ui/AppModal';
import AppButton from './ui/AppButton';
import Icon from './ui/Icon';

const nativeModule = NativeModules.AlarmSoundManager;

const isDefaultUri = uri => !uri;

const SoundPickerModal = ({
  visible,
  current = DEFAULT_SOUND,
  onSelect,
  onClose,
}) => {
  const [sounds, setSounds] = useState([]);
  const [selectedUri, setSelectedUri] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(DEFAULT_SOUND.title);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    setUnavailable(false);
    setLoading(true);
    setSelectedUri(current?.uri || null);
    setSelectedTitle(current?.title || DEFAULT_SOUND.title);

    if (Platform.OS !== 'android' || !nativeModule) {
      setLoading(false);
      setUnavailable(true);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const [systemSounds, defaultUri] = await Promise.all([
          nativeModule.getAlarmSounds(),
          nativeModule.getDefaultAlarmUri(),
        ]);
        if (cancelled) {
          return;
        }
        const deduped = systemSounds || [];
        const defaultItem = {
          title:
            (deduped.find(sound => sound.uri === defaultUri) || {}).title ||
            DEFAULT_SOUND.title,
          uri: null,
          isDefault: true,
        };
        const rest = deduped.filter(sound => sound.uri !== defaultUri);
        setSounds([defaultItem, ...rest]);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load system sounds', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, current]);

  // Stop any preview playback when leaving the modal.
  useEffect(() => {
    if (visible) {
      return undefined;
    }
    if (Platform.OS === 'android' && nativeModule) {
      nativeModule.stop();
    }
    return undefined;
  }, [visible]);

  const handlesPreview = sound => {
    setSelectedUri(sound.uri || null);
    setSelectedTitle(sound.title);
    if (Platform.OS !== 'android' || !nativeModule) {
      return;
    }
    setPreviewing(true);
    nativeModule
      .start(sound.uri || null, false)
      .then(() => setPreviewing(false))
      .catch(error => {
        setPreviewing(false);
        console.warn('Failed to preview sound', error);
      });
  };

  const handleOk = () => {
    if (Platform.OS === 'android' && nativeModule) {
      nativeModule.stop();
    }
    onSelect({title: selectedTitle, uri: selectedUri});
  };

  const handleClose = () => {
    if (Platform.OS === 'android' && nativeModule) {
      nativeModule.stop();
    }
    onClose();
  };

  return (
    <AppModal visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Sound</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sound picker"
          onPress={handleClose}
          style={styles.closeButton}>
          <Icon name="✕" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {unavailable ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyText}>
            {Platform.OS === 'android'
              ? 'System sounds are unavailable on this device.'
              : 'System sound picking is only supported on Android.'}
          </Text>
          <Text style={styles.emptyHint}>
            The default alarm sound will be used instead.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {sounds.map((sound, index) => {
            const isSelected =
              (sound.isDefault && isDefaultUri(selectedUri)) ||
              (!sound.isDefault && selectedUri === sound.uri);
            return (
              <Pressable
                key={sound.uri || 'default'}
                accessibilityRole="button"
                onPress={() => handlesPreview(sound)}
                style={({pressed}) => [
                  styles.row,
                  index > 0 && styles.rowBorder,
                  isSelected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}>
                <View style={styles.rowTextBlock}>
                  <Text
                    style={[
                      styles.rowTitle,
                      isSelected && styles.rowTitleSelected,
                    ]}
                    numberOfLines={1}>
                    {sound.title}
                  </Text>
                  {sound.isDefault ? (
                    <Text style={styles.defaultBadge}>Default</Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Icon name="✓" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
          <Text style={styles.previewHint}>
            {previewing ? 'Playing…' : 'Tap a sound to hear a preview'}
          </Text>
        </ScrollView>
      )}

      <View style={styles.actions}>
        <AppButton
          title="Cancel"
          variant="danger"
          onPress={handleClose}
          style={[styles.actionButton, styles.flatButton]}
        />
        <AppButton
          title="OK"
          onPress={handleOk}
          disabled={unavailable}
          style={styles.actionButton}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  list: {
    flexGrow: 0,
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLight,
    marginTop: spacing.sm,
  },
  rowBorder: {
    marginTop: spacing.sm,
  },
  rowSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowTextBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  rowTitleSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  defaultBadge: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceLighter,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  previewHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  loadingBlock: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyBlock: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  flatButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default SoundPickerModal;
