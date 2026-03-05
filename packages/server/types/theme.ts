export const THEMES = {
  light: 'light',
  dark: 'dark',
} as const;

export type Theme = keyof typeof THEMES;
export const THEME_VALUES = Object.values(THEMES) as Theme[];
