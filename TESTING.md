# RPG Scribe Testing Guide

This document provides comprehensive instructions for testing the RPG Scribe application, including setup, running tests, and writing new tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Frameworks](#testing-frameworks)
3. [Test Setup](#test-setup)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Mocking](#mocking)
7. [Test Templates](#test-templates)
8. [Jest to Vitest Migration](#jest-to-vitest-migration)
9. [Continuous Integration](#continuous-integration)
10. [Troubleshooting](#troubleshooting)

## Testing Philosophy

RPG Scribe follows these testing principles:

1. **Realistic Mocks**: Use mocks that simulate real behavior rather than hardcoded responses.
2. **Consistent Patterns**: Use standardized patterns for mocking and testing.
3. **Comprehensive Coverage**: Test happy paths, error cases, loading states, and edge cases.
4. **Isolation**: Tests should be isolated and not depend on each other.
5. **Readability**: Tests should be easy to read and understand.

## Testing Frameworks

RPG Scribe uses two testing frameworks:

1. **Vitest**: The primary testing framework for new tests.
2. **Jest**: Legacy testing framework, being phased out.

We are in the process of migrating all tests from Jest to Vitest. New tests should be written using Vitest.

## Test Setup

### Vitest Setup

Vitest is configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupVitest.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupVitest.ts',
        'src/tests/setup/',
        'src/tests/__mocks__/',
        'src/tests/utils/',
        'src/reportWebVitals.ts',
        'src/index.tsx',
        'src/react-app-env.d.ts',
      ],
    },
    include: ['src/**/*.{test,spec,vitest}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'build', 'dist'],
  },
});
```

The setup file `src/setupVitest.ts` provides global mocks and polyfills for browser APIs and Firebase services.

### Jest Setup

Jest is configured in `jest.config.js` and uses `src/setupTests.js` for setup.

## Running Tests

### Vitest Tests

```bash
# Run all Vitest tests
npm test

# Run Vitest tests in watch mode
npm run test:watch

# Run Vitest tests with UI
npm run test:ui

# Run Vitest tests with coverage
npm run test:coverage

# Run a specific Vitest test file
npm test -- src/components/ui/__tests__/SimpleTest.vitest.tsx
```

### Jest Tests

```bash
# Run all Jest tests
npm run test:jest

# Run Jest tests in watch mode
npm run test:jest:watch

# Run Jest tests with coverage
npm run test:jest:coverage
```

### All Tests

```bash
# Run both Vitest and Jest tests
npm run test:all

# Run both Vitest and Jest tests with coverage
npm run test:all:coverage
```

### Migration Status

```bash
# Check which Jest tests haven't been migrated to Vitest
npm run find-unmigrated-tests

# Get detailed information about unmigrated tests
npm run find-unmigrated-tests:verbose

# Get JSON output of unmigrated tests
npm run find-unmigrated-tests:json
```

## Writing Tests

### Component Tests

Use the component test template for Vitest:

```typescript
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, flushPromises, mockHandlers, resetMockHandlers } from '../utils/test-utils-vitest';
import { createMockDatabase } from '../utils/firestore-test-utils-vitest';

// Import the component to test
import YourComponent from '../../path/to/YourComponent';

describe('YourComponent Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockHandlers();
  });

  it('should render correctly', async () => {
    renderWithProviders(<YourComponent />);
    await flushPromises();
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

### Service Tests

Use the service test template for Vitest:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupFirestoreMocks, createMockDatabase } from '../utils/firestore-test-utils-vitest';

// Import the service to test
import { YourService } from '../../services/your.service';

// Set up Firestore mocks
const mockDb = createMockDatabase('test-user-id');
setupFirestoreMocks(mockDb);

describe('YourService Tests', () => {
  let service;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new YourService();
  });

  it('should create a new entity', async () => {
    const testData = { name: 'Test Entity' };
    const id = await service.create(testData);
    expect(id).toBeTruthy();
  });
});
```

## Mocking

### Firestore Mocking

Use the `firestore-test-utils-vitest.ts` utilities to mock Firestore:

```typescript
import { setupFirestoreMocks, createMockDatabase } from '../utils/firestore-test-utils-vitest';

// Create a mock database with test data
const mockDb = createMockDatabase('test-user-id');

// Set up Firestore mocks
setupFirestoreMocks(mockDb);
```

### Component Mocking

Use the `test-utils-vitest.tsx` utilities to render components with providers:

```typescript
import { renderWithProviders, renderWithMantine } from '../utils/test-utils-vitest';

// Render with all providers
renderWithProviders(<YourComponent />);

// Render with just Mantine provider
renderWithMantine(<YourComponent />);
```

## Test Templates

RPG Scribe provides templates for common test scenarios:

- **Component Tests**: `src/tests/templates/component-test-template-vitest.tsx`
- **Service Tests**: `src/tests/templates/service-test-template-vitest.ts`

Copy these templates and modify them for your specific test needs.

## Jest to Vitest Migration

We are migrating from Jest to Vitest. The migration guide is available at `src/tests/docs/jest-to-vitest-migration.md`.

To migrate a test:

1. Create a new file with the `.vitest.ts` or `.vitest.tsx` extension
2. Update imports to use Vitest instead of Jest
3. Update mocks to use Vitest mocks
4. Update test syntax to use Vitest syntax
5. Run the test to verify it works

## Continuous Integration

The CI pipeline runs both Vitest and Jest tests:

```yaml
- name: Run TypeScript type checking
  run: npm run typecheck

- name: Run Vitest tests
  run: npm run test

- name: Run Jest tests (during migration period)
  run: npm run test:jest

- name: Generate test coverage reports
  run: npm run test:all:coverage
```

## Troubleshooting

### Common Issues

1. **TextEncoder/TextDecoder not defined**: Make sure you're using the polyfills in `setupVitest.ts`.
2. **matchMedia not defined**: Make sure you're using the matchMedia mock in `setupVitest.ts`.
3. **Firebase auth not mocked**: Make sure you're mocking Firebase auth in your tests.
4. **Tests failing with "act" warnings**: Make sure you're using `await flushPromises()` to wait for async operations.

### Getting Help

If you're having trouble with tests, check:

1. The test templates in `src/tests/templates/`
2. The migration guide in `src/tests/docs/jest-to-vitest-migration.md`
3. The test utilities in `src/tests/utils/`
4. The Vitest documentation at https://vitest.dev/
