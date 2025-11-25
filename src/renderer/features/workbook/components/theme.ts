import { extendTheme } from '@mui/joy/styles';
import { colors } from '../../../theme/tokens';

export const excelTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          body: colors.neutral.offWhite,
          surface: '#FFFFFF',
          level1: '#FFFFFF',
          level2: colors.neutral.grayL,
        },
        neutral: {
          plainColor: colors.neutral.softBlack,
        },
        primary: {
          solidBg: colors.core.violet.main,
          solidHoverBg: colors.core.violet.hover,
          outlinedBorder: colors.core.violet.main,
        },
      },
    },
  },
});

export const excelPalette = {
  gridBackground: '#FFFFFF',
  gridText: colors.neutral.softBlack,
  headerBorder: colors.neutral.grayL,
  cellBorder: colors.neutral.grayL,
  cellHover: colors.neutral.offWhite,
  cellSelected: `${colors.core.violet.main}33`,
  cellMatch: `${colors.accent.orange.main}33`,
  cellCurrent: `${colors.accent.orange.main}66`,
};
