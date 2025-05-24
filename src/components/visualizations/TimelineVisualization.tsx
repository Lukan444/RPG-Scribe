import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Group,
  Timeline,
  Select,
  MultiSelect,
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
  Collapse,
  Switch,
  NumberInput,
  Slider,
  SegmentedControl,
  Alert,
  Flex,
  ScrollArea,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  IconCalendarEvent,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconDownload,
  IconRefresh,
  IconChevronDown,
  IconChevronRight,
  IconUser,
  IconMapPin,
  IconSword,
  IconClock,
  IconWorld,
  IconZoomIn,
  IconZoomOut,
  IconAlertTriangle,
  IconEdit,
  IconGripVertical,
  IconCalendarTime,
  IconHistory
} from '@tabler/icons-react';
import { EntityType } from '../../models/EntityType';
import { EventType } from '../../models/EventType';
import { TimelineEntry } from '../../models/Timeline';
import { TimelineService } from '../../services/timeline.service';
import { TimelineValidationService } from '../../services/timelineValidation.service';
import { TimeUnit, TimelineEntryType } from '../../constants/timelineConstants';
import { formatTimeGap } from '../../utils/timelineUtils';

/**
 * Enhanced timeline event interface with dual-time support
 */
interface EnhancedTimelineEvent {
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
 * Enhanced timeline visualization props
 */
interface TimelineVisualizationProps {
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
  onTimelineChange?: (events: EnhancedTimelineEvent[]) => void;
}

/**
 * Enhanced TimelineVisualization component with dual-time display and drag-and-drop
 */
export function TimelineVisualization({
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
}: TimelineVisualizationProps) {
  const navigate = useNavigate();

  // Enhanced state management
  const [events, setEvents] = useState<EnhancedTimelineEvent[]>([]);
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

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, we would fetch data from an API
        // For now, we'll create mock data

        // Mock events
        const mockEvents: EnhancedTimelineEvent[] = [
          {
            id: 'event-1',
            title: 'Campaign Start',
            description: 'The heroes meet in a tavern and decide to embark on an adventure.',
            inGameTime: new Date('2023-01-01'),
            realWorldTime: new Date('2024-01-01'),
            sequence: 0,
            type: TimelineEntryType.SESSION,
            entryType: TimelineEntryType.SESSION,
            importance: 10,
            location: {
              id: 'location-1',
              name: 'The Prancing Pony'
            },
            participants: [
              {
                id: 'character-1',
                name: 'Gandalf',
                imageUrl: 'https://placehold.co/100x100?text=Gandalf'
              },
              {
                id: 'character-2',
                name: 'Frodo',
                imageUrl: 'https://placehold.co/100x100?text=Frodo'
              }
            ],
            sessionId: 'session-1'
          },
          {
            id: 'event-2',
            title: 'Battle at the Bridge',
            description: 'The heroes face their first major challenge as they defend a bridge from goblin attackers.',
            inGameTime: new Date('2023-01-15'),
            realWorldTime: new Date('2024-01-15'),
            sequence: 1,
            type: TimelineEntryType.EVENT,
            entryType: TimelineEntryType.EVENT,
            importance: 7,
            location: {
              id: 'location-2',
              name: 'Stone Bridge'
            },
            participants: [
              {
                id: 'character-1',
                name: 'Gandalf',
                imageUrl: 'https://placehold.co/100x100?text=Gandalf'
              },
              {
                id: 'character-2',
                name: 'Frodo',
                imageUrl: 'https://placehold.co/100x100?text=Frodo'
              }
            ],
            items: [
              {
                id: 'item-1',
                name: 'Magic Staff'
              }
            ],
            sessionId: 'session-2'
          },
          {
            id: 'event-3',
            title: 'Discovery of the Ancient Ruins',
            description: 'The party discovers ancient ruins that hold clues to their quest.',
            inGameTime: new Date('2023-02-01'),
            realWorldTime: new Date('2024-02-01'),
            sequence: 2,
            type: TimelineEntryType.EVENT,
            entryType: TimelineEntryType.EVENT,
            importance: 8,
            location: {
              id: 'location-3',
              name: 'Ancient Ruins'
            },
            participants: [
              {
                id: 'character-1',
                name: 'Gandalf',
                imageUrl: 'https://placehold.co/100x100?text=Gandalf'
              },
              {
                id: 'character-3',
                name: 'Aragorn',
                imageUrl: 'https://placehold.co/100x100?text=Aragorn'
              }
            ],
            imageUrl: 'https://placehold.co/300x200?text=Ancient+Ruins',
            sessionId: 'session-3'
          },
          {
            id: 'event-4',
            title: 'Final Confrontation',
            description: 'The heroes face the final boss in an epic battle that determines the fate of the world.',
            inGameTime: new Date('2023-03-01'),
            realWorldTime: new Date('2024-03-01'),
            sequence: 3,
            type: TimelineEntryType.EVENT,
            entryType: TimelineEntryType.EVENT,
            importance: 10,
            location: {
              id: 'location-4',
              name: 'Dark Tower'
            },
            participants: [
              {
                id: 'character-1',
                name: 'Gandalf',
                imageUrl: 'https://placehold.co/100x100?text=Gandalf'
              },
              {
                id: 'character-2',
                name: 'Frodo',
                imageUrl: 'https://placehold.co/100x100?text=Frodo'
              },
              {
                id: 'character-3',
                name: 'Aragorn',
                imageUrl: 'https://placehold.co/100x100?text=Aragorn'
              }
            ],
            items: [
              {
                id: 'item-1',
                name: 'Magic Staff'
              },
              {
                id: 'item-2',
                name: 'One Ring'
              }
            ],
            imageUrl: 'https://placehold.co/300x200?text=Dark+Tower',
            sessionId: 'session-4'
          }
        ];

        setEvents(mockEvents);
      } catch (err) {
        console.error('Error loading timeline data:', err);
        setError('Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, [campaignId, entityId, entityType]);

  // Handle event click
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      // Filter by type
      if (typeFilter.length > 0 && !typeFilter.includes(event.type)) {
        return false;
      }

      // Filter by importance
      if (importanceFilter !== null && event.importance < importanceFilter) {
        return false;
      }

      // Filter by date range (use inGameTime or realWorldTime)
      const eventDate = event.inGameTime || event.realWorldTime;
      if (dateRange[0] && eventDate && eventDate < dateRange[0]) {
        return false;
      }
      if (dateRange[1] && eventDate && eventDate > dateRange[1]) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date (use inGameTime or realWorldTime)
      const aDate = a.inGameTime || a.realWorldTime;
      const bDate = b.inGameTime || b.realWorldTime;

      if (!aDate || !bDate) {
        return 0; // Keep original order if no dates
      }

      const dateComparison = sortDirection === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();

      // If dates are the same, sort by importance
      if (dateComparison === 0) {
        return b.importance - a.importance;
      }

      return dateComparison;
    });

  // Event type filter options
  const eventTypeOptions = Object.values(TimelineEntryType).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace('_', ' ')
  }));

  // Importance filter options
  const importanceOptions = [
    { value: '0', label: 'All' },
    { value: '3', label: 'Minor (3+)' },
    { value: '5', label: 'Moderate (5+)' },
    { value: '8', label: 'Major (8+)' }
  ];

  return (
    <Paper p="md" withBorder>
      <Stack>
        <Group justify="space-between">
          <Box>
            <Title order={3}>{title}</Title>
            {description && <Text c="dimmed">{description}</Text>}
          </Box>

          <Group>
            <MultiSelect
              placeholder="Filter by Type"
              data={eventTypeOptions}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as TimelineEntryType[])}
              leftSection={<IconFilter size={16} />}
              w={200}
            />

            <Select
              placeholder="Filter by Importance"
              data={importanceOptions}
              value={importanceFilter?.toString() || '0'}
              onChange={(value) => setImportanceFilter(value === '0' ? null : Number(value))}
              leftSection={<IconFilter size={16} />}
              w={150}
            />

            <Box w={250}>
              <Text size="sm" mb={5}>Filter by Date</Text>
              <DatePicker
                value={dateRange[0]}
                onChange={(dateString: string | null) => {
                  if (dateString) {
                    // Create a new Date object
                    const newDate = new Date(dateString);
                    setDateRange([newDate, dateRange[1]]);
                  }
                }}
              />
            </Box>

            <Tooltip label={sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}>
              <ActionIcon
                variant="light"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? (
                  <IconSortAscending size={16} />
                ) : (
                  <IconSortDescending size={16} />
                )}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Refresh">
              <ActionIcon variant="light">
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Export">
              <ActionIcon variant="light">
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : error ? (
          <Center h={200}>
            <Text c="red">{error}</Text>
          </Center>
        ) : filteredEvents.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No events found matching the current filters.</Text>
          </Center>
        ) : (
          <Timeline active={filteredEvents.length - 1} bulletSize={24} lineWidth={2}>
            {filteredEvents.map((event, index) => (
              <Timeline.Item
                key={event.id}
                bullet={<IconCalendarEvent size={12} />}
                title={
                  <Group justify="space-between">
                    <Text fw={500}>{event.title}</Text>
                    <Badge color={getEventTypeColor(event.type)}>
                      {event.type.replace('_', ' ')}
                    </Badge>
                  </Group>
                }
              >
                <Card withBorder shadow="sm" p="sm" mt="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {(event.inGameTime || event.realWorldTime)?.toLocaleDateString() || 'No date'}
                    </Text>
                    <Badge color="gray">Importance: {event.importance}/10</Badge>
                  </Group>

                  <Text size="sm" mt="xs">
                    {event.description}
                  </Text>

                  <Group mt="md">
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => handleEventClick(event.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      rightSection={
                        expandedEvents[event.id] ? (
                          <IconChevronDown size={14} />
                        ) : (
                          <IconChevronRight size={14} />
                        )
                      }
                      onClick={() => toggleEventExpansion(event.id)}
                    >
                      {expandedEvents[event.id] ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </Group>

                  <Collapse in={expandedEvents[event.id]}>
                    <Stack mt="md">
                      {event.location && (
                        <Group>
                          <IconMapPin size={16} />
                          <Text size="sm">Location: {event.location.name}</Text>
                        </Group>
                      )}

                      {event.participants && event.participants.length > 0 && (
                        <Box>
                          <Text size="sm" fw={500}>Participants:</Text>
                          <Group mt="xs">
                            {event.participants.map(participant => (
                              <Tooltip key={participant.id} label={participant.name}>
                                <Avatar
                                  src={participant.imageUrl}
                                  alt={participant.name}
                                  radius="xl"
                                  size="sm"
                                />
                              </Tooltip>
                            ))}
                          </Group>
                        </Box>
                      )}

                      {event.items && event.items.length > 0 && (
                        <Box>
                          <Text size="sm" fw={500}>Items:</Text>
                          <Group mt="xs">
                            {event.items.map(item => (
                              <Badge key={item.id} leftSection={<IconSword size={10} />}>
                                {item.name}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}

                      {event.imageUrl && (
                        <Box mt="xs">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            style={{ maxWidth: '100%', borderRadius: '4px' }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </Collapse>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Get color for event type
 */
function getEventTypeColor(type: EventType | string): string {
  switch (type) {
    case EventType.BATTLE:
      return 'red';
    case EventType.SOCIAL:
      return 'blue';
    case EventType.EXPLORATION:
      return 'green';
    case 'Exploration': // For backward compatibility
      return 'green';
    case EventType.DISCOVERY:
      return 'violet';
    case EventType.QUEST:
      return 'yellow';
    case EventType.TRAVEL:
      return 'cyan';
    case EventType.REST:
      return 'indigo';
    case 'Rest': // For backward compatibility
      return 'indigo';
    default:
      return 'gray';
  }
}
