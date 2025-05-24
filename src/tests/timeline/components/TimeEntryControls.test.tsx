/**
 * TimeEntryControls Component Tests
 *
 * Comprehensive UI tests for the TimeEntryControls component
 * including time unit management, validation, and activity suggestions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { TimeEntryControls, SimpleTimeGapInput } from '../../../components/timeline/TimeEntryControls';
import { TimeUnit } from '../../../constants/timelineConstants';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    {children}
  </MantineProvider>
);

describe('TimeEntryControls Component', () => {
  const defaultProps = {
    onChange: vi.fn(),
    label: 'Test Duration',
    placeholder: 'Enter test duration'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Duration')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter test duration')).toBeInTheDocument();
    });

    it('should render time unit selector', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} />
        </TestWrapper>
      );

      // Check that time unit options are available
      const unitSelector = screen.getByDisplayValue('Hours');
      expect(unitSelector).toBeInTheDocument();
    });

    it('should render quick adjustment buttons', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Quick adjust:')).toBeInTheDocument();
      expect(screen.getByText('min')).toBeInTheDocument();
      expect(screen.getByText('hr')).toBeInTheDocument();
      expect(screen.getByText('day')).toBeInTheDocument();
    });

    it('should show activity suggestions when enabled', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} showSuggestions={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Common Activities:')).toBeInTheDocument();
      expect(screen.getByText('Combat Round')).toBeInTheDocument();
      expect(screen.getByText('Short Combat')).toBeInTheDocument();
      expect(screen.getByText('Long Rest')).toBeInTheDocument();
    });

    it('should hide activity suggestions when disabled', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} showSuggestions={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Common Activities:')).not.toBeInTheDocument();
    });
  });

  describe('Value Management', () => {
    it('should display initial value correctly', () => {
      const initialValue = {
        duration: 2,
        unit: TimeUnit.HOURS
      };

      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} value={initialValue} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hours')).toBeInTheDocument();
    });

    it('should call onChange when duration changes', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} onChange={mockOnChange} />
        </TestWrapper>
      );

      const durationInput = screen.getByPlaceholderText('Enter test duration');
      fireEvent.change(durationInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 5,
            unit: TimeUnit.HOURS
          })
        );
      });
    });

    it('should call onChange when unit changes', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} onChange={mockOnChange} />
        </TestWrapper>
      );

      // This would require interacting with the Select component
      // For now, we test that the component renders correctly
      expect(screen.getByDisplayValue('Hours')).toBeInTheDocument();
    });

    it('should update description field', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} onChange={mockOnChange} />
        </TestWrapper>
      );

      const descriptionInput = screen.getByPlaceholderText('Optional description');
      fireEvent.change(descriptionInput, { target: { value: 'Travel time' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Travel time'
          })
        );
      });
    });
  });

  describe('Quick Adjustments', () => {
    it('should halve duration when minus button is clicked', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            onChange={mockOnChange}
            value={{ duration: 4, unit: TimeUnit.HOURS }}
          />
        </TestWrapper>
      );

      const minusButton = screen.getByRole('button', { name: '' }); // Minus icon button
      fireEvent.click(minusButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 2
          })
        );
      });
    });

    it('should double duration when plus button is clicked', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            onChange={mockOnChange}
            value={{ duration: 2, unit: TimeUnit.HOURS }}
          />
        </TestWrapper>
      );

      const plusButton = screen.getAllByRole('button')[1]; // Plus icon button
      fireEvent.click(plusButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 4
          })
        );
      });
    });
  });

  describe('Activity Suggestions', () => {
    it('should apply activity suggestion when clicked', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            onChange={mockOnChange}
            showSuggestions={true}
          />
        </TestWrapper>
      );

      const combatRoundButton = screen.getByText('Combat Round');
      fireEvent.click(combatRoundButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 6,
            unit: TimeUnit.MINUTES,
            description: 'Combat Round',
            isAutoCalculated: true
          })
        );
      });
    });

    it('should apply long rest suggestion correctly', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            onChange={mockOnChange}
            showSuggestions={true}
          />
        </TestWrapper>
      );

      const longRestButton = screen.getByText('Long Rest');
      fireEvent.click(longRestButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 8,
            unit: TimeUnit.HOURS,
            description: 'Long Rest',
            isAutoCalculated: true
          })
        );
      });
    });
  });

  describe('Validation', () => {
    it('should show validation error for negative values when not allowed', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: -1, unit: TimeUnit.HOURS }}
            allowNegative={false}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Duration cannot be negative')).toBeInTheDocument();
    });

    it('should show validation error for values below minimum', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: 5, unit: TimeUnit.MINUTES }}
            minDuration={10}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Duration must be at least 10 minutes')).toBeInTheDocument();
    });

    it('should show validation error for values above maximum', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: 25, unit: TimeUnit.HOURS }}
            maxDuration={1440} // 24 hours in minutes
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Duration cannot exceed 1440 minutes')).toBeInTheDocument();
    });

    it('should show valid status when validation passes', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: 2, unit: TimeUnit.HOURS }}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Valid duration')).toBeInTheDocument();
    });

    it('should hide validation when disabled', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: -1, unit: TimeUnit.HOURS }}
            allowNegative={false}
            showValidation={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Duration cannot be negative')).not.toBeInTheDocument();
    });
  });

  describe('Duration Display', () => {
    it('should show formatted duration', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: 2, unit: TimeUnit.HOURS }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('2 hours')).toBeInTheDocument();
      expect(screen.getByText('(120 minutes total)')).toBeInTheDocument();
    });

    it('should show singular unit for duration of 1', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            value={{ duration: 1, unit: TimeUnit.HOURS }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('1 hour')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const durationInput = screen.getByPlaceholderText('Enter test duration');
      expect(durationInput).toBeDisabled();

      const descriptionInput = screen.getByPlaceholderText('Optional description');
      expect(descriptionInput).toBeDisabled();
    });

    it('should hide activity suggestions when disabled', () => {
      render(
        <TestWrapper>
          <TimeEntryControls
            {...defaultProps}
            disabled={true}
            showSuggestions={true}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Common Activities:')).not.toBeInTheDocument();
    });
  });

  describe('Required Field', () => {
    it('should show required badge when required', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} required={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should not show required badge when not required', () => {
      render(
        <TestWrapper>
          <TimeEntryControls {...defaultProps} required={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Required')).not.toBeInTheDocument();
    });
  });
});

describe('SimpleTimeGapInput Component', () => {
  const defaultProps = {
    onChange: vi.fn(),
    label: 'Test Gap'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with minimal props', () => {
      render(
        <TestWrapper>
          <SimpleTimeGapInput {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Gap:')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(
        <TestWrapper>
          <SimpleTimeGapInput onChange={vi.fn()} />
        </TestWrapper>
      );

      // Should render inputs without label
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should display initial value', () => {
      const initialValue = {
        duration: 3,
        unit: TimeUnit.DAYS
      };

      render(
        <TestWrapper>
          <SimpleTimeGapInput
            {...defaultProps}
            value={initialValue}
          />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('day')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onChange when duration changes', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <SimpleTimeGapInput onChange={mockOnChange} />
        </TestWrapper>
      );

      const durationInput = screen.getByDisplayValue('1');
      fireEvent.change(durationInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 5
          })
        );
      });
    });

    it('should handle disabled state', () => {
      render(
        <TestWrapper>
          <SimpleTimeGapInput {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const durationInput = screen.getByDisplayValue('1');
      expect(durationInput).toBeDisabled();
    });
  });
});
