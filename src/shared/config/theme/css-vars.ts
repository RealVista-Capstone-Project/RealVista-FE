/**
 * CSS Custom Properties for RealVista Theme
 *
 * These variables are used in globals.css and provide the foundation
 * for the design system. All colors are based on the Figma design.
 */

export const cssVars = {
  // Main Colors
  '--color-main-black': '#000929',
  '--color-main-white': '#FFFFFF',
  '--color-main-primary': '#7065F0',
  '--color-main-secondary': '#100A55',

  // Greyscale
  '--color-grey-50': '#F9FAFB',
  '--color-grey-100': '#F4F4F6',
  '--color-grey-200': '#E5E6EB',
  '--color-grey-300': '#D3D5DA',
  '--color-grey-400': '#9EA3AE',
  '--color-grey-500': '#6C727F',
  '--color-grey-600': '#4D5461',
  '--color-grey-700': '#394150',
  '--color-grey-800': '#212936',
  '--color-grey-900': '#0B0A0F',

  // Shades of Purple
  '--color-purple-90': '#D8D6F5',
  '--color-purple-92': '#E0DEF7',
  '--color-purple-94': '#E8E6F9',
  '--color-purple-96': '#F0EFFB',
  '--color-purple-98': '#F7F7FD',

  // Semantic Colors
  '--background': '#FFFFFF',
  '--foreground': '#000929',
  '--card': '#FFFFFF',
  '--card-foreground': '#000929',
  '--popover': '#FFFFFF',
  '--popover-foreground': '#000929',
  '--primary': '#7065F0',
  '--primary-foreground': '#FFFFFF',
  '--secondary': '#100A55',
  '--secondary-foreground': '#FFFFFF',
  '--muted': '#F4F4F6',
  '--muted-foreground': '#4D5461',
  '--accent': '#F4F4F6',
  '--accent-foreground': '#000929',
  '--destructive': '#EF4444',
  '--destructive-foreground': '#FFFFFF',
  '--border': '#E5E6EB',
  '--input': '#E5E6EB',
  '--ring': '#7065F0',

  // Border Radius
  '--radius': '0.625rem',
  '--radius-sm': '0.375rem',
  '--radius-md': '0.5rem',
  '--radius-lg': '0.625rem',
  '--radius-xl': '0.75rem',
  '--radius-2xl': '1rem',
} as const;

/**
 * Generate CSS variable string for inline styles
 */
export function getCssVar(name: keyof typeof cssVars): string {
  return `var(${name})`;
}
