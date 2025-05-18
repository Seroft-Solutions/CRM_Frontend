import { vi } from 'vitest';
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/features/core/theme/ThemeProvider';

// Common test utilities
export const createMockClickHandler = () => vi.fn();

export const setupUserEvent = () => userEvent.setup();

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
};

// Vitest helpers
export * from '@testing-library/react';
export { userEvent };
export { vi };

// Override render method
export { customRender as render };

// Common selectors
export const selectors = {
  button: (name: string) => ({
    get: () => cy.findByRole('button', { name }),
  }),
  spinner: () => cy.findByRole('status'),
} as const;