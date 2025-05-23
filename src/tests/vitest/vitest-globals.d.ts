/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

// Extend Vitest's expect with jest-dom matchers
interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveTextContent(text: string | RegExp): R;
  toHaveClass(...classNames: string[]): R;
  toBeDisabled(): R;
  toBeEnabled(): R;
  toBeEmpty(): R;
  toBeInvalid(): R;
  toBeRequired(): R;
  toBeValid(): R;
  toBeVisible(): R;
  toContainElement(element: HTMLElement | null): R;
  toContainHTML(htmlText: string): R;
  toHaveAttribute(attr: string, value?: string | RegExp): R;
  toHaveDescription(text: string | RegExp): R;
  toHaveFocus(): R;
  toHaveFormValues(expectedValues: Record<string, any>): R;
  toHaveStyle(css: string | Record<string, any>): R;
  toHaveValue(value?: string | string[] | number | null): R;
  toBeChecked(): R;
  toBePartiallyChecked(): R;
  toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
}

declare global {
  namespace Vi {
    interface Assertion extends CustomMatchers {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
  }
}