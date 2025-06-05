/**
 * Entity Timeline Section - Timeline integration for entity detail pages
 * Provides timeline context and quick access for Characters, Campaigns, Sessions, etc.
 */

import React, { useState, useMemo } from 'react';
import { Paper, Title, Text, Group, Button, Stack, ActionIcon, Tooltip, Badge, Collapse } from '@mantine/core';
import { IconTimeline, IconChevronDown, IconChevronUp, IconMaximize, IconPlus } from '@tabler/icons-react';
import { DualTimelineWidget } from './DualTimelineWidget';
import { timelineNavigation } from '../../services/timelineNavigation.service';

export interface EntityTimelineSectionProps {
  /** Entity ID */
  entityId: string;
  /** Entity type */
  entityType: 'character' | 'campaign' | 'session' | 'event' | 'location' | 'npc';
  /** Entity name for display */
  entityName: string;
  /** World ID for timeline context */
  worldId?: string;
  /** Campaign ID for timeline context */
  campaignId?: string;
  /** Show full timeline widget */
  showFullTimeline?: boolean;
  /** Enable timeline editing */
  enableEditing?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Initial collapsed state */
  initiallyCollapsed?: boolean;
}

/**
 * Entity Timeline Section Component
 * Integrates timeline functionality into entity detail pages
 */
export function EntityTimelineSection({
  entityId,
  entityType,
  entityName,
  worldId,
  campaignId,
  showFullTimeline = false,
  enableEditing = false,
  compact = false,
  initiallyCollapsed = false
}: EntityTimelineSectionProps) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [showWidget, setShowWidget] = useState(showFullTimeline);

  const handleViewFullTimeline = () => {
    timelineNavigation.navigateFromEntity(
      entityType,
      entityId,
      { worldId, campaignId },
      { enableEditing }
    );
  };

  const handleCreateTimelineEvent = () => {
    // Navigate to event creation with entity context
    timelineNavigation.navigateToTimeline(
      { worldId, campaignId, entityId, entityType },
      { enableEditing: true, displayMode: 'dual' }
    );
  };

  const handleToggleWidget = () => {
    setShowWidget(!showWidget);
  };

  const getEntityTypeColor = () => {
    switch (entityType) {
      case 'character': return 'blue';
      case 'campaign': return 'green';
      case 'session': return 'violet';
      case 'event': return 'orange';
      case 'location': return 'cyan';
      case 'npc': return 'gray';
      default: return 'blue';
    }
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'character': return 'Character Timeline';
      case 'campaign': return 'Campaign Timeline';
      case 'session': return 'Session Timeline';
      case 'event': return 'Event Timeline';
      case 'location': return 'Location Timeline';
      case 'npc': return 'NPC Timeline';
      default: return 'Timeline';
    }
  };

  const getTimelineDescription = () => {
    switch (entityType) {
      case 'character':
        return `Timeline events related to ${entityName}'s story and development`;
      case 'campaign':
        return `Complete campaign timeline showing all events and sessions`;
      case 'session':
        return `Timeline context for this gaming session`;
      case 'event':
        return `Timeline placement and related events`;
      case 'location':
        return `Historical events and activities at ${entityName}`;
      case 'npc':
        return `Timeline of ${entityName}'s appearances and activities`;
      default:
        return `Timeline events related to ${entityName}`;
    }
  };

  return (
    <Paper withBorder p={compact ? "sm" : "md"}>
      <Stack gap={compact ? "xs" : "sm"}>
        {/* Section Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm" align="center">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
            </ActionIcon>
            
            <IconTimeline size={20} color={`var(--mantine-color-${getEntityTypeColor()}-6)`} />
            
            <div>
              <Title order={compact ? 5 : 4}>{getEntityTypeLabel()}</Title>
              {!compact && (
                <Text size="sm" c="dimmed">
                  {getTimelineDescription()}
                </Text>
              )}
            </div>
          </Group>

          <Group gap="xs">
            <Badge color={getEntityTypeColor()} size="sm" variant="light">
              {entityType.toUpperCase()}
            </Badge>

            {enableEditing && (
              <Tooltip label="Create Timeline Event">
                <ActionIcon
                  variant="light"
                  color={getEntityTypeColor()}
                  size="sm"
                  onClick={handleCreateTimelineEvent}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label={showWidget ? "Hide Timeline" : "Show Timeline"}>
              <ActionIcon
                variant="light"
                color={getEntityTypeColor()}
                size="sm"
                onClick={handleToggleWidget}
              >
                <IconTimeline size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Open Full Timeline">
              <ActionIcon
                variant="light"
                color={getEntityTypeColor()}
                size="sm"
                onClick={handleViewFullTimeline}
              >
                <IconMaximize size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Timeline Content */}
        <Collapse in={!collapsed}>
          <Stack gap="sm">
            {/* Quick Timeline Actions */}
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color={getEntityTypeColor()}
                leftSection={<IconTimeline size={14} />}
                onClick={handleViewFullTimeline}
              >
                View Full Timeline
              </Button>

              {enableEditing && (
                <Button
                  size="xs"
                  variant="outline"
                  color={getEntityTypeColor()}
                  leftSection={<IconPlus size={14} />}
                  onClick={handleCreateTimelineEvent}
                >
                  Add Event
                </Button>
              )}
            </Group>

            {/* Timeline Widget */}
            {showWidget && (
              <DualTimelineWidget
                worldId={worldId}
                campaignId={campaignId}
                title={`${entityName} Timeline`}
                description={getTimelineDescription()}
                height={compact ? 300 : 400}
                displayMode="dual"
                showHeader={false}
                showControls={true}
                compact={compact}
                enableEditing={enableEditing}
                onMaximize={handleViewFullTimeline}
                onEventClick={(eventId, timeline) => {
                  console.log(`Event clicked: ${eventId} on ${timeline} timeline`);
                }}
                onEventEdit={(eventId) => {
                  console.log(`Edit event: ${eventId}`);
                }}
              />
            )}

            {/* Timeline Summary */}
            {!showWidget && (
              <Paper p="sm" bg="gray.0" radius="sm">
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="sm" fw={500}>Timeline Summary</Text>
                    <Text size="xs" c="dimmed">
                      Click "View Full Timeline" to see all related events
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Badge size="sm" color="blue" variant="outline">
                      Real World
                    </Badge>
                    <Badge size="sm" color="green" variant="outline">
                      In-Game
                    </Badge>
                  </Group>
                </Group>
              </Paper>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

export default EntityTimelineSection;
