export const colors = {
  background: '#0f1023',
  surface: '#1c1e3a',
  surfaceLight: '#262845',
  surfaceLighter: '#2f3260',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',
  text: '#ffffff',
  textSecondary: '#a3a7c4',
  textMuted: '#6e7294',
  primary: '#7c6cff',
  primaryDark: '#5b4ad6',
  primaryLight: 'rgba(124, 108, 255, 0.16)',
  success: '#2ecc8f',
  successDark: '#1f9d6d',
  successLight: 'rgba(46, 204, 143, 0.16)',
  danger: '#ff5f6d',
  dangerDark: '#d64554',
  dangerLight: 'rgba(255, 95, 109, 0.14)',
  warning: '#ffb74d',
  warningLight: 'rgba(255, 183, 77, 0.14)',
  disabled: '#4a4d6e',
  disabledText: '#8b8eb0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const typography = {
  h1: {fontSize: 28, fontWeight: '800', color: colors.text},
  h2: {fontSize: 22, fontWeight: '700', color: colors.text},
  h3: {fontSize: 18, fontWeight: '700', color: colors.text},
  body: {fontSize: 16, fontWeight: '400', color: colors.text},
  bodySmall: {fontSize: 14, fontWeight: '400', color: colors.textSecondary},
  caption: {fontSize: 12, fontWeight: '500', color: colors.textMuted},
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};

const theme = {colors, spacing, radii, typography, shadows};

export default theme;
