import type { JSX } from 'react';

import { Home } from '../pages/Home';
import { AppProvider } from '../../app/AppProvider';

export const App = (): JSX.Element => (
  <AppProvider>
    <Home />
  </AppProvider>
);
