import React from 'react';
import {Text} from 'react-native';

// Lightweight, dependency-free icon source using Unicode glyphs so no native
// font linking is required.
const Icon = ({name, size = 18, color}) => (
  <Text style={{fontSize: size, color: color || undefined}}>{name}</Text>
);

export default Icon;
