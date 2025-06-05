/**
 * TimelineImportanceSlider Component
 * 
 * A slider control for setting timeline importance with visual indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Slider,
  Group,
  ActionIcon,
  Tooltip,
  Badge,
  Stack,
  Button
} from '@mantine/core';
import {
  IconInfoCircle,
  IconStar,
  IconStarFilled,
  IconRefresh
} from '@tabler/icons-react';
import { useUncontrolled } from '@mantine/hooks';

export interface TimelineImportanceSliderProps {
  value?: number;
  defaultValue?: number;
  onChange?: (importance: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  error?: string;
  showPresets?: boolean;
  entityType?: string;
}

// Importance level presets
const IMPORTANCE_PRESETS = {
  1: { label: 'Trivial', color: 'gray', description: 'Minor background detail' },
  3: { label: 'Minor', color: 'blue', description: 'Small event or character' },
  5: { label: 'Moderate', color: 'green', description: 'Regular importance' },
  7: { label: 'Important', color: 'orange', description: 'Significant event or character' },
  9: { label: 'Major', color: 'red', description: 'Critical story element' },
  10: { label: 'Epic', color: 'violet', description: 'Campaign-defining moment' }
};

// Entity-specific default importance
const ENTITY_DEFAULTS = {
  character: 5,
  event: 6,
  location: 5,
  item: 4,
  session: 7,
  faction: 6
};

export const TimelineImportanceSlider = React.forwardRef<
  HTMLInputElement,
  TimelineImportanceSliderProps
>(({
  value,
  defaultValue = 5,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  disabled = false,
  label = 'Timeline Importance',
  description = 'How significant this is to the overall story (1 = trivial, 10 = epic)',
  error,
  showPresets = true,
  entityType
}, ref) => {
  // Use uncontrolled pattern for dual controlled/uncontrolled support
  const [_value, handleChange] = useUncontrolled({
    value,
    defaultValue,
    finalValue: 5,
    onChange,
  });

  // Handle preset selection
  const handlePresetSelect = (presetValue: number) => {
    handleChange(presetValue);
  };

  // Handle reset to entity default
  const handleReset = () => {
    const defaultValue = entityType ? ENTITY_DEFAULTS[entityType as keyof typeof ENTITY_DEFAULTS] || 5 : 5;
    handleChange(defaultValue);
  };

  // Get current importance level info
  const getCurrentLevel = () => {
    const preset = Object.entries(IMPORTANCE_PRESETS).find(([key]) =>
      parseInt(key) === _value
    );

    if (preset) {
      return preset[1];
    }

    // Find closest preset for non-exact values
    const closestKey = Object.keys(IMPORTANCE_PRESETS)
      .map(k => parseInt(k))
      .reduce((prev, curr) =>
        Math.abs(curr - _value) < Math.abs(prev - _value) ? curr : prev
      );

    return IMPORTANCE_PRESETS[closestKey as keyof typeof IMPORTANCE_PRESETS];
  };

  const currentLevel = getCurrentLevel();

  // Generate star display
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(_value / 2);
    const hasHalfStar = _value % 2 === 1;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <IconStarFilled 
            key={i} 
            size={16} 
            style={{ color: 'var(--mantine-color-yellow-5)' }} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <IconStar 
            key={i} 
            size={16} 
            style={{ color: 'var(--mantine-color-yellow-5)' }} 
          />
        );
      } else {
        stars.push(
          <IconStar 
            key={i} 
            size={16} 
            style={{ color: 'var(--mantine-color-gray-4)' }} 
          />
        );
      }
    }
    
    return stars;
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

        {entityType && (
          <Tooltip label={`Reset to default for ${entityType}`}>
            <ActionIcon 
              variant="subtle" 
              size="xs" 
              onClick={handleReset}
              disabled={disabled}
            >
              <IconRefresh size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <Stack gap="sm">
        {/* Current value display */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge
              color={currentLevel.color}
              variant="light"
              size="sm"
            >
              {_value}/10
            </Badge>
            <Text size="sm" fw={500} c={currentLevel.color}>
              {currentLevel.label}
            </Text>
          </Group>
          
          <Group gap={2}>
            {renderStars()}
          </Group>
        </Group>

        {/* Slider */}
        <Slider
          value={_value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={label}
          aria-describedby={error ? 'importance-slider-error' : undefined}
          aria-invalid={!!error}
          marks={Object.entries(IMPORTANCE_PRESETS).map(([value, preset]) => ({
            value: parseInt(value),
            label: preset.label
          }))}
          styles={{
            track: {
              backgroundColor: 'var(--mantine-color-gray-3)'
            },
            bar: {
              backgroundColor: `var(--mantine-color-${currentLevel.color}-5)`
            },
            thumb: {
              backgroundColor: `var(--mantine-color-${currentLevel.color}-5)`,
              borderColor: `var(--mantine-color-${currentLevel.color}-6)`
            }
          }}
        />

        {/* Preset buttons */}
        {showPresets && (
          <Group gap="xs" justify="center">
            {Object.entries(IMPORTANCE_PRESETS).map(([value, preset]) => (
              <Tooltip key={value} label={preset.description}>
                <Button
                  size="xs"
                  variant={parseInt(value) === _value ? 'filled' : 'light'}
                  color={preset.color}
                  onClick={() => handlePresetSelect(parseInt(value))}
                  disabled={disabled}
                >
                  {preset.label}
                </Button>
              </Tooltip>
            ))}
          </Group>
        )}

        {/* Current level description */}
        <Text size="xs" c="dimmed" ta="center">
          {currentLevel.description}
        </Text>
      </Stack>

      {error && (
        <Text id="importance-slider-error" size="xs" c="red" mt={4} role="alert">
          {error}
        </Text>
      )}
    </Box>
  );
});

TimelineImportanceSlider.displayName = 'TimelineImportanceSlider';

export default TimelineImportanceSlider;
