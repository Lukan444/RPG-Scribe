# RPG Scribe Testing Guide

This guide explains how to write tests for the RPG Scribe application using our standardized mocking patterns.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Framework](#testing-framework)
3. [Test Structure](#test-structure)
4. [Mocking Firestore](#mocking-firestore)
5. [Testing Components](#testing-components)
6. [Testing Services](#testing-services)
7. [Test Templates](#test-templates)
8. [Best Practices](#best-practices)

## Testing Philosophy

Our testing approach follows these principles:

1. **Realistic Mocks**: Use mocks that simulate real behavior rather than hardcoded responses.
2. **Consistent Patterns**: Use standardized patterns for mocking and testing.
3. **Comprehensive Coverage**: Test happy paths, error cases, loading states, and edge cases.
4. **Isolation**: Tests should be isolated and not depend on each other.
5. **Readability**: Tests should be easy to read and understand.

## Testing Framework

RPG Scribe uses Vitest as its testing framework. Vitest offers better compatibility with Mantine UI components, faster execution, and improved TypeScript integration.

### Vitest Setup

Vitest is configured in `vitest.config.ts` and uses `src/setupVitest.ts` for setup. Vitest tests use the `.vitest.ts` or `.vitest.tsx` extension.

## Test Structure

Each test file should follow this structure:

```typescript
// Import testing utilities
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, flushPromises } from '../utils/test-utils-vitest';
import { createMockDatabase } from '../utils/firestore-test-utils-vitest';

// Import the component or service to test
import YourComponent from '../../path/to/YourComponent';

// Set up mocks and test data
const mockDb = createMockDatabase('test-user-id');

describe('YourComponent Tests', () => {
  // Set up before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases
  it('should render correctly', async () => {
    // Render the component
    renderWithProviders(<YourComponent />);

    // Wait for async operations
    await flushPromises();

    // Assertions
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  // More test cases...
});
```

## Mocking Firestore

We use a standardized approach to mock Firestore:

1. **Mock Factory**: Use the `createFirestoreMock` function to create a realistic Firestore mock.
2. **Mock Database**: Use the `createMockDatabase` function to create a mock database with test data.
3. **Setup Mocks**: Use the `setupFirestoreMocks` function to set up Firestore mocks.

```typescript
import { setupFirestoreMocks, createMockDatabase } from '../utils/firestore-test-utils-vitest';

// Create a mock database with test data
const mockDb = createMockDatabase('test-user-id');

// Set up Firestore mocks
setupFirestoreMocks(mockDb);
```

## Testing Components

When testing components, use the appropriate render function to render the component with necessary providers.

```typescript
import { renderWithProviders, renderWithMantine, flushPromises } from '../utils/test-utils-vitest';

// Render the component with all providers
renderWithProviders(<YourComponent />);

// Wait for async operations to complete
await flushPromises();

// Make assertions
expect(screen.getByText(/expected text/i)).toBeInTheDocument();

// For simple UI components, use renderWithMantine
renderWithMantine(<YourComponent />);
```

For components that need specific providers, use the `renderWithSpecificProviders` function:

```typescript
import { renderWithSpecificProviders } from '../utils/test-utils-vitest';

// Render the component with specific providers
renderWithSpecificProviders(
  <YourComponent />,
  ['mantine', 'router', 'auth'] // Only include these providers
);
```

## Testing Services

When testing services, use the `setupFirestoreMocks` function to set up Firestore mocks:

```typescript
import { setupFirestoreMocks, createMockDatabase } from '../utils/firestore-test-utils-vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set up Firestore mocks
const mockDb = createMockDatabase('test-user-id');
setupFirestoreMocks(mockDb);

// Create a service instance
const service = new YourService();

// Test the service
describe('YourService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new entity', async () => {
    const testData = { name: 'Test Entity' };
    const id = await service.create(testData);
    expect(id).toBeTruthy();
  });
});
```

## Test Templates

We provide templates for common test scenarios:

- **Component Tests**: Use the `component-test-template-vitest.tsx` file as a starting point for component tests.
- **Service Tests**: Use the `service-test-template-vitest.ts` file as a starting point for service tests.

Copy these templates and modify them for your specific test needs.

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state of other tests.
2. **Reset Mocks**: Reset mocks before each test using `vi.clearAllMocks()`.
3. **Async Testing**: Use `async/await` for asynchronous tests and `flushPromises()` to wait for promises to resolve.
4. **Realistic Data**: Use realistic test data that matches the shape of real data.
5. **Error Handling**: Test error cases and edge cases, not just happy paths.
6. **Loading States**: Test loading states and transitions.
7. **User Interactions**: Test user interactions using `fireEvent` or `userEvent`.
8. **Accessibility**: Test accessibility using `@testing-library/jest-dom` matchers.
9. **Consistent Naming**: Use consistent naming conventions for test files and test cases.
10. **Snapshot Testing**: Use snapshot testing sparingly and only for stable components.
11. **Test Coverage**: Aim for high test coverage, but focus on critical paths and edge cases.
12. **Mocking External Dependencies**: Mock external dependencies to isolate the code being tested.
13. **Test Organization**: Organize tests in a logical way that mirrors the structure of the code being tested.
14. **Test Readability**: Write tests that are easy to read and understand.

Remember, the goal of testing is to ensure that the application works as expected and to catch regressions early. Write tests that give you confidence in your code, not just tests that increase coverage metrics.
