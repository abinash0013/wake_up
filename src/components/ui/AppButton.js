import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {colors, radii, shadows, spacing} from '../../theme';

const variantStyles = {
  primary: {
    container: {backgroundColor: colors.primary},
    text: {color: colors.text},
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
    },
    text: {color: colors.text},
  },
  danger: {
    container: {backgroundColor: colors.dangerLight},
    text: {color: colors.danger},
  },
  outline: {
    container: {backgroundColor: colors.primaryLight},
    text: {color: colors.primary},
  },
};

const sizeStyles = {
  sm: {paddingVertical: 8, paddingHorizontal: 14},
  md: {paddingVertical: 12, paddingHorizontal: 20},
  lg: {paddingVertical: 16, paddingHorizontal: 24},
};

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const activeStyle = variantStyles[variant] || variantStyles.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        activeStyle.container,
        sizeStyles[size],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={activeStyle.text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              activeStyle.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.floating,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  disabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: colors.disabledText,
  },
  pressed: {
    opacity: 0.85,
  },
});

export default AppButton;
