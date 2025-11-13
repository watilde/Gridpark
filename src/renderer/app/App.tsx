import type { JSX } from 'react';

import { Home } from '../pages/Home';
import { ThemeProvider } from '../theme/ThemeProvider';

export const App = (): JSX.Element => (
  <ThemeProvider>
    <Home />
  </ThemeProvider>
);
