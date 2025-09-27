import { extendTheme } from '@mui/joy/styles';
import { colors, radius, shadow } from './tokens';
import '@mui/joy/styles';

export const theme = extendTheme({
  radius,
  shadow,
  fontFamily: {
    body: '"Noto Sans", system-ui, sans-serif',
    display: '"Caveat", cursive',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: colors.core.violet.main,
          solidHoverBg: colors.core.violet.hover,
        },
        success: { solidBg: colors.accent.neonGreen.main },
        warning: { solidBg: colors.accent.orange.main },
        info:    { solidBg: colors.accent.turquoise.main },
        danger:  { solidBg: colors.accent.hotPink.main },
        background: { body: colors.neutral.offWhite },
        text: { primary: colors.core.navy },
      },
    },
    dark: {
      palette: {
        primary: {
          solidBg: colors.core.violet.hover,
          solidHoverBg: colors.core.violet.dark,
        },
        success: { solidBg: colors.accent.neonGreen.dark },
        warning: { solidBg: colors.accent.orange.dark },
        info:    { solidBg: colors.accent.turquoise.dark },
        danger:  { solidBg: colors.accent.hotPink.dark },
        background: { body: colors.neutral.softBlack },
        text: { primary: colors.neutral.offWhite },
      },
    },
  },
});
