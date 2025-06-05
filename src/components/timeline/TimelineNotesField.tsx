/**
 * TimelineNotesField Component
 * 
 * A specialized text area for timeline-specific notes with auto-save and rich text support
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  Textarea,
  Group,
  ActionIcon,
  Tooltip,
  Badge,
  Button
} from '@mantine/core';
import {
  IconInfoCircle,
  IconDeviceFloppy,
  IconCheck,
  IconClock,
  IconRefresh
} from '@tabler/icons-react';
import { useDebouncedCallback, useUncontrolled } from '@mantine/hooks';

export interface TimelineNotesFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (notes: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  error?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onAutoSave?: (notes: string) => Promise<void>;
  minRows?: number;
  maxRows?: number;
}

export const TimelineNotesField = React.forwardRef<
  HTMLTextAreaElement,
  TimelineNotesFieldProps
>(({
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Add timeline-specific notes...',
  maxLength = 1000,
  disabled = false,
  label = 'Timeline Notes',
  description = 'Additional context or details for this timeline entry',
  error,
  autoSave = false,
  autoSaveDelay = 2000,
  onAutoSave,
  minRows = 3,
  maxRows = 8
}, ref) => {
  // Use uncontrolled pattern for dual controlled/uncontrolled support
  const [_value, handleChange] = useUncontrolled({
    value,
    defaultValue,
    finalValue: '',
    onChange,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save functionality
  const performAutoSave = useCallback(async (notes: string) => {
    if (!onAutoSave || !autoSave) return;
    
    try {
      setIsSaving(true);
      await onAutoSave(notes);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onAutoSave, autoSave]);

  // Debounced auto-save
  const debouncedAutoSave = useDebouncedCallback(performAutoSave, autoSaveDelay);

  // Handle value change
  const handleValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;

    // Enforce max length
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    handleChange(newValue);
    setHasUnsavedChanges(true);

    // Trigger auto-save if enabled
    if (autoSave && onAutoSave) {
      debouncedAutoSave(newValue);
    }
  };

  // Manual save
  const handleManualSave = async () => {
    if (onAutoSave) {
      await performAutoSave(_value);
    }
  };

  // Clear notes
  const handleClear = () => {
    handleChange('');
    setHasUnsavedChanges(true);
  };

  // Character count info
  const characterCount = _value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isAtLimit = maxLength && characterCount >= maxLength;

  // Format last saved time
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  return (
    <Box>
      <Group gap="xs" mb={4} justify="space-between">
        <Group gap="xs">
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

        <Group gap="xs">
          {/* Auto-save status */}
          {autoSave && (
            <Group gap={4}>
              {isSaving && (
                <Badge color="blue" variant="light" size="xs">
                  <Group gap={4}>
                    <IconDeviceFloppy size={10} />
                    Saving...
                  </Group>
                </Badge>
              )}
              
              {lastSaved && !isSaving && !hasUnsavedChanges && (
                <Badge color="green" variant="light" size="xs">
                  <Group gap={4}>
                    <IconCheck size={10} />
                    Saved {formatLastSaved(lastSaved)}
                  </Group>
                </Badge>
              )}
              
              {hasUnsavedChanges && !isSaving && (
                <Badge color="orange" variant="light" size="xs">
                  <Group gap={4}>
                    <IconClock size={10} />
                    Unsaved
                  </Group>
                </Badge>
              )}
            </Group>
          )}

          {/* Manual save button */}
          {onAutoSave && hasUnsavedChanges && (
            <Tooltip label="Save notes">
              <ActionIcon 
                variant="light" 
                color="blue"
                size="sm"
                onClick={handleManualSave}
                loading={isSaving}
                disabled={disabled}
              >
                <IconDeviceFloppy size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Clear button */}
          {_value.length > 0 && (
            <Tooltip label="Clear notes">
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Textarea
        ref={ref}
        value={_value}
        onChange={handleValueChange}
        placeholder={placeholder}
        disabled={disabled}
        minRows={minRows}
        maxRows={maxRows}
        autosize
        error={error}
        aria-label={label}
        aria-describedby={error ? 'notes-field-error' : undefined}
        aria-invalid={!!error}
        styles={{
          input: {
            backgroundColor: disabled ? 'var(--mantine-color-gray-1)' : undefined,
            borderColor: isAtLimit ? 'var(--mantine-color-red-5)' :
                        isNearLimit ? 'var(--mantine-color-orange-5)' : undefined
          }
        }}
      />

      {/* Footer info */}
      <Group justify="space-between" mt={4}>
        <Group gap="xs">
          {!error && description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </Group>

        {maxLength && (
          <Text 
            size="xs" 
            c={isAtLimit ? 'red' : isNearLimit ? 'orange' : 'dimmed'}
          >
            {characterCount}/{maxLength}
          </Text>
        )}
      </Group>

      {error && (
        <Text id="notes-field-error" size="xs" c="red" mt={4} role="alert">
          {error}
        </Text>
      )}

      {/* Quick templates */}
      {_value.length === 0 && !disabled && (
        <Group gap="xs" mt="xs">
          <Text size="xs" c="dimmed">Quick templates:</Text>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => {
              const template = "Key events:\n- \n\nImportant NPCs:\n- \n\nNotes:\n- ";
              handleChange(template);
            }}
          >
            Event Summary
          </Button>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => {
              const template = "Character details:\n- \n\nRelationships:\n- \n\nDevelopment:\n- ";
              handleChange(template);
            }}
          >
            Character Notes
          </Button>
        </Group>
      )}
    </Box>
  );
});

TimelineNotesField.displayName = 'TimelineNotesField';

export default TimelineNotesField;
