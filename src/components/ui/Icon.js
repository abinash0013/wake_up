import React from 'react';
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Footprints,
  Pencil,
  Plus,
  Trash2,
  Vibrate,
  X,
} from 'lucide-react-native';
import {colors} from '../../theme';

// Central icon registry. Keys can be either the legacy glyph or the
// lucide icon name, so existing call sites keep working untouched.
const registry = {
  '📅': Calendar,
  '📳': Vibrate,
  '✎': Pencil,
  '🗑': Trash2,
  '🔔': Bell,
  '›': ChevronRight,
  '✕': X,
  '✓': Check,
  '+': Plus,
  '▲': ChevronUp,
  '▼': ChevronDown,
  '👣': Footprints,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Footprints,
  Pencil,
  Plus,
  Trash2,
  Vibrate,
  X,
};

const Icon = ({name, size = 18, color}) => {
  const IconComponent = registry[name] || Calendar;
  return <IconComponent size={size} color={color || colors.text} strokeWidth={2} />;
};

export default Icon;
