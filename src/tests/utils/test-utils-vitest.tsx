/**
 * Test Utilities for Vitest
 *
 * This file provides utilities for testing React components with all necessary providers.
 * Based on the official Mantine documentation: https://mantine.dev/guides/vitest/
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { AuthProvider } from '../../contexts/AuthContext';
import { RPGWorldProvider } from '../../contexts/RPGWorldContext';
import { ActivityLogProvider } from '../../contexts/ActivityLogContext';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with all necessary providers
 * @param ui Component to render
 * @param options Render options
 * @returns Rendered component with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <MantineProvider>
          <ModalsProvider>
            <AuthProvider>
              <RPGWorldProvider>
                <ActivityLogProvider>
                  {children}
                </ActivityLogProvider>
              </RPGWorldProvider>
            </AuthProvider>
          </ModalsProvider>
        </MantineProvider>
      </BrowserRouter>
    );
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options })
  };
}

/**
 * Utility to flush all promises in the queue
 * Useful for testing async operations
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock handlers for testing event handlers
 */
export const mockHandlers = {
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onDelete: vi.fn(),
  onCancel: vi.fn(),
  onClose: vi.fn(),
  onOpen: vi.fn(),
  onSelect: vi.fn(),
};

/**
 * Reset all mock handlers
 */
export function resetMockHandlers() {
  Object.values(mockHandlers).forEach(handler => {
    handler.mockReset();
  });
}