/**
 * React Timeline Editor Component
 * 
 * Proof-of-concept implementation using @xzdarcy/react-timeline-editor
 * for RPG Scribe timeline visualization.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Timeline, TimelineAction, TimelineRow } from '@xzdarcy/react-timeline-editor';
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
  Select
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
  IconSettings,
  IconClock,
  IconWorld
} from '@tabler/icons-react';
import { useTimeline } from '../../contexts/TimelineContext';
import { TimelineComponentProps, RPGTimelineEvent } from '../../types/timeline.types';
import {
  TimelineEditorAdapter,
  RPGTimelineAction,
  RPGTimelineEffect,
  RPGTimelineEditorConfig,
  EntityRowConfig
} from '../../adapters/timelineEditorAdapter';
import { EntityType } from '../../models/EntityType';
import { AdvancedConflictDetectionService } from '../../services/advancedConflictDetection.service';
import { VisualRelationshipMapping } from './VisualRelationshipMapping';
import { ConflictManagementPanel } from './ConflictManagementPanel';
import {
  TimelineConflict,
  ConflictDetectionResult,
  EventRelationship,
  ConflictNotification
} from '../../types/timelineConflict.types';

/**
 * React Timeline Editor Component Props
 */
interface ReactTimelineEditorProps extends Omit<TimelineComponentProps, 'config'> {
  config?: RPGTimelineEditorConfig;
  height?: number;
  enableDualTimeline?: boolean;
  enableEntityRows?: boolean;
  enableHierarchicalGrouping?: boolean;
  enableEntityFiltering?: boolean;
  enableConflictDetection?: boolean;
  enableVisualRelationships?: boolean;
  showControls?: boolean;
  showConflictPanel?: boolean;
  entities?: { [entityType: string]: any[] };
}

/**
 * React Timeline Editor Component
 */
export function ReactTimelineEditor({
  config = {},
  height = 400,
  enableDualTimeline = true,
  enableEntityRows = true,
  enableHierarchicalGrouping = true,
  enableEntityFiltering = true,
  enableConflictDetection = true,
  enableVisualRelationships = true,
  showControls = true,
  showConflictPanel = false,
  entities = {},
  onEventClick,
  onEventEdit,
  onEventCreate,
  onEventDelete,
  onTimeRangeChange,
  className,
  style
}: ReactTimelineEditorProps) {
  const { state, actions } = useTimeline();

  // Memoize adapter creation to prevent recreation on every render
  const adapter = useMemo(() => new TimelineEditorAdapter(config), [config.worldId, config.campaignId]);
  const [showRealWorld, setShowRealWorld] = useState(true);
  const [showInGame, setShowInGame] = useState(true);
  const [selectedAction, setSelectedAction] = useState<RPGTimelineAction | null>(null);
  const [timelineScale, setTimelineScale] = useState(1);
  const [entityRows, setEntityRows] = useState<EntityRowConfig[]>([]);
  const [hiddenEntityTypes, setHiddenEntityTypes] = useState<EntityType[]>([]);
  const [hiddenEntities, setHiddenEntities] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // Conflict detection state
  const [conflictDetectionService] = useState(() => new AdvancedConflictDetectionService());
  const [conflicts, setConflicts] = useState<TimelineConflict[]>([]);
  const [relationships, setRelationships] = useState<EventRelationship[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<TimelineConflict | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | undefined>();
  const [showRelationships, setShowRelationships] = useState(enableVisualRelationships);
  const [conflictDetectionEnabled, setConflictDetectionEnabled] = useState(enableConflictDetection);
  const [timelineContainerRef, setTimelineContainerRef] = useState<HTMLElement | null>(null);

  // Load events when component mounts
  useEffect(() => {
    actions.loadEvents();
  }, [actions]);

  // Run conflict detection when events change
  useEffect(() => {
    if (conflictDetectionEnabled && state.events && state.events.length > 0) {
      conflictDetectionService.detectConflicts(state.events).then((result: ConflictDetectionResult) => {
        setConflicts(result.conflicts);
        setRelationships(result.relationships);
      }).catch(console.error);
    } else {
      setConflicts([]);
      setRelationships([]);
    }
  }, [state.events, conflictDetectionEnabled, conflictDetectionService]);

  // Subscribe to conflict notifications
  useEffect(() => {
    const unsubscribe = conflictDetectionService.onNotification((notification: ConflictNotification) => {
      console.log('Conflict notification:', notification);
      // Here you could show toast notifications or update UI
    });

    return unsubscribe;
  }, [conflictDetectionService]);

  // Memoize adapter config to prevent unnecessary updates
  const adapterConfig = useMemo(() => ({
    ...config,
    height,
    showRealWorldTime: showRealWorld,
    showInGameTime: showInGame,
    dualTimelineMode: enableDualTimeline,
    enableEntityRows,
    enableHierarchicalGrouping,
    enableEntityFiltering,
    enableCrossRowSynchronization: true,
    enableVisualRelationships: true,
    collapsedGroups,
    hiddenEntityTypes,
    hiddenEntities
  }), [
    config.worldId,
    config.campaignId,
    config.entityId,
    config.entityType,
    height,
    showRealWorld,
    showInGame,
    enableDualTimeline,
    enableEntityRows,
    enableHierarchicalGrouping,
    enableEntityFiltering,
    collapsedGroups,
    hiddenEntityTypes,
    hiddenEntities
  ]);

  // Update adapter config when memoized config changes (debounced to prevent flickering)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      adapter.updateConfig(adapterConfig);
    }, 100); // 100ms debounce to prevent rapid updates

    return () => clearTimeout(timeoutId);
  }, [adapter, adapterConfig]);

  // Convert events to timeline editor format
  const timelineData = useMemo(() => {
    if (!state.events || state.events.length === 0) {
      return {
        rows: [],
        effects: {},
        entityRows: []
      };
    }

    if (enableEntityRows) {
      const result = adapter.convertEventsToEntityBasedTimelineData(state.events, entities);
      setEntityRows(result.entityRows);
      return result;
    } else {
      const result = adapter.convertEventsToTimelineData(state.events);
      return {
        ...result,
        entityRows: []
      };
    }
  }, [adapter, state.events, entities, enableEntityRows]);

  // Filter rows based on visibility settings and entity filtering
  const visibleRows = useMemo(() => {
    return timelineData.rows.filter(row => {
      // Handle meta timeline rows
      if (row.id === 'real-world') return showRealWorld;
      if (row.id === 'in-game') return showInGame;

      // Handle entity rows
      if (enableEntityRows) {
        const entityRow = entityRows.find(er => er.id === row.id);
        if (entityRow) {
          // Check if entity type is hidden
          if (hiddenEntityTypes.includes(entityRow.entityType)) return false;

          // Check if specific entity is hidden
          if (entityRow.entityId && hiddenEntities.includes(entityRow.entityId)) return false;

          // Check if parent group is collapsed
          if (entityRow.groupId && collapsedGroups.includes(entityRow.groupId)) return false;

          return entityRow.visible !== false;
        }
      }

      return true;
    });
  }, [timelineData.rows, showRealWorld, showInGame, enableEntityRows, entityRows, hiddenEntityTypes, hiddenEntities, collapsedGroups]);

  /**
   * Handle action selection
   */
  const handleActionSelect = useCallback((action: TimelineAction) => {
    const rpgAction = action as RPGTimelineAction;
    setSelectedAction(rpgAction);
    onEventClick?.(rpgAction.rpgEventId);
  }, [onEventClick]);

  /**
   * Handle action edit
   */
  const handleActionEdit = useCallback((action: TimelineAction) => {
    const rpgAction = action as RPGTimelineAction;
    onEventEdit?.(rpgAction.rpgEventId);
  }, [onEventEdit]);

  /**
   * Handle action delete
   */
  const handleActionDelete = useCallback((action: TimelineAction) => {
    const rpgAction = action as RPGTimelineAction;
    onEventDelete?.(rpgAction.rpgEventId);
  }, [onEventDelete]);

  /**
   * Handle timeline time change
   */
  const handleTimeChange = useCallback((start: number, end: number) => {
    onTimeRangeChange?.(new Date(start * 1000), new Date(end * 1000));
  }, [onTimeRangeChange]);

  /**
   * Handle create new event
   */
  const handleCreateEvent = useCallback(() => {
    onEventCreate?.({
      title: 'New Event',
      startDate: new Date(),
      importance: 5,
      eventType: 'custom',
      worldId: '',
      campaignId: '',
      playerVisible: true,
      createdBy: 'current-user'
    });
  }, [onEventCreate]);

  /**
   * Handle refresh timeline
   */
  const handleRefresh = useCallback(() => {
    actions.loadEvents();
  }, [actions]);

  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    setTimelineScale(prev => Math.min(prev * 1.5, 10));
  }, []);

  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    setTimelineScale(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  /**
   * Handle entity type visibility toggle
   */
  const handleEntityTypeToggle = useCallback((entityType: EntityType) => {
    setHiddenEntityTypes(prev =>
      prev.includes(entityType)
        ? prev.filter(type => type !== entityType)
        : [...prev, entityType]
    );
  }, []);

  /**
   * Handle group collapse toggle
   */
  const handleGroupToggle = useCallback((groupId: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  /**
   * Handle show all entities
   */
  const handleShowAllEntities = useCallback(() => {
    setHiddenEntityTypes([]);
    setHiddenEntities([]);
    setCollapsedGroups([]);
  }, []);

  /**
   * Handle hide all entities
   */
  const handleHideAllEntities = useCallback(() => {
    const allEntityTypes = Object.values(EntityType).filter(type =>
      type !== EntityType.EVENT // Don't hide the meta timeline rows
    );
    setHiddenEntityTypes(allEntityTypes);
  }, []);

  /**
   * Handle conflict selection
   */
  const handleConflictSelect = useCallback((conflict: TimelineConflict) => {
    setSelectedConflict(conflict);
    // Highlight affected events
    if (conflict.affectedEvents.length > 0) {
      setHighlightedEventId(conflict.affectedEvents[0]);
    }
  }, []);

  /**
   * Handle conflict resolution
   */
  const handleConflictResolve = useCallback((conflictId: string) => {
    console.log('Resolving conflict:', conflictId);
    // This would implement actual conflict resolution logic
    // For now, just remove from the list
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  /**
   * Handle send to AI proposal system
   */
  const handleSendToAI = useCallback((conflictId: string) => {
    console.log('Sending conflict to AI proposal system:', conflictId);
    // This would integrate with future AI Brain service
    // For now, just show a placeholder message
    alert('AI Proposal System integration coming soon! This conflict has been queued for AI analysis.');
  }, []);

  /**
   * Handle relationship hover
   */
  const handleRelationshipHover = useCallback((relationship: EventRelationship | null) => {
    if (relationship) {
      setHighlightedEventId(relationship.sourceEventId);
    } else {
      setHighlightedEventId(undefined);
    }
  }, []);

  /**
   * Handle relationship click
   */
  const handleRelationshipClick = useCallback((relationship: EventRelationship) => {
    console.log('Relationship clicked:', relationship);
    // This could open a relationship details modal
  }, []);

  /**
   * Handle refresh conflicts
   */
  const handleRefreshConflicts = useCallback(() => {
    if (state.events && state.events.length > 0) {
      conflictDetectionService.detectConflicts(state.events).then((result: ConflictDetectionResult) => {
        setConflicts(result.conflicts);
        setRelationships(result.relationships);
      }).catch(console.error);
    }
  }, [state.events, conflictDetectionService]);

  /**
   * Handle export conflicts
   */
  const handleExportConflicts = useCallback(() => {
    const data = {
      conflicts,
      relationships,
      exportedAt: new Date().toISOString(),
      metrics: conflictDetectionService.getMetrics()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-conflicts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conflicts, relationships, conflictDetectionService]);

  if (state.loading) {
    return (
      <Paper p="md" withBorder style={style} className={className}>
        <Center h={height}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Loading timeline...</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  if (state.error) {
    return (
      <Paper p="md" withBorder style={style} className={className}>
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          title="Timeline Error" 
          color="red"
        >
          {state.error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder style={style} className={className}>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendarEvent size="24" />
          <Title order={3}>RPG Timeline</Title>
          <Badge color="blue" variant="light">
            {state.events?.length || 0} events
          </Badge>
        </Group>

        {showControls && (
          <Group>
            <Tooltip label="Refresh Timeline">
              <ActionIcon variant="light" onClick={handleRefresh}>
                <IconRefresh size="16" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom In">
              <ActionIcon variant="light" onClick={handleZoomIn}>
                <IconZoomIn size="16" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom Out">
              <ActionIcon variant="light" onClick={handleZoomOut}>
                <IconZoomOut size="16" />
              </ActionIcon>
            </Tooltip>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateEvent}
              size="sm"
            >
              Add Event
            </Button>
          </Group>
        )}
      </Group>

      {/* Timeline Controls */}
      <Stack gap="md" mb="md">
        {enableDualTimeline && (
          <Group>
            <Switch
              checked={showRealWorld}
              onChange={(event) => setShowRealWorld(event.currentTarget.checked)}
              label="Real World Timeline"
              aria-label="Toggle real world timeline visibility"
              aria-describedby="real-world-timeline-desc"
            />
            <Text id="real-world-timeline-desc" size="xs" c="dimmed" style={{ display: 'none' }}>
              Show or hide events on the real-world timeline
            </Text>
            <Switch
              checked={showInGame}
              onChange={(event) => setShowInGame(event.currentTarget.checked)}
              label="In-Game Timeline"
              aria-label="Toggle in-game timeline visibility"
              aria-describedby="in-game-timeline-desc"
            />
            <Text id="in-game-timeline-desc" size="xs" c="dimmed" style={{ display: 'none' }}>
              Show or hide events on the in-game timeline
            </Text>
          </Group>
        )}

        {/* Entity Filtering Controls */}
        {enableEntityFiltering && enableEntityRows && (
          <Group>
            <Text size="sm" fw={500}>Entity Filters:</Text>
            <Button
              size="xs"
              variant="light"
              onClick={handleShowAllEntities}
            >
              Show All
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={handleHideAllEntities}
            >
              Hide All
            </Button>
            {Object.values(EntityType)
              .filter(type => type !== EntityType.EVENT)
              .map(entityType => (
                <Button
                  key={entityType}
                  size="xs"
                  variant={hiddenEntityTypes.includes(entityType) ? "outline" : "filled"}
                  color={hiddenEntityTypes.includes(entityType) ? "gray" : "blue"}
                  onClick={() => handleEntityTypeToggle(entityType)}
                >
                  {entityType.replace('_', ' ')}
                </Button>
              ))
            }
          </Group>
        )}

        {/* Conflict Detection Controls */}
        {enableConflictDetection && (
          <Group>
            <Text size="sm" fw={500}>Conflict Detection:</Text>
            <Switch
              checked={conflictDetectionEnabled}
              onChange={(event) => setConflictDetectionEnabled(event.currentTarget.checked)}
              label="Enable Detection"
              aria-label="Enable conflict detection system"
              aria-describedby="conflict-detection-desc"
            />
            <Text id="conflict-detection-desc" size="xs" c="dimmed" style={{ display: 'none' }}>
              Automatically detect conflicts between timeline events
            </Text>
            <Switch
              checked={showRelationships}
              onChange={(event) => setShowRelationships(event.currentTarget.checked)}
              label="Show Relationships"
              aria-label="Show visual relationship lines between events"
              aria-describedby="relationships-desc"
            />
            <Text id="relationships-desc" size="xs" c="dimmed" style={{ display: 'none' }}>
              Display connection lines showing relationships between events
            </Text>
            <Badge color="red" variant="light">
              {conflicts.length} conflicts
            </Badge>
            <Badge color="blue" variant="light">
              {relationships.length} relationships
            </Badge>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconRefresh size={14} />}
              onClick={handleRefreshConflicts}
            >
              Refresh
            </Button>
          </Group>
        )}
      </Stack>

      {/* Timeline Editor */}
      <Group align="flex-start" gap="md" style={{ height: height - 120 }}>
        {/* Main Timeline Container */}
        <Box
          style={{
            flex: showConflictPanel ? 2 : 1,
            height: '100%',
            position: 'relative'
          }}
          ref={setTimelineContainerRef}
        >
          {visibleRows.length > 0 ? (
            <>
              <Timeline
                editorData={visibleRows}
                effects={timelineData.effects}
                scale={timelineScale}
                style={{
                  height: '100%',
                  width: '100%'
                }}
              />

              {/* Visual Relationship Mapping Overlay */}
              {enableVisualRelationships && showRelationships && (
                <VisualRelationshipMapping
                  relationships={relationships}
                  actions={visibleRows.flatMap(row => row.actions as RPGTimelineAction[])}
                  timelineContainer={timelineContainerRef}
                  visible={showRelationships}
                  highlightedEventId={highlightedEventId}
                  onRelationshipHover={handleRelationshipHover}
                  onRelationshipClick={handleRelationshipClick}
                />
              )}
            </>
          ) : (
            <Center h="100%">
              <Stack align="center">
                <IconCalendarEvent size={48} color="gray" />
                <Text c="dimmed">No timeline data to display</Text>
                <Text size="sm" c="dimmed">
                  {!showRealWorld && !showInGame
                    ? 'Enable at least one timeline view above'
                    : 'Create your first timeline event to get started'
                  }
                </Text>
                {(showRealWorld || showInGame) && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateEvent}
                    variant="light"
                  >
                    Create First Event
                  </Button>
                )}
              </Stack>
            </Center>
          )}
        </Box>

        {/* Conflict Management Panel */}
        {showConflictPanel && enableConflictDetection && (
          <Box style={{ flex: 1, height: '100%' }}>
            <ConflictManagementPanel
              conflicts={conflicts}
              loading={state.loading}
              onConflictSelect={handleConflictSelect}
              onConflictResolve={handleConflictResolve}
              onSendToAI={handleSendToAI}
              onRefresh={handleRefreshConflicts}
              onExport={handleExportConflicts}
            />
          </Box>
        )}
      </Group>

      {/* Selected Action Info */}
      {selectedAction && (
        <Box mt="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
          <Group justify="space-between">
            <Group>
              <Badge color="blue">{selectedAction.eventType}</Badge>
              <Text fw={500}>Importance: {selectedAction.importance}/10</Text>
              {selectedAction.participants && selectedAction.participants.length > 0 && (
                <Badge variant="outline">
                  {selectedAction.participants.length} participants
                </Badge>
              )}
            </Group>
            <Group>
              <ActionIcon 
                variant="light" 
                onClick={() => handleActionEdit(selectedAction)}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="light" 
                color="red"
                onClick={() => handleActionDelete(selectedAction)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
          {selectedAction.description && (
            <Text size="sm" mt="xs" c="dimmed">
              {selectedAction.description}
            </Text>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default ReactTimelineEditor;
