import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  TimelineState,
  TimelineAction,
  TimelineConfig,
  RPGTimelineEvent,
  TimelineItem,
  TimelineGroup,
  TimelineFilter,
  UseTimelineReturn
} from '../types/timeline.types';
import { TimelineService } from '../services/timeline.service';
import { EntityType } from '../models/EntityType';

/**
 * Initial Timeline State
 */
const initialState: TimelineState = {
  events: [],
  groups: [],
  items: [],
  loading: false,
  error: null,
  selectedEvent: null,
  visibleTimeStart: dayjs().subtract(6, 'month').toDate(),
  visibleTimeEnd: dayjs().add(6, 'month').toDate(),
  config: {
    height: 400,
    showControls: true,
    enableEditing: true,
    showMarkers: true,
    groupBy: 'entity',

  }
};

/**
 * Timeline Reducer
 */
function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_EVENTS':
      return { 
        ...state, 
        events: action.payload,
        loading: false,
        error: null
      };
    
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload]
      };
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id
            ? { ...event, ...action.payload.updates, updatedAt: new Date() }
            : event
        )
      };
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        selectedEvent: state.selectedEvent === action.payload ? null : state.selectedEvent
      };
    
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    
    case 'SET_VISIBLE_TIME':
      return {
        ...state,
        visibleTimeStart: action.payload.start,
        visibleTimeEnd: action.payload.end
      };
    
    case 'SET_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

/**
 * Timeline Context
 */
const TimelineContext = createContext<UseTimelineReturn | null>(null);

/**
 * Timeline Provider Props
 */
interface TimelineProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<TimelineConfig>;
}

/**
 * Timeline Provider Component
 */
export function TimelineProvider({ children, initialConfig }: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, {
    ...initialState,
    config: { ...initialState.config, ...initialConfig }
  });

  // Timeline service instance
  const timelineService = useMemo(() => {
    if (state.config.worldId) {
      return new TimelineService(state.config.worldId, state.config.campaignId || 'default');
    }
    return null;
  }, [state.config.worldId, state.config.campaignId]);

  /**
   * Transform RPG events to timeline items
   */
  const transformToTimelineItems = useCallback((events: RPGTimelineEvent[]): TimelineItem[] => {
    return events.map(event => {
      // Determine group ID based on groupBy setting
      let groupId: string;
      switch (state.config.groupBy) {
        case 'entity':
          groupId = event.entityId || 'ungrouped';
          break;
        case 'type':
          groupId = event.eventType;
          break;
        case 'importance':
          const importanceLevel = event.importance >= 8 ? 'high' : event.importance >= 5 ? 'medium' : 'low';
          groupId = importanceLevel;
          break;
        default:
          groupId = 'default';
      }

      return {
        id: event.id,
        group: groupId,
        title: event.title,
        start_time: dayjs(event.startDate),
        end_time: event.endDate ? dayjs(event.endDate) : dayjs(event.startDate).add(1, 'hour'),
        canMove: state.config.enableEditing,
        canResize: state.config.enableEditing && !!event.endDate,
        canChangeGroup: false,
        className: `timeline-event-${event.eventType} importance-${event.importance}`,
        style: {
          backgroundColor: getEventColor(event.eventType, event.importance),
          borderColor: getEventBorderColor(event.eventType),
          opacity: event.playerVisible ? 1 : 0.7
        },
        itemProps: {
          'data-event-id': event.id,
          'data-event-type': event.eventType,
          'data-importance': event.importance,
          title: `${event.title}\n${event.description || ''}\nImportance: ${event.importance}/10`
        }
      };
    });
  }, [state.config.enableEditing, state.config.groupBy]);

  /**
   * Transform events to timeline groups
   */
  const transformToTimelineGroups = useCallback((events: RPGTimelineEvent[]): TimelineGroup[] => {
    const groupMap = new Map<string, TimelineGroup>();

    // Always ensure we have at least one default group
    const defaultGroup: TimelineGroup = {
      id: 'default',
      title: 'Events',
      stackItems: true,
      height: 60
    };

    if (events.length === 0) {
      return [defaultGroup];
    }

    events.forEach(event => {
      let groupId: string;
      let groupTitle: string;

      switch (state.config.groupBy) {
        case 'entity':
          groupId = event.entityId || 'ungrouped';
          groupTitle = event.entityId ? `Entity ${event.entityId}` : 'Ungrouped Events';
          break;
        case 'type':
          groupId = event.eventType;
          groupTitle = event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1);
          break;
        case 'importance':
          const importanceLevel = event.importance >= 8 ? 'high' : event.importance >= 5 ? 'medium' : 'low';
          groupId = importanceLevel;
          groupTitle = `${importanceLevel.charAt(0).toUpperCase() + importanceLevel.slice(1)} Importance`;
          break;
        default:
          groupId = 'default';
          groupTitle = 'Events';
      }

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          title: groupTitle,
          stackItems: true,
          height: 60
        });
      }
    });

    const groups = Array.from(groupMap.values());
    return groups.length > 0 ? groups : [defaultGroup];
  }, [state.config.groupBy]);

  /**
   * Filter events based on criteria
   */
  const filterEvents = useCallback((events: RPGTimelineEvent[], filter: TimelineFilter): RPGTimelineEvent[] => {
    return events.filter(event => {
      // Event type filter
      if (filter.eventTypes && !filter.eventTypes.includes(event.eventType)) {
        return false;
      }

      // Importance filter
      if (filter.importance) {
        if (event.importance < filter.importance.min || event.importance > filter.importance.max) {
          return false;
        }
      }

      // Entity filter
      if (filter.entities && event.entityId && !filter.entities.includes(event.entityId)) {
        return false;
      }

      // Tags filter
      if (filter.tags && event.tags) {
        const hasMatchingTag = filter.tags.some(tag => event.tags!.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Player visibility filter
      if (filter.playerVisible !== undefined && event.playerVisible !== filter.playerVisible) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const eventStart = new Date(event.startDate);
        if (eventStart < filter.dateRange.start || eventStart > filter.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, []);

  /**
   * Sort events by start date
   */
  const sortEvents = useCallback((events: RPGTimelineEvent[]): RPGTimelineEvent[] => {
    return [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, []);

  /**
   * Load timeline events
   */
  const loadEvents = useCallback(async () => {
    if (!timelineService) {
      dispatch({ type: 'SET_ERROR', payload: 'Timeline service not available' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const entries = await timelineService.getTimelineEntries();
      
      // Convert timeline entries to RPG events (simplified for now)
      const events: RPGTimelineEvent[] = entries.map(entry => ({
        id: entry.id || `event-${Date.now()}`,
        title: entry.title,
        description: entry.description,
        startDate: entry.position.inGameTimestamp || entry.position.realWorldTimestamp || new Date(),
        endDate: undefined, // TODO: Calculate from duration
        importance: entry.importance || 5,
        eventType: 'custom' as const,
        worldId: state.config.worldId || '',
        campaignId: state.config.campaignId || 'default',
        playerVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user' // TODO: Get from auth context
      }));

      dispatch({ type: 'SET_EVENTS', payload: events });
    } catch (error) {
      console.error('Error loading timeline events:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load timeline events' });
    }
  }, [timelineService, state.config.worldId, state.config.campaignId]);

  /**
   * Create new event
   */
  const createEvent = useCallback(async (eventData: Omit<RPGTimelineEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newEvent: RPGTimelineEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user' // TODO: Get from auth context
    };

    dispatch({ type: 'ADD_EVENT', payload: newEvent });

    // TODO: Persist to backend
    try {
      // await timelineService.createEvent(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      // Rollback optimistic update
      dispatch({ type: 'DELETE_EVENT', payload: newEvent.id });
      throw error;
    }
  }, []);

  /**
   * Update existing event
   */
  const updateEvent = useCallback(async (id: string, updates: Partial<RPGTimelineEvent>) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } });

    // TODO: Persist to backend
    try {
      // await timelineService.updateEvent(id, updates);
    } catch (error) {
      console.error('Error updating event:', error);
      // TODO: Rollback optimistic update
      throw error;
    }
  }, []);

  /**
   * Delete event
   */
  const deleteEvent = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });

    // TODO: Persist to backend
    try {
      // await timelineService.deleteEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      // TODO: Rollback optimistic update
      throw error;
    }
  }, []);

  /**
   * Other actions
   */
  const selectEvent = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: id });
  }, []);

  const setVisibleTime = useCallback((start: Date, end: Date) => {
    dispatch({ type: 'SET_VISIBLE_TIME', payload: { start, end } });
  }, []);

  const setConfig = useCallback((config: Partial<TimelineConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Update derived state when events change
  React.useEffect(() => {
    const filteredEvents = state.config.filterBy 
      ? filterEvents(state.events, state.config.filterBy)
      : state.events;
    
    const sortedEvents = sortEvents(filteredEvents);
    const items = transformToTimelineItems(sortedEvents);
    const groups = transformToTimelineGroups(sortedEvents);

    // Update state with derived data
    dispatch({ type: 'SET_EVENTS', payload: state.events });
  }, [state.events, state.config.filterBy, state.config.groupBy, filterEvents, sortEvents, transformToTimelineItems, transformToTimelineGroups]);

  const contextValue: UseTimelineReturn = {
    state,
    actions: {
      loadEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      selectEvent,
      setVisibleTime,
      setConfig,
      reset
    },
    utils: {
      transformToTimelineItems,
      transformToTimelineGroups,
      filterEvents,
      sortEvents
    }
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
}

/**
 * Hook to use timeline context
 */
export function useTimeline(): UseTimelineReturn {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}

/**
 * Utility functions
 */
function getEventColor(eventType: string, importance: number): string {
  const baseColors = {
    session: '#228be6',
    quest: '#fd7e14',
    milestone: '#e64980',
    'character-event': '#7c2d12',
    'world-event': '#15803d',
    combat: '#dc2626',
    social: '#7c3aed',
    exploration: '#059669',
    custom: '#6b7280'
  };

  const baseColor = baseColors[eventType as keyof typeof baseColors] || baseColors.custom;
  
  // Adjust opacity based on importance
  const opacity = Math.max(0.3, importance / 10);
  return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

function getEventBorderColor(eventType: string): string {
  const borderColors = {
    session: '#1971c2',
    quest: '#e8590c',
    milestone: '#c2255c',
    'character-event': '#92400e',
    'world-event': '#166534',
    combat: '#b91c1c',
    social: '#6d28d9',
    exploration: '#047857',
    custom: '#4b5563'
  };

  return borderColors[eventType as keyof typeof borderColors] || borderColors.custom;
}
