import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const FONT_FAMILY = Platform.select({ ios: 'Inter', android: 'Inter, sans-serif' });

export const COLORS = {
  bg: '#000000',
  surface: '#08101D',
  card: '#121215',
  cardAlt: '#0F172A',
  border: '#27272a',
  borderDark: '#172A45',
  borderLight: '#334155',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  textSub: '#71717a',
  textSlate: '#94A3B8',
  textLightSlate: '#CBD5E1',
  primary: '#3b82f6',
  accent: '#38bdf8',
  success: '#10b981',
  gold: '#f59e0b',
  error: '#ef4444',
};
