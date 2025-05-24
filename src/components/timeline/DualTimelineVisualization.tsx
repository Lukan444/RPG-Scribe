/**
 * Dual Timeline Visualization Component
 *
 * Enhanced timeline component with dual-time display capabilities,
 * drag-and-drop functionality, and comprehensive timeline management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Box,
  Stack,
  Loader,
  Center,
  Card,
  Avatar,
  Divider,
  Switch,
  SegmentedControl,
  Alert,
  Flex,
  ScrollArea,
  NumberInput,
  Select,
  MultiSelect,
} from '@mantine/core';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  IconCalendarEvent,
  IconClock,
  IconWorld,
  IconZoomIn,
  IconZoomOut,
  IconAlertTriangle,
  IconEdit,
  IconGripVertical,
  IconCalendarTime,
  IconHistory,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconMapPin,
  IconUser,
  IconSword,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { TimelineEntry } from '../../models/Timeline';
import { TimelineService } from '../../services/timeline.service';
import { TimelineValidationService } from '../../services/timelineValidation.service';
import { TimeUnit, TimelineEntryType } from '../../constants/timelineConstants';
import { formatTimeGap } from '../../utils/timelineUtils';

/**
 * Enhanced timeline event interface with dual-time support
 */
interface DualTimelineEvent {
  id: string;
  title: string;
  description?: string;

  // Dual timestamp support
  inGameTime?: Date;
  realWorldTime?: Date;

  // Timeline positioning
  sequence: number;
  timeGapBefore?: {
    duration: number;
    unit: TimeUnit;
    description?: string;
  };
  duration?: {
    duration: number;
    unit: TimeUnit;
  };

  // Event properties
  type: TimelineEntryType;
  importance: number;
  entryType: TimelineEntryType;

  // Associated entities
  location?: {
    id: string;
    name: string;
  };
  participants?: Array<{
    id: string;
    name: string;
    imageUrl?: string;
  }>;
  items?: Array<{
    id: string;
    name: string;
  }>;

  // Validation and conflicts
  hasConflicts?: boolean;
  conflictTypes?: string[];
  validationStatus?: 'valid' | 'warning' | 'error';

  // Metadata
  imageUrl?: string;
  sessionId?: string;
  associatedEntityId?: string;
  associatedEntityType?: string;
}

/**
 * Timeline display mode
 */
type TimelineDisplayMode = 'in-game' | 'real-world' | 'dual';

/**
 * Timeline zoom level
 */
type TimelineZoomLevel = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

/**
 * Dual timeline visualization props
 */
interface DualTimelineVisualizationProps {
  campaignId?: string;
  worldId?: string;
  entityId?: string;
  entityType?: EntityType;
  title?: string;
  description?: string;

  // Display options
  displayMode?: TimelineDisplayMode;
  zoomLevel?: TimelineZoomLevel;
  showConflicts?: boolean;
  enableDragDrop?: boolean;

  // Event handlers
  onEventClick?: (eventId: string) => void;
  onEventEdit?: (eventId: string) => void;
  onEventMove?: (eventId: string, newPosition: number) => void;
  onTimelineChange?: (events: DualTimelineEvent[]) => void;
}

/**
 * Enhanced Dual Timeline Visualization Component
 */
export function DualTimelineVisualization({
  campaignId,
  worldId,
  entityId,
  entityType,
  title = 'Dual Timeline',
  description,
  displayMode = 'dual',
  zoomLevel = 'day',
  showConflicts = true,
  enableDragDrop = true,
  onEventClick,
  onEventEdit,
  onEventMove,
  onTimelineChange
}: DualTimelineVisualizationProps) {
  const navigate = useNavigate();

  // Enhanced state management
  const [events, setEvents] = useState<DualTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timeline display state
  const [currentDisplayMode, setCurrentDisplayMode] = useState<TimelineDisplayMode>(displayMode);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<TimelineZoomLevel>(zoomLevel);
  const [showValidationConflicts, setShowValidationConflicts] = useState(showConflicts);

  // Timeline services
  const [timelineService, setTimelineService] = useState<TimelineService | null>(null);
  const [validationService] = useState(() => TimelineValidationService.getInstance());

  // Enhanced filtering state
  const [typeFilter, setTypeFilter] = useState<TimelineEntryType[]>([]);
  const [importanceFilter, setImportanceFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [conflictFilter, setConflictFilter] = useState<boolean>(false);
  const [entityFilter, setEntityFilter] = useState<string[]>([]);

  // Timeline interaction state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);

  // Initialize timeline service
  useEffect(() => {
    if (campaignId && worldId) {
      const service = new TimelineService(worldId, campaignId);
      setTimelineService(service);
    }
  }, [campaignId, worldId]);

  // Load and validate timeline data
  const loadTimelineData = useCallback(async () => {
    if (!timelineService) return;

    try {
      setLoading(true);
      setError(null);

      // Load timeline entries
      const timelineEntries = await timelineService.getTimelineEntries({
        entityTypes: entityType ? [entityType] : undefined,
        entityIds: entityId ? [entityId] : undefined,
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      // Convert timeline entries to dual timeline events
      const dualEvents: DualTimelineEvent[] = timelineEntries.map((entry, index) => ({
        id: entry.id || `entry-${index}`,
        title: entry.title,
        description: entry.description,
        inGameTime: entry.position.inGameTimestamp,
        realWorldTime: entry.position.realWorldTimestamp,
        sequence: entry.position.sequence,
        timeGapBefore: entry.position.timeGapBefore,
        duration: entry.duration,
        type: entry.entryType,
        importance: entry.importance || 5,
        entryType: entry.entryType,
        location: entry.locationId ? {
          id: entry.locationId,
          name: `Location ${entry.locationId}` // TODO: Fetch actual location name
        } : undefined,
        participants: entry.participants?.map(id => ({
          id,
          name: `Participant ${id}` // TODO: Fetch actual participant names
        })) || [],
        hasConflicts: false, // Will be set by validation
        validationStatus: entry.validationStatus as any || 'valid',
        associatedEntityId: entry.associatedEntityId,
        associatedEntityType: entry.associatedEntityType
      }));

      // Validate timeline if conflicts are enabled
      if (showValidationConflicts) {
        const validation = await validationService.validateTimeline(timelineEntries, {
          campaignId: campaignId || '',
          worldId: worldId || '',
          recentEntries: [],
          activeCharacters: [],
          sessionInProgress: false
        });

        setValidationResults(validation);

        // Mark events with conflicts
        dualEvents.forEach(event => {
          const eventConflicts = validation.conflicts.filter(conflict =>
            conflict.affectedEntityIds.includes(event.id)
          );

          if (eventConflicts.length > 0) {
            event.hasConflicts = true;
            event.conflictTypes = eventConflicts.map(c => c.type);
            event.validationStatus = eventConflicts.some(c => c.severity === 'error') ? 'error' : 'warning';
          }
        });
      }

      setEvents(dualEvents);

      // Notify parent of timeline changes
      if (onTimelineChange) {
        onTimelineChange(dualEvents);
      }

    } catch (err) {
      console.error('Error loading timeline data:', err);
      setError('Failed to load timeline data');

      // Create mock data for development
      const mockEvents: DualTimelineEvent[] = [
        {
          id: 'mock-1',
          title: 'Campaign Beginning',
          description: 'The adventure starts in a tavern.',
          inGameTime: new Date('1422-05-15T18:00:00Z'),
          realWorldTime: new Date('2024-01-15T19:00:00Z'),
          sequence: 0,
          type: TimelineEntryType.SESSION,
          importance: 10,
          entryType: TimelineEntryType.SESSION,
          validationStatus: 'valid'
        },
        {
          id: 'mock-2',
          title: 'First Battle',
          description: 'Heroes face their first challenge.',
          inGameTime: new Date('1422-05-16T10:00:00Z'),
          realWorldTime: new Date('2024-01-15T20:30:00Z'),
          sequence: 1,
          timeGapBefore: { duration: 16, unit: TimeUnit.HOURS },
          duration: { duration: 30, unit: TimeUnit.MINUTES },
          type: TimelineEntryType.EVENT,
          importance: 8,
          entryType: TimelineEntryType.EVENT,
          validationStatus: 'valid'
        }
      ];

      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  }, [timelineService, entityType, entityId, showValidationConflicts, validationService, campaignId, worldId, onTimelineChange]);

  // Load data when service is ready
  useEffect(() => {
    if (timelineService) {
      loadTimelineData();
    } else {
      // Load mock data if no service available
      loadTimelineData();
    }
  }, [timelineService, loadTimelineData]);

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Box>
            <Title order={3}>{title}</Title>
            {description && <Text c="dimmed">{description}</Text>}
          </Box>

          <Group>
            <Tooltip label="Refresh Timeline">
              <ActionIcon variant="light" onClick={loadTimelineData}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Timeline Controls */}
        <Group>
          <SegmentedControl
            value={currentDisplayMode}
            onChange={(value) => setCurrentDisplayMode(value as TimelineDisplayMode)}
            data={[
              { label: 'In-Game', value: 'in-game' },
              { label: 'Real World', value: 'real-world' },
              { label: 'Dual View', value: 'dual' }
            ]}
          />

          <Switch
            label="Show Conflicts"
            checked={showValidationConflicts}
            onChange={(event) => setShowValidationConflicts(event.currentTarget.checked)}
          />
        </Group>

        {/* Timeline Content */}
        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : error ? (
          <Center h={200}>
            <Stack align="center">
              <Text c="red">{error}</Text>
              <Text size="sm" c="dimmed">Using mock data for demonstration</Text>
            </Stack>
          </Center>
        ) : events.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No timeline events found.</Text>
          </Center>
        ) : (
          <ScrollArea h={600}>
            <Stack>
              {events.map((event, index) => (
                <Card key={event.id} withBorder shadow="sm" p="md">
                  <Group justify="space-between" mb="sm">
                    <Group>
                      <Badge color={getEventTypeColor(event.type)}>
                        {event.type.replace('_', ' ')}
                      </Badge>
                      {event.hasConflicts && (
                        <Badge color="red" leftSection={<IconAlertTriangle size={12} />}>
                          Conflict
                        </Badge>
                      )}
                    </Group>

                    <Group>
                      <Text size="sm" c="dimmed">
                        Seq: {event.sequence}
                      </Text>
                      {enableDragDrop && (
                        <ActionIcon variant="subtle" size="sm">
                          <IconGripVertical size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>

                  <Title order={5} mb="xs">{event.title}</Title>

                  {event.description && (
                    <Text size="sm" c="dimmed" mb="sm">{event.description}</Text>
                  )}

                  {/* Dual Time Display */}
                  <Group mb="sm">
                    {(currentDisplayMode === 'in-game' || currentDisplayMode === 'dual') && event.inGameTime && (
                      <Group>
                        <IconWorld size={16} />
                        <Text size="sm">
                          In-Game: {event.inGameTime.toLocaleDateString()} {event.inGameTime.toLocaleTimeString()}
                        </Text>
                      </Group>
                    )}

                    {(currentDisplayMode === 'real-world' || currentDisplayMode === 'dual') && event.realWorldTime && (
                      <Group>
                        <IconClock size={16} />
                        <Text size="sm">
                          Real: {event.realWorldTime.toLocaleDateString()} {event.realWorldTime.toLocaleTimeString()}
                        </Text>
                      </Group>
                    )}
                  </Group>

                  {/* Time Gap and Duration */}
                  {event.timeGapBefore && (
                    <Text size="xs" c="dimmed">
                      Gap: {formatTimeGap(event.timeGapBefore)}
                    </Text>
                  )}

                  {event.duration && (
                    <Text size="xs" c="dimmed">
                      Duration: {formatTimeGap(event.duration)}
                    </Text>
                  )}

                  <Group mt="md">
                    <Button size="xs" variant="light" onClick={() => onEventClick?.(event.id)}>
                      View Details
                    </Button>
                    {onEventEdit && (
                      <Button size="xs" variant="subtle" onClick={() => onEventEdit(event.id)}>
                        Edit
                      </Button>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Get color for timeline entry type
 */
function getEventTypeColor(type: TimelineEntryType): string {
  switch (type) {
    case TimelineEntryType.SESSION:
      return 'blue';
    case TimelineEntryType.EVENT:
      return 'green';
    case TimelineEntryType.MILESTONE:
      return 'violet';
    case TimelineEntryType.DOWNTIME:
      return 'cyan';
    case TimelineEntryType.TRAVEL:
      return 'orange';
    default:
      return 'gray';
  }
}
