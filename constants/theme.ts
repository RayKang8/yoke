export const colors = {
  // Light mode
  light: {
    background:  '#FAFAF7',
    surface:     '#FFFFFF',
    warmSurface: '#FFFCF5',  // subtle cream for cards and journal areas
    accent:      '#F5C842',
    accentDark:  '#E8A020',
    textPrimary:   '#1A1A1A',
    textSecondary: '#6B6B6B',
    border:      '#EFEFEB',
    warmBorder:  '#EDE8DD',  // slightly warmer border for journal/card areas
  },
  // Dark mode
  dark: {
    background:  '#1A1A1A',
    surface:     '#242424',
    warmSurface: '#201D18',  // warm dark for cards
    accent:      '#F5C842',
    accentDark:  '#E8A020',
    textPrimary:   '#F5F0E8',
    textSecondary: '#9A9A9A',
    border:      '#2E2E2E',
    warmBorder:  '#332E27',  // warm dark border
  },
} as const;

export const fonts = {
  // Lora — serif for headings and devotional content
  heading:         'Lora_700Bold',
  headingSemibold: 'Lora_600SemiBold',
  body:            'Lora_400Regular',
  bodyItalic:      'Lora_400Regular_Italic',
  // Nunito — soft sans for UI chrome, labels, buttons
  ui:              'Nunito_600SemiBold',
  uiRegular:       'Nunito_400Regular',
  uiMedium:        'Nunito_500Medium',
  uiBold:          'Nunito_700Bold',
} as const;

// Warm gold-tinted shadow — gives cards a subtle depth without harsh contrast
export const shadows = {
  card: {
    shadowColor: '#C8A84B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   26,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;
