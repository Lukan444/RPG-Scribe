/**
 * Degraded Mode Indicator
 *
 * This component displays a visual indicator when the application is in degraded mode,
 * providing users with information about service disruptions.
 */

import React, { useState } from 'react';
import { Badge, Tooltip, Popover, Text, Group, Stack, Button, Alert, List } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconX } from '@tabler/icons-react';
import { DegradedModeLevel } from '../../services/vector/resilience/DegradedModeManager';

/**
 * Degraded mode indicator props
 */
interface DegradedModeIndicatorProps {
  /** Current degraded mode level */
  level: DegradedModeLevel;
  /** Time in current level (milliseconds) */
  timeInLevelMs: number;
  /** Affected features */
  affectedFeatures?: string[];
  /** Disabled features */
  disabledFeatures?: string[];
  /** Error message if any */
  error?: string;
  /** Whether to show a detailed popover */
  showPopover?: boolean;
  /** Whether to show a badge */
  showBadge?: boolean;
  /** Whether to show a tooltip */
  showTooltip?: boolean;
  /** Callback when user dismisses the indicator */
  onDismiss?: () => void;
}

/**
 * Get color for degraded mode level
 * @param level Degraded mode level
 * @returns Color for the level
 */
const getLevelColor = (level: DegradedModeLevel): string => {
  switch (level) {
    case DegradedModeLevel.NORMAL:
      return 'green';
    case DegradedModeLevel.MINOR:
      return 'blue';
    case DegradedModeLevel.MODERATE:
      return 'yellow';
    case DegradedModeLevel.SEVERE:
      return 'orange';
    case DegradedModeLevel.CRITICAL:
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get label for degraded mode level
 * @param level Degraded mode level
 * @returns Label for the level
 */
const getLevelLabel = (level: DegradedModeLevel): string => {
  switch (level) {
    case DegradedModeLevel.NORMAL:
      return 'Normal';
    case DegradedModeLevel.MINOR:
      return 'Minor Degradation';
    case DegradedModeLevel.MODERATE:
      return 'Moderate Degradation';
    case DegradedModeLevel.SEVERE:
      return 'Severe Degradation';
    case DegradedModeLevel.CRITICAL:
      return 'Critical Degradation';
    default:
      return 'Unknown';
  }
};

/**
 * Format time in level
 * @param timeMs Time in milliseconds
 * @returns Formatted time
 */
const formatTimeInLevel = (timeMs: number): string => {
  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Degraded Mode Indicator component
 */
const DegradedModeIndicator: React.FC<DegradedModeIndicatorProps> = ({
  level,
  timeInLevelMs,
  affectedFeatures = [],
  disabledFeatures = [],
  error,
  showPopover = true,
  showBadge = true,
  showTooltip = true,
  onDismiss
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);

  // Don't show anything in normal mode or if dismissed
  if (level === DegradedModeLevel.NORMAL || dismissed) {
    return null;
  }

  const color = getLevelColor(level);
  const label = getLevelLabel(level);
  const formattedTime = formatTimeInLevel(timeInLevelMs);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const tooltipContent = `${label} - ${formattedTime}`;

  const badge = (
    <Badge
      color={color}
      variant="filled"
      leftSection={<IconAlertTriangle size={14} />}
      style={{ cursor: showPopover ? 'pointer' : 'default' }}
      onClick={showPopover ? () => setPopoverOpened(true) : undefined}
    >
      {label}
    </Badge>
  );

  if (!showPopover && showBadge) {
    return showTooltip ? (
      <Tooltip label={tooltipContent}>
        {badge}
      </Tooltip>
    ) : badge;
  }

  return (
    <Popover
      opened={popoverOpened}
      onChange={setPopoverOpened}
      position="bottom"
      width={300}
      shadow="md"
    >
      <Popover.Target>
        {showTooltip ? (
          <Tooltip label={tooltipContent}>
            {badge}
          </Tooltip>
        ) : badge}
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600} color={color}>
              {label}
            </Text>
            <Button
              variant="subtle"
              size="compact"
              p={0}
              onClick={handleDismiss}
              title="Dismiss"
            >
              <IconX size={16} />
            </Button>
          </Group>

          <Text size="sm">
            Duration: {formattedTime}
          </Text>

          {error && (
            <Alert
              color={color}
              title="Error"
              icon={<IconAlertTriangle size={16} />}
              styles={{ root: { padding: '8px' } }}
            >
              <Text size="xs">{error}</Text>
            </Alert>
          )}

          {affectedFeatures.length > 0 && (
            <>
              <Text size="sm" fw={500}>
                Affected Features:
              </Text>
              <List size="xs" spacing="xs" withPadding>
                {affectedFeatures.map((feature, index) => (
                  <List.Item key={index}>{feature}</List.Item>
                ))}
              </List>
            </>
          )}

          {disabledFeatures.length > 0 && (
            <>
              <Text size="sm" fw={500} color="red">
                Disabled Features:
              </Text>
              <List size="xs" spacing="xs" withPadding>
                {disabledFeatures.map((feature, index) => (
                  <List.Item key={index}>{feature}</List.Item>
                ))}
              </List>
            </>
          )}

          <Group justify="center">
            <Button
              variant="light"
              color={color}
              size="xs"
              leftSection={<IconInfoCircle size={14} />}
              onClick={() => setPopoverOpened(false)}
            >
              Acknowledge
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default DegradedModeIndicator;