/**
 * TubeFlow design tokens.
 *
 * The app is intentionally dark-first: deep space backgrounds, vivid
 * aurora gradients, and glassy elevated surfaces.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  background: '#07070F',
  backgroundDeep: '#04040A',
  backgroundElement: '#13131F',
  backgroundSelected: '#1C1C2B',
  surface: '#10101A',
  surfaceElevated: '#181826',
  surfaceGlass: 'rgba(22, 22, 36, 0.72)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#F7F7FD',
  textSecondary: '#A6A6BE',
  textMuted: '#6F6F88',
  accent: '#F43F7D',
  accentAlt: '#8B5CF6',
  accentSoft: 'rgba(244, 63, 125, 0.14)',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  pink: '#F43F7D',
  rose: '#FB7185',
  cyan: '#22D3EE',
  blue: '#60A5FA',
  amber: '#FBBF24',
  green: '#34D399',
  danger: '#FB7185',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(4, 4, 10, 0.78)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Gradients = {
  brand: ['#8B5CF6', '#D946EF', '#F43F7D'] as const,
  brandDiagonal: ['#7C3AED', '#DB2777', '#FB7185'] as const,
  video: ['#F43F7D', '#8B5CF6'] as const,
  audio: ['#22D3EE', '#6366F1'] as const,
  card: ['rgba(139, 92, 246, 0.20)', 'rgba(244, 63, 125, 0.04)'] as const,
  glass: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)'] as const,
  success: ['#34D399', '#22D3EE'] as const,
  danger: ['#FB7185', '#F43F7D'] as const,
  background: ['#0B0B17', '#07070F', '#05050C'] as const,
};

export const Fonts = Platform.select({
  default: {
    display: 'SpaceGrotesk_700Bold',
    heading: 'SpaceGrotesk_600SemiBold',
    headingMedium: 'SpaceGrotesk_500Medium',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
    bodyBold: 'Inter_700Bold',
    mono: 'SpaceGrotesk_500Medium',
  },
  web: {
    display: 'SpaceGrotesk_700Bold, ui-sans-serif, system-ui, sans-serif',
    heading: 'SpaceGrotesk_600SemiBold, ui-sans-serif, system-ui, sans-serif',
    headingMedium: 'SpaceGrotesk_500Medium, ui-sans-serif, system-ui, sans-serif',
    body: 'Inter_400Regular, ui-sans-serif, system-ui, sans-serif',
    bodyMedium: 'Inter_500Medium, ui-sans-serif, system-ui, sans-serif',
    bodySemiBold: 'Inter_600SemiBold, ui-sans-serif, system-ui, sans-serif',
    bodyBold: 'Inter_700Bold, ui-sans-serif, system-ui, sans-serif',
    mono: 'SpaceGrotesk_500Medium, ui-monospace, monospace',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
  nine: 96,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

export const Layout = {
  maxContentWidth: 760,
  tabBarHeight: 66,
  screenPadding: 20,
} as const;

/** Kept for the starter components that still reference these names. */
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 0 }) ?? 0;
export const MaxContentWidth = Layout.maxContentWidth;
