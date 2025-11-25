import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { CssVarsProvider } from '@mui/joy/styles';
import { theme } from '../renderer/theme/theme';

// Custom render function that includes Joy UI theme provider
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <CssVarsProvider theme={theme}>{children}</CssVarsProvider>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

// Re-export specific items from React Testing Library
export { userEvent } from '@testing-library/user-event';
export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';

// Export custom render as render
export { customRender as render };

// Helper functions for testing
export const createMockIcon = () => {
  return <span data-testid="mock-icon">icon</span>;
};

export const createMockAction = (id: string, overrides = {}) => ({
  id,
  icon: createMockIcon(),
  tooltip: `Tooltip for ${id}`,
  onClick: jest.fn(),
  disabled: false,
  active: false,
  variant: 'plain' as const,
  ...overrides,
});
