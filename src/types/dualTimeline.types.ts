/**
 * Dual Timeline Types
 * Type definitions for the true dual timeline system
 */

import { ReactNode } from 'react';
import { RPGTimelineEvent, TimelineEventType } from './timeline.types';
import { TimeConversionConfig, TimeGap, TimeValidationResult } from '../services/timeConversion.service';

/**
 * Dual timeline display modes
 */
export type DualTimelineDisplayMode = 
  | 'dual' // Show both timelines simultaneously
  | 'in-game' // Show only in-game timeline
  | 'real-world' // Show only real-world timeline
  | 'overlay'; // Show overlaid timelines

/**
 * Timeline synchronization options
 */
export interface TimelineSyncOptions {
  syncScrolling: boolean;
  syncZoom: boolean;
  syncSelection: boolean;
  showConnections: boolean;
}

/**
 * Dual timeline event with both time representations
 */
export interface DualTimelineEvent extends RPGTimelineEvent {
  // Real-world timestamps
  realWorldStartDate: Date;
  realWorldEndDate?: Date;
  
  // In-game timestamps (inherited from RPGTimelineEvent as startDate/endDate)
  inGameStartDate: Date;
  inGameEndDate?: Date;
  
  // Connection information
  connectedEvents?: string[]; // IDs of related events
  connectionType?: 'cause' | 'effect' | 'parallel' | 'reference';
  
  // Visual properties for dual timeline
  realWorldGroup?: string;
  inGameGroup?: string;
  connectionColor?: string;
}

/**
 * Timeline axis configuration
 */
export interface TimelineAxisConfig {
  id: string;
  label: string;
  timeSystem: 'real-world' | 'in-game';
  visible: boolean;
  height: number;
  color: string;
  groups: TimelineGroupConfig[];
}

/**
 * Timeline group configuration for dual timeline
 */
export interface TimelineGroupConfig {
  id: string;
  title: string;
  timeSystem: 'real-world' | 'in-game';
  stackItems?: boolean;
  height?: number;
  color?: string;
  rightTitle?: string;
}

/**
 * Dual timeline configuration
 */
export interface DualTimelineConfig {
  worldId?: string;
  campaignId?: string;
  entityId?: string;
  entityType?: string;
  
  // Display configuration
  displayMode: DualTimelineDisplayMode;
  syncOptions: TimelineSyncOptions;
  
  // Timeline axes
  realWorldAxis: TimelineAxisConfig;
  inGameAxis: TimelineAxisConfig;
  
  // Time conversion
  timeConversion: TimeConversionConfig;
  
  // Visual options
  showMarkers: boolean;
  showConflicts: boolean;
  enableEditing: boolean;
  height: number;
  
  // Connection visualization
  connectionStyle: 'lines' | 'curves' | 'arrows';
  connectionOpacity: number;
}

/**
 * Timeline connection between events
 */
export interface TimelineConnection {
  id: string;
  fromEventId: string;
  toEventId: string;
  fromTimeline: 'real-world' | 'in-game';
  toTimeline: 'real-world' | 'in-game';
  connectionType: 'cause' | 'effect' | 'parallel' | 'reference';
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

/**
 * Dual timeline state
 */
export interface DualTimelineState {
  // Events data
  events: DualTimelineEvent[];
  connections: TimelineConnection[];
  
  // Selection state
  selectedEvents: string[];
  selectedConnections: string[];
  
  // View state
  realWorldTimeRange: { start: Date; end: Date };
  inGameTimeRange: { start: Date; end: Date };
  zoomLevel: number;
  
  // Conflict detection
  conflicts: TimelineConflict[];
  gaps: TimeGap[];
  validationResult?: TimeValidationResult;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
}

/**
 * Timeline conflict information
 */
export interface TimelineConflict {
  id: string;
  type: 'overlap' | 'chronological' | 'narrative' | 'logical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  events: string[];
  timeline: 'real-world' | 'in-game' | 'both';
  description: string;
  suggestions: ConflictResolution[];
  autoResolvable: boolean;
  resolved: boolean;
}

/**
 * Conflict resolution suggestion
 */
export interface ConflictResolution {
  id: string;
  type: 'move' | 'split' | 'merge' | 'delete' | 'ignore';
  description: string;
  eventChanges: Array<{
    eventId: string;
    changes: Partial<DualTimelineEvent>;
  }>;
  confidence: number; // 0-1 scale
}

/**
 * Dual timeline component props
 */
export interface DualTimelineVisualizationProps {
  config?: DualTimelineConfig;

  // Filtering props
  worldId?: string;
  campaignId?: string;
  sessionId?: string;
  entityFilter?: {
    type: string;
    id: string;
  };
  timeRange?: {
    start: number;
    end: number;
  };

  // Event handlers
  onEventClick?: (eventId: string, timeline: 'real-world' | 'in-game') => void;
  onEventEdit?: (eventId: string) => void;
  onEventCreate?: (event: Partial<DualTimelineEvent>, timeline: 'real-world' | 'in-game') => void;
  onEventDelete?: (eventId: string) => void;
  onEventMove?: (eventId: string, newTime: Date, timeline: 'real-world' | 'in-game') => void;
  
  // Connection handlers
  onConnectionCreate?: (connection: Partial<TimelineConnection>) => void;
  onConnectionDelete?: (connectionId: string) => void;
  
  // Timeline handlers
  onTimeRangeChange?: (start: Date, end: Date, timeline: 'real-world' | 'in-game') => void;
  onZoomChange?: (zoomLevel: number) => void;
  onSyncToggle?: (syncType: keyof TimelineSyncOptions, enabled: boolean) => void;
  
  // Conflict handlers
  onConflictResolve?: (conflictId: string, resolution: ConflictResolution) => void;
  onConflictDismiss?: (conflictId: string) => void;

  // Data fix handlers
  onFixParticipants?: () => Promise<void>;

  // Style props
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Timeline synchronization event
 */
export interface TimelineSyncEvent {
  type: 'scroll' | 'zoom' | 'selection' | 'time-range';
  sourceTimeline: 'real-world' | 'in-game';
  data: any;
  timestamp: Date;
}

/**
 * Dual timeline actions
 */
export interface DualTimelineActions {
  // Event management
  loadEvents: () => Promise<void>;
  createEvent: (event: Partial<DualTimelineEvent>, timeline: 'real-world' | 'in-game') => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<DualTimelineEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Connection management
  createConnection: (connection: Partial<TimelineConnection>) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  
  // Selection management
  selectEvent: (eventId: string, timeline?: 'real-world' | 'in-game') => void;
  selectConnection: (connectionId: string) => void;
  clearSelection: () => void;
  
  // View management
  setTimeRange: (start: Date, end: Date, timeline: 'real-world' | 'in-game') => void;
  setZoomLevel: (level: number) => void;
  syncTimelines: (event: TimelineSyncEvent) => void;
  
  // Conflict management
  detectConflicts: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  dismissConflict: (conflictId: string) => void;
  
  // Configuration
  updateConfig: (updates: Partial<DualTimelineConfig>) => void;
  toggleSync: (syncType: keyof TimelineSyncOptions) => void;
}

/**
 * Dual timeline utilities
 */
export interface DualTimelineUtils {
  // Event transformation
  transformToRealWorldItems: (events: DualTimelineEvent[]) => any[];
  transformToInGameItems: (events: DualTimelineEvent[]) => any[];
  transformToGroups: (events: DualTimelineEvent[], timeline: 'real-world' | 'in-game') => any[];
  
  // Time conversion
  convertEventTime: (event: DualTimelineEvent, fromTimeline: 'real-world' | 'in-game', toTimeline: 'real-world' | 'in-game') => Date;
  
  // Filtering and sorting
  filterEvents: (events: DualTimelineEvent[], filters: any) => DualTimelineEvent[];
  sortEvents: (events: DualTimelineEvent[], timeline: 'real-world' | 'in-game') => DualTimelineEvent[];
  
  // Conflict detection
  detectEventOverlaps: (events: DualTimelineEvent[], timeline: 'real-world' | 'in-game') => TimelineConflict[];
  detectChronologicalIssues: (events: DualTimelineEvent[]) => TimelineConflict[];
  
  // Connection utilities
  findConnectedEvents: (eventId: string, events: DualTimelineEvent[], connections: TimelineConnection[]) => DualTimelineEvent[];
  validateConnection: (connection: TimelineConnection, events: DualTimelineEvent[]) => boolean;
}

/**
 * Dual timeline context value
 */
export interface DualTimelineContextValue {
  state: DualTimelineState;
  actions: DualTimelineActions;
  utils: DualTimelineUtils;
}

/**
 * Timeline marker for dual timeline
 */
export interface DualTimelineMarker {
  id: string;
  realWorldTime?: Date;
  inGameTime?: Date;
  label: string;
  color: string;
  timeline: 'real-world' | 'in-game' | 'both';
  type: 'today' | 'session' | 'milestone' | 'custom';
}

// All types are already exported above with their individual export statements
