/**
 * Timeline Quick Access Component
 * Provides quick timeline access buttons and widgets for forms and detail views
 */

import React from 'react';
import { Group, Button, ActionIcon, Tooltip, Menu, Badge } from '@mantine/core';
import { IconTimeline, IconClock, IconCalendar, IconChevronDown, IconPlus, IconEye } from '@tabler/icons-react';
import { timelineNavigation } from '../../services/timelineNavigation.service';

export interface TimelineQuickAccessProps {
  /** Entity context for timeline navigation */
  entityId?: string;
  /** Entity type */
  entityType?: 'character' | 'campaign' | 'session' | 'event' | 'location' | 'npc';
  /** World ID for timeline context */
  worldId?: string;
  /** Campaign ID for timeline context */
  campaignId?: string;
  /** Display variant */
  variant?: 'button' | 'icon' | 'menu' | 'badge';
  /** Size of the component */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Color theme */
  color?: string;
  /** Show label text */
  showLabel?: boolean;
  /** Enable editing mode */
  enableEditing?: boolean;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Timeline Quick Access Component
 * Provides various ways to quickly access timeline functionality
 */
export function TimelineQuickAccess({
  entityId,
  entityType,
  worldId,
  campaignId,
  variant = 'button',
  size = 'sm',
  color = 'blue',
  showLabel = true,
  enableEditing = false,
  compact = false
}: TimelineQuickAccessProps) {

  const handleViewTimeline = (displayMode?: 'dual' | 'real-world' | 'in-game') => {
    if (entityId && entityType) {
      timelineNavigation.navigateFromEntity(
        entityType,
        entityId,
        { worldId, campaignId },
        { displayMode, enableEditing }
      );
    } else {
      timelineNavigation.navigateToTimeline(
        { worldId, campaignId },
        { displayMode, enableEditing }
      );
    }
  };

  const handleCreateEvent = () => {
    timelineNavigation.navigateToTimeline(
      { worldId, campaignId, entityId, entityType },
      { enableEditing: true, displayMode: 'dual' }
    );
  };

  // Button variant
  if (variant === 'button') {
    return (
      <Group gap="xs">
        <Button
          size={size}
          variant="light"
          color={color}
          leftSection={<IconTimeline size={compact ? 14 : 16} />}
          onClick={() => handleViewTimeline('dual')}
        >
          {showLabel ? (compact ? 'Timeline' : 'View Timeline') : ''}
        </Button>

        {enableEditing && (
          <Button
            size={size}
            variant="outline"
            color={color}
            leftSection={<IconPlus size={compact ? 14 : 16} />}
            onClick={handleCreateEvent}
          >
            {showLabel ? (compact ? 'Add' : 'Add Event') : ''}
          </Button>
        )}
      </Group>
    );
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <Group gap="xs">
        <Tooltip label="View Timeline">
          <ActionIcon
            size={size}
            variant="light"
            color={color}
            onClick={() => handleViewTimeline('dual')}
          >
            <IconTimeline size={compact ? 14 : 16} />
          </ActionIcon>
        </Tooltip>

        {enableEditing && (
          <Tooltip label="Add Timeline Event">
            <ActionIcon
              size={size}
              variant="outline"
              color={color}
              onClick={handleCreateEvent}
            >
              <IconPlus size={compact ? 14 : 16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    );
  }

  // Menu variant
  if (variant === 'menu') {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button
            size={size}
            variant="light"
            color={color}
            rightSection={<IconChevronDown size={14} />}
            leftSection={<IconTimeline size={compact ? 14 : 16} />}
          >
            {showLabel ? 'Timeline' : ''}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>View Timeline</Menu.Label>
          
          <Menu.Item
            leftSection={<IconTimeline size={14} />}
            onClick={() => handleViewTimeline('dual')}
          >
            Dual Timeline
          </Menu.Item>
          
          <Menu.Item
            leftSection={<IconCalendar size={14} />}
            onClick={() => handleViewTimeline('real-world')}
          >
            Real World Only
          </Menu.Item>
          
          <Menu.Item
            leftSection={<IconClock size={14} />}
            onClick={() => handleViewTimeline('in-game')}
          >
            In-Game Only
          </Menu.Item>

          {enableEditing && (
            <>
              <Menu.Divider />
              <Menu.Label>Timeline Actions</Menu.Label>
              
              <Menu.Item
                leftSection={<IconPlus size={14} />}
                onClick={handleCreateEvent}
              >
                Add Timeline Event
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <Group gap="xs">
        <Badge
          size={size}
          color={color}
          variant="light"
          leftSection={<IconTimeline size={12} />}
          style={{ cursor: 'pointer' }}
          onClick={() => handleViewTimeline('dual')}
        >
          {showLabel ? 'Timeline' : ''}
        </Badge>

        {enableEditing && (
          <Badge
            size={size}
            color={color}
            variant="outline"
            leftSection={<IconPlus size={12} />}
            style={{ cursor: 'pointer' }}
            onClick={handleCreateEvent}
          >
            {showLabel ? 'Add Event' : ''}
          </Badge>
        )}
      </Group>
    );
  }

  return null;
}

/**
 * Timeline Status Badge
 * Shows timeline-related status information
 */
export interface TimelineStatusBadgeProps {
  /** Number of timeline events */
  eventCount?: number;
  /** Number of conflicts */
  conflictCount?: number;
  /** Timeline health percentage */
  healthPercentage?: number;
  /** Size of the badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show detailed information */
  showDetails?: boolean;
}

export function TimelineStatusBadge({
  eventCount = 0,
  conflictCount = 0,
  healthPercentage,
  size = 'sm',
  showDetails = false
}: TimelineStatusBadgeProps) {
  const getHealthColor = () => {
    if (!healthPercentage) return 'gray';
    if (healthPercentage >= 80) return 'green';
    if (healthPercentage >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Group gap="xs">
      <Badge
        size={size}
        color="blue"
        variant="light"
        leftSection={<IconTimeline size={12} />}
      >
        {eventCount} Events
      </Badge>

      {conflictCount > 0 && (
        <Badge
          size={size}
          color="orange"
          variant="light"
        >
          {conflictCount} Conflicts
        </Badge>
      )}

      {showDetails && healthPercentage !== undefined && (
        <Badge
          size={size}
          color={getHealthColor()}
          variant="light"
        >
          {healthPercentage}% Health
        </Badge>
      )}
    </Group>
  );
}

export default TimelineQuickAccess;
