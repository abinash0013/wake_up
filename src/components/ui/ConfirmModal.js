import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../theme';
import AppModal from './AppModal';
import AppButton from './AppButton';

const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => (
  <AppModal visible={visible} onClose={onCancel}>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <View style={styles.actions}>
      <AppButton
        title={cancelLabel}
        variant="secondary"
        onPress={onCancel}
        style={styles.actionButton}
      />
      <AppButton
        title={confirmLabel}
        variant={danger ? 'danger' : 'primary'}
        onPress={onConfirm}
        style={styles.actionButton}
      />
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
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

export default ConfirmModal;
