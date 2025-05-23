import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveTextContent(text: string): void;
      toHaveClass(className: string): void;
      toBeDisabled(): void;
    }
  }
}