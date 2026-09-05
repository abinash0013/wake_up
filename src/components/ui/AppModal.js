import React from 'react';
import {Modal, Pressable, StyleSheet} from 'react-native';
import {colors, radii, spacing, shadows} from '../../theme';

// Shared modal shell with backdrop, slide animation and safe gutters.
const AppModal = ({visible, onClose, children, animationType = 'slide'}) => (
  <Modal
    transparent
    visible={visible}
    animationType={animationType}
    onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.floating,
    maxHeight: '85%',
  },
});

export default AppModal;
