# Testing Strategy for Material UI to Mantine Migration

## Overview

This document outlines a comprehensive testing strategy for the migration of the RPG Archivist application from Material UI to Mantine. The strategy ensures that all functionality is preserved during the migration while maintaining code quality and user experience.

## Testing Levels

### 1. Unit Testing

Unit tests focus on testing individual components in isolation to ensure they function correctly.

#### Components to Test

- **UI Components**: Test all migrated UI components to ensure they render correctly and handle user interactions as expected.
- **Form Components**: Test form components to ensure they validate inputs correctly and handle form submission.
- **Context Providers**: Test context providers to ensure they provide the correct values to consumers.
- **Hooks**: Test custom hooks to ensure they handle state and side effects correctly.

#### Testing Approach

- Use Jest as the test runner
- Use React Testing Library for component testing
- Use mock functions to simulate user interactions
- Use snapshot testing for UI components
- Use test-driven development (TDD) for new components

#### Example Unit Test for a Button Component

```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@mantine/core';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});
```

#### Example Unit Test for a Form Component

```tsx
// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';

describe('LoginForm Component', () => {
  it('renders form fields correctly', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('validates email field', async () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### 2. Integration Testing

Integration tests focus on testing how components work together to ensure they integrate correctly.

#### Components to Test

- **Page Components**: Test page components to ensure they render correctly and handle user interactions.
- **Form Submissions**: Test form submissions to ensure they send the correct data to the API.
- **Navigation**: Test navigation to ensure users can navigate between pages.
- **Context Integration**: Test how components interact with context providers.

#### Testing Approach

- Use Jest as the test runner
- Use React Testing Library for component testing
- Use mock service worker (MSW) to mock API calls
- Use test-driven development (TDD) for new integrations

#### Example Integration Test for a Page Component

```tsx
// CharacterListPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import CharacterListPage from './CharacterListPage';

const server = setupServer(
  rest.get('/api/characters', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Character 1', type: 'PC' },
        { id: '2', name: 'Character 2', type: 'NPC' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CharacterListPage Component', () => {
  it('renders character list correctly', async () => {
    render(
      <MemoryRouter>
        <CharacterListPage />
      </MemoryRouter>
    );
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 2')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching data', () => {
    render(
      <MemoryRouter>
        <CharacterListPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    server.use(
      rest.get('/api/characters', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    render(
      <MemoryRouter>
        <CharacterListPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Testing

End-to-end tests focus on testing the application as a whole to ensure it works correctly from the user's perspective.

#### Flows to Test

- **Authentication**: Test login, registration, and password reset flows.
- **Data Management**: Test creating, reading, updating, and deleting entities.
- **Navigation**: Test navigating between different sections of the application.
- **Form Submission**: Test submitting forms and handling validation errors.
- **Responsive Design**: Test the application on different screen sizes.

#### Testing Approach

- Use Cypress for end-to-end testing
- Use test-driven development (TDD) for new flows
- Test critical user flows first
- Test edge cases and error handling

#### Example End-to-End Test for Authentication Flow

```tsx
// cypress/integration/authentication.spec.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('allows users to log in', () => {
    // Click on the login button
    cy.get('[data-testid="login-button"]').click();
    
    // Fill in the login form
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    // Submit the form
    cy.get('[data-testid="login-submit"]').click();
    
    // Verify that the user is logged in
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'Test User');
  });

  it('displays validation errors for invalid login', () => {
    // Click on the login button
    cy.get('[data-testid="login-button"]').click();
    
    // Fill in the login form with invalid data
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="password-input"]').type('123');
    
    // Submit the form
    cy.get('[data-testid="login-submit"]').click();
    
    // Verify that validation errors are displayed
    cy.get('[data-testid="email-error"]').should('contain', 'Invalid email');
    cy.get('[data-testid="password-error"]').should('contain', 'Password must be at least 6 characters');
  });

  it('allows users to register', () => {
    // Click on the register button
    cy.get('[data-testid="register-button"]').click();
    
    // Fill in the registration form
    cy.get('[data-testid="name-input"]').type('New User');
    cy.get('[data-testid="email-input"]').type('new@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirm-password-input"]').type('password123');
    
    // Submit the form
    cy.get('[data-testid="register-submit"]').click();
    
    // Verify that the user is registered and logged in
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'New User');
  });
});
```

### 4. Visual Regression Testing

Visual regression tests focus on ensuring that the UI looks correct and consistent across different browsers and screen sizes.

#### Components to Test

- **UI Components**: Test all UI components to ensure they render correctly.
- **Page Layouts**: Test page layouts to ensure they are responsive.
- **Theme Consistency**: Test theme consistency across the application.
- **Accessibility**: Test accessibility features like focus states and color contrast.

#### Testing Approach

- Use Storybook for component documentation and testing
- Use Chromatic for visual regression testing
- Use Percy for visual regression testing
- Test on different browsers and screen sizes

#### Example Storybook Story for a Button Component

```tsx
// Button.stories.tsx
import { Button } from '@mantine/core';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outline', 'light', 'subtle', 'white', 'default', 'gradient'],
    },
    color: {
      control: { type: 'select' },
      options: ['teal', 'amber', 'red', 'blue', 'green'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    radius: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
};

export const Default = {
  args: {
    children: 'Button',
    variant: 'filled',
    color: 'teal',
    size: 'md',
    radius: 'md',
    disabled: false,
    loading: false,
  },
};

export const Outline = {
  args: {
    ...Default.args,
    variant: 'outline',
  },
};

export const Light = {
  args: {
    ...Default.args,
    variant: 'light',
  },
};

export const Disabled = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Loading = {
  args: {
    ...Default.args,
    loading: true,
  },
};
```

## Testing Tools

### 1. Jest

Jest is a JavaScript testing framework that will be used for unit and integration testing.

### 2. React Testing Library

React Testing Library is a testing utility for React that will be used for component testing.

### 3. Cypress

Cypress is an end-to-end testing framework that will be used for testing the application as a whole.

### 4. Storybook

Storybook is a tool for developing UI components in isolation that will be used for component documentation and testing.

### 5. Chromatic

Chromatic is a visual testing tool that will be used for visual regression testing.

### 6. Mock Service Worker (MSW)

Mock Service Worker is an API mocking library that will be used for mocking API calls in tests.

## Testing Process

### 1. Test-Driven Development (TDD)

1. Write a failing test for the component or feature
2. Implement the component or feature to make the test pass
3. Refactor the code while keeping the test passing

### 2. Continuous Integration (CI)

1. Run tests automatically on every pull request
2. Block merging if tests fail
3. Generate test coverage reports

### 3. Test Coverage

1. Aim for at least 80% test coverage
2. Focus on critical components and features
3. Use test coverage reports to identify untested code

## Conclusion

This testing strategy provides a comprehensive approach for ensuring the quality of the RPG Archivist application during the migration from Material UI to Mantine. By following this strategy, developers can ensure that all functionality is preserved while maintaining code quality and user experience.
