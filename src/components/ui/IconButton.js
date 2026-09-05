import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {colors, shadows} from '../../theme';

const sizes = {
  sm: {size: 32, iconSize: 14, padding: 6},
  md: {size: 40, iconSize: 16, padding: 8},
  lg: {size: 48, iconSize: 20, padding: 10},
};

const variants = {
  default: {background: colors.surfaceLighter},
  ghost: {background: 'transparent'},
  danger: {background: colors.dangerLight},
  primary: {background: colors.primaryLight},
};

const IconButton = ({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  accessibilityLabel = 'Button',
  style,
}) => {
  const sizeStyle = sizes[size] || sizes.md;
  const variantStyle = variants[variant] || variants.default;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.base,
        {
          width: sizeStyle.size,
          height: sizeStyle.size,
          borderRadius: sizeStyle.size / 2,
          padding: sizeStyle.padding,
        },
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {React.cloneElement(icon, {size: sizeStyle.iconSize})}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  disabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default IconButton;
