import dayjs, { Dayjs } from 'dayjs';
import { EntityType } from '../models/EntityType';

/**
 * Timeline Item for React Calendar Timeline
 * Compatible with react-calendar-timeline library
 */
export interface TimelineItem {
  id: string | number;
  group: string | number;
  title: string;
  start_time: Dayjs | Date | number;
  end_time: Dayjs | Date | number;
  canMove?: boolean;
  canResize?: boolean;
  canChangeGroup?: boolean;
  className?: string;
  style?: React.CSSProperties;
  itemProps?: Record<string, any>;
}

/**
 * Timeline Group for React Calendar Timeline
 * Represents entity groupings (characters, sessions, etc.)
 */
export interface TimelineGroup {
  id: string | number;
  title: string;
  rightTitle?: string;
  stackItems?: boolean;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * RPG Timeline Event Data
 * Internal representation for RPG Scribe timeline events
 */
export interface RPGTimelineEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  importance: number; // 1-10 scale
  eventType: TimelineEventType;
  entityId?: string;
  entityType?: EntityType;
  worldId: string;
  campaignId: string;
  tags?: string[];
  participants?: string[]; // Character IDs
  location?: string;
  gmNotes?: string;
  playerVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Timeline Event Types
 */
export type TimelineEventType = 
  | 'session'
  | 'quest'
  | 'milestone'
  | 'character-event'
  | 'world-event'
  | 'combat'
  | 'social'
  | 'exploration'
  | 'custom';

/**
 * Timeline Configuration
 */
export interface TimelineConfig {
  worldId?: string;
  campaignId?: string;
  entityId?: string;
  entityType?: EntityType;
  title?: string;
  description?: string;
  height?: number;
  showControls?: boolean;
  enableEditing?: boolean;
  showMarkers?: boolean;
  groupBy?: 'entity' | 'type' | 'importance' | 'none';
  filterBy?: TimelineFilter;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Timeline Filter Options
 */
export interface TimelineFilter {
  eventTypes?: TimelineEventType[];
  importance?: {
    min: number;
    max: number;
  };
  entities?: string[];
  tags?: string[];
  playerVisible?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Timeline State Management
 */
export interface TimelineState {
  events: RPGTimelineEvent[];
  groups: TimelineGroup[];
  items: TimelineItem[];
  loading: boolean;
  error: string | null;
  selectedEvent: string | null;
  visibleTimeStart: Date;
  visibleTimeEnd: Date;
  config: TimelineConfig;
}

/**
 * Timeline Actions
 */
export type TimelineAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EVENTS'; payload: RPGTimelineEvent[] }
  | { type: 'ADD_EVENT'; payload: RPGTimelineEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<RPGTimelineEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_SELECTED_EVENT'; payload: string | null }
  | { type: 'SET_VISIBLE_TIME'; payload: { start: Date; end: Date } }
  | { type: 'SET_CONFIG'; payload: Partial<TimelineConfig> }
  | { type: 'RESET' };

/**
 * Timeline Event Form Data
 */
export interface TimelineEventFormData {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date | undefined;
  isRange: boolean;
  importance: number;
  eventType: TimelineEventType;
  entityId?: string;
  entityType?: EntityType;
  tags: string[];
  participants: string[];
  location?: string;
  gmNotes?: string;
  playerVisible: boolean;
}

/**
 * Timeline Component Props
 */
export interface TimelineComponentProps {
  config: TimelineConfig;
  onEventClick?: (eventId: string) => void;
  onEventEdit?: (eventId: string) => void;
  onEventCreate?: (event: Partial<RPGTimelineEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  onTimeRangeChange?: (start: Date, end: Date) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Timeline Hook Return Type
 */
export interface UseTimelineReturn {
  state: TimelineState;
  actions: {
    loadEvents: () => Promise<void>;
    createEvent: (event: Omit<RPGTimelineEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
    updateEvent: (id: string, updates: Partial<RPGTimelineEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    selectEvent: (id: string | null) => void;
    setVisibleTime: (start: Date, end: Date) => void;
    setConfig: (config: Partial<TimelineConfig>) => void;
    reset: () => void;
  };
  utils: {
    transformToTimelineItems: (events: RPGTimelineEvent[]) => TimelineItem[];
    transformToTimelineGroups: (events: RPGTimelineEvent[]) => TimelineGroup[];
    filterEvents: (events: RPGTimelineEvent[], filter: TimelineFilter) => RPGTimelineEvent[];
    sortEvents: (events: RPGTimelineEvent[]) => RPGTimelineEvent[];
  };
}

/**
 * Timeline Error Types
 */
export interface TimelineError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Timeline Performance Metrics
 */
export interface TimelineMetrics {
  eventCount: number;
  renderTime: number;
  memoryUsage: number;
  lastUpdate: Date;
}
