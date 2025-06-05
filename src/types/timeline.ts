/**
 * Timeline Types
 *
 * This file contains TypeScript type definitions for the Dual Timeline System
 * in RPG Scribe, providing comprehensive type safety for timeline operations.
 */

import {
  TimeUnit,
  TimelineConflictType,
  TimelineValidationSeverity,
  TimelineEntryType
} from '../constants/timelineConstants';

import { TimelineEntry } from '../models/Timeline'; // Import TimelineEntry from models

/**
 * Dual timestamp interface for entities
 * Tracks both in-game time and real-world time
 */
export interface DualTimestamp {
  inGameTime?: Date | null;      // When this occurred in the game world
  realWorldTime?: Date | null;   // When this was created/occurred in real life
}

/**
 * Time gap interface for managing time between events
 */
export interface TimeGap {
  duration: number;              // Numeric duration
  unit: TimeUnit;               // Time unit (minutes, hours, days, etc.)
  description?: string;         // Optional description of what happened during this time
  isAutoCalculated?: boolean;   // Whether this gap was calculated automatically
}

/**
 * Timeline position interface for chronological ordering
 */
export interface TimelinePosition {
  sequence: number;             // Sequential order in timeline (0-based)
  inGameTimestamp?: Date;       // Calculated in-game timestamp
  realWorldTimestamp?: Date;    // Real-world timestamp
  timeGapBefore?: TimeGap;      // Time gap before this position
  timeGapAfter?: TimeGap;       // Time gap after this position
}

/**
 * Timeline conflict interface for conflict detection
 */
export interface TimelineConflict {
  id: string;                   // Unique conflict identifier
  type: TimelineConflictType;   // Type of conflict
  severity: TimelineValidationSeverity; // Severity level
  message: string;              // Human-readable conflict description
  affectedEntityIds: string[];  // IDs of entities involved in the conflict
  suggestedResolution?: string; // AI-suggested resolution
  autoResolvable?: boolean;     // Whether this can be auto-resolved
  createdAt: Date;             // When the conflict was detected
}

/**
 * Timeline validation result interface
 */
export interface TimelineValidationResult {
  isValid: boolean;            // Overall validation status
  conflicts: TimelineConflict[]; // List of detected conflicts
  warnings: string[];          // Non-critical warnings
  suggestions: string[];       // Improvement suggestions
  validatedAt: Date;          // When validation was performed
}

/**
 * Timeline entry interface for managing timeline items
 * This interface should match the TimelineEntry in models/Timeline.ts
 */

/**
 * Timeline query options interface
 */
export interface TimelineQueryOptions {
  startDate?: Date;            // Filter by start date
  endDate?: Date;              // Filter by end date
  entityTypes?: string[];      // Filter by entity types
  entityIds?: string[];        // Filter by specific entity IDs (renamed from associatedEntityIds for compatibility)
  associatedEntityIds?: string[]; // Filter by specific associated entity IDs
  entryTypes?: TimelineEntryType[]; // Filter by entry types
  includeSecret?: boolean;     // Whether to include secret entries
  sortBy?: 'inGameTime' | 'realWorldTime' | 'sequence' | 'createdAt'; // Sort order
  sortDirection?: 'asc' | 'desc'; // Sort direction
  limit?: number;              // Maximum number of results
  offset?: number;             // Pagination offset
}

/**
 * Timeline statistics interface
 */
export interface TimelineStatistics {
  totalEntries: number;        // Total number of timeline entries
  totalDuration: TimeGap;      // Total in-game time covered
  averageSessionDuration: TimeGap; // Average session duration
  longestTimeGap: TimeGap;     // Longest time gap between events
  shortestTimeGap: TimeGap;    // Shortest time gap between events
  conflictCount: number;       // Number of unresolved conflicts
  entryTypeBreakdown: Record<TimelineEntryType, number>; // Count by entry type
  entityTypeBreakdown: Record<string, number>; // Count by entity type
}

/**
 * Timeline AI suggestion interface
 */
export interface TimelineAISuggestion {
  id: string;                  // Unique suggestion identifier
  type: 'time_gap' | 'duration' | 'conflict_resolution' | 'optimization';
  confidence: number;          // Confidence score (0-1)
  suggestion: string;          // Human-readable suggestion
  reasoning: string;           // Explanation of the suggestion
  affectedEntityIds: string[]; // Entities this suggestion affects
  autoApplicable?: boolean;    // Whether this can be auto-applied
  createdAt: Date;            // When the suggestion was generated
}

/**
 * Timeline context interface for AI operations
 */
export interface TimelineContext {
  campaignId: string;          // Campaign context
  worldId: string;             // World context
  recentEntries: TimelineEntry[]; // Recent timeline entries for context
  activeCharacters: string[];  // Currently active character IDs
  currentLocation?: string;    // Current location context
  sessionInProgress?: boolean; // Whether a session is currently active
  lastSessionDate?: Date;      // Date of the last session
}

/**
 * Timeline export/import interface
 */
export interface TimelineExportData {
  version: string;             // Export format version
  campaignId: string;          // Source campaign ID
  worldId: string;             // Source world ID
  entries: TimelineEntry[];    // Timeline entries
  conflicts: TimelineConflict[]; // Unresolved conflicts
  statistics: TimelineStatistics; // Timeline statistics
  exportedAt: Date;           // When the export was created
  exportedBy: string;         // User who created the export
}

/**
 * Timeline settings interface
 */
export interface TimelineSettings {
  defaultTimeUnit: TimeUnit;   // Default time unit for new entries
  autoCalculateTimeGaps: boolean; // Whether to auto-calculate time gaps
  enableConflictDetection: boolean; // Whether to enable conflict detection
  enableAISuggestions: boolean; // Whether to enable AI suggestions
  showRealWorldTime: boolean;  // Whether to show real-world timestamps
  showInGameTime: boolean;     // Whether to show in-game timestamps
  conflictNotifications: boolean; // Whether to notify about conflicts
  suggestionNotifications: boolean; // Whether to notify about AI suggestions
}
