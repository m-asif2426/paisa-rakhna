export type AppColors = {
  g1: string; g2: string; gd: string; gl: string; gm: string;
  bg: string; white: string; card: string;
  ink: string; ink2: string; ink3: string; ink4: string;
  green: string; greenl: string;
  red: string; redl: string;
  amber: string; amberl: string;
  blue: string; bluel: string;
  purple: string; purplel: string;
  r: number; rs: number;
  isDark: boolean;
};

export const lightColors: AppColors = {
  g1: '#16a265',
  g2: '#0d7a4c',
  gd: '#094d30',
  gl: '#e6f7f0',
  gm: '#b2e8d0',
  bg: '#f0f5f2',
  white: '#ffffff',
  card: '#ffffff',
  ink: '#080f0a',
  ink2: '#2d4a3a',
  ink3: '#7a9e8c',
  ink4: '#cce4d8',
  green: '#00b87c',
  greenl: '#dcf7ee',
  red: '#e5373a',
  redl: '#fdeaea',
  amber: '#f5a623',
  amberl: '#fef3dc',
  blue: '#3b82f6',
  bluel: '#dbeafe',
  purple: '#7c3aed',
  purplel: '#ede9fe',
  r: 18,
  rs: 12,
  isDark: false,
};

export const darkColors: AppColors = {
  g1: '#1dbE78',
  g2: '#16a265',
  gd: '#0d7a4c',
  gl: '#0d2b1e',
  gm: '#143d2a',
  bg: '#0a0f0c',
  white: '#1a2420',
  card: '#1e2e28',
  ink: '#e8f5ee',
  ink2: '#a8c8b8',
  ink3: '#5a8a72',
  ink4: '#1e3028',
  green: '#1dbE78',
  greenl: '#0d2b1e',
  red: '#ff6b6e',
  redl: '#2b0f10',
  amber: '#ffc043',
  amberl: '#2b200a',
  blue: '#60a5fa',
  bluel: '#0f1f3d',
  purple: '#a78bfa',
  purplel: '#1e1040',
  r: 18,
  rs: 12,
  isDark: true,
};

// Static export for backward-compat (always light) — prefer useColors() for theming
export const Colors = lightColors;
