import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { CssVarsProvider } from '@mui/joy/styles';
import { theme } from '../renderer/theme/theme';

// Custom render function that includes Joy UI theme provider
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <CssVarsProvider theme={theme}>
        {children}
      </CssVarsProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render method
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

export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
};