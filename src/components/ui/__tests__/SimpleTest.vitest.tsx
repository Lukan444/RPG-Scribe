/**
 * Simple Test Component using Vitest
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Simple Test', () => {
  it('renders a div with text', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders multiple elements', () => {
    render(
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Click Me</button>
      </div>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('renders elements with data-testid', () => {
    render(
      <div>
        <span data-testid="test-span">Test Span</span>
        <div data-testid="test-div">Test Div</div>
      </div>
    );

    expect(screen.getByTestId('test-span')).toHaveTextContent('Test Span');
    expect(screen.getByTestId('test-div')).toHaveTextContent('Test Div');
  });
});
