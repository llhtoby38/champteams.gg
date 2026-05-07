/**
 * Pokemon Champions Color Palette
 *
 * Derived from the official Pokemon Champions logo and website.
 * Logo colors: Black, Red, Gold/Yellow, White
 *
 * USAGE: Import these constants for consistent styling throughout the app.
 * CSS variables are defined in globals.css using these same values.
 */

export const COLORS = {
  // Primary — Dark black (logo background, header)
  primary: '#1a1a2e',
  primaryDark: '#0f0f1a',
  primaryLight: '#2d2d44',

  // Accent — Champions Red (logo "Champions" text, CTAs)
  red: '#c0392b',
  redLight: '#e74c3c',
  redDark: '#a93226',

  // Gold — Champions gold shield (highlights, badges, active states)
  gold: '#d4a017',
  goldLight: '#f0c040',
  goldDark: '#b8860b',

  // White — Background, text on dark
  white: '#ffffff',
  offWhite: '#f8f9fa',

  // Neutrals
  gray50: '#fafafa',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
} as const;
