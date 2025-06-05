/**
 * TimelineDatePicker Component
 * 
 * A specialized date picker for timeline in-game dates with fantasy calendar support
 */

import React from 'react';
import { DatePickerInput } from '@mantine/dates';
import { Box, Text, Tooltip, ActionIcon, Group } from '@mantine/core';
import { IconCalendar, IconClock, IconInfoCircle } from '@tabler/icons-react';
import { useUncontrolled } from '@mantine/hooks';
import dayjs from 'dayjs';

export interface TimelineDatePickerProps {
  label: string;
  value?: Date | string | number | any; // Allow flexible date types
  defaultValue?: Date | string | number | any;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  error?: string;
  withTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
}

export const TimelineDatePicker = React.forwardRef<
  HTMLButtonElement,
  TimelineDatePickerProps
>(({
  label,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select in-game date',
  required = false,
  disabled = false,
  description,
  error,
  withTime = false,
  minDate,
  maxDate,
  clearable = true
}, ref) => {
  // Convert input value to proper Date object
  const convertToDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
      if (dateValue instanceof Date) {
        return dateValue;
      } else if (dayjs.isDayjs(dateValue)) {
        return dateValue.toDate();
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } else {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }
    } catch (error) {
      console.warn('Error converting date value:', error, 'Value:', dateValue);
      return null;
    }
  };

  // Use uncontrolled pattern for dual controlled/uncontrolled support
  const [_value, setValue] = useUncontrolled({
    value: convertToDate(value),
    defaultValue: convertToDate(defaultValue),
    finalValue: null,
    onChange,
  });
  // Format date for display with fantasy calendar context
  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    // Ensure we have a proper Date object
    let validDate: Date;

    try {
      // Handle different date types that might be passed
      if (date instanceof Date) {
        validDate = date;
      } else if (dayjs.isDayjs(date)) {
        // Handle dayjs objects
        validDate = (date as any).toDate();
      } else if (typeof date === 'string' || typeof date === 'number') {
        // Handle string or number timestamps
        validDate = new Date(date);
      } else {
        // Fallback: try to create a Date object
        validDate = new Date(date as any);
      }

      // Validate the date
      if (isNaN(validDate.getTime())) {
        console.warn('Invalid date passed to formatDate:', date);
        return 'Invalid Date';
      }

      // For now, use standard date formatting
      // TODO: Add fantasy calendar formatting support
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return validDate.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'Invalid Date';
    }
  };

  // Handle date change with validation - DatePickerInput expects (date: Date | null) => void
  const handleDateChangeWithValidation = (date: Date | null) => {
    // Validate date range if specified
    if (date) {
      if (minDate && date < minDate) {
        return; // Don't allow dates before minimum
      }
      if (maxDate && date > maxDate) {
        return; // Don't allow dates after maximum
      }
    }

    setValue(date);
  };

  return (
    <Box>
      <Group gap="xs" mb={4}>
        <Text size="sm" fw={500}>
          {label}
          {required && <Text component="span" c="red" ml={4}>*</Text>}
        </Text>
        
        {description && (
          <Tooltip label={description} multiline maw={300}>
            <ActionIcon variant="subtle" size="xs" c="dimmed">
              <IconInfoCircle size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <DatePickerInput
        ref={ref}
        value={_value}
        onChange={handleDateChangeWithValidation as any}
        placeholder={placeholder}
        disabled={disabled}
        clearable={clearable}
        leftSection={<IconCalendar size={16} />}
        rightSection={withTime ? <IconClock size={16} /> : undefined}
        minDate={minDate}
        maxDate={maxDate}
        error={error}
        aria-label={label}
        aria-describedby={error ? 'date-picker-error' : undefined}
        aria-invalid={!!error}
        styles={{
          input: {
            backgroundColor: disabled ? 'var(--mantine-color-gray-1)' : undefined
          }
        }}
        popoverProps={{
          position: 'bottom-start',
          shadow: 'md'
        }}
      />

      {description && !error && (
        <Text size="xs" c="dimmed" mt={4}>
          {description}
        </Text>
      )}

      {error && (
        <Text id="date-picker-error" size="xs" c="red" mt={4} role="alert">
          {error}
        </Text>
      )}

      {_value && (
        <Text size="xs" c="blue" mt={4}>
          In-game date: {formatDate(_value)}
        </Text>
      )}
    </Box>
  );
});

TimelineDatePicker.displayName = 'TimelineDatePicker';

export default TimelineDatePicker;
