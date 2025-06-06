/**
 * Dual Timeline Context
 * Provides state management for the dual timeline system
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { addDays, subDays } from 'date-fns';
import {
  DualTimelineState,
  DualTimelineActions,
  DualTimelineUtils,
  DualTimelineContextValue,
  DualTimelineConfig,
  DualTimelineEvent,
  TimelineConnection,
  TimelineConflict,
  ConflictResolution,
  TimelineSyncEvent
} from '../types/dualTimeline.types';
import { TimeConversionService, createDefaultTimeConversion } from '../services/timeConversion.service';
import { TimelineService } from '../services/timeline.service';

/**
 * Dual timeline action types
 */
type DualTimelineAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EVENTS'; payload: DualTimelineEvent[] }
  | { type: 'ADD_EVENT'; payload: DualTimelineEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<DualTimelineEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_CONNECTIONS'; payload: TimelineConnection[] }
  | { type: 'ADD_CONNECTION'; payload: TimelineConnection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SELECT_EVENT'; payload: string }
  | { type: 'SELECT_CONNECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_TIME_RANGE'; payload: { start: Date; end: Date; timeline: 'real-world' | 'in-game' } }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_CONFLICTS'; payload: TimelineConflict[] }
  | { type: 'UPDATE_CONFIG'; payload: Partial<DualTimelineConfig> }
  | { type: 'SYNC_TIMELINES'; payload: TimelineSyncEvent };

/**
 * Initial dual timeline state
 */
const createInitialState = (): DualTimelineState => {
  const now = new Date();
  const start = subDays(now, 30);
  const end = addDays(now, 30);

  return {
    events: [],
    connections: [],
    selectedEvents: [],
    selectedConnections: [],
    realWorldTimeRange: { start, end },
    inGameTimeRange: { start, end },
    zoomLevel: 1,
    conflicts: [],
    gaps: [],
    loading: false,
    error: null
  };
};

/**
 * Dual timeline reducer
 */
function dualTimelineReducer(state: DualTimelineState, action: DualTimelineAction): DualTimelineState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_EVENTS':
      return { ...state, events: action.payload, loading: false };

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id
            ? { ...event, ...action.payload.updates }
            : event
        )
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        selectedEvents: state.selectedEvents.filter(id => id !== action.payload)
      };

    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };

    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== action.payload),
        selectedConnections: state.selectedConnections.filter(id => id !== action.payload)
      };

    case 'SELECT_EVENT':
      return {
        ...state,
        selectedEvents: state.selectedEvents.includes(action.payload)
          ? state.selectedEvents.filter(id => id !== action.payload)
          : [...state.selectedEvents, action.payload]
      };

    case 'SELECT_CONNECTION':
      return {
        ...state,
        selectedConnections: state.selectedConnections.includes(action.payload)
          ? state.selectedConnections.filter(id => id !== action.payload)
          : [...state.selectedConnections, action.payload]
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedEvents: [],
        selectedConnections: []
      };

    case 'SET_TIME_RANGE':
      if (action.payload.timeline === 'real-world') {
        return {
          ...state,
          realWorldTimeRange: { start: action.payload.start, end: action.payload.end }
        };
      } else {
        return {
          ...state,
          inGameTimeRange: { start: action.payload.start, end: action.payload.end }
        };
      }

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.payload };

    case 'SET_CONFLICTS':
      return { ...state, conflicts: action.payload };

    case 'SYNC_TIMELINES':
      // Handle timeline synchronization
      return handleTimelineSync(state, action.payload);

    default:
      return state;
  }
}

/**
 * Handle timeline synchronization
 */
function handleTimelineSync(state: DualTimelineState, syncEvent: TimelineSyncEvent): DualTimelineState {
  // Implementation will depend on the specific sync event type
  // For now, return state unchanged
  return state;
}

/**
 * Dual Timeline Context
 */
const DualTimelineContext = createContext<DualTimelineContextValue | null>(null);

/**
 * Dual Timeline Provider Props
 */
interface DualTimelineProviderProps {
  children: ReactNode;
  config: DualTimelineConfig;
}

/**
 * Dual Timeline Provider
 */
export function DualTimelineProvider({ children, config }: DualTimelineProviderProps) {
  const [state, dispatch] = useReducer(dualTimelineReducer, createInitialState());

  // Add provider instance logging to debug context mismatch
  const providerInstanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  console.log('🏭 DualTimelineProvider instance:', {
    providerInstanceId,
    config: {
      worldId: config.worldId,
      campaignId: config.campaignId,
      displayMode: config.displayMode
    },
    stateEventsCount: state.events.length,
    stateLoading: state.loading,
    dispatchFunction: typeof dispatch
  });

  // Memoize time conversion service to prevent recreation
  const timeConversionService = useMemo(() =>
    new TimeConversionService(config.timeConversion),
    [config.timeConversion]
  );

  /**
   * Load events from the backend
   */
  const loadEvents = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!config.worldId || !config.campaignId) {
        throw new Error('World ID and Campaign ID are required');
      }

      const timelineService = new TimelineService(config.worldId, config.campaignId);
      const entries = await timelineService.getTimelineEntries({ sortBy: 'sequence', sortDirection: 'asc' });

      const loadedEvents: DualTimelineEvent[] = entries.map((entry) => {
        const realTime = new Date(entry.dualTimestamp.realWorldTime || new Date());
        const inGameTime = new Date(entry.dualTimestamp.inGameTime || realTime);
        return {
          id: entry.id || '',
          title: entry.title,
          description: entry.summary,
          startDate: inGameTime,
          endDate: undefined,
          importance: entry.importance || 5,
          eventType: (entry.entryType as any) || 'custom',
          entityId: entry.associatedEntityId,
          entityType: entry.associatedEntityType as any,
          worldId: config.worldId!,
          campaignId: config.campaignId!,
          tags: entry.tags || [],
          participants: entry.participants,
          location: entry.locationId,
          gmNotes: undefined,
          playerVisible: !(entry.isSecret ?? false),
          createdAt: new Date(entry.createdAt || realTime),
          updatedAt: new Date(entry.updatedAt || realTime),
          createdBy: entry.createdBy || 'system',
          realWorldStartDate: realTime,
          realWorldEndDate: undefined,
          inGameStartDate: inGameTime,
          inGameEndDate: undefined,
          connectionColor: undefined,
          realWorldGroup: 'default',
          inGameGroup: 'default',
        } as DualTimelineEvent;
      });

      dispatch({ type: 'SET_EVENTS', payload: loadedEvents });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load events' });
    }
  }, [config.worldId, config.campaignId]);

  /**
   * Create a new event
   */
  const createEvent = useCallback(async (event: Partial<DualTimelineEvent>, timeline: 'real-world' | 'in-game') => {
    try {
      // Convert times between timelines
      let realWorldStartDate: Date;
      let inGameStartDate: Date;

      if (timeline === 'real-world') {
        realWorldStartDate = event.startDate!;
        inGameStartDate = timeConversionService.realToInGame(realWorldStartDate);
      } else {
        inGameStartDate = event.startDate!;
        realWorldStartDate = timeConversionService.inGameToReal(inGameStartDate);
      }

      const newEvent: DualTimelineEvent = {
        ...event,
        id: event.id || `event-${Date.now()}`,
        realWorldStartDate,
        inGameStartDate,
        startDate: timeline === 'real-world' ? realWorldStartDate : inGameStartDate,
        realWorldEndDate: event.endDate ? (timeline === 'real-world' ? event.endDate : timeConversionService.inGameToReal(event.endDate)) : undefined,
        inGameEndDate: event.endDate ? (timeline === 'in-game' ? event.endDate : timeConversionService.realToInGame(event.endDate)) : undefined,
        endDate: event.endDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as DualTimelineEvent;

      dispatch({ type: 'ADD_EVENT', payload: newEvent });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create event' });
    }
  }, [timeConversionService]);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (eventId: string, updates: Partial<DualTimelineEvent>) => {
    try {
      dispatch({ type: 'UPDATE_EVENT', payload: { id: eventId, updates } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update event' });
    }
  }, []);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete event' });
    }
  }, []);

  /**
   * Create a connection between events
   */
  const createConnection = useCallback(async (connection: Partial<TimelineConnection>) => {
    try {
      const newConnection: TimelineConnection = {
        ...connection,
        id: connection.id || `connection-${Date.now()}`
      } as TimelineConnection;

      dispatch({ type: 'ADD_CONNECTION', payload: newConnection });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create connection' });
    }
  }, []);

  /**
   * Delete a connection
   */
  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      dispatch({ type: 'DELETE_CONNECTION', payload: connectionId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete connection' });
    }
  }, []);

  /**
   * Select an event
   */
  const selectEvent = useCallback((eventId: string, timeline?: 'real-world' | 'in-game') => {
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
  }, []);

  /**
   * Select a connection
   */
  const selectConnection = useCallback((connectionId: string) => {
    dispatch({ type: 'SELECT_CONNECTION', payload: connectionId });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  /**
   * Set time range for a timeline
   */
  const setTimeRange = useCallback((start: Date, end: Date, timeline: 'real-world' | 'in-game') => {
    dispatch({ type: 'SET_TIME_RANGE', payload: { start, end, timeline } });
  }, []);

  /**
   * Set zoom level
   */
  const setZoomLevel = useCallback((level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level });
  }, []);

  /**
   * Synchronize timelines
   */
  const syncTimelines = useCallback((event: TimelineSyncEvent) => {
    dispatch({ type: 'SYNC_TIMELINES', payload: event });
  }, []);

  // Create utilities object (moved before callbacks that use it)
  const utils: DualTimelineUtils = useMemo(() => ({
    transformToRealWorldItems: (events) => events.map(event => ({
      id: event.id,
      title: event.title,
      start_time: event.realWorldStartDate.getTime(),
      end_time: event.realWorldEndDate?.getTime() || event.realWorldStartDate.getTime(),
      group: event.realWorldGroup || 'default'
    })),
    transformToInGameItems: (events) => events.map(event => ({
      id: event.id,
      title: event.title,
      start_time: event.inGameStartDate.getTime(),
      end_time: event.inGameEndDate?.getTime() || event.inGameStartDate.getTime(),
      group: event.inGameGroup || 'default'
    })),
    transformToGroups: (events, timeline) => [
      { id: 'default', title: timeline === 'real-world' ? 'Real World Events' : 'In-Game Events' }
    ],
    convertEventTime: (event, fromTimeline, toTimeline) => {
      if (fromTimeline === toTimeline) {
        return fromTimeline === 'real-world' ? event.realWorldStartDate : event.inGameStartDate;
      }
      return fromTimeline === 'real-world'
        ? timeConversionService.realToInGame(event.realWorldStartDate)
        : timeConversionService.inGameToReal(event.inGameStartDate);
    },
    filterEvents: (events, filters) => {
      if (!filters) return events;
      return events.filter(event => {
        if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) {
          return false;
        }
        if (filters.entities && event.entityId && !filters.entities.includes(event.entityId)) {
          return false;
        }
        if (filters.tags && event.tags) {
          const hasTag = filters.tags.some((t: string) => event.tags!.includes(t));
          if (!hasTag) return false;
        }
        if (typeof filters.playerVisible === 'boolean' && event.playerVisible !== filters.playerVisible) {
          return false;
        }
        if (filters.dateRange) {
          const target = filters.timeline === 'real-world' ? event.realWorldStartDate : event.inGameStartDate;
          if (target < filters.dateRange.start || target > filters.dateRange.end) {
            return false;
          }
        }
        return true;
      });
    },
    sortEvents: (events, timeline) => events.sort((a, b) => {
      const aTime = timeline === 'real-world' ? a.realWorldStartDate : a.inGameStartDate;
      const bTime = timeline === 'real-world' ? b.realWorldStartDate : b.inGameStartDate;
      return aTime.getTime() - bTime.getTime();
    }),
    detectEventOverlaps: (events, timeline) => {
      const conflicts: TimelineConflict[] = [];
      const sorted = [...events].sort((a, b) =>
        (timeline === 'real-world' ? a.realWorldStartDate.getTime() : a.inGameStartDate.getTime()) -
        (timeline === 'real-world' ? b.realWorldStartDate.getTime() : b.inGameStartDate.getTime())
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const currEnd = timeline === 'real-world'
          ? curr.realWorldEndDate || curr.realWorldStartDate
          : curr.inGameEndDate || curr.inGameStartDate;
        for (let j = i + 1; j < sorted.length; j++) {
          const next = sorted[j];
          const nextStart = timeline === 'real-world' ? next.realWorldStartDate : next.inGameStartDate;
          if (currEnd > nextStart) {
            conflicts.push({
              id: `overlap-${curr.id}-${next.id}-${timeline}`,
              type: 'overlap',
              severity: 'medium',
              events: [curr.id, next.id],
              timeline,
              description: `Events "${curr.title}" and "${next.title}" overlap on ${timeline} timeline`,
              suggestions: [],
              autoResolvable: false,
              resolved: false
            });
          } else {
            break;
          }
        }
      }
      return conflicts;
    },
    detectChronologicalIssues: (events) => {
      const conflicts: TimelineConflict[] = [];
      const sorted = [...events].sort((a, b) => a.realWorldStartDate.getTime() - b.realWorldStartDate.getTime());
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.inGameStartDate < prev.inGameStartDate) {
          conflicts.push({
            id: `chronological-${prev.id}-${curr.id}`,
            type: 'chronological',
            severity: 'low',
            events: [prev.id, curr.id],
            timeline: 'both',
            description: `In-game time of "${curr.title}" occurs before "${prev.title}" but after in real-world order`,
            suggestions: [],
            autoResolvable: false,
            resolved: false
          });
        }
      }
      return conflicts;
    },
    findConnectedEvents: (eventId, events, connections) => {
      const relatedConnections = connections.filter(conn =>
        conn.fromEventId === eventId || conn.toEventId === eventId
      );
      const relatedEventIds = relatedConnections.flatMap(conn => [conn.fromEventId, conn.toEventId]);
      return events.filter(event => relatedEventIds.includes(event.id) && event.id !== eventId);
    },
    validateConnection: (connection, events) => {
      const fromEvent = events.find(e => e.id === connection.fromEventId);
      const toEvent = events.find(e => e.id === connection.toEventId);
      return !!(fromEvent && toEvent);
    }
  }), [timeConversionService]);

  /**
   * Detect conflicts in the timeline
   */
  const detectConflicts = useCallback(async () => {
    try {
      const overlapsReal = utils.detectEventOverlaps(state.events, 'real-world');
      const overlapsGame = utils.detectEventOverlaps(state.events, 'in-game');
      const chrono = utils.detectChronologicalIssues(state.events);
      dispatch({ type: 'SET_CONFLICTS', payload: [...overlapsReal, ...overlapsGame, ...chrono] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to detect conflicts' });
    }
  }, [state.events, utils]);

  /**
   * Resolve a conflict
   */
  const resolveConflict = useCallback(async (conflictId: string, resolution: ConflictResolution) => {
    try {
      resolution.eventChanges.forEach(change => {
        dispatch({ type: 'UPDATE_EVENT', payload: { id: change.eventId, updates: change.changes } });
      });

      const updatedConflicts = state.conflicts.map(conflict =>
        conflict.id === conflictId ? { ...conflict, resolved: true } : conflict
      );
      dispatch({ type: 'SET_CONFLICTS', payload: updatedConflicts });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to resolve conflict' });
    }
  }, [state.conflicts]);

  /**
   * Dismiss a conflict
   */
  const dismissConflict = useCallback((conflictId: string) => {
    const updatedConflicts = state.conflicts.filter(conflict => conflict.id !== conflictId);
    dispatch({ type: 'SET_CONFLICTS', payload: updatedConflicts });
  }, [state.conflicts]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<DualTimelineConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  }, []);

  /**
   * Toggle synchronization option
   */
  const toggleSync = useCallback((syncType: keyof typeof config.syncOptions) => {
    const newSyncOptions = {
      ...config.syncOptions,
      [syncType]: !config.syncOptions[syncType]
    };
    updateConfig({ syncOptions: newSyncOptions });
  }, [config.syncOptions, updateConfig]);

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Create actions object
  const actions: DualTimelineActions = {
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createConnection,
    deleteConnection,
    selectEvent,
    selectConnection,
    clearSelection,
    setTimeRange,
    setZoomLevel,
    syncTimelines,
    detectConflicts,
    resolveConflict,
    dismissConflict,
    updateConfig,
    toggleSync
  };

  // Memoize context value to prevent provider re-instantiation
  const contextValue = useMemo((): DualTimelineContextValue => ({
    state,
    actions,
    utils
  }), [state, actions, utils]);

  return (
    <DualTimelineContext.Provider value={contextValue}>
      {children}
    </DualTimelineContext.Provider>
  );
}

/**
 * Hook to use dual timeline context
 */
export function useDualTimeline(): DualTimelineContextValue {
  const context = useContext(DualTimelineContext);
  if (!context) {
    throw new Error('useDualTimeline must be used within a DualTimelineProvider');
  }
  return context;
}
