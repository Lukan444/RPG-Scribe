# Jest to Vitest Migration Guide

This document outlines the common patterns and best practices for migrating tests from Jest to Vitest in the RPG Scribe application.

## Why Vitest?

Vitest offers several advantages over Jest for our application:

1. **Better compatibility with Mantine UI components**: Vitest works seamlessly with Mantine's components, especially with the `env="test"` prop that disables transitions and portals.
2. **Faster execution**: Vitest leverages Vite's dev server for faster test execution.
3. **Modern ESM support**: Vitest has better support for ES modules.
4. **Improved TypeScript integration**: Vitest works better with TypeScript without additional configuration.
5. **Compatible API**: Vitest maintains compatibility with Jest's API, making migration easier.

## Migration Patterns

### 1. Import Statements

**Jest:**
```javascript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
```

**Vitest:**
```javascript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

### 2. Mocking Functions

**Jest:**
```javascript
const mockFn = jest.fn();
jest.mock('module-name', () => ({
  functionName: jest.fn().mockReturnValue('mocked value')
}));
```

**Vitest:**
```javascript
const mockFn = vi.fn();
vi.mock('module-name', () => ({
  functionName: vi.fn().mockReturnValue('mocked value')
}));
```

### 3. Mocking React Router

**Jest:**
```javascript
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));
```

**Vitest:**
```javascript
// Create a mock navigate function at the top level
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Reset the mock before each test if needed
beforeEach(() => {
  mockNavigate.mockReset();
});
```

### 4. Mocking Components

**Jest:**
```javascript
jest.mock('../../components/SomeComponent', () => ({
  SomeComponent: ({ children }) => <div data-testid="mock-component">{children}</div>
}));
```

**Vitest:**
```javascript
vi.mock('../../components/SomeComponent', () => ({
  SomeComponent: ({ children }) => <div data-testid="mock-component">{children}</div>
}));
```

### 5. Rendering Components with Mantine

**Jest:**
```javascript
import { renderWithMantine } from '../utils/test-utils';

test('renders component', () => {
  renderWithMantine(<Component />);
  // assertions...
});
```

**Vitest:**
```javascript
import { renderWithMantine } from '../utils/test-utils-vitest';

it('renders component', () => {
  renderWithMantine(<Component />);
  // assertions...
});
```

### 6. Handling Asynchronous Tests

**Jest:**
```javascript
test('async test', async () => {
  await expect(someAsyncFunction()).resolves.toBe('expected value');
});
```

**Vitest:**
```javascript
it('async test', async () => {
  await expect(someAsyncFunction()).resolves.toBe('expected value');
});
```

### 7. Mocking Firebase Services

**Jest:**
```javascript
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));
```

**Vitest:**
```javascript
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));
```

### 8. Mocking Browser APIs

**Jest:**
```javascript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
});
```

**Vitest:**
```javascript
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
```

## Common Issues and Solutions

### 1. `vi.mocked()` vs `jest.mocked()`

**Issue:** The `vi.mocked()` function works differently than `jest.mocked()`.

**Solution:** Instead of using `vi.mocked()`, create a mock function at the top level and use it directly:

```javascript
// Create a mock function
const mockFunction = vi.fn();

// Use it in your mock
vi.mock('module-name', () => ({
  exportedFunction: mockFunction,
}));

// Reset it before each test if needed
beforeEach(() => {
  mockFunction.mockReset();
});
```

### 2. Module Mocking Timing

**Issue:** Vitest's module mocking can sometimes behave differently than Jest's, especially with timing.

**Solution:** Define mocks at the top level, outside of test functions:

```javascript
// Good - define mocks at the top level
vi.mock('module-name', () => ({
  functionName: vi.fn(),
}));

// Not recommended - defining mocks inside tests
it('test something', () => {
  vi.mock('module-name', () => ({})); // May not work as expected
});
```

### 3. Firestore Mocking

**Issue:** Mocking Firestore can be complex due to its nested structure.

**Solution:** Create comprehensive mocks in the setup file and extend them as needed in specific tests:

```javascript
// In setupVitest.ts
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  // ... other Firestore functions
}));

// In your test file
import { collection, doc } from 'firebase/firestore';

// Override the mock for a specific test if needed
beforeEach(() => {
  vi.mocked(collection).mockReturnValue({ /* custom implementation */ });
});
```

## Running Tests

### Running All Tests

```bash
npm run test:vitest
```

### Running Tests in UI Mode

```bash
npm run test:vitest:ui
```

### Running a Specific Test File

```bash
npm run test:vitest:run -- path/to/test/file.vitest.tsx
```

### Running Tests with Coverage

```bash
npm run test:vitest:coverage
```

## CI Configuration

Our CI pipeline has been updated to run both Jest and Vitest tests during the transition period. Once all tests have been migrated to Vitest, we will remove the Jest configuration.

```yaml
# Example CI configuration
test:
  script:
    - npm run test:vitest:run
    - npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library with Vitest](https://testing-library.com/docs/react-testing-library/setup#using-with-vitest)
- [Mantine Testing Guide](https://mantine.dev/guides/testing/)
