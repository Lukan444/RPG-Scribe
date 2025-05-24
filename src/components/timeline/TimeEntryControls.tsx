/**
 * Time Entry Controls Component
 *
 * Flexible time unit controls for timeline management,
 * supporting minutes, hours, days, months, years with validation.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Paper,
  Group,
  NumberInput,
  Select,
  TextInput,
  Button,
  ActionIcon,
  Tooltip,
  Text,
  Stack,
  Badge,
  Alert,
  Flex,
  Box,
  Switch,
  Divider,
} from '@mantine/core';
import {
  IconClock,
  IconCalendarTime,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconCalculator,
} from '@tabler/icons-react';
import { TimeUnit, DEFAULT_ACTIVITY_DURATIONS } from '../../constants/timelineConstants';
import { TimeGap } from '../../types/timeline';
import {
  timeGapToMinutes,
  minutesToTimeGap,
  validateTimeGap,
  formatTimeGap,
  getSuggestedDuration
} from '../../utils/timelineUtils';

/**
 * Time entry controls props
 */
interface TimeEntryControlsProps {
  value?: TimeGap;
  onChange: (timeGap: TimeGap) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showSuggestions?: boolean;
  showValidation?: boolean;
  allowNegative?: boolean;
  maxDuration?: number;
  minDuration?: number;
}

/**
 * Activity suggestion type
 */
type ActivityType = keyof typeof DEFAULT_ACTIVITY_DURATIONS;

/**
 * Time Entry Controls Component
 */
export function TimeEntryControls({
  value,
  onChange,
  label = 'Duration',
  placeholder = 'Enter duration',
  required = false,
  disabled = false,
  showSuggestions = true,
  showValidation = true,
  allowNegative = false,
  maxDuration,
  minDuration = 0
}: TimeEntryControlsProps) {
  // Local state
  const [duration, setDuration] = useState<number>(value?.duration || 1);
  const [unit, setUnit] = useState<TimeUnit>(value?.unit || TimeUnit.HOURS);
  const [description, setDescription] = useState<string>(value?.description || '');
  const [isAutoCalculated, setIsAutoCalculated] = useState<boolean>(value?.isAutoCalculated || false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Time unit options
  const timeUnitOptions = [
    { value: TimeUnit.MINUTES, label: 'Minutes' },
    { value: TimeUnit.HOURS, label: 'Hours' },
    { value: TimeUnit.DAYS, label: 'Days' },
    { value: TimeUnit.WEEKS, label: 'Weeks' },
    { value: TimeUnit.MONTHS, label: 'Months' },
    { value: TimeUnit.YEARS, label: 'Years' }
  ];

  // Activity suggestions
  const activitySuggestions: { label: string; value: ActivityType; duration: number; unit: TimeUnit }[] = [
    { label: 'Combat Round', value: 'COMBAT_ROUND', duration: 6, unit: TimeUnit.MINUTES },
    { label: 'Short Combat', value: 'SHORT_COMBAT', duration: 5, unit: TimeUnit.MINUTES },
    { label: 'Medium Combat', value: 'MEDIUM_COMBAT', duration: 15, unit: TimeUnit.MINUTES },
    { label: 'Long Combat', value: 'LONG_COMBAT', duration: 30, unit: TimeUnit.MINUTES },
    { label: 'Brief Conversation', value: 'BRIEF_CONVERSATION', duration: 5, unit: TimeUnit.MINUTES },
    { label: 'Normal Conversation', value: 'NORMAL_CONVERSATION', duration: 15, unit: TimeUnit.MINUTES },
    { label: 'Long Conversation', value: 'LONG_CONVERSATION', duration: 30, unit: TimeUnit.MINUTES },
    { label: 'Short Rest', value: 'SHORT_REST', duration: 1, unit: TimeUnit.HOURS },
    { label: 'Long Rest', value: 'LONG_REST', duration: 8, unit: TimeUnit.HOURS },
    { label: 'Extended Rest', value: 'EXTENDED_REST', duration: 24, unit: TimeUnit.HOURS },
    { label: 'Walking (per mile)', value: 'WALKING_PER_MILE', duration: 20, unit: TimeUnit.MINUTES },
    { label: 'Riding (per mile)', value: 'RIDING_PER_MILE', duration: 6, unit: TimeUnit.MINUTES },
    { label: 'Flying (per mile)', value: 'FLYING_PER_MILE', duration: 2, unit: TimeUnit.MINUTES }
  ];

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      setDuration(value.duration);
      setUnit(value.unit);
      setDescription(value.description || '');
      setIsAutoCalculated(value.isAutoCalculated || false);
    }
  }, [value]);

  // Validate and emit changes
  const emitChange = useCallback(() => {
    const timeGap: TimeGap = {
      duration,
      unit,
      description: description || undefined,
      isAutoCalculated
    };

    // Validate the time gap
    if (showValidation) {
      const isValid = validateTimeGap(timeGap);
      const totalMinutes = timeGapToMinutes(timeGap);

      if (!isValid) {
        setValidationError('Invalid time duration');
        return;
      }

      if (!allowNegative && duration < 0) {
        setValidationError('Duration cannot be negative');
        return;
      }

      if (minDuration && totalMinutes < minDuration) {
        setValidationError(`Duration must be at least ${minDuration} minutes`);
        return;
      }

      if (maxDuration && totalMinutes > maxDuration) {
        setValidationError(`Duration cannot exceed ${maxDuration} minutes`);
        return;
      }

      setValidationError(null);
    }

    onChange(timeGap);
  }, [duration, unit, description, isAutoCalculated, onChange, showValidation, allowNegative, minDuration, maxDuration]);

  // Handle duration change
  const handleDurationChange = useCallback((newDuration: number | string) => {
    const numDuration = typeof newDuration === 'string' ? parseFloat(newDuration) : newDuration;
    if (!isNaN(numDuration)) {
      setDuration(numDuration);
    }
  }, []);

  // Handle unit change
  const handleUnitChange = useCallback((newUnit: string | null) => {
    if (newUnit && Object.values(TimeUnit).includes(newUnit as TimeUnit)) {
      setUnit(newUnit as TimeUnit);
    }
  }, []);

  // Apply activity suggestion
  const applySuggestion = useCallback((suggestion: typeof activitySuggestions[0]) => {
    setDuration(suggestion.duration);
    setUnit(suggestion.unit);
    setDescription(suggestion.label);
    setIsAutoCalculated(true);
  }, []);

  // Quick adjustment buttons
  const adjustDuration = useCallback((multiplier: number) => {
    setDuration(prev => Math.max(0, prev * multiplier));
  }, []);

  // Convert to different unit
  const convertToUnit = useCallback((targetUnit: TimeUnit) => {
    const totalMinutes = timeGapToMinutes({ duration, unit });
    const converted = minutesToTimeGap(totalMinutes);

    // Try to convert to the target unit if reasonable
    if (targetUnit === TimeUnit.MINUTES && totalMinutes < 1440) {
      setDuration(totalMinutes);
      setUnit(TimeUnit.MINUTES);
    } else if (targetUnit === TimeUnit.HOURS && totalMinutes >= 60) {
      setDuration(totalMinutes / 60);
      setUnit(TimeUnit.HOURS);
    } else if (targetUnit === TimeUnit.DAYS && totalMinutes >= 1440) {
      setDuration(totalMinutes / 1440);
      setUnit(TimeUnit.DAYS);
    } else {
      setDuration(converted.duration);
      setUnit(converted.unit);
    }
  }, [duration, unit]);

  // Calculate total minutes for display
  const totalMinutes = timeGapToMinutes({ duration, unit });
  const formattedDuration = formatTimeGap({ duration, unit });

  // Emit changes when values change
  useEffect(() => {
    emitChange();
  }, [emitChange]);

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500}>{label}</Text>
          {required && <Badge color="red" size="sm">Required</Badge>}
        </Group>

        {/* Main Controls */}
        <Group>
          <NumberInput
            placeholder={placeholder}
            value={duration}
            onChange={handleDurationChange}
            min={allowNegative ? undefined : 0}
            step={0.1}
            decimalScale={1}
            disabled={disabled}
            style={{ flex: 1 }}
            leftSection={<IconClock size={16} />}
          />

          <Select
            data={timeUnitOptions}
            value={unit}
            onChange={handleUnitChange}
            disabled={disabled}
            w={120}
          />

          <Tooltip label="Auto-calculated">
            <Switch
              checked={isAutoCalculated}
              onChange={(event) => setIsAutoCalculated(event.currentTarget.checked)}
              disabled={disabled}
              size="sm"
            />
          </Tooltip>
        </Group>

        {/* Description */}
        <TextInput
          placeholder="Optional description"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          disabled={disabled}
          leftSection={<IconCalendarTime size={16} />}
        />

        {/* Quick Adjustments */}
        <Group>
          <Text size="sm" c="dimmed">Quick adjust:</Text>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() => adjustDuration(0.5)}
            disabled={disabled}
          >
            <IconMinus size={12} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() => adjustDuration(2)}
            disabled={disabled}
          >
            <IconPlus size={12} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() => convertToUnit(TimeUnit.MINUTES)}
            disabled={disabled}
          >
            <Text size="xs">min</Text>
          </ActionIcon>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() => convertToUnit(TimeUnit.HOURS)}
            disabled={disabled}
          >
            <Text size="xs">hr</Text>
          </ActionIcon>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() => convertToUnit(TimeUnit.DAYS)}
            disabled={disabled}
          >
            <Text size="xs">day</Text>
          </ActionIcon>
        </Group>

        {/* Duration Display */}
        <Group>
          <Badge color="blue" leftSection={<IconCalculator size={12} />}>
            {formattedDuration}
          </Badge>
          <Text size="sm" c="dimmed">
            ({totalMinutes.toLocaleString()} minutes total)
          </Text>
        </Group>

        {/* Validation */}
        {showValidation && validationError && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            {validationError}
          </Alert>
        )}

        {/* Activity Suggestions */}
        {showSuggestions && !disabled && (
          <>
            <Divider />
            <Box>
              <Text size="sm" fw={500} mb="xs">Common Activities:</Text>
              <Flex wrap="wrap" gap="xs">
                {activitySuggestions.slice(0, 8).map((suggestion) => (
                  <Button
                    key={suggestion.value}
                    variant="light"
                    size="xs"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </Flex>
            </Box>
          </>
        )}

        {/* Validation Status */}
        {showValidation && !validationError && (
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm" c="green">Valid duration</Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Simple Time Gap Input Component
 */
interface SimpleTimeGapInputProps {
  value?: TimeGap;
  onChange: (timeGap: TimeGap) => void;
  label?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function SimpleTimeGapInput({
  value,
  onChange,
  label,
  disabled = false,
  size = 'sm'
}: SimpleTimeGapInputProps) {
  const [duration, setDuration] = useState<number>(value?.duration || 1);
  const [unit, setUnit] = useState<TimeUnit>(value?.unit || TimeUnit.HOURS);

  const timeUnitOptions = [
    { value: TimeUnit.MINUTES, label: 'min' },
    { value: TimeUnit.HOURS, label: 'hr' },
    { value: TimeUnit.DAYS, label: 'day' },
    { value: TimeUnit.WEEKS, label: 'wk' },
    { value: TimeUnit.MONTHS, label: 'mo' },
    { value: TimeUnit.YEARS, label: 'yr' }
  ];

  useEffect(() => {
    if (value) {
      setDuration(value.duration);
      setUnit(value.unit);
    }
  }, [value]);

  useEffect(() => {
    onChange({ duration, unit });
  }, [duration, unit, onChange]);

  return (
    <Group>
      {label && <Text size={size}>{label}:</Text>}
      <NumberInput
        value={duration}
        onChange={(val) => setDuration(typeof val === 'number' ? val : parseFloat(val) || 0)}
        min={0}
        step={0.1}
        decimalScale={1}
        disabled={disabled}
        size={size}
        w={80}
      />
      <Select
        data={timeUnitOptions}
        value={unit}
        onChange={(val) => setUnit(val as TimeUnit)}
        disabled={disabled}
        size={size}
        w={60}
      />
    </Group>
  );
}
