/**
 * Theme utility functions for consistent color and style usage
 */

import type { Theme } from './theme';

export type ColorKey =
  | 'main'
  | 'grey'
  | 'purple'
  | 'primary'
  | 'secondary'
  | 'background'
  | 'foreground'
  | 'card'
  | 'popover'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'border'
  | 'input'
  | 'ring';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type PurpleShade = 90 | 92 | 94 | 96 | 98;

/**
 * Get Tailwind color class helper
 * Returns a color value that can be used with Tailwind's arbitrary values
 */
export function getColor(color: 'primary' | 'secondary' | 'destructive'): string;
export function getColor(color: 'grey', shade: Shade): string;
export function getColor(color: 'purple', shade: PurpleShade): string;
export function getColor(color: ColorKey, shade?: number): string {
  if (color === 'grey' && shade !== undefined) {
    return `hsl(var(--color-grey-${shade}))`;
  }
  if (color === 'purple' && shade !== undefined) {
    return `hsl(var(--color-purple-${shade}))`;
  }
  return `hsl(var(--color-${color}))`;
}

/**
 * Get CSS variable for a theme color
 */
export function getCssVar(color: ColorKey, shade?: number): string {
  if (shade !== undefined) {
    return `var(--color-${color}-${shade})`;
  }
  return `var(--color-${color})`;
}

/**
 * Theme color constants for direct usage
 */
export const colors = {
  // Main colors
  main: {
    black: '#000929',
    white: '#FFFFFF',
    primary: '#7065F0',
    secondary: '#100A55',
  },

  // Greyscale
  grey: {
    50: '#F9FAFB',
    100: '#F4F4F6',
    200: '#E5E6EB',
    300: '#D3D5DA',
    400: '#9EA3AE',
    500: '#6C727F',
    600: '#4D5461',
    700: '#394150',
    800: '#212936',
    900: '#0B0A0F',
  },

  // Purple shades
  purple: {
    90: '#D8D6F5',
    92: '#E0DEF7',
    94: '#E8E6F9',
    96: '#F0EFFB',
    98: '#F7F7FD',
  },
} as const;

/**
 * Border radius constants
 */
export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.625rem',
  xl: '0.75rem',
  '2xl': '1rem',
} as const;

/**
 * Font family constants
 */
export const fontFamily = {
  sans: "'Plus Jakarta Sans', sans-serif",
} as const;
