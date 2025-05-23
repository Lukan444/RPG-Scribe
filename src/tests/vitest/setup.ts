import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global
// Use type assertions to avoid TypeScript errors with incompatible types
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null;
    return {
      pass,
      message: () => pass
        ? `Expected element not to be in the document, but it was found`
        : `Expected element to be in the document, but it was not found`,
    };
  },
  toHaveTextContent: (received, expected) => {
    const content = received?.textContent || '';
    const pass = content.includes(expected);
    return {
      pass,
      message: () => pass
        ? `Expected element not to have text content "${expected}", but it did`
        : `Expected element to have text content "${expected}", but it had "${content}"`,
    };
  },
  toHaveClass: (received, expected) => {
    const classList = Array.from(received?.classList || []);
    const pass = classList.includes(expected);
    return {
      pass,
      message: () => pass
        ? `Expected element not to have class "${expected}", but it did`
        : `Expected element to have class "${expected}", but it had "${classList.join(' ')}"`,
    };
  },
  toBeDisabled: (received) => {
    const pass = received?.disabled === true;
    return {
      pass,
      message: () => pass
        ? `Expected element not to be disabled, but it was`
        : `Expected element to be disabled, but it was not`,
    };
  },
});