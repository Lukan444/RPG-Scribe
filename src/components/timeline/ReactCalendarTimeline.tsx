import React, { useCallback, useEffect, useRef, useState } from 'react';
import Timeline, { 
  TimelineHeaders, 
  SidebarHeader, 
  DateHeader,
  TimelineMarkers,
  TodayMarker,
  CustomMarker
} from 'react-calendar-timeline';
import dayjs from 'dayjs';
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
  Alert,
  Modal
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
  IconEye,
  IconAlertTriangle,
  IconSettings
} from '@tabler/icons-react';
import { useTimeline } from '../../contexts/TimelineContext';
import { TimelineComponentProps, RPGTimelineEvent } from '../../types/timeline.types';
import { TimelineEventModal } from './TimelineEventModal';
import 'react-calendar-timeline/dist/style.css';

/**
 * React Calendar Timeline Component
 * Production-ready timeline visualization for RPG Scribe
 */
export function ReactCalendarTimeline({
  config,
  onEventClick,
  onEventEdit,
  onEventCreate,
  onEventDelete,
  onTimeRangeChange,
  className,
  style
}: TimelineComponentProps) {
  const { state, actions, utils } = useTimeline();
  const timelineRef = useRef<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RPGTimelineEvent | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Load events when component mounts or config changes
  useEffect(() => {
    actions.loadEvents();
  }, [actions, config.worldId, config.campaignId, config.entityId]);

  // Update timeline config when props change
  useEffect(() => {
    actions.setConfig(config);
  }, [actions, config]);

  // Transform events to timeline format with safety checks
  const timelineItems = utils.transformToTimelineItems(state.events || []);
  const timelineGroups = utils.transformToTimelineGroups(state.events || []);

  // Ensure we have valid timeline data
  const safeTimelineGroups = timelineGroups.length > 0 ? timelineGroups : [{
    id: 'default',
    title: 'Events',
    stackItems: true,
    height: 60
  }];

  const safeTimelineItems = timelineItems || [];

  /**
   * Handle item selection
   */
  const handleItemSelect = useCallback((itemId: string | number) => {
    const eventId = String(itemId);
    actions.selectEvent(eventId);
    onEventClick?.(eventId);
  }, [actions, onEventClick]);

  /**
   * Handle item double click for editing
   */
  const handleItemDoubleClick = useCallback((itemId: string | number) => {
    const eventId = String(itemId);
    const event = state.events.find(e => e.id === eventId);
    if (event) {
      setEditingEvent(event);
      setModalMode('edit');
      setShowEventModal(true);
      onEventEdit?.(eventId);
    }
  }, [state.events, onEventEdit]);

  /**
   * Handle canvas double click for creating new events
   */
  const handleCanvasDoubleClick = useCallback((group: string | number, time: number) => {
    const clickTime = dayjs(time).toDate();
    setEditingEvent({
      id: '',
      title: '',
      description: '',
      startDate: clickTime,
      importance: 5,
      eventType: 'custom',
      worldId: config.worldId || '',
      campaignId: config.campaignId || 'default',
      entityId: config.entityId,
      entityType: config.entityType,
      playerVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    } as RPGTimelineEvent);
    setModalMode('create');
    setShowEventModal(true);
  }, [config]);

  /**
   * Handle item move (drag and drop)
   */
  const handleItemMove = useCallback((itemId: string | number, dragTime: number, newGroupOrder: number) => {
    if (!config.enableEditing) return;

    const eventId = String(itemId);
    const newStartTime = dayjs(dragTime).toDate();
    
    actions.updateEvent(eventId, {
      startDate: newStartTime
    });
  }, [actions, config.enableEditing]);

  /**
   * Handle item resize
   */
  const handleItemResize = useCallback((itemId: string | number, time: number, edge: 'left' | 'right') => {
    if (!config.enableEditing) return;

    const eventId = String(itemId);
    const newTime = dayjs(time).toDate();
    
    if (edge === 'left') {
      actions.updateEvent(eventId, {
        startDate: newTime
      });
    } else {
      actions.updateEvent(eventId, {
        endDate: newTime
      });
    }
  }, [actions, config.enableEditing]);

  /**
   * Handle time range change
   */
  const handleTimeChange = useCallback((visibleTimeStart: number, visibleTimeEnd: number) => {
    const startDate = dayjs(visibleTimeStart).toDate();
    const endDate = dayjs(visibleTimeEnd).toDate();
    
    actions.setVisibleTime(startDate, endDate);
    onTimeRangeChange?.(startDate, endDate);
  }, [actions, onTimeRangeChange]);

  /**
   * Handle zoom controls
   */
  const handleZoomIn = useCallback(() => {
    const currentRange = state.visibleTimeEnd.getTime() - state.visibleTimeStart.getTime();
    const newRange = currentRange * 0.5;
    const center = state.visibleTimeStart.getTime() + currentRange / 2;
    
    const newStart = new Date(center - newRange / 2);
    const newEnd = new Date(center + newRange / 2);
    
    actions.setVisibleTime(newStart, newEnd);
  }, [state.visibleTimeStart, state.visibleTimeEnd, actions]);

  const handleZoomOut = useCallback(() => {
    const currentRange = state.visibleTimeEnd.getTime() - state.visibleTimeStart.getTime();
    const newRange = currentRange * 2;
    const center = state.visibleTimeStart.getTime() + currentRange / 2;
    
    const newStart = new Date(center - newRange / 2);
    const newEnd = new Date(center + newRange / 2);
    
    actions.setVisibleTime(newStart, newEnd);
  }, [state.visibleTimeStart, state.visibleTimeEnd, actions]);

  const handleFitToEvents = useCallback(() => {
    if (state.events.length === 0) return;

    const dates = state.events.flatMap(event => [
      event.startDate,
      ...(event.endDate ? [event.endDate] : [])
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add some padding
    const padding = (maxDate.getTime() - minDate.getTime()) * 0.1;
    const paddedStart = new Date(minDate.getTime() - padding);
    const paddedEnd = new Date(maxDate.getTime() + padding);

    actions.setVisibleTime(paddedStart, paddedEnd);
  }, [state.events, actions]);

  /**
   * Handle event creation/editing
   */
  const handleEventSave = useCallback(async (eventData: Partial<RPGTimelineEvent>) => {
    try {
      if (modalMode === 'create') {
        await actions.createEvent(eventData as Omit<RPGTimelineEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
        onEventCreate?.(eventData);
      } else if (editingEvent) {
        await actions.updateEvent(editingEvent.id, eventData);
      }
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }, [modalMode, editingEvent, actions, onEventCreate]);

  /**
   * Handle event deletion
   */
  const handleEventDelete = useCallback(async (eventId: string) => {
    try {
      await actions.deleteEvent(eventId);
      onEventDelete?.(eventId);
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }, [actions, onEventDelete]);

  /**
   * Create new event
   */
  const handleCreateEvent = useCallback(() => {
    const now = new Date();
    setEditingEvent({
      id: '',
      title: '',
      description: '',
      startDate: now,
      importance: 5,
      eventType: 'custom',
      worldId: config.worldId || '',
      campaignId: config.campaignId || 'default',
      entityId: config.entityId,
      entityType: config.entityType,
      playerVisible: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current-user'
    } as RPGTimelineEvent);
    setModalMode('create');
    setShowEventModal(true);
  }, [config]);

  if (state.loading) {
    return (
      <Paper p="md" withBorder style={style} className={className}>
        <Center h={config.height || 400}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Loading timeline...</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder style={style} className={className}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Box>
            <Title order={3}>{config.title || 'Timeline'}</Title>
            {config.description && (
              <Text c="dimmed" size="sm">{config.description}</Text>
            )}
          </Box>

          {config.showControls && (
            <Group>
              <Tooltip label="Refresh Timeline">
                <ActionIcon variant="light" onClick={actions.loadEvents}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Zoom In">
                <ActionIcon variant="light" onClick={handleZoomIn}>
                  <IconZoomIn size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Zoom Out">
                <ActionIcon variant="light" onClick={handleZoomOut}>
                  <IconZoomOut size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Fit to Events">
                <ActionIcon variant="light" onClick={handleFitToEvents}>
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>
              {config.enableEditing && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleCreateEvent}
                  size="sm"
                >
                  Add Event
                </Button>
              )}
            </Group>
          )}
        </Group>

        {/* Error Alert */}
        {state.error && (
          <Alert icon={<IconAlertTriangle size="1rem" />} title="Warning" color="yellow" variant="light">
            <Text>{state.error}</Text>
            <Text size="sm" c="dimmed" mt="xs">Some features may not work correctly</Text>
          </Alert>
        )}

        {/* Timeline */}
        <Box className="react-calendar-timeline-container">
          <Timeline
            ref={timelineRef}
            groups={safeTimelineGroups}
            items={safeTimelineItems}
            defaultTimeStart={dayjs(state.visibleTimeStart).valueOf()}
            defaultTimeEnd={dayjs(state.visibleTimeEnd).valueOf()}
            visibleTimeStart={dayjs(state.visibleTimeStart).valueOf()}
            visibleTimeEnd={dayjs(state.visibleTimeEnd).valueOf()}
            onTimeChange={handleTimeChange}
            onItemSelect={handleItemSelect}
            onItemDoubleClick={handleItemDoubleClick}
            onCanvasDoubleClick={handleCanvasDoubleClick}
            onItemMove={config.enableEditing ? handleItemMove : undefined}
            onItemResize={config.enableEditing ? handleItemResize : undefined}
            canMove={config.enableEditing}
            canResize={config.enableEditing ? 'both' : false}
            canSelect={true}
            stackItems={true}
            itemHeightRatio={0.75}
            lineHeight={60}
            sidebarWidth={150}
            rightSidebarWidth={0}
            dragSnap={15 * 60 * 1000} // 15 minutes
            minResizeWidth={30 * 60 * 1000} // 30 minutes
            buffer={3}
          >
            {config.showMarkers && (
              <TimelineMarkers>
                <TodayMarker>
                  {({ styles, date }) => (
                    <div style={{ ...styles, backgroundColor: '#e64980', width: '2px' }} />
                  )}
                </TodayMarker>
              </TimelineMarkers>
            )}
          </Timeline>
        </Box>

        {/* Selected Event Info */}
        {state.selectedEvent && (
          <Paper p="sm" withBorder bg="gray.0">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Selected: {state.events.find(e => e.id === state.selectedEvent)?.title}
              </Text>
              <Group>
                {config.enableEditing && (
                  <>
                    <ActionIcon 
                      size="sm" 
                      variant="light" 
                      onClick={() => {
                        const event = state.events.find(e => e.id === state.selectedEvent);
                        if (event) {
                          setEditingEvent(event);
                          setModalMode('edit');
                          setShowEventModal(true);
                        }
                      }}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon 
                      size="sm" 
                      variant="light" 
                      color="red" 
                      onClick={() => state.selectedEvent && handleEventDelete(state.selectedEvent)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </>
                )}
              </Group>
            </Group>
          </Paper>
        )}
      </Stack>

      {/* Event Modal */}
      <TimelineEventModal
        opened={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        mode={modalMode}
        onSave={handleEventSave}
        onDelete={modalMode === 'edit' ? handleEventDelete : undefined}
      />
    </Paper>
  );
}
