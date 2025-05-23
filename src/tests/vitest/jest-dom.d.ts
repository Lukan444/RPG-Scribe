/// <reference types="vitest" />
import '@testing-library/jest-dom';

// Extend Vitest's Assertion interface with jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string | RegExp): T;
    toHaveClass(...classNames: string[]): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeEmpty(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toBeVisible(): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveAttribute(attr: string, value?: string | RegExp): T;
    toHaveDescription(text: string | RegExp): T;
    toHaveFocus(): T;
    toHaveFormValues(expectedValues: Record<string, any>): T;
    toHaveStyle(css: string | Record<string, any>): T;
    toHaveValue(value?: string | string[] | number | null): T;
    toBeChecked(): T;
    toBePartiallyChecked(): T;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): T;
  }
}