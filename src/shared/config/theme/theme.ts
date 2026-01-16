/**
 * RealVista Design System Theme Configuration
 *
 * Based on Figma design specifications:
 * - Main Colors: #000929 (Black), #7065F0 (Primary Purple), #100A55 (Secondary Purple), #FFFFFF (White)
 * - Greyscale: 50-900 scale
 * - Shades of Purple: 90-98 scale
 * - Font: Plus Jakarta Sans
 */

export const theme = {
  colors: {
    // Main Colors
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

    // Shades of Purple
    purple: {
      90: '#D8D6F5',
      92: '#E0DEF7',
      94: '#E8E6F9',
      96: '#F0EFFB',
      98: '#F7F7FD',
    },

    // Semantic Colors (mapped from main colors)
    primary: {
      DEFAULT: '#7065F0',
      foreground: '#FFFFFF',
    },
    secondary: {
      DEFAULT: '#100A55',
      foreground: '#FFFFFF',
    },
    background: '#FFFFFF',
    foreground: '#000929',
    card: {
      DEFAULT: '#FFFFFF',
      foreground: '#000929',
    },
    popover: {
      DEFAULT: '#FFFFFF',
      foreground: '#000929',
    },
    muted: {
      DEFAULT: '#F4F4F6',
      foreground: '#4D5461',
    },
    accent: {
      DEFAULT: '#F4F4F6',
      foreground: '#000929',
    },
    destructive: {
      DEFAULT: '#EF4444',
      foreground: '#FFFFFF',
    },
    border: '#E5E6EB',
    input: '#E5E6EB',
    ring: '#7065F0',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  fontFamily: {
    sans: ['Plus Jakarta Sans', 'sans-serif'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
} as const;

export type Theme = typeof theme;
