/**
 * Dual Timeline Visualization Component
 * True dual-axis timeline with synchronized real-world and in-game timelines
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import Timeline, {
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
  Switch,
  Divider,
  Menu,
  SimpleGrid
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconRefresh,
  IconPlus,
  IconZoomIn,
  IconZoomOut,
  IconLink,
  IconAlertTriangle,
  IconSettings,
  IconEye,
  IconEyeOff,
  IconChartBar,
  IconDownload,
  IconFileText,
  IconTable,
  IconMarkdown
} from '@tabler/icons-react';
import { DualTimelineVisualizationProps, DualTimelineDisplayMode } from '../../types/dualTimeline.types';
import { TimeConversionService, createDefaultTimeConversion } from '../../services/timeConversion.service';
import { timelineDataIntegration, TimelineDataContext, TimelineEventData } from '../../services/timelineDataIntegration.service';
import { timelineConflictDetection, TimelineConflict } from '../../services/timelineConflictDetection.service';
import { timelineAnalytics, TimelineMetrics } from '../../services/timelineAnalytics.service';
import { timelineExport, ExportOptions } from '../../services/timelineExport.service';

/**
 * Mock dual timeline event for demonstration
 */
interface MockDualTimelineEvent {
  id: string;
  title: string;
  description?: string;
  realWorldStartDate: Date;
  realWorldEndDate?: Date;
  inGameStartDate: Date;
  inGameEndDate?: Date;
  realWorldGroup: string;
  inGameGroup: string;
  connectionColor?: string;
}

/**
 * Dual Timeline Visualization Component
 * Displays two synchronized timelines for real-world and in-game time
 */
export function DualTimelineVisualization({
  config,
  worldId,
  campaignId,
  sessionId,
  entityFilter,
  timeRange,
  onEventClick,
  onEventEdit,
  onEventCreate,
  onEventDelete,
  onEventMove,
  onConnectionCreate,
  onConnectionDelete,
  onTimeRangeChange,
  onZoomChange,
  onSyncToggle,
  onConflictResolve,
  onConflictDismiss,
  onFixParticipants,
  className,
  style
}: DualTimelineVisualizationProps) {

  // Timeline refs for synchronization
  const realWorldTimelineRef = useRef<any>(null);
  const inGameTimelineRef = useRef<any>(null);

  // Create default config if not provided
  const timelineConfig = useMemo(() => {
    if (config) return config;

    return {
      worldId: worldId || 'default-world',
      campaignId: campaignId || 'default-campaign',
      sessionId: sessionId,
      height: 400,
      enableEditing: true,
      showMarkers: true,
      showMetrics: false,
      displayMode: 'dual' as DualTimelineDisplayMode,
      syncOptions: {
        syncScrolling: true,
        syncZoom: true,
        showConnections: true
      },
      realWorldConfig: {
        timeFormat: '24h',
        dateFormat: 'YYYY-MM-DD',
        showWeekends: true,
        workingHours: { start: 9, end: 17 }
      },
      inGameConfig: {
        calendar: 'gregorian',
        timeScale: 1,
        epochYear: 1420,
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      },
      theme: {
        primaryColor: '#1c7ed6',
        secondaryColor: '#51cf66',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        gridColor: '#e9ecef'
      }
    };
  }, [config, worldId, campaignId, sessionId]);

  // Component state
  const [displayMode, setDisplayMode] = useState<DualTimelineDisplayMode>(timelineConfig.displayMode);
  const [syncScrolling, setSyncScrolling] = useState(timelineConfig.syncOptions.syncScrolling);
  const [syncZoom, setSyncZoom] = useState(timelineConfig.syncOptions.syncZoom);
  const [showConnections, setShowConnections] = useState(timelineConfig.syncOptions.showConnections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real timeline data
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>([]);
  const [useRealData, setUseRealData] = useState(true);

  // Advanced features state
  const [conflicts, setConflicts] = useState<TimelineConflict[]>([]);
  const [metrics, setMetrics] = useState<TimelineMetrics | null>(null);
  const [showConflictIndicators, setShowConflictIndicators] = useState(true);
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Time conversion service
  const [timeConversionService] = useState(() => createDefaultTimeConversion());

  // Load real timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      if (!useRealData || !timelineConfig.worldId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const context: TimelineDataContext = {
          worldId: timelineConfig.worldId,
          campaignId: timelineConfig.campaignId
        };

        const events = await timelineDataIntegration.loadTimelineEvents(context);
        setTimelineEvents(events);

        // Run conflict detection with hierarchical logic
        if (events.length > 0) {
          const detectedConflicts = timelineConflictDetection.detectConflicts(events, {
            checkOverlaps: true,
            checkLogical: true,
            checkCharacters: true,
            checkLocations: true,
            overlapThreshold: 30,
            includeLowSeverity: true,
            // Enable hierarchical detection to separate real-world from in-game conflicts
            enableHierarchicalDetection: true,
            realWorldConflictsOnly: false // Check both timelines but with different logic
          });
          setConflicts(detectedConflicts);

          // Generate analytics metrics
          const analyticsMetrics = timelineAnalytics.generateMetrics(events, detectedConflicts);
          setMetrics(analyticsMetrics);
        }
      } catch (err) {
        console.error('Error loading timeline data:', err);
        setError('Failed to load timeline data');
        // Don't change useRealData here to prevent infinite loop
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, [timelineConfig.worldId, timelineConfig.campaignId]); // Removed useRealData from dependencies

  // Mock data for demonstration
  const [mockEvents] = useState<MockDualTimelineEvent[]>([
    {
      id: 'event-1',
      title: 'Campaign Start',
      description: 'The adventure begins in a tavern',
      realWorldStartDate: new Date('2024-01-15T19:00:00Z'),
      realWorldEndDate: new Date('2024-01-15T22:00:00Z'),
      inGameStartDate: new Date('1422-05-15T18:00:00Z'),
      inGameEndDate: new Date('1422-05-15T21:00:00Z'),
      realWorldGroup: 'sessions',
      inGameGroup: 'events',
      connectionColor: '#1c7ed6'
    },
    {
      id: 'event-2',
      title: 'First Battle',
      description: 'Heroes face goblins in the forest',
      realWorldStartDate: new Date('2024-01-22T19:30:00Z'),
      realWorldEndDate: new Date('2024-01-22T21:00:00Z'),
      inGameStartDate: new Date('1422-05-16T10:00:00Z'),
      inGameEndDate: new Date('1422-05-16T11:30:00Z'),
      realWorldGroup: 'sessions',
      inGameGroup: 'events',
      connectionColor: '#e64980'
    }
  ]);

  // Transform events for timeline display
  const eventsToUse = useRealData && timelineEvents.length > 0 ? timelineEvents : mockEvents;

  const realWorldItems = (useRealData && timelineEvents.length > 0
    ? timelineEvents.filter(event => event.timeline === 'real-world' || event.timeline === 'in-game').map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.realWorldTime.getTime(),
        end_time: event.realWorldTime.getTime() + (2 * 60 * 60 * 1000), // Default 2 hour duration
        group: 'sessions'
      }))
    : mockEvents.map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.realWorldStartDate.getTime(),
        end_time: event.realWorldEndDate?.getTime() || event.realWorldStartDate.getTime(),
        group: event.realWorldGroup
      }))
  );

  const inGameItems = (useRealData && timelineEvents.length > 0
    ? timelineEvents.filter(event => event.timeline === 'in-game' || event.timeline === 'real-world').map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.inGameTime.getTime(),
        end_time: event.inGameTime.getTime() + (2 * 60 * 60 * 1000), // Default 2 hour duration
        group: 'events'
      }))
    : mockEvents.map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.inGameStartDate.getTime(),
        end_time: event.inGameEndDate?.getTime() || event.inGameStartDate.getTime(),
        group: event.inGameGroup
      }))
  );

  const realWorldGroups = [
    { id: 'sessions', title: 'Real World Sessions' }
  ];

  const inGameGroups = [
    { id: 'events', title: 'In-Game Events' }
  ];

  /**
   * Handle time change in real-world timeline
   */
  const handleRealWorldTimeChange = useCallback((visibleTimeStart: number, visibleTimeEnd: number) => {
    const start = new Date(visibleTimeStart);
    const end = new Date(visibleTimeEnd);

    onTimeRangeChange?.(start, end, 'real-world');

    // Sync with in-game timeline if enabled
    if (syncScrolling && inGameTimelineRef.current) {
      // Convert real-world time to in-game time for synchronization
      const convertedStart = timeConversionService.realToInGame(start);
      const convertedEnd = timeConversionService.realToInGame(end);

      // Update in-game timeline view
      inGameTimelineRef.current.updateScrollCanvas(
        convertedStart.getTime(),
        convertedEnd.getTime()
      );
    }
  }, [onTimeRangeChange, syncScrolling, timeConversionService]);

  /**
   * Handle time change in in-game timeline
   */
  const handleInGameTimeChange = useCallback((visibleTimeStart: number, visibleTimeEnd: number) => {
    const start = new Date(visibleTimeStart);
    const end = new Date(visibleTimeEnd);

    onTimeRangeChange?.(start, end, 'in-game');

    // Sync with real-world timeline if enabled
    if (syncScrolling && realWorldTimelineRef.current) {
      // Convert in-game time to real-world time for synchronization
      const convertedStart = timeConversionService.inGameToReal(start);
      const convertedEnd = timeConversionService.inGameToReal(end);

      // Update real-world timeline view
      realWorldTimelineRef.current.updateScrollCanvas(
        convertedStart.getTime(),
        convertedEnd.getTime()
      );
    }
  }, [onTimeRangeChange, syncScrolling, timeConversionService]);

  /**
   * Handle event selection
   */
  const handleEventSelect = useCallback((itemId: string | number, timeline: 'real-world' | 'in-game') => {
    const eventId = String(itemId);
    onEventClick?.(eventId, timeline);
  }, [onEventClick]);

  /**
   * Handle event double-click for editing
   */
  const handleEventDoubleClick = useCallback((itemId: string | number) => {
    const eventId = String(itemId);
    onEventEdit?.(eventId);
  }, [onEventEdit]);

  /**
   * Handle canvas double-click for creating new events
   */
  const handleCanvasDoubleClick = useCallback((group: any, time: number, timeline: 'real-world' | 'in-game') => {
    const eventTime = new Date(time);
    onEventCreate?.({
      startDate: eventTime,
      title: 'New Event',
      eventType: 'custom'
    } as any, timeline);
  }, [onEventCreate]);

  /**
   * Toggle display mode
   */
  const toggleDisplayMode = useCallback(() => {
    const modes: DualTimelineDisplayMode[] = ['dual', 'real-world', 'in-game'];
    const currentIndex = modes.indexOf(displayMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setDisplayMode(nextMode);
  }, [displayMode]);

  /**
   * Toggle synchronization options
   */
  const handleSyncToggle = useCallback((syncType: 'syncScrolling' | 'syncZoom' | 'showConnections', enabled: boolean) => {
    switch (syncType) {
      case 'syncScrolling':
        setSyncScrolling(enabled);
        break;
      case 'syncZoom':
        setSyncZoom(enabled);
        break;
      case 'showConnections':
        setShowConnections(enabled);
        break;
    }
    onSyncToggle?.(syncType, enabled);
  }, [onSyncToggle]);

  /**
   * Refresh timeline data
   */
  const handleRefresh = useCallback(() => {
    // For now, just trigger a re-render
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  /**
   * Export timeline functionality
   */
  const handleExportTimeline = useCallback(async (format: 'json' | 'csv' | 'markdown') => {
    if (timelineEvents.length === 0) {
      setError('No timeline data to export');
      return;
    }

    setExportLoading(true);
    try {
      const exportOptions: ExportOptions = {
        format,
        includeMetrics: true,
        includeConflicts: true,
        includeAnalytics: true,
        customization: {
          title: `${timelineConfig.worldId} Timeline Export`,
          description: `Dual timeline export for campaign ${timelineConfig.campaignId}`,
          theme: 'light',
          showLegend: true,
          showGrid: true
        }
      };

      const result = await timelineExport.exportTimeline(
        timelineEvents,
        exportOptions,
        metrics || undefined,
        conflicts
      );

      if (result.success) {
        timelineExport.downloadExport(result);
      } else {
        setError(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export timeline');
    } finally {
      setExportLoading(false);
    }
  }, [timelineEvents, timelineConfig.worldId, timelineConfig.campaignId, metrics, conflicts]);

  /**
   * Toggle metrics panel
   */
  const handleToggleMetrics = useCallback(() => {
    setShowMetricsPanel(!showMetricsPanel);
  }, [showMetricsPanel]);

  /**
   * Toggle conflict indicators
   */
  const handleToggleConflictIndicators = useCallback(() => {
    setShowConflictIndicators(!showConflictIndicators);
  }, [showConflictIndicators]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Timeline Error" icon={<IconAlertTriangle size={16} />}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper p="md" className={className} style={style}>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <div>
          <Title order={3}>Dual Timeline System</Title>
          <Text size="sm" c="dimmed">
            Synchronized real-world and in-game timeline visualization
          </Text>
        </div>

        <Group>
          {/* Conflict Indicator */}
          {conflicts.length > 0 && (
            <Badge
              color="orange"
              variant="light"
              leftSection={<IconAlertTriangle size={12} />}
              style={{ cursor: 'pointer' }}
              onClick={handleToggleConflictIndicators}
            >
              {conflicts.length} Conflicts
            </Badge>
          )}

          {/* Metrics Indicator */}
          {metrics && (
            <Badge
              color="blue"
              variant="light"
              leftSection={<IconChartBar size={12} />}
              style={{ cursor: 'pointer' }}
              onClick={handleToggleMetrics}
            >
              Analytics
            </Badge>
          )}

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Tooltip label="Export Timeline">
                <ActionIcon variant="light">
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Export Format</Menu.Label>
              <Menu.Item
                leftSection={<IconFileText size={14} />}
                onClick={() => handleExportTimeline('json')}
                disabled={exportLoading}
              >
                JSON
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTable size={14} />}
                onClick={() => handleExportTimeline('csv')}
                disabled={exportLoading}
              >
                CSV
              </Menu.Item>
              <Menu.Item
                leftSection={<IconMarkdown size={14} />}
                onClick={() => handleExportTimeline('markdown')}
                disabled={exportLoading}
              >
                Markdown
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Tooltip label="Refresh Timeline">
            <ActionIcon variant="light" onClick={handleRefresh}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Toggle Display Mode">
            <Button variant="light" size="xs" onClick={toggleDisplayMode}>
              {displayMode === 'dual' ? 'Dual View' :
               displayMode === 'real-world' ? 'Real World' : 'In-Game'}
            </Button>
          </Tooltip>
        </Group>
      </Group>

      {/* Controls */}
      <Group mb="md">
        <Switch
          label="Sync Scrolling"
          checked={syncScrolling}
          onChange={(event) => handleSyncToggle('syncScrolling', event.currentTarget.checked)}
        />
        <Switch
          label="Sync Zoom"
          checked={syncZoom}
          onChange={(event) => handleSyncToggle('syncZoom', event.currentTarget.checked)}
        />
        <Switch
          label="Show Connections"
          checked={showConnections}
          onChange={(event) => handleSyncToggle('showConnections', event.currentTarget.checked)}
        />
        <Switch
          label="Show Conflicts"
          checked={showConflictIndicators}
          onChange={(event) => setShowConflictIndicators(event.currentTarget.checked)}
          color="orange"
        />
      </Group>

      {/* Timeline Display */}
      <Stack gap="md">
        {/* Real World Timeline */}
        {(displayMode === 'dual' || displayMode === 'real-world') && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm">Real World Timeline</Text>
              <Badge color="blue" size="sm">
                {realWorldItems.length} events
              </Badge>
            </Group>

            <Box style={{ height: timelineConfig.height / (displayMode === 'dual' ? 2 : 1) }}>
              <Timeline
                ref={realWorldTimelineRef}
                groups={realWorldGroups}
                items={realWorldItems}
                defaultTimeStart={dayjs().subtract(1, 'month').valueOf()}
                defaultTimeEnd={dayjs().add(1, 'month').valueOf()}
                onTimeChange={handleRealWorldTimeChange}
                onItemSelect={(itemId: string) => handleEventSelect(itemId, 'real-world')}
                onItemDoubleClick={handleEventDoubleClick}
                onCanvasDoubleClick={(group: any, time: number) => handleCanvasDoubleClick(group, time, 'real-world')}
                canMove={timelineConfig.enableEditing}
                canResize={timelineConfig.enableEditing ? 'both' : false}
                stackItems={true}
                itemHeightRatio={0.75}
                lineHeight={50}
                sidebarWidth={120}
                rightSidebarWidth={0}
                buffer={3}
              >
                {timelineConfig.showMarkers && (
                  <TimelineMarkers>
                    <TodayMarker>
                      {({ styles }: { styles: any }) => (
                        <div style={{ ...styles, backgroundColor: '#1c7ed6', width: '2px' }} />
                      )}
                    </TodayMarker>
                  </TimelineMarkers>
                )}
              </Timeline>
            </Box>
          </Box>
        )}

        {/* Divider for dual view */}
        {displayMode === 'dual' && (
          <Divider label="Timeline Synchronization" labelPosition="center" />
        )}

        {/* In-Game Timeline */}
        {(displayMode === 'dual' || displayMode === 'in-game') && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm">In-Game Timeline</Text>
              <Badge color="green" size="sm">
                {inGameItems.length} events
              </Badge>
            </Group>

            <Box style={{ height: timelineConfig.height / (displayMode === 'dual' ? 2 : 1) }}>
              <Timeline
                ref={inGameTimelineRef}
                groups={inGameGroups}
                items={inGameItems}
                defaultTimeStart={dayjs('1422-05-01').valueOf()}
                defaultTimeEnd={dayjs('1422-06-01').valueOf()}
                onTimeChange={handleInGameTimeChange}
                onItemSelect={(itemId: string) => handleEventSelect(itemId, 'in-game')}
                onItemDoubleClick={handleEventDoubleClick}
                onCanvasDoubleClick={(group: any, time: number) => handleCanvasDoubleClick(group, time, 'in-game')}
                canMove={timelineConfig.enableEditing}
                canResize={timelineConfig.enableEditing ? 'both' : false}
                stackItems={true}
                itemHeightRatio={0.75}
                lineHeight={50}
                sidebarWidth={120}
                rightSidebarWidth={0}
                buffer={3}
              >
                {timelineConfig.showMarkers && (
                  <TimelineMarkers>
                    <TodayMarker>
                      {({ styles }: { styles: any }) => (
                        <div style={{ ...styles, backgroundColor: '#51cf66', width: '2px' }} />
                      )}
                    </TodayMarker>
                  </TimelineMarkers>
                )}
              </Timeline>
            </Box>
          </Box>
        )}
      </Stack>

      {/* Connection Visualization Overlay */}
      {showConnections && displayMode === 'dual' && mockEvents.length > 0 && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <svg style={{ width: '100%', height: '100%' }}>
            {mockEvents.map(event => (
              <line
                key={event.id}
                x1="50%"
                y1="25%"
                x2="50%"
                y2="75%"
                stroke={event.connectionColor || '#868e96'}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity={0.6}
              />
            ))}
          </svg>
        </Box>
      )}

      {/* Metrics Panel */}
      {showMetricsPanel && metrics && (
        <Paper p="md" mt="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Timeline Analytics</Title>
            <ActionIcon variant="subtle" onClick={handleToggleMetrics}>
              <IconEyeOff size={16} />
            </ActionIcon>
          </Group>

          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="md">
            <div>
              <Text size="xs" c="dimmed">Total Events</Text>
              <Text size="lg" fw={700}>{metrics.totalEvents}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Real World Span</Text>
              <Text size="sm">{Math.round(metrics.timeSpan.realWorld.duration / (24 * 60 * 60 * 1000))} days</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Event Density</Text>
              <Text size="sm">{metrics.eventDensity.realWorld.toFixed(2)}/day</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Health Score</Text>
              <Text size="lg" fw={700} c={timelineAnalytics.calculateHealthScore(metrics) > 70 ? 'green' : 'orange'}>
                {timelineAnalytics.calculateHealthScore(metrics)}%
              </Text>
            </div>
          </SimpleGrid>

          {metrics.participantActivity.length > 0 && (
            <div>
              <Text size="sm" fw={500} mb="xs">Top Participants</Text>
              <Group gap="xs">
                {metrics.participantActivity.slice(0, 5).map(participant => (
                  <Badge key={participant.participantId} variant="light" size="sm">
                    {participant.participantId}: {participant.eventCount} events
                  </Badge>
                ))}
              </Group>
            </div>
          )}
        </Paper>
      )}

      {/* Conflicts Panel */}
      {showConflictIndicators && conflicts.length > 0 && (
        <Paper p="md" mt="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Timeline Conflicts</Title>
            <Group>
              <Badge color="orange" variant="light">
                {conflicts.length} issues
              </Badge>
              {onFixParticipants && (
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  onClick={onFixParticipants}
                  leftSection={<IconSettings size={12} />}
                >
                  Fix Participants
                </Button>
              )}
            </Group>
          </Group>

          <Stack gap="sm">
            {conflicts.slice(0, 5).map(conflict => (
              <Alert
                key={conflict.id}
                color={conflict.severity === 'critical' ? 'red' : conflict.severity === 'high' ? 'orange' : 'yellow'}
                title={conflict.title}
                icon={<IconAlertTriangle size={16} />}
              >
                <Text size="sm">{conflict.description}</Text>
                {conflict.suggestions.length > 0 && (
                  <div>
                    <Text size="xs" fw={500} mt="xs">Suggestions:</Text>
                    <Text size="xs" c="dimmed">{conflict.suggestions[0]}</Text>
                  </div>
                )}
              </Alert>
            ))}

            {conflicts.length > 5 && (
              <Text size="xs" c="dimmed" ta="center">
                And {conflicts.length - 5} more conflicts...
              </Text>
            )}
          </Stack>
        </Paper>
      )}
    </Paper>
  );
}


