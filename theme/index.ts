// /theme/index.ts
import { createContext, useContext } from 'react';
import { ColorValue } from 'react-native';
const tintColorLight = '#fff';
const tintColorDark = '#fff';

export const colors = {
  light: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    muted: '#A1A1A1',
    primary: '#F25C5C',
    secondary: '#FFB800',
    surface: '#2A2A2A',
    border: '#333333',
    heart: '#FFFFFF',
    heartFill: '#F25C5C',
    playButton: '#000000AA',
    tint: tintColorLight,
    icon: '#5C5C5C',
    tabIconDefault: '#A0A0A0',
    tabIconSelected: tintColorLight,
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    muted: '#A1A1A1',
    primary: '#F25C5C',
    secondary: '#FFB800',
    surface: '#2A2A2A',
    border: '#333333',
    heart: '#FFFFFF',
    heartFill: '#F25C5C',
    playButton: '#000000AA',
    tint: tintColorDark,
    icon: '#5C5C5C',
    tabIconDefault: '#A0A0A0',
    tabIconSelected: tintColorDark,
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const fontSizes = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 12, lg: 20 };

export const gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
  '#000000',
  '#1C1C1C',
  'rgba(90, 26, 26, 0.6)',
];
export const gradientConfig = {
  start: { x: 0, y: 1 },
  end: { x: 1, y: 0 },
};

export const ThemeContext = createContext({
  colors,
  spacing,
  fontSizes,
  radius,
  gradientColors,
  gradientConfig,
});

export const useAppTheme = () => useContext(ThemeContext);
