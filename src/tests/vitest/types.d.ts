import '@testing-library/jest-dom';
import { Assertion } from 'vitest';

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveTextContent(text: string): R;
  toHaveClass(className: string): R;
  toBeDisabled(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}