/**
 * BREW LUNA — Design Tokens for React Native
 */

export const Colors = {
  // Coffee Palette
  espresso:     '#2C1810',
  roast:        '#3D2214',
  mocha:        '#6B3A2A',
  sienna:       '#8B4513',
  latte:        '#C4956A',
  caramel:      '#D4814A',
  cream:        '#F5E6D3',
  foam:         '#FFF8F0',
  parchment:    '#FAF0E6',

  // Accent
  gold:         '#D4A853',
  goldLight:    '#F0C97A',
  goldDark:     '#A8842E',

  // Semantic
  success:      '#4E8C5A',
  successBg:    '#EBF5EE',
  warning:      '#C9882A',
  warningBg:    '#FFF4E0',
  error:        '#C0392B',
  errorBg:      '#FDEDEC',
  info:         '#2E6DA4',
  infoBg:       '#EBF3FB',

  // Status
  statusPending:   '#C9882A',
  statusBrewing:   '#2E6DA4',
  statusPreparing: '#7B5EA7',
  statusReady:     '#27AE60',
  statusCompleted: '#6B7280',

  // Surfaces
  bgPage:       '#FFF8F0',
  bgCard:       '#FFFFFF',
  bgSection:    '#F5E6D3',
  bgOverlay:    'rgba(44, 24, 16, 0.6)',

  // Text
  textPrimary:  '#2C1810',
  textSecondary:'#6B4C3B',
  textMuted:    '#9B8070',
  textInverse:  '#FFF8F0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
