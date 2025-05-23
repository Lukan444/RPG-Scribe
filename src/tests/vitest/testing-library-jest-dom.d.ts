import '@testing-library/jest-dom';

declare module '@testing-library/jest-dom' {
  export interface JestMatchers<R> {
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
}

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveTextContent(text: string | RegExp): void;
      toHaveClass(...classNames: string[]): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toBeEmpty(): void;
      toBeInvalid(): void;
      toBeRequired(): void;
      toBeValid(): void;
      toBeVisible(): void;
      toContainElement(element: HTMLElement | null): void;
      toContainHTML(htmlText: string): void;
      toHaveAttribute(attr: string, value?: string | RegExp): void;
      toHaveDescription(text: string | RegExp): void;
      toHaveFocus(): void;
      toHaveFormValues(expectedValues: Record<string, any>): void;
      toHaveStyle(css: string | Record<string, any>): void;
      toHaveValue(value?: string | string[] | number | null): void;
      toBeChecked(): void;
      toBePartiallyChecked(): void;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): void;
    }
  }
}