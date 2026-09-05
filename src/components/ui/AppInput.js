import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import {colors, radii, spacing} from '../../theme';

const AppInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  autoCapitalize = 'none',
  style,
  ...rest
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <TextInput
      style={[styles.input, !editable && styles.disabled, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      editable={editable}
      autoCapitalize={autoCapitalize}
      {...rest}
    />
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AppInput;
