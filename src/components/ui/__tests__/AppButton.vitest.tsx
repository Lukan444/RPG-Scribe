import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppButton } from '../AppButton';
import { IconPlus, IconArrowRight } from '@tabler/icons-react';
import { renderWithMantine } from '../../../tests/vitest-utils/test-utils';

describe('AppButton', () => {
  it('renders button with text', () => {
    renderWithMantine(<AppButton>Test Button</AppButton>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('renders button with left section icon', () => {
    renderWithMantine(
      <AppButton leftSection={<IconPlus data-testid="left-icon" />}>
        Add Item
      </AppButton>
    );
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders button with right section icon', () => {
    renderWithMantine(
      <AppButton rightSection={<IconArrowRight data-testid="right-icon" />}>
        Next Step
      </AppButton>
    );
    expect(screen.getByText('Next Step')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies custom variant and color', () => {
    renderWithMantine(
      <AppButton
        variant="outline"
        color="teal"
        data-testid="custom-button"
      >
        Custom Button
      </AppButton>
    );
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveClass('mantine-Button-root');
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });

  it('passes additional props to the Button component', () => {
    renderWithMantine(
      <AppButton
        disabled
        data-testid="disabled-button"
      >
        Disabled Button
      </AppButton>
    );
    const button = screen.getByTestId('disabled-button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Disabled Button')).toBeInTheDocument();
  });
});
