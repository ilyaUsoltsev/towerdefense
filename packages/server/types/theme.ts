export const THEME_VALUES = ['light', 'dark'] as const;
export type Theme = typeof THEME_VALUES[number];
