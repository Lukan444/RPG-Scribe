/**
 * Timeline Summary Widget - Dashboard component
 * Compact timeline overview for dashboard integration
 */

import React from 'react';
import { Paper, Title, Text, Group, Badge, Stack, ActionIcon, Tooltip, Progress, SimpleGrid } from '@mantine/core';
import { IconTimeline, IconCalendar, IconClock, IconTrendingUp, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export interface TimelineSummaryData {
  /** Total number of timeline events */
  totalEvents: number;
  /** Number of recent events (last 30 days) */
  recentEvents: number;
  /** Current campaign name */
  campaignName?: string;
  /** Current world name */
  worldName?: string;
  /** Last session date */
  lastSessionDate?: Date;
  /** Next scheduled session */
  nextSessionDate?: Date;
  /** Timeline completion percentage */
  completionPercentage?: number;
  /** Active conflicts count */
  conflictsCount?: number;
}

export interface TimelineSummaryWidgetProps {
  /** Timeline summary data */
  data: TimelineSummaryData;
  /** World ID for navigation */
  worldId?: string;
  /** Campaign ID for navigation */
  campaignId?: string;
  /** Show detailed metrics */
  showMetrics?: boolean;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Timeline Summary Widget Component
 * Provides quick overview of timeline status for dashboard
 */
export function TimelineSummaryWidget({
  data,
  worldId,
  campaignId,
  showMetrics = true,
  compact = false
}: TimelineSummaryWidgetProps) {
  const navigate = useNavigate();

  const handleViewTimeline = () => {
    if (worldId && campaignId) {
      navigate(`/visualizations/timeline?world=${worldId}&campaign=${campaignId}`);
    } else {
      navigate('/visualizations/timeline');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimelineHealthColor = () => {
    if (!data.completionPercentage) return 'gray';
    if (data.completionPercentage >= 80) return 'green';
    if (data.completionPercentage >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Paper withBorder p={compact ? "sm" : "md"} h={compact ? 200 : 280}>
      <Stack gap="sm" h="100%">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" align="center">
              <IconTimeline size={20} color="var(--mantine-color-blue-6)" />
              <Title order={compact ? 6 : 5}>Timeline Overview</Title>
            </Group>
            {data.campaignName && (
              <Text size="xs" c="dimmed" mt={2}>
                {data.worldName && `${data.worldName} • `}{data.campaignName}
              </Text>
            )}
          </div>
          
          <Tooltip label="View Full Timeline">
            <ActionIcon 
              variant="subtle" 
              size="sm"
              onClick={handleViewTimeline}
            >
              <IconArrowRight size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Quick Stats */}
        <SimpleGrid cols={compact ? 2 : 3} spacing="xs">
          <div>
            <Text size="lg" fw={600} c="blue">
              {data.totalEvents}
            </Text>
            <Text size="xs" c="dimmed">Total Events</Text>
          </div>
          
          <div>
            <Text size="lg" fw={600} c="green">
              {data.recentEvents}
            </Text>
            <Text size="xs" c="dimmed">Recent</Text>
          </div>
          
          {!compact && (
            <div>
              <Text size="lg" fw={600} c={data.conflictsCount ? "orange" : "gray"}>
                {data.conflictsCount || 0}
              </Text>
              <Text size="xs" c="dimmed">Conflicts</Text>
            </div>
          )}
        </SimpleGrid>

        {/* Timeline Health */}
        {showMetrics && data.completionPercentage !== undefined && (
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Timeline Health</Text>
              <Text size="sm" c={getTimelineHealthColor()}>
                {data.completionPercentage}%
              </Text>
            </Group>
            <Progress 
              value={data.completionPercentage} 
              color={getTimelineHealthColor()}
              size="sm"
            />
          </div>
        )}

        {/* Session Information */}
        {!compact && (data.lastSessionDate || data.nextSessionDate) && (
          <Stack gap="xs">
            {data.lastSessionDate && (
              <Group gap="xs">
                <IconCalendar size={14} color="var(--mantine-color-gray-6)" />
                <Text size="xs" c="dimmed">
                  Last Session: {formatDate(data.lastSessionDate)}
                </Text>
              </Group>
            )}
            
            {data.nextSessionDate && (
              <Group gap="xs">
                <IconClock size={14} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="blue">
                  Next Session: {formatDate(data.nextSessionDate)}
                </Text>
              </Group>
            )}
          </Stack>
        )}

        {/* Action Badges */}
        <Group gap="xs" mt="auto">
          <Badge 
            size="sm" 
            variant="light" 
            color="blue"
            leftSection={<IconTrendingUp size={12} />}
          >
            Dual Timeline
          </Badge>
          
          {data.conflictsCount && data.conflictsCount > 0 && (
            <Badge size="sm" variant="light" color="orange">
              {data.conflictsCount} Conflicts
            </Badge>
          )}
          
          {data.recentEvents > 0 && (
            <Badge size="sm" variant="light" color="green">
              Active
            </Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

export default TimelineSummaryWidget;
