import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {colors, shadows} from '../../theme';
import Icon from './Icon';

const FloatingActionButton = ({onPress, accessibilityLabel = 'Add'}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={({pressed}) => [styles.button, pressed && styles.pressed]}>
    <Icon name="+" size={32} color={colors.background} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  pressed: {
    opacity: 0.85,
    transform: [{scale: 0.96}],
  },
});

export default FloatingActionButton;
