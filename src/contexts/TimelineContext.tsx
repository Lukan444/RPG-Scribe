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
      console.log('🔧 TimelineContext Reducer - SET_EVENTS:', {
        actionType: action.type,
        payloadLength: action.payload?.length || 0,
        payloadSample: action.payload?.slice(0, 2).map(e => ({ id: e.id, title: e.title })) || [],
        currentStateEventsLength: state.events.length,
        loading: state.loading
      });
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

  // Add provider instance logging to debug context mismatch
  const providerInstanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  console.log('🏭 TimelineProvider instance:', {
    providerInstanceId,
    initialConfig,
    stateEventsCount: state.events.length,
    stateLoading: state.loading,
    dispatchFunction: typeof dispatch
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
    console.log('🔄 TimelineContext.loadEvents called with config:', {
      worldId: state.config.worldId,
      campaignId: state.config.campaignId
    });

    if (!state.config.worldId || !state.config.campaignId) {
      console.error('❌ Missing required config:', { worldId: state.config.worldId, campaignId: state.config.campaignId });
      dispatch({ type: 'SET_ERROR', payload: 'World ID and Campaign ID are required' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      console.log('⏳ Loading events from Firebase...');

      // Load events directly from Firebase events collection
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('campaignId', '==', state.config.campaignId),
        orderBy('date', 'asc')
      );

      console.log('🔍 Executing Firebase query for campaignId:', state.config.campaignId);
      const querySnapshot = await getDocs(q);
      console.log('📊 Firebase query returned', querySnapshot.size, 'documents');

      // Convert Firestore events to RPG timeline events
      const events: RPGTimelineEvent[] = [];
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        console.log('📄 Processing event document:', doc.id, eventData);

        // Convert Firestore timestamp to Date
        let startDate = new Date();
        if (eventData.date && typeof eventData.date.toDate === 'function') {
          startDate = eventData.date.toDate();
        } else if (eventData.date) {
          startDate = new Date(eventData.date);
        }

        const event: RPGTimelineEvent = {
          id: doc.id,
          title: eventData.name || eventData.title || 'Untitled Event',
          description: eventData.description || '',
          startDate,
          endDate: eventData.endDate ? (typeof eventData.endDate.toDate === 'function' ? eventData.endDate.toDate() : new Date(eventData.endDate)) : undefined,
          importance: eventData.importance || 5,
          eventType: (eventData.eventType || eventData.type || 'custom').toLowerCase(),
          worldId: state.config.worldId || '',
          campaignId: state.config.campaignId || '',
          entityId: eventData.entityId,
          entityType: eventData.entityType,
          tags: eventData.tags || [],
          participants: Array.isArray(eventData.participants) ? eventData.participants :
                       (typeof eventData.participants === 'string' ? JSON.parse(eventData.participants) :
                       eventData.participantIds || []),
          location: eventData.location,
          gmNotes: eventData.gmNotes,
          playerVisible: eventData.playerVisible !== false, // Default to true
          createdAt: eventData.createdAt ? (typeof eventData.createdAt.toDate === 'function' ? eventData.createdAt.toDate() : new Date(eventData.createdAt)) : new Date(),
          updatedAt: eventData.updatedAt ? (typeof eventData.updatedAt.toDate === 'function' ? eventData.updatedAt.toDate() : new Date(eventData.updatedAt)) : new Date(),
          createdBy: eventData.createdBy || 'unknown'
        };

        events.push(event);
      });

      console.log(`📅 Loaded ${events.length} timeline events for campaign ${state.config.campaignId}`);
      console.log('🚀 About to dispatch SET_EVENTS with events:', {
        eventsLength: events.length,
        eventsPreview: events.slice(0, 2).map(e => ({ id: e.id, title: e.title })),
        dispatchFunction: typeof dispatch
      });
      dispatch({ type: 'SET_EVENTS', payload: events });
      console.log('✅ SET_EVENTS dispatch completed');
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error loading timeline events:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load timeline events' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.config.worldId, state.config.campaignId]);

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

  // REMOVED: Problematic useEffect that was causing infinite loops
  // The derived state (filtered/sorted events) should be computed in useMemo, not useEffect
  // This was causing SET_EVENTS to trigger another SET_EVENTS, creating an infinite loop

  // Compute derived state using useMemo to prevent infinite loops
  const derivedState = useMemo(() => {
    console.log('🔄 TimelineContext computing derived state:', {
      eventsCount: state.events.length,
      filterBy: state.config.filterBy,
      groupBy: state.config.groupBy
    });

    const filteredEvents = state.config.filterBy
      ? filterEvents(state.events, state.config.filterBy)
      : state.events;

    const sortedEvents = sortEvents(filteredEvents);
    const items = transformToTimelineItems(sortedEvents);
    const groups = transformToTimelineGroups(sortedEvents);

    return {
      ...state,
      events: sortedEvents,
      items,
      groups
    };
  }, [state.events, state.config.filterBy, state.config.groupBy, state.loading, state.error, state.selectedEvent, state.visibleTimeStart, state.visibleTimeEnd, state.config, filterEvents, sortEvents, transformToTimelineItems, transformToTimelineGroups]);

  const contextValue: UseTimelineReturn = {
    state: derivedState,
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
