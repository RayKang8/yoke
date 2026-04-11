export const colors = {
  // Light mode
  light: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    accent: '#F5C842',
    accentDark: '#E8A020',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    border: '#EFEFEB',
  },
  // Dark mode
  dark: {
    background: '#1A1A1A',
    surface: '#242424',
    accent: '#F5C842',
    accentDark: '#E8A020',
    textPrimary: '#F5F0E8',
    textSecondary: '#9A9A9A',
    border: '#2E2E2E',
  },
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
