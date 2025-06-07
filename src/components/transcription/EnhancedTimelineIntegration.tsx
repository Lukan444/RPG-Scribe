/**
 * Enhanced Timeline Integration Component
 * 
 * Advanced timeline integration with smooth animations and real-time updates
 * Uses Mantine 8 components for modern timeline visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Badge,
  Tooltip,
  Paper,
  Stack,
  Button,
  Progress,
  Transition,
  Timeline,
  ThemeIcon,
  Menu,
  Switch,
  Slider,
  NumberInput,
  Divider,
  Card,
  Avatar,
  Indicator,
  RingProgress
} from '@mantine/core';
import {
  IconClock,
  IconMicrophone,
  IconBrain,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconFilter,
  IconZoomIn,
  IconZoomOut,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconSettings,
  IconStar,
  IconMessage,
  IconUsers,
  IconRobot,
  IconUser,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import { useDisclosure, useElementSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

/**
 * Timeline event types
 */
export enum TimelineEventType {
  TRANSCRIPTION_START = 'transcription_start',
  TRANSCRIPTION_END = 'transcription_end',
  AI_SUGGESTION = 'ai_suggestion',
  USER_BOOKMARK = 'user_bookmark',
  COLLABORATION_ACTION = 'collaboration_action',
  SYSTEM_EVENT = 'system_event',
  CUSTOM_EVENT = 'custom_event'
}

/**
 * Timeline event interface
 */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  title: string;
  description?: string;
  confidence?: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  metadata?: Record<string, any>;
  approved?: boolean;
  rejected?: boolean;
  aiGenerated?: boolean;
  transcriptionSegmentId?: string;
  collaborators?: string[];
  tags?: string[];
}

/**
 * Timeline filter options
 */
export interface TimelineFilters {
  showAIEvents: boolean;
  showUserEvents: boolean;
  showSystemEvents: boolean;
  minConfidence: number;
  eventTypes: TimelineEventType[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  users: string[];
}

/**
 * Component props
 */
export interface EnhancedTimelineIntegrationProps {
  /** Timeline events */
  events: TimelineEvent[];
  /** Whether timeline is in live mode */
  isLive?: boolean;
  /** Current playback time */
  currentTime?: number;
  /** Total duration */
  duration?: number;
  /** Whether to show filters */
  showFilters?: boolean;
  /** Whether to show AI suggestions */
  showAISuggestions?: boolean;
  /** Whether to allow event approval */
  allowApproval?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Callback when event is clicked */
  onEventClick?: (event: TimelineEvent) => void;
  /** Callback when event is approved */
  onEventApprove?: (eventId: string) => void;
  /** Callback when event is rejected */
  onEventReject?: (eventId: string) => void;
  /** Callback when seeking to time */
  onSeek?: (time: number) => void;
  /** Callback when filters change */
  onFiltersChange?: (filters: TimelineFilters) => void;
}

/**
 * Enhanced Timeline Integration Component
 */
export function EnhancedTimelineIntegration({
  events,
  isLive = false,
  currentTime = 0,
  duration = 0,
  showFilters = true,
  showAISuggestions = true,
  allowApproval = true,
  compact = false,
  onEventClick,
  onEventApprove,
  onEventReject,
  onSeek,
  onFiltersChange
}: EnhancedTimelineIntegrationProps) {
  const { ref: containerRef, width } = useElementSize();
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<TimelineFilters>({
    showAIEvents: true,
    showUserEvents: true,
    showSystemEvents: true,
    minConfidence: 0.5,
    eventTypes: Object.values(TimelineEventType),
    timeRange: { start: null, end: null },
    users: []
  });

  // Auto-scroll to current time in live mode
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLive && autoScroll && timelineRef.current) {
      const currentTimeElement = timelineRef.current.querySelector('[data-current-time="true"]');
      if (currentTimeElement) {
        currentTimeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, isLive, autoScroll]);

  // Filter events
  const filteredEvents = events.filter(event => {
    // Type filters
    if (event.aiGenerated && !filters.showAIEvents) return false;
    if (!event.aiGenerated && event.userId && !filters.showUserEvents) return false;
    if (!event.userId && !filters.showSystemEvents) return false;
    
    // Confidence filter
    if (event.confidence !== undefined && event.confidence < filters.minConfidence) return false;
    
    // Event type filter
    if (!filters.eventTypes.includes(event.type)) return false;
    
    // User filter
    if (filters.users.length > 0 && event.userId && !filters.users.includes(event.userId)) return false;
    
    // Time range filter
    if (filters.timeRange.start && event.timestamp < filters.timeRange.start) return false;
    if (filters.timeRange.end && event.timestamp > filters.timeRange.end) return false;
    
    return true;
  });

  // Sort events by timestamp
  const sortedEvents = filteredEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Get event icon
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case TimelineEventType.TRANSCRIPTION_START:
      case TimelineEventType.TRANSCRIPTION_END:
        return <IconMicrophone size={16} />;
      case TimelineEventType.AI_SUGGESTION:
        return <IconBrain size={16} />;
      case TimelineEventType.USER_BOOKMARK:
        return <IconStar size={16} />;
      case TimelineEventType.COLLABORATION_ACTION:
        return <IconUsers size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  // Get event color
  const getEventColor = (event: TimelineEvent): string => {
    if (event.rejected) return 'red';
    if (event.approved) return 'green';
    if (event.aiGenerated) return 'blue';
    return 'gray';
  };

  // Handle event approval
  const handleApprove = (event: TimelineEvent) => {
    onEventApprove?.(event.id);
    notifications.show({
      title: 'Event Approved',
      message: `"${event.title}" has been approved`,
      color: 'green',
      icon: <IconCheck size={16} />
    });
  };

  // Handle event rejection
  const handleReject = (event: TimelineEvent) => {
    onEventReject?.(event.id);
    notifications.show({
      title: 'Event Rejected',
      message: `"${event.title}" has been rejected`,
      color: 'red',
      icon: <IconX size={16} />
    });
  };

  // Update filters
  const updateFilters = (newFilters: Partial<TimelineFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString();
  };

  // Calculate time position for visual timeline
  const getTimePosition = (timestamp: Date): number => {
    if (!duration) return 0;
    const eventTime = (timestamp.getTime() - (events[0]?.timestamp.getTime() || 0)) / 1000;
    return Math.min(100, Math.max(0, (eventTime / duration) * 100));
  };

  return (
    <Paper ref={containerRef} withBorder p="md" radius="md">
      <Stack gap="md">
        {/* Header with controls */}
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon variant="light" color="blue">
              <IconClock size={18} />
            </ThemeIcon>
            <Text fw={500}>
              Timeline Events
              {isLive && (
                <Badge size="xs" color="red" variant="filled" ml="xs">
                  LIVE
                </Badge>
              )}
            </Text>
            <Text size="sm" c="dimmed">
              ({filteredEvents.length} events)
            </Text>
          </Group>
          
          <Group gap="xs">
            {isLive && (
              <Tooltip label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}>
                <ActionIcon
                  variant={autoScroll ? 'filled' : 'light'}
                  color="blue"
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  {autoScroll ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
            
            <Tooltip label="Zoom out">
              <ActionIcon
                variant="light"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                disabled={zoomLevel <= 0.5}
              >
                <IconZoomOut size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Zoom in">
              <ActionIcon
                variant="light"
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                disabled={zoomLevel >= 3}
              >
                <IconZoomIn size={16} />
              </ActionIcon>
            </Tooltip>
            
            {showFilters && (
              <ActionIcon
                variant={filtersOpened ? 'filled' : 'light'}
                onClick={toggleFilters}
              >
                <IconFilter size={16} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Filters panel */}
        <Transition mounted={filtersOpened} transition="slide-down" duration={200}>
          {(styles) => (
            <Card withBorder p="sm" style={styles}>
              <Stack gap="sm">
                <Text size="sm" fw={500}>Filters</Text>
                
                <Group grow>
                  <Switch
                    label="AI Events"
                    checked={filters.showAIEvents}
                    onChange={(e) => updateFilters({ showAIEvents: e.currentTarget.checked })}
                  />
                  <Switch
                    label="User Events"
                    checked={filters.showUserEvents}
                    onChange={(e) => updateFilters({ showUserEvents: e.currentTarget.checked })}
                  />
                  <Switch
                    label="System Events"
                    checked={filters.showSystemEvents}
                    onChange={(e) => updateFilters({ showSystemEvents: e.currentTarget.checked })}
                  />
                </Group>
                
                <Group>
                  <Text size="sm">Min Confidence:</Text>
                  <Slider
                    style={{ flex: 1 }}
                    min={0}
                    max={1}
                    step={0.1}
                    value={filters.minConfidence}
                    onChange={(value) => updateFilters({ minConfidence: value })}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' }
                    ]}
                  />
                </Group>
              </Stack>
            </Card>
          )}
        </Transition>

        {/* Visual timeline bar */}
        {duration > 0 && (
          <Box style={{ position: 'relative', height: 40, backgroundColor: 'var(--mantine-color-gray-1)', borderRadius: 'var(--mantine-radius-sm)' }}>
            {/* Current time indicator */}
            <Box
              style={{
                position: 'absolute',
                left: `${(currentTime / duration) * 100}%`,
                top: 0,
                width: 2,
                height: '100%',
                backgroundColor: 'var(--mantine-color-red-6)',
                zIndex: 2
              }}
            />
            
            {/* Event markers */}
            {sortedEvents.map(event => (
              <Tooltip key={event.id} label={`${event.title} - ${formatTimestamp(event.timestamp)}`}>
                <Box
                  style={{
                    position: 'absolute',
                    left: `${getTimePosition(event.timestamp)}%`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${getEventColor(event)}-6)`,
                    cursor: 'pointer',
                    zIndex: 1,
                    border: '2px solid white'
                  }}
                  onClick={() => {
                    const eventTime = (event.timestamp.getTime() - (events[0]?.timestamp.getTime() || 0)) / 1000;
                    onSeek?.(eventTime);
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Timeline events list */}
        <Box
          ref={timelineRef}
          style={{
            maxHeight: compact ? 300 : 500,
            overflowY: 'auto',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left'
          }}
        >
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {sortedEvents.map((event, index) => (
              <Timeline.Item
                key={event.id}
                bullet={
                  <ThemeIcon
                    size={24}
                    variant="light"
                    color={getEventColor(event)}
                  >
                    {getEventIcon(event)}
                  </ThemeIcon>
                }
                title={
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {event.title}
                      </Text>
                      
                      {event.aiGenerated && (
                        <Badge size="xs" color="blue" variant="light">
                          AI
                        </Badge>
                      )}
                      
                      {event.confidence !== undefined && (
                        <Badge size="xs" color="gray" variant="outline">
                          {Math.round(event.confidence * 100)}%
                        </Badge>
                      )}
                    </Group>
                    
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(event.timestamp)}
                      </Text>
                      
                      {allowApproval && event.aiGenerated && !event.approved && !event.rejected && (
                        <Group gap={2}>
                          <ActionIcon
                            size="xs"
                            color="green"
                            variant="light"
                            onClick={() => handleApprove(event)}
                          >
                            <IconCheck size={12} />
                          </ActionIcon>
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="light"
                            onClick={() => handleReject(event)}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>
                  </Group>
                }
                data-current-time={isLive && Math.abs(event.timestamp.getTime() - Date.now()) < 5000}
              >
                <Stack gap="xs">
                  {event.description && (
                    <Text size="sm" c="dimmed">
                      {event.description}
                    </Text>
                  )}
                  
                  {event.userName && (
                    <Group gap="xs">
                      <Avatar size="xs" src={event.userAvatar}>
                        {event.userName.charAt(0)}
                      </Avatar>
                      <Text size="xs" c="dimmed">
                        {event.userName}
                      </Text>
                    </Group>
                  )}
                  
                  {event.tags && event.tags.length > 0 && (
                    <Group gap="xs">
                      {event.tags.map(tag => (
                        <Badge key={tag} size="xs" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        </Box>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <Box ta="center" py="xl">
            <ThemeIcon size="xl" variant="light" color="gray" mx="auto" mb="md">
              <IconClock size={24} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              No timeline events match your current filters
            </Text>
            <Button
              variant="light"
              size="xs"
              mt="sm"
              onClick={() => updateFilters({
                showAIEvents: true,
                showUserEvents: true,
                showSystemEvents: true,
                minConfidence: 0,
                eventTypes: Object.values(TimelineEventType),
                users: []
              })}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
