import type { JSX } from 'react';

import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';

import { Home } from '../pages/Home';
import { theme } from '../theme/theme';

export const App = (): JSX.Element => (
  <CssVarsProvider theme={theme} defaultMode="system">
    <CssBaseline />
    <Home />
  </CssVarsProvider>
);
