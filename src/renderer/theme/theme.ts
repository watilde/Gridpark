import { extendTheme } from '@mui/joy/styles';

import { radius, shadow } from './tokens';
import { createScheme, type ThemePreset, type ThemePresetId } from './types';
import { themePresets, themePresetList, themeOptions } from './presets';

export { themePresets, themePresetList, themeOptions };

export const DEFAULT_THEME_ID: ThemePresetId = 'gridpark';

export const createThemeFromPreset = (preset: ThemePreset) =>
  extendTheme({
    radius,
    shadow,
    fontFamily: {
      body: '"Noto Sans", system-ui, sans-serif',
      display: '"Caveat", cursive',
    },
    colorSchemes: {
      light: createScheme(preset.schemes.light),
      dark: createScheme(preset.schemes.dark),
    },
    components: {
      JoyInput: {
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            ...(ownerState.variant === 'soft' && ownerState.color === 'neutral'
              ? {
                  backgroundColor: theme.palette.background.level1,
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.background.level1,
                  },
                  '&.Mui-focused, &:focus-within': {
                    backgroundColor: theme.palette.background.level2,
                    boxShadow: `0 0 0 1px ${theme.palette.primary.outlinedBorder}`,
                  },
                }
              : {}),
            '& .MuiInput-input': {
              backgroundColor: 'transparent',
            },
          }),
        },
      },
    },
  });
