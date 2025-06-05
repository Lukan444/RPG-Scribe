/**
 * TimelineFormSection Component
 * 
 * An integrated timeline section for entity forms with all timeline controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Text, 
  Group, 
  ActionIcon, 
  Collapse, 
  Divider,
  Stack,
  Alert,
  Button
} from '@mantine/core';
import { 
  IconChevronDown, 
  IconChevronUp, 
  IconClock, 
  IconInfoCircle,
  IconAlertTriangle
} from '@tabler/icons-react';
import { TimelineDatePicker } from './TimelineDatePicker';
import { TimelinePositionControl } from './TimelinePositionControl';
import { TimelineImportanceSlider } from './TimelineImportanceSlider';
import { TimelineNotesField } from './TimelineNotesField';

export interface TimelineFormValues {
  inGameTime?: Date | string | number | any; // Allow flexible date types for dayjs compatibility
  timelinePosition?: number;
  timelineImportance?: number;
  timelineNotes?: string;
}

export interface TimelineFormSectionProps {
  entityType: 'character' | 'event' | 'location' | 'item' | 'session' | 'faction';
  values: TimelineFormValues;
  onChange: (values: TimelineFormValues) => void;
  disabled?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  errors?: Partial<Record<keyof TimelineFormValues, string>>;
  conflictPositions?: number[];
  suggestedPosition?: number;
  onAutoPosition?: () => void;
  maxPosition?: number;
  showAdvanced?: boolean;
}

// Entity-specific configurations
const ENTITY_CONFIGS = {
  character: {
    dateLabel: 'First Appearance Date',
    datePlaceholder: 'When was this character first introduced?',
    dateDescription: 'The in-game date when this character first appeared in the story',
    importanceDefault: 5,
    notesPlaceholder: 'Character timeline notes (relationships, development, key moments)...'
  },
  event: {
    dateLabel: 'Event Date',
    datePlaceholder: 'When did this event occur?',
    dateDescription: 'The in-game date when this event took place',
    importanceDefault: 6,
    notesPlaceholder: 'Event timeline notes (consequences, participants, significance)...'
  },
  location: {
    dateLabel: 'Discovery Date',
    datePlaceholder: 'When was this location discovered?',
    dateDescription: 'The in-game date when this location was first visited or discovered',
    importanceDefault: 5,
    notesPlaceholder: 'Location timeline notes (visits, changes, significance)...'
  },
  item: {
    dateLabel: 'Acquisition Date',
    datePlaceholder: 'When was this item acquired?',
    dateDescription: 'The in-game date when this item was obtained or created',
    importanceDefault: 4,
    notesPlaceholder: 'Item timeline notes (origin, usage, significance)...'
  },
  session: {
    dateLabel: 'Session Date',
    datePlaceholder: 'When did this session take place?',
    dateDescription: 'The in-game date range covered by this session',
    importanceDefault: 7,
    notesPlaceholder: 'Session timeline notes (key events, character development, plot advancement)...'
  },
  faction: {
    dateLabel: 'Introduction Date',
    datePlaceholder: 'When was this faction first encountered?',
    dateDescription: 'The in-game date when this faction was first introduced to the story',
    importanceDefault: 6,
    notesPlaceholder: 'Faction timeline notes (interactions, influence, development)...'
  }
};

export const TimelineFormSection = React.memo<TimelineFormSectionProps>(({
  entityType,
  values,
  onChange,
  disabled = false,
  collapsed = false,
  onCollapsedChange,
  errors = {},
  conflictPositions = [],
  suggestedPosition,
  onAutoPosition,
  maxPosition,
  showAdvanced = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  const config = ENTITY_CONFIGS[entityType];

  // Update collapsed state
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  // Check for validation errors
  useEffect(() => {
    setHasValidationErrors(Object.keys(errors).length > 0);
  }, [errors]);

  // Handle collapse toggle with useCallback for performance
  const handleCollapseToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  // Handle field changes with useCallback for performance
  const handleFieldChange = useCallback((field: keyof TimelineFormValues, value: any) => {
    onChange({
      ...values,
      [field]: value
    });
  }, [values, onChange]);

  // Handle auto-fill with defaults with useCallback for performance
  const handleAutoFill = useCallback(() => {
    const now = new Date();
    const defaultValues: TimelineFormValues = {
      inGameTime: values.inGameTime || now,
      timelinePosition: values.timelinePosition ?? suggestedPosition ?? 0,
      timelineImportance: values.timelineImportance ?? config.importanceDefault,
      timelineNotes: values.timelineNotes || ''
    };
    onChange(defaultValues);
  }, [values, suggestedPosition, config.importanceDefault, onChange]);

  // Check if section has any values
  const hasValues = values.inGameTime || 
                   values.timelinePosition !== undefined || 
                   values.timelineImportance !== undefined || 
                   values.timelineNotes;

  return (
    <Paper withBorder p="md" radius="md">
      {/* Section Header */}
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="xs">
          <IconClock size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={500} size="sm">
            Timeline Information
          </Text>
          
          {hasValidationErrors && (
            <IconAlertTriangle 
              size={16} 
              style={{ color: 'var(--mantine-color-red-6)' }} 
            />
          )}
          
          {hasValues && !hasValidationErrors && (
            <Text size="xs" c="green" fw={500}>
              ✓ Configured
            </Text>
          )}
        </Group>

        <Group gap="xs">
          {!hasValues && (
            <Button
              size="xs"
              variant="light"
              onClick={handleAutoFill}
              disabled={disabled}
            >
              Auto-fill
            </Button>
          )}
          
          <ActionIcon
            variant="subtle"
            onClick={handleCollapseToggle}
            disabled={disabled}
          >
            {isCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* Validation Errors Summary */}
      {hasValidationErrors && !isCollapsed && (
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          color="red" 
          variant="light" 
          mb="md"
        >
          <Text size="sm">
            Please fix the timeline validation errors below.
          </Text>
        </Alert>
      )}

      {/* Timeline Form Fields */}
      <Collapse in={!isCollapsed}>
        <Stack gap="md">
          {/* In-Game Date */}
          <TimelineDatePicker
            label={config.dateLabel}
            value={values.inGameTime}
            onChange={(date) => handleFieldChange('inGameTime', date)}
            placeholder={config.datePlaceholder}
            description={config.dateDescription}
            disabled={disabled}
            error={errors.inGameTime}
            clearable
          />

          {showAdvanced && (
            <>
              <Divider label="Advanced Timeline Settings" labelPosition="center" />
              
              {/* Timeline Position */}
              <TimelinePositionControl
                value={values.timelinePosition}
                onChange={(position) => handleFieldChange('timelinePosition', position)}
                disabled={disabled}
                error={errors.timelinePosition}
                conflictPositions={conflictPositions}
                suggestedPosition={suggestedPosition}
                onAutoPosition={onAutoPosition}
                maxPosition={maxPosition}
              />

              {/* Timeline Importance */}
              <TimelineImportanceSlider
                value={values.timelineImportance}
                onChange={(importance) => handleFieldChange('timelineImportance', importance)}
                disabled={disabled}
                error={errors.timelineImportance}
                entityType={entityType}
                showPresets
              />

              {/* Timeline Notes */}
              <TimelineNotesField
                value={values.timelineNotes}
                onChange={(notes) => handleFieldChange('timelineNotes', notes)}
                placeholder={config.notesPlaceholder}
                disabled={disabled}
                error={errors.timelineNotes}
                autoSave={false}
                maxLength={1000}
              />
            </>
          )}
        </Stack>
      </Collapse>

      {/* Help Text */}
      {!isCollapsed && (
        <Box mt="md" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="xs">
            <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text size="xs" c="dimmed">
              Timeline information helps organize your campaign chronologically. 
              Only the {config.dateLabel.toLowerCase()} is required.
            </Text>
          </Group>
        </Box>
      )}
    </Paper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.entityType === nextProps.entityType &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.showAdvanced === nextProps.showAdvanced &&
    JSON.stringify(prevProps.values) === JSON.stringify(nextProps.values) &&
    JSON.stringify(prevProps.errors) === JSON.stringify(nextProps.errors) &&
    JSON.stringify(prevProps.conflictPositions) === JSON.stringify(nextProps.conflictPositions) &&
    prevProps.suggestedPosition === nextProps.suggestedPosition &&
    prevProps.maxPosition === nextProps.maxPosition
  );
});

TimelineFormSection.displayName = 'TimelineFormSection';

export default TimelineFormSection;
