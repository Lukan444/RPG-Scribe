/**
 * Entity Timeline Access Component
 * 
 * Provides timeline access from entity detail pages with automatic
 * filtering to show only events related to the specific entity.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Group,
  Text,
  Badge,
  Paper,
  Stack,
  ActionIcon,
  Tooltip,
  Modal,
  Box
} from '@mantine/core';
import {
  IconTimeline,
  IconCalendar,
  IconEye,
  IconFilter,
  IconArrowRight,
  IconWorld,
  IconUsers
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Import timeline components
import { DualTimelineVisualization } from './DualTimelineVisualization';
import { TimelineFilters, TimelineFilterState } from './TimelineFilters';

// Import services
import { TimelineService } from '../../services/timeline.service';
import { entityCountCache } from '../../services/cache/EntityCountCache.service';

export interface EntityTimelineAccessProps {
  entityType: 'character' | 'location' | 'event' | 'session' | 'faction' | 'item' | 'campaign';
  entityId: string;
  entityName: string;
  worldId?: string;
  campaignId?: string;
  sessionId?: string;
  showInline?: boolean;
  maxHeight?: number;
}

export function EntityTimelineAccess({
  entityType,
  entityId,
  entityName,
  worldId,
  campaignId,
  sessionId,
  showInline = false,
  maxHeight = 400
}: EntityTimelineAccessProps) {
  const { t } = useTranslation(['timeline', 'common']);
  const navigate = useNavigate();

  // State management
  const [showModal, setShowModal] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timelineFilters, setTimelineFilters] = useState<TimelineFilterState>({
    worldId,
    campaignId,
    sessionId,
    timeFrame: 'last-month',
    entityType,
    entityId
  });

  // Service instances
  const timelineService = useMemo(() => new TimelineService(), []);

  // Load entity event count
  useEffect(() => {
    const loadEventCount = async () => {
      try {
        setLoading(true);
        
        // Try to get count from cache first
        const cachedData = await entityCountCache.getCachedEntityCounts(
          campaignId ? 'campaign' : 'world',
          campaignId || worldId || '',
          entityType as any
        );

        if (cachedData && cachedData.counts[entityType]) {
          setEventCount(cachedData.counts[entityType]);
          setLoading(false);
          return;
        }

        // Fetch from service if not cached
        const events = await timelineService.getEntityEvents(entityType, entityId, {
          worldId,
          campaignId,
          sessionId
        });

        const count = events.length;
        setEventCount(count);

        // Cache the result
        const entityCountData = {
          counts: { [entityType]: count },
          recentEntities: { [entityType]: events.slice(0, 5) },
          lastUpdated: new Date(),
          worldId,
          campaignId
        };

        entityCountCache.setCachedEntityCounts(
          campaignId ? 'campaign' : 'world',
          campaignId || worldId || '',
          entityCountData,
          entityType as any
        );
        
      } catch (error) {
        console.error('Error loading entity event count:', error);
        setEventCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadEventCount();
  }, [entityType, entityId, worldId, campaignId, sessionId, timelineService, entityCountCache]);

  // Handle navigation to full timeline
  const handleNavigateToTimeline = () => {
    const params = new URLSearchParams();
    
    if (worldId) params.set('worldId', worldId);
    if (campaignId) params.set('campaignId', campaignId);
    if (sessionId) params.set('sessionId', sessionId);
    params.set('entityType', entityType);
    params.set('entityId', entityId);
    params.set('entityName', entityName);
    
    navigate(`/timeline?${params.toString()}`);
  };

  // Handle opening modal timeline
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Handle expanding scope (remove entity filter)
  const handleExpandScope = () => {
    setTimelineFilters({
      ...timelineFilters,
      entityType: undefined,
      entityId: undefined
    });
  };

  // Get entity type display info
  const getEntityTypeInfo = () => {
    const typeMap = {
      character: { icon: IconUsers, color: 'blue', label: 'Character' },
      location: { icon: IconWorld, color: 'green', label: 'Location' },
      event: { icon: IconCalendar, color: 'orange', label: 'Event' },
      session: { icon: IconCalendar, color: 'purple', label: 'Session' },
      faction: { icon: IconUsers, color: 'red', label: 'Faction' },
      item: { icon: IconWorld, color: 'yellow', label: 'Item' },
      campaign: { icon: IconUsers, color: 'indigo', label: 'Campaign' }
    };
    
    return typeMap[entityType] || { icon: IconCalendar, color: 'gray', label: 'Entity' };
  };

  const entityInfo = getEntityTypeInfo();
  const IconComponent = entityInfo.icon;

  // Render inline timeline view
  if (showInline) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconTimeline size={20} />
              <Text fw={500}>Timeline Events</Text>
              <Badge color={entityInfo.color} variant="light">
                {eventCount} events
              </Badge>
            </Group>
            <Group gap="xs">
              <Tooltip label="Expand to campaign timeline">
                <ActionIcon
                  variant="subtle"
                  onClick={handleExpandScope}
                  disabled={!timelineFilters.entityId}
                >
                  <IconFilter size={16} />
                </ActionIcon>
              </Tooltip>
              <Button
                size="xs"
                variant="light"
                rightSection={<IconArrowRight size={14} />}
                onClick={handleNavigateToTimeline}
              >
                Full Timeline
              </Button>
            </Group>
          </Group>

          <Box style={{ height: maxHeight, overflow: 'hidden' }}>
            <DualTimelineVisualization
              worldId={timelineFilters.worldId}
              campaignId={timelineFilters.campaignId}
              sessionId={timelineFilters.sessionId}
              entityFilter={
                timelineFilters.entityType && timelineFilters.entityId
                  ? {
                      type: timelineFilters.entityType,
                      id: timelineFilters.entityId
                    }
                  : undefined
              }

            />
          </Box>
        </Stack>
      </Paper>
    );
  }

  // Render timeline access buttons
  return (
    <>
      <Group gap="xs">
        <Button
          variant="light"
          leftSection={<IconTimeline size={16} />}
          rightSection={
            <Badge size="xs" color={entityInfo.color}>
              {loading ? '...' : eventCount}
            </Badge>
          }
          onClick={handleOpenModal}
          loading={loading}
        >
          View Timeline
        </Button>

        <Button
          variant="subtle"
          size="sm"
          rightSection={<IconArrowRight size={14} />}
          onClick={handleNavigateToTimeline}
        >
          Full Timeline
        </Button>
      </Group>

      {/* Timeline Modal */}
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={
          <Group gap="xs">
            <IconComponent size={20} />
            <Text fw={500}>Timeline: {entityName}</Text>
            <Badge color={entityInfo.color} variant="light">
              {entityInfo.label}
            </Badge>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          {/* Timeline Filters */}
          <TimelineFilters
            filters={timelineFilters}
            onFiltersChange={setTimelineFilters}
            showEntityContext={true}
            entityContext={{
              type: entityInfo.label,
              id: entityId,
              name: entityName
            }}
            onClearEntityContext={handleExpandScope}
          />

          {/* Timeline Visualization */}
          <Box style={{ height: 500 }}>
            <DualTimelineVisualization
              worldId={timelineFilters.worldId}
              campaignId={timelineFilters.campaignId}
              sessionId={timelineFilters.sessionId}
              entityFilter={
                timelineFilters.entityType && timelineFilters.entityId
                  ? {
                      type: timelineFilters.entityType,
                      id: timelineFilters.entityId
                    }
                  : undefined
              }
              timeRange={
                timelineFilters.timeFrame === 'custom' && timelineFilters.customStartDate && timelineFilters.customEndDate
                  ? {
                      start: timelineFilters.customStartDate.getTime(),
                      end: timelineFilters.customEndDate.getTime()
                    }
                  : undefined
              }

            />
          </Box>

          {/* Modal Actions */}
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Showing {eventCount} events for {entityName}
              </Text>
            </Group>
            <Group gap="xs">
              <Button
                variant="subtle"
                onClick={handleExpandScope}
                disabled={!timelineFilters.entityId}
              >
                Show All Events
              </Button>
              <Button
                variant="light"
                rightSection={<IconArrowRight size={14} />}
                onClick={handleNavigateToTimeline}
              >
                Open Full Timeline
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
