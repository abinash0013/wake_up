import React from 'react';
import {Switch, View} from 'react-native';
import {colors} from '../../theme';

const AppSwitch = ({value, onValueChange, disabled = false}) => (
  <View accessibilityRole="switch">
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{false: colors.surfaceLighter, true: colors.successDark}}
      thumbColor={value ? colors.success : '#ffffff'}
      ios_backgroundColor={colors.surfaceLighter}
    />
  </View>
);

export default AppSwitch;
