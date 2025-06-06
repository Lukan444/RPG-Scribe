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
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '../../contexts/AuthContext';
import { RPGWorldProvider } from '../../contexts/RPGWorldContext';
import { ActivityLogProvider } from '../../contexts/ActivityLogContext';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import testI18n from './test-i18n';

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
      <I18nextProvider i18n={testI18n}>
        <MantineProvider env="test">
          <ModalsProvider>
            <BrowserRouter>
              <AuthProvider>
                <ActivityLogProvider>
                  <RPGWorldProvider>
                    {children}
                  </RPGWorldProvider>
                </ActivityLogProvider>
              </AuthProvider>
            </BrowserRouter>
          </ModalsProvider>
        </MantineProvider>
      </I18nextProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Custom render function that wraps components with specific providers
 * @param ui Component to render
 * @param providers Array of provider names to include
 * @param options Render options
 * @returns Rendered component with specified providers
 */
export function renderWithSpecificProviders(
  ui: ReactElement,
  providers: Array<'mantine' | 'router' | 'auth' | 'rpgworld' | 'activitylog'> = ['mantine', 'router', 'auth'],
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const CustomProviders = ({ children }: { children: React.ReactNode }) => {
    let wrappedChildren = children;

    // Apply providers in reverse order (innermost first)
    const providerOrder = [...providers].reverse();

    for (const provider of providerOrder) {
      switch (provider) {
        case 'mantine':
          wrappedChildren = (
            <MantineProvider env="test">
              <ModalsProvider>
                {wrappedChildren}
              </ModalsProvider>
            </MantineProvider>
          );
          break;
        case 'router':
          wrappedChildren = (
            <BrowserRouter>
              {wrappedChildren}
            </BrowserRouter>
          );
          break;
        case 'auth':
          wrappedChildren = (
            <AuthProvider>
              {wrappedChildren}
            </AuthProvider>
          );
          break;
        case 'rpgworld':
          wrappedChildren = (
            <RPGWorldProvider>
              {wrappedChildren}
            </RPGWorldProvider>
          );
          break;
        case 'activitylog':
          wrappedChildren = (
            <ActivityLogProvider>
              {wrappedChildren}
            </ActivityLogProvider>
          );
          break;
      }
    }

    return <>{wrappedChildren}</>;
  };

  return render(ui, { wrapper: CustomProviders, ...options });
}

/**
 * Simplified render function that wraps with MantineProvider and I18nextProvider
 * Uses env="test" to disable transitions and portals for easier testing
 * @param ui Component to render
 * @param options Render options
 * @returns Rendered component with MantineProvider and I18nextProvider
 */
export function renderWithMantine(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={testI18n}>
        <MantineProvider env="test">
          {children}
        </MantineProvider>
      </I18nextProvider>
    ),
    ...options,
  });
}

/**
 * Mock data for testing
 */
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true
};

/**
 * Wait for promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock event handlers
 */
export const mockHandlers = {
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onView: vi.fn(),
  onClose: vi.fn(),
  onOpen: vi.fn(),
  onSuccess: vi.fn(),
  onError: vi.fn()
};

/**
 * Reset all mock handlers
 */
export function resetMockHandlers() {
  Object.values(mockHandlers).forEach(handler => handler.mockReset());
}

/**
 * Create a mock event
 * @param overrides Event properties to override
 * @returns Mock event object
 */
export function createMockEvent(overrides = {}) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: { value: '' },
    ...overrides
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { userEvent };
