/**
 * TimelinePositionControl Component
 * 
 * A control for managing timeline sequence positions with conflict detection
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  NumberInput,
  Group,
  ActionIcon,
  Tooltip,
  Alert,
  Badge,
  Button
} from '@mantine/core';
import {
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react';
import { useUncontrolled } from '@mantine/hooks';

export interface TimelinePositionControlProps {
  value?: number;
  defaultValue?: number;
  onChange?: (position: number) => void;
  maxPosition?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  error?: string;
  conflictPositions?: number[];
  suggestedPosition?: number;
  onAutoPosition?: () => void;
}

export const TimelinePositionControl = React.forwardRef<
  HTMLInputElement,
  TimelinePositionControlProps
>(({
  value,
  defaultValue = 0,
  onChange,
  maxPosition,
  disabled = false,
  label = 'Timeline Position',
  description = 'Position in the timeline sequence (0 = earliest)',
  error,
  conflictPositions = [],
  suggestedPosition,
  onAutoPosition
}, ref) => {
  // Use uncontrolled pattern for dual controlled/uncontrolled support
  const [_value, handleChange] = useUncontrolled({
    value,
    defaultValue,
    finalValue: 0,
    onChange,
  });

  const [hasConflict, setHasConflict] = useState(false);

  // Check for conflicts
  useEffect(() => {
    setHasConflict(conflictPositions.includes(_value));
  }, [_value, conflictPositions]);

  // Handle value change with validation
  const handleValueChange = (newValue: number | string) => {
    const numValue = typeof newValue === 'string' ? parseInt(newValue) || 0 : newValue;
    const clampedValue = Math.max(0, maxPosition ? Math.min(numValue, maxPosition) : numValue);

    handleChange(clampedValue);
  };

  // Handle increment/decrement
  const handleIncrement = () => {
    const newValue = _value + 1;
    if (!maxPosition || newValue <= maxPosition) {
      handleValueChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, _value - 1);
    handleValueChange(newValue);
  };

  // Handle auto-position
  const handleAutoPosition = () => {
    if (onAutoPosition) {
      onAutoPosition();
    } else if (suggestedPosition !== undefined) {
      handleValueChange(suggestedPosition);
    }
  };

  return (
    <Box>
      <Group gap="xs" mb={4}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        
        {description && (
          <Tooltip label={description} multiline maw={300}>
            <ActionIcon variant="subtle" size="xs" c="dimmed">
              <IconInfoCircle size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <Group gap="xs" align="flex-end">
        <NumberInput
          ref={ref}
          value={_value}
          onChange={handleValueChange}
          min={0}
          max={maxPosition}
          disabled={disabled}
          placeholder="Enter position"
          style={{ flex: 1 }}
          error={error || (hasConflict ? 'Position conflict detected' : undefined)}
          aria-label="Timeline position"
          aria-describedby={hasConflict ? 'position-conflict-error' : undefined}
          aria-invalid={hasConflict}
          styles={{
            input: {
              backgroundColor: hasConflict ? 'var(--mantine-color-red-0)' : undefined,
              borderColor: hasConflict ? 'var(--mantine-color-red-5)' : undefined
            }
          }}
        />

        <Group gap={4}>
          <Tooltip label="Move earlier in timeline">
            <ActionIcon
              variant="light"
              onClick={handleDecrement}
              disabled={disabled || _value <= 0}
              aria-label="Move earlier in timeline"
              onKeyDown={(e) => e.key === 'Enter' && handleDecrement()}
            >
              <IconArrowUp size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Move later in timeline">
            <ActionIcon
              variant="light"
              onClick={handleIncrement}
              disabled={disabled || (maxPosition !== undefined && _value >= maxPosition)}
              aria-label="Move later in timeline"
              onKeyDown={(e) => e.key === 'Enter' && handleIncrement()}
            >
              <IconArrowDown size={16} />
            </ActionIcon>
          </Tooltip>

          {(onAutoPosition || suggestedPosition !== undefined) && (
            <Tooltip label="Auto-assign position">
              <ActionIcon 
                variant="light" 
                color="blue"
                onClick={handleAutoPosition}
                disabled={disabled}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Position status indicators */}
      <Group gap="xs" mt="xs">
        {hasConflict && (
          <Badge color="red" variant="light" size="sm">
            <Group gap={4}>
              <IconAlertTriangle size={12} />
              Conflict
            </Group>
          </Badge>
        )}

        {suggestedPosition !== undefined && suggestedPosition !== _value && (
          <Badge color="blue" variant="light" size="sm">
            Suggested: {suggestedPosition}
          </Badge>
        )}

        {maxPosition !== undefined && (
          <Badge color="gray" variant="light" size="sm">
            Max: {maxPosition}
          </Badge>
        )}
      </Group>

      {/* Conflict warning */}
      {hasConflict && (
        <Alert
          id="position-conflict-error"
          icon={<IconAlertTriangle size={16} />}
          color="red"
          variant="light"
          mt="xs"
          role="alert"
          aria-live="polite"
        >
          <Text size="sm">
            This position is already used by another timeline entry.
            Consider using a different position or auto-assigning.
          </Text>
          {(onAutoPosition || suggestedPosition !== undefined) && (
            <Button
              size="xs"
              variant="light"
              color="blue"
              mt="xs"
              onClick={handleAutoPosition}
              aria-label="Use suggested position to resolve conflict"
            >
              Use suggested position
            </Button>
          )}
        </Alert>
      )}

      {/* Help text */}
      {!error && !hasConflict && description && (
        <Text size="xs" c="dimmed" mt={4}>
          {description}
        </Text>
      )}

      {error && !hasConflict && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </Box>
  );
});

TimelinePositionControl.displayName = 'TimelinePositionControl';

export default TimelinePositionControl;
